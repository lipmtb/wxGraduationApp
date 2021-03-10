//删除问答圈的帖子
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {

  let essayId = event.questionId;
  let allDel = [];

  //删除评论
  //1.获取帖子的主评论和评论回复
  let questionAllComments = await db.collection("questionComment").where({
    commentQuestionId: essayId
  }).get();
  let mainCommentArr = [];
  let replyIdArr=[];
  for (let commentItem of questionAllComments.data) {
    let replyComments=await db.collection("questionCommentReply").where({
      tarCommentId:commentItem._id
    }).get();
    for(let reItem of replyComments.data){
      replyIdArr.push(reItem._id);
    }
    mainCommentArr.push(commentItem._id);
  }
 

  //2.删除主评论和回复的点赞
  let likeCommentRes = await db.collection("likeQuestionComment").where(
   _.or([{
      likeCommentId:_.in(mainCommentArr)
    },{
      likeCommentId:_.in(replyIdArr)
    }])
  ).remove();
  allDel.push(likeCommentRes);

  //删除评论回复
  let delCommentReplyRes = await db.collection("questionCommentReply").where({
    _id: _.in(replyIdArr)
  }).remove();
  allDel.push(delCommentReplyRes);

  //删除主评论
  let delMainCommentRes = await db.collection("questionComment").where({
    _id: _.in(mainCommentArr)
  }).remove();
  allDel.push(delMainCommentRes);


  //删除帖子收藏
  let collectRes = await db.collection("collectQuestion").where({
    collectQuestionId: essayId
  }).remove();
  allDel.push(collectRes);
  
 //删除帖子上传的文件
 let essayItem = await db.collection("question").doc(essayId).get();
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
  let delEssayRes = await db.collection("question").doc(essayId).remove();
  allDel.push(delEssayRes);

  //删除消息
  let mesRes = await db.collection("message").where({
    'messageDetail.msgFromId': essayId
  }).remove();
  allDel.push(mesRes);

  return allDel;

}