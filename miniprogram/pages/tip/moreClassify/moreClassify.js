// miniprogram/pages/tip/classifyDetail/moreClassify/moreClassify.js
const db = wx.cloud.database();
Page({

  data: {
    classifyNameLists: [],
    hasMoreTopic: true
  },
  pageData: {
    topicCount: 0

  },
  onLoad: function (options) {

    this.getTopicLists();
  },
  onShow() {
    wx.setNavigationBarTitle({
      title: '更多主题',
    })
  },
  //获取分类主题
  async getTopicLists() {

    let resTopic = await db.collection('tipClassify').skip(this.pageData.topicCount).limit(6).get();

    // for (let topic of resTopic.data) {
    //   let readRes = await db.collection("readTopic").where({
    //     classifyId: topic._id
    //   }).get();
    //   topic.readCount = readRes.data.length;
    // }
    this.pageData.topicCount += resTopic.data.length;
    this.data.classifyNameLists.push(...resTopic.data);
    console.log("获取主题", resTopic.data);
    this.setData({
      classifyNameLists: this.data.classifyNameLists
    });
    return resTopic.data;

  },
  getMoreClassify() {
    if (this.data.hasMoreTopic) {
      wx.showLoading({
        title: '加载更多主题',
      });
      this.getTopicLists().then((dataarr) => {
        wx.hideLoading({
          success: (res) => {},
        })
        if (dataarr.length === 0) {
          this.setData({
            hasMoreTopic: false
          })
        }
      })
    }


  }
})