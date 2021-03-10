// 获取问答圈评论并按照评论的点赞数排序
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {

  let qId = event.questionId;
  let skipNum = event.skipComment;
  let curOpenId=event.curUserOpenId;
  return await db.collection("questionComment").aggregate()
    .match({
      commentQuestionId: qId
    }).lookup({
      from: 'angler',
      localField: '_openid',
      foreignField: '_openid',
      as: 'userArr'
    }).lookup({
      from: 'likeQuestionComment',
      let: {
        commentId: '$_id'
      },
      pipeline: $.pipeline().match(_.expr(
        $.eq(['$likeCommentId', '$$commentId'])
      )).done(),
      as: 'likeCommentList' //主评论点赞的列表
    }).lookup({
      from: 'likeQuestionComment',
      let: {
        commentId: '$_id'
      },
      pipeline: $.pipeline().match(_.expr(
        $.and([$.eq(['$likeCommentId', '$$commentId']), $.eq(['$_openid', curOpenId])])
      )).done(),
      as: 'hasLikedCommentArr'
    }).lookup({
      from: 'questionCommentReply',
      let: {
        commentId: '$_id'
      },
      pipeline: $.pipeline().match(_.expr(
        $.eq(['$tarCommentId', '$$commentId'])
      )).lookup({
        from: 'likeQuestionComment',
        localField: '_id',
        foreignField: 'likeCommentId',
        as: 'likeReplyLists'
      }).project({
        likeReplyCount: $.size('$likeReplyLists') //回复的点赞数
      }).done(),
      as: 'replyLists'
    }).project({
      _id: 1,
      _openid: 1,
      userInfo: $.arrayElemAt(['$userArr', 0]),
      commentQuestionId: 1,
      commentText: 1,
      commentTime: $.dateToString({
        date: '$commentTime',
        format: '%Y-%m-%d %H:%M:%S',
        timezone: 'Asia/Shanghai'
      }),
      commentTimeDa: '$commentTime',
      likeCount: $.size('$likeCommentList'),
      likeCommentSum: $.sum([$.sum('$replyLists.likeReplyCount'), $.size('$likeCommentList')]),
      hasLiked: $.cond({
        if: $.gt([$.size('$hasLikedCommentArr'), 0]),
        then: $.arrayElemAt(['$hasLikedCommentArr', 0]),
        else: false
      })
    }).sort({
      likeCommentSum: -1, //点赞总数多的靠前
      commentTimeDa: 1 //发布时间较早的靠前
    }).skip(skipNum).limit(5).end();


}