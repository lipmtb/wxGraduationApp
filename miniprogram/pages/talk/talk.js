// pages/talk/talk.js
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});
const app = getApp();
import customFormatTime from '../../util/customTime'; //自定义的日期格式化显示
Page({
  data: {
    hotLists: [], //热门
    hasMoreHotTalk: true,
    newLists: [], //最新
    hasMoreNewTalk: true,
    questionLists: [], //问答圈
    bottomStyleShow: 'display:none', //默认不显示到底了
    searchResLists: [], //搜索结果
    showSheet: false,
    actions: [{
        name: '钓友圈',
      },
      {
        name: '问答圈',
      }
    ]
  },
  pageData: {
    numArr: [0, 0, 0], //钓友圈文字动画transitionend计数0
    hotTalkCount: 0, //已经加载的热门帖子数
    newTalkCount: 0, //已经加载的最新帖子数
    curQuestionCount: 0, //已经加载的问答圈帖子数
    hasMoreQuestion: true, //是否还有问答圈帖子，触底加载使用
    searchInputText: '66'
  },
  //发布+选择钓友圈或者问答圈或者取消
  onSheetSelect(e) {

    this.setData({
      showSheet: false
    })
    if (e.detail.name === '钓友圈') {
      wx.navigateTo({
        url: 'addTalk/addTalk',
      })
      return;
    }

    if (e.detail.name === '问答圈') {
      wx.navigateTo({
        url: 'addQuestion/addQuestion',
      })
    }
  },
  onSheetCancel(e) {
    this.setData({
      showSheet: false
    })
  },
  //展示选择
  navToAdd() {
    this.setData({
      showSheet: true
    })
  },
  onLoad: function () {
    this.getHotLists(); //获取热门帖子
    this.getQuestionLists(); //获取问答圈帖子
  },
  //获取热门：按照评论数排序
  async getHotLists() {

    return await wx.cloud.callFunction({
      name: 'getTalk',
      data: {
        skipNum: this.pageData.hotTalkCount
      }
    }).then((res) => {
      console.log("获取热门帖子成功", res);
      if (res.result.list.length === 0) {
        this.setData({
          hasMoreHotTalk: false
        })
        return;
      }

      this.pageData.hotTalkCount = this.pageData.hotTalkCount + res.result.list.length;
      console.log("加载热门帖子数:", this.pageData.hotTalkCount);
      this.data.hotLists.push(...res.result.list);
      this.setData({
        hotLists: this.data.hotLists
      });
    });
  },
  //获取最新：按照发布时间publishTime排序
  async getNewLists() {

    return await wx.cloud.callFunction({
      name: 'getNewTalk',
      data: {
        skipNum: this.pageData.newTalkCount
      }
    }).then((res) => {
      console.log("获取最新帖子成功", res);
      if (res.result.list.length === 0) {
        this.setData({
          hasMoreNewTalk: false
        })
        return;
      }
      //更新已经获取的热门帖子数
      this.pageData.newTalkCount = this.pageData.newTalkCount + res.result.list.length;
      console.log("加载最新帖子数:", this.pageData.newTalkCount);
      this.data.newLists.push(...res.result.list);
      this.setData({
        newLists: this.data.newLists
      });
    });
  },
  //获取问答圈帖子
  async getQuestionLists() {
    let that = this;
    return await wx.cloud.callFunction({
      name: "getQuestion",
      data: {
        skipNum: that.pageData.curQuestionCount
      }
    }).then((res) => {
      console.log("获取问答圈帖子成功", res);
      if (res.result.list.length == 0) {
        that.pageData.hasMoreQuestion = false;
        that.setData({
          bottomStyleShow: ""
        });
        return;
      }
      //修改服务器时间为本地时间
      let prosArr = [];
      for (let item of res.result.list) {
        let prosItem = db.collection("question").doc(item._id).get().then((resitem) => {
          item.publishTime = customFormatTime(resitem.data.publishTime);
        });
        prosArr.push(prosItem);
      }
      that.pageData.curQuestionCount = that.pageData.curQuestionCount + res.result.list.length;
      that.data.questionLists.push(...res.result.list);
      Promise.all(prosArr).then(() => {
        that.setData({
          questionLists: that.data.questionLists
        })
      })

    })
  },
  //更多热门
  getMoreHot() {
    if (this.data.hasMoreHotTalk) {
      wx.showLoading({
        title: '更多热门帖子'
      })
      this.getHotLists().then(() => {
        wx.hideLoading({
          success: (res) => {},
        })
      });
    }

  },
  //更多最新
  getMoreNew() {
    if (this.data.hasMoreNewTalk) {
      wx.showLoading({
        title: '更多最新帖子'
      })
      this.getNewLists().then(() => {
        wx.hideLoading({
          success: (res) => {},
        })
      });
    }
  },
  //下拉刷新
  onPullDownRefresh() {
    wx.showLoading({
      title: '正在刷新。。。',
    });
    this.pageData.hasMoreQuestion = true;
    this.pageData.hotTalkCount = 0;
    this.pageData.newTalkCount = 0;
    this.pageData.curQuestionCount = 0;
    this.data.hotLists = []; //热门

    this.data.questionLists = []; //问答圈
    this.setData({
      newLists: [],
      bottomStyleShow: "display:none",
      searchResLists: [],
      hasMoreNewTalk: true,
      hasMoreHotTalk: true
    });

    Promise.all([this.getHotLists(), this.getNewLists(), this.getQuestionLists()]).then(() => {
      wx.stopPullDownRefresh({
        success: (res) => {
          wx.hideLoading({
            success: (res) => {
              wx.showToast({
                title: '刷新成功',
              })
            }
          });
        },
      })
    }).catch((err) => {
      wx.stopPullDownRefresh({
        success: (res) => {
          console.log("刷新失败");
        },
      })
    })



  },
  //触底加载更多
  onReachBottom() {

    if (this.pageData.hasMoreQuestion) {

      wx.showLoading({
        title: '更多问答圈帖子'
      });
      this.getQuestionLists().then(() => {
        wx.hideLoading({
          success: (res) => {

          },
        })
      });
    }

  },
  onShow() {
    this.getTabBar().init(); //tabBar选项卡组件初始化active
  },
  onReady() {
    //钓友圈初始动画
    // const animationArr = [];
    // for (let i = 0; i < 3; i++) {
    //   animationArr[i] = this.singleRunAnimation(200 * i);
    // }
    // this.setData({
    //   animationShowA: animationArr[0],
    //   animationShowB: animationArr[1],
    //   animationShowC: animationArr[2]
    // });
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
    let that = this;

    let tarIdx = e.target.dataset.idx;
    let numStep = ++this.pageData.numArr[tarIdx];

    if (numStep % 4 === 0) {
      switch (tarIdx) {
        case 0: {
          this.setData({
            animationShowA: that.singleRunAnimation(0)
          });
          break;
        }
        case 1: {
          this.setData({
            animationShowB: that.singleRunAnimation(0)
          });
          break;
        }
        case 2: {
          this.setData({
            animationShowC: that.singleRunAnimation(0)
          });
          break;
        }
      }

    }
  },
  //用户搜索框输入e.detail=用户输入的内容
  userInputChange(e) {
    this.pageData.searchInputText = e.detail;
  },
  //用户点击搜索按钮
  onSearch(e) {

    this.setData({
      searchResLists: []
    });
    wx.showLoading({
      title: '搜索：' + this.pageData.searchInputText
    })
    wx.cloud.callFunction({
      name: 'searchTalkByKey',
      data: {
        keyword: this.pageData.searchInputText
      }
    }).then((res) => {
      console.log("搜到数据", res.result.list);
      if (res.result.list.length === 0) {
        wx.showToast({
          title: '没有相关数据',
        });
        return;
      }
      wx.showToast({
        title: '搜索成功',
      });
      this.setData({
        searchResLists: res.result.list,
        keywords: this.pageData.searchInputText
      })
    });
  },
  //用户切换热门和最新
  tabChange(e) {
    let selIdx = e.detail.index;
    if (selIdx === 0 && this.pageData.hotTalkCount === 0) {
      wx.showLoading({
        title: '加载热门',
      })
      this.getHotLists().then(() => {
        wx.hideLoading({
          success: (res) => {},
        })
      });
      return;
    }
    if (selIdx === 1 && this.pageData.newTalkCount === 0) {

      wx.showLoading({
        title: '加载最新',
      })
      this.getNewLists().then(() => {
        wx.hideLoading({
          success: (res) => {},
        })
      });
    }
  },
  onShareAppMessage(){
    return {
      title:"杂谈",
      path:'/pages/talk/talk'
    }
  }


})