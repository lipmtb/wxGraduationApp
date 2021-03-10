// equipDetail 详情页
const db = wx.cloud.database();
const _ = db.command;
const $ = _.aggregate;
const app = getApp();
import MyNotify from '../../../../util/mynotify/mynotify';
import customFormatTime from '../../../../util/customTime';
let QQMapWX = require('../../../../qqmap-wx-jssdk1.2/qqmap-wx-jssdk');
Page({
  data: {
    popVisible: false, //默认不显示遮罩
    visCount: 4, //picker的显示
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    maxDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime(),
    formatter: (type, value) => {
      if (type === 'year') {
        return `${value}年`;
      } else if (type === 'month') {
        return `${value}月`;
      } else if (type === 'date') {
        return `${value}日`;
      } else if (type === 'hour') {
        return `${value}时`;
      } else if (type === 'minute') {
        return `${value}分`;
      }
      return `${value}日`;
    },
    equipItemData: {}, //装备的信息
    anglerInfo: {}, //发布者的信息
    hasCollected: false, //当前用户是否收藏过文章
  },
  pageData: {
    curStartTimeInfo: new Date(), //默认出租开始时间
    curEndTimeInfo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), //默认出租结束时间
    curInputAddress: '',
    curInputRelated: '',
    userTempNickName: '', //当前用户的昵称
    shareImgFileId: 'cloud://blessapp-20201123.626c-blessapp-20201123-1304304117/加减乘除-2021-02-10T06:14:42.595Z.png',
    shareImgUrl: ''
  },
  onClosePop() {
    this.setData({
      popVisible: false
    });
    console.log(this.pageData.curStartTimeInfo.toLocaleString(), this.pageData.curEndTimeInfo.toLocaleString());
  },
  onShowPop(e) {
    let btnInfo = e.currentTarget.dataset.btnInfo;
    this.pageData.curTimeSelect = btnInfo;
    let titleStr = btnInfo === 'start' ? '租用开始时间' : '租用结束时间';

    this.setData({
      popVisible: true,
      titlePopStr: titleStr,
      currentDate: btnInfo === 'start' ? this.pageData.curStartTimeInfo.getTime() : this.pageData.curEndTimeInfo.getTime()
    })
  },
  // 确认时间
  timeConfirm(e) {
    console.log(e);
    if (this.pageData.curTimeSelect === "start") {
      this.pageData.curStartTimeInfo = new Date(e.detail);
    } else {
      this.pageData.curEndTimeInfo = new Date(e.detail);
    }
    if (this.pageData.curStartTimeInfo > this.pageData.curEndTimeInfo) {
      this.pageData.curStartTimeInfo = this.pageData.curEndTimeInfo;
    }
    this.setData({
      popVisible: false,
      startTimeStr: this.pageData.curStartTimeInfo.toLocaleDateString(),
      endTimeStr: this.pageData.curEndTimeInfo.toLocaleDateString()
    })
  },
  onLoad: function (options) {
    this.pageData.qqmapsdk = new QQMapWX({
      key: 'YSTBZ-2AV62-M4MUW-CBF5K-OSK2F-4CBEF'
    });


    //初始化通知（后面注册成败与否可以调用）
    this.notify = new MyNotify({
      pageThis: this,
      message: '收藏成功',
      bgColor: '#ff0'
    });

    this.notifycancel = new MyNotify({
      pageThis: this,
      message: '取消收藏成功',
      bgColor: '#ccc'
    });
    let that = this;

    this.getEquip().then((equipdata) => {
      that.calcDistance(equipdata);
    })

    //当前用户是否收藏过
    let curUserId = app.globalData.userOpenId || wx.getStorageSync('userOpenId');
    db.collection("collectEquip").where({
      _openid: curUserId,
      collectEquipId: that.options.equipId //当前文章的_id
    }).get().then((res) => {
      this.notify.notifyInit();
      if (res.data[0]) {
        this.notifycancel.notifyInit();
        that.setData({
          hasCollected: res.data[0]._id
        });
      }
    });


  },
  async getEquip() {
    let that = this;
    //根据_id获取内容和发布者的信息
    let equipRes = await db.collection('equip').doc(this.options.equipId).get();

    let eTypeRes=await db.collection("equipType").doc(equipRes.data.equipTypeId).get();
    equipRes.data.equipType=eTypeRes.data;


    //根据发布者_openid获取发布者的详细信息
    await db.collection('angler').where({
      _openid: equipRes.data._openid
    }).get().then((userRes) => {

      that.setData({
        anglerInfo: userRes.data[0] //发布者的信息
      });
    });

    equipRes.data.publishTime = customFormatTime(equipRes.data.publishTime);
    this.setData({
      equipItemData: equipRes.data, //装备的主要信息
      minDate: equipRes.data.rentStartTime.getTime(), //根据可以租用的时间设置piker的限制
      maxDate: equipRes.data.rentEndTime.getTime()
    });
    //默认租用时间
    this.pageData.curStartTimeInfo = equipRes.data.rentStartTime;
    this.pageData.curEndTimeInfo = equipRes.data.rentEndTime;

    return equipRes.data;
  },
  async getCurrentLocation() {
    return await new Promise((resolve) => {
      wx.getLocation({
        type: 'gcj02',
        success(res) {
          resolve(res);
        }
      })
    })
  },
  async calcDistance(tarequip) {
    let that = this;
    let curLocRes = await this.getCurrentLocation();
    console.log("用户当前位置", curLocRes);
    console.log("距离的目标：", tarequip.locationDetail);
    this.pageData.qqmapsdk.calculateDistance({
      mode: 'straight', //计算直线距离
      from: {
        latitude: curLocRes.latitude,
        longitude: curLocRes.longitude
      },
      to: [{
        longitude:  tarequip.locationDetail&&tarequip.locationDetail.longitude||116.674,
        latitude:  tarequip.locationDetail&&tarequip.locationDetail.latitude||23.4665
      }],
      success: (disres) => {
        console.log(disres);
        that.setData({
          disCalc: disres.result.elements[0].distance
        })
      }
    })
  },
  onReady() {
    //获取分享的图片的临时链接
    wx.cloud.getTempFileURL({
      fileList: [this.pageData.shareImgFileId]
    }).then((res) => {
      // console.log(res);
      this.pageData.shareImgUrl = res.fileList[0].tempFileURL;
    })
  },
  //用户收藏装备
  onCollect() {
    let that = this;
    db.collection("collectEquip").add({
      data: {
        collectEquipId: that.options.equipId
      }
    }).then((res) => {

      this.notify.showNotify(function () {
        that.notifycancel.notifyInit();
      });
      this.setData({
        hasCollected: res._id
      });
    })
  },
  //用户取消收藏
  onCancelCollect() {
    let that = this;
    db.collection("collectEquip").doc(this.data.hasCollected).remove().then((res) => {

      this.notifycancel.showNotify(function () {
        that.notify.notifyInit();
      });
      this.setData({
        hasCollected: false
      });
    })
  },
  //打开微信内置地图查看地点
  chooseLocationDetail(e) {
    // console.log(e.currentTarget.dataset.locationInfo);
    let long = e.currentTarget.dataset.locationInfo.longitude;
    let lat = e.currentTarget.dataset.locationInfo.latitude;
    let name = e.currentTarget.dataset.locationInfo.name;
    let addr = e.currentTarget.dataset.locationInfo.address;
    wx.openLocation({
      latitude: lat,
      longitude: long,
      name: name,
      address: addr,
      success(res) {
        // console.log("chooseLocation success");
      }
    })
  },
  //分享这篇帖子
  onShareAppMessage() {
    console.log(this.pageData.shareImgUrl);
    return {
      title: '装备分享',
      path: '/pages/service/equipService/equipDetail/equipDetail',
      imageUrl: this.pageData.shareImgUrl
    }
  },

  onInputRelated(e) {
    this.pageData.curInputRelated = e.detail;
  },
  onInputAddress(e) {

    this.pageData.curInputAddress = e.detail;
  },
  // 确认租用
  async confirmOrder() {

    let that=this;
    let userOpenId=wx.getStorageSync('userOpenId');
    if(!userOpenId){
      let openRes=await wx.cloud.callFunction({
        name:'getUserOpenId'
      });
      userOpenId=openRes.result;
    }

    let userInfoRes=await db.collection("angler").where({
      _openid:userOpenId
    }).get();
    let userObj=userInfoRes.data[0];//获取租赁用户对象

    //添加租赁订单
    let rentRes=await db.collection("rentEquip").add({
      data:{
        rentEquipId:that.data.equipItemData._id,//租用的装备
        rentUserName:userObj.tempNickName,//租用者昵称
        rentStartTime:that.pageData.curStartTimeInfo,//租用起始时间
        rentEndTime:that.pageData.curEndTimeInfo,//租用结束时间
        related:that.pageData.curInputRelated,//租用联系方式
        rentAddress:that.pageData.curInputAddress,//租用详细地址
        rentTime:new Date(),
        orderStatus:'unconfirmed'
      }
    })
    wx.navigateTo({
      url: '../rentDetail/rentDetail?rentId='+rentRes._id,
    })


  }

})