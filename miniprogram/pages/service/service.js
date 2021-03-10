import * as echart from '../../ec-canvas/echarts';
let QQMapWX = require('../../qqmap-wx-jssdk1.2/qqmap-wx-jssdk');
const db = wx.cloud.database();
const _ = db.command;
const $ = _.aggregate;
//24小时天气
let weatherOption = {
  title: {
    text: "未来24小时气温云量预报",
    show: true,
    textStyle: {
      fontSize: 16,
      color: '#666'
    }
  },
  legend: {
    data: [{
      name: '气温'
    }, {
      name: '云量',
      icon: 'circle'
    }],
    left: 200,
    top: 10
  },
  grid: {
    left: 30,
    width: '90%',
    height: '60%',
    bottom: 50
  },
  dataset: {
    // 图形的数据来源
    source: [
      ["product", "temper", "cloudlg"]
    ]
  },
  xAxis: {
    name: '气温云量',
    type: 'category'
    // axisPointer: {
    //   label: {
    //     formatter: function (params) {

    //       return params.value +
    //         (params.seriesData.length ? '：' + params.seriesData[0].data : '');
    //     }
    //   }
    // }
  },
  yAxis: {},
  dataZoom: { //控制第一个xAxis的拉伸
    xAxisIndex: 0
  },
  series: [{
    name: '气温',
    type: 'line',
    encode: {
      x: 'product',
      y: 'temper'
    },
    label: {
      show: true,
      fontSize: 8
    }
  }, {
    name: '云量',
    type: 'bar',
    encode: {
      x: 'product',
      y: 'cloudlg'
    }
  }]

}
let tempChart = null;

//风力风速
let windOption = {
  title: {
    text: "未来24小时风力风速预报",
    show: true,
    textStyle: {
      fontSize: 16,
      color: '#666'
    }
  },
  legend: {
    data: [{
      name: '风速',
      icon: 'arrow'
    }, {
      name: '风力',
      icon: 'arrow'
    }],
    left: 200,
    top: 10
  },
  grid: {
    left: 30,
    width: '90%',
    height: '60%',
    bottom: 50
  },
  dataset: {
    // 图形的数据来源
    source: [
      ["product", "windsp", "windlg"]
    ]
  },
  xAxis: {
    name: '风力风速',
    type: 'category'
  },
  yAxis: {},
  dataZoom: { //控制第一个xAxis的拉伸
    xAxisIndex: 0
  },
  series: [{
    name: '风速',
    type: 'line',
    encode: {
      x: 'product',
      y: 'windsp'
    }
  }, {
    name: '风力',
    type: 'bar',
    encode: {
      x: 'product',
      y: 'windlg'
    }
  }]

}
let windChart = null;

//2小时内降水
let minutelyOption = {
  title: {
    text: "未来2小时降水预报",
    show: true,
    textStyle: {
      fontSize: 16,
      color: '#0df'
    }
  },
  legend: {
    data: [{
      name: '降水量'
    }],
    left: 180,
    top: 24
  },
  grid: {
    left: 30,
    width: '90%',
    height: '60%',
    bottom: 50
  },
  dataset: {
    // 图形的数据来源
    source: [
      ["product", "precip"]
    ]
  },
  xAxis: {
    type: 'category'

  },
  yAxis: {},
  series: [{
    name: '降水量',
    type: 'bar',
    encode: {
      x: 'product',
      y: 'precip'
    }
  }]

}
let minutelyChart = null;

//7天天气情况
let dailyChart = null;
let dailyOption = {
  title: {
    text: "未来一周气温变化",
    show: true,
    textStyle: {
      fontSize: 16,
      color: '#fc0'
    }
  },
  legend: {
    data: [{
      name: '最高温'
    }, {
      name: '最低温'
    }],
    left: 180,
    top: 0
  },
  grid: {
    left: 30,
    width: '90%',
    height: '60%',
    bottom: 50
  },
  dataset: {
    // 图形的数据来源
    source: [
      ["product", "maxTemp", "minTemp"]
    ]
  },
  xAxis: [{
      type: 'category'
    }, {
      data: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      position: 'bottom',
      axisLabel: {
        margin: 20
      }
    }

  ],
  yAxis: {},
  series: [{
    name: '最高温',
    type: 'line',
    encode: {
      x: 'product',
      y: 'maxTemp'
    },
    label: {
      show: true,
      fontSize: 12
    }
  }, {
    name: '最低温',
    type: 'line',
    encode: {
      x: 'product',
      y: 'minTemp'
    },
    label: {
      show: true,
      fontSize: 12
    }
  }]
}
Page({

  pageData: {
    qqmapsdk: null, //腾讯位置服务api对象
    curLat: 0, //当前位置的纬度
    curLng: 0, //当前位置的经度
    curInputText: '', //搜索地点的输入
    recommendLocLists: [],
    curRecommendLocCount: 0,
    minDis: 0,
    maxDis: 10000, //默认取10km内的地点
    hasMoreRecLoc: true
  },
  data: {
    active: 0, //当前的服务是天气服务，钓点服务还是其他
    defaultDis: 0, //默认10km以内
    visibleCount: 2, //默认的显示行数
    disColumns: ["10km内", "10km-50km", "50km以上"],
    weatherEc: {
      onInit: function (canvas, width, height, dpr) {
        tempChart = echart.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        canvas.setChart(tempChart);

        tempChart.setOption(weatherOption);
        return tempChart;
      }
    },
    windEc: {
      onInit: function (canvas, width, height, dpr) {
        windChart = echart.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });

        canvas.setChart(windChart);
        windChart.setOption(windOption);
        return windChart;
      }
    },
    minuteEc: {
      onInit: function (canvas, width, height, dpr) {
        minutelyChart = echart.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        canvas.setChart(minutelyChart);

        minutelyChart.setOption(minutelyOption);
        return minutelyChart;
      }
    },
    seventDayEc: {
      onInit: function (canvas, width, height, dpr) {
        dailyChart = echart.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        canvas.setChart(dailyChart);

        dailyChart.setOption(dailyOption);
        return dailyChart;
      }
    },
    iconCode: 100 //天气的图标
  },
  onTabChange(e) {
    console.log(e.detail);
  },
  onConfirmDis(e) {
    // console.log(e.detail.index);
    let that = this;
    wx.showLoading({
      title: '加载中'
    })
    switch (e.detail.index) {
      case 0: {
        that.pageData.minDis = 0;
        that.pageData.maxDis = 10000;
        break;
      }
      case 1: {
        that.pageData.minDis = 10000;
        that.pageData.maxDis = 50000;
        break;
      }
      case 2: {
        that.pageData.minDis = 50000;
        that.pageData.maxDis = 1000000000;
        break;
      }
    }

    that.pageData.hasMoreRecLoc = true;
    that.pageData.curRecommendLocCount = 0;
    that.pageData.recommendLocLists = [];

    that.getNearRecommendLocLists().then(() => {
      wx.hideLoading({
        success: (res) => {
          that.setData({
            visibleCount: 0
          })
        },
      })
    });
  },
  onSelectDis(e) {
    // console.log(e);
    this.setData({
      visibleCount: 2
    })
  },
  onLoad() {
    this.pageData.qqmapsdk = new QQMapWX({
      key: 'YSTBZ-2AV62-M4MUW-CBF5K-OSK2F-4CBEF'
    });
    //天气服务
    //获取当前位置信息，并获取当前位置的天气情况
    this.getCurrentLocation().then(() => {
      this.getRecommendLocationName(); //坐标逆地址解析为人性化的地址名
      this.getWeatherByLoca(); //获取当前经纬度的实时天气
      this.getFurture24(); //获取未来24小时天气情况
      this.getMinutesPrecip(); //获取降水情况
      this.getFurtureDayWeather(); //获取未来7天的天气情况
      this.getNearRecommendLocLists();
    });
    this.getDatimeText(); //获取当前日期

  },
  onShow() {

    this.getTabBar().init();
  },
  onPullDownRefresh() {
    wx.showLoading({
      title: '正在刷新',
    });
    this.getCurrentLocation().then(async () => {
      await this.getRecommendLocationName(); //坐标逆地址解析为人性化的地址名
      await this.getWeatherByLoca(); //获取当前经纬度的天气
      await this.getFurture24(); //获取未来24小时天气情况
      await this.getMinutesPrecip(); //获取降水情况
      await this.getFurtureDayWeather(); //获取未来7天的天气情况
      wx.stopPullDownRefresh({
        success: (res) => {
          this.getDatimeText(); //获取当前日期
        },
      })
      wx.hideLoading({
        success: (res) => {},
      })
    });
   
  },
  // 获取当前日期格式：2021-02-21
  getDatimeText() {
    let da = new Date();

    let daTimeText = da.toLocaleDateString();
    let daStr = daTimeText.split("\/");
    daStr = daStr.join("-");
    this.canvasStrokeText("#da-time-canvas", daStr, 40);

  },
  //获取当前经纬度的实时天气
  async getWeatherByLoca() {
    let that = this;
    let curWeaRes = await wx.cloud.callFunction({
      name: "getDiaryWeather",
      data: {
        long: that.pageData.curLng,
        lat: that.pageData.curLat
      }
    });
    let wea = JSON.parse(curWeaRes.result);
    // console.log(wea);
    this.setData({
      iconCode: wea.now.icon
    })
    let canvasTextCond = wea.now.text; //晴
    let canvasTextWind = wea.now.windDir; //风向
    let canvasTextTmp = "气温:" + wea.now.temp; //气温
    let canvasTextHum = "湿度:" + wea.now.humidity; //湿度
    let canvasTextPres = "气压:" + wea.now.pressure; //气压
    this.canvasStrokeText("#loc-wea-cond", canvasTextCond, 36);
    this.canvasStrokeText("#loc-wea-wind", canvasTextWind, 36);
    this.canvasStrokeText("#loc-wea-tmp", canvasTextTmp, 42);
    this.canvasStrokeText("#loc-wea-hum", canvasTextHum, 32);
    this.canvasStrokeText("#loc-wea-pres", canvasTextPres, 32);

    //格式化最近更新时间
    let lastModifyStr = wea.updateTime;
    let resStrMod = this.customFormatLastModifyTime(lastModifyStr);
    this.setData({
      modifyTimeStr: resStrMod
    })
  },
  //格式化更新时间date.toLocaleString的输出
  customFormatLastModifyTime(lastModifyStr) {

    let lastArr = new Date(lastModifyStr).toLocaleString().split('/');
    lastArr.shift();
    let lastStr1 = lastArr.join("月");

    let lastStrArr = lastStr1.split(/(.)(?=午)/);
    lastStrArr.splice(1, 0, '日');
    let lastStrResult = lastStrArr.join("");

    return lastStrResult;
  },
  //获取24小时天气
  async getFurture24() {
    let that = this;
    let fu24Res = await wx.cloud.callFunction({
      name: 'getDiaryWeather',
      data: {
        long: that.pageData.curLng,
        lat: that.pageData.curLat,
        daWeather: '24h'
      }
    });
    let weaRes = JSON.parse(fu24Res.result);
    // console.log(weaRes);
    let hourlyArr = weaRes.hourly;
    let fxTimeArr = new Array();
    let windTimeArr = new Array();
    for (let hourlyItem of hourlyArr) {
      let temparr = new Array(3);
      let windarr = new Array(3);
      temparr[0] = hourlyItem.fxTime.split(/T|\+/)[1];
      temparr[1] = parseInt(hourlyItem.temp);
      temparr[2] = parseInt(hourlyItem.cloud);

      windarr[0] = hourlyItem.fxTime.split(/T|\+/)[1];
      windarr[1] = parseInt(hourlyItem.windSpeed);
      windarr[2] = parseInt(hourlyItem.windScale);
      fxTimeArr.push(temparr);
      windTimeArr.push(windarr);

    }

    weatherOption.dataset.source.splice(1, 24, ...fxTimeArr);
    windOption.dataset.source.splice(1, 24, ...windTimeArr);

    // console.log(weatherOption.dataset.source);
    tempChart.setOption(weatherOption);
    windChart.setOption(windOption);

  },
  //获取未来2小时的降水量
  async getMinutesPrecip() {
    let minutelyReq = await wx.cloud.callFunction({
      name: 'getMinutely',
      data: {
        long: this.pageData.curLng,
        lat: this.pageData.curLat
      }
    });
    let mRes = minutelyReq.result;

    let mResObj = JSON.parse(mRes);
    // console.log(mResObj);
    let minuteAll = new Array();
    for (let minuteItem of mResObj.minutely) {
      let arr = new Array(2);
      arr[0] = minuteItem.fxTime.split(/T|\+/)[1];
      arr[1] = parseFloat(minuteItem.precip);
      minuteAll.push(arr);
    }
    minutelyOption.title.text = mResObj.summary;
    minutelyOption.dataset.source.splice(1, 24, ...minuteAll);
    minutelyChart.setOption(minutelyOption);

  },
  //获取未来7天的天气情况
  async getFurtureDayWeather() {
    let that = this;
    let furRes = await wx.cloud.callFunction({
      name: 'getDiaryWeather',
      data: {
        long: that.pageData.curLng,
        lat: that.pageData.curLat,
        daWeather: '7d'
      }
    });
    let weaRes = JSON.parse(furRes.result);
    // console.log(weaRes);
    let arrAll = new Array();
    let dayNameArr = [];
    for (let weaitem of weaRes.daily) {
      let arr = new Array(3);
      let fxDa = weaitem.fxDate;
      let dayDa = new Date(fxDa);
      let dayNum = dayDa.getDay();
      switch (dayNum) {
        case 0: {
          dayNum = "周日"
          break;
        }
        case 1: {
          dayNum = "周一";
          break;
        }
        case 2: {
          dayNum = "周二";
          break;
        }
        case 3: {
          dayNum = "周三";
          break;
        }
        case 4: {
          dayNum = "周四";
          break;
        }
        case 5: {
          dayNum = "周五";
          break;
        }
        case 6: {
          dayNum = "周六";
          break;
        }
      }
      dayNameArr.push(dayNum);
      arr[0] = fxDa.slice(6);
      arr[1] = parseInt(weaitem.tempMax);
      arr[2] = parseInt(weaitem.tempMin);
      arrAll.push(arr);

    }
    dailyOption.xAxis[1].data = dayNameArr;
    dailyOption.dataset.source.splice(1, 7, ...arrAll);
    // console.log(dailyOption.dataset.source);
    dailyChart.setOption(dailyOption);
  },
  // 绘制某个canvas上的文字
  canvasStrokeText(canvasId, textstr, scale) {
    let query = this.createSelectorQuery();
    query.select(canvasId).fields({
      node: true,
      size: true
    }).exec((quRes) => {
      let canvas = quRes[0].node;
      let width = quRes[0].width;
      let height = quRes[0].height;


      let context = canvas.getContext("2d"); //获取2d上下文对象
      let metrics = context.measureText(textstr); //测量文本的宽度



      let a = -21;
      let timer = setInterval(function () {
        a++;
        if (a === 2) {
          clearInterval(timer);
          return;
        }
        context.clearRect(-20, -20, width * 3, height * 2);
        context.save();
        context.beginPath();
        let linearGra = context.createLinearGradient(width / 2 - metrics.width / 2, height / 2 + 10, width / 2 + metrics.width / 2, height / 2 + 10);
        linearGra.addColorStop(0, "#00f");
        linearGra.addColorStop(0.4, "#0f0");
        linearGra.addColorStop(0.6, "#f0f");
        linearGra.addColorStop(1, "#00f");
        context.fillStyle = linearGra;
        context.font = (scale + a) + "px KaiTi";
        context.closePath();
        context.fillText(textstr, width / 2, height / 2 + 40);
        context.restore();
      }, 100);


    })
  },
  //腾讯位置服务：逆地址解析为地址名
  async getRecommendLocationName() {
    let that = this;

    return await new Promise((resolve, reject) => {
      that.pageData.qqmapsdk.reverseGeocoder({
        location: {
          latitude: that.pageData.curLat,
          longitude: that.pageData.curLng
        },
        success: (res) => {
          console.log("逆地址解析：",res);
          that.setData({
            currentLocationText: res.result.formatted_addresses.recommend
          });
          resolve(res.result);
        },
        fail(errRes) {
          console.log("位置解析失败", errRes);
          that.setData({
            currentLocationText: "未选择"
          })
        }
      })
    })

  },
  //获取用户当前的位置的名称，保存当前设置的经纬度
  //基于这个经纬度位置获取天气情况
  async getCurrentLocation() {
    let that = this;
    return await new Promise((resolve) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
           console.log(res);
          let lon = res.longitude;
          let lat = res.latitude;
          that.pageData.curLat = lat;
          that.pageData.curLng = lon;

          resolve(res);
        }
      })
    })
  },
  //打开地图选择位置
  chooseLocationFn() {
    let that = this;
    wx.chooseLocation({
      latitude: that.pageData.curLat,
      longitude: that.pageData.curLng,
      success(res) {
         console.log("chooseLocation:", res);
        wx.showToast({
          title: '选择位置成功'
        })
        let newLng = res.longitude;
        let newLat = res.latitude;
        that.pageData.curLat = newLat;
        that.pageData.curLng = newLng;

        // that.getRecommendLocationName(); //坐标逆地址解析为人性化的地址名
        that.getWeatherByLoca(); //获取当前经纬度的天气
        that.getFurture24(); //获取未来24小时天气情况
        that.getMinutesPrecip(); //获取降水情况
        that.getFurtureDayWeather(); //获取未来7天的天气情况
        that.setData({
          currentLocationText: res.name
        });
      }
    })
  },
  //钓点服务
  //获取附近的钓点位置列表：recommendLocLists
  async getNearRecommendLocLists() {
    // console.log(this.pageData.curLng, this.pageData.curLat);
    let that = this;
    let nearRes = await db.collection("anglerLoc").aggregate().geoNear({
      distanceField: "distance",
      spherical: true,
      near: db.Geo.Point(that.pageData.curLng, that.pageData.curLat),
      key: "location",
      includeLocs: 'location',
      maxDistance: that.pageData.maxDis,
      minDistance: that.pageData.minDis
    }).sort({
      distance: 1 //距离由近到远
    }).skip(that.pageData.curRecommendLocCount).limit(4).end();
    console.log(nearRes);

    if (nearRes.list.length === 0 || nearRes.list.length < 4) {
      that.pageData.hasMoreRecLoc = false;

    }
    that.pageData.curRecommendLocCount += nearRes.list.length;
    that.pageData.recommendLocLists.push(...nearRes.list);
    that.setData({
      recommendLocLists: that.pageData.recommendLocLists
    })
    return nearRes.list;
  },
  //加载更多钓点
  showMoreLoc() {
    if (this.pageData.hasMoreRecLoc) {
      wx.showLoading({
        title: '更多钓点',
      });
      this.getNearRecommendLocLists().then(() => {
        wx.hideLoading({
          success: (res) => {},
        })
      });
    } else {
      wx.showToast({
        title: '没有更多了'
      })
    }
  },
  //输入搜索关键词
  onInputLoc(e) {
    this.pageData.curInputText = e.detail;
  },
  //搜索某个地址
  onSearch() {
    let that = this;
    this.pageData.qqmapsdk.search({
      keyword: that.pageData.curInputText,
      location: {
        latitude: that.pageData.curLat,
        longitude: that.pageData.curLng
      },
      success: (locres) => {
        console.log("搜索结果：", locres);

        that.setData({
          searchLocLists: locres.data
        })
      }
    })
  },
  //去钓点详情页面
  toLocDetail(e) {
    let locid = e.currentTarget.dataset.locId;
    wx.navigateTo({
      url: 'locDetail/locDetail?locId=' + locid,
    })

  }
})