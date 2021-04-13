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
    notRegist: false,
    canTapLogin:true
  },
  onLoad() {
    let that = this;
    //初始化通知（后面注册成败与否可以调用）
    this.notify = new MyNotify({
      pageThis: that
    });
    this.notify.notifyInit();
    //调用login云函数判断当前用户是否注册过
    wx.cloud.callFunction({
      name: 'login'
    }).then((res) => {
      console.log(res);
      if (res.result.length > 0) {
        //判断用户是否是管理员
        let user = res.result[0];
        let isAd = true; //是管理员
        for (let i of user.right) {
          if (i === 0) {
            isAd = false;
          }
        }
        that.setData({
          hasAdRight: isAd
        })
      }
      this.setData({
        notRegist: res.result.length === 0 ? true : false,
        canTapLogin:false
      });

    });

  },
    //用户登录
  onUserLogin(e) {
    wx.getUserProfile({
      desc: '获取的你的身份信息',
      success: (res) => {
        console.log("获取用户信息成功:", res);

        let userObj = res.userInfo;
        app.globalData.userObj = userObj;
        wx.setStorageSync("userInfo", userObj);
        wx.switchTab({
          url: '/pages/talk/talk',
        });
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
    wx.getUserProfile({
      desc: '注册的昵称将在本程序中使用',
      success: (res) => {
        let userObj = res.userInfo;
        app.globalData.userObj = userObj;
        wx.setStorageSync('userInfo', userObj);

        let tmpNickName = that.pageData.userInputNickName || userObj.nickName;
        let avatarImgUrl = userObj.avatarUrl;
        let gender = userObj.gender === 1 ? '男' : '女';
        //注册用户
        db.collection("angler").add({
          data: {
            tempNickName: tmpNickName,
            avatarUrl: avatarImgUrl,
            gender: gender,
            registTime: new Date(),
            right: [1, 0, 0, 1]
          }
        }).then((res) => {
          console.log("注册成功",res);
          that.notify.showNotify(function () {
            wx.switchTab({
              url: '/pages/talk/talk',
            });
          });

        })
      }
    })



  },
  toArrangePage() {
    wx.navigateTo({
      url: '../arrange/arrange',
    })
  }


})