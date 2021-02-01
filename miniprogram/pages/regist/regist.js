// pages/regist/regist.js
const app = getApp();
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});

import Dialog from 'vant-weapp/dialog/dialog';
import MyNotify from '../../util/mynotify/mynotify';

Page({
  pageData: {
    userInputNickName: ''
  },
  data: {
    notRegist: false
  },
  onLoad() {
    let that = this;
    //初始化通知（后面注册成败与否可以调用）
    this.notify = new MyNotify({
      pageThis: this
    });
    this.notify.notifyInit();


    //调用login云函数判断当前用户是否注册过
    wx.cloud.callFunction({
      name: 'login'
    }).then((res) => {
      console.log(res);
      this.setData({
        notRegist: res.result.length === 0 ? true : false
      });

      if (res.result.length >0) {
        //用户的登录状态
        wx.getSetting({ //判断用户是否授权过
          withSubscriptions: true
        }).then((res) => {
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              lang: 'zh_CN',
            }).then((res) => {
              console.log("获取用户信息成功", res);
              let userObj = res.userInfo;
              app.globalData.userObj = userObj;
              wx.setStorageSync("userInfo", userObj);
              //授权过的用户直接登录
              wx.switchTab({
                url: '/pages/talk/talk',
              });

            }).catch((err) => {
              console.error("获取用户信息失败", err);
            })
          }
        });
      }
    });


  },
  //注册过的授权信息过期的需要点击登录按钮授权登录
  onUserLogin(e) {
    console.log(e);
    //用户的登录状态
    wx.getSetting({ //判断用户是否授权过
      withSubscriptions: true
    }).then((res) => {
      if (res.authSetting['scope.userInfo']) {
        wx.getUserInfo({
          lang: 'zh_CN',
        }).then((res) => {
          console.log("获取用户信息成功", res);
          let userObj = res.userInfo;
          app.globalData.userObj = userObj;
          wx.setStorageSync("userInfo", userObj);
          //授权过的用户直接登录
          wx.switchTab({
            url: '/pages/talk/talk',
          });

        }).catch((err) => {
          console.error("获取用户信息失败", err);
        })
      }
    })
  },
  onUserInputNickname(e) {
    this.pageData.userInputNickName = e.detail;
  },
  //展示注册提示！
  showMessage() {
    Dialog.alert({
      title: '注册的昵称将在你发布内容，评论等场合展示和使用,不填默认使用你的微信昵称',
      message: '',
    }).then(() => {
      // on close
    });
  },
  //用户点击注册按钮，先登录获取用户信息，再将信息写入数据库
  onUserRegist(e) {
    let that = this;
    console.log(e);
    wx.getSetting({
      withSubscriptions: true
    }).then((res) => {
      console.log(res);
      if (res.authSetting['scope.userInfo']) {
        let userObj = e.detail.userInfo;
        app.globalData.userObj = userObj;
        wx.setStorageSync('userInfo', userObj);


        let tmpNickName = that.pageData.userInputNickName || userObj.nickName;
        let nickName = userObj.nickName;
        let avatarImgUrl = userObj.avatarUrl;
        let gender = userObj.gender === 1 ? '男' : '女';
        //注册用户
        db.collection("angler").add({
          data: {
            tempNickName: tmpNickName,
            nickname: nickName,
            avatarUrl: avatarImgUrl,
            gender: gender,
            registTime: new Date()
          }
        }).then((res) => {
          console.log(res);
          that.notify.showNotify(function () {
            wx.switchTab({
              url: '/pages/talk/talk',
            });
          });

        })


      }
    });

  }


})