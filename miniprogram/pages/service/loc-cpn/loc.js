// pages/service/loc-cpn/loc.js
// 地理信息组件
Component({
  options: {
    multipleSlots: true,
    styleIsolation:"isolated"
  },
  properties: {
    itemData: {
      type: Object,
      value: {}
    }
  },

  methods: {
    // 打开微信内置地图
    onOpenLoc(e){
      let location=e.currentTarget.dataset.loc;
      let addressName=e.currentTarget.dataset.locName;

      wx.openLocation({
        latitude: location.lat,
        longitude: location.lng,
        address:addressName,
        success:(res)=>{
          console.log("打开位置成功:"+addressName,res);
        }
      })
    }
  }
})