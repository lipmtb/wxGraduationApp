// 添加新的主题分类:阅读量默认0
const cloud = require('wx-server-sdk');

cloud.init();
const db=cloud.database();
exports.main = async (event, context) => {
  let newTopicName = event.classifyName;
  let resAdd= await db.collection("tipClassify").add({
    data: {
      classifyName: newTopicName
    }
  });
  //新主题默认阅读量=0
  await db.collection("readTopic").add({
    data:{
      classifyId:resAdd._id,
      readCount:0
    }
  });
  return resAdd;


}