this.name = "汉生汇率"
this.widget_ID = "js-101"
this.version = "v1.1"

const widget = new ListWidget();

// 设置货币
let currency = "人民币";
if (!config.runsInApp) {
  currency = args.widgetParameter || "人民币";
}

// 请求汉生汇率网站数据
const url = "https://www.hanshanmoney.com/zh/rate-cn/";
let req = new Request(url);
let reqdata = await req.loadString();
let data = reqdata.replace(/<[^>]+>/g,'');

// 解析日期、时间和汇率数据
const riqi = data.match(/有效日期:.*/i)?.toString().replace(/ /g,'') || "日期信息不可用";
const shijian = data.match(/更新时间:.*/i)?.toString().replace(/ /g,'') || "时间信息不可用";
const huilvMatch = data.match(new RegExp(currency + '.*\n.*', 'i'));
const huilv = huilvMatch?.toString().replace(/\n     /g, '') || "汇率信息不可用";

// 添加标题
const titleText = widget.addText("汉生汇率");
titleText.centerAlignText();
widget.addSpacer(15);

// 添加日期、时间和汇率信息
const stack = widget.addStack();
stack.layoutVertically();
stack.addText("日期：" + riqi);
stack.addSpacer(5);
stack.addText("更新时间：" + shijian);
stack.addSpacer(5);
stack.addText("汇率：" + huilv);

// 在应用中显示或设置小组件
if (config.runsInApp) {
  await widget.presentMedium();
}

Script.setWidget(widget);
Script.complete();
