// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: bus;
this.name = "Singapore Bus";
this.widget_ID = "js-103";
this.version = "v4.9";

// 检查更新
let installation;
await CheckKu();
await installation(this.widget_ID, this.version);
/* 
以上为获取更新代码
以下开始运行代码
*/

// 站点代码及对应巴士代码
const myBusCodes = [
  { busstop: "Yishun Int", stopCode: "59009", busCodes: [800, 804 /*852*/] },
  { busstop: "Blk 236", stopCode: "59241", busCodes: [804] },
  { busstop: "Blk 257", stopCode: "59249", busCodes: [800] },
  { busstop: "Boon Lay Int", stopCode: "22009", busCodes: [246, 249] },
  { busstop: "Bef Jln Tukang", stopCode: "21499", busCodes: [246] },
  { busstop: "Bef Intl Rd", stopCode: "21491", busCodes: [246] },
  { busstop: "UTOC ENGRG", stopCode: "21321", busCodes: [249] }
  //  { busstop: "Opp Yishun Stn", stopCode: "59073", busCodes: [858] }
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
              i === 0 ? "Next" : "Second"
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
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [new Color("#6CC6CB"), new Color("#0090FF")];
  widget.backgroundGradient = gradient;

  // 添加标题文本
  const title = widget.addText(
    "Singapore Bus " +
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "numeric",
        minute: "numeric"
      })
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

        // 匹配 stopCode 和 buscode
        const matchingStop = myBusCodes.find(
          item =>
            item.stopCode === stopcode &&
            item.busCodes.some(code => code === parseInt(buscode))
        );

        if (matchingStop) {
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

  widget.addSpacer(); // 置顶显示

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
  let headerCell = headerRow.addText(
    "Singapore Bus  " +
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "numeric",
        minute: "numeric"
      })
  );
  table.addRow(headerRow);

  // 添加搜索行
  const searchRow = new UITableRow();
  searchRow.backgroundColor = new Color("#FFA07A");
  const searchBusCell = searchRow.addText("搜索巴士号码...");
  searchBusCell.titleColor = Color.white();
  const searchStationCell = searchRow.addText("搜索站点号码...");
  searchStationCell.titleColor = Color.white();
  table.addRow(searchRow);

  // 将已有的stopCode分组，手动选择站点
  const stopCodeGroups = [];
  for (let i = 0; i < myBusCodes.length; i += 3) {
    stopCodeGroups.push(
      myBusCodes.slice(i, i + 3).map(item => [item.busstop, item.stopCode])
    );
  }

  // 创建行并添加到表格中
  for (const group of stopCodeGroups) {
    const row = new UITableRow();
    for (const stopCode of group) {
      const button = row.addButton(`${stopCode[0]}`);
      button.titleColor = Color.white();
      button.onTap = async () => {
        let searchStationCode = stopCode[1];
        const stationInfo = await searchStation(searchStationCode);
        if (stationInfo) {
          // 处理获取的到达信息
          handleArrivalInfo(stationInfo);
        }
      };
    }
    table.addRow(row);
  }

  // 设置搜索行的点击事件
  searchRow.onSelect = async () => {
    const input = new Alert();
    input.title = "输入号码";
    let textField = input.addTextField("输入Bus或Stop Code", "");
    input.addAction("确定");
    input.addAction("取消");
    const buttonPressed = await input.presentAlert();
    if (buttonPressed === 0 && textField.text) {
      if (!isNaN(parseFloat(textField.text)) && textField.text.length === 5) {
        // 如果是数字且长度为 5，表示搜索站点号码
        searchStationCode = textField.text;
        // 调用searchStation函数，并等待返回的值
        const stationInfo = await searchStation(searchStationCode);
        if (stationInfo) {
          // 处理获取的到达信息
          handleArrivalInfo(stationInfo);
        }
      } else {
        // 否则，表示搜索巴士号码
        searchBusCode = textField.text;
        // 调用searchBus函数，并等待返回的值
        const result = await searchBus(searchBusCode);
        uitable(result); // 调用uitable函数并传递结果
      }
    } else {
      QuickLook.present(table);
    }
  };

  // 添加站点和到站信息
  for (let info of busInfo) {
    const stopName = info.stopname;
    const stopCode = info.stopcode;
    const busArrivalInfo = info.busArrivalInfo;

    // 添加站点名称
    let locationRow = new UITableRow();
    locationRow.isHeader = true;
    let locationCell = locationRow.addText(`站点: ${stopName} (${stopCode})`);
    locationCell.titleColor = Color.white();
    locationRow.backgroundColor = new Color("#4682B4");
    table.addRow(locationRow);

    // 分开添加底色的巴士和普通巴士
    const coloredBuses = [];
    const normalBuses = [];
    for (let busArrivalItem of busArrivalInfo) {
      const { buscode, arrivaltime } = busArrivalItem;
      let busRow = new UITableRow();
      let busCell = busRow.addText(buscode);
      let busfirstCell = busRow.addText(arrivaltime.First);
      let bussecondCell = busRow.addText(arrivaltime.Second);
      busCell.widthWeight = 15;
      busfirstCell.widthWeight = 43;
      bussecondCell.widthWeight = 42;

      // 匹配 stopCode 和 buscode
      const matchingStop = myBusCodes.find(
        item =>
          item.stopCode === stopCode &&
          item.busCodes.some(code => code === parseInt(buscode))
      );

      if (matchingStop) {
        busRow.backgroundColor = new Color("#556B2F");
        coloredBuses.push(busRow);
        busCell.titleColor = Color.white();
        busfirstCell.titleColor = Color.white();
        bussecondCell.titleColor = Color.white();
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

async function searchBus(searchBusCode) {
  const busDataArray = []; // 存储巴士数据的数组
  try {
    const request = new Request(
      `https://api.nestia.com/v4.5/transportations/search/bus?key=${searchBusCode}`
    );
    const response = await request.loadJSON();
    // 对每个巴士数据进行处理
    for (const bus of response) {
      if (!bus.hasOwnProperty("code")) {
        const { name, id, reverse_bus_id } = bus;
        if (id !== undefined) {
          const { startStopName, endStopName, stops } = await getBusData(
            id,
            reverse_bus_id
          );
          busDataArray.push({
            name,
            id,
            startStopName,
            endStopName,
            stops: [stops]
          });
        }
        if (reverse_bus_id !== undefined) {
          const { startStopName, endStopName, stops } = await getBusData(
            reverse_bus_id
          );
          busDataArray.push({
            name,
            id: reverse_bus_id,
            startStopName,
            endStopName,
            stops: [stops]
          });
        }
      }
    }
    return busDataArray;
  } catch (error) {
    console.error("Error1 fetching bus data: " + error);
    return null;
  }
}

async function getBusData(id, reverseBusId) {
  try {
    const busRequest = new Request(
      `https://api.nestia.com/v4.5/transportations/buses/${id}`
    );
    const busResponse = await busRequest.loadJSON();
    const startStopName = busResponse.start_stop.name;
    const endStopName = busResponse.end_stop.name;
    const stops = busResponse.stops.map(stop => {
      if (stop.nearby_station) {
        const uniqueMrtNames = [
          ...new Set(
            stop.nearby_station.line_codes.map(line => stop.nearby_station.name)
          )
        ];

        const lineCodes = uniqueMrtNames.map(mrtName => {
          const codes = [];
          const colors = [];
          stop.nearby_station.line_codes.forEach(line => {
            if (stop.nearby_station.name === mrtName) {
              codes.push(`${getColoredCircleEmoji(line.color)}${line.code}`);
              colors.push(line.color);
            }
          });
          return `${codes.join(" ")} ${mrtName}`;
        });

        return {
          name: stop.name,
          code: stop.code,
          id: stop.id,
          stops: stop.stops,
          address: stop.address,
          nearbymrt: lineCodes.join(" ")
        };
      } else {
        return {
          name: stop.name,
          code: stop.code,
          id: stop.id,
          stops: stop.stops,
          address: stop.address,
          nearbymrt: null
        };
      }
    });

    return { startStopName, endStopName, stops };
  } catch (error) {
    console.error("Error fetching bus data: " + error);
    return { startStopName: null, endStopName: null, stops: [] };
  }
}

async function uitable(busDataArray) {
  const busTable = new UITable();
  busTable.showSeparators = true;

  const busHeaderRow = new UITableRow();
  busHeaderRow.isHeader = true;
  const busHeaderCell = busHeaderRow.addText("Search Result: " + searchBusCode);
  busTable.addRow(busHeaderRow);

  for (const bus of busDataArray) {
    const dataRow = new UITableRow();
    dataRow.height = 60;
    const busCell = dataRow.addText(
      `Bus Number: ${bus.name}\n${bus.startStopName} → ${bus.endStopName}`
    );
    dataRow.onSelect = async () => {
      await uitableStops(bus);
    };
    busTable.addRow(dataRow);
  }
  QuickLook.present(busTable);
}

async function uitableStops(bus) {
  const stopsTable = new UITable();
  stopsTable.showSeparators = true;

  const stopsHeaderRow = new UITableRow();
  stopsHeaderRow.height = 60;
  stopsHeaderRow.isHeader = true;
  const stopsHeaderCell = stopsHeaderRow.addText(
    `Bus Number: ${bus.name}\n${bus.startStopName} → ${bus.endStopName}`
  );
  stopsTable.addRow(stopsHeaderRow);

  let index = 1;
  for (const stops of bus.stops) {
    for (const stop of stops) {
      console.log(stop);
      const dataRow = new UITableRow();
      dataRow.height = 60;
      let stopName = `${index}，ᐅ ${stop.code} ${stop.name}`;
      if (stop.nearbymrt) {
        stopName += "🚇";
      }
      stopName += `\nAddress: ${stop.address}`;
      if (stop.nearbymrt) {
        dataRow.height = 90;
        stopName += `\n${stop.nearbymrt}`;
      }
      dataRow.addText(stopName);
      stopsTable.addRow(dataRow);
      index++;
    }
  }

  stopsTable.present();
}

// 根据颜色获取对应的 Emoji 圆形符号
function getColoredCircleEmoji(color) {
  const colorEmojis = {
    "#DB3117": "🔴", // 红色
    "#199E4E": "🟢", // 绿色
    "#056CCC": "🔵", // 蓝色
    "#9D0AAC": "🟣", // 紫色
    "#FAA405": "🟡", // 黄色
    "#9C5B26": "🟤", // 棕色
    "#79857B": "⚪️" // 灰色
    // 其他颜色...
  };
  return colorEmojis[color] || "";
}

async function searchStation(searchStationCode) {
  try {
    const searchRequest = new Request(
      `https://transport.nestia.com/api/v4.5/search/bus?key=${searchStationCode}`
    );
    const searchResponse = await searchRequest.loadJSON();
    // 如果没有找到站点信息，则返回null
    if (!searchResponse || searchResponse.length === 0) {
      console.error("No station information found.");
      return null;
    }
    // 提取第一个站点的ID和名称
    const stationId = searchResponse[0].id;
    const stationName = searchResponse[0].name;
    const stationCode = searchResponse[0].code;
    // 获取到达信息
    const arrivalRequest = new Request(
      `https://transport.nestia.com/api/v4.5/stops/${stationId}/bus_arrival`
    );
    const arrivalResponse = await arrivalRequest.loadJSON();

    return {
      stationName: stationName,
      stationCode: stationCode,
      arrivalInfo: arrivalResponse
    };
  } catch (error) {
    console.error("Error fetching data: " + error);
    return null;
  }
}

function handleArrivalInfo(stationInfo) {
  // 提取站点名称和到达信息
  const stationName = stationInfo.stationName;
  const stationCode = stationInfo.stationCode;
  const arrivalInfo = stationInfo.arrivalInfo;

  // 存储唯一的巴士名称
  const uniqueBusNames = new Set();

  // 存储巴士名称对应的到达时间
  const busArrivalTimes = [];

  // 遍历每个到达信息
  for (const arrival of arrivalInfo) {
    // 提取巴士名称、始发站和终点站
    const busName = arrival.bus.name;
    const startStop = arrival.bus.start_stop.name;
    const endStop = arrival.bus.end_stop.name;

    // 检查是否已经添加过该巴士名称，如果已添加则跳过
    if (uniqueBusNames.has(busName)) {
      continue;
    }

    // 将巴士名称添加到唯一巴士名称集合中
    uniqueBusNames.add(busName);

    // 提取到达时间数组
    const arrivals = arrival.arrivals;

    // 初始化存储时间的数组
    const busArrivalInfo = {
      stationName: stationName,
      stationCode: stationCode,
      busName: busName,
      startStop: startStop,
      endStop: endStop,
      First: "",
      Second: ""
    };

    // 遍历前两个到达时间
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

      const statusText = status === 1 ? "正常" : "异常";

      const key = i === 0 ? "First" : "Second";

      busArrivalInfo[key] = `${i === 0 ? "Next" : "Second"}: ${arrivalTime}`;
    }

    // 将到达时间信息添加到数组中
    busArrivalTimes.push(busArrivalInfo);
  }

  // 构建 UITable
  const stationTable = new UITable();
  stationTable.showSeparators = true;

  // 添加标题行
  let headerRow = new UITableRow();
  headerRow.isHeader = true;
  let headerCell = headerRow.addText(
    `${stationName}( ${stationCode} ) ${new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "numeric",
      minute: "numeric"
    })}`
  );
  stationTable.addRow(headerRow);

  // 添加巴士到达信息行
  for (const busArrival of busArrivalTimes) {
    let busArrivalRow = new UITableRow();
    busArrivalRow.height = 60;
    let busArrivalCell = busArrivalRow.addText(
      `Bus: ${busArrival.busName} ${busArrival.First} ${busArrival.Second}\n${busArrival.startStop} → ${busArrival.endStop}`
    );
    stationTable.addRow(busArrivalRow);
  }

  // 显示表格
  QuickLook.present(stationTable);
}

async function CheckKu() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "Ku.js");
  const url = "https://bb1026.github.io/bing/js/Ku.js";
  let needDownload = false;

  try {
    if (!fm.fileExists(path) || !fm.readString(path).includes("installation")) {
      console.log("数据库异常，准备重新下载");
      notify("数据库异常", "本地数据库无效，准备重新下载");
      needDownload = true;
    }
  } catch {
    console.log("数据库异常，准备重新下载");
    notify("数据库异常", "读取数据库出错，准备重新下载");
    needDownload = true;
  }

  async function notify(title, body) {
    const n = new Notification();
    n.title = title;
    n.body = body;
    await n.schedule();
  }

  if (needDownload) {
    fm.writeString(path, await new Request(url).loadString());
    if (fm.isFileStoredIniCloud(path)) await fm.downloadFileFromiCloud(path);
    console.log("数据库下载完成");
  }

  ({ installation } = importModule("Ku"));
  if (typeof installation !== "function") throw new Error("数据库模块无效");
}

// 运行函数
if (config.runsInWidget) {
  await createWidget();
} else {
  //   await createWidget();
  await createTable();
}
