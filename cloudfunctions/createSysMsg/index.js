//系统消息：统计用户当天的发帖情况
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;


exports.main = async (event, context) => {

  let userRes = await db.collection("angler").get();
   //给每个注册用户推送系统消息
  for (let user of userRes.data) { 
    let curDa = new Date();
    let yesDa = new Date(curDa.getTime() - 24 * 60 * 60 * 1000);
    console.log(curDa,yesDa);
    let talkRes = await db.collection("talk").where({
      _openid: user.openid,
      publishTime: _.and([_.gt(yesDa), _.lt(curDa)])
    }).count();
    let quesRes=await db.collection("question").where({
      _openid:user.openid,
      publishTime: _.and([_.gt(yesDa), _.lt(curDa)])
    }).count();

    let tipRes=await db.collection("tipEssays").where({
      _openid:user.openid,
      publishTime: _.and([_.gt(yesDa), _.lt(curDa)])
    }).count();

    let newHotMsg = {
      type: 'system',
      status: 'progress',
      time: new Date(),
      toUser: user._openid,
      messageDetail:{
        msgFrom:'systemCount',
        msgContent:'你在钓友圈发的帖子数为： '+talkRes.total+' 条'
      }
    }
    let newQuesMsg = {
      type: 'system',
      status: 'progress',
      time: new Date(),
      toUser: user._openid,
      messageDetail:{
        msgFrom:'systemCount',
        msgContent:'你在问答圈发的帖子数为： '+quesRes.total+' 条'
      }
    }
    let newTipMsg = {
      type: 'system',
      status: 'progress',
      time: new Date(),
      toUser: user._openid,
      messageDetail:{
        msgFrom:'systemCount',
        msgContent:'你在技巧发的帖子数为： '+tipRes.total+' 条'
      }
    }
     db.collection("message").add({
      data:newHotMsg
    });
     db.collection("message").add({
      data:newQuesMsg
    });

     db.collection("message").add({
      data:newTipMsg
    });
  }

}