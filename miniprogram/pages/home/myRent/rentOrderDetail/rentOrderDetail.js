// miniprogram/pages/home/myRent/rentOrderDetail/rentOrderDetail.js
const db=wx.cloud.database();
Page({

  data: {

  },
  onLoad(options){
    console.log(options);
    this.getRentOrderDetail().then(([rentOrder,equipInfo])=>{
      if(equipInfo.length>0){
        this.setData({
          equipInfo:equipInfo[0]
        })
      }
      this.setData({
        rentOrder:rentOrder
      })
      
       
    });
  },
  //获取订单详情（包括订单来源的equip）
  async getRentOrderDetail(){
    //rentId来自myRent.js的toRentEquipDetail  
    let rentRes=await db.collection("rentEquip").doc(this.options.rentId).get();
    let equipRes=await db.collection("equip").where({
      _id:rentRes.data.rentEquipId
    }).get();
    rentRes.data.rentStartTime=rentRes.data.rentStartTime.toLocaleDateString();
    rentRes.data.rentEndTime=rentRes.data.rentEndTime.toLocaleDateString();
    return [rentRes.data,equipRes.data];
  },
  //查看装备详情
  toEquipDetail(e){
    let equipId=e.currentTarget.dataset.equipId;
    console.log(equipId);

    wx.navigateTo({
      url: '/pages/service/equipService/equipDetail/equipDetail?equipId='+equipId,
    })
  }
})