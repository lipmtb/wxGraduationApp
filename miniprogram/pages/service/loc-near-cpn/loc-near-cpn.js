// pages/service/loc-cpn/loc.js
// 地理信息组件
Component({
  options: {
    multipleSlots: true,
    styleIsolation: "isolated"
  },
  properties: {
    itemData: {
      type: Object,
      value: {
        distance: 0
      },
      observer(newVal, oldVal, itemArr) {
        // console.log(itemArr);//["itemData", "distance"]

      }
    },

  },
  lifetimes: {
    created() { //setData无效
      // console.log("created:");

    },

    attached() { //可以setData
      //  console.log(this.data.itemData.locName,"attached");


    },
    ready() {
      //  console.log("ready");

    },
    moved() {
      // console.log("moved");
    }
  },
  observers: { //setData对监听的目标itemData无效
    'itemData.distance': function (disval) {
      //  console.log("ovservers:", disval);
      if (this.data.itemData.distance) {
        let dis = this.data.itemData.distance;

        if (dis > 1000) {
          let farDis = (dis / 1000).toFixed(3);
          this.setData({
            'distanceFar': farDis,
            distanceShort: 0
          });
          return;
        }
        this.setData({
          'distanceShort': dis.toFixed(3),
          'distanceFar': 0
        })
      }

    }
  },
  methods: {
    // 打开微信内置地图
    onOpenLoc(e) {
      let location = e.currentTarget.dataset.loc;
      let addressName = e.currentTarget.dataset.locName;

      wx.openLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: addressName,
        success: (res) => {
          console.log("打开位置成功:" + addressName, res);
        }
      })
    }
  }
})