// pages/tip/tipcpn/tip-item.js
Component({
  options: {
    multipleSlots: true
  },
  properties: {
    itemData: {
      type: Object,
      value: {}
    },
    userInfo: {
      type: Object,
      value: {}
    },
    likedCount: Number,
    commentedCount: Number,
    showHighlight: {
      type: Boolean,
      value: false
    }
  },

  data: {

  },
  methods: {

  },
  lifetimes: {
    ready() {
    
    }
  }
})