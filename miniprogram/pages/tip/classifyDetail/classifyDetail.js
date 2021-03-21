// miniprogram/pages/tip/classifyDetail/classifyDetail.js
const db = wx.cloud.database();
const _ = db.command;
const $ = _.aggregate;
Page({

  data: {
    curTopicLists: [], //当前分类的帖子
    hasMoreEssays: true
  },
  pageData: {
    curClassifyId: '',
    curTopicListsCount: 0 //当前分类的帖子数
  },

  onLoad: function (options) {
    this.pageData.curClassifyId = options.classifyId;
    this.readTopic(); //当前主题的阅读量增加
    this.getTopicInfo(); //获取分类主题的信息
    this.getTopicLists(); //获取当前分类的帖子
    this.getRelevantTopicLists(); //获取当前主题的相关主题
  },
  // 进入此主题时增加此话题的阅读量
  async readTopic() {
    let that=this;
    return await wx.cloud.callFunction({
      name: "readTipClassify",
      data: {
        classifyId: that.pageData.curClassifyId
      }
    });
    // return await db.collection("readTopic").add({
    //   data: {
    //     classifyId: this.pageData.curClassifyId
    //   }
    // }).then((res) => {
    //   console.log("阅读", this.pageData.curClassifyId);
    // })
  },
  //获取分类主题的信息
  async getTopicInfo() {

    let that = this;
    let res = await db.collection('tipClassify').doc(that.pageData.curClassifyId).get();
    console.log("获取分类主题success", res);
    that.setData({
      classifyId: that.pageData.curClassifyId,
      classifyName: res.data.classifyName
    });

    wx.setNavigationBarTitle({
      title: res.data.classifyName
    })

  },
  //获取当前分类的帖子
  async getTopicLists() {
    let that = this;

    return await wx.cloud.callFunction({
      name: 'getTipEssaysByClassify',
      data: {
        classifyId: that.pageData.curClassifyId,
        skipNum: that.pageData.curTopicListsCount
      }
    }).then((reslist) => {
      let lists = reslist.result.list;
      console.log("获取" + that.data.classifyName + "成功", lists);
      that.pageData.curTopicListsCount += lists.length;
      that.data.curTopicLists.push(...lists);
      that.setData({
        curTopicLists: that.data.curTopicLists
      });
      return lists.length;
    })
  },
  onPullDownRefresh() {

    wx.showLoading({
      title: '加载中。。。',
    });
    this.pageData.curTopicListsCount = 0; //重置加载的帖子数
    this.data.curTopicLists = [];
    this.setData({
      hasMoreEssays: true
    })
    this.getTopicLists().then(() => { //重新获取帖子
      wx.stopPullDownRefresh({
        success: (res) => {
          wx.hideLoading({
            success: (res) => {
              wx.showToast({
                title: '加载成功'
              })
            },
          })

        },
      });
    });
  },
  onReachBottom() {
    let th = this;

    if (th.data.hasMoreEssays) {
      wx.showLoading({
        title: '加载中。。',
      })
      this.getTopicLists().then((len) => {
        wx.hideLoading({
          success: (res) => {},
        });
        if (len === 0) {
          th.setData({
            hasMoreEssays: false
          })
        }

      })
    }

  },
  //获取当前话题相关的主题
  async getRelevantTopicLists() {
    let that = this;
    let relevantRes = await db.collection("topicRelevant").where(_.or(
      [{
          fromTopicId: that.pageData.curClassifyId
        },
        {
          toTopicId: that.pageData.curClassifyId
        }
      ]
    )).orderBy("relatedCount", "desc").limit(3).get();
    console.log("topicRelevant:", relevantRes);

    let relevantArr = []; //相关主题的tipClassify的_id数组
    let reslists = relevantRes.data;
    for (let item of reslists) {
      item.fromTopicId === that.pageData.curClassifyId ? relevantArr.push(item.toTopicId) : relevantArr.push(item.fromTopicId);
    }
    //如果相关的话题少于3个，再获取2个阅读量前2的话题
    if (relevantArr.length < 3) {
      //获取阅读量最高的2个话题加入到relevantArr数组
      let hotRes = await db.collection("readTopic").aggregate()
        .group({
          _id: '$classifyId',
          readCount: $.sum(1)
        }).sort({
          readCount: -1
        }).limit(2).end();
      console.log("hotRes", hotRes.list);
      for (let hotitem of hotRes.list) {
        if (hotitem._id != that.pageData.curClassifyId) {
          relevantArr.push(hotitem._id);
        }
      }
      //随机取两个主题分类
      let resRandomRes = await db.collection("tipClassify").aggregate().match({
        _id: _.nor([_.in(relevantArr), _.eq(that.pageData.curClassifyId)])
      }).sample({
        size: 2
      }).end();
      relevantArr.push(...resRandomRes.list.map((item) => item._id));
      console.log("获取相关的随机的主题", resRandomRes.list);

      relevantArr = [...new Set(relevantArr)]; //避免重复的话题
      let classifyNameRes = await db.collection("tipClassify").where({
        _id: _.in(relevantArr)
      }).get();
      console.log("全部主题", classifyNameRes);
      that.setData({
        relevantTopicLists: classifyNameRes.data
      })
    }
  },
  //发展主题之间的关系
  async developRelevantion(toRelevantId) {
    let that = this;
    let queryRes = await db.collection("topicRelevant").where(_.or([{
        fromTopicId: that.pageData.curClassifyId,
        toTopicId: toRelevantId
      },
      {
        fromTopicId: toRelevantId,
        toTopicId: that.pageData.curClassifyId
      }
    ])).get();
    //如果关系已经存在则更新好感度+1
    if (queryRes.data.length > 0) {
      let updateRes = await wx.cloud.callFunction({
        name: 'developTopicRelation',
        data: {
          relatedId: queryRes.data[0]._id
        }
      });
      console.log("更新成功", updateRes.result);
      return updateRes.result;
    }

    let insertRes = await wx.cloud.callFunction({
      name: "insertTopicRelevant",
      data: {
        fromId: that.pageData.curClassifyId,
        toId: toRelevantId
      }
    });
    console.log("开始新的关系", insertRes.result);
    return insertRes;
  },
  async toRelevant(e) {
    // console.log(e);
    let relevId = e.currentTarget.dataset.relevantId;
    await this.developRelevantion(relevId); //发展主题的关系

    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
    wx.showLoading({
      title: '加载中。。。',
    })
    this.pageData.curTopicListsCount = 0; //重置加载的帖子数
    this.data.curTopicLists = [];
    this.setData({
      hasMoreEssays: true
    })
    this.pageData.curClassifyId = relevId;
    await this.getTopicInfo(); //获取分类主题的信息
    await this.readTopic(); //当前主题的阅读量增加
    await this.getTopicLists(); //获取当前分类的帖子
    await this.getRelevantTopicLists(); //获取当前主题的相关主题

    wx.hideLoading({
      success: (res) => {
        wx.showToast({
          title: '加载完成',
        })
      },
    })
  }
})