// miniprogram/pages/tip/tipEssayDetail/tipEssayDetail.js

const db = wx.cloud.database();
const app = getApp();
import MyNotify from '../../../util/mynotify/mynotify';
import customFormatTime from '../../../util/customTime';
Page({
  data: {
    tipItemData: {}, //文章的信息
    anglerInfo: {}, //发布者的信息
    hasCollected: false, //当前用户是否收藏过文章
    commentLists: [], //当前文章的评论列表
    hasMoreComment: true, //是否有未加载的评论
    commentInputValue: "", //默认评论
    hasLiked: false,
    canComment: false
  },
  pageData: {
    commentText: '666',
    curCommentCount: 0,
    shareImgFileId: 'cloud://blessapp-20201123.626c-blessapp-20201123-1304304117/加减乘除-2021-02-10T06:14:42.595Z.png',
    shareImgUrl: ''
  },
  onLoad: function (options) {
    let that = this;
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

    //根据文章_id获取文章内容和发布者的信息
    db.collection('tipEssays').doc(options.tipEssayId).get().then((res) => {
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
        tipItemData: res.data //文章的主要信息
      });
    });

    //获取当前用户的信息
    that.getCurUserInfo();

    //获取评论
    that.getCommentLists();

    //当前用户是否收藏过本文章
    that.userHasCollectTip();

    //当前用户是否给帖子点过赞
    that.userHasLikeTip();


  },
  //获取当前用户的信息，评论时需要
  async getCurUserInfo() {
    let that = this;
    let openid = wx.getStorageSync('userOpenId');
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: "getUserOpenId"
      });
      openid = openRes.result;
    }

    let userInfoRes = await db.collection("angler").where({
      _openid: openid
    }).get();

    that.pageData.curUserInfo = userInfoRes.data[0];
    that.setData({
      canComment: true
    })
  },
  //当前用户是否收藏过本文章
  async userHasCollectTip() {
    let that = this;
    let curUserId = wx.getStorageSync('userOpenId');
    if (!curUserId) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      curUserId = openRes.result;
    }
    db.collection("collectTip").where({
      _openid: curUserId,
      collectTipId: that.options.tipEssayId
    }).get().then((res) => {
      that.notify.notifyInit();
      if (res.data[0]) {
        that.notifycancel.notifyInit();
        that.setData({
          hasCollected: res.data[0]._id
        });
      }
    });
  },
  //当前用户是否收藏过帖子
  async userHasLikeTip() {
    let that = this;
    let curUserId = wx.getStorageSync('userOpenId');
    if (!curUserId) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      curUserId = openRes.result;
    }
    //判断当前用户是否给此条文章点过赞
    db.collection('likeTip').where({
      _openid: curUserId,
      likeTipId: that.options.tipEssayId
    }).get().then((res) => {

      if (res.data.length > 0) {
        that.setData({
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
    });
  },
  //用户收藏文章
  onCollect() {
    let that = this;
    db.collection("collectTip").add({
      data: {
        collectTipId: that.options.tipEssayId
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
    db.collection("collectTip").doc(this.data.hasCollected).remove().then((res) => {

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
  async createMsg(commentResId) {
    let that = this;
    //获取消息来源的用户信息（发表评论的用户）
    let fromopenid = wx.getStorageSync('userOpenId');
    if (!fromopenid) {
      let openidRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      fromopenid = openidRes.result;
    }
    let fromUserRes = await db.collection("angler").where({
      _openid: fromopenid
    }).get();
    let fromUser = fromUserRes.data[0];

    //获取技巧的所属主题
    let tipClassifyRes = await db.collection("tipClassify").doc(that.data.tipItemData.classifyId).get();
    let classifyNameStr = tipClassifyRes.data.classifyName;

    return await db.collection("message").add({
      data: {
        toUser: that.data.anglerInfo._openid,
        type: 'normal',
        status: 'progress',
        time: new Date(),
        messageDetail: {
          msgFrom: 'tipEssays',
          msgFromId: that.data.tipItemData._id,
          msgContent: fromUser.tempNickName + "在话题： #" + classifyNameStr + "# 评论了你的帖子：" + that.pageData.commentText,
          commentId: commentResId
        }
      }
    })
  },
  //用户发表评论
  onSendComment() {
    let that = this;
    that.setData({
      canComment: false
    })
    db.collection('tipComment').add({
      data: {
        commentTipId: that.options.tipEssayId,
        commentText: that.pageData.commentText,
        commentTime: new Date()
      }
    }).then((res) => {
      console.log("评论成功", res);
      that.data.commentLists.unshift({
        _id: res._id,
        userInfo: that.pageData.curUserInfo,
        commentText: that.pageData.commentText,
        commentTime: "刚刚"
      });
      that.pageData.curCommentCount++;

      that.setData({
        commentInputValue: '',
        commentLists: that.data.commentLists
      }, () => {
        that.setData({
          canComment: true
        })
      });
      that.createMsg(res._id);
    })
  },
  //获取文章的评论
  async getCommentLists() {
    let that = this;
    let commentRes = await db.collection("tipComment").where({
      commentTipId: that.options.tipEssayId
    }).orderBy("commentTime", "desc").skip(that.pageData.curCommentCount).limit(5).get();

    if (commentRes.data.length < 5) {
      that.setData({
        hasMoreComment: false
      })
    }
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
      console.log("获取评论成功", commentRes);
      that.setData({
        commentLists:that.data.commentLists
      });
    });
  },
  onReachBottom(){
    if(this.data.hasMoreComment){
      wx.showLoading({
        title: '更多评论'
      });
      this.getCommentLists().then(()=>{
        wx.hideLoading({
          success: (res) => {},
        })
      })
    }
  },
  //点赞
  likeTalk() {
    this.showBigLikeIcon();
    db.collection('likeTip').add({
      data: {
        likeTipId: this.options.tipEssayId
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
    db.collection("likeTip").doc(this.data.hasLiked).remove().then((res) => {
      console.log("取消点赞成功", res);
      wx.showToast({
        title: '取消点赞',
      });
      this.setData({
        hasLiked: false
      })
    });
  },
  onPageScroll(e) {

    // const query = wx.createSelectorQuery();
    // query.select('.like-van-icon').boundingClientRect(function (res) {
    //   console.log(res.left,res.right);
    // })
    // query.selectViewport().scrollOffset(function (res) {
    //   console.log("scroll top:", res.scrollTop); // 显示区域的竖直滚动位置
    // })
    // query.exec();
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
    let that = this;
    console.log(this.pageData.shareImgUrl);
    return {
      title: '钓鱼技巧',
      path: '/pages/tip/tipEssayDetail/tipEssayDetail?tipEssayId=' + that.options.tipEssayId,
      imageUrl: that.pageData.shareImgUrl
    }
  }

})