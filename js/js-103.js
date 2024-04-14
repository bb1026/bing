// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: bus;
this.name = "Singapore Bus";
this.widget_ID = "js-103";
this.version = "v3.0"; 

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
};

/* 
以上为获取更新代码
以下开始运行代码
*/

// 站点代码及对应巴士代码
const myBusCodes = [
  { stopCode: "59009", busCodes: [800, 804] },
  { stopCode: "59241", busCodes: [804] },
  { stopCode: "22009", busCodes: [246, 249] },
  { stopCode: "21499", busCodes: [246] },
  { stopCode: "21491", busCodes: [246] },
  { stopCode: "21321", busCodes: [249] }
  //   { stopCode: "59073", busCodes: [858] }
];

async function getStopArrivalInfo(stopId) {
  const url = `https://transport.nestia.com/api/v4.5/stops/${stopId}/bus_arrival`; // 获取站点到站信息的URL
  const request = new Request(url);
  const response = await request.loadJSON();
  return response;
}

async function getArrivalInfoForStops() {
  const arrivalInfoArray = [];
  for (let busCodeObj of myBusCodes) {
    const stopCode = busCodeObj.stopCode;
    const busCodes = busCodeObj.busCodes;
    try {
      const stopInfoUrl = `https://transport.nestia.com/api/v4.5/search/bus?key=${stopCode}`; // 获取站点信息的URL
      const stopInfoRequest = new Request(stopInfoUrl);
      const stopInfoResponse = await stopInfoRequest.loadJSON();

      const stopId = stopInfoResponse[0].id;
      const stopName = stopInfoResponse[0].name;

      const stopArrivalInfo = await getStopArrivalInfo(stopId);

      const busArrivalInfoArray = [];
      const processedBusCodesForStop = new Set(); // 用于跟踪已处理的巴士信息
      for (let arrival of stopArrivalInfo) {
        const busCode = arrival.bus_code;
        if (!processedBusCodesForStop.has(busCode)) {
          const arrivals = arrival.arrivals;
          const busArrivalTimes = { First: "", Second: "" };
          for (let i = 0; i < Math.min(arrivals.length, 2); i++) {
            const status = arrivals[i].status;
            const arrivalTimeInSeconds = arrivals[i].arrival_time;
            let arrivalTime;
            if (
              status !== 1 ||
              arrivalTimeInSeconds === undefined ||
              arrivalTimeInSeconds === -600
            ) {
              arrivalTime = "未知或停运";
            } else if (arrivalTimeInSeconds < 15) {
              arrivalTime = "到达";
            } else if (arrivalTimeInSeconds < -1) {
              arrivalTime = "离开";
            } else {
              arrivalTime = (arrivalTimeInSeconds / 60).toFixed(1) + "分钟";
            }
            busArrivalTimes[i === 0 ? "First" : "Second"] = `${
              i === 0 ? "First" : "Second"
            }: ${arrivalTime}`;
          }
          busArrivalInfoArray.push({
            buscode: busCode,
            arrivaltime: busArrivalTimes
          });
          processedBusCodesForStop.add(busCode);
        }
      }

      const arrivalInfoItem = {
        stopcode: stopCode,
        stopname: stopName,
        busArrivalInfo: busArrivalInfoArray
      };
      arrivalInfoArray.push(arrivalInfoItem);
    } catch (error) {
      console.error(`获取站点 ${stopCode} 的到站信息时出错: ${error}`);
    }
  }
  return arrivalInfoArray;
}

async function createWidget() {
  const arrivalInfoArray = await getArrivalInfoForStops(); // 使用过滤后的巴士信息
  const widget = new ListWidget();
  // 添加标题文本
  const title = widget.addText(
    "Singapore Buses\n" + new Date().toLocaleTimeString()
  );
  title.font = Font.boldSystemFont(20);
  title.centerAlignText();

  // 添加站点和到站信息
  for (let arrivalInfoItem of arrivalInfoArray) {
    const { stopname, stopcode, busArrivalInfo } = arrivalInfoItem;

    // 添加站点信息
    const stopText = widget.addText(`${stopname} (${stopcode})`);
    stopText.font = Font.boldSystemFont(14);

    // 检查到站信息是否存在并且是一个数组
    if (busArrivalInfo && Array.isArray(busArrivalInfo)) {
      // 添加巴士信息
      for (let busArrivalItem of busArrivalInfo) {
        const { buscode, arrivalTime } = busArrivalItem;

        // 检查当前巴士是否包含在 myBusCodes 中
        if (
          myBusCodes.some(item => item.busCodes.includes(parseInt(buscode)))
        ) {
          console.log(busArrivalItem.arrivaltime);
          const { First, Second } = busArrivalItem.arrivaltime;

          const busCodeText = widget.addText(
            `Bus: ${buscode}  ${First}  ${Second}`
          );
          busCodeText.font = Font.systemFont(15);
          busCodeText.lineLimit = 1;
        }
      }
    }
  }

  widget.addSpacer(); // 往上靠

  // 设置小组件
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    widget.presentLarge();
  }
}

async function createTable() {
  const busInfo = await getArrivalInfoForStops(); // 获取所有巴士信息
  const table = new UITable();
  table.showSeparators = true;

  // 添加标题行
  let headerRow = new UITableRow();
  headerRow.isHeader = true;
  let headerCell = headerRow.addCell(
    UITableCell.text("Bus information  " + new Date().toLocaleTimeString())
  );
  table.addRow(headerRow);

  // 添加站点和到站信息
  for (let info of busInfo) {
    const stopName = info.stopname;
    const stopCode = info.stopcode;
    const busArrivalInfo = info.busArrivalInfo;

    // 添加站点名称
    let locationRow = new UITableRow();
    locationRow.isHeader = true;
    let locationCell = locationRow.addCell(
      UITableCell.text(`站点: ${stopName} (${stopCode})`)
    );
    table.addRow(locationRow);

    // 分开添加底色的巴士和普通巴士
    const coloredBuses = [];
    const normalBuses = [];
    for (let busArrivalItem of busArrivalInfo) {
      const { buscode, arrivaltime } = busArrivalItem;
      let busRow = new UITableRow();
      let busCell = busRow.addCell(
        UITableCell.text(
          `Bus: ${buscode}  ${arrivaltime.First}   ${arrivaltime.Second}`
        )
      );

      // 区分有底色和无底色的巴士
      if (myBusCodes.some(item => item.busCodes.includes(parseInt(buscode)))) {
        busRow.backgroundColor = new Color("#87CEEB");
        coloredBuses.push(busRow);
      } else {
        normalBuses.push(busRow);
      }
    }

    // 添加有底色的巴士到表格
    coloredBuses.forEach(row => {
      table.addRow(row);
    });

    // 添加普通巴士到表格
    normalBuses.forEach(row => {
      table.addRow(row);
    });
  }

  // 显示表格
  QuickLook.present(table);
}

// 运行函数
if (config.runsInWidget) {
  await createWidget();
} else {
//   await createWidget();
  await createTable();
}
