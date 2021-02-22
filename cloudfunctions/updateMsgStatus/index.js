//更新消息的状态progress变为finish
const cloud = require('wx-server-sdk');

cloud.init();

const db=cloud.database();
exports.main = async (event, context) => {
  let msgId=event.messageId;
  return await db.collection("message").doc(msgId).update({
    data:{
      status:'finish'
    }
  });

  
}