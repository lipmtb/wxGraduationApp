// 获取最新帖子
const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: 'blessapp-20201123'
});
const db = cloud.database();
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  let skipCount = event.skipNum;
  return await db.collection("talk").aggregate().project({
      title: 1,
      images: 1,
      _openid: 1,
      content: 1,
      publishTime: 1
    }).sort({
      publishTime: -1
    }).skip(skipCount).limit(2).end();


}