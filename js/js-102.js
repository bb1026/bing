// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: sync;

this.name = "Panda Remit";
this.widget_ID = "js-102";
this.version = "v2.6";

// 检查更新
const { installation, currencyData, searchCurrency } = importModule("Ku");
await installation(this.widget_ID, this.version);

/* 
以上为获取更新代码
以下开始运行代码
*/

const Moneycode = args.widgetParameter || "CNY";
const rateurl = "https://prod.pandaremit.com/pricing/rate/SGD/" + Moneycode;
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

async function Code_Change(code) {
  return currencyData[code].zh_currency_abbr;
}

async function createWidget() {
  const widget = new ListWidget();
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [new Color("#6CC6CB"), new Color("#0090FF")];
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

      widget.addText(
        `${await Code_Change(code)} → ${await Code_Change(targetCurrency)}`
      );
      const rateText = widget.addText(`$${huiOut}`);
      rateText.font = Font.boldSystemFont(25);

      const compare = widget.addText(
        `比较昨日: ${
          compareRate.includes("+") ? "↑" : compareRate.includes("-") ? "↓" : ""
        }${compareRate}`
      );
      compare.font = Font.boldSystemFont(12);
      compare.textColor = compareRate.includes("+")
        ? Color.red()
        : compareRate.includes("-")
        ? Color.blue()
        : Color.black();

      const feeText = widget.addText(`费用: $${fee}`);
      feeText.textColor = fee > 0 ? Color.black() : Color.red();

      const t = widget.addText(
        `Update: ${new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "numeric",
          minute: "numeric"
        })}`
      );
      t.font = Font.systemFont(12);
    }
  }
  return widget;
}

async function createAccessoryCircular() {
  let rate;
  try {
    rate = await fetchRateData();
  } catch (error) {
    console.error("Error fetching rate data:", error);
    return null;
  }

  let Acc = new ListWidget();
  let stack = Acc.addStack();
  stack.layoutVertically();
  stack.size = new Size(60, 60);
  stack.opaque = true;
  stack.respectScreenScale = false;
  stack.cornerRadius = 30;
  stack.backgroundColor = new Color("#ffffff", 0.4);

  let targetStack = stack.addStack();
  targetStack.addSpacer();
  let fontsize = 11;
  let Target = targetStack.addText(rate.model.target);
  Target.font = Font.systemFont(fontsize);
  targetStack.addSpacer();
  stack.addSpacer(3);
  
  let cnyStack = stack.addStack();
  cnyStack.addSpacer();
  let cnyrate = cnyStack.addText((rate.model.huiOut * 1).toString());
  cnyrate.font = Font.systemFont(fontsize);
  cnyStack.addSpacer();
  stack.addSpacer(3);

  let compareStack = stack.addStack();
  compareStack.addSpacer();
  let Compare = compareStack.addText(rate.model.compareRate);
  Compare.font = Font.systemFont(fontsize);
  compareStack.addSpacer();  
  
  return Acc;
}

if (config.runsInAccessoryWidget) {
  const Accwidget = await createAccessoryCircular();
  Script.setWidget(Accwidget);
} else if (config.runsInWidget) {
  const widget = await createWidget();
  Script.setWidget(widget);
} else {
  const widget = await createWidget();
  widget.presentSmall();
}
