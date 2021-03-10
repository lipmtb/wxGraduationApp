// 获取最新帖子
const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: 'blessapp-20201123'
});
const db = cloud.database();
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  let skipCount = event.skipNum;
  return await db.collection("talk").aggregate().lookup({
    from: 'angler',
    localField: '_openid',
    foreignField: '_openid',
    as: 'ownerArr'
  }).lookup({
    from: 'likeTalk',
    localField: '_id',
    foreignField: 'likeTalkId',
    as: 'likeArr'
  }).lookup({
    from: 'comment',
    localField: '_id',
    foreignField: 'commentTalkId',
    as: 'commentLists'
  }).project({
    title: 1,
    images: 1,
    _openid: 1,
    content: 1,
    publishTime: 1,
    commentCount: $.size('$commentLists'),
    likeCount: $.size('$likeArr'),
    userInfo: $.arrayElemAt(['$ownerArr', 0])
  }).sort({
    publishTime: -1
  }).skip(skipCount).limit(2).end();


}