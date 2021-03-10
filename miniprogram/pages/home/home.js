// pages/home/home.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
Page({
  data: {
    activeNames: ['1'],//默认展开第一个，即我的发布
    inProgressCount: 0 //未读我的消息数
  },
  pageData: {
    userOpenId: ''
  },
  onLoad: function (options) {

    this.getOpenId().then(() => {
      this.getUserInfo(); //获取用户信息
      this.getDiaryCount(); //获取日记总数
      this.getInprogressMsg(); //获取消息总数
      this.getOrderCount(); //获取预约数
      this.getRentCount(); //获取租赁数
    });


  },
  onPullDownRefresh(){
    wx.showLoading({
      title: '正在刷新',
    })
    this.getOpenId().then(() => {
      let userInfoPros=this.getUserInfo(); //获取用户信息
      let diaryInfoPros= this.getDiaryCount(); //获取日记总数
      let inProgressMsgInfoPros=this.getInprogressMsg(); //获取消息总数
      let orderInfoPros=this.getOrderCount(); //获取预约数
      let rentInfoPros= this.getRentCount(); //获取租赁数
      Promise.all([userInfoPros,diaryInfoPros,inProgressMsgInfoPros,orderInfoPros,rentInfoPros]).then(()=>{
        wx.stopPullDownRefresh({
          success: (res) => {
            console.log("刷新成功");
          }
        })
      })
    });
  },
  //获取未读消息数
  async getInprogressMsg() {
    let openid = wx.getStorageSync('userOpenId');
    if (!openid) {
      let openidRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openidRes.result;
    }
    let msgResMain = await db.collection("message").where({
      toUser: openid,
      status: 'progress'
    }).count();

    this.setData({
      inProgressCount: msgResMain.total
    })
  },
  async getOpenId() {
    let resopenid = await wx.cloud.callFunction({
      name: 'getUserOpenId'
    });

    this.pageData.userOpenId = resopenid.result;
    return resopenid.result;
  },
  //获取用户信息
  async getUserInfo() {

    let userres = await db.collection('angler').where({
      _openid: this.pageData.userOpenId
    }).get();

    this.setData({
      userInfo: userres.data[0]
    });
    return userres.data[0];
  },
  //获取预约消息数
  async getOrderCount() {
    let openid = this.pageData.userOpenId;
    let countRes = await db.collection("message").where({
      toUser: openid,
      type: 'locOrder',
      status:'progress'
    }).count();
    this.setData({
      orderCount: countRes.total
    })
  },
  //获取租赁消息数
  async getRentCount() {
    let openid = this.pageData.userOpenId;
    let countRes = await db.collection("message").where({
      toUser: openid,
      type: 'equipOrder',
      status:'progress'
    }).count();
    this.setData({
      rentEquipCount: countRes.total
    })
  },
  // 获取日记数
  async getDiaryCount() {
    let diaryRes = await db.collection("diary").where({
      _openid: this.pageData.userOpenId
    }).get();
    this.setData({
      diaryCount: diaryRes.data.length
    });
    return diaryRes.data;
  },
  onShow() {
    this.getTabBar().init();
  },
  //我的发布和我的收藏的展开和关闭
  onChange(e) {
    console.log(e);
    this.setData({
      activeNames: e.detail
    });
  },
  //钓点预约
  toMyOrderPage() {
    let _this = this;
    wx.navigateTo({
      url: 'myOrder/myOrder',
      success: (res) => {
        res.eventChannel.emit("orderPageFn", _this);
      }
    })
  },
  // 装备租赁
  toMyRentPage() {
    let _this = this;
    wx.navigateTo({
      url: 'myRent/myRent',
      success: (res) => {
        res.eventChannel.emit("orderPageFn", _this);
      }
    })
  },
  //去我的发布详情
  toSendDetail(e) {
    // console.log(e.target.dataset.sendType);
    wx.navigateTo({
      url: 'sendDetail/sendDetail?sendType=' + e.target.dataset.sendType,
    });
  },
  //我的收藏详情
  toCollectDetail(e) {
    wx.navigateTo({
      url: 'collectDetail/collectDetail?sendType=' + e.target.dataset.sendType,
    });
  },
  //我的消息详情
  toMessageDetail() {
    let that = this;
    wx.navigateTo({
      url: 'messageDetail/messageDetail',
      events: {

      },
      success(res) {
        res.eventChannel.emit("getHomePageThis", {
          homePageThis: that
        })
      }
    })
  }
})