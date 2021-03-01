// 收藏分类详细
const db = wx.cloud.database();
const _ = db.command;
const $ = _.aggregate;
import customFormatTime from '../../../util/customTime'
Page({

  data: {
    active: 0,
    talkLists: [],
    questionLists: [],
    tipLists: [],
    locLists: [],
    hasMoreArr: [true, true, true, true]
  },
  pageData: {
    myopenid: '',
    userInfo: {},
    curSendType: 'talk',
    curTabIdx: 0, //当前所在的Tab
    curTalkCount: 0, //加载的钓友圈帖子数
    curQuestionCount: 0, //加载的问答圈帖子数
    curTipCount: 0,
    curLocCount: 0
  },
  onLoad: function (options) {
    let that = this;
    //获取当前用户的openid
    let openidRes = wx.cloud.callFunction({
      name: 'getUserOpenId'
    }).then((res) => {
      that.pageData.myopenid = res.result;
      //获取用户信息
      db.collection("angler").where({
        _openid: res.result
      }).get().then((anglerRes) => {
        that.pageData.userInfo = anglerRes.data[0];
        //判断初始选择的项目类型是钓友圈，问答圈还是技巧
        that.pageData.curSendType = options.sendType;
        let activeNum = options.sendType === 'question' ? 1 : options.sendType === 'tip' ? 2 : 0;
        if (options.sendType === "anglerLoc") {
          avtiveNum = 3;
        }
        that.pageData.curTabIdx = activeNum;
        that.setData({
          active: activeNum
        });
        that.getTypeData(activeNum);
      })
    });
  },
  onChange(e) {
    // console.log(e.detail.index);
    let changeIdx = e.detail.index;
    this.pageData.curTabIdx = changeIdx;
    if (changeIdx === 0 && this.pageData.curTalkCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }
    if (changeIdx === 1 && this.pageData.curQuestionCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }
    if (changeIdx === 2 && this.pageData.curTipCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }
    if (changeIdx === 3 && this.pageData.curLocCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }

  },
  //加载某个类型的数据
  getTypeData(typenum) {
    let that = this;
    wx.showLoading({
      title: '加载中。。。'
    });
    switch (typenum) {
      case 0: {
        that.getMyTalk().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[0]': false
            })
            return;
          }
          that.data.talkLists.push(...res);
          that.pageData.curTalkCount += res.length;
          console.log("加载钓友圈", res);
          that.setData({
            talkLists: that.data.talkLists
          })
        })
        break;
      }
      case 1: {
        that.getQuestionLists().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[1]': false
            });
            return;
          }
          that.data.questionLists.push(...res);
          that.pageData.curQuestionCount += res.length;
          console.log("加载问答圈", res);
          that.setData({
            questionLists: that.data.questionLists
          })
        });
        break;
      }
      case 2: {
        that.getTipLists().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[2]': false
            });
            return;
          }
          that.data.tipLists.push(...res);
          that.pageData.curTipCount += res.length;
          console.log("加载技巧", res);
          that.setData({
            tipLists: that.data.tipLists
          })
        });
        break;
      }

      case 3: {
        that.getLocLists().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[3]': false
            });
            return;
          }
          that.data.locLists.push(...res);
          that.pageData.curLocCount += res.length;
          console.log("加载钓点", res);
          that.setData({
            locLists: that.data.locLists
          })
        });
        break;
      }
    }
  },
  //加载钓友圈
  async getMyTalk() {
    let gettalk = await db.collection("collectTalk").where({
      _openid: this.pageData.myopenid
    }).get();
    let collectIdArr = [];
    for (let citem of gettalk.data) {
      collectIdArr.push(citem.collectTalkId);
    }
    // .skip(this.pageData.curTalkCount).limit(6).get();
    let talkLists = await db.collection("talk").where({
      _id: _.in(collectIdArr)
    }).skip(this.pageData.curTalkCount).limit(6).get();;

    return talkLists.data;
  },
  //加载问答圈
  async getQuestionLists() {
    let getques = await db.collection("collectQuestion").where({
      _openid: this.pageData.myopenid
    }).get();
    // skip(this.pageData.curQuestionCount).limit(6).get();
    // itemdata.publishTime = customFormatTime(itemdata.publishTime);
    let collectIdArr = [];
    for (let itemdata of getques.data) {
      collectIdArr.push(itemdata.collectQuestionId);
    }

    let qlists = await db.collection("question").where({
      _id: _.in(collectIdArr)
    }).skip(this.pageData.curQuestionCount).limit(6).get();

    for (let q of qlists.data) {
      let userRes = await db.collection("angler").where({
        _openid: q._openid
      }).get();
      q.userInfo = userRes.data[0];
      q.publishTime = customFormatTime(q.publishTime);
    }
    // let queslists=await db.collection("question").aggregate().match({
    //   _id:_.in(collectIdArr)
    // }).lookup({
    //   from:'angler',
    //   localField:'_openid',
    //   foreignField:'_openid',
    //   as:"userInfoArr"
    // }).project({
    //   _id:1,
    //   _openid:1,
    //   content:1,
    //   images:1,
    //   publishTime:1,
    //   userInfo:$.arrayElemAt(['$userInfoArr',0])
    // }).skip(this.pageData.curQuestionCount).limit(6).end();
    return qlists.data;
  },
  //加载技巧
  async getTipLists() {
    let getCollectRes = await db.collection("collectTip").where({
      _openid: this.pageData.myopenid
    }).get();
    let collectArr = getCollectRes.data.map((item) => item.collectTipId);
    let getTipRes = await db.collection("tipEssays").where({
      _id: _.in(collectArr)
    }).skip(this.pageData.curTipCount).limit(6).get();

    for (let tipitem of getTipRes.data) {
      let userInfoRes = await db.collection("angler").where({
        _openid: this.pageData.myopenid
      }).get();
      let getClassify = await db.collection("tipClassify").where({
        _id: tipitem.classifyId
      }).get();
      let likeRes = await db.collection("likeTip").where({
        likeTipId: tipitem._id
      }).get();

      let commentRes = await db.collection("tipComment").where({
        commentTipId: tipitem._id
      }).get();
      tipitem.userInfo = userInfoRes.data[0];
      tipitem.likedCount = likeRes.data.length;
      tipitem.commentedCount = commentRes.data.length;
      tipitem.topicName = getClassify.data[0].classifyName;
    }
    return getTipRes.data;
  },
  //获取我收藏的钓点
  async getLocLists(){
    let openid=wx.getStorageSync('userOpenId')|| this.pageData.myopenid;
    if(!openid){
      let openRes=await wx.cloud.callFunction({
        name:"getUserOpenId"
      });
      openid=openRes.result;
    }
    let collectLocRes=await db.collection("collectLoc").where({
      _openid:openid
    }).skip(this.pageData.curLocCount).limit(6).get();

    let locIdArr=[];
    for(let cItem of collectLocRes.data){
      locIdArr.push(cItem.collectLocId);
    }

    let locRes=await db.collection("anglerLoc").where({
      _id:_.in(locIdArr)
    }).get();
    return locRes.data;
  },
  onReachBottom() {
    if (this.data.hasMoreArr[this.pageData.curTabIdx]) {

      this.getTypeData(this.pageData.curTabIdx);
    }
  },
  onPullDownRefresh() {
    this.pageData.curTalkCount = 0;
    this.pageData.curQuestionCount = 0;
    this.pageData.curTipCount = 0;
    this.pageData.curLocCount = 0;
    this.setData({
      talkLists: [],
      questionLists: [],
      tipLists: [],
      locLists: [],
      hasMoreArr: [true, true, true, true]
    })

    this.getTypeData(this.pageData.curTabIdx);
  },
  //去收藏的钓点详情页
  toLocDetail(e) {
    let locid = e.currentTarget.dataset.locId;
    wx.navigateTo({
      url: '/pages/service/locDetail/locDetail?locId=' + locid
    })
  }
})