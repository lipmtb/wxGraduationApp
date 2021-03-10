// miniprogram/pages/arrange/tipArrange/tipArrange.js
const db=wx.cloud.database();
Page({
  pageData:{
    curTopicCount:0,
    hasMoreTopic:true,
    curInputNewTopic:''
  },
  data: {
    inputTpVal:'',
    existsClassify:[]
  },
  onLoad: function () {
    let that=this;
    this.getExistsClassify().then((classlists)=>{
      that.data.existsClassify.push(...classlists);
      that.pageData.curTopicCount+=classlists.length;
      that.setData({
        existsClassify:classlists
      })
    })
  },
  // 获取已经存在的主题
  async getExistsClassify(){
    let topicRes=await db.collection("tipClassify").skip(this.pageData.curTopicCount)
    .limit(10).get();
    if(topicRes.data.length<10){
      this.pageData.hasMoreTopic=false;
    }
    return topicRes.data;
  },
  onInputNewTopic(e){
    // console.log(e);
    this.pageData.curInputNewTopic=e.detail.value;
  },
  // 添加类型
  addNewTopic(){
    let that=this;
    let newTpName=this.pageData.curInputNewTopic;
    wx.cloud.callFunction({
      name:"createNewTopic",
      data:{
        classifyName:newTpName
      }
    }).then((res)=>{

      wx.showToast({
        title: '添加成功'
      });
      console.log('添加技巧类型成功',res.result);
      this.pageData.hasMoreTopic=true;
      that.setData({
        inputTpVal:''
      })
    })
  },
  // 删除类型
  onDelTopic(e){
    let that=this;
    let classId=e.currentTarget.dataset.delId;
    let idx=e.currentTarget.dataset.tpIdx;
    let tpName=e.currentTarget.dataset.topicName;
    wx.showLoading({
      title: '删除'+tpName,
    })
    wx.cloud.callFunction({
      name:"removeTipClassify",
      data:{
        topicId:classId
      }
    }).then((rmRes)=>{
      wx.hideLoading({
        success: (res) => {},
      })
      console.log("删除完毕",rmRes);
      that.data.existsClassify.splice(idx,1);
      that.setData({
        existsClassify:that.data.existsClassify
      })
    })
  
  },
  onReachBottom(){
    let that=this;
    if(this.pageData.hasMoreTopic){
      wx.showLoading({
        title: '更多类型'
      })
      this.getExistsClassify().then((classlists)=>{
        wx.hideLoading({
          success: (res) => {},
        })
        that.data.existsClassify.push(...classlists);
        that.pageData.curTopicCount+=classlists.length;
        that.setData({
          existsClassify:  that.data.existsClassify
        })
      })
    }
  }
})