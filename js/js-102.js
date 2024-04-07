this.name = "Panda Remit";
this.widget_ID = "js-102";
this.version = "v1.5";

let scriptListURL = "https://bb1026.github.io/bing/js/Master.json";
let scriptList = await new Request(scriptListURL).loadJSON();

let scriptversion = scriptList[this.widget_ID].version;
console.log(scriptversion); 
if (this.version !== scriptversion) {
Pasteboard.copy(scriptList[this.widget_ID].url);
  Safari.open("scriptable:///run?scriptName=安装小助手");
};

let api = await loadapi();
let widget = await createWidget(api);
if (config.runsInApp) {
  widget.presentSmall();
} else {
  Script.setWidget(widget);
}
Script.complete();
console.log(api);
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

  //添加小组件要素
  let titleElement = widget.addStack();
  titleElement.centerAlignContent();
  //设置排列方式左右
  titleElement.layoutHorizontally();
  //添加图标
  let appiconElement = titleElement.addImage(appicon);
  //图标尺寸
  appiconElement.imageSize = new Size(35, 35);
  //设置间隔
  titleElement.addSpacer(5);
  //添加标题
  let titletextElement = titleElement.addStack();
  titletextElement.layoutVertically();
  //添加文字
  let titletext = titletextElement.addText(title);
  titletext.font = Font.systemFont(15);
  titletext.textColor = Color.magenta();

  titletextElement.addSpacer(2);

  let subtitletext = titletextElement.addText(subtitle);
  subtitletext.textColor = Color.gray();

  widget.addSpacer(15);
  //添加内容元素
  let rateElement = widget.addStack();
  rateElement.layoutVertically();
  //名称
  let ratecode = rateElement.addText(`${api.code} → ${api.target}`);
  ratecode.textColor = Color.black();
  rateElement.addSpacer(5);

  //汇率
  let ratemoney = rateElement.addText(api.rate);
  ratemoney.font = Font.blackMonospacedSystemFont(20);
  ratemoney.textColor = Color.black();

  widget.addSpacer(15);
  //添加打开软件按钮
  let footerElement = widget.addStack();
  let linkStack = footerElement.addStack();
  let linkName = linkStack.addText("Open APP");
  linkName.textColor = Color.blue();
  linkName.font = Font.systemFont(13);
  footerElement.addSpacer();
  //添加小图标🔗
  // let linkSymobl = SFSymbol.named("link")
  let linkSymobl = SFSymbol.named("arrow.up.forward");
  let linkimage = linkStack.addImage(linkSymobl.image);
  linkimage.imageSize = new Size(11, 11);
  linkimage.tintColor = Color.blue();
//   linkimage.url = "PandaRemit://";

  return widget;
}
//异步获取数据
async function loadapi() {
  if (config.runsInApp) {
    var currency = "SGD/CNY";
  } else {
    var currency = args.widgetParameter;
  }
  let url = "https://prod.pandaremit.com/pricing/rate/" + currency;
  console.log(url);
  let reqs = new Request(url);
  //设置网页头
  reqs.headers = {
    "User-Agent":
      " Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
  };
  let req = await reqs.loadJSON();
  console.log(req);
  //获取并设置数据数组
  return {
    rate: (req.model.huiOut * 1).toString(),
    code: req.model.code,
    target: req.model.target
  };
}

async function loadimage() {
  let url = "https://bb1026.github.io/bing/imgs/Panda_Remit.JPG";
  let req = new Request(url);
  return req.loadImage();
}
