// 功能：插入新的主题关系
const cloud = require('wx-server-sdk')

cloud.init()
const db=cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
    let fromTopicId=event.fromId;
    let toTopicId=event.toId;
    return await db.collection("topicRelevant").add({
      data:{
        fromTopicId:fromTopicId,
        toTopicId:toTopicId,
        relatedCount:1
      }
    });
}