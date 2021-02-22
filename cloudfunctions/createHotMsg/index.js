// 系统消息：每隔1小时报告当前圈内最热帖子
const cloud = require('wx-server-sdk')

cloud.init()
const db=cloud.database();
const _=db.command;
const $=_.aggregate;

// 云函数入口函数
exports.main = async (event, context) => {
  //查询钓友圈最热的帖子
  let talkBestRes=await db.collection("talk").aggregate().lookup({
    from:'angler',
    localField:'_openid',
    foreignField:'_openid',
    as:'userInfo'
  }).lookup({
    from:'likeTalk',
    localField:'_id',
    foreignField:'likeTalkId',
    as:'likeArr'
  }).lookup({
    from:'collectTalk',
    localField:'_id',
    foreignField:"collectTalkId",
    as:'collectArr'
  }).lookup({
    from:'comment',
    localField:'_id',
    foreignField:'commentTalkId',
    as:'commentArr'
  }).project({
    _id:1,
    _openid:1,
    content:1,
    images:1,
    publishTime:1,
    title:1,
    userInfo:1,
    likeArr:1,
    collectArr:1,
    commentArr:1,
    hotSum:$.sum([$.size('$likeArr'),$.size('$collectArr'),$.size('$commentArr')])
  }).sort({
    hotSum:-1
  }).end();
  let hotTalk=talkBestRes.list[0];
  //推送系统消息：最热的talk帖子给注册用户
  let anglerRes=await db.collection("angler").get();
  for(let useritem of anglerRes.data){
    let curOpenId=useritem._openid;
    let newSysMsg={
      toUser:curOpenId,
      type:'normal',
      time:new Date(),
      status:'progress',
      messageDetail:{
        msgFrom:'talk',
        msgFromId:hotTalk._id,
        msgContent:hotTalk.userInfo[0].tempNickName+"在钓友圈发的帖子，快来围观吧"
      }
    }

    db.collection("message").add({
      data:newSysMsg
    });
  }
  
  
}