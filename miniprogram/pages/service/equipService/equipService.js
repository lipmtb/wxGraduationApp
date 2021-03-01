// pages/service/equipService/equipService.js
const db = wx.cloud.database();
const _=db.command;
Component({
  options: {
    multipleSlots: true
  },
  properties: {

  },
  data: {
    curSearchKeyword:'钓杆',
    mainActiveIndex: 0, //默认选中的项目
    items: [{
      // 导航名称
      text: '鱼竿',
      // 导航名称右上角徽标，1.5.0 版本开始支持
      badge: 1,
      // 是否在导航名称右上角显示小红点，1.5.0 版本开始支持
      dot: true,
      // 禁用选项
      disabled: false

    }, {
      // 导航名称
      text: '鱼钩鱼线',
      // 导航名称右上角徽标，1.5.0 版本开始支持
      badge: 1,
      // 是否在导航名称右上角显示小红点，1.5.0 版本开始支持
      dot: true,
      // 禁用选项
      disabled: false
    }, {
      // 导航名称
      text: '鱼漂',
      // 导航名称右上角徽标，1.5.0 版本开始支持
      badge: 1,
      // 是否在导航名称右上角显示小红点，1.5.0 版本开始支持
      dot: true,
      // 禁用选项
      disabled: false
    }, {
      // 导航名称
      text: '折叠桌椅',
      // 导航名称右上角徽标，1.5.0 版本开始支持
      badge: 1,
      // 是否在导航名称右上角显示小红点，1.5.0 版本开始支持
      dot: true,
      // 禁用选项
      disabled: false
    }, {
      // 导航名称
      text: '睡袋帐篷',
      // 导航名称右上角徽标，1.5.0 版本开始支持
      badge: 1,
      // 是否在导航名称右上角显示小红点，1.5.0 版本开始支持
      dot: true,
      // 禁用选项
      disabled: false
    }, {
      text: '其他'
    }],
    activeId: null,
    curEquipCount: 0,
    hasNext: true,
    hasLast: false
  },
  lifetimes: {
    attached() {
      //初始化items导航项
      this.getExistsEquipType().then((existTypeLists) => {

        let items = [];
        for (let typeItem of existTypeLists) {
          let itemObj = {
            text: typeItem.equipTypeName
          };
          items.push(itemObj);
        }

        this.setData({
          items: items,
          existsType: existTypeLists
        })

        //获取mainActiveIndex=0即鱼竿的装备列表:equipLists
        this.getCurEquipLists(existTypeLists[this.data.mainActiveIndex]._id).then((reslists) => {

          this.setData({
            equipLists: reslists,
            tagName: existTypeLists[this.data.mainActiveIndex].equipTypeName
          })
        });
      });




    }
  },
  methods: {
    onInputEquipText(e){
      // console.log(e.detail);
      this.data.curSearchKeyword=e.detail;
    },
    onSearchEquip(){
      let _this=this;
      let keys=this.data.curSearchKeyword;
      db.collection("equip").where(_.or([{
        equipDesc:new db.RegExp({
          regexp:keys
        })
      },{
        equipName:new db.RegExp({
          regexp:keys
        })
      }])).get().then((searchRes)=>{
        let pros=[];
        for(let it of searchRes.data){
          it.link="/pages/service/equipService/equipDetail/equipDetail?equipId=" + it._id;
          pros.push(db.collection("equipType").doc(it.equipTypeId).get().then((typeRes)=>{
            it.tagName=typeRes.data.equipTypeName;
            return typeRes.data.equipTypeName;
          }))
          
        }
        Promise.all(pros).then(([...res])=>{
          console.log(res);
          _this.setData({
            searchEquipLists:searchRes.data
          })
        })
        
      })
    },
    async getExistsEquipType() {
      let typeRes = await db.collection("equipType").limit(5).get();
      return typeRes.data;
    },
    async getCurEquipLists(typeId) {
      // console.log("equipCount:",this.data.curEquipCount);
      let listsRes = await db.collection("equip").where({
        equipTypeId: typeId
      }).skip(this.data.curEquipCount).limit(4).get();

      if (listsRes.data.length < 4) {
        this.setData({
          hasNext: false
        })
      }
      for (let it of listsRes.data) {
        it.link = "/pages/service/equipService/equipDetail/equipDetail?equipId=" + it._id;

      }
      return listsRes.data;
    },
    toLastPage() {
      if (this.data.hasLast) {
        wx.showLoading({
          title: '上一页'
        });
        this.data.curEquipCount -= 4;
        if (this.data.curEquipCount <= 0) {
          this.setData({
            curEquipCount: 0,
            hasLast: false
          })
        }
        this.getCurEquipLists(this.data.existsType[this.data.mainActiveIndex]._id).then((lists) => {
          wx.hideLoading({
            success: (res) => {},
          })
          this.setData({
            equipLists: lists,
            hasNext: true
          });
        })
      }
    },
    toNextPage() {

      if (this.data.hasNext) {
        wx.showLoading({
          title: '下一页'
        });
        this.data.curEquipCount += 4;
        this.getCurEquipLists(this.data.existsType[this.data.mainActiveIndex]._id).then((lists) => {
          wx.hideLoading({
            success: (res) => {},
          })
          this.setData({
            equipLists: lists,
            hasLast: true
          });
        })
      }

    },
    //装备详情页面
    toEquipDetailPage(e) {
      wx.navigateTo({
        url: e.target.dataset.equipLink
      })
    },
    toPublicEquip() {
      wx.navigateTo({
        url: '/pages/service/equipService/publicEquip/publicEquip',
      })
    },
    onClickNav(e) {
      //  console.log(e);
      let idx = e.detail.index;
      if (this.data.mainActiveIndex === idx) {
        return;
      }
      this.data.curEquipCount = 0;
      wx.showLoading({
        title: '加载' + this.data.existsType[idx].equipTypeName
      })
      this.getCurEquipLists(this.data.existsType[idx]._id).then((lists) => {
        wx.hideLoading({
          success: (res) => {},
        })
        this.setData({
          mainActiveIndex: idx || 0,
          equipLists: lists,
          hasNext: true,
          hasLast: false,
          tagName: this.data.existsType[idx].equipTypeName
        });
      })




    }




  }
})