// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: bus;
this.name = "日历📆Calendar";
this.widget_ID = "js-104";
this.version = "v2.0";

  const { installation, calendar } = importModule('Ku');
  await installation(this.widget_ID, this.version);

/* 
以上为获取更新代码
以下开始运行代码
*/

const widget = new ListWidget();
// 开始创建渐变背景
let bgColor = new LinearGradient();
bgColor.locations = [0, 1];
bgColor.colors = [new Color("#EAE5C9"), new Color("#74ff5e")];

// 添加渐变颜色到组件背景
widget.backgroundGradient = bgColor;

const dates = calendar.solar2lunar();
console.log(dates);
const sy = dates.cYear;
const sm = dates.cMonth;
const sd = dates.cDay.toString();
const sw = dates.ncWeek;
const gzy = dates.gzYear;
const gzm = dates.gzMonth;
const gzd = dates.gzDay;
const nl = dates.IMonthCn + dates.IDayCn;
const sx = dates.Animal;
const xz = dates.astro;
const isjq = dates.isTerm;
const jq = dates.Term;

const widgetcarton = widget.addStack();
const widgetcarton1 = widgetcarton.addStack();
widgetcarton1.layoutVertically();
widgetcarton1.size = new Size(160, 160);
if (dates.nWeek == 7 || dates.nWeek == 6){
  var txtcolor = Color.red()
} else {
  var txtcolor = Color.black()
}
const widgetwk = widgetcarton1.addStack();
widgetwk.setPadding(10, 0, 0, 0);
widgetwk.addSpacer();
const wktext = widgetwk.addText(sw);
wktext.font = Font.systemFont(25);
wktext.textColor = txtcolor;
widgetwk.addSpacer();
const widgetday = widgetcarton1.addStack();
widgetday.setPadding(-15, 0, -15, 0);
widgetday.addSpacer();
const daytext = widgetday.addText(sd);
daytext.textColor = txtcolor;
widgetday.addSpacer();
if (isjq) {
  const widgetjq = widgetcarton1.addStack();
  widgetjq.addSpacer();
  const jqtext = widgetjq.addText(jq);
  widgetjq.addSpacer();
  jqtext.font = Font.boldMonospacedSystemFont(25);
  // 节气字体
  jqtext.textColor = Color.blue();
  var dayziti = Font.boldMonospacedSystemFont(100)
} else {
  var dayziti = Font.boldMonospacedSystemFont(100)
}
daytext.font = dayziti;

widgetcarton1.addSpacer();
widgetcarton.addSpacer(15);
const widgetcarton2 = widgetcarton.addStack();
widgetcarton2.layoutVertically();
let t0 = widgetcarton2.addText(`${sy}年${sm}月${sd}日`);
widgetcarton2.addSpacer(4);
let t1 = widgetcarton2.addText(`农历: ${nl} 【${sx}年】`);
let t2 = widgetcarton2.addText(`${gzy}年 ${gzm}月 ${gzd}日`);
let t3 = widgetcarton2.addText(xz);
widgetcarton2.addSpacer(4);

t0.font = Font.systemFont(18)
t0.textColor = Color.black();
t1.font = Font.systemFont(13);
t1.textColor = Color.black();
t2.font = Font.systemFont(11);
t2.textColor = Color.black();
t3.font = Font.systemFont(11);
t3.textColor = Color.black();

/*日历事件*/
const cale = await Calendar.forEvents();
var today = new Date();
var weeks = Array("周日", "周一", "周二", "周三", "周四", "周五", "周六");
const startDate = new Date();
startDate.setMonth(startDate.getMonth());
const endDate = new Date();
endDate.setMonth(endDate.getMonth() + 12);
var events = await CalendarEvent.between(startDate, endDate, cale);
if (args.widgetParameter) {
  console.log(args.widgetParameter);
  var edata = [];
  for (var i = 0; i < events.length; i++) {
    if (events[i].calendar.title == args.widgetParameter) {
      edata.push(events[i]);
    }
  }
  var events = edata;
}

for (i = 0; i < 3; i++) {
  function eventdata() {
    ctitle = events[i].title;
    sstartDate = events[i].startDate;
    textcolor = new Color(events[i].calendar.color.hex);
    daysLeft = Math.floor((sstartDate - today) / (24 * 3600 * 1000)) + 1;
    console.log(daysLeft);
    var timeText;
    if (daysLeft == 0 || daysLeft < 0) {
      timeText = "今天全天";
    }
    if (daysLeft == 1) {
      timeText = "明天全天";
    }
    if (daysLeft > 1) {
      let startTime = events[i].startTime;
      let eee = `${weeks[sstartDate.getDay()]} ${
        sstartDate.getMonth() + 1
      }月${sstartDate.getDate()}日`;
      timeText = eee + " 还剩" + daysLeft + "天";
    }
    data = {
      title: ctitle,
      timeText: timeText,
      textcolor: textcolor
    };
    return data;
  }
  let event_title = widgetcarton2.addText(eventdata().title);
  let event_time = widgetcarton2.addText(eventdata().timeText);
  event_title.font = Font.boldMonospacedSystemFont(13);
  event_title.textColor = eventdata().textcolor;
  event_time.font = Font.systemFont(11);
  event_time.textColor = eventdata().textcolor;
  widgetcarton2.addSpacer(2);
}
/*日历事件*/

widgetcarton.addSpacer();
widget.presentMedium();
