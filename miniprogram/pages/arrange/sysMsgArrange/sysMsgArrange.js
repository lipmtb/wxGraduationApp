// miniprogram/pages/arrange/sysMsgArrange/sysMsgArrange.js
const db = wx.cloud.database();
Page({
  pageData: {
    curInputMsg: ""
  },
  data: {

  },

  onLoad: function (options) {

  },
  onInputMsg(e) {
    // console.log(e);
    this.pageData.curInputMsg = e.detail.value;
  },
  //发布系统消息
  onSendMsg() {
    if (this.pageData.curInputMsg.length < 3) {
      wx.showToast({
        title: '不能少于3个字'
      })
      return;
    }
    wx.showLoading({
      title: '正在发送系统消息',
    })
    wx.cloud.callFunction({
      name: "createSysAnnounce",
      data: {
        content: this.pageData.curInputMsg
      }
    }).then((res) => {
      wx.hideLoading({
        success: (res) => {},
      })
      console.log("公告发布成功", res.result);
    })
  }
})