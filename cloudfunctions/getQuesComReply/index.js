// 获取问答圈评论并按照评论的点赞数排序
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {

  let tarId = event.tarCommentId;
  let skipNum = event.skipReplyCount;
  let curOpenId=event.curUserOpenId;
  return await db.collection("questionCommentReply").aggregate()
    .match({
      tarCommentId: tarId
    }).lookup({
      from: 'angler',
      localField: '_openid',
      foreignField: '_openid',
      as: 'fromUserArr'   //回复者
    }).lookup({
      from: 'angler',
      localField: 'tarUserId',
      foreignField: '_id',
      as: 'tarUserArr' //回复的人
    }).lookup({
      from: 'likeQuestionComment',
      let: {
        commentId: '$_id'
      },
      pipeline: $.pipeline().match(_.expr(
        $.eq(['$likeCommentId', '$$commentId'])
      )).done(),
      as: 'likeCommentList'  //点赞回复的人列表
    }).lookup({
      from: 'likeQuestionComment',
      let: {
        commentId: '$_id'
      },
      pipeline: $.pipeline().match(_.expr(
        $.and([$.eq(['$likeCommentId', '$$commentId']), $.eq(['$_openid', curOpenId])])
      )).done(),
      as: 'hasLikedCommentArr' //某个用户是否点点赞过回复
    }).project({
      _id: 1,
      _openid: 1,
      userInfo: $.arrayElemAt(['$fromUserArr', 0]),
      tarUserInfo: $.arrayElemAt(['$tarUserArr', 0]),
      tarCommentId: 1,
      content: 1,
      commentTime: $.dateToString({
        date: '$commentTime',
        format: '%Y-%m-%d %H:%M:%S',
        timezone: 'Asia/Shanghai'
      }),
      commentTimeDa: '$commentTime',
      likeCount: $.size('$likeCommentList'),
      hasLiked: $.cond({
        if: $.gt([$.size('$hasLikedCommentArr'), 0]),
        then: $.arrayElemAt(['$hasLikedCommentArr', 0]),
        else: false
      })
    }).sort({
      likeCount: -1, //点赞总数多的靠前
      commentTimeDa: 1 //发布时间较早的靠前
    }).skip(skipNum).limit(5).end();


}