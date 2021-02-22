// miniprogram/pages/talk/addTalk/addTalk.js
import MyNotify from '../../../util/mynotify/mynotify';
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});
Page({

  data: {
    selectedImgArr: [], //用户选择上传的图片
    hasSelectedImg: '未选择',
    locationStr:''
  },
  pageData: {
    titleInputStr: '', //用户发布的标题内容
    contentInputStr: '', //用户发布的内容描述
    userLocationInfo:null
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
  onTitleInput(e) {
    // console.log(e);
    this.pageData.titleInputStr = e.detail;
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
      db.collection("talk").add({
        data: {
          title: that.pageData.titleInputStr,
          content: that.pageData.contentInputStr,
          images: res,
          location:that.pageData.userLocationInfo,
          publishTime: new Date()
        }
      }).then((res) => {
        console.log("发布成功", res);
        that.notify.showNotify(function () {
          wx.navigateTo({
            url: '../talkDetail/talkDetail?talkId=' + res._id,
          });
        });

      });
    });

  },
  // 发布前先上传图片
  async uploadImgArr() {
    let app = getApp();
    let userObj = app.globalData.userObj || wx.getStorageSync('userInfo');
    console.log(userObj);
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