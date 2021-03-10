//删除技巧的帖子
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {

  let essayId = event.tipId;
  let allDel = [];


  //删除帖子评论
  let delCommentRes = await db.collection("tipComment").where({
    commentTipId: essayId
  }).remove();
  allDel.push(delCommentRes);

  //删除帖子收藏
  let collectRes = await db.collection("collectTip").where({
    collectTipId: essayId
  }).remove();

  allDel.push(collectRes);
  //删除点赞
  let likeRes = await db.collection("likeTip").where({
    likeTipId: essayId
  }).remove();
  allDel.push(likeRes);

  //删除消息
  let mesRes = await db.collection("message").where({
    'messageDetail.msgFromId': essayId
  }).remove();
  allDel.push(mesRes);

  //删除帖子上传的文件
  let essayItem = await db.collection("tipEssays").doc(essayId).get();
  let delImgArr = [];
  for (let fileid of essayItem.data.images) {
    let delFileImgRes = await cloud.callFunction({
      name: 'deleteImgFile',
      data: {
        imgId: fileid
      }
    });
    delImgArr.push(delFileImgRes.result);
  }
  allDel.push(delImgArr);

  //删除帖子
  let delEssayRes = await db.collection("tipEssays").doc(essayId).remove();
  allDel.push(delEssayRes);

  return allDel;

}