// pages/tip/tip.js
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});
const _ = db.command;
const $ = _.aggregate;

Page({
  data: {
    classifyNameLists: ['钓具介绍', '饵料分析', '打窝技巧', '水域位置分析', '冬钓', '夜钓'],
    essenceLists: [],
    hasMoreEssays: true
  },
  pageData: {
    curSpecialCount: 0, //获取的两个主题的帖子数
    curTopicSkip: 0 //获取精选跳过的主题数
  },
  onLoad: function (options) {
    let that = this;
    wx.setNavigationBarTitle({
      title: '技巧',
    })
    this.getTopicLists(); //获取6个阅读量前6的分类主题
    this.getSpecialTipEssays(0).then((lists) => {
      if (lists.length < 1) {
        db.collection("tipEssays").aggregate().sample({
          size: 1
        }).end().then((resdata) => {
          that.data.essenceLists.push(...resdata.list);
          that.setData({
            essenceLists: that.data.essenceLists
          });
        });
      }
    }); //获取精选
  },
  toMoreClassifyPage() {
    wx.navigateTo({
      url: 'moreClassify/moreClassify',
    })
  },
  //获取6个阅读量前6的分类主题
  async getTopicLists() {
    let resTopicCall = await wx.cloud.callFunction({
      name: 'getHotTipClassify'
    });
    let resTopic = resTopicCall.result;

    this.setData({
      classifyNameLists: resTopic.list
    });
    return resTopic.list;

  },
  //获取精选：阅读量最高的两个开始，每个主题一次最多取两个帖子（点赞和收藏，评论总数排序），取完开始取接下来的两个话题，直到获得前6个主题的所有帖子
  async getSpecialTipEssays(skipTopicNum) {

    let that = this;
    let essenceRes = await wx.cloud.callFunction({
      name: 'getSpecialTips',
      data: {
        skipNum: Math.round(that.pageData.curSpecialCount / 2), //每个主题的跳过帖子数
        skipTopicNum: skipTopicNum || 0 //跳过的主题数
      }
    });
    console.log("加载精华", essenceRes.result);
    that.pageData.curSpecialCount = that.pageData.curSpecialCount + essenceRes.result.length;

    that.data.essenceLists.push(...essenceRes.result);
    //去除重复的帖子,并增加类型名
    let obj = {};
    for (let li of that.data.essenceLists) {
      obj[li._id] = li;
      let typeRes = await db.collection("tipClassify").doc(li.classifyId).get();
      li.typeName = typeRes.data.classifyName;
    }
    console.log(obj);
    that.setData({
      essenceLists: Object.values(obj)
    });
    return essenceRes.result;

  },
  onShow() {
    this.getTabBar().init();
  },
  // 下拉刷新
  onPullDownRefresh() {
    let that=this;
    this.pageData.curSpecialCount = 0;
    this.pageData.curTopicSkip = 0;
    this.data.essenceLists = [];
    this.setData({
      hasMoreEssays: true
    })
    let prs1 = this.getTopicLists();
    let prs2 = this.getSpecialTipEssays(0).then((lists) => {
      if (lists.length < 1) {
        db.collection("tipEssays").aggregate().sample({
          size: 1
        }).end().then((resdata) => {
          that.data.essenceLists.push(...resdata.list);
          that.setData({
            essenceLists: that.data.essenceLists
          });
        });
      }
    });
    Promise.all([prs1, prs2]).then(() => {
      wx.stopPullDownRefresh({
        success: (res) => {
          wx.showToast({
            title: '刷新成功'
          })
        },
      })
    })
  },
  //获取完前6个主题的帖子
  onReachBottom() {
    let that = this;

    if (that.data.hasMoreEssays) {
      wx.showLoading({
        title: '加载中。。。',
      });
      this.getSpecialTipEssays(that.pageData.curTopicSkip).then((lists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载更多", lists);
          },
        });
        if (lists.length === 0 && that.pageData.curTopicSkip === 4) {
          that.setData({
            hasMoreEssays: false
          })
          return;
        }
        if (lists.length === 0) {
          that.pageData.curTopicSkip += 2;
          that.pageData.curSpecialCount = 0;
        }


      })
    }

  }


})