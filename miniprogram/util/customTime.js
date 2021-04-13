//评论时间显示格式
function customFormatTime(dastr){
 
  // 刚刚  1分钟内
  // 几分钟前  
  // 几小时前
  // 昨天  + da.toLocaleTimeString()
  // 前天  + da.toLocaleTimeString()
  //da.toLocaleString();
  let da=new Date(dastr);
  // console.log("loading customFormatTime daStr:",dastr);
  // console.log("loading customFormatTime da:",da);
 
  let curDa = new Date();
  let daOffset = new Date(curDa.toLocaleDateString());
  // console.log("loading customFormatTime daOffset:",daOffset);
  let timeGap = daOffset - da;
  if (timeGap > 2 * 24 * 60 * 60 * 1000) {
    return da.toLocaleString();
  }

  if (timeGap > 1 * 24 * 60 * 60 * 1000) {
    return '前天 ' + da.toLocaleTimeString();
  }
  if (timeGap > 0) {
    return '昨天 ' + da.toLocaleTimeString();
  }
  //一小时以上
  if (curDa - da > 1 * 60 * 60 * 1000) {
 
    let gapHours = Math.floor((curDa - da) / (60 * 60 * 1000));
    return gapHours + "小时前";
  }

  //一分钟以上
  if (curDa - da > 1 * 60 * 1000) {
    let gapMinutes = Math.floor((curDa - da) / (60 * 1000));
    return gapMinutes + "分钟前";
  }
  return '刚刚';

}

export default customFormatTime;