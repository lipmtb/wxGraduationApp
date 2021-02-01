// login云函数
const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db=cloud.database();

exports.main = async (event, context) => {
  return await db.collection("talk").aggregate()
  .lookup({
    from:'angler',
    localField:'_openid',
    foreignField:'_openid',
    as:'userInfo'
  }).end();
}