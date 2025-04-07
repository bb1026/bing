(async () => {// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: bus;
this.name = "附近的Bus SG";
this.widget_ID = "js-107";
this.version = "v1.5";

// 检查更新
await CheckKu();
const { installation } = importModule('Ku');
await installation(this.widget_ID, this.version);

/* 
以上为获取更新代码
以下开始运行代码
*/

// 提供的公交车号码数组
const myBusCodes = ['800', '804', '246', '249', '858'];

// 异步函数：获取指定站点的公交到站信息
async function getBusArrivalInfo(stopId) {
    const url = `https://transport.nestia.com/api/v4.5/stops/${stopId}/bus_arrival`;
    const request = new Request(url);
    const response = await request.loadJSON();
    return response;
}

// 异步函数：根据公交车编号获取公交信息
async function getBusInfoByCode(code) {
    const url = `https://transport.nestia.com/api/v4.5/search/bus?key=${code}`;
    const request = new Request(url);
    const response = await request.loadJSON();
    const busInfos = response.map(info => ({ id: info.id, name: info.name }));
    return busInfos;
}

// 异步函数：获取缓存的位置信息
async function getCachedLocation() {
    const filePath = FileManager.local().joinPath(FileManager.local().documentsDirectory(), "cachedLocation.json");
    if (FileManager.local().fileExists(filePath)) {
        const content = FileManager.local().readString(filePath);
        const cachedLocation = JSON.parse(content);
        const currentTime = new Date().getTime();
        // 每3分钟刷新定位
        if (currentTime - cachedLocation.timestamp < 3 * 60 * 1000) {
            return cachedLocation;
        }
    }
    return null;
}

// 缓存位置信息
function cacheLocation(latitude, longitude) {
    const cachedLocation = {
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date().getTime()
    };
    const filePath = FileManager.local().joinPath(FileManager.local().documentsDirectory(), "cachedLocation.json");
    FileManager.local().writeString(filePath, JSON.stringify(cachedLocation));
}

// 异步函数：获取当前位置信息
async function getCurrentLocation() {
    let cachedLocation = await getCachedLocation();

    if (cachedLocation) {
        return cachedLocation;
    } else {
        let location = await Location.current();
        let latitude = location.latitude;
        let longitude = location.longitude;

        cacheLocation(latitude, longitude);

        return { latitude, longitude };
    }
}

// 计算两个坐标之间的距离
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * (Math.PI / 180); // 转换为弧度
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // 距离单位为米
    return distance.toFixed(1); // 保留一位小数
}

// 异步函数：根据距离排序获取位置数据
async function getLocationData() {
    const cachedLocation = await getCurrentLocation();
    const url = `https://transport.nestia.com/api/v4.5/stops-for-sync?lat=${cachedLocation.latitude}&lng=${cachedLocation.longitude}`;
    const request = new Request(url);
    const response = await request.loadJSON();

    // 计算每个位置的距离
    const sortedLocations = response.map(({ name, address, code, lat, lng }) => {
        const distance = calculateDistance(cachedLocation.latitude, cachedLocation.longitude, lat, lng);
        return { name, address, code, lat, lng, distance };
    }).sort((a, b) => a.distance - b.distance); // 按距离排序

    // 返回两个最近的位置
    return sortedLocations.slice(0, 4);
}

// 获取位置数据
const locationData = await getLocationData();

// 异步函数：在应用内显示位置数据和公交信息
async function showLocationAndBusInfoInApp() {
    const locationData = await getLocationData();
    
    const table = new UITable();
    table.showSeparators = true;

    // 添加标题行
    let headerRow = new UITableRow;
        headerRow.isHeader = true;
    let headerCell = headerRow.addCell(UITableCell.text("Bus information  " + new Date().toLocaleTimeString()));
    table.addRow(headerRow);

    for (let location of locationData) {
        let locationRow = new UITableRow();
        locationRow.isHeader = true;
        locationRow.addCell(UITableCell.text(`${location.name}   ${location.code}  ${location.distance}m`));
        table.addRow(locationRow);

        const busInfos = await getBusInfoByCode(location.code);
        const busArrivalInfo = await getBusArrivalInfo(busInfos[0].id);

        // 置顶显示特定公交车号码
        let myBusArrivalInfo = [];
        for (let bus of busArrivalInfo) {
            if (myBusCodes.includes(bus.bus_code)) {
                myBusArrivalInfo.unshift(bus);
            } else {
                myBusArrivalInfo.push(bus);
            }
        }

        for (let bus of myBusArrivalInfo) {
            let busRow = new UITableRow();
            let busCodeText = `Bus: ${bus.bus_code}`;
           const busCell =  busRow.addText(busCodeText);
        if (myBusCodes.includes(bus.bus_code)) {
                busRow.backgroundColor = new Color("#87CEEB");
                                        busCell.titleColor = Color.white();
            }

            // 添加公交到站信息，如果状态不为1，则显示为“停运”
            let arrivalTimes = bus.arrivals.map(arrival => {
                let time;
                if (arrival.status !== 1) {
                    time = '停运';
                } else if (arrival.arrival_time === undefined || arrival.arrival_time < -600) {
                    time = '停运';
                } else if (arrival.arrival_time <= -1) {
                    time = '离开';
                } else if (arrival.arrival_time <= 20) {
                    time = '到达';
                } else {
                    time = (arrival.arrival_time / 60).toFixed(1) + '分';
                }
                return time;
            });
            
            const busTime1 = busRow.addText(arrivalTimes[0]);
            const busTime2 = busRow.addText(arrivalTimes[1]);
            
                    if (myBusCodes.includes(bus.bus_code)) {
                busRow.backgroundColor = new Color("#87CEEB");
                busCell.titleColor = Color.white();
                busTime1.titleColor = Color.white();
                busTime2.titleColor = Color.white();
                busCell.widthWeight = 30;
                busTime1.widthWeight = 35;
                busTime2.widthWeight = 35;
            }
            table.addRow(busRow);
        }
    }
    QuickLook.present(table);
}

async function CheckKu() {
  const notification = new Notification();
  const fm = FileManager.local();
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

// 在应用内显示位置数据和公交信息
showLocationAndBusInfoInApp();
})();