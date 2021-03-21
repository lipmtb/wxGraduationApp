// 处理预约和租赁的未确认订单
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

exports.main = async (event, context) => {

  let allDel = [];
  //删除1周前的已读消息
  let curDa = new Date();
  let lastWeekDa = new Date(curDa - 7 * 24 * 60 * 60 * 1000);
  let removedLastWeekMsg = await db.collection("message").where({
    status: 'finish',
    time: _.lt(lastWeekDa)
  }).remove();

  allDel.push(removedLastWeekMsg);

  //消息相关的订单不能删除
  let curMsgReletedOrder=await db.collection("message").where({
    type:_.eq("locOrder").or(_.eq("equipOrder"))
  }).get();
  let oIdArr=[];
  for(let od of curMsgReletedOrder.data){
    oIdArr.push(od.messageDetail.msgFromId);
  }

  let delLocRes=await db.collection("orderLoc").where({
    orderStatus:'unconfirmed',
    _id:_.not(_.in(oIdArr))
  }).remove();

  let delRentRes=await db.collection("rentEquip").where({
    orderStatus:'unconfirmed',
    _id:_.not(_.in(oIdArr))
  }).remove();

  allDel.push(delLocRes);
  allDel.push(delRentRes);

  return allDel;
}