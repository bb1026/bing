this.name = "Singapore Bus";
this.widget_ID = "js_103";
this.version = "v1.0"; 

const w = new ListWidget();

let date = new Date();
let y = date.getFullYear();
let m = ("0" + (date.getMonth() + 1)).slice(-2);
let d = ("0" + date.getDate()).slice(-2);
let minute = ("0" + date.getMinutes()).slice(-2);
let hour = ("0" + date.getHours()).slice(-2);
let second = ("0" + date.getSeconds()).slice(-2);
const refreshtime = y + "-" + m + "-" + d + " " + hour + ":" + minute + ":" + second;

// 字体颜色和大小
const zitisize = Font.systemFont(15);

//小组件
const sg = w.addText("Singapore Bus");
sg.centerAlignText();
// sg.textColor = Color.magenta();
sg.font = Font.boldMonospacedSystemFont(20);
let rt = w.addText(refreshtime);
rt.centerAlignText();
rt.font = Font.systemFont(15);
w.addSpacer(5);

// 加载Bus数据
const idurl = "https://transport.nestia.com/api/v4.5/search/bus?key=";
const busurl = "https://transport.nestia.com/api/v4.5/stops/";

const busarr = new Array(
  ["59009", 800, 804], //YiShun Int
  ["59241", 804], //Bus804 Blk236
  ["22009", 246, 249], //BoonLay Int
  ["21499", 246], //Bus246 TKukang to lakeside
  ["21491", 246], //Bus246 Tukang to boonlay
  ["21321", 249],
  ["59073", 858]
);

// 加载Bus
for (let i in busarr) {
  async function busidget() {
    let req = new Request(idurl + busarr[i][0]);
    let results = await req.loadJSON();
    return results;
  }
  const Reqdata = await busidget(idurl + busarr[i][0]);
  const station_id = Reqdata[0].id;
  const station_code = Reqdata[0].code;
  const station_name = Reqdata[0].name;

  //添加小组件
  const carton = w.addStack();
  var cartonstation = carton.addStack();
  const stop = cartonstation.addText(
    "Station: " + station_name + " " + station_code
  );
  stop.font = Font.boldMonospacedSystemFont(15);

  // id获取
  async function busarrget() {
    let req = new Request(busurl + station_id + "/bus_arrival");
    let results = await req.loadJSON();
    return results;
  }
  const bustime = await busarrget(busurl + station_id);

  for (let o = 0; o < bustime.length; o++) {
    for (let p = o + 1; p < bustime.length; p++) {
      if (bustime[o].bus_code === bustime[p].bus_code) {
        bustime.splice(p, 1);
      } else {
        p++;
      }
    }
  }

  for (x = 0; x < bustime.length; x++) {
    var bus_code = bustime[x].bus_code;
    var bus_stopname = bustime[x].bus.end_stop.name;

    for (let c in busarr[i]) {
      if (bus_code == busarr[i][c]) {
        const arrival = bustime[x].arrivals;
        if (arrival == undefined) {
          var busFirst = "已停运";
        } else {
          let bus1time = arrival[0];
          console.log(bus1time.arrival_time);
          if (bus1time.status != 1 || bus1time.arrival_time < -1800) {
            var busFirst = "已停运";
          } else {
            if (bus1time.arrival_time <= 0) {
              var busFirst = "Arrived";
            } else {
              var busFirst = (bus1time.arrival_time / 60).toFixed(1) + "分钟";
            }
          }
          if (arrival[1] == undefined) {
            var busSecond = "已停运";
          } else {
            let bus2time = arrival[1];
            if (bus2time.status != 1 || bus2time.arrival_time < -1800) {
              var busSecond = "已停运";
            } else {
              if (bus2time.arrival_time <= 0) {
                var busSecond = "Arrived";
              } else {
                var busSecond =
                  (bus2time.arrival_time / 60).toFixed(1) + "分钟";
              }
            }
          }
        }

        //添加bus小组件
        const cartonbus = w.addStack();
        const cartonbuscode = cartonbus.addStack();
        const cartonbus1 = cartonbus.addStack();
        cartonbus1.setPadding(0, 15, 0, 0);
        const cartonbus2 = cartonbus.addStack();
        cartonbus2.setPadding(0, 15, 0, 0);
        const busst = cartonbuscode.addText("Bus: " + bus_code);
        busst.font = zitisize;
        const bus1st = cartonbus1.addText("First: " + busFirst);
        bus1st.font = zitisize;
        const bus2st = cartonbus2.addText("Second: " + busSecond);
        bus2st.font = zitisize;
      }
    }
  }
}
w.addSpacer();

if (config.runsInApp) {
  await w.presentLarge();
}

Script.setWidget(w);
Script.complete();
