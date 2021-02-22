  //获取热门：根据评论数多少先后排序
const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  env: 'blessapp-20201123'
});
const db=cloud.database();
const $=db.command.aggregate;

exports.main = async (event, context) => {
  let skipCount=event.skipNum;
  let limitCount=event.limitNum||5;
  //获取热门：根据评论数多少先后排序
  return await db.collection("talk").aggregate()
  .lookup({
      from:'comment',
    localField:'_id',
    foreignField:'commentTalkId',
    as:'commentLists'
  }).project({
    title:1,
    images:1,
    _openid:1,
    content:1,
    publishTime:1,
    commentLists:1,
    commentListsLength:$.size('$commentLists')
  }).sort({
    commentListsLength:-1
  }).skip(skipCount).limit(limitCount).end();


}