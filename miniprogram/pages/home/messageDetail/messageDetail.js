// miniprogram/pages/home/messageDetail/messageDetail.js
const db = wx.cloud.database();
import customFormatTime from '../../../util/customTime'
Page({
  data: {
    activeTab: 0,
    mainMessageLists: [], //圈内消息：评论消息和热门的帖子消息
    hasMoreMainMsg: true,
    sysMessageLists: [], //系统消息
    hasMoreSysMsg: true,
    orderMsgLists: [], //钓点预约消息
    rentOrderLists: [], //租赁消息
    hasMoreOrderMsg: true,
    hasMoreRentMsg: true
  },
  pageData: {
    curMainMsgCount: 0, //已经加载的圈内消息数量
    curSysMsgCount: 0, //已经加载的系统消息数量
    curOrderCount: 0, //已经加载的预约消息数
    curRentMsgCount: 0,
    curTabIdx: 0 //当前是圈子还是系统tab
  },
  onLoad() {
    let that = this;
    //获取home页面传来的this
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on("getHomePageThis", function (da) {
      console.log(da);
      that.pageData.homePageThis = da.homePageThis;
    })
    //获取基本的圈内消息
    this.getMainMesssge().then((msglists) => {
      this.pageData.curMainMsgCount += msglists.length;

      this.setData({
        mainMessageLists: msglists
      })
    });

  },
  onTabChange(e) {
    this.pageData.curTabIdx = e.detail.index;

    if (e.detail.index === 0 && this.pageData.curMainMsgCount === 0) {
      wx.showLoading({
        title: '加载圈内消息',
      })
      this.getMainMesssge().then((mainlists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载圈内消息", mainlists);
          },
        })
        this.data.mainMessageLists.push(...mainlists);
        this.pageData.curMainMsgCount += mainlists.length;
        this.setData({
          mainMessageLists: this.data.mainMessageLists
        })
      })
    }

    if (e.detail.index === 1 && this.pageData.curOrderCount === 0) {
      wx.showLoading({
        title: '加载预约消息',
      })
      this.getOrderMsgLists().then((orderlists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载预约消息", orderlists);
          },
        })
        this.data.orderMsgLists.push(...orderlists);
        this.pageData.curOrderCount += orderlists.length;
        this.setData({
          orderMsgLists: this.data.orderMsgLists
        })
      })
    }

    if (e.detail.index === 2 && this.pageData.curRentMsgCount === 0) {
      wx.showLoading({
        title: '加载租赁消息'
      })
      this.getRentOrderMsgs().then((orderlists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载租赁消息", orderlists);
          },
        })
        this.data.rentOrderLists.push(...orderlists);
        this.pageData.curRentMsgCount += orderlists.length;
        this.setData({
          rentOrderLists: this.data.rentOrderLists
        })
      })
    }



    //加载系统消息
    if (e.detail.index === 3 && this.pageData.curSysMsgCount === 0) {
      wx.showLoading({
        title: '加载系统消息',
      })
      this.getSysMessageLists().then((syslists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载系统消息", syslists);
          },
        })
        this.data.sysMessageLists.push(...syslists);
        this.pageData.curSysMsgCount += syslists.length;
        this.setData({
          sysMessageLists: this.data.sysMessageLists
        })
      })
      return;
    }


  },
  //获取基本的圈内消息
  async getMainMesssge() {
    let openidRes = await wx.cloud.callFunction({
      name: 'getUserOpenId'
    });

    let mainRes = await db.collection("message").where({
      toUser: openidRes.result,
      type: 'normal'
    }).orderBy("time", "desc").skip(this.pageData.curMainMsgCount).limit(4).get();
    for (let it of mainRes.data) {
      it.time = customFormatTime(it.time);
      it.messageDetail.msgFromType = it.messageDetail.msgFrom === 'talk' ? '钓友圈' : it.messageDetail.msgFrom === 'question' ? '问答圈' : it.messageDetail.msgFrom === 'tipEssays' ? '技巧' : '钓点';
    }
    if (mainRes.data.length < 4) {
      this.setData({
        hasMoreMainMsg: false
      })
    }
    return mainRes.data;
  },
  // 获取系统消息
  async getSysMessageLists() {
    let useropenid = wx.getStorageSync("userOpenId");
    if (!useropenid) {
      let openidRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      useropenid = openidRes.result;
    }


    let datares = await db.collection("message").where({
      toUser: useropenid,
      type: 'system'
    }).orderBy("time", "desc").skip(this.pageData.curSysMsgCount).limit(4).get();
    for (let it of datares.data) {
      if (it.status === 'progress') {
        wx.cloud.callFunction({
          name: 'updateMsgStatus',
          data: {
            messageId: it._id
          }
        }).then((updateRes) => {
          //更新home页面的消息数，messageDetail的上个page：home
          // this.pageData.homePageThis.setData({
          //   inProgressCount: this.pageData.homePageThis.data.inProgressCount - 1
          // })
          console.log("阅读系统消息:", updateRes.result)
        });

      }
      it.time = customFormatTime(it.time);
      it.messageDetail.msgFromType = "系统消息";
    }

    if (datares.data.length < 4) {
      this.setData({
        hasMoreSysMsg: false
      })
    }

    return datares.data;

  },
  //获取预约消息
  async getOrderMsgLists() {
    let openid = wx.getStorageSync('userOpenId');
    if (!openid) {
      let openidRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openidRes.result;
    }

    let oRes = await db.collection("message").where({
      toUser: openid,
      type: 'locOrder'
    }).orderBy("time", "desc").skip(this.pageData.curOrderCount).limit(4).get();
    for (let it of oRes.data) {
      it.time = customFormatTime(it.time);
      it.messageDetail.msgFromType = "预约消息";
    }

    if (oRes.data.length < 4) {
      this.setData({
        hasMoreOrderMsg: false
      })
    }
    return oRes.data;
  },
  //获取租赁消息
  async getRentOrderMsgs() {
    let openid = wx.getStorageSync('userOpenId');
    if (!openid) {
      let openidRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openidRes.result;
    }
    let rentMsgRes = await db.collection("message").where({
      type: 'equipOrder',
      toUser: openid
    }).orderBy("time", "desc").skip(this.pageData.curRentMsgCount).limit(4).get();
    for (let it of rentMsgRes.data) {
      it.time = customFormatTime(it.time);
    }

    if (rentMsgRes.data.length < 4) {
      this.setData({
        hasMoreRentMsg: false
      })
    }
    return rentMsgRes.data;
  },
  // 下拉刷新
  onPullDownRefresh() {
    this.pageData.curMainMsgCount = 0;
    this.pageData.curOrderCount = 0;
    this.pageData.curRentMsgCount = 0;
    this.pageData.curSysMsgCount = 0;

    this.setData({
      mainMessageLists: [],
      sysMessageLists: [],
      orderMsgLists: [],
      rentOrderLists: [],
      hasMoreSysMsg: true,
      hasMoreMainMsg: true,
      hasMoreOrderMsg: true,
      hasMoreRentMsg: true
    }, () => {
      if (this.pageData.curTabIdx === 0) {
        wx.showLoading({
          title: '刷新圈子消息',
        })
        //刷新圈内消息
        this.getMainMesssge().then((msglists) => {
          wx.stopPullDownRefresh({
            success: (res) => {},
          })
          wx.hideLoading({
            success: (res) => {
              console.log("刷新圈内消息成功");
            },
          })
          this.pageData.curMainMsgCount += msglists.length;
          this.data.mainMessageLists.push(...msglists);
          this.setData({
            mainMessageLists: this.data.mainMessageLists
          })
        });
        return;
      }
      if (this.pageData.curTabIdx === 1) {
        wx.showLoading({
          title: '刷新预约消息'
        })
        this.getOrderMsgLists().then((orderlists) => {
          wx.stopPullDownRefresh({
            success: (res) => {},
          })
          wx.hideLoading({
            success: (res) => {
              console.log("刷新预约消息", orderlists);
            },
          })
          this.data.orderMsgLists.push(...orderlists);
          this.pageData.curOrderCount += orderlists.length;
          this.setData({
            orderMsgLists: this.data.orderMsgLists
          })
        })
      }
      if (this.pageData.curTabIdx === 2) {
        wx.showLoading({
          title: '刷新租赁消息'
        })
        this.getRentOrderMsgs().then((orderlists) => {
          wx.stopPullDownRefresh({
            success: (res) => {},
          })
          wx.hideLoading({
            success: (res) => {
              console.log("刷新租赁消息", orderlists);
            },
          })
          this.data.rentOrderLists.push(...orderlists);
          this.pageData.curRentMsgCount += orderlists.length;
          this.setData({
            rentOrderLists: this.data.rentOrderLists
          })
        })
      }
      if (this.pageData.curTabIdx === 3) {
        wx.showLoading({
          title: '刷新系统消息',
        })
        //刷新系统消息
        this.getSysMessageLists().then((syslists) => {
          wx.stopPullDownRefresh({
            success: (res) => {},
          })
          wx.hideLoading({
            success: (res) => {
              console.log("刷新系统消息成功", syslists);
            },
          })
          this.pageData.curSysMsgCount += syslists.length;
          this.data.sysMessageLists.push(...syslists);
          this.setData({
            sysMessageLists: this.data.sysMessageLists
          })
        });

      }
    })



  },
  //触底加载更多
  onReachBottom() {
    if (this.data.hasMoreMainMsg && this.pageData.curTabIdx === 0) {
      wx.showLoading({
        title: '更多圈子消息',
      })
      this.getMainMesssge().then((lists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载更多圈子消息成功", lists);
          },
        });
        if (lists.length === 0 || lists.length < 4) {
          this.setData({
            hasMoreMainMsg: false
          })
        }
        this.data.mainMessageLists.push(...lists);
        this.pageData.curMainMsgCount += lists.length;
        this.setData({
          mainMessageLists: this.data.mainMessageLists
        })
      })
      return;
    }

    if (this.data.hasMoreOrderMsg && this.pageData.curTabIdx === 1) {
      wx.showLoading({
        title: '更多预约消息'
      })
      this.getOrderMsgLists().then((orderlists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("更多预约消息", orderlists);
          },
        })
        this.data.orderMsgLists.push(...orderlists);
        this.pageData.curOrderCount += orderlists.length;
        this.setData({
          orderMsgLists: this.data.orderMsgLists
        })
      })
    }
    if (this.data.hasMoreRentMsg && this.pageData.curTabIdx === 2) {
      wx.showLoading({
        title: '更多租赁消息'
      })
      this.getRentOrderMsgs().then((orderlists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("更多租赁消息", orderlists);
          },
        })
        this.data.rentOrderLists.push(...orderlists);
        this.pageData.curRentMsgCount += orderlists.length;
        this.setData({
          rentOrderLists: this.data.rentOrderLists
        })
      })
    }

    if (this.data.hasMoreSysMsg && this.pageData.curTabIdx === 3) {
      wx.showLoading({
        title: '更多系统消息',
      })
      this.getSysMessageLists().then((lists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载更多系统消息成功", lists);
          },
        });
        if (lists.length === 0 || lists.length < 4) {
          this.setData({
            hasMoreSysMsg: false
          })
        }
        this.data.sysMessageLists.push(...lists);
        this.pageData.curSysMsgCount += lists.length;
        this.setData({
          sysMessageLists: this.data.sysMessageLists
        })
      })
    }



  },
  async updateMsgStatus(mId) {
    return await wx.cloud.callFunction({
      name: 'updateMsgStatus',
      data: {
        messageId: mId
      }
    });
  },
  //圈内消息
  toMsgDetail(e) {
    let that = this;
    let statStr = e.currentTarget.dataset.msgStatus; //消息是否需要更新状态
    let msgIdx = e.currentTarget.dataset.msgIndex; //第几个消息，为了更新已读
    let msgId = e.currentTarget.dataset.msgId; //消息的_id，更新status db.colletion.update
    let msgDetail = e.currentTarget.dataset.sourceInfo;
    let tarPage = msgDetail.msgFrom === 'talk' ? '/pages/talk/talkDetail/talkDetail?talkId=' : msgDetail.msgFrom === 'question' ? '/pages/talk/questionDetail/questionDetail?questionId=' : '/pages/tip/tipEssayDetail/tipEssayDetail?tipEssayId=';
    if (msgDetail.msgFrom === 'anglerLoc') {
      tarPage = "/pages/service/locDetail/locDetail?locId=";
    }
    console.log(tarPage);
    let pageDataId = msgDetail.msgFromId;
    wx.navigateTo({
      url: tarPage + pageDataId,
      events: {
        receiveEvent(da) {
          console.log("messageDetail接受:", da);
        }
      },
      success: (res) => {
        if (statStr === 'progress') {
          that.updateMsgStatus(msgId).then((res) => {
            console.log("更新消息状态成功", res.result);
            that.replaceDataOnPath(['mainMessageLists', msgIdx, 'status'], 'finish');
            that.applyDataUpdates();
          });

        }
        //附加的评论信息给nav目标页
        // if (msgDetail.commentId) {
        //   res.eventChannel.emit('receiveData', {
        //     data: msgDetail.commentId
        //   });
        // }
        console.log("nav success");
      }
    })

  },
  toLocDetail(e) {
    let that = this;
    let msgDetail = e.currentTarget.dataset.msgDetail;
    let msgStatus = e.currentTarget.dataset.msgStatus;
    let msgId = e.currentTarget.dataset.msgId;
    let msgIdx = e.currentTarget.dataset.msgIndex;
    wx.navigateTo({
      url: '../myOrder/orderLocDetail/orderLocDetail?oId=' + msgDetail.msgFromId,
      success() {
        if (msgStatus === 'progress') {
          //更新已读
          that.updateMsgStatus(msgId).then((res) => {
            console.log("更新消息状态成功", res.result);

            that.replaceDataOnPath(['orderMsgLists', msgIdx, 'status'], 'finish');
            that.applyDataUpdates();
            // that.pageData.homePageThis.setData({
            //   inProgressCount: that.pageData.homePageThis.data.inProgressCount - 1
            // })
          });

        }

      }
    })
  },
  //租赁详情
  toRentDetail(e) {
    let that = this;
    let msgDetail = e.currentTarget.dataset.msgDetail;
    let msgStatus = e.currentTarget.dataset.msgStatus;
    let msgId = e.currentTarget.dataset.msgId;
    let msgIdx = e.currentTarget.dataset.msgIndex;
    wx.navigateTo({
      url: '../myRent/rentOrderDetail/rentOrderDetail?rentId=' + msgDetail.msgFromId,
      success() {
        if (msgStatus === 'progress') {
          //更新已读
          that.updateMsgStatus(msgId).then((res) => {
            console.log("更新消息状态成功", res.result);

            that.replaceDataOnPath(['rentOrderLists', msgIdx, 'status'], 'finish');
            that.applyDataUpdates();
            // that.pageData.homePageThis.setData({
            //   inProgressCount: that.pageData.homePageThis.data.inProgressCount - 1
            // })
          });

        }

      }
    })
  }


})