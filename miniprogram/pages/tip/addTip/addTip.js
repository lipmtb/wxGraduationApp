// addTip.js选择分类主题发布帖子
import MyNotify from '../../../util/mynotify/mynotify';
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});
Page({

  data: {
    selectedImgArr: [], //用户选择上传的图片
    hasSelectedImg: '未选择',
    hasTopicLists: false, //加载中的主题列表picker
    pickerVisibleCount: 3, //piker的显示
    showCustomInput: 'display:none' //默认不显示自定义的主题input
  },
  pageData: {
    classifyLists: null, //tipClassify中的分类
    defaultClassifyId: '', //选择的分类_id
    useCustomTopic: false, //是否使用自定义主题
    topicInputStr: '', //输入的自定义主题
    titleInputStr: '', //用户发布的标题内容
    contentInputStr: '' //用户发布的内容描述
  },
  onLoad(options) {
    this.pageData.defaultClassifyId = options.classifyId; //选择的分类_id
    //初始化通知（后面注册成败与否可以调用）
    this.notify = new MyNotify({
      pageThis: this,
      message: '发布成功',
      bgColor: '#329df9'
    });
    this.notify.notifyInit();

    //获取已经存在的主题this.data.classifyNameLists，设置piker的初始状态
    db.collection("tipClassify").limit(20).get().then((resdata) => {
      console.log(resdata);
      this.pageData.classifyLists = resdata.data;
      let classifyIdx = 0;
      let defaultClassName = '';
      let classifyNameArr = resdata.data.map((itemdata, idx) => {
        if (itemdata._id === options.classifyId) {
          defaultClassName = itemdata.classifyName; //默认picker选择的主题名
          classifyIdx = idx; //控制piker默认选择的主题的索引
        }
        return itemdata.classifyName;
      });

      this.setData({
        classifyNameLists: classifyNameArr, //picker的columns数组
        defaultClassName: defaultClassName, //选择的主题名
        classifyNameIdx: classifyIdx, //默认选中的主题索引picker需要
        hasTopicLists: true //异步加载中的主题
      })
    })

  },
  //返回上个页面
  onClickLeft(e) {
    wx.navigateBack({
      delta: 1
    });
  },
  // piker滑动选择
  pickerSelect(e) {
    // console.log(e);value,index
    this.pageData.defaultClassifyId = this.pageData.classifyLists[e.detail.index]._id;

    this.setData({
      defaultClassName: e.detail.value
    })

  },
  // piker确认
  onConfirm(e) {
    // console.log("确认",e);
    this.setData({
      pickerVisibleCount: 0
    })
  },
  // piker选择
  onCancel(e) {
    // console.log("选择",e);
    this.setData({
      pickerVisibleCount: 3
    })
  },
  // 自定义主题切换开关
  onSwitchCustom({
    detail
  }) {
    let that = this;
    // console.log("异步切换",detail);
    wx.showModal({
      title: '是否使用自定义主题',
      content: detail ? '使用自定义主题？' : '不使用自定义主题',
      success: (res) => {
        if (res.confirm) {
          let useCustom = "display:none"; //控制input的显示
          let pickerVisibleCount = 3; //控制piker的显示
          that.pageData.useCustomTopic = false;
          if (detail) { //打开自定义主题
            useCustom = ""; //显示input
            pickerVisibleCount = 0; //隐藏piker
            that.pageData.useCustomTopic = true; //使用自定义主题
          }
          that.setData({
            checked: detail,
            showCustomInput: useCustom,
            pickerVisibleCount: pickerVisibleCount
          });
        }
      },
    });
  },
  // 输入自定义主题
  onInputTopic(e) {
    // console.log(e.detail.value);
    this.pageData.topicInputStr = e.detail.value;
    this.setData({
      defaultClassName: e.detail.value
    })
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
  //添加新的主题
  async addNewTopic() {
    // let that = this;
    // return await db.collection('tipClassify').add({
    //   data: {
    //     classifyName: that.pageData.topicInputStr
    //   }
    // });
    let that=this;
    let reqRes=await wx.cloud.callFunction({
      name:'createNewTopic',
      data:{
        classifyName: that.pageData.topicInputStr
      }
    });
    return reqRes.result;
  },
  // 发布
  async onAllSend() {
    let that = this;
    //打开自定义主题按钮，但是输入空字符串
    if(that.pageData.useCustomTopic && !that.pageData.topicInputStr){
      wx.showToast({
        title: '请先输入主题',
      })
      return;
    }
    //新话题过于类似存在的话题：关键词提取更好
    if(that.pageData.useCustomTopic && that.pageData.topicInputStr){
      let testNewTopic=await db.collection('tipClassify').where({
        classifyName:new db.RegExp({
          regexp:that.pageData.topicInputStr
        })
      }).get();
      if(testNewTopic.data.length>0){
       wx.showModal({
         content:'主题已经存在或相似存在的主题'
       })
       
        return;
      }
    }
   
    let fileidArr = await that.uploadImgArr(); //上传完图片才真正发布内容

    //是否有使用自定义主题发布帖子
    if (that.pageData.useCustomTopic && that.pageData.topicInputStr) {
      let newTopicId = await that.addNewTopic(); //添加新的主题分类
      await db.collection("tipEssays").add({
        data: {
          classifyId: newTopicId._id,
          title: that.pageData.titleInputStr,
          content: that.pageData.contentInputStr,
          images: fileidArr,
          publishTime: new Date()
        }
      }).then((res) => {
        console.log("发布自定义主题的帖子成功", res);
        that.notify.showNotify(function () {
          wx.navigateTo({
            url: '../tipEssayDetail/tipEssayDetail?tipEssayId=' + res._id
          });
        });

      });
      return;
    }

    await db.collection("tipEssays").add({
      data: {
        classifyId: that.pageData.defaultClassifyId,
        title: that.pageData.titleInputStr,
        content: that.pageData.contentInputStr,
        images: fileidArr,
        publishTime: new Date()
      }
    }).then((res) => {
      console.log("发布成功", res);
      that.notify.showNotify(function () {
        wx.navigateTo({
          url: '../tipEssayDetail/tipEssayDetail?tipEssayId=' + res._id,
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