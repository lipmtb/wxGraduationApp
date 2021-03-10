//删除装备，同时更新相关订单状态
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {

  let eId = event.equipId;
  let allDel = [];

  //装备相关的预约订单及其提醒订单取消消息
  let orderRes=await db.collection("rentEquip").where({
    rentEquipId:eId
  }).get();
  let type="equipOrder";
  let orderMsgPros=[];
  for(let od of orderRes.data){
    //更新状态为destroy
   let updateRes=await  db.collection("rentEquip").doc(od._id).update({
      data:{
        orderStatus:'destroy'
      }
    });
    let toUser=od._openid;
    let msg={
      msgContent:'租赁订单被取消，装备发布者取消了装备',
      msgFrom:"rentEquip",
      msgFromId:od._id
    }
    let msgRes=await cloud.callFunction({
      name:'createOrderMsg',
      data:{
        type:type,
        toUser:toUser,
        msgDetail:msg
      }
    });
    orderMsgPros.push(msgRes.result);
    orderMsgPros.push(updateRes);
    
  }

  allDel.push(orderMsgPros);

  //删除帖子评论
  // let delCommentRes = await db.collection("commentLoc").where({
  //   commentLocId: essayId
  // }).remove();
  // allDel.push(delCommentRes);

  //删除装备收藏
  let collectRes = await db.collection("collectEquip").where({
    collectEquipId: eId
  }).remove();
  allDel.push(collectRes);

  //删除帖子上传的文件
  let essayItem = await db.collection("equip").doc(essayId).get();
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

  //删除装备
  let delEssayRes = await db.collection("equip").doc(eId).remove();
  allDel.push(delEssayRes);

  return allDel;

}