// miniprogram/pages/home/myRent/myRent.js
const db = wx.cloud.database();
const _ = db.command;
const $ = _.aggregate;
Page({
  pageData: {
    rentOrderLists: [],
    curOrderCount: 0,
    hasMoreOrder: true,
    equipRentLists: [],
    curEquipRentCount: 0,
    hasMoreEquipRent: true
  },
  data: {
    curActive: 0
  },
  onLoad: function (options) {
    let that = this;
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
    if (e.detail.index === 1 && this.pageData.curEquipRentCount === 0) {
      wx.showLoading({
        title: '租赁订单'
      })
      this.getEquipRentLists().then((eqlists) => {
        wx.hideLoading({
          success: (res) => {},
        })
        this.pageData.curEquipRentCount += eqlists.length;
        this.pageData.equipRentLists.push(...eqlists);
        this.setData({
          equipRentLists: this.pageData.equipRentLists
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
      _openid: openid
    }).skip(this.pageData.curOrderCount).limit(4).get();

    for (let rentItem of oRes.data) {
      rentItem.rentStartTime = rentItem.rentStartTime.toLocaleDateString();
      rentItem.rentEndTime = rentItem.rentEndTime.toLocaleDateString();
      let rentEquipRes = await db.collection("equip").doc(rentItem.rentEquipId).get();
      rentItem.equipInfo = rentEquipRes.data;
    }
    return oRes.data;
  },
  //获取租赁订单:由租赁message：type=equipOrder 的messageDetail.msgFrom可知道订单数组，通过数组where.in(arr)
  async getEquipRentLists() {
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
    }).get();

    let rentOrderIdArr = [];
    for (let it of equipOrderMsg.data) {
      rentOrderIdArr.push(it.messageDetail.msgFromId); //租赁订单rentEquip._id
    }
    //获取租赁订单
    let equipOrderRes = await db.collection("rentEquip").where({
      _id: _.in(rentOrderIdArr)
    }).skip(this.pageData.curEquipRentCount).limit(4).get();

    //获取订单的来源装备信息
    for (let eq of equipOrderRes.data) {
      let eqInfoRes = await db.collection("equip").doc(eq.rentEquipId).get();
      eq.rentStartTime = eq.rentStartTime.toLocaleDateString();
      eq.rentEndTime = eq.rentEndTime.toLocaleDateString();
      eq.equipInfo = eqInfoRes.data;
    }
    return equipOrderRes.data;

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
  //更多租赁订单
  moreOrderEquip() {
    let that = this;
    if (!that.pageData.hasMoreEquipRent) {
      wx.showToast({
        title: '没有更多了'
      });
      return;
    }
    if (that.pageData.hasMoreEquipRent) {
      wx.showLoading({
        title: '更多订单'
      });
      this.getEquipRentLists().then((datalists) => {
        wx.hideLoading({
          success: (res) => {},
        });
        if (datalists.length === 0 || datalists.length < 4) {
          that.pageData.hasMoreEquipRent = false;
        }
        that.pageData.equipRentLists.push(...datalists);
        that.pageData.rentEquipCount += datalists.length;
        that.setData({
          equipRentLists: that.pageData.equipRentLists
        })
      });
    }
  },
  //取消租赁
  onClose(e) {
    console.log(e);
    let that = this;
    let oInfo = e.currentTarget.dataset.orderInfo; //租赁订单
    let oIdx = e.currentTarget.dataset.orderIdx;
    const {
      position,
      instance
    } = e.detail;
    wx.showModal({
      title: '取消预约',
      content: '确定要取消装备:' + oInfo.equipInfo.equipName + "的预约",
      success: (res) => {
        if (res.confirm) {

          db.collection("rentEquip").doc(oInfo._id).remove().then((rmres) => {
            console.log("取消预约", rmres);
            wx.showToast({
              title: '取消预约成功'
            });
            that.pageData.rentOrderLists.splice(oIdx, 1);
            that.pageData.curOrderCount -= 1;
            that.setData({
              rentOrderLists: that.pageData.rentOrderLists
            });
            that.pageData.homePageThis.setData({
              rentEquipCount: that.pageData.homePageThis.data.rentEquipCount - 1
            })
          })
        }
        instance.close();
      }
    })

  },
  //去租赁装备页
  toOrderDetail(e) {
    let equipId = e.currentTarget.dataset.equipId;
    wx.navigateTo({
      url: '/pages/service/equipService/equipDetail/equipDetail?equipId=' + equipId,
    })
  },
  toRentEquipDetail(e) {
    let rentId = e.currentTarget.dataset.rentId;
    wx.navigateTo({
      url: 'rentOrderDetail/rentOrderDetail?rentId='+rentId
    })
  }
})