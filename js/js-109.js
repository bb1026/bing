// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bus-alt;
this.name = "BusGo";
this.widget_ID = "js-109";
this.version = "v1.5";

// 检查更新
await CheckKu();
const { installation } = importModule("Ku");
/* 
以上为获取更新代码
以下开始运行代码
*/

// 使用 Scriptable 内置的 FileManager 和 Location 模块
const fm = FileManager.local();

// API Key
const accountKey = "XXPgdr5QSdiFeDNhghGGrw==";

// 自定义巴士号码
const myBusCodes = [
  { busstop: "Yishun Int", stopCode: "59009", busCodes: ["804"] },
  { busstop: "Blk 236", stopCode: "59241", busCodes: ["804"] },
  //   { busstop: "Blk 257", stopCode: "59249", busCodes: ["800"] },
  { busstop: "Boon Lay Int", stopCode: "22009", busCodes: ["246", "249"] },
  { busstop: "Bef Jln Tukang", stopCode: "21499", busCodes: ["246"] },
  { busstop: "Bef Intl Rd⭐", stopCode: "21491", busCodes: ["246"] },
  //   { busstop: "UTOC ENGRG", stopCode: "21321", busCodes: ["249"] },
  { busstop: "Opp Yishun Stn", stopCode: "59073", busCodes: ["858"] }
];

// API URL 模板
const apiUrls = {
  busRoutes:
    "https://datamall2.mytransport.sg/ltaodataservice/BusRoutes?$skip=",
  busServices:
    "https://datamall2.mytransport.sg/ltaodataservice/BusServices?$skip=",
  busStops: "https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=",
  BusArrival:
    "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode="
};

// 最大 skip 值
const maxSkip = { busRoutes: 26000, busServices: 1000, busStops: 5500 };

// 缓存文件路径
const cachePaths = {
  busRoutes: fm.joinPath(fm.documentsDirectory(), "busRoutesCache.json"),
  busServices: fm.joinPath(fm.documentsDirectory(), "busServicesCache.json"),
  busStops: fm.joinPath(fm.documentsDirectory(), "busStopsCache.json")
};

// 请求头
const headers = { AccountKey: accountKey, Accept: "application/json" };

// **检查数据是否需要更新**
async function checkAndFetchData(forceUpdate = false) {
  let needsUpdate = forceUpdate;
  for (const key in cachePaths) {
    if (!fm.fileExists(cachePaths[key])) {
      console.log(`${key} 缓存文件不存在，开始更新...`);
      needsUpdate = true;
    }
  }
  if (needsUpdate) await fetchAllData(forceUpdate);
}

// **分页获取并缓存数据**
async function fetchAndCacheData(apiKey) {
  const apiUrl = apiUrls[apiKey],
    cachePath = cachePaths[apiKey],
    max = maxSkip[apiKey];

  try {
    let allData = [];
    for (let skip = 0; skip <= max; skip += 500) {
      console.log(`Fetching ${apiKey}, skip=${skip}...`);
      const req = new Request(apiUrl + skip);
      req.headers = headers;
      const data = await req.loadJSON();
      if (data.value) allData = allData.concat(data.value);
    }
    fm.writeString(cachePath, JSON.stringify(allData));
    console.log(`Saved ${allData.length} records to ${cachePath}`);
  } catch (error) {
    console.error(`Failed to fetch ${apiKey}: ${error}`);
  }
}

// **获取所有数据并缓存**
const updateTimeCachePath = fm.joinPath(
  fm.documentsDirectory(),
  "updateTimeCache.json"
);
async function fetchAllData(forceUpdate = false) {
  for (const key of ["busRoutes", "busServices", "busStops"]) {
    await fetchAndCacheData(key);
  }

  // 记录更新时间
  const now = new Date().toISOString();
  fm.writeString(updateTimeCachePath, JSON.stringify({ lastUpdate: now }));

  console.log("所有数据已成功更新并缓存！");
  const alert = new Alert();
  alert.title = "数据更新完成";
  alert.message = "所有数据已成功更新！";
  alert.addAction("好的");
  await alert.present();
}

// **读取缓存数据**
function readCache(cacheKey) {
  if (!fm.fileExists(cachePaths[cacheKey]))
    throw new Error(`${cacheKey} 数据不存在`);
  return JSON.parse(fm.readString(cachePaths[cacheKey]));
}

var buttonText = `本地数据: ${
  fm.fileExists(cachePaths.busStops) ? "正常🟢" : "异常🔴"
} (上次更新: ${getFormattedUpdateTime()})`;

console.log(buttonText); // 输出按钮文本到控制台

// **计算两点距离（Haversine 公式）**
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = deg => deg * (Math.PI / 180),
    R = 6371;
  const dLat = toRadians(lat2 - lat1),
    dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// **获取最近的 10 个公交站点**
function getNearestBusStops(userLat, userLon, busStops) {
  return busStops
    .map(stop => ({
      ...stop,
      distance: calculateDistance(
        userLat,
        userLon,
        stop.Latitude,
        stop.Longitude
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);
}

// **获取指定公交站点的到站信息**
async function getStopArrivalInfo(stopCode) {
  try {
    const req = new Request(apiUrls.BusArrival + stopCode);
    req.headers = headers;
    return await req.loadJSON();
  } catch (error) {
    console.error(`Error fetching stop arrival info: ${error}`);
    return null;
  }
}

// **格式化到达时间**
function formatArrivalTime(busInfo) {
  if (!busInfo || !busInfo.EstimatedArrival) return "未发车";
  const diff = (new Date(busInfo.EstimatedArrival) - new Date()) / 1000;
  return diff < 60 ? "即将到站" : `${Math.ceil(diff / 60)}分钟`;
}

// **添加到站信息到 UITable**
async function addBusArrivalRows(table, stopCode, allowedBusCodes = null) {
  const stopArrivalInfo = await getStopArrivalInfo(stopCode);

  if (stopArrivalInfo?.Services?.length) {
    for (const service of stopArrivalInfo.Services) {
      if (allowedBusCodes && !allowedBusCodes.includes(service.ServiceNo))
        continue; // 过滤不在列表中的巴士
      const row = new UITableRow();
      row.addText(service.ServiceNo).widthWeight = 25;
      [service.NextBus, service.NextBus2, service.NextBus3]
        .map(formatArrivalTime)
        .forEach(text => (row.addText(text).widthWeight = 25));
      table.addRow(row);
    }
  } else {
    const noArrivalRow = new UITableRow();
    noArrivalRow.addText("🚫没有到站信息");
    table.addRow(noArrivalRow);
  }
}

// **创建 UITable**
async function createTable(
  stopCode = null,
  busCode = null,
  useLocation = false
) {
  const busStops = readCache("busStops");
  const busRoutes = readCache("busRoutes");

  const table = new UITable();
  table.showSeparators = true;

  // **数据更新按钮**
  const updateRow = new UITableRow();

  const button = updateRow.addButton(buttonText);

  button.onTap = async () => {
    await fetchAllData(true); // 获取数据
    table.reload(); // 刷新表格
  };

  table.addRow(updateRow);

  // **三个按钮放在同一行**
  const buttonRow = new UITableRow();

  // **附近站点（点击时才获取定位）**
  const nearbyButton = buttonRow.addButton("🛰️ 附近站点");
  nearbyButton.widthWeight = 33;
  nearbyButton.onTap = async () => {
    let notification = new Notification();
    notification.title = Script.name();
    notification.body = "正在定位...\n请稍后...";
    // 显示通知
    notification.schedule();

    const loc = await Location.current();
    await createTable(null, null, loc);
  };

  // **搜索站点**
  const searchStopButton = buttonRow.addButton("🚉 搜索站点");
  searchStopButton.widthWeight = 33;
  searchStopButton.onTap = async () => {
    const code = await promptUserForStopCode();
    if (code) await createTable(code);
  };

  // **搜索巴士**
  const searchBusButton = buttonRow.addButton("🚌 搜索巴士");
  searchBusButton.widthWeight = 33;
  searchBusButton.onTap = async () => {
    const code = await promptUserForBusCode();
    if (code) await createTable(null, code);
  };

  table.addRow(buttonRow);

  // **添加表头**
  if (!busCode) {
    const headerRow = new UITableRow();
    ["巴士", "第一班", "第二班", "第三班"].forEach(
      text => (headerRow.addText(text).widthWeight = 25)
    );
    table.addRow(headerRow);
  }

  if (useLocation) {
    // **使用定位查找最近的 10 个公交站点**
    const { latitude, longitude } = useLocation;
    const nearestStops = getNearestBusStops(latitude, longitude, busStops);
    if (nearestStops.length) {
      for (const stop of nearestStops) {
        const stopRow = new UITableRow();
        stopRow.addText(
          `${stop.Description} (${stop.BusStopCode})- ${(
            stop.distance * 1000
          ).toFixed(2)} m`
        );
        // 点击后查看该站点的所有巴士信息
        stopRow.onSelect = async () => {
          await createTable(stop.BusStopCode);
        };
        table.addRow(stopRow);
        await addBusArrivalRows(table, null, stop.BusStopCode, null);
      }
    } else {
      table.addRow(new UITableRow().addText("未找到附近站点"));
    }
  } else if (stopCode) {
    // **按站点代码搜索**
    const stopInfo = busStops.find(stop => stop.BusStopCode === stopCode);
    if (stopInfo) {
      const stopRow = new UITableRow();
      stopRow.addText(`${stopInfo.Description} (${stopInfo.BusStopCode})`);
      table.addRow(stopRow);
      await addBusArrivalRows(table, null, stopCode, null);
    } else {
      table.addRow(new UITableRow().addText("未找到该站点"));
    }
  } else if (busCode) {
    // **搜索巴士号码，显示路线**
    let matchedRoutes = busRoutes.filter(route => route.ServiceNo === busCode);

    if (matchedRoutes.length) {
      matchedRoutes.sort(
        (a, b) => a.Direction - b.Direction || a.StopSequence - b.StopSequence
      );

      // **表头**
      const headerRow = new UITableRow();
      headerRow.addText("站点代码").widthWeight = 30;
      headerRow.addText("站点名称").widthWeight = 70;
      table.addRow(headerRow);

      // **显示巴士路线**
      for (const route of matchedRoutes) {
        const stopInfo = busStops.find(
          stop => stop.BusStopCode === route.BusStopCode
        );
        const stopName = stopInfo ? stopInfo.Description : "未知站点";

        const row = new UITableRow();
        row.addText(route.BusStopCode).widthWeight = 30;
        row.addText(stopName).widthWeight = 70;

        // **点击查询该站点的巴士到站信息**
        row.onSelect = async () => {
          await createTable(route.BusStopCode);
        };

        table.addRow(row);
      }
    } else {
      table.addRow(new UITableRow().addText("未找到该巴士的路线信息"));
    }
  } else {
    // **默认显示 myBusCodes 里的站点**
    for (const { busstop, stopCode, busCodes } of myBusCodes) {
      const stopInfo = busStops.find(stop => stop.BusStopCode === stopCode);
      if (!stopInfo) continue;

      const stopRow = new UITableRow();
      stopRow.addText(`${busstop} (${stopCode})`);
      // 点击后查看该站点的所有巴士信息
      stopRow.onSelect = async () => {
        await createTable(stopCode);
      };
      table.addRow(stopRow);

      await addBusArrivalRows(table, busstop, stopCode, busCodes);
    }
  }

  table.present();
}

async function addBusArrivalRows(
  table,
  busstop,
  stopCode,
  allowedBusCodes = null
) {
  // 获取站点到达信息
  const stopArrivalInfo = await getStopArrivalInfo(stopCode);

  if (!stopArrivalInfo?.Services?.length) {
    const noArrivalRow = new UITableRow();
    noArrivalRow.addText("🚫没有到站信息");
    table.addRow(noArrivalRow);
    return;
  }

  // **显示每个巴士的到达时间**
  for (const service of stopArrivalInfo.Services) {
    // 过滤不在允许的巴士列表中的巴士
    if (allowedBusCodes && !allowedBusCodes.includes(service.ServiceNo))
      continue;

    const row = new UITableRow();
    row.addText(service.ServiceNo).widthWeight = 25;

    // 显示三班车到达时间
    [service.NextBus, service.NextBus2, service.NextBus3]
      .map(formatArrivalTime) // 格式化到达时间
      .forEach(text => (row.addText(text).widthWeight = 25));

    // **点击时显示首末班车时间**
    row.onSelect = async () => {
      //       console.log(busstop)
      await showBusFirstLastTimes(busstop, stopCode, service.ServiceNo);
    };

    table.addRow(row);
  }
}

function getFirstLastBusTimes(stopCode, busCode) {
  const busRoutes = readCache("busRoutes");
  const matchedRoute = busRoutes.find(
    route => route.BusStopCode === stopCode && route.ServiceNo === busCode
  );

  if (!matchedRoute) return null;

  return {
    serviceNo: busCode,
    firstBus: matchedRoute.WD_FirstBus || "未知",
    lastBus: matchedRoute.WD_LastBus || "未知",
    weekday: `   首班:  ${matchedRoute.WD_FirstBus || "未知"} - 末班:  ${
      matchedRoute.WD_LastBus || "未知"
    }`,
    saturday: `   首班:  ${matchedRoute.SAT_FirstBus || "未知"} - 末班:  ${
      matchedRoute.SAT_LastBus || "未知"
    }`,
    sunday: `   首班:  ${matchedRoute.SUN_FirstBus || "未知"} - 末班:  ${
      matchedRoute.SUN_LastBus || "未知"
    }`
  };
}

// **获取该巴士的完整路线**
function getBusRoute(busCode) {
  const busRoutes = readCache("busRoutes"); // 读取巴士路线数据
  const busStops = readCache("busStops"); // 读取站点数据

  const matchedRoutes = busRoutes
    .filter(route => route.ServiceNo === busCode)
    .sort(
      (a, b) => a.Direction - b.Direction || a.StopSequence - b.StopSequence
    );

  return matchedRoutes.map(route => {
    const stopInfo = busStops.find(
      stop => stop.BusStopCode === route.BusStopCode
    );
    return {
      busStopCode: route.BusStopCode,
      stopName: stopInfo ? stopInfo.Description : "未知站点"
    };
  });
}

async function showBusFirstLastTimes(busstop, stopCode, busCode) {
  const busTimes = getFirstLastBusTimes(stopCode, busCode);
  const busRoute = getBusRoute(busCode);

  if (!busTimes) {
    let table = new UITable();
    table.addRow(new UITableRow().addText("未找到该巴士的首末班车时间"));
    table.present();
    return;
  }

  let table = new UITable();
  table.showSeparators = true;

  // **第一行：站点信息**
  const stopRow = new UITableRow();
  stopRow.addText(`站点: ${busstop} (${stopCode})`).widthWeight = 50;
  table.addRow(stopRow);

  // **第二行：巴士信息**
  const busRow = new UITableRow();
  busRow.addText(`巴士: ${busTimes.serviceNo}`).widthWeight = 50;
  busRow.addText(
    `首班: ${busTimes.firstBus} | 末班: ${busTimes.lastBus}`
  ).widthWeight = 50;
  table.addRow(busRow);

  // **第三行：工作日时间**
  const weekdayRow = new UITableRow();
  weekdayRow.addText(`🗓️ 工作日: ${busTimes.weekday}`);
  table.addRow(weekdayRow);

  // **第四行：星期六时间**
  const saturdayRow = new UITableRow();
  saturdayRow.addText(`🗓️ 星期六: ${busTimes.saturday}`);
  table.addRow(saturdayRow);

  // **第五行：星期日时间**
  const sundayRow = new UITableRow();
  sundayRow.addText(`🗓️ 星期日: ${busTimes.sunday}`);
  table.addRow(sundayRow);

  // **分隔线**
  const separatorRow = new UITableRow();
  separatorRow.isHeader = true;
  separatorRow.addText("—— 巴士完整路线 ——").centerAligned();
  table.addRow(separatorRow);

  // **表头**
  const headerRow = new UITableRow();
  headerRow.addText("站点代码").widthWeight = 30;
  headerRow.addText("站点名称").widthWeight = 70;
  table.addRow(headerRow);

  // **显示巴士路线**
  for (const route of busRoute) {
    const row = new UITableRow();

    // 创建文本单元格
    let stopCodeCell = row.addText(route.busStopCode);
    let stopNameCell = row.addText(route.stopName);

    // 设置列宽
    stopCodeCell.widthWeight = 30;
    stopNameCell.widthWeight = 70;

    // **如果当前站点是目标站点，就加粗**
    if (route.busStopCode === stopCode) {
      stopCodeCell.titleFont = Font.boldSystemFont(16);
      stopNameCell.titleFont = Font.boldSystemFont(16);
    }

    table.addRow(row);
  }

  table.present();
}

function getFormattedUpdateTime() {
  if (!fm.fileExists(updateTimeCachePath)) {
    return "未更新"; // 如果没有记录更新时间
  }

  try {
    const { lastUpdate } = JSON.parse(fm.readString(updateTimeCachePath));
    const updateDate = new Date(lastUpdate);
    const now = new Date();

    const updateHours = updateDate.getHours().toString().padStart(2, "0");
    const updateMinutes = updateDate.getMinutes().toString().padStart(2, "0");
    const timeStr = `${updateHours}:${updateMinutes}`;

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (updateDate >= today) {
      return `今天 ${timeStr}`;
    } else if (updateDate >= yesterday) {
      return `昨天 ${timeStr}`;
    } else {
      const updateMonth = (updateDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const updateDay = updateDate.getDate().toString().padStart(2, "0");
      return `${updateDate.getFullYear()}-${updateMonth}-${updateDay} ${timeStr}`;
    }
  } catch (error) {
    console.error("Error reading update time:", error);
    return "时间格式错误";
  }
}

// 获取特定站点和巴士的到站信息
async function getArrivalInfoForStop(stopCode, busCodes) {
  const busArrivalInfo = [];

  // 获取某个站点的到站信息，这个函数需要适配API请求
  const stopArrivalInfo = await getStopArrivalInfo(stopCode);

  if (stopArrivalInfo?.Services?.length) {
    for (const service of stopArrivalInfo.Services) {
      if (busCodes && busCodes.includes(service.ServiceNo)) {
        busArrivalInfo.push({
          buscode: service.ServiceNo,
          arrivalTime: {
            First: formatArrivalTime(service.NextBus),
            Second: formatArrivalTime(service.NextBus2),
            Third: formatArrivalTime(service.NextBus3)
          }
        });
      }
    }
  }

  return busArrivalInfo;
}

// 格式化到站时间
function formatArrivalTime(bus) {
  if (!bus?.EstimatedArrival) return "未发车";

  const arrival = new Date(bus.EstimatedArrival);
  const diff = Math.round((arrival - new Date()) / 60000);

  if (diff > 0) {
    return `${diff} 分钟`;
  } else if (diff >= -2) {
    return "即将到达"; // 允许一些误差
  } else {
    return "已离开";
  }
}

// 获取当前时间并格式化
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// 创建小组件
async function createWidget() {
  const widget = new ListWidget();
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [new Color("#6CC6CB"), new Color("#0090FF")];
  widget.backgroundGradient = gradient;

  const titleStack = widget.addStack();
  titleStack.layoutHorizontally();

  // 左侧标题
  const title = titleStack.addText("🚌 巴士到站信息 ");
  title.font = Font.boldSystemFont(16);
  title.textColor = Color.white();

  // 右侧更新时间
  const updateTime = titleStack.addText(`(${getCurrentTime()})`);
  updateTime.font = Font.systemFont(16);
  updateTime.textColor = Color.white();

  widget.addSpacer(5);

  for (const { busstop, stopCode, busCodes } of myBusCodes) {
    const stopArrivalInfo = await getStopArrivalInfo(stopCode);
    const stopTitle = widget.addText(`🚏${busstop} (${stopCode})`);
    stopTitle.font = Font.mediumSystemFont(14);
    stopTitle.textColor = Color.cyan(); // ✅ 修正错误

    widget.addSpacer(1);

    if (stopArrivalInfo?.Services?.length) {
      let hasBus = false;

      for (const service of stopArrivalInfo.Services) {
        const serviceNo = service.ServiceNo.trim(); // 去除空格

        if (!busCodes.includes(serviceNo)) {
          continue;
        }

        hasBus = true;

        const row = widget.addStack();
        row.layoutHorizontally();

        const busNumber = row.addText(`🚌${serviceNo}`);
        busNumber.font = Font.mediumSystemFont(14);
        busNumber.textColor = Color.white();
        row.addSpacer(10);

        [service.NextBus, service.NextBus2, service.NextBus3]
          .map(formatArrivalTime)
          .forEach((text, i) => {
            if (i > 0) row.addSpacer(18);
            const timeText = row.addText(text);
            timeText.font = Font.systemFont(14);
            timeText.textColor = new Color("#FFD700");
          });

        widget.addSpacer(1);
      }

      if (!hasBus) {
        const noBusText = widget.addText("🚫 无符合条件的巴士");
        noBusText.font = Font.systemFont(14);
        noBusText.textColor = Color.red();
      }
    } else {
      const noDataText = widget.addText("🚫 没有到站信息");
      noDataText.font = Font.systemFont(14);
      noDataText.textColor = Color.red();
    }

    widget.addSpacer(4);
  }
  widget.addSpacer();

  return widget;
}

// **提示用户输入 stopcode**
async function promptUserForStopCode() {
  const alert = new Alert();
  alert.title = "搜索站点";
  alert.addTextField("站点代码", "");
  alert.addAction("确定");
  alert.addCancelAction("取消");
  return (await alert.present()) === 0 ? alert.textFieldValue(0) : null;
}

// **提示用户输入巴士号码**
async function promptUserForBusCode() {
  const alert = new Alert();
  alert.title = "搜索巴士";
  alert.addTextField("巴士号码", "");
  alert.addAction("确定");
  alert.addCancelAction("取消");
  return (await alert.present()) === 0 ? alert.textFieldValue(0) : null;
}

async function CheckKu() {
  const notification = new Notification();
  const fm = FileManager.iCloud();
  const KuName = "Ku.js";
  const scriptPath = fm.joinPath(fm.documentsDirectory(), KuName);
  const scriptExists = fm.fileExists(scriptPath);

  if (!scriptExists) {
    try {
      const downloadReq = new Request("https://bb1026.github.io/bing/js/Ku.js");
      const scriptContent = await downloadReq.loadString();
      await fm.writeString(scriptPath, scriptContent);

      notification.title = "依赖库安装完成!";
      await notification.schedule();
      console.log("依赖库安装完成!");
    } catch (error) {
      console.error("下载或写入文件时出错:", error);
      notification.title = "依赖库安装失败!";
      notification.body = error.toString();
      await notification.schedule();
    }
  } else {
    console.log("依赖库已存在，无需下载。");
  }
}

// **主函数**
await checkAndFetchData();

// **运行小组件**
if (config.runsInWidget) {
  let widget = await createWidget();
  Script.setWidget(widget);
} else {
  await installation(this.widget_ID, this.version);
  let widget = await createWidget();
  // **运行在软件内测试用小组件**
  //   widget.presentLarge();

  // **运行Uitable**
  await createTable();
}
Script.complete();
