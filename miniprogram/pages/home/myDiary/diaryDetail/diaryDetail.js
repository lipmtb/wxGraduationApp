// miniprogram/pages/home/myDiary/diaryDetail/diaryDetail.js
const db = wx.cloud.database();
import customFormatTime from "../../../../util/customTime";
Page({

  data: {

  },
  pageData: {
    diaryId: ''
  },
  onLoad: function (options) {
    // console.log(options);
    this.pageData.diaryId = options.diaryId;
    wx.showLoading({
      title: '加载中',
    });
    this.getDiaryDetail().then((res)=>{
      wx.hideLoading({
        success: (res) => {},
      });
      console.log(res);
      this.setData({
        itemData:res
      })
    })
  },
  async getDiaryDetail(){
    let dRes=await db.collection("diary").doc(this.pageData.diaryId).get();
    let diary=dRes.data;
    diary.publishTime=customFormatTime(diary.publishTime);
    return diary;
  }
})