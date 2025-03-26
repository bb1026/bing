// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bus-alt;
this.name = "BusGo";
this.widget_ID = "js-109";
this.version = "v2.0";

const fm = FileManager.local();

const accountKey = "XXPgdr5QSdiFeDNhghGGrw==";

// 自定义巴士号码
const myBusCodes = [
  { busstop: "Yishun Int", stopCode: "59009", busCodes: ["804", "800"] },
  { busstop: "Blk 236", stopCode: "59241", busCodes: ["804"] },
  { busstop: "Boon Lay Int", stopCode: "22009", busCodes: ["246", "249"] },
  {
    busstop: "Bef Jln Tukang(To Lakeside)",
    stopCode: "21499",
    busCodes: ["246"]
  },
  {
    busstop: "Bef Intl Rd(To Boon Lay)⭐",
    stopCode: "21491",
    busCodes: ["246"]
  },
  //   { busstop: "UTOC ENGRG", stopCode: "21321", busCodes: ["249"] },
  { busstop: "Opp Yishun Stn", stopCode: "59073", busCodes: ["858"] }
];

const apiUrls = {
  busRoutes:
    "https://datamall2.mytransport.sg/ltaodataservice/BusRoutes?$skip=",
  busServices:
    "https://datamall2.mytransport.sg/ltaodataservice/BusServices?$skip=",
  busStops: "https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=",
  BusArrival:
    "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode="
};

const maxSkip = { busRoutes: 26000, busServices: 1000, busStops: 5500 };

// 缓存文件路径
const cachePaths = {
  busRoutes: fm.joinPath(fm.documentsDirectory(), "busRoutesCache.json"),
  busServices: fm.joinPath(fm.documentsDirectory(), "busServicesCache.json"),
  busStops: fm.joinPath(fm.documentsDirectory(), "busStopsCache.json")
};

// **检查数据是否需要更新**
async function checkAndFetchData(forceUpdate = false) {

  let needsUpdate = forceUpdate;
  for (const key in cachePaths) {
    if (!fm.fileExists(cachePaths[key])) {
      console.log(`${key} 缓存文件不存在，开始更新...`);
      needsUpdate = true;
    } else {
      console.log(`${key} 缓存正常`);
    }
  }
  if (needsUpdate) await fetchAllData(forceUpdate);
}

// **分页获取并缓存数据**
const headers = { AccountKey: accountKey, Accept: "application/json" };

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

    // 记录更新时间
    const now = new Date().toISOString();
    fm.writeString(updateTimeCachePath, JSON.stringify({ lastUpdate: now }));
  } catch (error) {
    console.error(`Failed to fetch ${apiKey}: ${error}`);
    throw error;
  }
}

const updateTimeCachePath = fm.joinPath(
  fm.documentsDirectory(),
  "updateTimeCache.json"
);

// **获取所有数据并缓存**
async function fetchAllData(forceUpdate = false) {
  try {
    const startNotification = new Notification();
    startNotification.title = "数据更新";
    startNotification.body = "正在更新数据，请稍候...";
    await startNotification.schedule();

    const tasks = ["busRoutes", "busServices", "busStops"];
    const failedTasks = [];

    for (const key of tasks) {
      try {
        await fetchAndCacheData(key);
      } catch (error) {
        failedTasks.push(key);
        console.error(`Task ${key} failed: ${error}`);
      }
    }

    if (failedTasks.length === 0) {
      const endNotification = new Notification();
      endNotification.title = "数据更新完成";
      endNotification.body = "所有数据已成功更新！";
      await endNotification.schedule();
    } else {
      const errorNotification = new Notification();
      errorNotification.title = "数据更新部分失败";
      errorNotification.body = `以下任务更新失败: ${failedTasks.join(", ")}`;
      await errorNotification.schedule();
    }

    console.log("数据更新任务完成");
  } catch (error) {
    const errorNotification = new Notification();
    errorNotification.title = "数据更新失败";
    errorNotification.body = `更新数据时出错: ${error.message}`;
    await errorNotification.schedule();

    console.error(`数据更新失败: ${error}`);
  }
}

// **读取缓存数据**
function readCache(cacheKey) {
  if (!fm.fileExists(cachePaths[cacheKey]))
    throw new Error(`${cacheKey} 数据不存在`);
  return JSON.parse(fm.readString(cachePaths[cacheKey]));
}

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

// **主函数**
await checkAndFetchData();

let table = new UITable();
table.showSeparators = true;

const buttonText = `🗂️ 数据更新: ${getFormattedUpdateTime()}`;
const buttonText2 = "🗑️ 清除缓存";
const buttonText3 = "🔄 刷新";
const buttonText4 = "🛰️ 附近站点";
const buttonText5 = "🚉 搜索站点";
const buttonText6 = "🚌 搜索巴士";
const buttonText7 = "💟 收藏";

// **数据更新按钮，清除缓存按钮**
const UpdateCleanRow = new UITableRow();
const updatebutton = UpdateCleanRow.addButton(buttonText);
updatebutton.widthWeight = 70;
const cleanbutton = UpdateCleanRow.addButton(buttonText2);
cleanbutton.widthWeight = 35;
const refreshButton = UpdateCleanRow.addButton(buttonText3);
refreshButton.widthWeight = 35;

const buttonRow = new UITableRow();
const nearbyButton = buttonRow.addButton(buttonText4);
nearbyButton.widthWeight = 0;
const searchStopButton = buttonRow.addButton(buttonText5);
searchStopButton.widthWeight = 0;
const searchBusButton = buttonRow.addButton(buttonText6);
searchBusButton.widthWeight = 0;
const favoriteBusButton = buttonRow.addButton(buttonText7);
favoriteBusButton.widthWeight = 0;

// **初始化表格**
async function initializeTable() {
  try {
    table.removeAllRows();
    table.addRow(UpdateCleanRow);
    table.addRow(buttonRow);
  } catch (error) {
    console.error("初始化表格时出错:", error);
    table.addRow(new UITableRow().addText("初始化表格时出错"));
  }
}

// **添加表头**
function addTableHeader(busCode) {
  if (!busCode) {
    const headerRow = new UITableRow();
    ["巴士", "第一班", "第二班", "第三班"].forEach(
      text => (headerRow.addText(text).widthWeight = 25)
    );
    table.addRow(headerRow);
  }
}

// **添加附近站点**
async function addNearestStops(latitude, longitude, busStops) {
  const nearestStops = getNearestBusStops(latitude, longitude, busStops);
  if (nearestStops.length) {
    for (const stop of nearestStops) {
      const stopRow = new UITableRow();
      stopRow.isHeader = true;
      stopRow.addText(
        `${stop.Description} (${stop.BusStopCode}) - ${(
          stop.distance * 1000
        ).toFixed(2)} m`
      );
      stopRow.onSelect = async () => {
        await createTable(stop.BusStopCode);
        table.present();
      };
      table.addRow(stopRow);
      await addBusArrivalRows(table, null, stop.BusStopCode, null);
    }
  } else {
    table.addRow(new UITableRow().addText("未找到附近站点"));
  }
}

// **添加站点信息**
async function addStopInfo(stopCode, busStops) {
  const stopInfo = busStops.find(stop => stop.BusStopCode === stopCode);
  if (stopInfo) {
    const stopRow = new UITableRow();
    stopRow.isHeader = true;
    stopRow.addText(`${stopInfo.Description} (${stopInfo.BusStopCode})`);
    table.addRow(stopRow);
    await addBusArrivalRows(table, stopInfo.Description, stopCode, null);
  } else {
    table.addRow(new UITableRow().addText("未找到该站点"));
  }
}

// **添加巴士路线**
async function addBusRoutes(busCode, busRoutes, busStops) {
  let matchedRoutes = busRoutes.filter(route => route.ServiceNo === busCode);

  if (matchedRoutes.length) {
    matchedRoutes.sort(
      (a, b) => a.Direction - b.Direction || a.StopSequence - b.StopSequence
    );

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

      row.onSelect = async () => {
        await createTable(route.BusStopCode);
        table.present();
      };

      table.addRow(row);
    }
  } else {
    table.addRow(new UITableRow().addText("未找到该巴士的路线信息"));
  }
}

// **添加收藏的站点**
async function addMyBusCodes(myBusCodes, busStops) {
  for (const { busstop, stopCode, busCodes } of myBusCodes) {
    const stopInfo = busStops.find(stop => stop.BusStopCode === stopCode);
    if (!stopInfo) continue;

    const stopRow = new UITableRow();
    stopRow.isHeader = true;
    stopRow.addText(`${busstop} (${stopCode})`);
    stopRow.onSelect = async () => {
      await createTable(stopCode);
      table.present();
    };
    table.addRow(stopRow);

    await addBusArrivalRows(table, busstop, stopCode, busCodes);
  }
}

let currentStopCode = null;
let currentBusCode = null;
let currentUseLocation = false;

// **创建表格**
async function createTable(
  stopCode = null,
  busCode = null,
  useLocation = false
) {
  try {
    currentStopCode = stopCode;
    currentBusCode = busCode;
    currentUseLocation = useLocation;

    initializeTable();
    addTableHeader(busCode);

    const busStops = readCache("busStops");
    const busRoutes = readCache("busRoutes");

    if (useLocation) {
      const { latitude, longitude } = useLocation;
      await addNearestStops(latitude, longitude, busStops);
    } else if (stopCode) {
      await addStopInfo(stopCode, busStops);
    } else if (busCode) {
      await addBusRoutes(busCode, busRoutes, busStops);
    } else {
      await addMyBusCodes(myBusCodes, busStops);
    }
    table.reload();
  } catch (error) {
    console.error("创建表格时出错:", error);
    table.addRow(new UITableRow().addText("创建表格时出错"));
  }
}

// **按钮事件处理**
refreshButton.onTap = async () => {
  await createTable(currentStopCode, currentBusCode, currentUseLocation);
};

updatebutton.onTap = async () => {
  await fetchAllData(true); // 获取最新数据
  await createTable(stopCode, busCode, useLocation);
};

cleanbutton.onTap = async () => {
  await clearCache();
};

nearbyButton.onTap = async () => {
  let notification = new Notification();
  notification.title = Script.name();
  notification.body = "正在定位...\n请稍后...";
  notification.schedule();

  const loc = await Location.current();
  await createTable(null, null, loc);
};

searchStopButton.onTap = async () => {
  const code = await promptUserForInput("stop");
  if (code) await createTable(code);
};

searchBusButton.onTap = async () => {
  const code = await promptUserForInput("bus");
  if (code) await createTable(null, code);
};

favoriteBusButton.onTap = async () => {
  await createTable();
};

async function addBusArrivalRows(
  table,
  busstop,
  stopCode,
  allowedBusCodes = null
) {
  // 获取站点到达信息
  const stopArrivalInfo = await getStopArrivalInfo(stopCode);

  if (!stopArrivalInfo?.Services?.length) {
    if (allowedBusCodes) {
      for (const busCode of allowedBusCodes) {
        const row = new UITableRow();
        const busNumberCell = row.addText(`🚌 ${busCode}`);
        busNumberCell.widthWeight = 20;
        busNumberCell.font = Font.boldSystemFont(16);
        busNumberCell.textColor = Color.blue();
        const noArrivalCell = row.addText("🚫 没有到站信息");
        noArrivalCell.widthWeight = 80;
        noArrivalCell.font = Font.systemFont(14);
        noArrivalCell.textColor = Color.red();

        table.addRow(row);
      }
    } else {
      const noArrivalRow = new UITableRow();
      noArrivalRow.addText("🚫 没有到站信息").centerAligned();
      table.addRow(noArrivalRow);
    }
    return;
  }

  let hasAllowedBus = false; // 标记是否有符合条件的巴士
  const displayedBusCodes = new Set(); // 记录已显示的巴士号码

  // **显示每个巴士的到达时间**
  for (const service of stopArrivalInfo.Services) {
    // 过滤不在 allowedBusCodes 列表中的巴士
    if (
      allowedBusCodes &&
      !allowedBusCodes.includes(service.ServiceNo.trim())
    ) {
      continue;
    }

    hasAllowedBus = true; // 标记有符合条件的巴士
    displayedBusCodes.add(service.ServiceNo.trim()); // 记录已显示的巴士号码

    const row = new UITableRow();

    // 显示巴士号码
    const busNumberCell = row.addText(`🚌 ${service.ServiceNo.trim()}`);
    busNumberCell.widthWeight = 25;
    busNumberCell.font = Font.boldSystemFont(16);
    busNumberCell.textColor = Color.blue();

    // 显示三班车到达时间
    [service.NextBus, service.NextBus2, service.NextBus3]
      .map(formatArrivalTime)
      .forEach((text, index) => {
        const timeCell = row.addText(text);
        timeCell.widthWeight = 25;
        timeCell.font = Font.systemFont(14);
      });
    row.onSelect = async () => {
      await showBusFirstLastTimes(busstop, stopCode, service.ServiceNo);
    };

    table.addRow(row);
  }

  // 如果没有符合条件的巴士
  if (allowedBusCodes && !hasAllowedBus) {
    for (const busCode of allowedBusCodes) {
      const row = new UITableRow();
      const busNumberCell = row.addText(`🚌 ${busCode}`);
      busNumberCell.widthWeight = 20;
      busNumberCell.font = Font.boldSystemFont(16);
      busNumberCell.textColor = Color.blue();
      const noAllowedBusCell = row.addText("⚠️该站点未找到此巴士号码");
      noAllowedBusCell.widthWeight = 80;
      noAllowedBusCell.font = Font.systemFont(14);
      noAllowedBusCell.textColor = Color.red();

      table.addRow(row);
    }
  } else if (allowedBusCodes) {
    // 检查 allowedBusCodes 中未显示的巴士号码
    for (const busCode of allowedBusCodes) {
      if (!displayedBusCodes.has(busCode.trim())) {
        const row = new UITableRow();
        const busNumberCell = row.addText(`🚌 ${busCode}`);
        busNumberCell.widthWeight = 20;
        busNumberCell.font = Font.boldSystemFont(16);
        busNumberCell.textColor = Color.blue();
        const noAllowedBusCell = row.addText("⚠️该站点未找到此巴士号码");
        noAllowedBusCell.widthWeight = 80;
        noAllowedBusCell.font = Font.systemFont(14);
        noAllowedBusCell.textColor = Color.red();
        table.addRow(row);
      }
    }
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
  const busRoutes = readCache("busRoutes");
  const busStops = readCache("busStops");

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
    table.addRow(new UITableRow().addText("未找到该巴士的首末班车时间"));
    return;
  }

  let table = new UITable();
  table.showSeparators = true;

  const stopRow = new UITableRow();
  stopRow.addText(`站点: ${busstop} (${stopCode})`).widthWeight = 50;
  table.addRow(stopRow);

  const busRow = new UITableRow();
  busRow.addText(`巴士: ${busTimes.serviceNo}`).widthWeight = 50;
  table.addRow(busRow);

  [
    ["🗓️ 工作日", busTimes.weekday],
    ["🗓️ 星期六", busTimes.saturday],
    ["🗓️ 星期日", busTimes.sunday]
  ].forEach(([label, time]) => {
    const row = new UITableRow();
    row.addText(`${label}: ${time}`);
    table.addRow(row);
  });

  const separatorRow = new UITableRow();
  separatorRow.isHeader = true;
  separatorRow.addText("—— 巴士完整路线 ——").centerAligned();
  table.addRow(separatorRow);

  const headerRow = new UITableRow();
  headerRow.addText("站点代码").widthWeight = 30;
  headerRow.addText("站点名称").widthWeight = 70;
  table.addRow(headerRow);

  // **显示巴士路线**
  for (const route of busRoute) {
    const row = new UITableRow();

    let stopCodeCell = row.addText(route.busStopCode);
    row.onSelect = async () => {
      await createTable(route.busStopCode);
    };

    let stopNameCell = row.addText(route.stopName);

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

// 获取特定站点和巴士的到站信息
async function getArrivalInfoForStop(stopCode, busCodes) {
  const busArrivalInfo = [];

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

function getFormattedUpdateTime() {
  if (!fm.fileExists(updateTimeCachePath)) {
    return "未更新";
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
      return `${updateDate.getFullYear()}-${updateMonth}-${updateDay}`;
    }
  } catch (error) {
    console.error("Error reading update time:", error);
    return "时间格式错误";
  }
}

// 格式化到站时间
function formatArrivalTime(bus) {
  if (!bus?.EstimatedArrival) return "未发车";

  const arrival = new Date(bus.EstimatedArrival);
  const diff = Math.round((arrival - new Date()) / 60000);

  if (diff > 0) {
    return `${diff} 分钟`;
  } else if (diff >= -2) {
    return "Arrived";
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

  const title = titleStack.addText("🚌 巴士到站信息 ");
  title.font = Font.boldSystemFont(16);
  title.textColor = Color.white();

  const updateTime = titleStack.addText(`(${getCurrentTime()})`);
  updateTime.font = Font.systemFont(16);
  updateTime.textColor = Color.white();

  widget.addSpacer(5);

  for (const { busstop, stopCode, busCodes } of myBusCodes) {
    const stopArrivalInfo = await getStopArrivalInfo(stopCode);
    const stopTitle = widget.addText(`🚏${busstop} (${stopCode})`);
    stopTitle.font = Font.mediumSystemFont(14);
    stopTitle.textColor = Color.cyan();

    widget.addSpacer(1);

    if (stopArrivalInfo?.Services?.length) {
      for (const busCode of busCodes) {
        const service = stopArrivalInfo.Services.find(
          s => s.ServiceNo.trim() === busCode
        );

        const row = widget.addStack();
        row.layoutHorizontally();

        const busNumber = row.addText(`🚌${busCode}`);
        busNumber.font = Font.mediumSystemFont(14);
        busNumber.textColor = Color.white();
        row.addSpacer(25);

        if (service) {
          [service.NextBus, service.NextBus2, service.NextBus3]
            .map(formatArrivalTime)
            .forEach((text, i) => {
              if (i > 0) row.addSpacer(25);
              const timeText = row.addText(text);
              timeText.font = Font.systemFont(14);
              timeText.textColor = new Color("#FFD700");
            });
        } else {
          const noBusText = row.addText("⚠️该站点未找到此巴士号码");
          noBusText.font = Font.systemFont(14);
          noBusText.textColor = Color.red();
        }

        widget.addSpacer(1);
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

// 异步清除缓存的函数
async function clearCache() {
  const deletedFiles = [];

  for (const key in cachePaths) {
    const path = cachePaths[key];
    if (fm.fileExists(path)) {
      await fm.remove(path);
      const fileName = path.split("/").pop();
      console.log(`已删除缓存文件: ${fileName}`);
      deletedFiles.push(fileName);
      Safari.open("scriptable:///run?scriptName=");
    } else {
      console.log(`缓存文件不存在: ${path}`);
    }
  }

  console.log("缓存清除完成！");

  const alert = new Alert();
  alert.title = "缓存清除完成";
  if (deletedFiles.length > 0) {
    alert.message = `已清除以下缓存文件：\n${deletedFiles.join("\n")}\n点击确定退出！`;
  } else {
    alert.message = "没有缓存文件被清除。";
  }
  alert.addAction("确定");
  await alert.present();
}

async function promptUserForInput(type) {
  const alert = new Alert();
  alert.title = type === "stop" ? "搜索站点" : "搜索巴士";
  alert.addTextField(type === "stop" ? "站点代码" : "巴士号码", "");
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

if (config.runsInWidget) {
  await checkAndFetchData();
  let widget = await createWidget();
  Script.setWidget(widget);
} else {
  await CheckKu();
  const { installation } = importModule("Ku");
  await installation(this.widget_ID, this.version);
  let widget = await createWidget();

  // **运行Uitable**
  await createTable();
  table.present();
  // widget.presentLarge();
}
Script.complete();
