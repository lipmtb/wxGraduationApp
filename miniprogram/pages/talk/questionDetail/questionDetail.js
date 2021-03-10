//问答帖子详情
const db = wx.cloud.database();
const app = getApp();
import MyNotify from '../../../util/mynotify/mynotify';
import customFormatTime from '../../../util/customTime';
Page({
  data: {
    questionItemData: {}, //文章的信息
    anglerInfo: {}, //发布者的信息
    hasCollected: false, //当前用户是否收藏过文章
    commentLists: [], //当前文章的评论列表
    commentInputValue: '', //评论输入的内容
    placeHolderText: '期待你的评论',
    commentTarget: '', //回复和普通评论切换
    hasFocus: false, //评论输入聚焦
    totalCommentCount: 0,
    hasMoreComment: true,
    canShowBottom: false
  },
  pageData: {
    userTempInfo: {}, //当前用户的信息
    commentText: '', //获取输入的评论内容
    tarId: '', //要回复的评论的_id
    tarUser: {}, //回复评论的用户对象
    tarIdx: 0, //回复的主评论索引
    curCommentLen: 0, //当前加载的评论数
    canGetMoreComment: false
  },
  async getUserTemp() {
    let openid = wx.getStorageSync('userOpenId');
    if (!openid) {
      let opRes = wx.cloud.callFunction({
        name: "getUserOpenId"
      });
      openid = (await opRes).result;
    }
    return await db.collection("angler").where({
      _openid: openid
    }).get();
  },
  onLoad: function (options) {
    this.getUserTemp().then((userArr) => {
      this.pageData.userTempInfo = userArr.data[0];
    })
    //默认发表对帖子的评论
    this.setData({
      commentTarget: options.questionId
    })
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
    db.collection('question').doc(options.questionId).get().then((res) => {
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
        questionItemData: res.data //文章的主要信息
      });
    });

    //当前用户是否收藏过本文章
    let curUserId = app.globalData.userOpenId || wx.getStorageSync('userOpenId');
    db.collection("collectQuestion").where({
      _openid: curUserId,
      collectQuestionId: that.options.questionId //当前文章的_id
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
  },
  //用户收藏文章
  onCollect() {
    let that = this;
    db.collection("collectQuestion").add({
      data: {
        collectQuestionId: that.options.questionId
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
    db.collection("collectQuestion").doc(this.data.hasCollected).remove().then((res) => {

      this.notifycancel.showNotify(function () {
        that.notify.notifyInit();
      });
      this.setData({
        hasCollected: false
      });
    })
  },
  //评论帖子或者回复评论
  commentToReply(e) {
    console.log(e);
    this.pageData.tarId = e.currentTarget.dataset.tarCommentId;
    this.pageData.tarUser = e.currentTarget.dataset.tarUser || String("666");
    this.pageData.tarIdx = e.currentTarget.dataset.tarIndex;
    let commentTo = this.pageData.tarUser.tempNickName || '我';
    this.setData({
      placeHolderText: '回复@' + commentTo,
      commentInputValue: '',
      hasFocus: true, //聚焦评论输入框，拉起键盘
      commentTarget: this.pageData.tarId //commentTarget!=this.options.questionId发表按钮变为回复按钮
    })
  },
  onPageScroll() {

    this.setData({
      commentTarget: this.options.questionId,
      placeHolderText: '期待你的评论',
      commentInputValue: ''
    })
  },
  //用户评论输入
  onCommentChange(e) {
    this.pageData.commentText = e.detail;
  },
  //评论消息发给问题发布者
  async createCommentMsg(commentId) {
    let that = this;
    //获取消息来源的用户名
    let fromopenid = wx.getStorageSync('userOpenId');
    if (!fromopenid) {
      let fromUserOpenid = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      fromopenid = fromUserOpenid.result;
    }
    let fromUserInfo = await db.collection("angler").where({
      _openid: fromopenid
    }).get();
    let fromUserObj = fromUserInfo.data[0];
    //获取要接受消息的用户的openid
    let toUserId = this.data.anglerInfo._openid;
    return await db.collection("message").add({
      data: {
        toUser: toUserId,
        type: 'normal',
        status: 'progress',
        time: new Date(),
        messageDetail: {
          commentId: commentId,
          msgContent: fromUserObj.tempNickName + "在问答圈评论了你的帖子：" + that.pageData.commentText,
          msgFrom: 'question',
          msgFromId: that.data.questionItemData._id
        }
      }
    })

  },
  //用户发表评论
  onSendComment() {
    let that = this;
    db.collection('questionComment').add({
      data: {
        commentQuestionId: that.options.questionId,
        commentText: that.pageData.commentText,
        commentTime: new Date()
      }
    }).then((res) => {
      //刷新评论区
      let curUser = that.pageData.userTempInfo;
      that.data.commentLists.unshift({
        commentQuestionId: that.options.questionId,
        commentText: that.pageData.commentText,
        commentTime: "刚刚",
        userInfo: curUser,
        likeCount: 0,
        _id: res._id,
        hasLiked: false,
        replyLists: []
      });
      wx.showToast({
        title: '评论成功',
      });
      that.setData({
        commentInputValue: '',
        commentLists: that.data.commentLists,
        totalCommentCount: that.data.totalCommentCount + 1
      });
      //创建消息告知toUser
      that.createCommentMsg(res._id); //评论的id传给消息
    })
  },
  //回复评论
  onReplyComment() {
    let that = this;
    db.collection("questionCommentReply").add({
      data: {
        tarCommentId: this.pageData.tarId, //要回复的评论的_id
        tarUserId: this.pageData.tarUser._id, //回复的目标用户
        content: this.pageData.commentText, //回复的内容
        commentTime: new Date()
      }
    }).then((res) => {
      //刷新评论区
      let curUser = that.pageData.userTempInfo;
      let commentMainIdx = that.pageData.tarIdx;

      let newReply = {
        tarCommentId: that.pageData.tarId,
        content: that.pageData.commentText,
        commentTime: "刚刚",
        userInfo: curUser,
        tarUserInfo: that.pageData.tarUser,
        likeCount: 0,
        _id: res._id,
        hasLiked: false
      };
      let endIdx = that.data.commentLists[commentMainIdx]['replyLists'].length;
      that.replaceDataOnPath(['commentLists', commentMainIdx, 'replyLists', endIdx], newReply);
      that.applyDataUpdates();
      wx.showToast({
        title: '回复' + that.pageData.tarUser.tempNickName,
      })
      console.log(curUser, "回复", that.pageData.tarUser);
      that.setData({
        commentInputValue: '',
        totalCommentCount: that.data.totalCommentCount + 1
      });


      that.setData({
        commentInputValue: ''
      });
    })
  },
  //获取文章的评论
  async getCommentLists() {
    let that = this;
    that.pageData.canGetMoreComment = false;
    let openid = app.globalData.userOpenId || wx.getStorageSync('userOpenId');
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let resAll = await wx.cloud.callFunction({
      name: 'getQuestionCommentLists',
      data: {
        questionId: that.options.questionId,
        skipComment: that.pageData.curCommentLen,
        curUserOpenId: openid
      }
    });
    let res = resAll.result.list;
    if (res.length === 0) {
      that.setData({
        hasMoreComment: false
      })
      return;
    }


    for (let [idx, itemData] of res.entries()) {
      itemData.replyLists = [];
      itemData.replyLen=0;
      itemData.commentTime = customFormatTime(itemData.commentTime);
      itemData.openInfo = openid;
      that.getReplyCommentList(openid, itemData, that.pageData.curCommentLen + idx); //获取评论的回复列表

    }
    that.pageData.curCommentLen += res.length;
    if (that.pageData.curCommentLen > 5) {
      that.setData({
        canShowBottom: true
      })
    }
    console.log("获取评论成功", res, that.pageData.curCommentLen);
    that.data.commentLists.push(...res);
    that.setData({
      commentLists: that.data.commentLists,
      totalCommentCount: that.data.commentLists.length
    }, () => {
      that.pageData.canGetMoreComment = true;
    });
    return res;

  },
  // 获取每条评论的回复信息：发布者，回复列表等
  async getReplyCommentList(curUserId, mainComment, mainCommentIdx) {
    let _this = this;
    let mainId = mainComment._id;
    // let skipNum = mainComment.replyLists.length;
    let skipNum = mainComment.replyLen;
    // console.log("skipNum",skipNum);
    let replyRes = await wx.cloud.callFunction({
      name: 'getQuesComReply',
      data: {
        tarCommentId: mainId,
        skipReplyCount: skipNum,
        curUserOpenId: curUserId
      }
    });
    for (let item of replyRes.result.list) {
      item.commentTime = customFormatTime(item.commentTime);
    }
    mainComment.replyLists.push(...replyRes.result.list);
    mainComment.replyLen+=replyRes.result.list.length;
    _this.replaceDataOnPath(['commentLists', mainCommentIdx, 'replyLists'], mainComment.replyLists);
    _this.replaceDataOnPath(['commentLists', mainCommentIdx, 'replyLen'], mainComment.replyLen);

    _this.applyDataUpdates();
    return replyRes.result.list;

  },
  //获取主评论更多回复
  async getMoreReply(e) {
    wx.showLoading({
      title: '更多回复'
    })

    let mainCommentItem = e.currentTarget.dataset.mainComment;//主评论
    let mainIndex = e.currentTarget.dataset.mainIdx;//第几条主评论
    let openid =  wx.getStorageSync('userOpenId');
    if (!openid) {
     openid=mainCommentItem.openInfo;
    }
    this.getReplyCommentList(openid, mainCommentItem, mainIndex).then((res) => {
      wx.hideLoading({
        success: (res) => {},
      })
    });
  },
  //触底加载更多评论
  onReachBottom() {
    if (this.data.hasMoreComment && this.pageData.canGetMoreComment) {
      wx.showLoading({
        title: '更多评论'
      })
      this.getCommentLists().then(() => {
        wx.hideLoading({
          success: (res) => {},
        })
      });

    }


  },
  //用户点赞主评论
  likeComment(e) {

    let likeId = e.currentTarget.dataset.likeTar._id;
    let idx = e.currentTarget.dataset.likeIdx;
    db.collection("likeQuestionComment").add({
      data: {
        likeCommentId: likeId
      }
    }).then((res) => {
      this.showBigLikeIcon(idx);

      this.replaceDataOnPath(['commentLists', idx, 'hasLiked'], res);
      this.replaceDataOnPath(['commentLists', idx, 'likeCount'], this.data.commentLists[idx].likeCount + 1);
      this.applyDataUpdates();
    })
  },
  //取消主评论的赞
  unlikeComment(e) {
    // let dislikeId = e.currentTarget.dataset.likeTar.hasLiked;
    let dislikeId = e.currentTarget.dataset.likeTar.hasLiked._id;
    let idx = e.currentTarget.dataset.likeIdx;
    db.collection("likeQuestionComment").doc(dislikeId).remove().then((res) => {
      wx.showToast({
        title: '取消赞',
      })
      this.replaceDataOnPath(['commentLists', idx, 'hasLiked'], false);
      this.replaceDataOnPath(['commentLists', idx, 'likeCount'], this.data.commentLists[idx].likeCount - 1);
      this.applyDataUpdates();
    })
  },
  //取消评论回复的赞
  unlikeReplyComment(e) {
    let dislikeId = e.currentTarget.dataset.likeTar.hasLiked._id;
    let idx = e.currentTarget.dataset.likeIdx;
    let idxChild = e.currentTarget.dataset.likeIdxChild;
    db.collection("likeQuestionComment").doc(dislikeId).remove().then((res) => {
      wx.showToast({
        title: '取消赞',
      });
      this.replaceDataOnPath(['commentLists', idx, 'replyLists', idxChild, 'hasLiked'], false);
      this.replaceDataOnPath(['commentLists', idx, 'replyLists', idxChild, 'likeCount'], this.data.commentLists[idx]['replyLists'][idxChild].likeCount - 1);
      this.applyDataUpdates();
    })
  },
  //赞评论回复
  likeReplyComment(e) {
    let likeId = e.currentTarget.dataset.likeTar._id;
    let idx = e.currentTarget.dataset.likeIdx;
    let idxChild = e.currentTarget.dataset.likeIdxChild;
    db.collection("likeQuestionComment").add({
      data: {
        likeCommentId: likeId
      }
    }).then((res) => {
      wx.showToast({
        title: '赞一个',
      })
      this.replaceDataOnPath(['commentLists', idx, 'replyLists', idxChild, 'hasLiked'], res);
      this.replaceDataOnPath(['commentLists', idx, 'replyLists', idxChild, 'likeCount'], this.data.commentLists[idx]['replyLists'][idxChild].likeCount + 1);
      this.applyDataUpdates();
    })
  },
  //计算加速度
  geta(pos, vend, t) {
    return 2 * (vend * t - pos) / (t * t);
  },
  //点赞动画
  showBigLikeIcon(thumbIdx) {
    let that = this;
    let query = wx.createSelectorQuery();
    query.select('#thumbIcon-' + thumbIdx).boundingClientRect(function (res) {
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
      }], 500, function () {
        console.log("一个阶段变大结束");
        let query = wx.createSelectorQuery();
        query.select('.like-good-icon').boundingClientRect(function (resgood) {
          console.log("一阶段query:", resgood);
          //以向下为正方向，单位px/s(像素/秒)

          //总时间
          let allTime = 0.6;
          //垂直末速度
          let vend = -1 * ((res.left - resgood.left) / allTime) * (res.left - resgood.left) / (res.top - resgood.top);
          //垂直加速度
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

  }

})