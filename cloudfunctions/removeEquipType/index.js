//删除某个装备类型
const cloud = require('wx-server-sdk');

cloud.init();
const db=cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  let delTpId=event.typeId;
  
  let eTypeRes= await db.collection("equipType").doc(delTpId).get();
  if(eTypeRes.equipTypeName==='其他'){
    return "禁止删除";
  }
  //将涉及的类型的装备改为其他类型
  let updateRes=await db.collection("equip").where({
    equipTypeId:delTpId
  }).update({
    equipTypeId:'28ee4e3e604160dd08e4f4845a35afe1'
  });
  let rmTypeRes= await db.collection("equipType").doc(delTpId).remove();
  return [rmTypeRes,updateRes];
 
}