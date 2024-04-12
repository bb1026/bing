// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: bus;
this.name = "Singapore Bus";
this.widget_ID = "js-103";
this.version = "v2.0"; 

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

const myBusCodes = [
  { stopCode: "59009", busCodes: [800, 804] }, 
  { stopCode: "59241", busCodes: [804] }, 
  { stopCode: "22009", busCodes: [246, 249] }, 
  { stopCode: "21499", busCodes: [246] }, 
  { stopCode: "21491", busCodes: [246] }, 
  { stopCode: "21321", busCodes: [249] },
//   { stopCode: "59073", busCodes: [858] }
];

async function getStopArrivalInfo(stopId) {
    const url = `https://transport.nestia.com/api/v4.5/stops/${stopId}/bus_arrival`;
    const request = new Request(url);
    const response = await request.loadJSON();
    return response;
}

async function getArrivalInfoForStops() {
    const arrivalInfoArray = [];
    const processedStopCodes = [];
    for (let busCodeObj of myBusCodes) {
        const stopCode = busCodeObj.stopCode;
        const busCodes = busCodeObj.busCodes;
        try {
            if (processedStopCodes.includes(stopCode)) {
                continue;
            }

            const stopInfoUrl = `https://transport.nestia.com/api/v4.5/search/bus?key=${stopCode}`;
            const stopInfoRequest = new Request(stopInfoUrl);
            const stopInfoResponse = await stopInfoRequest.loadJSON();
            const stopId = stopInfoResponse[0].id;
            const stopName = stopInfoResponse[0].name;

            const stopArrivalInfo = await getStopArrivalInfo(stopId);
            
            const uniqueBusCodes = new Set();
            for (let arrival of stopArrivalInfo) {
                const busCode = arrival.bus_code;
                if (busCodes.includes(parseInt(busCode)) && !uniqueBusCodes.has(busCode)) {
                    const arrivals = arrival.arrivals;
                    const arrivalTimes = [];
                    for (let i = 0; i < Math.min(arrivals.length, 2); i++) {                        const arrivalTimeInSeconds = arrivals[i].arrival_time;
                        let arrivalTime;
                        if (arrivalTimeInSeconds === undefined || arrivalTimeInSeconds === -600 ) {
                            arrivalTime = "未知或停运";
                        } else if (arrivalTimeInSeconds < 15) {
                            arrivalTime = "到达";
                        } else if (arrivalTimeInSeconds < -1) {
                            arrivalTime = "离开";
                        } else {
                            arrivalTime = (arrivalTimeInSeconds / 60).toFixed(1) + "分钟";
                        }
                        arrivalTimes.push(arrivalTime);
                    }
                    const status = arrival.arrivals[0].status;
                    const arrivalText = `Bus: ${busCode}    ${arrivalTimes.join(" , ")}`;
                    uniqueBusCodes.add(busCode);
                    arrivalInfoArray.push({ stopName, arrivalText, stopCode });
                }
            }
             processedStopCodes.push(stopCode);
        } catch (error) {
            console.error(`获取站点 ${stopCode} 的到站信息时出错: ${error}`);
        }
    }
    return arrivalInfoArray;
}

// 创建小组件
const busInfo = await getArrivalInfoForStops();
const widget = new ListWidget();

// 添加标题文本
const title = widget.addText("新加坡巴士\n" + new Date().toLocaleTimeString());
title.font = Font.boldSystemFont(20);
title.centerAlignText();

// 添加站点和到站信息
const uniqueStops = new Set();
for (let info of busInfo) {
    const stopName = info.stopName;
    const stopCode = info.stopCode;
    if (!uniqueStops.has(stopName)) {
        uniqueStops.add(stopName);
        const stopText = widget.addText(`站点: ${stopName} (${stopCode})`);
        stopText.font = Font.boldSystemFont(14);
    }
    const arrivalText = info.arrivalText;
    const arrivalTextItem = widget.addText(arrivalText);
    arrivalTextItem.lineLimit = 1;
}

widget.addSpacer();// 往上靠

// 设置小组件
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentLarge();
}
