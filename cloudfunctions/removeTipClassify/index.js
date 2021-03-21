// 删除某个技巧类型主题(包括主题的topicRelevant,阅读，和主题下的所有帖子)
const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  let allDel = [];
  let delTpId = event.topicId;
  //删除主题相关
  let topicRelevantRes = await db.collection("topicRelevant").where(_.or([{
    fromTopicId: delTpId
  }, {
    toTopicId: delTpId
  }])).remove();
  allDel.push(topicRelevantRes);
  //删除阅读
  // let readRes = await db.collection("readTopic").where({
  //   classifyId: delTpId
  // }).remove();

  //删除类型的相关帖子
  let essayArrRes = await db.collection("tipEssays").where({
    classifyId: delTpId
  }).get();
  let rmArr = [];
  for (let delItem of essayArrRes.data) {
    let delTipItemRes=await cloud.callFunction({
      name: 'deleteMyTip',
      data: {
        tipId: delItem._id
      }
    });
    rmArr.push(delTipItemRes.result);
  }
  allDel.push(rmArr);
  //删除技巧类型
  let topicRm = await db.collection("tipClassify").doc(delTpId).remove();

  allDel.push(topicRm);
  return allDel;
}