// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bus-alt;
this.name = "BusGo";
this.widget_ID = "js-109";
this.version = "v2.5";

let installation;
await CheckKu();
await installation(this.widget_ID, this.version);

const myBusCodes = [
  { busstop: "Yishun Int", stopCode: "59009", busCodes: [/*"804", */ "800"] },
  { busstop: "🏠Blk 236", stopCode: "59241", busCodes: ["804"] },
  { busstop: "Boon Lay Int", stopCode: "22009", busCodes: ["246", "249"] },
  {
    busstop: "❤️Bef Jln Tukang(To Lakeside)",
    stopCode: "21499",
    busCodes: ["246"]
  },
  {
    busstop: "⭐Bef Intl Rd(To Boon Lay)",
    stopCode: "21491",
    busCodes: ["246"]
  },
  { busstop: "UTOC ENGRG", stopCode: "21321", busCodes: ["249"] },
  { busstop: "Opp Yishun Stn", stopCode: "59073", busCodes: ["858"] }
];

const fm = FileManager.local();

const apiUrls = {
  busRoutes:
    "https://datamall2.mytransport.sg/ltaodataservice/BusRoutes?$skip=",
  busServices:
    "https://datamall2.mytransport.sg/ltaodataservice/BusServices?$skip=",
  busStops: "https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=",
  BusArrival:
    "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=",
  MrtUrl: "https://transport.nestia.com/api/v4.5/stations-for-sync?",
  TimetableUrl: "https://transport.nestia.com/api/v4.5/stations/"
};

const maxSkip = { busRoutes: 26000, busServices: 1000, busStops: 5500 };

const cachePaths = {
  busRoutes: fm.joinPath(fm.documentsDirectory(), "busRoutesCache.json"),
  busServices: fm.joinPath(fm.documentsDirectory(), "busServicesCache.json"),
  busStops: fm.joinPath(fm.documentsDirectory(), "busStopsCache.json"),
  mrtMap: fm.joinPath(fm.documentsDirectory(), "subway-map.json"),
  timeTable: fm.joinPath(fm.documentsDirectory(), "station-timetable.json")
};

async function checkAndFetchData(forceUpdate = false) {
  let tasksToUpdate = [];

  if (forceUpdate) {
    tasksToUpdate = Object.keys(cachePaths);
    console.log("⚠️ 强制更新模式：正在更新所有数据");
  } else {
    for (const key in cachePaths) {
      if (!fm.fileExists(cachePaths[key])) {
        console.log(`[${key}] 缓存不存在，需要更新`);
        tasksToUpdate.push(key);
      } else {
        console.log(`[${key}] 缓存有效`);
      }
    }
  }

  if (tasksToUpdate.length > 0) {
    await showLoadingAndFetchData(tasksToUpdate);
  }
}

const headers = {
  AccountKey: atob("WFhQZ2RyNVFTZGlGZUROaGdoR0dydz09"),
  Accept: "application/json"
};

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
    throw error;
  }
}

async function fetchAndCacheMrtMap() {
  const req = new Request(apiUrls.MrtUrl);
  try {
    const raw = await req.loadJSON();
    fm.writeString(cachePaths.mrtMap, JSON.stringify(raw));
  } catch (e) {
    console.error("下载 subway-map.json 失败：", e);
    throw e;
  }
}

function formatTimeStr(t) {
  if (!t || typeof t !== "string" || !t.includes(":")) return t;
  const [h, m] = t.split(":").map(n => n.trim());
  if (isNaN(h) || isNaN(m)) return t;
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

async function fetchAndCacheTimeTable() {
  try {
    const mrtMap = JSON.parse(fm.readString(cachePaths.mrtMap));
    const stations = [];
    for (const line of mrtMap) {
      if (Array.isArray(line.stations)) {
        stations.push(...line.stations);
      }
    }
    const uniqueStations = [];
    const seenIds = new Set();
    for (const station of stations) {
      if (!seenIds.has(station.id)) {
        seenIds.add(station.id);
        uniqueStations.push(station);
      }
    }

    let successCount = 0;
    const timetableCache = {};

    for (let i = 0; i < uniqueStations.length; i++) {
      const stationId = uniqueStations[i].id;
      const url = `${apiUrls.TimetableUrl}${stationId}`;
      const req = new Request(url);
      try {
        const stationData = await req.loadJSON();
        const firstTrainTimes = stationData.timetables.flatMap(t =>
          t.first.map(entry => ({
            time: formatTimeStr(entry.weekday),
            direction: entry.description,
            to: entry.to?.name || "未知"
          }))
        );
        const lastTrainTimes = stationData.timetables.flatMap(t =>
          t.last.map(entry => ({
            time: formatTimeStr(entry.weekday),
            direction: entry.description,
            to: entry.to?.name || "未知"
          }))
        );
        timetableCache[stationId] = { firstTrainTimes, lastTrainTimes };
        successCount++;

        if ((i + 1) % 10 === 0) {
          fm.writeString(cachePaths.timeTable, JSON.stringify(timetableCache));
          console.log(
            `写入进度：${i + 1}/${uniqueStations.length}，成功：${successCount}`
          );
        }
      } catch (e) {
        console.error(`站点 ${stationId} 时刻表获取失败: `, e);
        timetableCache[stationId] = {
          firstTrainTimes: [],
          lastTrainTimes: [],
          error: `获取失败: ${e.message}`
        };
      }
    }

    fm.writeString(cachePaths.timeTable, JSON.stringify(timetableCache));
    console.log(
      `时刻表下载完成，共${uniqueStations.length}个站点，成功${successCount}个`
    );

    if (successCount === 0) {
      throw new Error("所有站点时刻表下载失败");
    }

    return successCount;
  } catch (e) {
    throw e;
  }
}

const updateTimeCachePath = fm.joinPath(
  fm.documentsDirectory(),
  "updateTimeCache.json"
);

async function fetchAllData(tasks, onProgress) {
  try {
    const failedTasks = [];
    const partialSuccessTasks = [];

    const tasksToProcess = tasks === true ? Object.keys(cachePaths) : tasks;
    const total = tasksToProcess.length;

    for (let i = 0; i < total; i++) {
      const key = tasksToProcess[i];
      const current = i + 1;

      if (onProgress) {
        await onProgress(current, total, key);
      }

      try {
        if (key === "mrtMap") {
          await fetchAndCacheMrtMap();
        } else if (key === "timeTable") {
          await fetchAndCacheTimeTable();
        } else {
          await fetchAndCacheData(key);
        }
        console.log(`[${key}] 更新成功`);
      } catch (error) {
        console.error(`[${key}] 更新失败:`, error);
        failedTasks.push(key);
      }
    }

    if (failedTasks.length === 0) {
      console.log("全部数据更新成功");
      const now = new Date().toISOString();
      fm.writeString(updateTimeCachePath, JSON.stringify({ lastUpdate: now }));
    } else {
      throw new Error(`以下任务失败: ${failedTasks.join(", ")}`);
    }
  } catch (error) {
    throw error;
  }
}

function readCache(cacheKey) {
  if (!fm.fileExists(cachePaths[cacheKey]))
    throw new Error(`${cacheKey} 数据不存在`);
  return JSON.parse(fm.readString(cachePaths[cacheKey]));
}

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

function formatArrivalTime(busInfo) {
  if (!busInfo || !busInfo.EstimatedArrival) return "未发车";
  const diff = (new Date(busInfo.EstimatedArrival) - new Date()) / 1000;
  return diff < 60 ? "即将到站" : `${Math.ceil(diff / 60)}分钟`;
}

await checkAndFetchData(false);

let table = new UITable();
table.showSeparators = true;

const buttonText = `🗂️ 数据更新: ${getFormattedUpdateTime()}`;
const buttonText2 = "🗑️ 清除缓存";
const buttonText3 = "🔄 刷新";
const buttonText4 = "🛰️ 附近站点";
const buttonText5 = "🚏 搜索站点";
const buttonText6 = "🚌 搜索巴士";
const buttonText7 = "💟 收藏";
const buttonText8 = "MRT站点";

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

const MRTRow = new UITableRow();
const MRTMap = MRTRow.addButton(buttonText8);
MRTMap.centerAligned();

const backRow = new UITableRow();
const backtext = backRow.addText("退出");
backtext.titleColor = Color.red();
backtext.centerAligned();
backRow.onSelect = async () => {
  return;
};

async function initializeTable() {
  try {
    table.removeAllRows();
    table.addRow(UpdateCleanRow);
    table.addRow(buttonRow);
    table.addRow(MRTRow);
  } catch (error) {
    console.error("初始化表格时出错:", error);
    table.addRow(new UITableRow().addText("初始化表格时出错"));
  }
}

function addTableHeader(busCode) {
  if (!busCode) {
    const timeRow = new UITableRow();
    timeRow.height = 20;
    const timeCell = timeRow.addText(new Date().toLocaleString());
    timeCell.titleColor = Color.green();
    timeCell.centerAligned();
    table.addRow(timeRow);
    const headerRow = new UITableRow();
    ["巴士", "第一班", "第二班", "第三班"].forEach(
      text => (headerRow.addText(text).widthWeight = 25)
    );
    table.addRow(headerRow);
  }
}

async function addNearestStops(latitude, longitude, busStops) {
  const nearestStops = getNearestBusStops(latitude, longitude, busStops);
  if (nearestStops.length) {
    for (const stop of nearestStops) {
      const stopRow = new UITableRow();
      stopRow.isHeader = true;
      stopRow.addText(
        `🚏 ${stop.Description} (${stop.BusStopCode}) - ${(
          stop.distance * 1000
        ).toFixed(2)} m`
      );
      stopRow.onSelect = async () => {
        await createTable(stop.BusStopCode);
        table.present(true);
      };
      table.addRow(stopRow);
      await addBusArrivalRows(table, null, stop.BusStopCode, null);
    }
  } else {
    table.addRow(new UITableRow().addText("未找到附近站点"));
  }
}

async function addStopInfo(stopCode, busStops) {
  const stopInfo = busStops.find(stop => stop.BusStopCode === stopCode);
  if (stopInfo) {
    const stopRow = new UITableRow();
    stopRow.isHeader = true;
    stopRow.addText(`🚏 ${stopInfo.Description} (${stopInfo.BusStopCode})`);
    table.addRow(stopRow);
    await addBusArrivalRows(table, stopInfo.Description, stopCode, null);
  } else {
    table.addRow(new UITableRow().addText("未找到该站点"));
  }
}

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
        table.present(true);
      };

      table.addRow(row);
    }
  } else {
    table.addRow(new UITableRow().addText("未找到该巴士的路线信息"));
  }
}

async function addMyBusCodes(myBusCodes, busStops) {
  for (const { busstop, stopCode, busCodes } of myBusCodes) {
    const stopInfo = busStops.find(stop => stop.BusStopCode === stopCode);
    if (!stopInfo) continue;

    const stopRow = new UITableRow();
    stopRow.isHeader = true;
    stopRow.addText(`🚏 ${busstop} (${stopCode})`);
    stopRow.onSelect = async () => {
      await createTable(stopCode);
      table.present(true);
    };
    table.addRow(stopRow);

    await addBusArrivalRows(table, busstop, stopCode, busCodes);
  }
}

async function showMRTLines() {
  const raw = readCache("mrtMap");

  const lineMap = {};
  const lineList = [];

  for (const line of raw) {
    if (!lineMap[line.name]) {
      lineMap[line.name] = {
        name: line.name,
        short: line.line_short_name,
        code: line.code,
        color: line.color,
        stations: []
      };
      lineList.push(line.name);
    }

    const seen = new Set();
    for (const station of line.stations) {
      if (!seen.has(station.id)) {
        seen.add(station.id);
        lineMap[line.name].stations.push(station);
      }
    }
  }

  async function fetchTimetable(stationId) {
    let timetableCache = {};
    try {
      timetableCache = readCache("timeTable");
    } catch (e) {
      console.warn("读取缓存失败，未找到时刻表数据");
      return { firstTrainTimes: [], lastTrainTimes: [] };
    }

    if (!timetableCache[stationId]) {
      console.warn(`站点 ${stationId} 无缓存数据`);
      return { firstTrainTimes: [], lastTrainTimes: [] };
    }

    const { firstTrainTimes, lastTrainTimes } = timetableCache[stationId];
    const result = { firstTrainTimes, lastTrainTimes };
    return result;
  }

  const lineListHtml = [
    `<div class="line" onclick="showMap()" id="map-line">
    <span class="dot" style="background-color: #007AFF;"></span>
    <span class="line-name" id="map-line-name">查看地图 🗺️</span>
  </div>`,
    ...lineList.map((name, index) => {
      const line = lineMap[name];
      return `
      <div class="line" onclick="toggleStations(${index})" id="line-${index}">
        <span class="dot" style="background-color: ${line.color}"></span>
        <span class="line-name" id="line-name-${index}">${line.name}</span>
        <span class="toggle-btn" id="toggle-btn-${index}">＋</span>
      </div>
    `;
    })
  ].join("\n");

  const allStationHtmlArray = await Promise.all(
    lineList.map(async (name, index) => {
      const line = lineMap[name];
      const stationHtml = await Promise.all(
        line.stations.map(async station => {
          const timetable = await fetchTimetable(station.id);

          const firstTrainDetails =
            timetable.firstTrainTimes.length > 0
              ? `
    <div class="train-header">
      <div class="train-title">首班车</div>
      <div class="train-columns-container">
        <div class="train-columns">
          <div class="train-column train-time-column">时间</div>
          <div class="train-column train-direction-column">方向</div>
          <div class="train-column train-destination-column">终点站</div>
        </div>
      </div>
      <div class="train-rows-container">
        ${timetable.firstTrainTimes
          .map(train => {
            const directionParts = train.direction.split("(");
            const formattedDirection =
              directionParts.length > 1
                ? `${directionParts[0]}<br>(${directionParts
                    .slice(1)
                    .join("(")}`
                : train.direction;
            return `
          <div class="train-row">
            <div class="train-cell train-time-cell">${train.time}</div>
            <div class="train-cell train-direction-cell">${formattedDirection}</div>
            <div class="train-cell train-destination-cell">${train.to}</div>
          </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `
              : `<div class="train-header no-train-info">无首班车信息</div>`;

          const lastTrainDetails =
            timetable.lastTrainTimes.length > 0
              ? `
    <div class="train-header">
      <div class="train-title">末班车</div>
      <div class="train-columns-container">
        <div class="train-columns">
          <div class="train-column train-time-column">时间</div>
          <div class="train-column train-direction-column">方向</div>
          <div class="train-column train-destination-column">终点站</div>
        </div>
      </div>
      <div class="train-rows-container">
        ${timetable.lastTrainTimes
          .map(train => {
            const directionParts = train.direction.split("(");
            const formattedDirection =
              directionParts.length > 1
                ? `${directionParts[0]}<br>(${directionParts
                    .slice(1)
                    .join("(")}`
                : train.direction;
            return `
          <div class="train-row">
            <div class="train-cell train-time-cell">${train.time}</div>
            <div class="train-cell train-direction-cell">${formattedDirection}</div>
            <div class="train-cell train-destination-cell">${train.to}</div>
          </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `
              : `<div class="train-header no-train-info">无末班车信息</div>`;

          const primaryCode = station.line_codes.find(
            c => c.name === line.name
          );
          const otherCodes = station.line_codes.filter(
            c => c.name !== line.name
          );

          const dotsWithCodes = [
            `<span class="dot" style="background-color: ${primaryCode.color}"></span><span class="dot-code">${primaryCode.code}</span>`,
            ...otherCodes.map(
              code =>
                `<span class="dot" style="background-color: ${code.color}"></span><span class="dot-code">${code.code}</span>`
            )
          ].join("");

          return `
      <div class="station" onclick="toggleStationTime('${station.id}', this)">
        ${dotsWithCodes}
        <span class="station-name">${station.name}</span>
        ${firstTrainDetails}
        ${lastTrainDetails}
      </div>`;
        })
      );
      return `<div class="station-list" id="station-list-${index}" style="display: none">${stationHtml.join(
        "\n"
      )}</div>`;
    })
  );

  const allStationHtml = allStationHtmlArray.join("\n");

  const mainHtml = `
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    :root {
      --bg-color: white;
      --text-color: black;
      --line-bg: white;
      --station-bg: white;
      --border-color: #eee;
      --secondary-text: #555;
      --progress-bg: #f3f3f3;
      --header-bg: white;
      --train-row-bg: white;
      --train-row-border: #f5f5f5;
      --toggle-btn-bg: green;
      --toggle-btn-active-bg: red;
      --map-bg: rgba(0, 0, 0, 0.5);
    }
    
    .dark-mode {
      --bg-color: #121212;
      --text-color: #e0e0e0;
      --line-bg: #1e1e1e;
      --station-bg: #1e1e1e;
      --border-color: #333;
      --secondary-text: #aaa;
      --progress-bg: #333;
      --header-bg: #1e1e1e;
      --train-row-bg: #2d2d2d;
      --train-row-border: #333;
      --toggle-btn-bg: #2e7d32;
      --toggle-btn-active-bg: #c62828;
      --map-bg: rgba(0, 0, 0, 0.8);
    }
    
    body {
      font-family: -apple-system;
      background-color: var(--bg-color);
      color: var(--text-color);
      padding: 10px;
    }
    .train-direction-cell {
    white-space: pre-line;
    }
    #lines {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: var(--header-bg);
      padding-bottom: 10px;
    }
    .line, .station {
      padding: 10px;
      border-bottom: 1px solid var(--border-color);
      font-size: 17px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      background-color: var(--line-bg);
    }
    .dot {
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 7px;
      margin-right: 4px;
    }
    .dot-code {
      font-size: 13px;
      margin-right: 8px;
      color: var(--secondary-text);
    }
    .station-name {
      margin-left: auto;
      color: var(--text-color);
    }
    .train-time {
      font-size: 14px;
      color: var(--secondary-text);
      width: 100%;
      margin-top: 4px;
    }
    .line-name.bold {
      font-weight: bold;
    }
    .toggle-btn {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background-color: var(--toggle-btn-bg);
      color: white !important;
      font-size: 24px;
      line-height: 24px;
      text-align: center;
      font-weight: bold;
      display: inline-block;
      margin-left: auto;
      user-select: none;
    }
    .toggle-btn.active {
      background-color: var(--toggle-btn-active-bg);
    }
    .train-header {
      display: none;
      width: 100%;
      box-sizing: border-box;
      margin-top: 10px;
      font-size: 14px;
      background-color: var(--station-bg);
    }
    .train-title {
      text-align: center;
      font-weight: bold;
      margin: 8px 0;
      width: 100%;
      font-size: 14px;
      color: var(--text-color);
    }
    .train-columns-container {
      display: table;
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    .train-columns {
      display: table-row;
    }
    .train-column {
      display: table-cell;
      text-align: left;
      font-weight: bold;
      padding: 4px 8px;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-color);
    }
    .train-time-column {
      width: 15%;
    }
    .train-direction-column {
      width: 45%;
    }
    .train-destination-column {
      width: 40%;
    }
    .train-rows-container {
      display: table;
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    .train-row {
      display: table-row;
      background-color: var(--train-row-bg);
    }
    .train-cell {
      display: table-cell;
      text-align: left;
      padding: 4px 8px;
      border-bottom: 1px solid var(--train-row-border);
      font-size: 12px;
      color: var(--text-color);
    }
    .train-time-cell {
      width: 15%;
    }
    .train-direction-cell {
      width: 45%;
    }
    .train-destination-cell {
      width: 40%;
    }
    .no-train-info {
      text-align: center;
      color: var(--secondary-text);
      padding: 8px 0;
      font-style: italic;
      font-size: 12px;
    }
    .theme-switch {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 25px;
      background-color: var(--toggle-btn-bg);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      cursor: pointer;
      z-index: 1001;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    #map-container {
      background-color: var(--map-bg);
    }
  </style>
</head>
<body>
  <h2>选择地铁线路</h2>
  <div id="lines">
    ${lineListHtml}
  </div>
  <div id="stations">
    ${allStationHtml}
  </div>
  <div class="theme-switch" onclick="toggleTheme()" id="theme-switch">🌙</div>

  <script>
    let activeIndex = null;
    let isDarkMode = false;
    
    function toggleTheme() {
      isDarkMode = !isDarkMode;
      document.body.classList.toggle('dark-mode', isDarkMode);
      document.getElementById('theme-switch').textContent = isDarkMode ? '☀️' : '🌙';
    }
    
    // 初始化时检查保存的主题偏好
    function initTheme() {
      if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-switch').textContent = '☀️';
      }
    }
    
    initTheme();

    function toggleStations(index) {
  const total = ${lineList.length}
  for (let i = 0; i < total; i++) {
    const lineElem = document.getElementById("line-" + i)
    const nameElem = document.getElementById("line-name-" + i)
    const stationElem = document.getElementById("station-list-" + i)
    const toggleBtn = document.getElementById("toggle-btn-" + i)
    if (activeIndex === index) {
      lineElem.style.display = "flex"
      stationElem.style.display = "none"
      nameElem.classList.remove("bold")
      toggleBtn.classList.remove("active")
      toggleBtn.textContent = "＋"
    } else if (i === index) {
      lineElem.style.display = "flex"
      stationElem.style.display = "block"
      nameElem.classList.add("bold")
      toggleBtn.classList.add("active")
      toggleBtn.textContent = "－"
    } else {
      lineElem.style.display = "none"
      stationElem.style.display = "none"
      nameElem.classList.remove("bold")
      toggleBtn.classList.remove("active")
      toggleBtn.textContent = "＋"
    }
  }
  activeIndex = (activeIndex === index) ? null : index
}

    function toggleStationTime(stationId, element) {
  const headers = element.querySelectorAll('.train-header');
  if (headers.length === 0) return;

  const isVisible = headers[0].style.display === 'block';
  headers.forEach(h => {
    h.style.display = isVisible ? 'none' : 'block';
  });
}

  function showMap() {
  const metaTag = document.querySelector('meta[name="viewport"]');
  const originalMetaContent = metaTag.getAttribute('content');
  metaTag.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes');

    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-container';
    mapContainer.style.position = 'fixed';
    mapContainer.style.top = '0';
    mapContainer.style.left = '0';
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    mapContainer.style.backgroundColor = 'var(--map-bg)';
    mapContainer.style.zIndex = '9999';

    mapContainer.style.backgroundImage = 'url("https://raw.githubusercontent.com/bb1026/bing/main/imgs/mrt-map.png")';
    mapContainer.style.backgroundSize = 'contain';
    mapContainer.style.backgroundPosition = 'center';
    mapContainer.style.backgroundRepeat = 'no-repeat';

    const closeButton = document.createElement('button');
    closeButton.innerText = '关闭';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '20px';
    closeButton.style.right = '20px';
    closeButton.style.fontSize = '16px';
    closeButton.style.padding = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.backgroundColor = '#fff';
closeButton.style.border = '1px solid #ccc';
closeButton.style.borderRadius = '6px';
    closeButton.onclick = function() {
    document.body.removeChild(mapContainer);
    metaTag.setAttribute('content', originalMetaContent);
  };

    mapContainer.appendChild(closeButton);
    document.body.appendChild(mapContainer);
  };
  </script>
</body>
</html>
`;

  const wv = new WebView();
  await wv.loadHTML(mainHtml);
  await wv.present(true);
}

let currentStopCode = null;
let currentBusCode = null;
let currentUseLocation = false;

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
    table.addRow(backRow);
    table.reload();
  } catch (error) {
    console.error("创建表格时出错:", error);
    table.addRow(new UITableRow().addText("创建表格时出错"));
  }
}

refreshButton.onTap = async () => {
  await createTable(currentStopCode, currentBusCode, currentUseLocation);
};

updatebutton.onTap = async () => {
  await showLoadingAndFetchData(true, async () => {
    await createTable(currentStopCode, currentBusCode, currentUseLocation);
  });
};

cleanbutton.onTap = async () => {
  await clearCache();
};

nearbyButton.onTap = async () => {
  try {
    const loc = await Location.current();
    console.log(loc);
    await createTable(null, null, loc);
  } catch (error) {
    console.error(`定位失败: ${error}`);
    let failAlert = new Alert();
    failAlert.title = Script.name();
    failAlert.message = `定位失败: ${error}: \n请稍候再试！`;
    failAlert.addCancelAction("取消");
    const response = await failAlert.presentAlert();
  }
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

MRTMap.onTap = async () => {
  await showMRTLines();
};

async function showLoadingAndFetchData(tasksToUpdate, afterSuccess) {
  const loadingView = new WebView();
  await loadingView.loadHTML(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <style>
      :root {
          --bg-color: white;
          --text-color: #555;
          --spinner-border: #f3f3f3;
          --spinner-top: #3498db;
          --progress-bg: #f3f3f3;
          --progress-bar: #4CAF50;
          --error-color: red;
        }
        
        .dark-mode {
          --bg-color: #121212;
          --text-color: #e0e0e0;
          --spinner-border: #333;
          --spinner-top: #3498db;
          --progress-bg: #333;
          --progress-bar: #4CAF50;
          --error-color: #ff5252;
        }
        
        body {
          font-family: -apple-system;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          flex-direction: column;
          background-color: var(--bg-color);
        }
        .spinner {
          border: 8px solid var(--spinner-border);
          border-top: 8px solid var(--spinner-top);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .text {
          margin-top: 20px;
          font-size: 18px;
          color: var(--text-color);
          text-align: center;
          padding: 0 20px;
        }
        .progress {
          width: 80%;
          margin-top: 20px;
          background-color: var(--progress-bg);
          border-radius: 5px;
          overflow: hidden;
        }
        .progress-bar {
          height: 10px;
          background-color: var(--progress-bar);
          width: 0%;
          transition: width 0.3s;
        }
        .error {
          color: var(--error-color);
          margin-top: 20px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <div class="text" id="loading-text">正在准备下载数据...</div>
      <div class="progress">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
      <div class="error" id="error-message"></div>
    </body>
    </html>
  `);

  const presentPromise = loadingView.present(true);

  try {
    await loadingView.evaluateJavaScript(`
      document.getElementById('loading-text').textContent = '正在下载数据...';
      document.getElementById('progress-bar').style.width = '0%';
      document.getElementById('error-message').style.display = 'none';
    `);

    await fetchAllData(tasksToUpdate, async (current, total, name) => {
      const progress = Math.round((current / total) * 100);
      const text = `正在下载 ${name} (${current}/${total})`;

      await loadingView.evaluateJavaScript(`
        document.getElementById('loading-text').textContent = ${JSON.stringify(
          text
        )};
        document.getElementById('progress-bar').style.width = '${progress}%';
      `);
    });

    await loadingView.evaluateJavaScript(`
      document.querySelector('.spinner').outerHTML = '<div style="font-size: 60px; color: #4CAF50;">✓</div>';
      document.getElementById('loading-text').textContent = '数据下载成功！请关闭此界面...';
      document.getElementById('progress-bar').style.width = '100%';
      document.getElementById('progress-bar').style.backgroundColor = '#4CAF50';
    `);

    const now = new Date().toISOString();
    fm.writeString(updateTimeCachePath, JSON.stringify({ lastUpdate: now }));
  } catch (error) {
    console.error("下载过程中出错:", error);
    await loadingView.evaluateJavaScript(`
      document.querySelector('.spinner').outerHTML = '<div style="font-size: 60px; color: red;">✗</div>';
      document.getElementById('loading-text').textContent = '数据下载失败';
      document.getElementById('progress-bar').style.backgroundColor = 'red';
      document.getElementById('error-message').textContent = ${JSON.stringify(
        error.message
      )};
      document.getElementById('error-message').style.display = 'block';
    `);
    throw error;
  }

  await presentPromise;

  if (typeof afterSuccess === "function") {
    await afterSuccess();
  }
}

async function addBusArrivalRows(
  table,
  busstop,
  stopCode,
  allowedBusCodes = null
) {
  const stopArrivalInfo = await getStopArrivalInfo(stopCode);

  let hasAllowedBus = false;
  const displayedBusCodes = new Set();

  for (const service of stopArrivalInfo.Services) {
    if (
      allowedBusCodes &&
      !allowedBusCodes.includes(service.ServiceNo.trim())
    ) {
      continue;
    }

    hasAllowedBus = true;
    displayedBusCodes.add(service.ServiceNo.trim());

    const row = new UITableRow();

    const busNumberCell = row.addText(`🚌 ${service.ServiceNo.trim()}`);
    busNumberCell.widthWeight = 25;
    busNumberCell.font = Font.boldSystemFont(16);

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

  if (allowedBusCodes && !hasAllowedBus) {
    for (const busCode of allowedBusCodes) {
      const row = new UITableRow();
      const busNumberCell = row.addText(`🚌 ${busCode}`);
      busNumberCell.widthWeight = 20;
      busNumberCell.font = Font.boldSystemFont(16);
      const noAllowedBusCell = row.addText("⚠️无时间信息");
      noAllowedBusCell.widthWeight = 80;
      noAllowedBusCell.font = Font.systemFont(14);

      table.addRow(row);
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

  for (const route of busRoute) {
    const row = new UITableRow();

    row.onSelect = async () => {
      await createTable(route.busStopCode);
    };

    let stopCodeCell = row.addText(route.busStopCode);
    let stopNameCell = row.addText(route.stopName);

    stopCodeCell.widthWeight = 30;
    stopNameCell.widthWeight = 70;

    if (route.busStopCode === stopCode) {
      stopCodeCell.titleFont = Font.boldSystemFont(17);
      stopNameCell.titleFont = Font.boldSystemFont(17);
      stopCodeCell.titleColor = Color.blue();
      stopNameCell.titleColor = Color.blue();
    }
    table.addRow(row);
  }
  table.addRow(backRow);
  table.present(true);
}

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

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

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

    if (stopArrivalInfo?.Services) {
      for (const busCode of busCodes) {
        const service = stopArrivalInfo.Services.find(
          s => s.ServiceNo.trim() === busCode
        );

        const row = widget.addStack();
        row.layoutHorizontally();

        const busNumber = row.addText(`${busCode}`);
        busNumber.font = Font.mediumSystemFont(14);
        busNumber.textColor = Color.white();
        row.addSpacer(25);

        if (service) {
          [service.NextBus, service.NextBus2, service.NextBus3]
            .map(formatArrivalTime)
            .forEach((text, i) => {
              if (i > 0) row.addSpacer(30);
              const timeText = row.addText(text);
              timeText.font = Font.systemFont(14);
              timeText.textColor = new Color("#FFD700");
            });
        } else {
          const noBusText = row.addText(`⚠️无时间信息`);
          noBusText.font = Font.systemFont(14);
          noBusText.textColor = new Color("#cccccc");
        }
      }
    }
    widget.addSpacer();
  }
  return widget;
}

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
    alert.message = `已清除以下缓存文件：\n${deletedFiles.join(
      "\n"
    )}\n点击确定退出！`;
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

if (config.runsInWidget) {
  await checkAndFetchData(false);
  let widget = await createWidget();
  Script.setWidget(widget);
} else {
  let widget = await createWidget();
  //  widget.presentLarge();

  await createTable();
  table.present(true);

  const timer = new Timer();
  timer.repeats = true;
  timer.timeInterval = 10000;
  timer.schedule(() => {
    createTable(currentStopCode, currentBusCode, currentUseLocation);
  });
}
Script.complete();
