// 获取技巧的精选帖子：取两个阅读量高的主题，每个主题取两个收藏数和点赞数和评论数多的帖子
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {
  let skipNum=event.skipNum||0;
  let skipTopic=event.skipTopicNum||0;
  let topicHotRes = await db.collection("tipClassify").aggregate().lookup({
    from:'readTopic',
    localField:'_id',
    foreignField:'classifyId',
    as:'readLists'
  }).project({
    _id:1,
    classifyName:1,
    readCount:$.size('$readLists')
  }).sort({
    readCount: -1
  }).skip(skipTopic).limit(2).end();
  
  let resultLists=[];
  for (let hotResItem of topicHotRes.list) {
    let essaysRes = await db.collection("tipEssays").aggregate().match({
        classifyId: hotResItem._id
      }).lookup({
        from:'angler',
        localField:'_openid',
        foreignField:'_openid',
        as:'userInfo'
      }).lookup({
        from: 'collectTip',
        localField: '_id',
        foreignField: 'collectTipId',
        as: 'collectArr'
      }).lookup({
        from: 'likeTip',
        localField: '_id',
        foreignField: 'likeTipId',
        as: 'likeArr'
      }).lookup({
        from: 'tipComment',
        localField: '_id',
        foreignField: 'commentTipId',
        as: 'commentArr'
      }).project({
        _id: 1,
        _openid: 1,
        title: 1,
        content: 1,
        classifyId: 1,
        publishTime: 1,
        images: 1,
        userInfo:1,
        collectArr: 1,
        likeArr: 1,
        commentArr: 1,
        hotSum: $.sum([$.size('$likeArr'), $.size('$collectArr'), $.size('$commentArr')])
      }).sort({
        hotSum: -1
      }).skip(skipNum).limit(2)
      .end();

      resultLists.push(...essaysRes.list);
  }
  return resultLists;

}