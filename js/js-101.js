// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: exchange-alt;
(async () => {
this.name = "汉生汇率";
this.widget_ID = "js-101";
this.version = "v1.1";

// 检查更新
let installation;
await CheckKu();
await installation(this.widget_ID, this.version);
/* 
以上为获取更新代码
以下开始运行代码
*/

const widget = new ListWidget();

// 设置货币
let currency = "人民币";
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
  let wb = new WebView();
  await wb.loadURL(url);
  await wb.present(true)
}

Script.setWidget(widget);
Script.complete();

async function CheckKu() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "Ku.js");
  const url = "https://bb1026.github.io/bing/js/Ku.js";
  let needDownload = false;

  try {
    if (!fm.fileExists(path) || !fm.readString(path).includes("installation")) {
      console.log("数据库异常，准备重新下载");
      needDownload = true;
    }
  } catch {
    console.log("数据库异常，准备重新下载");
    needDownload = true;
  }

  if (needDownload) {
    fm.writeString(path, await new Request(url).loadString());
    if (fm.isFileStoredIniCloud(path)) await fm.downloadFileFromiCloud(path);
    console.log("数据库下载完成");
  }

  ({ installation } = importModule("Ku"));
  if (typeof Ku.installation !== "function") throw new Error("数据库模块无效");
}
})();