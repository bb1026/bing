// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: exchange-alt;
this.name = "汉生汇率";
this.widget_ID = "js-101";
this.version = "v1.1";

// 检查更新
const scriptListURL = "https://bb1026.github.io/bing/js/Master.json";

let scriptList = await new Request(scriptListURL).loadJSON();

if (scriptList[this.widget_ID]){
let scriptversion = scriptList[this.widget_ID].version;
console.log(scriptversion); 
if (this.version !== scriptversion) {
Pasteboard.copy(scriptList[this.widget_ID].url);
  Safari.open("scriptable:///run?scriptName=安装小助手");
  }
};

/* 
以上为获取更新代码
以下开始运行代码
*/

const widget = new ListWidget();

// 设置货币
const currency = "人民币";
if (!config.runsInApp) {
  currency = args.widgetParameter || "人民币";
}

// 请求汉生汇率网站数据
const url = "https://www.hanshanmoney.com/zh/rate-cn/";
const req = new Request(url);
const reqdata = await req.loadString();
const data = reqdata.replace(/<[^>]+>/g,'');

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
