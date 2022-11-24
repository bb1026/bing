/**
* Author:兵兵
* Date:2022-11-24
*/
// @导入数据

const w = new ListWidget()

const idurl = "https://transport.nestia.com/api/v4.5/search/bus?key="
const busurl = "https://transport.nestia.com/api/v4.5/stops/"

const busa = idurl + 59241 //Bus804 Blk236
const busb = idurl + 21491 //Bus246 TK Bl
const busc = idurl + 21499 //bus246 TK LS
const busd = idurl + 59009 //YiShun Int 
const buse = idurl + 22009 //BoonLay Int

//背景颜色渐变色
const bgColor = new LinearGradient();
bgColor.locations = [0, 1];
bgColor.colors = [
    new Color("#EAE5C9"),
    new Color("#00ff00")
];
// w.backgroundGradient = bgColor;

// 背景图片随机图片
const bb1026 = "https://bb1026.github.io/bing/imgs/bgimage"
let img_url_arr = [
    bb1026 + "1.jpg",
    bb1026 + "2.jpg",
    bb1026 + "3.jpg",
    bb1026 + "4.jpg",
//     bb1026 + "5.jpg",
//     bb1026 + "6.jpg",
//     bb1026 + "7.jpg",
    bb1026 + "8.jpg",
//     bb1026 + "9.jpg",
//     bb1026 + "10.jpg",
//     bb1026 + "11.jpg",
//     bb1026 + "12.jpg",
//     bb1026 + "13.jpg",
    bb1026 + "14.jpg",
    bb1026 + "15.jpg"
]
const index = parseInt(Math.random() * img_url_arr.length)
let img_url = img_url_arr[index]
const req = new Request(img_url)
let image = await req.loadImage()
w.backgroundImage = image

//字体颜色和大小
const stcolor = Color.cyan()
const buscolor =new Color("#00ff00")
const zitisize = Font.systemFont(15)
const ziticolor = Color.white()

// 加载Busa
async function busaidurlget() {
  let req = new Request(busa);
  let results = await req.loadJSON()
  return results;
}
const busareq = await busaidurlget(busa);
const a = busareq[0]
async function busaurlget() {
  let req = new Request(busurl + a.id + "/bus_arrival");
  let results = await req.loadJSON()
  return results;
}
const busatime = await busaurlget(busurl + a.id)
const aa = busatime[1]
const busa1 = aa.arrivals[0]
if (busa1 == undefined){
    var busaFirst = "已停运"
} else {
if (busa1.status != 1){
  var busaFirst = "已停运"
} else {
  if (busa1.arrival_time <= 0){
    var busaFirst = "Arrived"
  } else {
  var busaFirst = (busa1.arrival_time / 60).toFixed(1) + "分钟"
  }
 }
}
const busa2 = aa.arrivals[1]
if (busa2 == undefined){
    var busaSecond = "已停运"
} else {
if (busa2.status != 1){
  var busaSecond = "已停运"
} else {
  if (busa2.arrival_time <= 0){
    var busaSecond = "Arrived"
  } else {
  var busaSecond = (busa2.arrival_time / 60). toFixed(1) + "分钟"
  }
 }
}

// 加载Busb
async function busbidurlget() {
  let req = new Request(busb);
  let results = await req.loadJSON()
  return results;
}
const busbreq = await busbidurlget(busb);
const b = busbreq[0]
async function busburlget() {
  let req = new Request(busurl + b.id + "/bus_arrival");
  let results = await req.loadJSON()
  return results;
}
const busbtime = await busburlget(busurl + b.id)
const bb = busbtime[0]

const busb1 = bb.arrivals[0]
if (busb1 == undefined){
    var busbFirst ="已停运"
} else {
if (busb1.status != 1){
  var busbFirst = "已停运"
} else {
  if (busb1.arrival_time <= 0){
    var busbFirst = "Arrived"
  } else {
  var busbFirst = (busb1.arrival_time / 60).toFixed(1) + "分钟"
  }
 }
}

const busb2 = bb.arrivals[1]
if (busb2 == undefined){
    var busbSecond = "已停运"
} else {
if (busb2.status != 1){
  var busbSecond = "已停运"
} else {
  if (busb2.arrival_time <= 0){
    var busbSecond = "Arrived"
  } else {
  var busbSecond = (busb2.arrival_time / 60). toFixed(1) + "分钟"
  }
 }
}

// 加载Busc
async function buscidurlget() {
  let req = new Request(busc);
  let results = await req.loadJSON()
  return results;
}
const buscreq = await buscidurlget(busc);
const c = buscreq[0]
async function buscurlget() {
  let req = new Request(busurl + c.id + "/bus_arrival");
  let results = await req.loadJSON()
  return results;
}
const busctime = await buscurlget(busurl + c.id)
const cc = busctime[0]

const busc1 = cc.arrivals[0]
if (busc1 == undefined){
    var buscFirst = "已停运"
} else {
if (busc1.status != 1){
  var buscFirst = "已停运"
} else {
  if (busc1.arrival_time <= 0){
    var buscFirst = "Arrived"
  } else {
  var buscFirst = (busc1.arrival_time / 60).toFixed(1) + "分钟"
  }
 }
}

const busc2 = cc.arrivals[1]
if (busc2 == undefined){
    var buscSecond = "已停运"
} else {
    if (busc2.status != 1){
  var buscSecond = "已停运"
} else {
  if (busc2.arrival_time <= 0){
    var buscSecond = "Arrived"
  } else {
  var buscSecond = (busc2.arrival_time / 60). toFixed(1) + "分钟"
  }
 }
}

// 加载Busd
//bus 800
async function busdidurlget() {
  let req = new Request(busd);
  let results = await req.loadJSON()
  return results;
}
const busdreq = await busdidurlget(busd);
const d = busdreq[0]
async function busdurlget() {
  let req = new Request(busurl + d.id + "/bus_arrival");
  let results = await req.loadJSON()
  return results;
}
const busdtime = await busdurlget(busurl + d.id)
const dd = busdtime[9]//9 15
const busd1 = dd.arrivals[0]
if (busd1 == undefined){
    var busdFirst = "已停运"
} else {
if (busd1.status != 1){
  var busdFirst = "已停运"
} else {
  if (busd1.arrival_time <= 0){
    var busdFirst = "Arrived"
  } else {
  var busdFirst = (busd1.arrival_time / 60).toFixed(1) + "分钟"
  }
 }
}
const busd2 = dd.arrivals[1]
if (busd2 == undefined){
    var busdSecond = "已停运"
} else {
if (busd2.status != 1){
  var busdSecond = "已停运"
} else {
  if (busd2.arrival_time <= 0){
    var busdSecond = "Arrived"
  } else {
  var busdSecond = (busd2.arrival_time / 60). toFixed(1) + "分钟"
  }
 }
}
//bus 804
const dd2 = busdtime[15]//9 15
const busdd1 = dd2.arrivals[0]
if (busdd1 == undefined){
    var busddFirst = "已停运"
} else {
if (busdd1.status != 1){
  var busddFirst = "已停运"
} else {
  if (busdd1.arrival_time <= 0){
    var busddFirst = "Arrived"
  } else {
  var busddFirst = (busdd1.arrival_time / 60).toFixed(1) + "分钟"
  }
 }
}
const busdd2 = dd2.arrivals[1]
if (busdd2 == undefined){
    var busddSecond = "已停运"
} else {
if (busdd2.status != 1){
  var busddSecond = "已停运"
} else {
  if (busdd2.arrival_time <= 0){
    var busddSecond = "Arrived"
  } else {
  var busddSecond = (busdd2.arrival_time / 60). toFixed(1) + "分钟"
  }
 }
}

// 加载Buse
//bus 246
async function buseidurlget() {
  let req = new Request(buse);
  let results = await req.loadJSON()
  return results;
}
const busereq = await buseidurlget(buse);
const e = busereq[0]
async function buseurlget() {
  let req = new Request(busurl + e.id + "/bus_arrival");
  let results = await req.loadJSON()
  return results;
}
const busetime = await buseurlget(busurl + e.id)
const ee = busetime[43] //43 45
const buse1 = ee.arrivals[0]
if (buse1 == undefined){
    var buseFirst = "已停运"
} else {
if (buse1.status != 1){
  var buseFirst = "已停运"
} else {
  if (buse1.arrival_time <= 0){
    var buseFirst = "Arrived"
  } else {
  var buseFirst = (buse1.arrival_time / 60).toFixed(1) + "分钟"
  }
 }
}
const buse2 = ee.arrivals[1]
if (buse2 == undefined){
    var buseSecond = "已停运"
} else {
if (buse2.status != 1){
  var buseSecond = "已停运"
} else {
  if (buse2.arrival_time <= 0){
    var buseSecond = "Arrived"
  } else {
  var buseSecond = (buse2.arrival_time / 60). toFixed(1) + "分钟"
  }
 }
}
//bus 249
const ee2 = busetime[45]//43 45
const busee1 = ee2.arrivals[0]
if (busee1 == undefined){
    var buseeFirst = "已停运"
} else {
if (busee1.status != 1){
  var buseeFirst = "已停运"
} else {
  if (busee1.arrival_time <= 0){
    var buseeFirst = "Arrived"
  } else {
  var buseeFirst = (busee1.arrival_time / 60).toFixed(1) + "分钟"
  }
 }
}
const busee2 = ee2.arrivals[1]
if (busee2 == undefined){
    var buseeSecond = "已停运"
} else {
if (busee2.status != 1){
  var buseeSecond = "已停运"
} else {
  if (busee2.arrival_time <= 0){
    var buseeSecond = "Arrived"
  } else {
  var buseeSecond = (busee2.arrival_time / 60). toFixed(1) + "分钟"
  }
 }
}

//添加的小组件
// busa
const cartona = w.addStack()
cartona.layoutVertically()
const cartonasta = cartona.addStack()
const sta = cartonasta.addText("Station: " + a.name + " " + a.code)
sta.textColor = stcolor
cartonasta.addSpacer()
const cartonacda = cartona.addStack()
const cda = cartonacda.addText("Bus: " + aa.bus_code + " To " + aa.bus.end_stop.name)
cda.textColor = buscolor
cda.font = zitisize
const cartonabus = cartona.addStack()
cartonabus.layoutHorizontally()
const busa1tm = cartonabus.addText("First: " + busaFirst )
busa1tm.font = zitisize
busa1tm.textColor = ziticolor
cartonabus.addSpacer(50)
const busa2tm = cartonabus.addText("Second: "+ busaSecond)
busa2tm.font = zitisize
busa2tm.textColor = ziticolor
cartona.addSpacer(2)

// Busb
const cartonb = w.addStack()
cartonb.layoutVertically()
const cartonbstb = cartonb.addStack()
const stb = cartonbstb.addText("Station: " + b.name + " " + b.code)
stb.textColor = stcolor
cartonbstb.addSpacer()
const cartoncdb = cartonb.addStack()
const cdb = cartoncdb.addText("Bus: " + bb.bus_code + " To " + bb.bus.end_stop.name)
cdb.textColor = buscolor
cdb.font = zitisize
const cartonbbus = cartonb.addStack()
cartonbbus.layoutHorizontally()
const busb1tm =  cartonbbus.addText("First: " + busbFirst )
busb1tm.font = zitisize
busb1tm.textColor = ziticolor
cartonbbus.addSpacer(50)
const busb2tm = cartonbbus.addText("Second: "+ busbSecond)
busb2tm.font = zitisize
busb2tm.textColor = ziticolor
cartonb.addSpacer(2)

// Busc
const cartonc = w.addStack()
cartonc.layoutVertically()
const cartoncstc = cartonc.addStack()
const stc = cartoncstc.addText("Station: " + c.name + " " + c.code)
stc.textColor = stcolor
cartoncstc.addSpacer()
const cartoncdc = cartonc.addStack()
const cdc = cartoncdc.addText("Bus: " + cc.bus_code + " To " + cc.bus.end_stop.name)
cdc.textColor = buscolor
cdc.font = zitisize
const cartoncbus = cartonc.addStack()
cartoncbus.layoutHorizontally()
const busc1tm =  cartoncbus.addText("First: " + buscFirst )
busc1tm.font = zitisize
busc1tm.textColor = ziticolor
cartoncbus.addSpacer(50)
const busc2tm = cartoncbus.addText("Second: "+ buscSecond)
busc2tm.font = zitisize
busc2tm.textColor = ziticolor
cartonc.addSpacer(2)

// busd
const cartond = w.addStack()
cartond.layoutVertically()
const cartondstd = cartond.addStack()
const std = cartondstd.addText("Station: " + d.name + " " + d.code)
std.textColor = stcolor
cartondstd.addSpacer()
const cartondcdd = cartond.addStack()
const cdd = cartondcdd.addText("Bus: " + dd.bus_code + " To " +dd.bus.end_stop.name)
cdd.textColor = buscolor
cdd.font = zitisize
const cartondbus = cartond.addStack()
cartondbus.layoutHorizontally()
const busd1tm = cartondbus.addText("First: " + busdFirst )
busd1tm.font = zitisize
busd1tm.textColor = ziticolor
cartondbus.addSpacer(50)
const busd2tm = cartondbus.addText("Second: "+ busdSecond)
busd2tm.font = zitisize
busd2tm.textColor = ziticolor
//804
const cartonddcdd = cartond.addStack()
const cddd = cartonddcdd.addText("Bus: " + dd2.bus_code + " To " + dd2.bus.end_stop.name)
cddd.textColor = buscolor
cddd.font = zitisize
const cartonddbus = cartond.addStack()
cartonddbus.layoutHorizontally()
const busdd1tm = cartonddbus.addText("First: " + busddFirst )
busdd1tm.font = zitisize
busdd1tm.textColor = ziticolor
cartonddbus.addSpacer(50)
const busdd2tm = cartonddbus.addText("Second: "+ busddSecond)
busdd2tm.font = zitisize
busdd2tm.textColor = ziticolor
cartond.addSpacer(2)

// buse
const cartone = w.addStack()
cartone.layoutVertically()
const cartoneste = cartone.addStack()
const ste = cartoneste.addText("Station: " + e.name + " " + e.code)
ste.textColor = stcolor
cartoneste.addSpacer()
const cartonecee = cartone.addStack()
const cee = cartonecee.addText("Bus: " + ee.bus_code + " To " + ee.bus.end_stop.name)
cee.textColor = buscolor
cee.font = zitisize
const cartonebus = cartone.addStack()
cartonebus.layoutHorizontally()
const buse1tm = cartonebus.addText("First: " + buseFirst )
buse1tm.font = zitisize
buse1tm.textColor = ziticolor
cartonebus.addSpacer(50)
const buse2tm = cartonebus.addText("Second: "+ buseSecond)
buse2tm.font = zitisize
buse2tm.textColor = ziticolor
//249
const cartoneecee = cartone.addStack()
const ceee = cartoneecee.addText("Bus: " + ee2.bus_code + " To " + ee2.bus.end_stop.name)
ceee.textColor = buscolor
ceee.font = zitisize
const cartoneebus = cartone.addStack()
cartoneebus.layoutHorizontally()
const busee1tm = cartoneebus.addText("First: " + buseeFirst )
busee1tm.font = zitisize
busee1tm.textColor = ziticolor
cartoneebus.addSpacer(50)
const busee2tm = cartoneebus.addText("Second: "+ buseeSecond)
busee2tm.font = zitisize
busee2tm.textColor = ziticolor
cartond.addSpacer(2)

if (config.runsInApp) {
await w.presentLarge()
}

Script.setWidget(w)
Script.complete()
