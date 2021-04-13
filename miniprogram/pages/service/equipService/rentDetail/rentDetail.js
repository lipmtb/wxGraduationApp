// miniprogram/pages/service/equipService/rentDetail/rentDetail.js
const db = wx.cloud.database();
let template_id = 'uMBavbmSSxRegKG4prOU9l1vbDFJiwvMrvzb22cAICo';
Page({
  pageData: {
    ownerInfo: {}, //装备发布者信息
    rentItemData: '', //租赁订单
    rentEquip: '' //租赁的装备信息
  },
  data: {
    btnEnabled: true //默认数据未加载完成不能点击按钮
  },
  onLoad(options) {
    let that = this;
    this.getRentInfo().then((rentres) => {
      that.pageData.rentItemData = rentres;
      that.getRentOwnerInfo(rentres).then((equip) => {
        that.pageData.rentEquip = equip;
        console.log(equip);
        that.setData({
          btnEnabled: false, //按钮可以点击了
          rentEquipName: equip.equipName,
          ownerName: that.pageData.ownerInfo.tempNickName,
          address: rentres.rentAddress,
          related: rentres.related,
          rentStartTime: rentres.rentStartTime.toLocaleDateString(),
          rentEndTime: rentres.rentEndTime.toLocaleDateString()
        })
      })

    })
  },
  //获取租赁订单
  async getRentInfo() {
    let rentId = this.options.rentId;
    let rentInfo = await db.collection("rentEquip").doc(rentId).get();

    return rentInfo.data;

  },
  //根据租赁订单获取租赁的物品详情(物品和主人信息)
  async getRentOwnerInfo(rent) {
    let eId = rent.rentEquipId;
    let eRes = await db.collection("equip").doc(eId).get();
    let ownerRes = await db.collection("angler").where({
      _openid: eRes.data._openid
    }).get();
    this.pageData.ownerInfo = ownerRes.data[0];
    return eRes.data;
  },
  //更新租赁订单的状态：unconfirm改为progress
  updateRentStatus() {
    return db.collection("rentEquip").doc(this.options.rentId).update({
      data: {
        orderStatus: 'progress'
      }
    })
  },
  //发送租用提醒给物品主人
  confirmRentAndSendMsg() {
    let that = this;
    let owner = this.pageData.ownerInfo; //接收消息的用户
    let toUser = owner._openid;
    let fromUserName = that.pageData.rentItemData.rentUserName; //租赁的用户名
    let rentEquipName = that.pageData.rentEquip.equipName; //租赁的物品名
    let msgDetail = {
      msgFrom: 'rentEquip',
      msgContent: fromUserName + "想要租你的装备:" + rentEquipName,
      msgFromId: that.options.rentId
    }
    return wx.cloud.callFunction({
      name: 'createOrderMsg',
      data: {
        toUser: toUser,
        msgDetail: msgDetail,
        type: 'equipOrder'
      }
    });

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
  //请求发送订阅消息和租用消息添加，同时更新租用订单状态unconfirmed改为progress
  requestUserSubscription() {
    let that = this;
    console.log("调起客户端小程序订阅消息界面。。。。。");
    wx.requestSubscribeMessage({
      tmplIds: [template_id],
      success(res) { //用户选择了才有结果，否则一直等着
        console.log(res);

        that.confirmRentAndSendMsg().then((sendmsg) => {
          console.log("租赁消息发送物品主人", sendmsg);
          return that.updateRentStatus(); //更新订单为确认状态
        }).then((updateRent) => {
          console.log("更新租赁订单状态", updateRent);
          wx.showToast({
            title: '租用成功'
          })
        }).catch((err) => {
          wx.showToast({
            title: '租用失败'
          })
          console.log("租用失败", err)
        }).finally(() => {
          setTimeout(function () {
            wx.navigateTo({
              url: '../equipDetail/equipDetail?equipId=' + that.pageData.rentEquip._id,
            })
          }, 3000)
        });
        
        if (res[template_id] === "accept") {
          //调用发送模板消息的云函数
          wx.cloud.callFunction({
            name: 'sendRentEquipMsg',
            data: {
              userId: that.pageData.ownerInfo._openid, //所有者_openid
              related: that.pageData.rentItemData.related, //租赁者联系方式
              address: that.pageData.rentItemData.rentAddress, //租赁者地址
              fromUserName: that.pageData.rentItemData.rentUserName, //租赁者昵称
              rentStartTime: that.formattedDateStr(that.pageData.rentItemData.rentStartTime),
              rentEndTime: that.formattedDateStr(that.pageData.rentItemData.rentEndTime),
              rentId: that.options.rentId
            }
          }).then((res) => {
            console.log("云函数调用成功：", res);
          }).catch((err) => {
            console.log("云函数调用失败:", err);
          })
        }
      },
      fail(err) {
        console.log("request失败", err)
      },
      complete() {
        console.log("request  complete");
      }
    })
   
   
    
  }


})