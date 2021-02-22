// pages/talk/talkcpn/talk-item.js
const db = wx.cloud.database({
  env: 'blessapp-20201123'
});
Component({
  options: {
    multipleSlots: true //使用多个插槽
  },
  properties: {
    itemData: { //一条文章的数据，包含lookup联合查询的发布者信息
      type: Object,
      value: {}
    },
    showHighlight: {
      type: Boolean,
      value: false
    },
    keywords: String
  },
  data: {
    likedCount: 0, //点赞数
    commentedCount: 0, //评论数
    userInfo: null ,//发布者信息
    hasRelated:true
  },
  lifetimes: {
    ready() {
      let that=this;
      //获取发布者信息
      db.collection('angler').where({
        _openid: this.data.itemData._openid
      }).get().then((res) => {
        this.setData({
          userInfo: res.data[0]
        });
      });
      //获取此文章的点赞数
      db.collection('likeTalk').where({
        likeTalkId: this.data.itemData._id
      }).get().then((res) => {

        this.setData({
          likedCount: res.data.length
        });
      })

      //获取文章的评论数
      db.collection("comment").where({
        commentTalkId: this.data.itemData._id
      }).get().then((res) => {
        this.setData({
          commentedCount: res.data.length
        });
      })
      //如果展示关键词
      if (this.data.showHighlight) {
        let key=this.data.keywords;
        let regTest=new RegExp(key,'ig');

        //相关主题title
        let titleStr=this.data.itemData.title;
        
        let tArr=[];
        let hasReletedTitle=false;
        if(regTest.test(titleStr)){
          hasReletedTitle=true;
          tArr=titleStr.split(regTest);
          let tLen=tArr.length;
          for (let i = 1; i <=tLen  - 1;) {
            tArr.splice(i,0,key);
            tLen++;
            i+=2;
          }
        }
     
      

        //相关内容
        let contentStr=this.data.itemData.content;
    
        let conArr=[];
        let hasReletedContent=false;
        if(regTest.test(contentStr)){
          hasReletedContent=true;
           conArr=contentStr.split(regTest);
          let conLen=conArr.length;
          for (let i = 1; i <=conLen  - 1;) {
            conArr.splice(i,0,key);
            conLen++;
            i+=2;
          }
        }
     
        this.setData({
          'itemData.titleArr':tArr,
          hasReletedTitle:hasReletedTitle,
          'itemData.contentArr':conArr,
          hasRelatedContent:hasReletedContent
        })
        //相关评论过滤
     
        //保留包含关键词的评论
        let plainLists = this.data.itemData.commentLists;
        this.data.itemData.commentLists = plainLists.filter((item) => {
          let reg = new RegExp(key, 'i');
          return reg.test(item.commentText);
        });
        console.log(this.data.itemData.commentLists);
        if(this.data.itemData.commentLists.length==0){
          
          that.setData({
            hasRelated:false
          })
        }
        this.data.itemData.commentLists.forEach((item, idx, arr) => {

          item.commentTextArr = item.commentText.split(new RegExp(key, 'gm'));
          let len=item.commentTextArr.length;
          for (let i = 1; i <=len  - 1;) {
            item.commentTextArr.splice(i,0,key);
            len++;
            i+=2;
          }
          that.setData({
            'itemData.commentLists':that.data.itemData.commentLists
          })
        });

      }
    }


  },
  methods: {
    //跳转到文章详情
    toDetailPage() {

      let talk_id = this.data.itemData._id;
      wx.navigateTo({
        url: '/pages/talk/talkDetail/talkDetail?talkId=' + talk_id,
      });
    }
  }
})