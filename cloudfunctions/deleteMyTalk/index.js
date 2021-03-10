//删除钓友圈的帖子
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {

  let essayId = event.talkId;
  let allDel = [];


  //删除帖子评论
  let delCommentRes = await db.collection("comment").where({
    commentTalkId: essayId
  }).remove();
  allDel.push(delCommentRes);
  //删除帖子收藏
  let collectRes = await db.collection("collectTalk").where({
    collectTalkId: essayId
  }).remove();
  allDel.push(collectRes);
  //删除点赞
  let likeRes = await db.collection("likeTalk").where({
    likeTalkId: essayId
  }).remove();
  allDel.push(likeRes);

  //删除消息
  let mesRes = await db.collection("message").where({
    'messageDetail.msgFromId': essayId
  }).remove();
  allDel.push(mesRes);

  //删除帖子上传的文件
  let essayItem = await db.collection("talk").doc(essayId).get();
  let delImgArr=[];
  for(let fileid of essayItem.data.images){
    let delFileImgRes=await cloud.callFunction({
      name:'deleteImgFile',
      data:{
        imgId:fileid
      }
    });
    delImgArr.push(delFileImgRes.result);
  }
  allDel.push(delImgArr);
  //删除帖子
  let delEssayRes = await db.collection("talk").doc(essayId).remove();
  allDel.push(delEssayRes);
  return allDel;

}