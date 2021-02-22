// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
const $ = db.command.aggregate;
// 云函数入口函数
exports.main = async (event, context) => {
  let skipCount = event.skipNum;
  let limitNum=event.limitNum||5;
  let classifyId = event.classifyId;
  // 获取tip帖子的信息：发布者，点赞数和收藏数和评论列表
  return await db.collection("tipEssays").aggregate()
    .match({
      classifyId: classifyId
    }).lookup({
      from: 'angler',
      localField: '_openid',
      foreignField: '_openid',
      as: 'userInfo'
    }).lookup({
      from: 'likeTip',
      localField: '_id',
      foreignField: 'likeTipId',
      as: 'likeArr'
    }).lookup({
      from: 'collectTip',
      localField: '_id',
      foreignField: 'collectTipId',
      as: 'collectArr'
    }).lookup({
      from: 'tipComment',
      localField: '_id',
      foreignField: 'commentTipId',
      as: 'commentArr'
    }).project({
      _id:1,
      _openid:1,
      classifyId:1,
      content:1,
      images:1,
      publishTime:1,
      title:1,
      userInfo:1,
      likeArr:1,
      collectArr:1,
      commentArr:1,
      hotCount:$.sum([$.size('$likeArr'),$.size('$collectArr'),$.size('$commentArr')])
    }).sort({
      hotCount:-1//按照点赞+收藏+评论总数排序
    }).skip(skipCount).limit(limitNum).end()

}