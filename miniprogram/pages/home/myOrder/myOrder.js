// miniprogram/pages/home/myOrder/myOrder.js
const db = wx.cloud.database();
const _ = db.command;
import customFormatTime from '../../../util/customTime.js';
Page({
  pageData: {
    curOrderLists: [],
    curOrderCount: 0,
    hasMoreOrder: true,
    curBookLists: [],
    curBookCount: 0,
    hasMoreBook: true
  },
  data: {
    curActive: 0

  },
  onLoad: function (options) {
    let that = this;
    wx.setNavigationBarTitle({
      title: '钓点预约',
    })
    let eventChannel = this.getOpenerEventChannel();
    eventChannel.on("orderPageFn", (homethis) => {
      that.pageData.homePageThis = homethis;
      console.log(homethis);
    })
    this.getMyOrderLists().then((lists) => {
      this.pageData.curOrderCount += lists.length;
      this.pageData.curOrderLists.push(...lists);
      this.setData({
        orderLocLists: this.pageData.curOrderLists
      })
    })
  },
  onTabChange(e) {
    this.setData({
      curActive: e.detail.index
    })
    if (e.detail.index === 0 && this.pageData.curOrderCount === 0) {

      wx.showLoading({
        title: '加载我的预约',
      })
      this.getMyOrderLists().then((lists) => {
        wx.hideLoading({
          success: (res) => {},
        })
        this.pageData.curOrderCount += lists.length;
        this.pageData.curOrderLists.push(...lists);
        this.setData({
          orderLocLists: this.pageData.curOrderLists
        })
      })
      return;
    }

    if (e.detail.index === 1 && this.pageData.curBookCount === 0) {
      wx.showLoading({
        title: '加载预约消息',
      })
      this.getBookLists().then((booklists) => {
        wx.hideLoading({
          success: (res) => {},
        })
        this.pageData.curBookCount += booklists.length;
        this.pageData.curBookLists.push(...booklists);
        this.setData({
          bookLists: this.pageData.curBookLists
        })
      })
    }
  },
  //获取我的钓点预约
  async getMyOrderLists() {
    let openid = wx.getStorageSync("userOpenId");
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let oRes = await db.collection("orderLoc").where({
      _openid: openid,
      orderStatus: _.nor(_.eq('unconfirmed'))
    }).orderBy("createTime", "desc").skip(this.pageData.curOrderCount).limit(4).get();
    for (let od of oRes.data) {
      od.createTime = customFormatTime(od.createTime);
      od.orderTime = od.orderTime.toLocaleString();
    }
    return oRes.data;
  },
  //获取预约消息
  async getBookLists() {
    let openid = wx.getStorageSync("userOpenId");
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let locOrderMsg = await db.collection("message").where({
      type: 'locOrder',
      toUser: openid
    }).orderBy("time", "desc").skip(this.pageData.curBookCount).limit(4).get();
    for (let oMsg of locOrderMsg.data) {
      oMsg.time = customFormatTime(oMsg.time);
    }
    return locOrderMsg.data;
  },
  //更多我的预约
  showMoreOrders() {
    let that = this;
    if (!that.pageData.hasMoreOrder) {
      wx.showToast({
        title: '没有更多了'
      });
      return;
    }
    if (that.pageData.hasMoreOrder) {
      wx.showLoading({
        title: '更多预约'
      });
      this.getMyOrderLists().then((datalists) => {
        wx.hideLoading({
          success: (res) => {},
        });
        if (datalists.length === 0 || datalists.length < 4) {
          that.pageData.hasMoreOrder = false;
        }
        that.pageData.curOrderLists.push(...datalists);
        that.pageData.curOrderCount += datalists.length;
        that.setData({
          orderLocLists: that.pageData.curOrderLists
        })
      });
    }


  },
  //更多预约消息
  showMoreBooks() {
    let that = this;
    if (!that.pageData.hasMoreBook) {
      wx.showToast({
        title: '没有更多了'
      });
      return;
    }
    if (that.pageData.hasMoreBook) {
      wx.showLoading({
        title: '更多预约消息'
      });
      this.getBookLists().then((datalists) => {
        wx.hideLoading({
          success: (res) => {},
        });
        if (datalists.length === 0 || datalists.length < 4) {
          that.pageData.hasMoreBook = false;
        }
        that.pageData.curBookLists.push(...datalists);
        that.pageData.curBookCount += datalists.length;
        that.setData({
          bookLists: that.pageData.curBookLists
        })
      });
    }


  },
  //取消预约的消息发给钓点发布者
  async createCancelOrderMsg(orderInfo) {
    let openid = wx.getStorageSync('userOpenId');
    if (!openid) {
      let oRes = await wx.cloud.callFunction({
        name: "getUserOpenId"
      });
      openid = oRes.result;
    }
    let cancelUserRes = await db.collection("angler").where({
      _openid: openid
    }).get();
    let cancelUser = cancelUserRes.data[0];
    let toUserRes = await db.collection("anglerLoc").doc(orderInfo.orderLocId).get(); //消息 接收者，即钓点发布者

    let msgDetail = {
      msgFrom: 'orderLoc',
      msgFromId: orderInfo._id,
      msgContent: cancelUser.tempNickName + "取消了钓点：" + toUserRes.data.locName + "的预约"
    }
    return await wx.cloud.callFunction({
      name: "createOrderMsg",
      data: {
        toUser: toUserRes.data._openid,
        msgDetail: msgDetail,
        type: "locOrder"
      }
    });
  },
  //取消预约
  onClose(e) {
    // console.log(e);
    let that = this;
    let oInfo = e.currentTarget.dataset.orderInfo;
    let oIdx = e.currentTarget.dataset.orderIdx;
    const {
      instance
    } = e.detail;
    wx.showModal({
      title: '取消预约',
      content: '确定要取消钓点：' + oInfo.orderLocName + "的预约",
      success: (res) => {
        if (res.confirm) {
          let oid = oInfo._id;
          db.collection("orderLoc").doc(oid).update({
            data: {
              orderStatus: 'cancel'
            }
          }).then((rmres) => {
            console.log("取消预约", rmres);
            that.createCancelOrderMsg(oInfo);
            that.replaceDataOnPath(['orderLocLists', oIdx, "orderStatus"], 'cancel');
            that.applyDataUpdates();
            wx.showToast({
              title: '取消预约成功'
            });
        
          })
        }

      },
      complete() {
        instance.close();
      }
    })

  },
  //删除我的预约
  onCloseDeleteOrder(e) {

    let that = this;
    let oInfo = e.currentTarget.dataset.orderInfo;
    let oIdx = e.currentTarget.dataset.orderIdx;
    const {
      instance
    } = e.detail;
    wx.showModal({
      title: '删除我的预约',
      content: '确定要删除到：' + oInfo.orderLocName + "的预约?",
      success: (res) => {
        if (res.confirm) {

          db.collection("orderLoc").doc(oInfo._id).update({
            data: {
              orderStatus: 'unconfirmed'
            }
          }).then((rmres) => {
            console.log("删除", rmres);
            that.pageData.curOrderCount -= 1;
            that.pageData.curOrderLists.splice(oIdx, 1);
            that.setData({
              orderLocLists: that.pageData.curOrderLists
            });

            wx.showToast({
              title: '删除成功'
            });

          })
        }

      },
      complete() {
        instance.close();
      }
    })
  },
  //去我的预约详情页面和 去预约消息详情基本一样
  toOrderDetail(e) {
    let posId = e.currentTarget.dataset.myId;
    wx.navigateTo({
      url: 'orderLocDetail/orderLocDetail?oId=' + posId
    })
  },
  //去预约消息详情
  toBookDetail(e) {
    let that = this;
    let bookId = e.currentTarget.dataset.bookId;
    let mId = e.currentTarget.dataset.msgId;
    let msgStatus = e.currentTarget.dataset.msgStatus;
    let idx = e.currentTarget.dataset.itemIdx;
    wx.navigateTo({
      url: 'orderLocDetail/orderLocDetail?oId=' + bookId,
      success(res) {
    
        if (msgStatus === "progress") {
          wx.cloud.callFunction({
            name: 'updateMsgStatus',
            data: {
              messageId: mId
            }
          }).then((res) => {
            // that.pageData.homePageThis.setData({
            //   orderCount: that.pageData.homePageThis.data.orderCount - 1,
            //   inProgressCount:that.pageData.homePageThis.data.inProgressCount-1
            // })
            that.replaceDataOnPath(['bookLists',idx,'status'],'finish');
            that.applyDataUpdates();
            console.log("更新消息已读", res.result);
          })
        }

      }
    })
  },
  //下拉刷新
  onPullDownRefresh() {
    if (this.data.curActive === 0) {
      this.pageData.curOrderLists = [];
      this.pageData.curOrderCount = 0;
      this.pageData.hasMoreOrder = true;
      wx.showLoading({
        title: '刷新我的预约',
      })
      this.getMyOrderLists().then((lists) => {
        wx.hideLoading({
          success: (res) => {},
        })
        wx.stopPullDownRefresh({
          success: (res) => {},
        })
        this.pageData.curOrderCount += lists.length;
        this.pageData.curOrderLists.push(...lists);
        this.setData({
          orderLocLists: this.pageData.curOrderLists
        })
      })
      return;
    }

    if (this.data.curActive === 1) {
      this.pageData.curBookLists = [];
      this.pageData.curBookCount = 0;
      this.pageData.hasMoreBook = true;
      wx.showLoading({
        title: '刷新预约消息',
      })
      this.getBookLists().then((booklists) => {
        wx.hideLoading({
          success: (res) => {},
        })
        wx.stopPullDownRefresh({
          success: (res) => {},
        })
        this.pageData.curBookCount += booklists.length;
        this.pageData.curBookLists.push(...booklists);
        this.setData({
          bookLists: this.pageData.curBookLists
        })
      })
    }
  }
})