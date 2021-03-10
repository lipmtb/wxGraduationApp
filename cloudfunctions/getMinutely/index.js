// 获取2小时内的天气变化：分钟级降水
const cloud = require('wx-server-sdk');
cloud.init();
const {
  config
} = require("config.js");
const zlib = require("zlib");
const https = require("https");


exports.main = async (event, context) => {
  let longNum = event.long;
  let latNum = event.lat;
  let urlStr = config.base;
  let locationStr = longNum + "," + latNum;
  let timeWea = event.daWeather || "5m";
  urlStr = urlStr + timeWea + "?key=" + config.key + "&location=" + locationStr;
  let resJson = "";

  return await new Promise((resolve, reject) => {
    https.get(urlStr, (incomming) => {
      let unzipIncomm = incomming.pipe(zlib.createGunzip());//gzip解压
      unzipIncomm.on("data", (chunk) => {
        resJson += chunk.toString("utf8");
      });
      unzipIncomm.on("end", () => {
        console.log("返回的数据", resJson);
        resolve(resJson);
      })
    })
  })


}