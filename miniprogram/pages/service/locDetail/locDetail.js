// locDetail 钓点详情页面
const db = wx.cloud.database();
const _ = db.command;
const $ = _.aggregate;
const app = getApp();
const template_id = 'QIk7dR4Q-XsKlu22ED5O8zJ26_08ZWW5ZtQkUdj_m08';
import MyNotify from '../../../util/mynotify/mynotify';
import customFormatTime from '../../../util/customTime';
let QQMapWX = require('../../../qqmap-wx-jssdk1.2/qqmap-wx-jssdk');
import qqmapkey from "../../../qqmapConfig/keyconfig";
Page({
  data: {
    popVisible: false, //默认不显示遮罩
    visCount: 4, //picker的显示
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
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
    orderTime: '', //预约时间
    hasConfirmOrderTime: false, //是否确认预约，去数据库查看是否有预定过，有true,否则false
    locItemData: {}, //文章的信息
    anglerInfo: {}, //发布者的信息
    hasCollected: false, //当前用户是否收藏过文章
    commentLists: [], //当前文章的评论列表
    hasMoreComment: true,
    canComment: false,
    commentInputValue: 666, //默认评论
    canRate: true,
    rateValue: 0, //默认的评分
    avgRateValue: 2.5 //默认的综合评分
  },
  pageData: {
    userTempNickName: '', //当前用户的昵称
    curUserAvatarUrl: '', //当前用户的头像信息
    selectedOrderTime: new Date(), //选择的预约时间
    curInputRelated: '123', //用户输入的联系方式
    recommendNearLists: [], //钓点附近
    curRecommendNearCount: 0, //钓点附近
    commentText: '666', //评论发表的内容
    curCommentCount: 0,
    shareImgFileId: 'cloud://blessapp-20201123.626c-blessapp-20201123-1304304117/加减乘除-2021-02-10T06:14:42.595Z.png',
    shareImgUrl: ''
  },
  onLoad: function (options) {
    //初始化腾讯位置服务，用于获取附近渔具店，烧烤，饭店等
    this.pageData.qqmapsdk = new QQMapWX({
      key: qqmapkey
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
    that.getCurUserInfo().then((userInfo) => {
      that.pageData.userTempNickName = userInfo.tempNickName;
      that.pageData.curUserAvatarUrl = userInfo.avatarUrl;

      that.setData({
        canComment: true
      })
    })
    //根据文章_id获取文章内容和发布者的信息
    db.collection('anglerLoc').doc(options.locId).get().then((res) => {
      //根据文章的发布者_openid获取发布者的详细信息
      db.collection('angler').where({
        _openid: res.data._openid
      }).get().then((userRes) => {

        that.setData({
          anglerInfo: userRes.data[0] //发布者的信息
        });
      });
      res.data.publishTime = customFormatTime(res.data.publishTime);
      this.setData({
        locItemData: res.data //文章的主要信息
      }, () => {
        Promise.all([that.getRecommendNearLists("钓具"), that.getRecommendNearLists("烧烤"), that.getRecommendNearLists("饭店")]).then((resarr) => {
          console.log(resarr);
          that.pageData.recommendNearLists.push(...resarr[0]);
          that.pageData.recommendNearLists.push(...resarr[1]);
          that.pageData.recommendNearLists.push(...resarr[2]);
          that.pageData.curRecommendNearCount += resarr[0].length;
          that.pageData.curRecommendNearCount += resarr[1].length;
          that.pageData.curRecommendNearCount += resarr[2].length;
          console.log("当前的地点数:", that.pageData.curRecommendNearCount);
          that.setData({
            recommendNearLists: that.pageData.recommendNearLists
          })

        });
      });
    });

    //当前用户是否收藏过本文章
    let curUserId = app.globalData.userOpenId || wx.getStorageSync('userOpenId');
    db.collection("collectLoc").where({
      _openid: curUserId,
      collectLocId: that.options.locId //当前文章的_id
    }).get().then((res) => {
      this.notify.notifyInit();
      if (res.data[0]) {
        this.notifycancel.notifyInit();
        that.setData({
          hasCollected: res.data[0]._id
        });
      }
    });

    //当前用户的评分
    db.collection("rateLoc").where({
      _openid: curUserId,
      rateLocId: options.locId
    }).get().then((rateRes) => {
      if (rateRes.data.length > 0) {
        that.setData({
          rateValue: rateRes.data[0].rateNum
        })
      }
    });
    //获取综合评分
    db.collection("rateLoc").aggregate().match({
      rateLocId: options.locId
    }).group({
      _id: null,
      avgRate: $.avg('$rateNum')
    }).end().then((resavg) => {
      console.log(resavg);
      if (resavg.list.length > 0) {
        that.setData({
          avgRateValue: resavg.list[0].avgRate
        })
      }

    });

    //获取评论
    that.getCommentLists();



  },
  onReady() {
    //获取分享的图片的临时链接
    wx.cloud.getTempFileURL({
      fileList: [this.pageData.shareImgFileId]
    }).then((res) => {
      console.log(res);
      this.pageData.shareImgUrl = res.fileList[0].tempFileURL;
    })
  },
  //用户收藏文章
  onCollect() {
    let that = this;
    db.collection("collectLoc").add({
      data: {
        collectLocId: that.options.locId
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
    db.collection("collectLoc").doc(this.data.hasCollected).remove().then((res) => {

      this.notifycancel.showNotify(function () {
        that.notify.notifyInit();
      });
      this.setData({
        hasCollected: false
      });
    })
  },
  //用户评论输入
  onCommentChange(e) {
    this.pageData.commentText = e.detail;
  },
  //用户发表评论
  onSendComment() {
    let that = this;
    that.setData({
      canComment: false
    })
    db.collection('commentLoc').add({
      data: {
        commentLocId: that.options.locId,
        commentText: that.pageData.commentText,
        commentTime: new Date()
      }
    }).then((res) => {
      console.log("评论成功", res);
      that.data.commentLists.unshift({
        _id: res._id,
        userInfo: {
          tempNickName: that.pageData.userTempNickName,
          avatarUrl: that.pageData.curUserAvatarUrl
        },
        commentText: that.pageData.commentText,
        commentTime: '刚刚'
      });
      that.pageData.curCommentCount++;

      that.setData({
        commentInputValue: '',
        canComment: true,
        commentLists: that.data.commentLists
      });
      that.createCommentMessage(res._id);
    })
  },
  async createCommentMessage(commentResId) {
    let that = this;
    let toUserId = this.data.anglerInfo._openid;

    return await db.collection("message").add({
      data: {
        toUser: toUserId, //接受消息的用户
        type: 'normal', //消息的类型
        status: 'progress', //progress代表未读，finish代表已读
        time: new Date(), //消息的创建时间
        messageDetail: {
          msgFromId: that.options.locId,
          msgFrom: 'anglerLoc',
          msgContent: that.pageData.userTempNickName + "在你发布的钓点发表评论: " + that.pageData.commentText,
          commentId: commentResId
        }
      }
    })
  },
  //获取文章的评论
  async getCommentLists() {
    let that = this;
    let commentRes = await db.collection("commentLoc").where({
        commentLocId: that.options.locId
      }).orderBy("commentTime", "desc")
      .skip(that.pageData.curCommentCount).limit(5).get();


    if (commentRes.data.length < 5) {
      that.setData({
        hasMoreComment: false
      })
    }
    console.log("获取评论成功", commentRes);

    //格式化输出时间和获取用户信息
    let prosArr = [];
    for (let itemData of commentRes.data) {
      itemData.commentTime = customFormatTime(itemData.commentTime);

      prosArr.push(db.collection('angler').where({
        _openid: itemData._openid
      }).get().then((userRes) => {
        itemData.userInfo = userRes.data[0];
      }));
    }
    Promise.all(prosArr).then(() => {
      that.pageData.curCommentCount += commentRes.data.length;
      that.data.commentLists.push(...commentRes.data);
      that.setData({
        commentLists: that.data.commentLists
      });
    });
  },
  moreComment() {
    let that=this;
    if (that.data.hasMoreComment) {
      wx.showLoading({
        title: '更多评论'
      })

      that.getCommentLists().then(() => {
        wx.hideLoading({
          success: (res) => {},
        })
      })
    }else{
        wx.showToast({
          title: '没有更多了',
        })
    }
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
  //用户打分
  async onRateLoc(e) {
    // console.log(e.detail);
    let that = this;
    //禁止重复评分
    this.setData({
      canRate: false
    });
    //获取用户的openid
    let openid = wx.getStorageSync('userOpenId');
    if (!openid) {
      let openidRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openidRes.result;
    }
    //判断用户是否评分过
    let rateRes = await db.collection("rateLoc").where({
      _openid: openid,
      rateLocId: that.options.locId
    }).get();
    //如果评过分，则更新新的评分
    if (rateRes.data.length > 0) {

      let updateRes = await db.collection("rateLoc").doc(rateRes.data[0]._id).update({
        data: {
          rateNum: e.detail
        }
      });
      that.setData({
        canRate: true
      });
      wx.showToast({
        title: '更新评分'
      });
      return updateRes;
    }
    let insertRes = await db.collection("rateLoc").add({
      data: {
        rateLocId: that.options.locId,
        rateNum: e.detail
      }
    });
    that.setData({
      canRate: true
    });
    wx.showToast({
      title: '评分成功'
    });

  },
  //计算加速度
  geta(pos, vend, t) {
    return 2 * (vend * t - pos) / (t * t);
  },
  //点赞动画
  showBigLikeIcon() {
    let that = this;
    let query = wx.createSelectorQuery();
    query.select('.like-van-icon').boundingClientRect(function (res) {
      console.log("begin query:", res);
      that.animate(".like-good-icon", [{
        opacity: 0,
        scale: [1, 1]
      }, {
        scale: [4, 4],
        opacity: 0.8
      }, {
        scale: [3, 3],
        opacity: 0.8
      }, {
        scale: [1, 1],
        opacity: 1
      }], 1000, function () {
        console.log("一个阶段变大结束");
        let query = wx.createSelectorQuery();
        query.select('.like-good-icon').boundingClientRect(function (resgood) {
          console.log("一阶段query:", resgood);
          //以向下为正方向，单位px/s(像素/秒)

          //总时间
          let allTime = 0.8;
          //垂直末速度
          let vend = -1 * ((res.left - resgood.left) / allTime) * (res.left - resgood.left) / (res.top - resgood.top);
          //加速度
          let a = that.geta(res.top - resgood.top, vend, allTime);

          //this.animate动画中间隔
          let timeGap = allTime / 8;

          //计算垂直初速度
          let v0 = vend - a * allTime;
          console.log("初速度v0：", v0);
          console.log("位移：", res.top - resgood.top);
          console.log("加速度：", a);
          that.animate('.like-good-icon', [{
              translate: [0, 0],
              opacity: 1,
            }, {
              opacity: 0.8,
              translate: [(1 / 8) * (res.left - resgood.left), v0 * timeGap + 1 / 2 * a * timeGap * timeGap]
            }, {
              opacity: 0.8,
              translate: [(1 / 4) * (res.left - resgood.left), v0 * 2 * timeGap + 1 / 2 * a * 2 * timeGap * 2 * timeGap]
            }, {
              opacity: 0.8,
              translate: [(3 / 8) * (res.left - resgood.left), v0 * 3 * timeGap + 1 / 2 * a * 3 * timeGap * 3 * timeGap]
            }, {
              opacity: 0.8,
              translate: [(1 / 2) * (res.left - resgood.left), v0 * 4 * timeGap + 1 / 2 * a * 4 * timeGap * 4 * timeGap]
            }, {
              opacity: 0.7,
              translate: [(5 / 8) * (res.left - resgood.left), v0 * 5 * timeGap + 1 / 2 * a * 5 * timeGap * 5 * timeGap]
            }, {
              opacity: 0.7,
              translate: [(3 / 4) * (res.left - resgood.left), v0 * 6 * timeGap + 1 / 2 * a * 6 * timeGap * 6 * timeGap]
            }, {
              opacity: 0.5,
              translate: [(7 / 8) * (res.left - resgood.left), v0 * 7 * timeGap + 1 / 2 * a * 7 * timeGap * 7 * timeGap]
            },
            {
              opacity: 0,
              translate: [res.left - resgood.left, res.top - resgood.top]
            }
          ], allTime * 1000, function () {
            console.log("二阶段结束");
            that.clearAnimation('.like-good-icon', {
              translate: true
            }, function () {
              console.log("清除like-goog-icon的translate属性");
            })
          })
        })
        query.exec();
      })
    });
    query.exec();

  },
  //分享这篇帖子
  onShareAppMessage() {
    console.log(this.pageData.shareImgUrl);
    return {
      title: '钓点分享',
      path: '/pages/service/locDetail/locDetail',
      imageUrl: this.pageData.shareImgUrl
    }
  },
  //获取附近的钓具点，烧烤店，饭店等
  async getRecommendNearLists(keywordstr) {
    let that = this;
    let loc = this.data.locItemData.locationDetail;
    return await new Promise((resolve, reject) => {
      that.pageData.qqmapsdk.search({
        keyword: keywordstr,
        location: {
          latitude: (loc && loc.latitude) || 23.66,
          longitude: (loc && loc.longitude) || 116.66
        },
        success: (locres) => {
          console.log("获取附近结果：", locres);
          for (let loc of locres.data) {
            loc.category = keywordstr;
            if (loc._distance > 1000) {
              loc.farDistance = (loc._distance / 1000).toFixed(3);
            }
          }
          // that.setData({
          //   recommendNearLists: locres.data
          // })
          resolve(locres.data);
        }
      })
    })
  },
  //打开遮罩
  showPop() {
    this.setData({
      popVisible: true
    })
  },
  //关闭遮罩
  onClosePop() {
    this.setData({
      popVisible: false
    })
  },
  //打开选择
  showSelectOrder() {
    this.setData({
      visCount: 4,
      currentDate: this.pageData.selectedOrderTime.getTime()
    })
  },
  onInputRelated(e) {
    // console.log(e.detail.value);
    this.pageData.curInputRelated = e.detail.value;
  },
  //确认选择
  onSelectedTimeConfirm(e) {
    // console.log("confirm",e);
    let that = this;
    that.pageData.selectedOrderTime = new Date(e.detail);
    that.confirmOrderTime().then((resid) => {
      if (resid) {
        that.setData({
          orderTime: that.pageData.selectedOrderTime.toLocaleString(),
          popVisible: false,
          orderId: resid
        }, () => {
          wx.showToast({
            title: '预约成功'
          })
        })
      } else {
        that.setData({
          popVisible: false
        })
      }
    })

  },
  //发送预约消息给钓点发布者
  async sendOrderMsg(orderId) {
    let that = this;
    let toUser = that.data.anglerInfo._openid;
    let fromUserInfo = await this.getCurUserInfo();
    let msgDetail = {
      msgFrom: 'orderLoc',
      msgContent: fromUserInfo.tempNickName + "预约了你发布的钓点:" + that.data.locItemData.locName + "，时间是：" + that.formattedDateStr(that.pageData.selectedOrderTime),
      msgFromId: orderId
    }
    return await wx.cloud.callFunction({
      name: 'createOrderMsg',
      data: {
        toUser: toUser,
        msgDetail: msgDetail,
        type: 'locOrder'
      }
    }).then((res) => {
      console.log("预约消息发送给钓点发布者", res);
    })

  },
  //确认预约：数据库插入orderLoc
  async confirmOrderTime() {
    let that = this;
    let locDetail = that.data.locItemData;
    let orderLocStr = locDetail.locationDetail && locDetail.locationDetail.address || '无';
    let orderLocId = locDetail._id; //钓点_id
    let orderLocName = locDetail.locName; //钓点名称
    let orderTime = that.pageData.selectedOrderTime; //预约的时间
    let related = that.pageData.curInputRelated; //预约者联系方式
    return await new Promise((resolve) => {
      wx.showModal({
        title: '钓点预约确认',
        content: '预约地点：' + orderLocStr + ",预约时间：" + that.pageData.selectedOrderTime.toLocaleString(),
        success(res) {
          //  console.log(res);
          if (res.confirm) {
            db.collection("orderLoc").add({
              data: {
                orderLocId: orderLocId,
                orderTime: orderTime, //预约的时间
                orderLocName: orderLocName,
                related: related,
                createTime: new Date(), //订单的创建时间
                orderStatus: 'progress'
              }
            }).then((res) => {

              console.log("预约成功", res);
              resolve(res._id);
              that.sendOrderMsg(res._id); //发locOrder类的消息通知发布者
              that.pageData.oLocId = res._id;
            })
          } else {
            resolve(false);
          }
        }
      })
    })

  },
  //取消预约：数据库删除orderLoc
  cancelOrderTime(e) {
    let oId = e.currentTarget.dataset.locOrderId;
    db.collection("orderLoc").doc(oId).remove().then((res) => {
      console.log("取消预约", res);
      this.setData({
        orderId: ""
      })
      wx.showToast({
        title: '取消预约'
      });

    })
  },
  //获取当前用户的信息
  async getCurUserInfo() {
    let openid = wx.getStorageSync('userOpenId');

    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let fromUserRes = await db.collection("angler").where({
      _openid: openid
    }).get();
    return fromUserRes.data[0];
  },
  //订阅消息的date格式：2021年2月20日 15：12
  formattedDateStr(da) {
    let year = da.getFullYear();
    let month = da.getMonth() + 1;
    let date = da.getDate();
    let hours = da.getHours();
    let minute = da.getMinutes();
    return `${year}年${month}月${date}日 ${hours}:${minute}`;
  },
  //请求发送订阅消息
  requestUserSubscription() {
    let that = this;
    console.log("调起客户端小程序订阅消息界面。。。。。");
    wx.requestSubscribeMessage({
      tmplIds: [template_id],
      success(res) { //用户选择了才有结果，否则一直等着
        console.log(res);
        if (res[template_id] === "accept") {
          //调用发送模板消息的云函数
          wx.cloud.callFunction({
            name: 'sendLocOrderMsg',
            data: {
              userId: that.data.anglerInfo._openid,
              fromUser: that.pageData.userTempNickName,
              locName: that.data.locItemData.locName,
              orderTimeStr: that.formattedDateStr(that.pageData.selectedOrderTime),
              orderId: that.pageData.oLocId
            }
          }).then((res) => {
            console.log("云函数调用成功,结果：", res);
          }).catch((err) => {
            console.log("云函数调用出错".err)
          })
        }

      },
      fail(err) {
        console.log("request失败", err)
      }
    })

  },
  onShareAppMessage() {
    let locid = this.options.locId;
    return {
      title: '钓点预约',
      path: '/pages/service/locDetail/locDetail?locId=' + locid
    }
  }

})