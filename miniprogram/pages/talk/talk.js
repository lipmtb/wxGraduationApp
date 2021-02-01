// pages/talk/talk.js
const db=wx.cloud.database({
  env:'blessapp-20201123'
});
const app=getApp();
Page({
  data: {
    hotLists:[],
    newLists:[]
  },
  pageData:{
    numArr:[0,0,0]      //钓友圈文字动画transitionend计数0
  },
  //用户点击+按钮
  navToAdd(){
    wx.navigateTo({
      url: 'addTalk/addTalk',
    })
  },
  onLoad: function () {
    wx.cloud.callFunction({
      name:'getTalk'
    }).then((res)=>{
       console.log("获取热门成功",res);
       
      this.setData({
        hotLists:res.result.list
      });
     });
  },
  onShow() {
    this.getTabBar().init();//tabBar选项卡组件初始化active
  },
  onReady() {
    //钓友圈初始动画
    const animationArr = [];
    for (let i = 0; i < 3; i++) {
      animationArr[i] =this.singleRunAnimation(200*i);
    }
    this.setData({
      animationShowA: animationArr[0],
      animationShowB: animationArr[1],
      animationShowC: animationArr[2]
    });
  },
  createTextAnimation(delayNum) {
    return wx.createAnimation({
      delay: delayNum,
      duration: 250,
      timingFunction: 'linear'
    });
  },
  //钓友圈动画过程
  singleRunAnimation(delayTime) {
    let singleAni = this.createTextAnimation(delayTime);
    singleAni.translate(0, -4).step().translate(0, 0).step().translate(0, 4).step().translate(0, 0).step();
    return singleAni.export();
  },
  // 1/4动画监听完成
  animationEndFn(e) {
    let that=this;

    let tarIdx=e.target.dataset.idx;
    let numStep=++this.pageData.numArr[tarIdx];
 
    if(numStep%4===0){
      switch(tarIdx){
        case 0:{
          this.setData({
            animationShowA:that.singleRunAnimation(0)
          });
          break;
        }
        case 1:{
          this.setData({
            animationShowB:that.singleRunAnimation(0)
          });
          break;
        }
        case 2:{
          this.setData({
            animationShowC:that.singleRunAnimation(0)
          });
          break;
        }
      }
    
    }
  },
  //用户搜索框输入e.detail=用户输入的内容
  userInputChange(e){
    console.log(e);
  },
  //用户点击搜索按钮
  onSearch(e){
    console.log(e);
  },
  //用户切换热门和最新
  tabChange(e){
    let selIdx=e.detail.index;

  }


})