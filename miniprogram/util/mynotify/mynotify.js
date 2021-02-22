// 提示信息类
class MyNotify {
  constructor(notifyOptions) {
    this.pageThis = notifyOptions.pageThis; //页面的this
    this.notifyView = notifyOptions.notifyView || "#myNotifyView"; //通知组件的querySelector
    this.notifyMessage = notifyOptions.message || '注册成功'; //显示的文字
    this.notifyDuration = notifyOptions.duration || 500; //过度时间
    this.notifyStopTime = notifyOptions.stopTime || 1000; //停止时间
    this.notifyPanelColor = notifyOptions.bgColor || '#0f0';//背景颜色
  }
  notifyInit() {
    let that = this;
    this.pageThis.setData({
      notifyStyleInit: 'position:fixed;top:-142rpx;width:100%;padding:20px 0;background-color:' + that.notifyPanelColor + ';text-align:center;border-radius:0 0 10px 10px;z-index:10000000000000',
      topMessage: that.notifyMessage
    });
  }
  showNotify(callback) {
    let that = this;
    this.pageThis.animate(this.notifyView, [{
      top: '-142rpx'
    }, {
      top: '0'
    }], this.notifyDuration, function () {
      setTimeout(function () {
        that.pageThis.animate(that.notifyView, [{
          top: 0
        }, {
          top: -142
        }], that.notifyDuration, function () {callback();})
      }, that.notifyStopTime);

    }.bind(this));
  }
}

export default MyNotify;