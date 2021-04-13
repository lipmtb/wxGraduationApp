//app.js
let db=null;
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })
    }

    this.globalData = {}// regist.js 添加：app.globalData.userObj = userObj;
  
   
  },
  onShow(e){
    // console.log(e);

    let that=this;
    db=wx.cloud.database();
    wx.cloud.callFunction({
      name:'getUserOpenId'
    }).then((res)=>{
  
      that.globalData.userOpenId=res.result;
      wx.setStorageSync('userOpenId', res.result);
      db.collection("angler").where({
        _openid:res.result
      }).get().then((userArr)=>{
        if(userArr.data.length===0){
          if(e.path==='pages/regist/regist'){
              return;
          }
          wx.redirectTo({
            url: '/pages/regist/regist',
          })
        }
      });
    })
   
  }
})
