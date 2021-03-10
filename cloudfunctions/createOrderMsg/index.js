// 钓点消息和租赁消息发给所有者
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();



// 云函数入口函数
exports.main = async (event, context) => {

  let toUser = event.toUser;
  let msgDetail = event.msgDetail;
  let type=event.type||'locOrder';
  return await db.collection("message").add({
    data: {
      type: type,
      status: "progress",
      time : new Date(),
      toUser:toUser,
      messageDetail:msgDetail
    }
  });


}