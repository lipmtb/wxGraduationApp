// miniprogram/pages/home/myOrder/myOrder.js
const db = wx.cloud.database();
const _=db.command;
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

    if(e.detail.index===1&&this.pageData.curBookCount===0){
      wx.showLoading({
        title: '加载预约订单',
      })
      this.getBookLists().then((booklists)=>{
        wx.hideLoading({
          success: (res) => {},
        })
        this.pageData.curBookCount+=booklists.length;
        this.pageData.curBookLists.push(...booklists);
        this.setData({
          bookLists:this.pageData.curBookLists
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
      _openid: openid
    }).skip(this.pageData.curOrderCount).limit(4).get();
    for (let od of oRes.data) {
      od.orderTime = od.orderTime.toLocaleString();
    }
    return oRes.data;
  },
  //获取预约订单
  async getBookLists(){
    let openid = wx.getStorageSync("userOpenId");
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let locOrderMsg=await db.collection("message").where({
      type:'locOrder',
      toUser:openid
    }).get();

    let orderIdArr=[];
    for(let msg of locOrderMsg.data){
      orderIdArr.push(msg.messageDetail.msgFromId);
    }
    let locOrder=await db.collection("orderLoc").where({
      _id:_.in(orderIdArr)
    }).skip(this.pageData.curBookCount).limit(4).get();

    for (let od of locOrder.data) {
      od.orderTime = od.orderTime.toLocaleString();
      let opRes=await db.collection("angler").where({
        _openid:od._openid
      }).get();
      od.fromUser=opRes.data[0];
    }

    return locOrder.data;
  },
  //更多预约
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
  //取消预约
  onClose(e) {
    console.log(e);
    let that = this;
    let oInfo = e.currentTarget.dataset.orderInfo;
    let oIdx = e.currentTarget.dataset.orderIdx;
    const {
      position,
      instance
    } = e.detail;
    wx.showModal({
      title: '取消预约',
      content: '确定要取消到' + oInfo.orderLocName + "的预约",
      success: (res) => {
        if (res.confirm) {
          let oid = oInfo._id;
          db.collection("orderLoc").doc(oid).remove().then((rmres) => {
            console.log("取消预约", rmres);
            wx.showToast({
              title: '取消预约成功'
            });
            that.pageData.curOrderLists.splice(oIdx, 1);
            that.pageData.curOrderCount -= 1;
            that.setData({
              orderLocLists: that.pageData.curOrderLists
            });
            that.pageData.homePageThis.setData({
              orderCount: that.pageData.homePageThis.data.orderCount - 1
            })
          })
        }
        instance.close();
      }
    })

  },
  //去钓点详情页面
  toOrderDetail(e) {
    let posId = e.currentTarget.dataset.locId;
    wx.navigateTo({
      url: '/pages/service/locDetail/locDetail?locId=' + posId,
    })
  },
  toBookDetail(e){
    let bookId=e.currentTarget.dataset.bookId;
    wx.navigateTo({
      url: 'orderLocDetail/orderLocDetail?oId='+bookId
    })
  }
})