//删除钓点
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {

  let essayId = event.locId;
  let allDel = [];

  //钓点相关的预约订单及其提醒订单取消消息
  let orderRes = await db.collection("orderLoc").where({
    orderLocId: essayId
  }).get();
  let type = "locOrder";
  let orderMsgPros = [];
  for (let od of orderRes.data) {
    //更新状态为destroy
    let updateRes = await db.collection("orderLoc").doc(od._id).update({
      data: {
        orderStatus: 'destroy'
      }
    });
    let toUser = od._openid;
    let msg = {
      msgContent: '预约订单被取消，钓点发布者取消了钓点',
      msgFrom: "orderLoc",
      msgFromId: od._id
    }
    let msgRes = await cloud.callFunction({
      name: 'createOrderMsg',
      data: {
        type: type,
        toUser: toUser,
        msgDetail: msg
      }
    });
    orderMsgPros.push(msgRes.result);
    orderMsgPros.push(updateRes);

  }

  allDel.push(orderMsgPros);

  //删除帖子评论
  let delCommentRes = await db.collection("commentLoc").where({
    commentLocId: essayId
  }).remove();
  allDel.push(delCommentRes);

  //删除帖子收藏
  let collectRes = await db.collection("collectLoc").where({
    collectLocId: essayId
  }).remove();
  allDel.push(collectRes);


  //删除评分
  let rateRes = await db.collection("rateLoc").where({
    rateLocId: essayId
  }).remove();
  allDel.push(rateRes);

  //删除帖子上传的文件
  let essayItem = await db.collection("anglerLoc").doc(essayId).get();
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


  //删除钓点评论消息
  let mesRes = await db.collection("message").where({
    'messageDetail.msgFromId': essayId
  }).remove();
  allDel.push(mesRes);

  //删除钓点
  let delEssayRes = await db.collection("anglerLoc").doc(essayId).remove();
  allDel.push(delEssayRes);


  return allDel;

}