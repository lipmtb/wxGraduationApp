// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();
const db=cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  let uId=event.userId;
  let operType=event.operType;
  let newRight=[1,0,0,1];
  if(operType==="add"){
    newRight=[1,1,1,1];
  }
  return await db.collection("angler").doc(uId).update({
    data:{
      right:newRight
    }
  });

 
}