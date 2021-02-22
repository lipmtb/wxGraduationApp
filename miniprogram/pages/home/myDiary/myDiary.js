// miniprogram/pages/home/myDiary/myDiary.js
const db = wx.cloud.database();
Page({

  data: {
    active: 0,
    titleValue: '',
    contentValue: '',
    addressName: '未选择',
    weatherStr: '未选择',
    hisDiaryLists: [], //历史日记列表
    hasMoreDiary: true
  },
  pageData: {
    titleInputStr: '',
    contentInputStr: '',
    diaryLocationInfo: null,
    diaryWeatherInfo: null,
    curHisCount: 0
  },
  onLoad: function (options) {

  },
  // 获取日记
  async getHisdiary() {

    let openid = wx.getStorageSync('userOpenId');
    if (!openid) {
      let getOpenRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = getOpenRes.result;
    }

    let diaryRes = await db.collection("diary").where({
      _openid: openid
    }).orderBy("publishTime", "desc").skip(this.pageData.curHisCount).limit(6).get();

    for (let item of diaryRes.data) {
      // console.log(item.publishTime);
      item.publishTime = item.publishTime.toLocaleString();
    }
    return diaryRes.data;

  },
  // 切换tab
  onChange(e) {
    // console.log(e.detail.index);
    if (e.detail.index === 1 && this.pageData.curHisCount === 0) {
      //加载历史日记
      wx.showLoading({
        title: '加载历史日记',
      })
      this.getHisdiary().then((lists) => {
        wx.hideLoading({
          success: (res) => {
            console.log("加载历史");
          },
        })
        this.pageData.curHisCount += lists.length;
        this.data.hisDiaryLists.push(...lists);
        this.setData({
          hisDiaryLists: this.data.hisDiaryLists
        })
      })
    }
  },
  onShow: function () {
    wx.setNavigationBarTitle({
      title: '我的日记'
    });

  },
  // 日记标题输入
  inputTitle(e) {
    this.pageData.titleInputStr = e.detail;

  },
  // 日记主要内容输入
  inputContent(e) {
    this.pageData.contentInputStr = e.detail.value;
  },
  //用户选择位置
  addLocationInfo() {
    let that = this;
    wx.chooseLocation({
      success(res) {
        console.log(res);
        let {
          name,
          address,
          longitude,
          latitude
        } = res;
        that.pageData.diaryLocationInfo = {
          name,
          address,
          longitude,
          latitude
        }
        that.pageData.diaryWeatherInfo = null;
        that.setData({
          addressName: res.name,
          weatherStr: '未选择'
        }, () => {
          wx.showToast({
            title: '添加位置成功',
          });
        })
      }
    })
  },
  //删除位置信息
  deleteLocationInfo() {
    console.log(this.pageData.diaryLocationInfo);
    this.pageData.diaryLocationInfo = null;
    this.pageData.diaryWeatherInfo = null;
    this.setData({
      addressName: "未选择",
      weatherStr: '未选择'
    }, () => {
      wx.showToast({
        title: '删除位置',
      })
    })
  },
  //添加天气信息
  addWeatherInfo() {
    let that = this;
    let diaryLocationInfo = this.pageData.diaryLocationInfo;
    if (!diaryLocationInfo) {
      wx.showToast({
        title: '请先添加位置',
      });
      return;
    }
    if (diaryLocationInfo) {
      wx.cloud.callFunction({
        name: 'getDiaryWeather',
        data: {
          lat: diaryLocationInfo.latitude,
          long: diaryLocationInfo.longitude
        }
      }).then((res) => {
        console.log(res.result);
        res.result = JSON.parse(res.result);
        let now = res.result.HeWeather6[0].now;
        let tmp = now.tmp; //温度 摄氏度
        let cond_txt = now.cond_txt; //晴
        let hum = now.hum; //湿度%
        let pres = now.pres; //大气压强
        let wind_dir = now.wind_dir; //风向
        let wind_sc = now.wind_sc; //风力
        let wind_spd = now.wind_spd; //风速
        let pcpn = now.pcpn; //降水
        let vis = now.vis; //能见度
        that.pageData.diaryWeatherInfo = {
          tmp,
          cond_txt,
          hum,
          pres,
          wind_dir,
          wind_sc,
          wind_spd,
          vis
        };
        let wStr = "温度:" + tmp + " ,湿度: " + hum + "%, 风向: " + wind_dir + ",风力: " + wind_sc + "级";
        that.setData({
          weatherStr: wStr
        })
      })
    }
  },
  //提交日记
  addDiary() {
    console.log(this.pageData.titleInputStr);
    console.log(this.pageData.contentInputStr);
    console.log(this.pageData.diaryWeatherInfo);
    console.log(this.pageData.diaryLocationInfo);

    db.collection("diary").add({
      data: {
        diaryTitle: this.pageData.titleInputStr,
        diaryContent: this.pageData.contentInputStr,
        diaryLocation: this.pageData.diaryLocationInfo,
        diaryWeather: this.pageData.diaryWeatherInfo,
        publishTime: new Date()
      }
    }).then((res) => {
      console.log(res);
      wx.showToast({
        title: '发布成功'
      });
      this.setData({
        active: 1,
        titleValue: "",
        contentValue: "",
        addressName: '未选择',
        weatherStr: '未选择'
      });
      this.pageData.titleInputStr = "";
      this.pageData.contentInputStr = "";
      this.pageData.diaryLocationInfo = null;
      this.pageData.diaryWeatherInfo = null;
      this.reloadDiary();
    })
  },
  //重新加载历史日记
  reloadDiary() {
    wx.showLoading({
      title: '加载中',
    });
    this.setData({
      hasMoreDiary: true
    });
    this.pageData.curHisCount = 0;
    this.data.hisDiaryLists = [];

    return this.getHisdiary().then((lists) => {
      wx.hideLoading({
        success: (res) => {},
      })
      this.pageData.curHisCount += lists.length;
      this.data.hisDiaryLists.push(...lists);
      this.setData({
        hisDiaryLists: this.data.hisDiaryLists
      })
    })
  },
  onReachBottom() {
    if (this.data.hasMoreDiary) {
      wx.showLoading({
        title: '更多日记',
      })
      this.getHisdiary().then((lists) => {
        wx.hideLoading({

        })
        console.log("又加载了", lists);
        if (lists.length === 0) {
          this.setData({
            hasMoreDiary: false
          })
        }
        this.pageData.curHisCount += lists.length;
        this.data.hisDiaryLists.push(...lists);
        this.setData({
          hisDiaryLists: this.data.hisDiaryLists
        })
      })
    }

  },
  onPullDownRefresh() {
    this.reloadDiary().then(() => {
      wx.stopPullDownRefresh({
        success: (res) => {
          console.log("刷新成功");
        },
      })
    });
  },
  toDiaryDetail(e){
    // console.log(e.currentTarget.dataset.diaryId);//b00064a7602b866a0542dd6e1e8c0b37
    wx.navigateTo({
      url: "diaryDetail/diaryDetail?diaryId="+e.currentTarget.dataset.diaryId,
    })
  }


})