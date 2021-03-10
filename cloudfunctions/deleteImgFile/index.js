//删除上传的文件
const cloud = require('wx-server-sdk')

cloud.init();



exports.main = async (event, context) => {
  let fileId=event.imgId;
 let delRes=await cloud.deleteFile({
   fileList:[fileId]
 });
 return delRes.fileList;
}