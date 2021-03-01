//钓点预约订单详情
const db=wx.cloud.database();
Page({

  data: {

  },
  onLoad(options){
    console.log(options);
    this.getLocOrderDetail().then((olist)=>{
        this.setData({
          locOrder:olist
        })
    });
  },
  //获取订单详情（包括订单来源的equip）
  async getLocOrderDetail(){
 
    let oRes=await db.collection("orderLoc").doc(this.options.oId).get();//预约订单
    let locRes=await db.collection("anglerLoc").doc(oRes.data.orderLocId).get();//钓点
    let userRes=await db.collection("angler").where({
      _openid:oRes.data._openid
    }).get();//预约者
    oRes.data.fromUserInfo=userRes.data[0];
    oRes.data.locInfo=locRes.data;
    oRes.data.orderTime=oRes.data.orderTime.toLocaleString();

    return oRes.data;
  },
  //查看装备详情
  toLocDetail(e){
    let locId=e.currentTarget.dataset.locId;
 
    wx.navigateTo({
      url: '/pages/service/locDetail/locDetail?locId='+locId
    })
  }
})