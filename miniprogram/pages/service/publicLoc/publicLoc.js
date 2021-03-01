// publicLocJs 发布钓点
import MyNotify from '../../../util/mynotify/mynotify';
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});
Page({

  data: {
    selectedImgArr: [], //用户选择上传的图片
    hasSelectedImg: '未选择',
    locationStr:'',
    isFree:'charge'//是否收费charge/free
  },
  pageData: {
    titleInputStr: '', //用户发布的标题内容
    contentInputStr: '', //用户发布的内容描述
    contactInputStr:'',//用户输入的联系方式
    chargeInputStr:'', //收费方式
    userLocationInfo:null   //用户添加的位置信息
  },
  onLoad() {
    //初始化通知（后面注册成败与否可以调用）
    this.notify = new MyNotify({
      pageThis: this,
      message:'发布成功',
      bgColor:'#329df9'
    });
    this.notify.notifyInit();
  },
  //返回上个页面
  onClickLeft(e) {
    wx.navigateBack({
      delta: 1
    });
  },
  onRadioChange(e){
    // console.log("radio change",e);
    this.setData({
      isFree:e.detail.value
    })
  },
  //输入的收费方式
  onChargeInput(e){
     this.pageData.chargeInputStr=e.detail;
  },
  // 用户输入钓点名
  onTitleInput(e) {
    // console.log(e);
    this.pageData.titleInputStr = e.detail;
  },
  //用户输入联系方式
  onContactInput(e){
    this.pageData.contactInputStr=e.detail;
  },
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
  userAddLocation(){
    let that=this;
    wx.chooseLocation({
      success(res){
        console.log(res);
        let {longitude,latitude,address,name}=res;
        that.pageData.userLocationInfo={
          longitude,latitude,address,name
        };
        that.setData({
          locationStr:res.name
        },()=>{
          wx.showToast({
            title: '添加位置成功',
          })
        })
      }
    })
  },
  //用户取消位置
  onDeleteLocation(){
    this.pageData.userLocationInfo=null;
    this.setData({
      locationStr:''
    })
  },
  // 发布
  async onAllSend() {
    let that = this;
    await this.uploadImgArr().then((res) => { //上传完图片才真正发布内容
      console.log("图片上传成功,fileIdList:", res);
      let lng=116.66;
      let lat=23.46;
      if(that.pageData.userLocationInfo){
         lng=that.pageData.userLocationInfo.longitude;
         lat=that.pageData.userLocationInfo.latitude;
      }
    
      db.collection("anglerLoc").add({
        data: {
          locName: that.pageData.titleInputStr,
          locDesc: that.pageData.contentInputStr,
          contact:that.pageData.contactInputStr,
          charge:that.pageData.chargeInputStr,
          images: res,
          locationDetail:that.pageData.userLocationInfo,
          location:db.Geo.Point(lng,lat),
          publishTime: new Date()
        }
      }).then((res) => {
        console.log("发布成功", res);
        that.notify.showNotify(function () {
          wx.navigateTo({
            url: '../locDetail/locDetail?locId=' + res._id,
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