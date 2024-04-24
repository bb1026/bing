// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: sync;
this.name = "Panda Remit";
this.widget_ID = "js-102";
this.version = "v2.0";

// 检查更新
let scriptListURL = "https://bb1026.github.io/bing/js/Master.json";
let scriptList = await new Request(scriptListURL).loadJSON();
let scriptversion = scriptList[this.widget_ID].version;
console.log(scriptversion);
if (this.version !== scriptversion) {
  Pasteboard.copy(scriptList[this.widget_ID].url);
  const fm = FileManager.iCloud();
  const scriptName = "安装小助手.js"; // 要检查的脚本文件名，包括.js后缀
  const scriptPath = fm.joinPath(fm.documentsDirectory(), scriptName);
  const scriptExists = fm.fileExists(scriptPath);
  if (scriptExists) {
    Safari.open("scriptable:///run?scriptName=安装小助手");
  } else {
    console.log(`${scriptName} 不存在`);
    const alert = new Alert();
    alert.message = "安装小助手脚本不存在，请手动安装。";
    alert.addAction("确定");
    await alert.present();
    Safari.open("https://bb1026.github.io/bing/js/1.html");
  }
  return;
}

/* 
以上为获取更新代码
以下开始运行代码
*/

let api = await loadapi();
let widget = await createWidget(api);
if (config.runsInApp) {
  widget.presentSmall();
} else {
  Script.setWidget(widget);
}
Script.complete();
// console.log(api);
async function createWidget(api) {
  let appicon = await loadimage();
  appicon.size = new Size(50, 50);
  let title = "Panda Remit";
  let subtitle = "熊猫汇款";
  let widget = new ListWidget();
  //设小组件置背景颜色
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [new Color("#EAE5C9"), new Color("#6CC6CB")];
  widget.backgroundGradient = gradient;

  let titleElement = widget.addStack();
  titleElement.centerAlignContent();
  titleElement.layoutHorizontally();
  let appiconElement = titleElement.addImage(appicon);
  appiconElement.imageSize = new Size(35, 35);
  titleElement.addSpacer(5);
  let titletextElement = titleElement.addStack();
  titletextElement.layoutVertically();
  let titletext = titletextElement.addText(title);
  titletext.font = Font.systemFont(15);
  titletext.textColor = Color.magenta();

  titletextElement.addSpacer(2);

  let subtitletext = titletextElement.addText(subtitle);
  subtitletext.textColor = Color.gray();

  widget.addSpacer(15);
  let rateElement = widget.addStack();
  rateElement.layoutVertically();

  let ratecode = rateElement.addText(`${api.code} → ${api.target}`);
  ratecode.textColor = Color.black();
  rateElement.addSpacer();

  let ratemoney = rateElement.addText(api.rate);
  ratemoney.font = Font.blackMonospacedSystemFont(20);
  ratemoney.textColor = Color.black();
  rateElement.addSpacer();

  let updown;
  let comparecolor;
  if (api.compareRate.includes("+")) {
    updown = "↑";
    comparecolor = Color.red();
  } else {
    updown = "↓";
    comparecolor = Color.blue();
  }
  let compare = rateElement.addText("较昨日" + api.compareRate + updown);
  compare.font = Font.semiboldMonospacedSystemFont(12);
  compare.textColor = comparecolor;

  widget.addSpacer();

  return widget;
}

async function loadapi() {
  if (config.runsInApp) {
    var currency = "SGD/CNY";
  } else {
    var currency = args.widgetParameter;
  }
  let url = "https://prod.pandaremit.com/pricing/rate/" + currency;
  let reqs = new Request(url);

  reqs.headers = {
    "User-Agent":
      " Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
  };
  let req = await reqs.loadJSON();
  //   console.log(req);

  return {
    rate: (req.model.huiOut * 1).toString(),
    code: req.model.code,
    target: req.model.target,
    compareRate: req.model.compareRate
  };
}

async function loadimage() {
  let url = "https://bb1026.github.io/bing/imgs/Panda_Remit.JPG";
  let req = new Request(url);
  return req.loadImage();
}
