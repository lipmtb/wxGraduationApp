//关键词提取
const cloud = require('wx-server-sdk');
cloud.init();

const tencentcloud = require("tencentcloud-sdk-nodejs");
const https = require("https");
const NlpClient = tencentcloud.nlp.v20190408.Client;

exports.main = async (event, context) => {
  let sId = event.secretId;
  let sKey = event.secretKey;
  const clientConfig = {
    credential: {
      secretId: sId,
      secretKey: sKey,
    },
    region: "ap-guangzhou",
    profile: {
      httpProfile: {
        endpoint: "nlp.tencentcloudapi.com",
      },
    },
  };
  const client = new NlpClient(clientConfig);
  let reqKeyStr = event.keyword;
  let paramReq = {
    "Num": 20,
    "Text": reqKeyStr
  };

  let reqRes = await new Promise((resolve, reject) => {
    client.KeywordsExtraction(paramReq).then(
      (data) => {
        resolve(data);
      },
      (err) => {
        console.error("error", err);
        reject(err);
      }
    );
  });
  let arr = [];
  for (let splitKey of reqRes.Keywords) {
    let keystr = encodeURI(splitKey.Word);
    let allRes = [];
    let option = {
      hostname: 'www.baidu.com',
      path: "/sugrec?pre=1&p=3&ie=utf-8&json=1&prod=pc&from=pc_web&wd=" + keystr,
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'utf-8', //这里设置返回的编码方式 设置其他的会是乱码
        'Accept-Language': 'zh-CN,zh;q=0.8',
        'Connection': 'keep-alive',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
      }
    };

    let baiduRes = await new Promise((resolve) => {
      https.get(option, function (incomming) {
        incomming.on("data", function (chunk) {
          resolve(JSON.parse(chunk.toString()));
        })
      })
    });

    //  对百度返回的词条推荐结果进行关键词提取
    for (let qItem of baiduRes.g) {
      let recommendStr = qItem.q;
      let params = {
        "Num": 20,
        "Text": recommendStr
      };

      let resKey = await new Promise((resolve, reject) => {
        client.KeywordsExtraction(params).then(
          (data) => {
            resolve(data);
          },
          (err) => {
            console.error("error", err);
            reject(err);
          }
        );
      });
      allRes.push(resKey);
    }
    for (let keywordItem of allRes) {
      for (let keyobj of keywordItem.Keywords) {
        arr.push(keyobj.Word);
      }
    }
  }

  return arr;

}