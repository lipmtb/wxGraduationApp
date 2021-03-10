// 添加新的主题分类
const cloud = require('wx-server-sdk');

cloud.init();
const db=cloud.database();
exports.main = async (event, context) => {
  let newEqName = event.newEqTypeName;
  let resAdd= await db.collection("equipType").add({
    data: {
      equipTypeName: newEqName
    }
  });
 
  return resAdd;


}