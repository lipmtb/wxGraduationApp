// miniprogram/pages/arrange/userArrange/userArrange.js
let db = wx.cloud.database();
Page({

  data: {
    anglerLists: []
  },
  pageData: {
    curUserCount: 0
  },
  onLoad: function (options) {
    this.getSysAngler().then((userlists) => {
      this.data.anglerLists.push(...userlists);
      this.pageData.curUserCount += userlists.length;
      this.setData({
        anglerLists: this.data.anglerLists
      })
    });
  },
  async getSysAngler() {
    let angRes = await db.collection("angler").skip(this.pageData.curUserCount)
      .limit(10).get();
    for (let angitem of angRes.data) {
      let rightArr = angitem.right;
      let isAd = true;
      for (let i of rightArr) {
        if (i === 0) {
          isAd = false;
        }
      }
      angitem.isAdmin = isAd;

    }

    return angRes.data;
  },
  //添加管理员
  addAdmin(e) {
    let _this = this;
    let userId = e.currentTarget.dataset.userId;
    let userIdx = e.currentTarget.dataset.userIdx;
    wx.cloud.callFunction({
      name: "addAdmin",
      data: {
        userId: userId,
        operType:"add"
      }
    }).then((res) => {
      console.log("添加管理员成功", res.result);
      _this.replaceDataOnPath(["anglerLists", userIdx, "isAdmin"], true);
      _this.applyDataUpdates();
    })

  },
  cancelAdmin(e) {
    let _this = this;
    let userId = e.currentTarget.dataset.userId;
    let userIdx = e.currentTarget.dataset.userIdx;
    wx.cloud.callFunction({
      name: "addAdmin",
      data: {
        userId: userId,
        operType:"cancel"
      }
    }).then((res) => {
      console.log("取消管理员成功", res.result);
      _this.replaceDataOnPath(["anglerLists", userIdx, "isAdmin"], false);
      _this.applyDataUpdates();
    })
  }
})