// pages/talk/questioncpn/question-item.js
//一条问答圈帖子
Component({
  options: {
    multipleSlots: true
  },
  properties: {
    itemData: {
      type: Object,
      value: {}
    }
  },

  data: {

  },
  methods: {
    toQuestionDetail() {
      wx.navigateTo({
        url: '/pages/talk/questionDetail/questionDetail?questionId=' + this.data.itemData._id,
      })
    }
  }
})