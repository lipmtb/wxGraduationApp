//阅读技巧类型
const cloud = require('wx-server-sdk');
cloud.init();
const db=cloud.database();
const _=db.command;

exports.main = async (event, context) => {
  let tipClassId=event.classifyId;

  return await db.collection("tipClassify").doc(tipClassId).update({
    data:{
      readCount:_.inc(1)
    }
  });

}