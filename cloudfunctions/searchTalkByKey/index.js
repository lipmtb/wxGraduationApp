// 关键词搜索
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'blessapp-20201123'
});
const db=cloud.database();
const _=db.command;
const $=_.aggregate;
// 云函数入口函数
exports.main = async (event, context) => {
  let keys=event.keyword;
  return await db.collection("talk").aggregate().lookup({
    from:'comment',
    let:{
     talkId:'$_id'
    },
    pipeline:$.pipeline().match(_.expr(
      $.eq(['$$talkId','$commentTalkId'])
    )).done(),
    as:'commentLists'
  }).lookup({
    from:'likeTalk',
    localField:'_id',
    foreignField:'likeTalkId',
    as:'likeArr'
  }).lookup({
    from:'angler',
    localField:'_openid',
    foreignField:'_openid',
    as:'ownerArr'
  }).project({
    title: 1,
    images: 1,
    _openid: 1,
    content: 1,
    publishTime: 1,
    commentLists: 1,
    commentCount: $.size('$commentLists'),
    likeCount:$.size('$likeArr'),
    userInfo:$.arrayElemAt(['$ownerArr',0])
  }).match(_.or([
    {
      title:new db.RegExp({
        regexp:keys
      })
    },{
      content:new db.RegExp({
        regexp:keys
      })
    },{
      commentLists:_.elemMatch({
        commentText:new db.RegExp({
          regexp:keys,
          options:'i'
        })
      })
    }
  ])).end();

  
}