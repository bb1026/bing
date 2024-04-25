// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: sync;
this.name = "Panda Remit";
this.widget_ID = "js-102";
this.version = "v2.5";

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

const Moneycode = args.widgetParameter || "SGD/CNY";
const rateurl = "https://prod.pandaremit.com/pricing/rate/" + Moneycode;
const picurl = "https://bb1026.github.io/bing/imgs/Panda_Remit.JPG";
const feeurl = "https://prod.pandaremit.com/web/ratefee/fee";

async function fetchRateData() {
  const response = await new Request(rateurl).loadJSON();
  return response;
}

async function fetchFeeData(targetCurrency, code) {
  const request = new Request(feeurl);
  request.method = "POST";
  request.headers = {
    "Content-Type": "application/json"
  };
  request.body = JSON.stringify({
    targetCurrency: targetCurrency,
    userId: "1093727",
    sourceAmount: "2000",
    sourceCurrency: code
  });
  const response = await request.loadJSON();
  return response;
}

async function createWidget() {
  const widget = new ListWidget();
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [new Color("#EAE5C9"), new Color("#6CC6CB")];
  widget.backgroundGradient = gradient;

  const titleStack = widget.addStack();
  titleStack.layoutHorizontally();
  const imageStack = titleStack.addStack();
  const imgReq = new Request(picurl);
  const img = await imgReq.loadImage();
  const pic = imageStack.addImage(img);
  pic.imageSize = new Size(50, 50);

  const textStack = titleStack.addStack();
  textStack.layoutVertically();
  const title1 = textStack.addText(`Panda Remit`);
  title1.font = Font.boldSystemFont(14);
  const title2 = textStack.addText(`熊猫汇款`);
  title2.font = Font.boldSystemFont(15);

  const rateResponse = await fetchRateData();
  if (rateResponse.suc) {
    const targetCurrency = rateResponse.model.target;
    const huiOut = (rateResponse.model.huiOut * 1).toString();
    const compareRate = rateResponse.model.compareRate;
    const code = rateResponse.model.code;

    const feeResponse = await fetchFeeData(targetCurrency, code);
    console.log(feeResponse);
    if (feeResponse.suc) {
      const fee = (feeResponse.model.fee * 1).toString();
      const defaultFee = (feeResponse.model.defaultFee * 1).toString();

      const ratecode = textStack.addText(`${code} → ${targetCurrency}`);
      ratecode.font = Font.boldSystemFont(15);

      const rateText = widget.addText(`${huiOut}`);
      rateText.font = Font.boldSystemFont(20);

      const compare = widget.addText(
    `比较昨日: ${
        compareRate.includes("+") ? "↑" :
        compareRate.includes("-") ? "↓" :
        ""
    }${compareRate}`
);
      compare.font = Font.systemFont(12);
      compare.textColor = compareRate.includes("+") ? Color.red() :
      compareRate.includes("-") ? Color.blue() : Color.black();

      const feeText = widget.addText(`Fee: ${fee}`);
      feeText.textColor = fee > 0 ? Color.red() : fee < 0 ? Color.blue() : Color.black();

      const defaultfeeText = widget.addText(`Default: ${defaultFee}`);
    }
  }

  return widget;
}

if (config.runsInWidget) {
  const widget = await createWidget();
  Script.setWidget(widget);
} else {
  const widget = await createWidget();
  widget.presentSmall();
  Script.complete();
}
