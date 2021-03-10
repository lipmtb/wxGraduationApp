// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();
const db=cloud.database();
const _=db.command;
const $=_.aggregate;

exports.main = async (event, context) => {
  return await  db.collection("tipClassify").aggregate()
  .lookup({
    from: 'readTopic',
    localField: '_id',
    foreignField: 'classifyId',
    as: 'readLists'
  }).project({
    _id: 1,
    classifyName: 1,
    readCount: $.size('$readLists')
  }).sort({
    readCount: -1
  }).limit(6).end();
}