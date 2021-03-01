// pages/home/home.js
const app = getApp();
const db = wx.cloud.database();
Page({
  data: {
    activeNames: ['1'],
    inProgressCount: 0 //未读消息数
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
      this.getRentCount();//获取租赁数
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
    // console.log(msgRes.total);


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
  //获取我的预约数
  async getOrderCount() {
    let openid = this.pageData.userOpenId;
    let countRes = await db.collection("orderLoc").where({
      _openid: openid
    }).count();
    this.setData({
      orderCount: countRes.total
    })
  },
  //获取租赁订单数
  async getRentCount() {
    let openid = this.pageData.userOpenId;
    let countRes = await db.collection("rentEquip").where({
      _openid: openid
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
  onChange(e) {
    console.log(e);
    this.setData({
      activeNames: e.detail
    });
  },
  //去预约列表页
  toMyOrderPage() {
    let _this = this;
    wx.navigateTo({
      url: 'myOrder/myOrder',
      success: (res) => {
        res.eventChannel.emit("orderPageFn", _this);
      }
    })
  },
  toMyRentPage() {
    let _this = this;
    wx.navigateTo({
      url: 'myRent/myRent',
      success: (res) => {
        res.eventChannel.emit("orderPageFn", _this);
      }
    })
  },
  //去发布详情
  toSendDetail(e) {
    // console.log(e.target.dataset.sendType);
    wx.navigateTo({
      url: 'sendDetail/sendDetail?sendType=' + e.target.dataset.sendType,
    });
  },
  //收藏详情
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