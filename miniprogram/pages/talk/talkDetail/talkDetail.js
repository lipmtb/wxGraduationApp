// miniprogram/pages/talk/talkDetail/talkDetail.js
const db = wx.cloud.database();
const app = getApp();
import MyNotify from '../../../util/mynotify/mynotify';
import customFormatTime from '../../../util/customTime';
Page({
  data: {
    talkItemData: {}, //文章的信息
    anglerInfo: {}, //发布者的信息
    hasCollected: false, //当前用户是否收藏过文章
    commentLists: [], //当前文章的评论列表
    commentInputValue: 666, //默认评论
    hasLiked: false
  },
  pageData: {
    commentText: '666',
    shareImgFileId: 'cloud://blessapp-20201123.626c-blessapp-20201123-1304304117/加减乘除-2021-02-10T06:14:42.595Z.png',
    shareImgUrl: ''
  },
  onLoad: function (options) {
    const eventChannel=this.getOpenerEventChannel();
    eventChannel.emit("receiveEvent",{data:'talk detail66'});
    eventChannel.on("receiveData",function(da){
      console.log("talkDetail reveive:",da);
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
    //根据文章_id获取文章内容和发布者的信息
    db.collection('talk').doc(options.talkId).get().then((res) => {
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
        talkItemData: res.data //文章的主要信息
      });
    });

    //当前用户是否收藏过本文章
    let curUserId = app.globalData.userOpenId || wx.getStorageSync('userOpenId');
    db.collection("collectTalk").where({
      _openid: curUserId,
      collectTalkId: that.options.talkId //当前文章的_id
    }).get().then((res) => {
      this.notify.notifyInit();
      if (res.data[0]) {
        this.notifycancel.notifyInit();
        that.setData({
          hasCollected: res.data[0]._id
        });
      }
    });
    //获取评论
    that.getCommentLists();

    //判断当前用户是否给此条文章点过赞
    db.collection('likeTalk').where({
      _openid: wx.getStorageSync('userOpenId'),
      likeTalkId: this.options.talkId
    }).get().then((res) => {

      if (res.data.length > 0) {
        this.setData({
          hasLiked: res.data[0]._id
        });
      }
    });

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
    db.collection("collectTalk").add({
      data: {
        collectTalkId: this.data.talkItemData._id
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
    db.collection("collectTalk").doc(this.data.hasCollected).remove().then((res) => {

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
    db.collection('comment').add({
      data: {
        commentTalkId: this.data.talkItemData._id,
        commentText: this.pageData.commentText,
        commentTime: new Date()
      }
    }).then((res) => {
      console.log("评论成功", res);
      that.getCommentLists();
      that.createCommentMessage(res._id);
      that.setData({
        commentInputValue: ''
      });
    })
  },
  async createCommentMessage(commentResId) {
    let that=this;
    let toUserId = this.data.anglerInfo._openid;
    let fromUserRes = await wx.cloud.callFunction({
      name: "getUserOpenId"
    });
    let fromUserArrRes=await db.collection("angler").where({
      _openid:fromUserRes.result
    }).get();

    let fromUserId = fromUserRes.result;
    let fromUserInfo=fromUserArrRes.data[0];
    return await db.collection("message").add({
      data: {
        toUser: toUserId, //接受消息的用户
        fromUser: fromUserId, //发消息的用户
        type: 'normal', //消息的类型，基本消息，分系统消息和基本消息
        status: 'progress', //progress代表未读，finish代表已读
        time: new Date(), //消息的创建时间
        messageDetail: {
          msgFromId: that.data.talkItemData._id,
          msgFrom: 'talk',
          msgContent: fromUserInfo.tempNickName+"在钓友圈评论了你: "+that.pageData.commentText,
          commentId:commentResId
        }
      }
    })
  },
  //获取文章的评论
  getCommentLists() {
    let that = this;
    db.collection("comment").where({
      commentTalkId: that.options.talkId
    }).get().then((res) => {
      console.log("获取评论成功", res);
      //评论排序：按照发布的时间先后
      res.data.sort(function (itemDataA, itemDataB) {
        return itemDataB.commentTime - itemDataA.commentTime;
      });
      //格式化输出时间和获取用户信息
      let prosArr = [];
      for (let itemData of res.data) {
        itemData.commentTime = customFormatTime(itemData.commentTime);

        prosArr.push(db.collection('angler').where({
          _openid: itemData._openid
        }).get().then((userRes) => {
          itemData.userInfo = userRes.data[0];
        }));
      }
      Promise.all(prosArr).then(() => {

        that.setData({
          commentLists: res.data
        });
      });


    });
  },
  //点赞
  likeTalk() {
    this.showBigLikeIcon();
    db.collection('likeTalk').add({
      data: {
        likeTalkId: this.options.talkId
      }
    }).then((res) => {
      console.log("点赞成功", res);
      this.setData({
        hasLiked: res._id
      });
    })
  },
  //取消点赞
  unLikeTalk() {
    db.collection("likeTalk").doc(this.data.hasLiked).remove().then((res) => {
      console.log("取消点赞成功", res);
      wx.showToast({
        title: '取消点赞',
      });
      this.setData({
        hasLiked: false
      })
    });
  },
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
      title: '钓友圈分享',
      path: '/pages/talk/talkDetail/talkDetail',
      imageUrl: this.pageData.shareImgUrl
    }
  }

})