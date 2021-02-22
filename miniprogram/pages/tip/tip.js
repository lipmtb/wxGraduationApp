// pages/tip/tip.js
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});
const _ = db.command;
const $ = _.aggregate;

Page({
  data: {
    classifyNameLists: ['钓具介绍', '饵料分析', '打窝技巧', '水域位置分析', '冬钓', '夜钓'],
    essenceLists: [],
    hasMoreEssays: true
  },
  pageData: {
    curSpecialCount: 0, //获取的两个主题的帖子数
    curTopicSkip: 0   //获取精选跳过的主题数
  },
  onLoad: function (options) {
    this.getTopicLists();//获取6个阅读量前6的分类主题
    this.getSpecialTipEssays();  //获取精选
  },
  onShow() {
    wx.setNavigationBarTitle({
      title: '技巧',
    })
  },
  toMoreClassifyPage(){
    wx.navigateTo({
      url: 'moreClassify/moreClassify',
    })
  },
  //获取6个阅读量前6的分类主题
  async getTopicLists() {

    let resTopic = await db.collection('readTopic').aggregate().group({
      _id: '$classifyId',
      count: $.sum(1)
    }).sort({
      count: -1
    }).limit(6).end();
    //获取主题的名字classifyName
    for (let groupitem of resTopic.list) {
      let resname = await db.collection("tipClassify").where({
        _id: groupitem._id
      }).get();
      groupitem.classifyName = resname.data[0].classifyName;
    }
    this.setData({
      classifyNameLists: resTopic.list
    });
    return resTopic.list;

  },
  //获取精选：阅读量最高的两个开始，每个主题一次最多取两个帖子（点赞和收藏，评论总数排序），取完开始取接下来的两个话题，直到获得前6个主题的所有帖子
  async getSpecialTipEssays(skipTopicNum) {

    let that = this;
    let essenceRes = await wx.cloud.callFunction({
      name: 'getSpecialTips',
      data: {
        skipNum: Math.round(that.pageData.curSpecialCount / 2), //每个主题的跳过帖子数
        skipTopicNum: skipTopicNum || 0   //跳过的主题数
      }
    });
    console.log("加载精华", essenceRes.result);
    that.pageData.curSpecialCount = that.pageData.curSpecialCount + essenceRes.result.length;
    that.data.essenceLists.push(...essenceRes.result);
    that.setData({
      essenceLists: that.data.essenceLists
    });
    return essenceRes.result;

  },
  onShow() {
    this.getTabBar().init();
  },
  // 更多精选
  moreSpecial() {

    wx.pageScrollTo({
      scrollTop: 800,
      duration: 400
    })
    // this.getSpecialTipEssays().then((res) => {
    //   wx.hideLoading({
    //     success: (res) => {},
    //   })
    // });

  },
  // 下拉刷新
  onPullDownRefresh() {
    this.pageData.curSpecialCount = 0;
    this.pageData.curTopicSkip=0;
    this.data.essenceLists = [];
    this.setData({
      hasMoreEssays: true
    })
    let prs1 = this.getTopicLists();
    let prs2 = this.getSpecialTipEssays();
    Promise.all([prs1, prs2]).then(() => {
      wx.stopPullDownRefresh({
        success: (res) => {
          wx.showToast({
            title: '刷新成功'
          })
        },
      })
    })
  },
  //获取完前6个主题的帖子
  onReachBottom() {
    let that = this;

    if (that.data.hasMoreEssays) {
      wx.showLoading({
        title: '加载中。。。',
      });
      this.getSpecialTipEssays(that.pageData.curTopicSkip).then((lists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载更多", lists);
          },
        });
        if (lists.length === 0 && that.pageData.curTopicSkip === 4) {
          that.setData({
            hasMoreEssays: false
          })
          return;
        }
        if (lists.length === 0) {
          that.pageData.curTopicSkip += 2;
          that.pageData.curSpecialCount = 0;
        }


      })
    }

  }


})