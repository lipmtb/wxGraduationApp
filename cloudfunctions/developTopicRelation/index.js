// 功能：主题的关系增加好感度1
const cloud = require('wx-server-sdk')

cloud.init()
const db=cloud.database();
const _=db.command;
// 云函数入口函数
exports.main = async (event, context) => {

    let relevantId=event.relatedId;
    return await db.collection("topicRelevant").doc(relevantId).update({
      data:{
        relatedCount:_.inc(1)
      }
    });

  
}