// miniprogram/pages/arrange/arrange.js
Page({

  data: {

  },
  onLoad: function (options) {

  },
  toArrangeType(e){
    let typePage=e.target.dataset.arrangeType;
    // console.log(typePage);
    wx.navigateTo({
      url: typePage+"/"+typePage,
    })
  }

})