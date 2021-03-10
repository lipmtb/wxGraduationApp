//系统公告消息
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;


exports.main = async (event, context) => {
  let msgContent=event.content;
  let userRes = await db.collection("angler").get();
   //给每个注册用户推送系统消息
   let prosAll=[];
  for (let user of userRes.data) { 
   
    let newMsg = {
      type: 'system',
      status: 'progress',
      time: new Date(),
      toUser: user._openid,
      messageDetail:{
        msgFrom:'systemAnnounce',
        msgContent:msgContent
      }
    }
    prosAll.push(await db.collection("message").add({
      data:newMsg
    }))
  
  }
  return await Promise.all(prosAll);

}