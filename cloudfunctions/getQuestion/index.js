//获取问答圈帖子
const cloud = require('wx-server-sdk');

cloud.init();
const db=cloud.database();
const $=db.command.aggregate;

exports.main = async (event, context) => {
  let skipNum=event.skipNum||0;
  return await db.collection('question').aggregate()
  .lookup({
    from:'angler',
    localField:'_openid',
    foreignField:'_openid',
    as:'userInfo'
  }).project({
    _id:1,
    _openid:1,
    content:1,
    images:1,
    publishTime:1,
    userInfo:$.arrayElemAt(['$userInfo',0])
  }).skip(skipNum).limit(4).end();
}