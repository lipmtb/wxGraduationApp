// login云函数
// 功能描述：判断用户是否注册过
const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: 'blessapp-20201123'
});
const db=cloud.database();

exports.main = async (event, context) => {
  const wxContext = await cloud.getWXContext();
  const openId = wxContext.OPENID;
  let res=await db.collection('angler').where({
    _openid:openId
  }).get();
  console.log(res);
  return res.data;
}