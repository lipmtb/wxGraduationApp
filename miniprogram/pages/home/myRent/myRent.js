// miniprogram/pages/home/myRent/myRent.js
const db = wx.cloud.database();
const _ = db.command;
const $ = _.aggregate;
import customFormatTime from '../../../util/customTime.js';
Page({
  pageData: {
    curTabIdx: 0, //在那个tab,下拉刷新使用
    rentOrderLists: [],
    curOrderCount: 0,
    hasMoreOrder: true,
    rentMsgLists: [],
    curRentMsgCount: 0,
    hasMoreRentMsg: true
  },
  data: {
    curActive: 0
  },
  onLoad: function (options) {
    let that = this;
    wx.setNavigationBarTitle({
      title: '装备租赁',
    })
    let eventChannel = this.getOpenerEventChannel();
    eventChannel.on("orderPageFn", (homethis) => {
      that.pageData.homePageThis = homethis;
      console.log(homethis);
    })
    this.getMyOrderLists().then((lists) => {
      this.pageData.curOrderCount += lists.length;
      this.pageData.rentOrderLists.push(...lists);
      this.setData({
        rentOrderLists: this.pageData.rentOrderLists
      })
    })
  },
  onChangeTab(e) {
    console.log("tab change", e.detail);
    this.pageData.curTabIdx = e.detail.index;
    if (e.detail.index === 0 && this.pageData.curOrderCount === 0) {
      wx.showLoading({
        title: '我的租赁'
      })
      this.getMyOrderLists().then((lists) => {
        wx.hideLoading({
          success: (res) => {},
        })
        this.pageData.curOrderCount += lists.length;
        this.pageData.rentOrderLists.push(...lists);
        this.setData({
          rentOrderLists: this.pageData.rentOrderLists
        })
      })
      return;
    }
    if (e.detail.index === 1 && this.pageData.curRentMsgCount === 0) {
      wx.showLoading({
        title: '租赁消息'
      })
      this.getRentMsgLists().then((eqlists) => {
        wx.hideLoading({
          success: (res) => {},
        })
        this.pageData.curRentMsgCount += eqlists.length;
        this.pageData.rentMsgLists.push(...eqlists);
        this.setData({
          rentMsgLists: this.pageData.rentMsgLists
        })
      })
    }
  },
  //获取我的租赁信息
  async getMyOrderLists() {
    let openid = wx.getStorageSync("userOpenId");
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let oRes = await db.collection("rentEquip").where({
      _openid: openid,
      orderStatus: _.nor(_.eq('unconfirmed'))  //被删除的即为unconfirmed
    }).orderBy("rentTime","desc").skip(this.pageData.curOrderCount).limit(4).get();

    for (let rentItem of oRes.data) {
      rentItem.rentTime=customFormatTime(rentItem.rentTime);
      rentItem.rentStartTime = rentItem.rentStartTime.toLocaleDateString();
      rentItem.rentEndTime = rentItem.rentEndTime.toLocaleDateString();
      let rentEquipRes = await db.collection("equip").where({
        _id: rentItem.rentEquipId
      }).get();
      if (rentEquipRes.data.length > 0) {
        rentItem.equipInfo = rentEquipRes.data[0];
      }

    }
    return oRes.data;
  },
  //获取租赁消息
  async getRentMsgLists() {
    let openid = wx.getStorageSync("userOpenId");
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }

    //获取租赁type=equipOrder消息
    let equipOrderMsg = await db.collection("message").where({
      type: 'equipOrder',
      toUser: openid
    }).orderBy("time", "desc").skip(this.pageData.curRentMsgCount).limit(4).get();
    for(let msItem of equipOrderMsg.data){
      msItem.time=customFormatTime(msItem.time);
    }
    return equipOrderMsg.data;

  },
  //更多我的租赁
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
        title: '更多租赁信息'
      });
      this.getMyOrderLists().then((datalists) => {
        wx.hideLoading({
          success: (res) => {},
        });
        if (datalists.length === 0 || datalists.length < 4) {
          that.pageData.hasMoreOrder = false;
        }
        that.pageData.rentOrderLists.push(...datalists);
        that.pageData.curOrderCount += datalists.length;
        that.setData({
          rentOrderLists: that.pageData.rentOrderLists
        })
      });
    }


  },
  //更多租赁消息
  moreOrderEquip() {
    let that = this;
    if (!that.pageData.hasMoreRentMsg) {
      wx.showToast({
        title: '没有更多了'
      });
      return;
    }
    if (that.pageData.hasMoreRentMsg) {
      wx.showLoading({
        title: '更多租赁消息'
      });
      this.getRentMsgLists().then((datalists) => {
        wx.hideLoading({
          success: (res) => {},
        });
        if (datalists.length === 0 || datalists.length < 4) {
          that.pageData.hasMoreRentMsg = false;
        }
        that.pageData.rentMsgLists.push(...datalists);
        that.pageData.curRentMsgCount += datalists.length;
        that.setData({
          rentMsgLists: that.pageData.rentMsgLists
        })
      });
    }
  },
  //取消租赁的消息发给装备发布者
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
    let cancelUser = cancelUserRes.data[0]; //取消者
    let toUserRes = await db.collection("equip").doc(orderInfo.rentEquipId).get(); //消息 接收者，即直装备发布者

    let msgDetail = {
      msgFrom: 'rentEquip',
      msgFromId: orderInfo._id,
      msgContent: cancelUser.tempNickName + "取消了装备：" + toUserRes.data.equipName + "的租赁"
    }
    return await wx.cloud.callFunction({
      name: "createOrderMsg",
      data: {
        toUser: toUserRes.data._openid,
        msgDetail: msgDetail,
        type: "equipOrder"
      }
    });
  },
  //取消租赁
  onClose(e) {
    // console.log(e);
    let that = this;
    let oInfo = e.currentTarget.dataset.orderInfo; //租赁订单
    let oIdx = e.currentTarget.dataset.orderIdx;
    const {
      instance
    } = e.detail;
    wx.showModal({
      title: '取消租赁',
      content: '确定要取消装备:' + oInfo.equipInfo.equipName + "的租赁？",
      success: (res) => {
        if (res.confirm) {

          db.collection("rentEquip").doc(oInfo._id).update({
            data: {
              orderStatus: 'cancel'
            }
          }).then((rmres) => {
            console.log("取消租赁", rmres);
            that.createCancelOrderMsg(oInfo);
            that.replaceDataOnPath(['rentOrderLists',oIdx,'orderStatus'],"cancel");
            that.applyDataUpdates();
            wx.showToast({
              title: '取消租赁成功'
            });

          })
        }
        instance.close();
      }
    })

  },
  //删除租赁
  onCloseDeleteRent(e) {

    let that = this;
    let oInfo = e.currentTarget.dataset.orderInfo; //租赁订单
    let oIdx = e.currentTarget.dataset.orderIdx; //第几条
    const {
      instance
    } = e.detail;
    wx.showModal({
      title: '删除租赁',
      content: '确定要删除？删除后不能在我的租赁看到它',
      success: (res) => {
        if (res.confirm) {

          db.collection("rentEquip").doc(oInfo._id).update({
            data: {
              orderStatus: 'unconfirmed'
            }
          }).then((rmres) => {
            console.log("删除我的租赁", rmres);
            that.data.rentOrderLists.splice(oIdx, 1);
            that.pageData.curOrderCount -= 1;
            that.setData({
              rentOrderLists: that.data.rentOrderLists
            })
            wx.showToast({
              title: '删除成功'
            });

          })
        }
        instance.close();
      }
    })

  },
  toRentEquipDetail(e) {
    let that=this;
    let rentId = e.currentTarget.dataset.rentId;
    let mId = e.currentTarget.dataset.msgId;
    let msgStatus = e.currentTarget.dataset.msgStatus;
    let idx = e.currentTarget.dataset.itemIdx;
    wx.navigateTo({
      url: 'rentOrderDetail/rentOrderDetail?rentId=' + rentId,
      success(reschannel) {
    
        if (msgStatus === "progress") {
          wx.cloud.callFunction({
            name: 'updateMsgStatus',
            data: {
              messageId: mId
            }
          }).then((res) => {
            that.pageData.homePageThis.setData({
              rentEquipCount: that.pageData.homePageThis.data.rentEquipCount - 1,
              inProgressCount:that.pageData.homePageThis.data.inProgressCount-1
            })
            that.replaceDataOnPath(['rentMsgLists',idx,'status'],'finish');
            that.applyDataUpdates();
            console.log("更新消息已读", res.result);
          })
        }

      }
    })
  
  },
  onPullDownRefresh() {
    if (this.pageData.curTabIdx === 0) {
      this.pageData.rentOrderLists = [];
      this.pageData.curOrderCount = 0;
      this.pageData.hasMoreOrder = true;
      wx.showLoading({
        title: '刷新我的租赁'
      })
      this.getMyOrderLists().then((lists) => {
        wx.hideLoading({
          success: (res) => {
            wx.stopPullDownRefresh({
              success: (res) => {},
            })
          },
        })
        this.pageData.curOrderCount += lists.length;
        this.pageData.rentOrderLists.push(...lists);
        this.setData({
          rentOrderLists: this.pageData.rentOrderLists
        })
      })
    }
    if (this.pageData.curTabIdx === 1) {
      this.pageData.rentMsgLists = [];
      this.pageData.curRentMsgCount = 0;
      this.pageData.hasMoreRentMsg = true;
      wx.showLoading({
        title: '刷新租赁消息',
      })
      this.getRentMsgLists().then((eqlists) => {
        wx.hideLoading({
          success: (res) => {
            wx.stopPullDownRefresh({
              success: (res) => {},
            })
          },
        })
        this.pageData.curRentMsgCount += eqlists.length;
        this.pageData.rentMsgLists.push(...eqlists);
        this.setData({
          rentMsgLists: this.pageData.rentMsgLists
        })
      })
    }
  }


})