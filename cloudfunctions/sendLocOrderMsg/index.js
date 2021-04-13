const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

const template_id = 'QIk7dR4Q-XsKlu22ED5O8zJ26_08ZWW5ZtQkUdj_m08'; // 小程序订阅消息模板 id

// 云函数入口函数
exports.main = async (event, context) => {

  let touser=event.userId;//接收订阅消息的用户openid，即钓点发布者
  let locNameStr=event.locName;//钓点的名称
  let orderLocTime=event.orderTimeStr;//预约的时间
  let fromUserName=event.fromUser;//预约的用户名
  let oLocId=event.orderId;

  // 发送订阅消息
  let result = await cloud.openapi.subscribeMessage.send({
    touser,  //接收者（用户）的 openid
    template_id, //所需下发的订阅模板id
    miniprogram_state:'developer',
    lang:"zh_CN",
    data: {
      date2: {
        value:orderLocTime
      },
      phrase3: {
        value:"你的钓点"
      },
      name1: {
        value: fromUserName.slice(0,10)
      }
    },
     page: `pages/home/myOrder/orderLocDetail/orderLocDetail?oId=${oLocId}` // 点击模板消息后，跳转的页面
  });
  return result;

}