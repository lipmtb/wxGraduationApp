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
      this.getUserInfo();
      this.getDiaryCount();
      this.getInprogressMsg();
    });


  },
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
  // 获取日记
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
  toSendDetail(e) {
    // console.log(e.target.dataset.sendType);
    wx.navigateTo({
      url: 'sendDetail/sendDetail?sendType=' + e.target.dataset.sendType,
    });
  },
  toCollectDetail(e) {
    wx.navigateTo({
      url: 'collectDetail/collectDetail?sendType=' + e.target.dataset.sendType,
    });
  },
  toMessageDetail(){
    let that=this;
    wx.navigateTo({
      url: 'messageDetail/messageDetail',
      events:{
      
      },
      success(res){
        res.eventChannel.emit("getHomePageThis",{homePageThis:that})
      }
    })
  }
})