// miniprogram/pages/home/sendDetail/sendDetail.js
const db = wx.cloud.database();
import customFormatTime from '../../../util/customTime';
let QQMapWX = require('../../../qqmap-wx-jssdk1.2/qqmap-wx-jssdk');
import qqmapkey from "../../../qqmapConfig/keyconfig";
Page({

  data: {
    active: 0,
    talkLists: [],
    questionLists: [],
    tipLists: [],
    locLists: [],
    equipLists: [],
    hasMoreArr: [true, true, true, true, true]
  },
  pageData: {
    myopenid: '',
    userInfo: {},
    curSendType: 'talk',
    curTabIdx: 0, //当前所在的Tab
    curTalkCount: 0, //加载的钓友圈帖子数
    curQuestionCount: 0, //加载的问答圈帖子数
    curTipCount: 0,
    curLocCount: 0,
    curEquipCount: 0
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '我的发布',
    })
    let that = this;
    this.pageData.qqmapsdk = new QQMapWX({
      key: qqmapkey
    });
    //获取当前用户的openid
    let openidRes = wx.cloud.callFunction({
      name: 'getUserOpenId'
    }).then((res) => {
      that.pageData.myopenid = res.result;
      //获取用户信息
      db.collection("angler").where({
        _openid: res.result
      }).get().then((anglerRes) => {
        that.pageData.userInfo = anglerRes.data[0];
        //判断初始选择的项目类型是钓友圈，问答圈还是技巧
        that.pageData.curSendType = options.sendType;
        let activeNum = options.sendType === 'question' ? 1 : options.sendType === 'tip' ? 2 : options.sendType === "anglerLoc" ? 3 : 0;
        if (options.sendType === 'equip') {
          activeNum = 4;
        }
        that.pageData.curTabIdx = activeNum;
        that.setData({
          active: activeNum
        });
        that.getTypeData(activeNum);
      })
    });
  },
  //切换选项
  onChange(e) {
    // console.log(e.detail.index);
    let changeIdx = e.detail.index;
    this.pageData.curTabIdx = changeIdx;
    if (changeIdx === 0 && this.pageData.curTalkCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }
    if (changeIdx === 1 && this.pageData.curQuestionCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }
    if (changeIdx === 2 && this.pageData.curTipCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }
    if (changeIdx === 3 && this.pageData.curLocCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }
    if (changeIdx === 4 && this.pageData.curEquipCount === 0) {
      this.getTypeData(changeIdx);
      return;
    }
  },
  //加载某个类型的数据
  getTypeData(typenum) {
    let that = this;
    wx.showLoading({
      title: '加载中'
    });
    switch (typenum) {
      case 0: {
        that.getMyTalk().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[0]': false
            })
            return;
          }
          that.data.talkLists.push(...res);
          that.pageData.curTalkCount += res.length;
          console.log("加载钓友圈", res);
          that.setData({
            talkLists: that.data.talkLists
          })
        })
        break;
      }
      case 1: {
        that.getQuestionLists().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[1]': false
            });
            return;
          }
          that.data.questionLists.push(...res);
          that.pageData.curQuestionCount += res.length;
          console.log("加载问答圈", res);
          that.setData({
            questionLists: that.data.questionLists
          })
        });
        break;
      }
      case 2: {
        that.getTipLists().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[2]': false
            });
            return;
          }
          that.data.tipLists.push(...res);
          that.pageData.curTipCount += res.length;
          console.log("加载技巧", res);
          that.setData({
            tipLists: that.data.tipLists
          })
        });
        break;
      }
      case 3: {
        that.getLocLists().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[3]': false
            });
            return;
          }
          that.data.locLists.push(...res);
          that.pageData.curLocCount += res.length;
          console.log("加载发布的钓点", res);
          that.setData({
            locLists: that.data.locLists
          })
        });
        break;
      }
      case 4: {
        that.getEquipLists().then((res) => {
          wx.hideLoading({
            success: (res) => {},
          })

          if (res.length === 0) {
            that.setData({
              'hasMoreArr[4]': false
            });
            return;
          }
          that.data.equipLists.push(...res);
          that.pageData.curEquipCount += res.length;
          console.log("加载发布的装备", res);
          that.setData({
            equipLists: that.data.equipLists
          })
        });
        break;
      }
    }
  },
  //加载钓友圈
  async getMyTalk() {
    let gettalk = await db.collection("talk").where({
      _openid: this.pageData.myopenid
    }).skip(this.pageData.curTalkCount).limit(6).get();
  
    let ownerRes=await db.collection("angler").where({
      _openid:this.pageData.myopenid
    }).get();

    for(let taItem of gettalk.data){
      taItem.userInfo=ownerRes.data[0];
      let commentRes=await db.collection("comment").where({
        commentTalkId:taItem._id
      }).count();
      let likeRes=await db.collection("likeTalk").where({
        likeTalkId:taItem._id
      }).count();
      taItem.commentCount=commentRes.total;
      taItem.likeCount=likeRes.total;
    }
    return gettalk.data;
  },
  //加载问答圈
  async getQuestionLists() {
    let getques = await db.collection("question").where({
      _openid: this.pageData.myopenid
    }).skip(this.pageData.curQuestionCount).limit(6).get();
    let userInfoRes = await db.collection("angler").where({
      _openid: this.pageData.myopenid
    }).get();
    for (let itemdata of getques.data) {
      itemdata.publishTime = customFormatTime(itemdata.publishTime);
      itemdata.userInfo = userInfoRes.data[0];
    }
    return getques.data;
  },
  //加载技巧
  async getTipLists() {
    let getTipRes = await db.collection("tipEssays").where({
      _openid: this.pageData.myopenid
    }).skip(this.pageData.curTipCount).limit(6).get();
    for (let tipitem of getTipRes.data) {
      let userInfoRes = await db.collection("angler").where({
        _openid: this.pageData.myopenid
      }).get();
      let getClassify = await db.collection("tipClassify").where({
        _id: tipitem.classifyId
      }).get();
      let likeRes = await db.collection("likeTip").where({
        likeTipId: tipitem._id
      }).get();

      let commentRes = await db.collection("tipComment").where({
        commentTipId: tipitem._id
      }).get();
      tipitem.userInfo = userInfoRes.data[0];
      tipitem.likedCount = likeRes.data.length;
      tipitem.commentedCount = commentRes.data.length;
      tipitem.topicName = getClassify.data[0].classifyName;
    }
    return getTipRes.data;
  },
  //获取我发布的钓点
  async getLocLists() {
    let openid = this.pageData.myopenid || wx.getStorageSync('userOpenId');
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let locRes = await db.collection("anglerLoc").where({
      _openid: openid
    }).skip(this.pageData.curLocCount).limit(6).get();

    for (let eq of locRes.data) {
      if (eq.locationDetail) {
        let locRes = await new Promise((resolve) => {
          wx.getLocation({
            type: "gcj02",
            success(res) {
              resolve(res);
            }
          })
        });
        let disLocPros = await new Promise((resolve) => {
          this.pageData.qqmapsdk.calculateDistance({
            from: {
              latitude: locRes.latitude,
              longitude: locRes.longitude
            },
            to: [{
              location: {
                lng: eq.locationDetail.longitude,
                lat: eq.locationDetail.latitude
              }
            }],
            success: (disRes) => {
              resolve(disRes);
            }
          })
        });
        console.log(disLocPros);
        eq.distance = disLocPros.result.elements[0].distance;
      }
    }
    return locRes.data;
  },
  //获取我发布的装备
  async getEquipLists() {
    let openid = this.pageData.myopenid || wx.getStorageSync('userOpenId');
    if (!openid) {
      let openRes = await wx.cloud.callFunction({
        name: 'getUserOpenId'
      });
      openid = openRes.result;
    }
    let locRes = await db.collection("equip").where({
      _openid: openid
    }).skip(this.pageData.curEquipCount).limit(6).get();

    for (let eq of locRes.data) {
      let tyRes = await db.collection("equipType").doc(eq.equipTypeId).get();
      eq.equipType = tyRes.data;
    }
    return locRes.data;
  },
  onReachBottom() {
    if (this.data.hasMoreArr[this.pageData.curTabIdx]) {

      this.getTypeData(this.pageData.curTabIdx);
    }
  },
  onPullDownRefresh() {
    this.pageData.curTalkCount = 0;
    this.pageData.curQuestionCount = 0;
    this.pageData.curTipCount = 0;
    this.pageData.curLocCount = 0;
    this.pageData.curEquipCount = 0;
    this.setData({
      talkLists: [],
      questionLists: [],
      tipLists: [],
      locLists: [],
      equipLists: [],
      hasMoreArr: [true, true, true, true, true]
    })

    this.getTypeData(this.pageData.curTabIdx);
  },
  //去发布的钓点详情页
  toLocDetail(e) {
    let locid = e.currentTarget.dataset.locId;
    wx.navigateTo({
      url: '/pages/service/locDetail/locDetail?locId=' + locid
    })
  },
  toEquipDetail(e) {
    let eid = e.currentTarget.dataset.equipId;
    wx.navigateTo({
      url: '/pages/service/equipService/equipDetail/equipDetail?equipId=' + eid
    })
  },
  //删除发布的钓点
  onCloseTalk(e) {
    console.log(e);
    let _this = this;
    let instance = e.detail.instance;
    let talkEssay = e.currentTarget.dataset.talkInfo;
    let tId = talkEssay._id;
    let tTitle = talkEssay.title; //帖子标题
    let tIdx = e.currentTarget.dataset.talkIdx; //第几个

    wx.showModal({
      title: '删除帖子',
      content: '确定要删除：' + tTitle + '这篇帖子？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '删除' + tTitle
          })
          wx.cloud.callFunction({
            name: "deleteMyTalk",
            data: {
              talkId: tId
            }
          }).then((delRes) => {
            console.log("删除成功", delRes);
            _this.data.talkLists.splice(tIdx, 1);
            _this.pageData.curTalkCount -= 1;
            _this.setData({
              talkLists: _this.data.talkLists
            })
          }).finally(() => {
            wx.hideLoading({
              success: (res) => {
                console.log("finally 结束")
              },
            })
          })
        }
      },
      fail() {
        wx.showToast({
          title: '删除失败',
        })
      },
      complete() {
        instance.close();
      }
    })

  },
  //删除发布的问答圈
  onCloseQues(e) {
    let _this = this;
    let instance = e.detail.instance;
    let question = e.currentTarget.dataset.quesInfo;
    let qTitle = question.content;
    let delId = question._id;
    let delIdx = e.currentTarget.dataset.quesIdx;

    wx.showModal({
      title: '删除问答圈帖子',
      content: '确定要删除：' + qTitle + "？",
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中'
          });
          wx.cloud.callFunction({
            name: 'deleteQuestionAndRelated',
            data: {
              questionId: delId
            }
          }).then((delRes) => {
            console.log("删除问答圈帖子", delRes);

            _this.pageData.curQuestionCount = _this.pageData.curQuestionCount - 1;
            _this.data.questionLists.splice(delIdx, 1);
            _this.setData({
              questionLists: _this.data.questionLists
            })
          }).finally(() => {
            wx.hideLoading({
              success: (res) => {},
            })
          })
        }
      },
      complete() {
        instance.close();
      }
    })


  },
  //删除发布的技巧帖子
  onCloseTip(e) {
    console.log(e);
    let _this = this;
    let instance = e.detail.instance;
    let talkEssay = e.currentTarget.dataset.talkInfo;
    let tId = talkEssay._id;
    let tTitle = talkEssay.title; //帖子标题
    let tIdx = e.currentTarget.dataset.talkIdx; //第几个

    wx.showModal({
      title: '删除帖子',
      content: '确定要删除：' + tTitle + '这篇技巧帖子？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '删除' + tTitle
          })
          wx.cloud.callFunction({
            name: "deleteMyTip",
            data: {
              tipId: tId
            }
          }).then((delRes) => {
            console.log("删除成功", delRes);
            _this.data.tipLists.splice(tIdx, 1);
            _this.pageData.curTipCount -= 1;
            _this.setData({
              tipLists: _this.data.tipLists
            })
          }).finally(() => {
            wx.hideLoading({
              success: (res) => {
                console.log("finally 结束")
              },
            })
          })
        }
      },
      fail() {
        wx.showToast({
          title: '删除失败',
        })
      },
      complete() {
        instance.close();
      }
    })

  },
  //删除钓点
  onCloseLoc(e) {
    console.log(e);
    let _this = this;
    let instance = e.detail.instance;
    let talkEssay = e.currentTarget.dataset.talkInfo;
    let tId = talkEssay._id;
    let tTitle = talkEssay.locName; //钓点名称
    let tIdx = e.currentTarget.dataset.talkIdx; //第几个

    wx.showModal({
      title: '删除钓点',
      content: '确定要删除钓点：' + tTitle + '这？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '删除' + tTitle
          })
          wx.cloud.callFunction({
            name: "deleteMyLoc",
            data: {
              locId: tId
            }
          }).then((delRes) => {
            console.log("删除成功", delRes);
            _this.data.locLists.splice(tIdx, 1);
            _this.pageData.curLocCount -= 1;
            _this.setData({
              locLists: _this.data.locLists
            })
          }).finally(() => {
            wx.hideLoading({
              success: (res) => {
                console.log("finally 结束")
              },
            })
          })
        }
      },
      fail() {
        wx.showToast({
          title: '删除失败',
        })
      },
      complete() {
        instance.close();
      }
    })
  },
  //删除装备
  onCloseEquip(e) {
    console.log(e);
    let _this = this;
    let instance = e.detail.instance;
    let equipInfo = e.currentTarget.dataset.equipInfo;
    let eId = equipInfo._id;
    let eName = equipInfo.equipName; //钓点名称
    let eIdx = e.currentTarget.dataset.equipIdx; //第几个

    wx.showModal({
      title: '删除装备',
      content: '确定要删除装备：' + eName + '？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '删除' + eName
          })
          wx.cloud.callFunction({
            name: "deleteMyEquip",
            data: {
              equipId: eId
            }
          }).then((delRes) => {
            console.log("删除成功", delRes.result);
            _this.data.equipLists.splice(eIdx, 1);
            _this.pageData.curEquipCount -= 1;
            _this.setData({
              equipLists: _this.data.equipLists
            })
          }).finally(() => {
            wx.hideLoading({
              success: (res) => {
                console.log("finally 结束")
              },
            })
          })
        }
      },
      fail() {
        console.log("fail");
      },
      complete() {
        instance.close();
      }
    })
  }
})