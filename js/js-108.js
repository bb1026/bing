this.name = "Birthday";
this.widget_ID = "js-108";
this.version = "v1.8";

// 检查更新
  const { installation } = importModule('Ku');
  await installation(this.widget_ID, this.version);

/* 
以上为获取更新代码
以下开始运行代码
*/

// 生日数据
const Birthdays = [
  { Name: "兵", Birthday: "19990909" }
];

  const today = new Date().toLocaleDateString();

// 工具函数：根据出生年份计算生肖
function getZodiac(year) {
  const zodiacs = ["猴🐵", "鸡🐔", "狗🐶", "猪🐷", "鼠🐭", "牛🐮", "虎🐯", "兔🐰", "龙🐉", "蛇🐍", "马🐴", "羊🐏"];
  return zodiacs[year % 12];
}

// 工具函数：计算距离下次生日的天数
function daysUntilNextBirthday(birthday) {
  const today = new Date();
  const birthDate = new Date(birthday);
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  if (today > nextBirthday) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = nextBirthday - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 工具函数：格式化生日日期
function formatBirthday(birthday) {
  return `${birthday.slice(0, 4)}-${birthday.slice(4, 6)}-${birthday.slice(6)}`;
}

// 工具函数：计算年龄
function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

// 工具函数：判断是否是生日当天
function isTodayBirthday(birthday) {
  const today = new Date();
  const birthDate = new Date(birthday);
  return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
}

// 工具函数：判断是否是上午
function isMorning() {
  const now = new Date();
  return now.getHours() < 12;
}

// 工具函数：发送通知（限制为当天上午一次）
function sendNotificationOnce(name) {
  const todayKey = getTodayKey(name);
  if (!Keychain.contains(todayKey)) {
    let notification = new Notification();
    notification.title = `${name} 的生日 🎉`;
    notification.body = `今天是 ${name} 的生日！祝生日快乐！🎂`;
    notification.schedule();

    // 记录已通知状态
    Keychain.set(todayKey, "notified");
  }
}

// 工具函数：生成当日键值
function getTodayKey(name) {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  return `birthday-notify-${name}-${dateKey}`;
}

// 控制台输出函数
function logBirthdaysToConsole() {
  console.log(`🎉 生日提醒  ${today}`);
  console.log("====================");
  for (const person of Birthdays) {
    const { Name, Birthday } = person;
    const formattedBirthday = formatBirthday(Birthday);
    const daysLeft = daysUntilNextBirthday(formattedBirthday);
    const zodiac = getZodiac(new Date(formattedBirthday).getFullYear());
    const age = calculateAge(formattedBirthday);
    const isToday = isTodayBirthday(formattedBirthday);
    console.log(`姓名: ${Name}`);
    console.log(`生日: ${formattedBirthday}`);
    console.log(`年龄: ${age}岁`);
    console.log(`生肖: ${zodiac}`);
    console.log(`距离下次生日: ${isToday ? "今天 🎂" : `${daysLeft} 天后`}`);
    console.log("--------------------");
  }
}

// 创建小组件
function createWidget() {
  let widget = new ListWidget();
  widget.backgroundColor = new Color("#f5f5f5");
  widget.setPadding(10, 10, 10, 10);

  // 添加标题
  let title = widget.addText(`🎉 生日提醒  ${today}`);
  title.font = Font.boldSystemFont(18);
  title.textColor = new Color("#333");
  widget.addSpacer(20);
  
  // 找到距离最近的生日
let closestBirthday = Birthdays.reduce((prev, curr) => {
  let prevDays = daysUntilNextBirthday(formatBirthday(prev.Birthday));
  let currDays = daysUntilNextBirthday(formatBirthday(curr.Birthday));
  return currDays < prevDays ? curr : prev;
});

  // 遍历生日数据并添加到小组件
  for (const person of Birthdays) {
    const { Name, Birthday } = person;
    const formattedBirthday = formatBirthday(Birthday);
    const daysLeft = daysUntilNextBirthday(formattedBirthday);
    const zodiac = getZodiac(new Date(formattedBirthday).getFullYear());
    const age = calculateAge(formattedBirthday);

    // 检查是否生日当天
    const isToday = isTodayBirthday(formattedBirthday);

    // 显示生日信息
    let row = widget.addStack();
    row.layoutHorizontally();
    
    let nameText = row.addText(`${Name}`);
    nameText.font = person === closestBirthday ? Font.boldSystemFont(16) : Font.systemFont(16); // 最近生日加粗
    nameText.textColor = new Color("#333");

    row.addSpacer(20);

    let birthDateText = row.addText(`${formattedBirthday}`);
    birthDateText.font = person === closestBirthday ? Font.boldSystemFont(16) : Font.systemFont(16); // 最近日期加粗
    birthDateText.textColor = new Color("#666");
    
    let zodiacText = row.addText(` (${zodiac})`);
    zodiacText.font = person === closestBirthday ? Font.boldSystemFont(16) : Font.systemFont(16); // 最近生肖加粗
    zodiacText.textColor = new Color("#999");

    row.addSpacer();

    let ageText = row.addText(`${age} 岁`);
    ageText.font = person === closestBirthday ? Font.boldSystemFont(16) : Font.systemFont(16); // 最近年龄加粗
    ageText.textColor = new Color("#333");

    row.addSpacer();

    let birthdayText = row.addText(isToday ? `🎂 今天!` : `${daysLeft} 天后`);
    birthdayText.font = person === closestBirthday ? Font.boldSystemFont(16) : Font.systemFont(16); // 最近天数加粗
    birthdayText.textColor = isToday ? new Color("#ff0000") : new Color("#666");

    widget.addSpacer();

    // 如果是生日当天并且是上午，发送通知
    if (isToday && isMorning()) {
      sendNotificationOnce(Name);
    }
  }

  return widget;
}

// 创建表格视图
function createTable() {
  let table = new UITable();
  table.showSeparators = true;

  // 遍历生日数据并添加到表格
  for (const person of Birthdays) {
    const { Name, Birthday } = person;
    const formattedBirthday = formatBirthday(Birthday);
    const daysLeft = daysUntilNextBirthday(formattedBirthday);
    const zodiac = getZodiac(new Date(formattedBirthday).getFullYear());
    const age = calculateAge(formattedBirthday);

    let row = new UITableRow();
    row.height = 70;
    row.addText(Name).widthWeight = 5;
    row.addText(formattedBirthday).widthWeight = 8;
    row.addText(`${age}`).widthWeight = 4;
    row.addText(zodiac).widthWeight = 4;
    row.addText(isTodayBirthday(formattedBirthday) ? "🎂 今天!" : `${daysLeft} 天后`).widthWeight = 6;
    table.addRow(row);
  }

  return table;
}

// 根据运行环境显示内容
if (config.runsInWidget) {
  // 显示小组件
  const widget = createWidget();
  Script.setWidget(widget);
  Script.complete();
} else {
// 显示表格并输出到控制台
//   const widget = await createWidget();
//   widget.presentLarge();
  const table = createTable();
  table.present();
  logBirthdaysToConsole();
}
