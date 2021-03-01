// 发布装备
import MyNotify from '../../../../util/mynotify/mynotify';
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});
Page({

  data: {
    equipTypeLists:[],
    popVisible: false, //默认不显示遮罩
    classifyPopVisible:false,//装备类型遮罩
    visCount: 4, //picker的显示
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    formatter: (type, value) => {
      if (type === 'year') {
        return `${value}年`;
      } else if (type === 'month') {
        return `${value}月`;
      } else if (type === 'date') {
        return `${value}日`;
      } else if (type === 'hour') {
        return `${value}时`;
      } else if (type === 'minute') {
        return `${value}分`;
      }
      return `${value}日`;
    },
    selectedImgArr: [], //用户选择上传的图片
    hasSelectedImg: '未选择',
    locationStr: ''
  },
  pageData: {
    equipType:[],
    curSelectTypeStr:'其他',//默认类型
    curTypeIdx:0,//默认类型索引
    curStartTimeInfo:new Date(),//默认出租开始时间
    curEndTimeInfo:new Date(Date.now()+7*24*60*60*1000),//默认出租结束时间
    titleInputStr: '', //用户发布的标题内容
    contentInputStr: '', //用户发布的内容描述
    contactInputStr: '', //用户输入的联系方式
    userLocationInfo: null //用户添加的位置信息
  },
  onClosePop() {
    this.setData({
      popVisible: false
    });
    console.log(this.pageData.curStartTimeInfo.toLocaleString(),this.pageData.curEndTimeInfo.toLocaleString());
  },
  onShowPop(e) {
    let btnInfo = e.currentTarget.dataset.btnInfo;
    this.pageData.curTimeSelect = btnInfo;
    let titleStr=btnInfo==='start'?'可出租开始时间':'可出租结束时间';
    this.setData({
      popVisible: true,
      titlePopStr:titleStr
    })
  },
  //显示类型选择遮罩
  onShowTypePop(){
    this.setData({
      classifyPopVisible: true
    })
  },
  onCloseClassifyPop(){
    this.setData({
      classifyPopVisible: false
    })
  },
  timeConfirm(e){
    console.log(e);
    if(this.pageData.curTimeSelect==="start"){
      this.pageData.curStartTimeInfo=new Date(e.detail);
      this.pageData.curEndTimeInfo=new Date(e.detail+7*24*60*60*1000);
    }else{
      this.pageData.curStartTimeInfo=new Date(e.detail-7*24*60*60*1000);
      this.pageData.curEndTimeInfo=new Date(e.detail);
    }

    this.setData({
      popVisible:false,
      startTimeStr: this.pageData.curStartTimeInfo.toLocaleString(),
      endTimeStr:this.pageData.curEndTimeInfo.toLocaleString()
    })
  },
  // 装备类型选择确定
  onTypeSelectConfirm(e){
    // console.log(e.detail.index,e.detail.value);
    this.pageData.curSelectTypeStr=e.detail.value;
    this.pageData.curTypeIdx=e.detail.index;
    this.setData({
      curTypeStr:e.detail.value,
      classifyPopVisible:false
    })
  },
  onLoad() {
    //初始化通知（后面注册成败与否可以调用）
    this.notify = new MyNotify({
      pageThis: this,
      message: '发布成功',
      bgColor: '#329df9'
    });
    this.notify.notifyInit();

    db.collection("equipType").get().then((res)=>{
      this.pageData.equipType=res.data;
      this.pageData.curTypeIdx=res.data.length-1;
      for(let etype of res.data){
        this.data.equipTypeLists.push(etype.equipTypeName);
      }
      this.setData({
        equipTypeLists:this.data.equipTypeLists
      })
    })
  },
  //返回上个页面
  onClickLeft(e) {
    wx.navigateBack({
      delta: 1
    });
  },
  // 用户输入装备名
  onTitleInput(e) {
    // console.log(e);
    this.pageData.titleInputStr = e.detail;
  },
  //用户输入联系方式
  onContactInput(e) {
    this.pageData.contactInputStr = e.detail;
  },
  //输入装备描述
  onContentInput(e) {
    // console.log(e);
    this.pageData.contentInputStr = e.detail;
  },
  onDeleteImg(e) {
    let curImgIdx = e.target.dataset.imgIdx;
    let deleteImg = this.data.selectedImgArr.splice(curImgIdx, 1);
    let statusStr = this.data.selectedImgArr.length === 0 ? '未选择' : '选择中'
    this.setData({
      selectedImgArr: this.data.selectedImgArr,
      hasSelectedImg: statusStr
    });

  },
  //用户添加图片
  userAddImage() {
    let that = this;
    wx.chooseImage({
      count: 9,
      success: function (res) {
        console.log("选择完成：", res);
        let tmpPaths = res.tempFilePaths;
        that.data.selectedImgArr.push(...tmpPaths);
        let statusStr = that.data.selectedImgArr.length === 0 ? '未选择' : '选择中'
        that.setData({
          selectedImgArr: that.data.selectedImgArr,
          hasSelectedImg: statusStr
        });
      }
    })
  },
  //用户添加位置信息
  userAddLocation() {
    let that = this;
    wx.chooseLocation({
      success(res) {
        console.log(res);
        let {
          longitude,
          latitude,
          address,
          name
        } = res;
        that.pageData.userLocationInfo = {
          longitude,
          latitude,
          address,
          name
        };
        that.setData({
          locationStr: res.name
        }, () => {
          wx.showToast({
            title: '添加位置成功',
          })
        })
      }
    })
  },
  //用户取消位置
  onDeleteLocation() {
    this.pageData.userLocationInfo = null;
    this.setData({
      locationStr: ''
    })
  },
  // 发布
  async onAllSend() {
    let that = this;
    await this.uploadImgArr().then((res) => { //上传完图片才真正发布内容
      console.log("图片上传成功,fileIdList:", res);
      let lng = 116.66;
      let lat = 23.46;
      if (that.pageData.userLocationInfo) {
        lng = that.pageData.userLocationInfo.longitude;
        lat = that.pageData.userLocationInfo.latitude;
      }

      db.collection("equip").add({
        data: {
          equipTypeId:that.pageData.equipType[that.pageData.curTypeIdx]._id,
          equipName: that.pageData.titleInputStr,
          equipDesc: that.pageData.contentInputStr,
          contact: that.pageData.contactInputStr,
          images: res,
          locationDetail: that.pageData.userLocationInfo,
          location: db.Geo.Point(lng, lat),
          rentStartTime:that.pageData.curStartTimeInfo,
          rentEndTime:that.pageData.curEndTimeInfo,
          publishTime: new Date()
        }
      }).then((res) => {
        console.log("发布成功", res);
        that.notify.showNotify(function () {
          wx.navigateTo({
            url: '../equipDetail/equipDetail?equipId=' + res._id,
          });
        });

      });
    });

  },
  // 发布前先上传图片
  async uploadImgArr() {
    let app = getApp();
    let userObj = app.globalData.userObj || wx.getStorageSync('userInfo');
    // console.log(userObj);
    let userNickName = userObj.nickName || 'nullUserNickName';

    let fileIdLists = [];
    for (let imgItem of this.data.selectedImgArr) {
      let cloudFilePath = userNickName + '-' + new Date().toISOString() + '.png';

      await wx.cloud.uploadFile({
        cloudPath: cloudFilePath,
        filePath: imgItem
      }).then((res) => {
        console.log('上传成功:', cloudFilePath, res);
        let fileId = res.fileID;
        fileIdLists.push(fileId);
      }).catch((err) => {
        console.error("上传失败", err);
      });
    }
    return fileIdLists;
  }


})