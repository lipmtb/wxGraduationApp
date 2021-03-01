const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

const template_id = 'uMBavbmSSxRegKG4prOU9l1vbDFJiwvMrvzb22cAICo'; // 小程序模板消息模板 id

// 云函数入口函数
exports.main = async (event, context) => {

  let touser = event.userId; //接收订阅消息的用户openid，即装备主人
  let fromUserName = event.fromUserName;
  // let equipName = event.equipName;
  let related = event.related;
  let address = event.address;
  let rentStart = event.rentStartTime;
  let rentEnd = event.rentEndTime;
  let rId=event.rentId;

  // 发送模板消息
  let result = await cloud.openapi.subscribeMessage.send({
    touser, //接收者（用户）的 openid
    template_id, //所需下发的订阅模板id
    miniprogram_state: 'developer',
    lang: "zh_CN",
    data: {
      phone_number2: {
        value: related
      },
      thing4: {
        value: address
      },
      time7: {
        value: rentStart
      },
      time8: {
        value: rentEnd
      },
      name1:{
        value:fromUserName
      }
    },
      page: `pages/home/myRent/rentOrderDetail/rentOrderDetail?rentId=${rId}` // 点击模板消息后，跳转的页面
  });
  return result;

}