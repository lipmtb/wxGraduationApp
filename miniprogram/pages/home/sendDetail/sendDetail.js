// miniprogram/pages/home/sendDetail/sendDetail.js
const db = wx.cloud.database();
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
        if (options.sendType === 'anglerLoc') {
          activeNum = 3;
        }
        that.pageData.curTabIdx = activeNum;
        that.setData({
          active: activeNum
        });
        that.getTypeData(activeNum);
      })
    });
  },
  //切换选项
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
      title: '加载中'
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
          console.log("加载发布的钓点", res);
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
    let gettalk = await db.collection("talk").where({
      _openid: this.pageData.myopenid
    }).skip(this.pageData.curTalkCount).limit(6).get();

    return gettalk.data;
  },
  //加载问答圈
  async getQuestionLists() {
    let getques = await db.collection("question").where({
      _openid: this.pageData.myopenid
    }).skip(this.pageData.curQuestionCount).limit(6).get();
    let userInfoRes = await db.collection("angler").where({
      _openid: this.pageData.myopenid
    }).get();
    for (let itemdata of getques.data) {
      itemdata.publishTime = customFormatTime(itemdata.publishTime);
      itemdata.userInfo = userInfoRes.data[0];
    }
    return getques.data;
  },
  //加载技巧
  async getTipLists() {
    let getTipRes = await db.collection("tipEssays").where({
      _openid: this.pageData.myopenid
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
  //获取我发布的钓点
  async getLocLists() {
    let openid = this.pageData.myopenid || wx.getStorageSync('userOpenId');
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let locRes = await db.collection("anglerLoc").where({
      _openid: openid
    }).skip(this.pageData.curLocCount).limit(6).get();

    return locRes.data;
  },
  //删除发布的问答圈
  deleteQuestion(e) {
    // console.log(e.currentTarget.dataset.delId);
    let delId = e.currentTarget.dataset.delId;
    let delIdx = e.currentTarget.dataset.delIndex;
    db.collection("question").doc(delId).remove().then((res) => {
      wx.showToast({
        title: '删除成功',
      });
      this.pageData.curQuestionCount = this.pageData.curQuestionCount - 1;
      this.data.questionLists.splice(delIdx, 1);
      this.setData({
        questionLists: this.data.questionLists
      })

    })
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
  //去发布的钓点详情页
  toLocDetail(e){
    let locid=e.currentTarget.dataset.locId;
    wx.navigateTo({
      url:'/pages/service/locDetail/locDetail?locId='+locid
    })
  }
})