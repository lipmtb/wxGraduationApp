// 获取某个经纬度的天气信息：24小时的天气，未来几天的天气
const cloud = require('wx-server-sdk');
const {config}=require("config.js");//接口地址和key
const zlib=require("zlib");
cloud.init();
const https=require("https");


// 云函数入口函数
exports.main = async (event, context) => {
  let longNum=event.long;
  let latNum=event.lat;
  let urlStr=config.base;
  let locationStr=longNum+","+latNum;
  let timeWea=event.daWeather||"now";
  urlStr=urlStr+timeWea+"?key="+config.key+"&location="+locationStr;
  let resJson="";

  return await new Promise((resolve,reject)=>{
    https.get(urlStr,(incomming)=>{
      let unzipIncomm=incomming.pipe(zlib.createGunzip());
      unzipIncomm.on("data",(chunk)=>{
        resJson+=chunk.toString("utf8");
      });
      unzipIncomm.on("end",()=>{
        console.log("返回的数据",resJson);
        resolve(resJson);
      })
    })
  })

  
}