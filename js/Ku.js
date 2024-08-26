// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: vector-square;
this.name = "依赖库";
this.widget_ID = "js-999";
this.version = "v2.0";

//安装脚本库
async function installation(scriptID, thisVersion) {
  const scriptListURL = "https://bb1026.github.io/bing/js/Master.json";

  const fm = FileManager.iCloud();

  try {
    // 发起网络请求获取脚本列表
    let scriptList = await new Request(scriptListURL).loadJSON();
    
    console.log("✔️连接成功\n检查更新");
    
    let remoteScriptInfo = scriptList[scriptID];

    if (!remoteScriptInfo) {
      // 未找到脚本信息
      const failureAlert = new Alert();
      failureAlert.title = "失败";
      failureAlert.message = `未找到ID为'${scriptID}'的脚本信息。`;
      failureAlert.addAction("确定");
      await failureAlert.present();
      console.log(`未找到ID为'${scriptID}'的脚本信息。`);
      return;
    }

    let updateinfo = remoteScriptInfo.update;
    let remoteVersion = remoteScriptInfo.version;
    console.log(`远程脚本版本: ${remoteVersion}`);
    console.log(`本地脚本版本: ${thisVersion}`);

    // 仅当版本不匹配时才进行更新
    if (thisVersion !== remoteVersion) {
      const scriptURL = `https://bb1026.github.io/bing/js/${scriptID}.js`;

      const { name: scriptName, update: scriptUpdate } = remoteScriptInfo;

      // 构建本地脚本路径
      const scriptPath = fm.joinPath(
        fm.documentsDirectory(),
        `${scriptName}.js`
      );

      // 检查脚本是否已经存在
      if (fm.fileExists(scriptPath)) {
        const alreadyInstalledAlert = new Alert();
        alreadyInstalledAlert.title = "更新提示";
        alreadyInstalledAlert.message = `已有新版本: ${thisVersion} → ${remoteVersion}\n更新内容: ${updateinfo}\n<${scriptName}>已经存在，是否覆盖安装！`;
        alreadyInstalledAlert.addAction("取消安装");
        alreadyInstalledAlert.addAction("覆盖安装");
        const response = await alreadyInstalledAlert.present();

        if (response === 0) {
          // 用户选择取消安装
          const cancelAlert = new Alert();
          cancelAlert.title = "取消安装";
          cancelAlert.message = `<${scriptName}>已经存在相同名称的脚本，用户取消安装。`;
          cancelAlert.addAction("确定");
          await cancelAlert.present();
          console.log(`<${scriptName}>已经存在相同名称的脚本，用户取消安装。`);
          return;
        }
      }

      // 用户选择覆盖安装或脚本不存在，继续安装脚本
      // 下载脚本
      const downloadReq = new Request(scriptURL);
      console.log("[*] 开始下载脚本...");
      const scriptContent = await downloadReq.loadString();
      console.log("[+] 脚本下载完成...");

      // 保存脚本到 Scriptable 的脚本目录中
      console.log("[#] 开始安装脚本...");
      fm.writeString(scriptPath, scriptContent);
      console.log("[-] 脚本安装完成...");

      // 显示成功消息
      const successAlert = new Alert();
      successAlert.title = "成功";
      successAlert.message = `<${scriptName}>脚本已成功安装！\n更新内容：${scriptUpdate}\n版本号：${remoteVersion}`;
      successAlert.addAction("确定");
      const runScript = await successAlert.present();
      if (runScript === 0) {
        Safari.open(
          `scriptable:///run?scriptName=${encodeURIComponent(scriptName)}`
        );
      }
      console.log(
        `<${scriptName}>脚本已成功安装！\n更新日期：${scriptUpdate}\n版本号：${remoteVersion}`
      );
      exit();
    } else {
      console.log("脚本已是最新版本，无需更新。");
    }
  } catch (error) {
    console.log("❌连接失败\n取消本次更新");
  }
}

module.exports = { installation };

// 示例调用
// await installation('yourScriptID', 'yourCurrentVersion');



// 日历库
/**
 * @1900-2100区间内的公历、农历互转
 * @公历转农历：calendar.solar2lunar(1987,11,01); //[you can ignore params of prefix 0]
 * @农历转公历：calendar.lunar2solar(1987,09,10); //[you can ignore params of prefix 0]
 */
const calendar = {
  /**
   * 农历1900-2100的润大小信息表
   * @Array Of Property
   * @return Hex
   */
  lunarInfo: [
    0x04bd8,
    0x04ae0,
    0x0a570,
    0x054d5,
    0x0d260,
    0x0d950,
    0x16554,
    0x056a0,
    0x09ad0,
    0x055d2, //1900-1909
    0x04ae0,
    0x0a5b6,
    0x0a4d0,
    0x0d250,
    0x1d255,
    0x0b540,
    0x0d6a0,
    0x0ada2,
    0x095b0,
    0x14977, //1910-1919
    0x04970,
    0x0a4b0,
    0x0b4b5,
    0x06a50,
    0x06d40,
    0x1ab54,
    0x02b60,
    0x09570,
    0x052f2,
    0x04970, //1920-1929
    0x06566,
    0x0d4a0,
    0x0ea50,
    0x06e95,
    0x05ad0,
    0x02b60,
    0x186e3,
    0x092e0,
    0x1c8d7,
    0x0c950, //1930-1939
    0x0d4a0,
    0x1d8a6,
    0x0b550,
    0x056a0,
    0x1a5b4,
    0x025d0,
    0x092d0,
    0x0d2b2,
    0x0a950,
    0x0b557, //1940-1949
    0x06ca0,
    0x0b550,
    0x15355,
    0x04da0,
    0x0a5b0,
    0x14573,
    0x052b0,
    0x0a9a8,
    0x0e950,
    0x06aa0, //1950-1959
    0x0aea6,
    0x0ab50,
    0x04b60,
    0x0aae4,
    0x0a570,
    0x05260,
    0x0f263,
    0x0d950,
    0x05b57,
    0x056a0, //1960-1969
    0x096d0,
    0x04dd5,
    0x04ad0,
    0x0a4d0,
    0x0d4d4,
    0x0d250,
    0x0d558,
    0x0b540,
    0x0b6a0,
    0x195a6, //1970-1979
    0x095b0,
    0x049b0,
    0x0a974,
    0x0a4b0,
    0x0b27a,
    0x06a50,
    0x06d40,
    0x0af46,
    0x0ab60,
    0x09570, //1980-1989
    0x04af5,
    0x04970,
    0x064b0,
    0x074a3,
    0x0ea50,
    0x06b58,
    0x055c0,
    0x0ab60,
    0x096d5,
    0x092e0, //1990-1999
    0x0c960,
    0x0d954,
    0x0d4a0,
    0x0da50,
    0x07552,
    0x056a0,
    0x0abb7,
    0x025d0,
    0x092d0,
    0x0cab5, //2000-2009
    0x0a950,
    0x0b4a0,
    0x0baa4,
    0x0ad50,
    0x055d9,
    0x04ba0,
    0x0a5b0,
    0x15176,
    0x052b0,
    0x0a930, //2010-2019
    0x07954,
    0x06aa0,
    0x0ad50,
    0x05b52,
    0x04b60,
    0x0a6e6,
    0x0a4e0,
    0x0d260,
    0x0ea65,
    0x0d530, //2020-2029
    0x05aa0,
    0x076a3,
    0x096d0,
    0x04afb,
    0x04ad0,
    0x0a4d0,
    0x1d0b6,
    0x0d250,
    0x0d520,
    0x0dd45, //2030-2039
    0x0b5a0,
    0x056d0,
    0x055b2,
    0x049b0,
    0x0a577,
    0x0a4b0,
    0x0aa50,
    0x1b255,
    0x06d20,
    0x0ada0, //2040-2049
    0x14b63,
    0x09370,
    0x049f8,
    0x04970,
    0x064b0,
    0x168a6,
    0x0ea50,
    0x06b20,
    0x1a6c4,
    0x0aae0, //2050-2059
    0x0a2e0,
    0x0d2e3,
    0x0c960,
    0x0d557,
    0x0d4a0,
    0x0da50,
    0x05d55,
    0x056a0,
    0x0a6d0,
    0x055d4, //2060-2069
    0x052d0,
    0x0a9b8,
    0x0a950,
    0x0b4a0,
    0x0b6a6,
    0x0ad50,
    0x055a0,
    0x0aba4,
    0x0a5b0,
    0x052b0, //2070-2079
    0x0b273,
    0x06930,
    0x07337,
    0x06aa0,
    0x0ad50,
    0x14b55,
    0x04b60,
    0x0a570,
    0x054e4,
    0x0d160, //2080-2089
    0x0e968,
    0x0d520,
    0x0daa0,
    0x16aa6,
    0x056d0,
    0x04ae0,
    0x0a9d4,
    0x0a2d0,
    0x0d150,
    0x0f252, //2090-2099
    0x0d520
  ], //2100

  /**
   * 公历每个月份的天数普通表
   * @Array Of Property
   * @return Number
   */
  solarMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],

  /**
   * 天干地支之天干速查表
   * @Array Of Property trans["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]
   * @return Cn string
   */
  Gan: [
    "\u7532",
    "\u4e59",
    "\u4e19",
    "\u4e01",
    "\u620a",
    "\u5df1",
    "\u5e9a",
    "\u8f9b",
    "\u58ec",
    "\u7678"
  ],

  /**
   * 天干地支之地支速查表
   * @Array Of Property
   * @trans["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
   * @return Cn string
   */
  Zhi: [
    "\u5b50",
    "\u4e11",
    "\u5bc5",
    "\u536f",
    "\u8fb0",
    "\u5df3",
    "\u5348",
    "\u672a",
    "\u7533",
    "\u9149",
    "\u620c",
    "\u4ea5"
  ],

  /**
   * 天干地支之地支速查表<=>生肖
   * @Array Of Property
   * @trans["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"]
   * @return Cn string
   */
  Animals: [
    "\u9f20",
    "\u725b",
    "\u864e",
    "\u5154",
    "\u9f99",
    "\u86c7",
    "\u9a6c",
    "\u7f8a",
    "\u7334",
    "\u9e21",
    "\u72d7",
    "\u732a"
  ],

  /**
   * 24节气速查表
   * @Array Of Property
   * @trans["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"]
   * @return Cn string
   */
  solarTerm: [
    "\u5c0f\u5bd2",
    "\u5927\u5bd2",
    "\u7acb\u6625",
    "\u96e8\u6c34",
    "\u60ca\u86f0",
    "\u6625\u5206",
    "\u6e05\u660e",
    "\u8c37\u96e8",
    "\u7acb\u590f",
    "\u5c0f\u6ee1",
    "\u8292\u79cd",
    "\u590f\u81f3",
    "\u5c0f\u6691",
    "\u5927\u6691",
    "\u7acb\u79cb",
    "\u5904\u6691",
    "\u767d\u9732",
    "\u79cb\u5206",
    "\u5bd2\u9732",
    "\u971c\u964d",
    "\u7acb\u51ac",
    "\u5c0f\u96ea",
    "\u5927\u96ea",
    "\u51ac\u81f3"
  ],

  /**
   * 1900-2100各年的24节气日期速查表
   * @Array Of Property
   * @return 0x string For splice
   */
  sTermInfo: [
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf97c3598082c95f8c965cc920f",
    "97bd0b06bdb0722c965ce1cfcc920f",
    "b027097bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf97c359801ec95f8c965cc920f",
    "97bd0b06bdb0722c965ce1cfcc920f",
    "b027097bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf97c359801ec95f8c965cc920f",
    "97bd0b06bdb0722c965ce1cfcc920f",
    "b027097bd097c36b0b6fc9274c91aa",
    "9778397bd19801ec9210c965cc920e",
    "97b6b97bd19801ec95f8c965cc920f",
    "97bd09801d98082c95f8e1cfcc920f",
    "97bd097bd097c36b0b6fc9210c8dc2",
    "9778397bd197c36c9210c9274c91aa",
    "97b6b97bd19801ec95f8c965cc920e",
    "97bd09801d98082c95f8e1cfcc920f",
    "97bd097bd097c36b0b6fc9210c8dc2",
    "9778397bd097c36c9210c9274c91aa",
    "97b6b97bd19801ec95f8c965cc920e",
    "97bcf97c3598082c95f8e1cfcc920f",
    "97bd097bd097c36b0b6fc9210c8dc2",
    "9778397bd097c36c9210c9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf97c3598082c95f8c965cc920f",
    "97bd097bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf97c3598082c95f8c965cc920f",
    "97bd097bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf97c359801ec95f8c965cc920f",
    "97bd097bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf97c359801ec95f8c965cc920f",
    "97bd097bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf97c359801ec95f8c965cc920f",
    "97bd097bd07f595b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9210c8dc2",
    "9778397bd19801ec9210c9274c920e",
    "97b6b97bd19801ec95f8c965cc920f",
    "97bd07f5307f595b0b0bc920fb0722",
    "7f0e397bd097c36b0b6fc9210c8dc2",
    "9778397bd097c36c9210c9274c920e",
    "97b6b97bd19801ec95f8c965cc920f",
    "97bd07f5307f595b0b0bc920fb0722",
    "7f0e397bd097c36b0b6fc9210c8dc2",
    "9778397bd097c36c9210c9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bd07f1487f595b0b0bc920fb0722",
    "7f0e397bd097c36b0b6fc9210c8dc2",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf7f1487f595b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf7f1487f595b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf7f1487f531b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c965cc920e",
    "97bcf7f1487f531b0b0bb0b6fb0722",
    "7f0e397bd07f595b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b97bd19801ec9210c9274c920e",
    "97bcf7f0e47f531b0b0bb0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "9778397bd097c36b0b6fc9210c91aa",
    "97b6b97bd197c36c9210c9274c920e",
    "97bcf7f0e47f531b0b0bb0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "9778397bd097c36b0b6fc9210c8dc2",
    "9778397bd097c36c9210c9274c920e",
    "97b6b7f0e47f531b0723b0b6fb0722",
    "7f0e37f5307f595b0b0bc920fb0722",
    "7f0e397bd097c36b0b6fc9210c8dc2",
    "9778397bd097c36b0b70c9274c91aa",
    "97b6b7f0e47f531b0723b0b6fb0721",
    "7f0e37f1487f595b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc9210c8dc2",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f595b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "9778397bd097c36b0b6fc9274c91aa",
    "97b6b7f0e47f531b0723b0787b0721",
    "7f0e27f0e47f531b0b0bb0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "9778397bd097c36b0b6fc9210c91aa",
    "97b6b7f0e47f149b0723b0787b0721",
    "7f0e27f0e47f531b0723b0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "9778397bd097c36b0b6fc9210c8dc2",
    "977837f0e37f149b0723b0787b0721",
    "7f07e7f0e47f531b0723b0b6fb0722",
    "7f0e37f5307f595b0b0bc920fb0722",
    "7f0e397bd097c35b0b6fc9210c8dc2",
    "977837f0e37f14998082b0787b0721",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e37f1487f595b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc9210c8dc2",
    "977837f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc920fb0722",
    "977837f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e397bd097c35b0b6fc920fb0722",
    "977837f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "977837f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "977837f0e37f14998082b0787b06bd",
    "7f07e7f0e47f149b0723b0787b0721",
    "7f0e27f0e47f531b0b0bb0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "977837f0e37f14998082b0723b06bd",
    "7f07e7f0e37f149b0723b0787b0721",
    "7f0e27f0e47f531b0723b0b6fb0722",
    "7f0e397bd07f595b0b0bc920fb0722",
    "977837f0e37f14898082b0723b02d5",
    "7ec967f0e37f14998082b0787b0721",
    "7f07e7f0e47f531b0723b0b6fb0722",
    "7f0e37f1487f595b0b0bb0b6fb0722",
    "7f0e37f0e37f14898082b0723b02d5",
    "7ec967f0e37f14998082b0787b0721",
    "7f07e7f0e47f531b0723b0b6fb0722",
    "7f0e37f1487f531b0b0bb0b6fb0722",
    "7f0e37f0e37f14898082b0723b02d5",
    "7ec967f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e37f1487f531b0b0bb0b6fb0722",
    "7f0e37f0e37f14898082b072297c35",
    "7ec967f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e37f0e37f14898082b072297c35",
    "7ec967f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e37f0e366aa89801eb072297c35",
    "7ec967f0e37f14998082b0787b06bd",
    "7f07e7f0e47f149b0723b0787b0721",
    "7f0e27f1487f531b0b0bb0b6fb0722",
    "7f0e37f0e366aa89801eb072297c35",
    "7ec967f0e37f14998082b0723b06bd",
    "7f07e7f0e47f149b0723b0787b0721",
    "7f0e27f0e47f531b0723b0b6fb0722",
    "7f0e37f0e366aa89801eb072297c35",
    "7ec967f0e37f14998082b0723b06bd",
    "7f07e7f0e37f14998083b0787b0721",
    "7f0e27f0e47f531b0723b0b6fb0722",
    "7f0e37f0e366aa89801eb072297c35",
    "7ec967f0e37f14898082b0723b02d5",
    "7f07e7f0e37f14998082b0787b0721",
    "7f07e7f0e47f531b0723b0b6fb0722",
    "7f0e36665b66aa89801e9808297c35",
    "665f67f0e37f14898082b0723b02d5",
    "7ec967f0e37f14998082b0787b0721",
    "7f07e7f0e47f531b0723b0b6fb0722",
    "7f0e36665b66a449801e9808297c35",
    "665f67f0e37f14898082b0723b02d5",
    "7ec967f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e36665b66a449801e9808297c35",
    "665f67f0e37f14898082b072297c35",
    "7ec967f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e26665b66a449801e9808297c35",
    "665f67f0e37f1489801eb072297c35",
    "7ec967f0e37f14998082b0787b06bd",
    "7f07e7f0e47f531b0723b0b6fb0721",
    "7f0e27f1487f531b0b0bb0b6fb0722"
  ],

  /**
   * 数字转中文速查表
   * @Array Of Property
   * @trans ['日','一','二','三','四','五','六','七','八','九','十']
   * @return Cn string
   */
  nStr1: [
    "\u65e5",
    "\u4e00",
    "\u4e8c",
    "\u4e09",
    "\u56db",
    "\u4e94",
    "\u516d",
    "\u4e03",
    "\u516b",
    "\u4e5d",
    "\u5341"
  ],

  /**
   * 日期转农历称呼速查表
   * @Array Of Property
   * @trans ['初','十','廿','卅']
   * @return Cn string
   */
  nStr2: ["\u521d", "\u5341", "\u5eff", "\u5345"],

  /**
   * 月份转农历称呼速查表
   * @Array Of Property
   * @trans ['正','一','二','三','四','五','六','七','八','九','十','冬','腊']
   * @return Cn string
   */
  nStr3: [
    "\u6b63",
    "\u4e8c",
    "\u4e09",
    "\u56db",
    "\u4e94",
    "\u516d",
    "\u4e03",
    "\u516b",
    "\u4e5d",
    "\u5341",
    "\u51ac",
    "\u814a"
  ],

  /**
   * 返回农历y年一整年的总天数
   * @param lunar Year
   * @return Number
   * @eg:var count = calendar.lYearDays(1987) ;//count=387
   */
  lYearDays: function (y) {
    var i,
      sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) {
      sum += calendar.lunarInfo[y - 1900] & i ? 1 : 0;
    }
    return sum + calendar.leapDays(y);
  },

  /**
   * 返回农历y年闰月是哪个月；若y年没有闰月 则返回0
   * @param lunar Year
   * @return Number (0-12)
   * @eg:var leapMonth = calendar.leapMonth(1987) ;//leapMonth=6
   */
  leapMonth: function (y) {
    //闰字编码 \u95f0
    return calendar.lunarInfo[y - 1900] & 0xf;
  },

  /**
   * 返回农历y年闰月的天数 若该年没有闰月则返回0
   * @param lunar Year
   * @return Number (0、29、30)
   * @eg:var leapMonthDay = calendar.leapDays(1987) ;//leapMonthDay=29
   */
  leapDays: function (y) {
    if (calendar.leapMonth(y)) {
      return calendar.lunarInfo[y - 1900] & 0x10000 ? 30 : 29;
    }
    return 0;
  },

  /**
   * 返回农历y年m月（非闰月）的总天数，计算m为闰月时的天数请使用leapDays方法
   * @param lunar Year
   * @return Number (-1、29、30)
   * @eg:var MonthDay = calendar.monthDays(1987,9) ;//MonthDay=29
   */
  monthDays: function (y, m) {
    if (m > 12 || m < 1) {
      return -1;
    } //月份参数从1至12，参数错误返回-1
    return calendar.lunarInfo[y - 1900] & (0x10000 >> m) ? 30 : 29;
  },

  /**
   * 返回公历(!)y年m月的天数
   * @param solar Year
   * @return Number (-1、28、29、30、31)
   * @eg:var solarMonthDay = calendar.leapDays(1987) ;//solarMonthDay=30
   */
  solarDays: function (y, m) {
    if (m > 12 || m < 1) {
      return -1;
    } //若参数错误 返回-1
    var ms = m - 1;
    if (ms == 1) {
      //2月份的闰平规律测算后确认返回28或29
      return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0 ? 29 : 28;
    } else {
      return calendar.solarMonth[ms];
    }
  },

  /**
   * 农历年份转换为干支纪年
   * @param  lYear 农历年的年份数
   * @return Cn string
   */
  toGanZhiYear: function (lYear) {
    var ganKey = (lYear - 3) % 10;
    var zhiKey = (lYear - 3) % 12;
    if (ganKey == 0) ganKey = 10; //如果余数为0则为最后一个天干
    if (zhiKey == 0) zhiKey = 12; //如果余数为0则为最后一个地支
    return calendar.Gan[ganKey - 1] + calendar.Zhi[zhiKey - 1];
  },

  /**
   * 公历月、日判断所属星座
   * @param  cMonth [description]
   * @param  cDay [description]
   * @return Cn string
   */
  toAstro: function (cMonth, cDay) {
    var s =
      "\u9b54\u7faf\u6c34\u74f6\u53cc\u9c7c\u767d\u7f8a\u91d1\u725b\u53cc\u5b50\u5de8\u87f9\u72ee\u5b50\u5904\u5973\u5929\u79e4\u5929\u874e\u5c04\u624b\u9b54\u7faf";
    var arr = [20, 19, 21, 21, 21, 22, 23, 23, 23, 23, 22, 22];
    return (
      s.substr(cMonth * 2 - (cDay < arr[cMonth - 1] ? 2 : 0), 2) + "\u5ea7"
    ); //座
  },

  /**
   * 传入offset偏移量返回干支
   * @param offset 相对甲子的偏移量
   * @return Cn string
   */
  toGanZhi: function (offset) {
    return calendar.Gan[offset % 10] + calendar.Zhi[offset % 12];
  },

  /**
   * 传入公历(!)y年获得该年第n个节气的公历日期
   * @param y公历年(1900-2100)；n二十四节气中的第几个节气(1~24)；从n=1(小寒)算起
   * @return day Number
   * @eg:var _24 = calendar.getTerm(1987,3) ;//_24=4;意即1987年2月4日立春
   */
  getTerm: function (y, n) {
    if (y < 1900 || y > 2100) {
      return -1;
    }
    if (n < 1 || n > 24) {
      return -1;
    }
    var _table = calendar.sTermInfo[y - 1900];
    var _info = [
      parseInt("0x" + _table.substr(0, 5)).toString(),
      parseInt("0x" + _table.substr(5, 5)).toString(),
      parseInt("0x" + _table.substr(10, 5)).toString(),
      parseInt("0x" + _table.substr(15, 5)).toString(),
      parseInt("0x" + _table.substr(20, 5)).toString(),
      parseInt("0x" + _table.substr(25, 5)).toString()
    ];
    var _calday = [
      _info[0].substr(0, 1),
      _info[0].substr(1, 2),
      _info[0].substr(3, 1),
      _info[0].substr(4, 2),

      _info[1].substr(0, 1),
      _info[1].substr(1, 2),
      _info[1].substr(3, 1),
      _info[1].substr(4, 2),

      _info[2].substr(0, 1),
      _info[2].substr(1, 2),
      _info[2].substr(3, 1),
      _info[2].substr(4, 2),

      _info[3].substr(0, 1),
      _info[3].substr(1, 2),
      _info[3].substr(3, 1),
      _info[3].substr(4, 2),

      _info[4].substr(0, 1),
      _info[4].substr(1, 2),
      _info[4].substr(3, 1),
      _info[4].substr(4, 2),

      _info[5].substr(0, 1),
      _info[5].substr(1, 2),
      _info[5].substr(3, 1),
      _info[5].substr(4, 2)
    ];
    return parseInt(_calday[n - 1]);
  },

  /**
   * 传入农历数字月份返回汉语通俗表示法
   * @param lunar month
   * @return Cn string
   * @eg:var cnMonth = calendar.toChinaMonth(12) ;//cnMonth='腊月'
   */
  toChinaMonth: function (m) {
    // 月 => \u6708
    if (m > 12 || m < 1) {
      return -1;
    } //若参数错误 返回-1
    var s = calendar.nStr3[m - 1];
    s += "\u6708"; //加上月字
    return s;
  },

  /**
   * 传入农历日期数字返回汉字表示法
   * @param lunar day
   * @return Cn string
   * @eg:var cnDay = calendar.toChinaDay(21) ;//cnMonth='廿一'
   */
  toChinaDay: function (d) {
    //日 => \u65e5
    var s;
    switch (d) {
      case 10:
        s = "\u521d\u5341";
        break;
      case 20:
        s = "\u4e8c\u5341";
        break;
        break;
      case 30:
        s = "\u4e09\u5341";
        break;
        break;
      default:
        s = calendar.nStr2[Math.floor(d / 10)];
        s += calendar.nStr1[d % 10];
    }
    return s;
  },

  /**
   * 年份转生肖[!仅能大致转换] => 精确划分生肖分界线是“立春”
   * @param y year
   * @return Cn string
   * @eg:var animal = calendar.getAnimal(1987) ;//animal='兔'
   */
  getAnimal: function (y) {
    return calendar.Animals[(y - 4) % 12];
  },

  /**
   * 传入阳历年月日获得详细的公历、农历object信息 <=>JSON
   * @param y  solar year
   * @param m  solar month
   * @param d  solar day
   * @return JSON object
   * @eg:console.log(calendar.solar2lunar(1987,11,01));
   */
  solar2lunar: function (y, m, d) {
    //参数区间1900.1.31~2100.12.31
    if (y < 1900 || y > 2100) {
      return -1;
    } //年份限定、上限
    if (y == 1900 && m == 1 && d < 31) {
      return -1;
    } //下限
    if (!y) {
      //未传参  获得当天
      var objDate = new Date();
    } else {
      var objDate = new Date(y, parseInt(m) - 1, d);
    }
    var i,
      leap = 0,
      temp = 0;
    //修正ymd参数
    var y = objDate.getFullYear(),
      m = objDate.getMonth() + 1,
      d = objDate.getDate();
    var offset =
      (Date.UTC(objDate.getFullYear(), objDate.getMonth(), objDate.getDate()) -
        Date.UTC(1900, 0, 31)) /
      86400000;
    for (i = 1900; i < 2101 && offset > 0; i++) {
      temp = calendar.lYearDays(i);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      i--;
    }

    //是否今天
    var isTodayObj = new Date(),
      isToday = false;
    if (
      isTodayObj.getFullYear() == y &&
      isTodayObj.getMonth() + 1 == m &&
      isTodayObj.getDate() == d
    ) {
      isToday = true;
    }
    //星期几
    var nWeek = objDate.getDay(),
      cWeek = calendar.nStr1[nWeek];
    if (nWeek == 0) {
      nWeek = 7;
    } //数字表示周几顺应天朝周一开始的惯例
    //农历年
    var year = i;

    var leap = calendar.leapMonth(i); //闰哪个月
    var isLeap = false;

    //效验闰月
    for (i = 1; i < 13 && offset > 0; i++) {
      //闰月
      if (leap > 0 && i == leap + 1 && isLeap == false) {
        --i;
        isLeap = true;
        temp = calendar.leapDays(year); //计算农历闰月天数
      } else {
        temp = calendar.monthDays(year, i); //计算农历普通月天数
      }
      //解除闰月
      if (isLeap == true && i == leap + 1) {
        isLeap = false;
      }
      offset -= temp;
    }

    if (offset == 0 && leap > 0 && i == leap + 1)
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        --i;
      }
    if (offset < 0) {
      offset += temp;
      --i;
    }
    //农历月
    var month = i;
    //农历日
    var day = offset + 1;

    //天干地支处理
    var sm = m - 1;
    var gzY = calendar.toGanZhiYear(year);

    //月柱 1900年1月小寒以前为 丙子月(60进制12)
    var firstNode = calendar.getTerm(year, m * 2 - 1); //返回当月「节」为几日开始
    var secondNode = calendar.getTerm(year, m * 2); //返回当月「节」为几日开始

    //依据12节气修正干支月
    var gzM = calendar.toGanZhi((y - 1900) * 12 + m + 11);
    if (d >= firstNode) {
      gzM = calendar.toGanZhi((y - 1900) * 12 + m + 12);
    }

    //传入的日期的节气与否
    var isTerm = false;
    var Term = null;
    if (firstNode == d) {
      isTerm = true;
      Term = calendar.solarTerm[m * 2 - 2];
    }
    if (secondNode == d) {
      isTerm = true;
      Term = calendar.solarTerm[m * 2 - 1];
    }
    //日柱 当月一日与 1900/1/1 相差天数
    var dayCyclical = Date.UTC(y, sm, 1, 0, 0, 0, 0) / 86400000 + 25567 + 10;
    var gzD = calendar.toGanZhi(dayCyclical + d - 1);
    //该日期所属的星座
    var astro = calendar.toAstro(m, d);

    return {
      lYear: year,
      lMonth: month,
      lDay: day,
      Animal: calendar.getAnimal(year),
      IMonthCn: (isLeap ? "\u95f0" : "") + calendar.toChinaMonth(month),
      IDayCn: calendar.toChinaDay(day),
      cYear: y,
      cMonth: m,
      cDay: d,
      gzYear: gzY,
      gzMonth: gzM,
      gzDay: gzD,
      isToday: isToday,
      isLeap: isLeap,
      nWeek: nWeek,
      ncWeek: "\u661f\u671f" + cWeek,
      isTerm: isTerm,
      Term: Term,
      astro: astro
    };
  },

  /**
   * 传入农历年月日以及传入的月份是否闰月获得详细的公历、农历object信息 <=>JSON
   * @param y  lunar year
   * @param m  lunar month
   * @param d  lunar day
   * @param isLeapMonth  lunar month is leap or not.[如果是农历闰月第四个参数赋值true即可]
   * @return JSON object
   * @eg:console.log(calendar.lunar2solar(1987,9,10));
   */
  lunar2solar: function (y, m, d, isLeapMonth) {
    //参数区间1900.1.31~2100.12.1
    var isLeapMonth = !!isLeapMonth;
    var leapOffset = 0;
    var leapMonth = calendar.leapMonth(y);
    var leapDay = calendar.leapDays(y);
    if (isLeapMonth && leapMonth != m) {
      return -1;
    } //传参要求计算该闰月公历 但该年得出的闰月与传参的月份并不同
    if ((y == 2100 && m == 12 && d > 1) || (y == 1900 && m == 1 && d < 31)) {
      return -1;
    } //超出了最大极限值
    var day = calendar.monthDays(y, m);
    var _day = day;
    //bugFix 2016-9-25
    //if month is leap, _day use leapDays method
    if (isLeapMonth) {
      _day = calendar.leapDays(y, m);
    }
    if (y < 1900 || y > 2100 || d > _day) {
      return -1;
    } //参数合法性效验

    //计算农历的时间差
    var offset = 0;
    for (var i = 1900; i < y; i++) {
      offset += calendar.lYearDays(i);
    }
    var leap = 0,
      isAdd = false;
    for (var i = 1; i < m; i++) {
      leap = calendar.leapMonth(y);
      if (!isAdd) {
        //处理闰月
        if (leap <= i && leap > 0) {
          offset += calendar.leapDays(y);
          isAdd = true;
        }
      }
      offset += calendar.monthDays(y, i);
    }
    //转换闰月农历 需补充该年闰月的前一个月的时差
    if (isLeapMonth) {
      offset += day;
    }
    //1900年农历正月一日的公历时间为1900年1月30日0时0分0秒(该时间也是本农历的最开始起始点)
    var stmap = Date.UTC(1900, 1, 30, 0, 0, 0);
    var calObj = new Date((offset + d - 31) * 86400000 + stmap);
    var cY = calObj.getUTCFullYear();
    var cM = calObj.getUTCMonth() + 1;
    var cD = calObj.getUTCDate();

    return calendar.solar2lunar(cY, cM, cD);
  }
};


//钱币代码库
const currencyData = {
    "AED": {
        "zh_country": "阿联酋",
        "zh_currency_full": "阿联酋迪拉姆",
        "zh_currency_abbr": "迪拉姆",
        "en_country": "United Arab Emirates",
        "en_currency_full": "United Arab Emirates Dirham",
        "en_currency_abbr": "AED"
    },
    "AFN": {
        "zh_country": "阿富汗",
        "zh_currency_full": "阿富汗尼",
        "zh_currency_abbr": "阿富汗尼",
        "en_country": "Afghanistan",
        "en_currency_full": "Afghan Afghani",
        "en_currency_abbr": "AFN"
    },
    "ALL": {
        "zh_country": "阿尔巴尼亚",
        "zh_currency_full": "阿尔巴尼亚列克",
        "zh_currency_abbr": "列克",
        "en_country": "Albania",
        "en_currency_full": "Albanian Lek",
        "en_currency_abbr": "ALL"
    },
        "AMD": {
        "zh_country": "亚美尼亚",
        "zh_currency_full": "亚美尼亚德拉姆",
        "zh_currency_abbr": "德拉姆",
        "en_country": "Armenia",
        "en_currency_full": "Armenian Dram",
        "en_currency_abbr": "AMD"
    },
    "ANG": {
        "zh_country": "荷属安的列斯",
        "zh_currency_full": "荷属安的列斯盾",
        "zh_currency_abbr": "盾",
        "en_country": "Netherlands Antilles",
        "en_currency_full": "Netherlands Antillean Guilder",
        "en_currency_abbr": "ANG"
    },
    "AOA": {
        "zh_country": "安哥拉",
        "zh_currency_full": "安哥拉宽扎",
        "zh_currency_abbr": "宽扎",
        "en_country": "Angola",
        "en_currency_full": "Angolan Kwanza",
        "en_currency_abbr": "AOA"
    },
    "ARS": {
        "zh_country": "阿根廷",
        "zh_currency_full": "阿根廷比索",
        "zh_currency_abbr": "比索",
        "en_country": "Argentina",
        "en_currency_full": "Argentine Peso",
        "en_currency_abbr": "ARS"
    },
    "AUD": {
        "zh_country": "澳大利亚",
        "zh_currency_full": "澳大利亚元",
        "zh_currency_abbr": "澳元",
        "en_country": "Australia",
        "en_currency_full": "Australian Dollar",
        "en_currency_abbr": "AUD"
    },
    "AWG": {
        "zh_country": "阿鲁巴",
        "zh_currency_full": "阿鲁巴弗罗林",
        "zh_currency_abbr": "弗罗林",
        "en_country": "Aruba",
        "en_currency_full": "Aruban Florin",
        "en_currency_abbr": "AWG"
    },
    "AZN": {
        "zh_country": "阿塞拜疆",
        "zh_currency_full": "阿塞拜疆马纳特",
        "zh_currency_abbr": "马纳特",
        "en_country": "Azerbaijan",
        "en_currency_full": "Azerbaijani Manat",
        "en_currency_abbr": "AZN"
    },
    "BAM": {
        "zh_country": "波斯尼亚和黑塞哥维那",
        "zh_currency_full": "波斯尼亚和黑塞哥维那可兑换马克",
        "zh_currency_abbr": "可兑换马克",
        "en_country": "Bosnia and Herzegovina",
        "en_currency_full": "Bosnia-Herzegovina Convertible Mark",
        "en_currency_abbr": "BAM"
    },
    "BBD": {
        "zh_country": "巴巴多斯",
        "zh_currency_full": "巴巴多斯元",
        "zh_currency_abbr": "巴巴多斯元",
        "en_country": "Barbados",
        "en_currency_full": "Barbadian Dollar",
        "en_currency_abbr": "BBD"
    },
    "BDT": {
        "zh_country": "孟加拉国",
        "zh_currency_full": "孟加拉塔卡",
        "zh_currency_abbr": "塔卡",
        "en_country": "Bangladesh",
        "en_currency_full": "Bangladeshi Taka",
        "en_currency_abbr": "BDT"
    },
    "BGN": {
        "zh_country": "保加利亚",
        "zh_currency_full": "保加利亚列弗",
        "zh_currency_abbr": "列弗",
        "en_country": "Bulgaria",
        "en_currency_full": "Bulgarian Lev",
        "en_currency_abbr": "BGN"
    },
    "BHD": {
        "zh_country": "巴林",
        "zh_currency_full": "巴林第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "Bahrain",
        "en_currency_full": "Bahraini Dinar",
        "en_currency_abbr": "BHD"
    },
    "BIF": {
        "zh_country": "布隆迪",
        "zh_currency_full": "布隆迪法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "Burundi",
        "en_currency_full": "Burundian Franc",
        "en_currency_abbr": "BIF"
    },
    "BMD": {
        "zh_country": "百慕大",
        "zh_currency_full": "百慕大元",
        "zh_currency_abbr": "百慕大元",
        "en_country": "Bermuda",
        "en_currency_full": "Bermudian Dollar",
        "en_currency_abbr": "BMD"
    },
    "BND": {
        "zh_country": "文莱",
        "zh_currency_full": "文莱元",
        "zh_currency_abbr": "文莱元",
        "en_country": "Brunei",
        "en_currency_full": "Brunei Dollar",
        "en_currency_abbr": "BND"
    },
    "BOB": {
        "zh_country": "玻利维亚",
        "zh_currency_full": "玻利维亚诺",
        "zh_currency_abbr": "诺",
        "en_country": "Bolivia",
        "en_currency_full": "Bolivian Boliviano",
        "en_currency_abbr": "BOB"
    },
    "BRL": {
        "zh_country": "巴西",
        "zh_currency_full": "巴西雷亚尔",
        "zh_currency_abbr": "雷亚尔",
        "en_country": "Brazil",
        "en_currency_full": "Brazilian Real",
        "en_currency_abbr": "BRL"
    },
    "BSD": {
        "zh_country": "巴哈马",
        "zh_currency_full": "巴哈马元",
        "zh_currency_abbr": "巴哈马元",
        "en_country": "Bahamas",
        "en_currency_full": "Bahamian Dollar",
        "en_currency_abbr": "BSD"
    },
        "BTN": {
        "zh_country": "不丹",
        "zh_currency_full": "不丹努扎姆",
        "zh_currency_abbr": "努扎姆",
        "en_country": "Bhutan",
        "en_currency_full": "Bhutanese Ngultrum",
        "en_currency_abbr": "BTN"
    },
    "BWP": {
        "zh_country": "博茨瓦纳",
        "zh_currency_full": "博茨瓦纳普拉",
        "zh_currency_abbr": "普拉",
        "en_country": "Botswana",
        "en_currency_full": "Botswana Pula",
        "en_currency_abbr": "BWP"
    },
    "BYN": {
        "zh_country": "白俄罗斯",
        "zh_currency_full": "白俄罗斯卢布",
        "zh_currency_abbr": "卢布",
        "en_country": "Belarus",
        "en_currency_full": "Belarusian Ruble",
        "en_currency_abbr": "BYN"
    },
    "BZD": {
        "zh_country": "伯利兹",
        "zh_currency_full": "伯利兹元",
        "zh_currency_abbr": "伯利兹元",
        "en_country": "Belize",
        "en_currency_full": "Belize Dollar",
        "en_currency_abbr": "BZD"
    },
    "CAD": {
        "zh_country": "加拿大",
        "zh_currency_full": "加拿大元",
        "zh_currency_abbr": "加元",
        "en_country": "Canada",
        "en_currency_full": "Canadian Dollar",
        "en_currency_abbr": "CAD"
    },
    "CDF": {
        "zh_country": "刚果（金）",
        "zh_currency_full": "刚果法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "Congo (Kinshasa)",
        "en_currency_full": "Congolese Franc",
        "en_currency_abbr": "CDF"
    },
    "CHF": {
        "zh_country": "瑞士",
        "zh_currency_full": "瑞士法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "Switzerland",
        "en_currency_full": "Swiss Franc",
        "en_currency_abbr": "CHF"
    },
    "CLP": {
        "zh_country": "智利",
        "zh_currency_full": "智利比索",
        "zh_currency_abbr": "比索",
        "en_country": "Chile",
        "en_currency_full": "Chilean Peso",
        "en_currency_abbr": "CLP"
    },
    "CNY": {
        "zh_country": "中国",
        "zh_currency_full": "人民币",
        "zh_currency_abbr": "人民币",
        "en_country": "China",
        "en_currency_full": "Chinese Yuan",
        "en_currency_abbr": "CNY"
    },
    "COP": {
        "zh_country": "哥伦比亚",
        "zh_currency_full": "哥伦比亚比索",
        "zh_currency_abbr": "比索",
        "en_country": "Colombia",
        "en_currency_full": "Colombian Peso",
        "en_currency_abbr": "COP"
    },
    "CRC": {
        "zh_country": "哥斯达黎加",
        "zh_currency_full": "哥斯达黎加科朗",
        "zh_currency_abbr": "科朗",
        "en_country": "Costa Rica",
        "en_currency_full": "Costa Rican Colón",
        "en_currency_abbr": "CRC"
    },
    "CUC": {
        "zh_country": "古巴",
        "zh_currency_full": "古巴可兑换比索",
        "zh_currency_abbr": "可兑换比索",
        "en_country": "Cuba",
        "en_currency_full": "Cuban Convertible Peso",
        "en_currency_abbr": "CUC"
    },
    "CUP": {
        "zh_country": "古巴",
        "zh_currency_full": "古巴比索",
        "zh_currency_abbr": "比索",
        "en_country": "Cuba",
        "en_currency_full": "Cuban Peso",
        "en_currency_abbr": "CUP"
    },
    "CVE": {
        "zh_country": "佛得角",
        "zh_currency_full": "佛得角埃斯库多",
        "zh_currency_abbr": "埃斯库多",
        "en_country": "Cape Verde",
        "en_currency_full": "Cape Verdean Escudo",
        "en_currency_abbr": "CVE"
    },
    "CZK": {
        "zh_country": "捷克",
        "zh_currency_full": "捷克克朗",
        "zh_currency_abbr": "克朗",
        "en_country": "Czechia",
        "en_currency_full": "Czech Koruna",
        "en_currency_abbr": "CZK"
    },
        "DJF": {
        "zh_country": "吉布提",
        "zh_currency_full": "吉布提法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "Djibouti",
        "en_currency_full": "Djiboutian Franc",
        "en_currency_abbr": "DJF"
    },
    "DKK": {
        "zh_country": "丹麦",
        "zh_currency_full": "丹麦克朗",
        "zh_currency_abbr": "克朗",
        "en_country": "Denmark",
        "en_currency_full": "Danish Krone",
        "en_currency_abbr": "DKK"
    },
    "DOP": {
        "zh_country": "多米尼加",
        "zh_currency_full": "多米尼加比索",
        "zh_currency_abbr": "比索",
        "en_country": "Dominican Republic",
        "en_currency_full": "Dominican Peso",
        "en_currency_abbr": "DOP"
    },
    "DZD": {
        "zh_country": "阿尔及利亚",
        "zh_currency_full": "阿尔及利亚第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "Algeria",
        "en_currency_full": "Algerian Dinar",
        "en_currency_abbr": "DZD"
    },
    "EGP": {
        "zh_country": "埃及",
        "zh_currency_full": "埃及镑",
        "zh_currency_abbr": "埃及镑",
        "en_country": "Egypt",
        "en_currency_full": "Egyptian Pound",
        "en_currency_abbr": "EGP"
    },
    "ERN": {
        "zh_country": "厄立特里亚",
        "zh_currency_full": "厄立特里亚纳克法",
        "zh_currency_abbr": "纳克法",
        "en_country": "Eritrea",
        "en_currency_full": "Eritrean Nakfa",
        "en_currency_abbr": "ERN"
    },
    "ETB": {
        "zh_country": "埃塞俄比亚",
        "zh_currency_full": "埃塞俄比亚比尔",
        "zh_currency_abbr": "比尔",
        "en_country": "Ethiopia",
        "en_currency_full": "Ethiopian Birr",
        "en_currency_abbr": "ETB"
    },
        "AT": {
        "zh_country": "奥地利",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Austria",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "BE": {
        "zh_country": "比利时",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Belgium",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "CY": {
        "zh_country": "塞浦路斯",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Cyprus",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "EE": {
        "zh_country": "爱沙尼亚",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Estonia",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "FI": {
        "zh_country": "芬兰",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Finland",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "FR": {
        "zh_country": "法国",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "France",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "DE": {
        "zh_country": "德国",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Germany",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "GR": {
        "zh_country": "希腊",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Greece",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "IE": {
        "zh_country": "爱尔兰",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Ireland",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "IT": {
        "zh_country": "意大利",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Italy",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "LV": {
        "zh_country": "拉脱维亚",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Latvia",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "LT": {
        "zh_country": "立陶宛",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Lithuania",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "LU": {
        "zh_country": "卢森堡",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Luxembourg",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "MT": {
        "zh_country": "马耳他",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Malta",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "NL": {
        "zh_country": "荷兰",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Netherlands",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "PT": {
        "zh_country": "葡萄牙",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Portugal",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "SK": {
        "zh_country": "斯洛伐克",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Slovakia",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "SI": {
        "zh_country": "斯洛文尼亚",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Slovenia",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "ES": {
        "zh_country": "西班牙",
        "zh_currency_full": "欧元",
        "zh_currency_abbr": "欧元",
        "en_country": "Spain",
        "en_currency_full": "Euro",
        "en_currency_abbr": "EUR"
    },
    "FJD": {
        "zh_country": "斐济",
        "zh_currency_full": "斐济元",
        "zh_currency_abbr": "斐济元",
        "en_country": "Fiji",
        "en_currency_full": "Fijian Dollar",
        "en_currency_abbr": "FJD"
    },
    "FKP": {
        "zh_country": "福克兰群岛",
        "zh_currency_full": "福克兰群岛镑",
        "zh_currency_abbr": "福克兰群岛镑",
        "en_country": "Falkland Islands",
        "en_currency_full": "Falkland Islands Pound",
        "en_currency_abbr": "FKP"
    },
    "FOK": {
        "zh_country": "法罗群岛",
        "zh_currency_full": "法罗群岛克朗",
        "zh_currency_abbr": "克朗",
        "en_country": "Faroe Islands",
        "en_currency_full": "Faroese Króna",
        "en_currency_abbr": "FOK"
    },
    "GBP": {
        "zh_country": "英国",
        "zh_currency_full": "英镑",
        "zh_currency_abbr": "英镑",
        "en_country": "United Kingdom",
        "en_currency_full": "British Pound Sterling",
        "en_currency_abbr": "GBP"
    },
    "GEL": {
        "zh_country": "格鲁吉亚",
        "zh_currency_full": "格鲁吉亚拉里",
        "zh_currency_abbr": "拉里",
        "en_country": "Georgia",
        "en_currency_full": "Georgian Lari",
        "en_currency_abbr": "GEL"
    },
    "GGP": {
        "zh_country": "根西岛",
        "zh_currency_full": "根西岛镑",
        "zh_currency_abbr": "根西岛镑",
        "en_country": "Guernsey",
        "en_currency_full": "Guernsey Pound",
        "en_currency_abbr": "GGP"
    },
    "GHS": {
        "zh_country": "加纳",
        "zh_currency_full": "加纳塞地",
        "zh_currency_abbr": "塞地",
        "en_country": "Ghana",
        "en_currency_full": "Ghanaian Cedi",
        "en_currency_abbr": "GHS"
    },
    "GIP": {
        "zh_country": "直布罗陀",
        "zh_currency_full": "直布罗陀镑",
        "zh_currency_abbr": "直布罗陀镑",
        "en_country": "Gibraltar",
        "en_currency_full": "Gibraltar Pound",
        "en_currency_abbr": "GIP"
    },
    "GMD": {
        "zh_country": "冈比亚",
        "zh_currency_full": "冈比亚达拉西",
        "zh_currency_abbr": "达拉西",
        "en_country": "Gambia",
        "en_currency_full": "Gambian Dalasi",
        "en_currency_abbr": "GMD"
    },
    "GNF": {
        "zh_country": "几内亚",
        "zh_currency_full": "几内亚法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "Guinea",
        "en_currency_full": "Guinean Franc",
        "en_currency_abbr": "GNF"
    },
    "GTQ": {
        "zh_country": "危地马拉",
        "zh_currency_full": "危地马拉格查尔",
        "zh_currency_abbr": "格查尔",
        "en_country": "Guatemala",
        "en_currency_full": "Guatemalan Quetzal",
        "en_currency_abbr": "GTQ"
    },
    "GYD": {
        "zh_country": "圭亚那",
        "zh_currency_full": "圭亚那元",
        "zh_currency_abbr": "圭亚那元",
        "en_country": "Guyana",
        "en_currency_full": "Guyanese Dollar",
        "en_currency_abbr": "GYD"
    },
    "HKD": {
        "zh_country": "香港",
        "zh_currency_full": "港元",
        "zh_currency_abbr": "港元",
        "en_country": "Hong Kong",
        "en_currency_full": "Hong Kong Dollar",
        "en_currency_abbr": "HKD"
    },
    "HNL": {
        "zh_country": "洪都拉斯",
        "zh_currency_full": "洪都拉斯伦皮拉",
        "zh_currency_abbr": "伦皮拉",
        "en_country": "Honduras",
        "en_currency_full": "Honduran Lempira",
        "en_currency_abbr": "HNL"
    },
    "HRK": {
        "zh_country": "克罗地亚",
        "zh_currency_full": "克罗地亚库纳",
        "zh_currency_abbr": "库纳",
        "en_country": "Croatia",
        "en_currency_full": "Croatian Kuna",
        "en_currency_abbr": "HRK"
    },
    "HTG": {
        "zh_country": "海地",
        "zh_currency_full": "海地古德",
        "zh_currency_abbr": "古德",
        "en_country": "Haiti",
        "en_currency_full": "Haitian Gourde",
        "en_currency_abbr": "HTG"
    },
    "HUF": {
        "zh_country": "匈牙利",
        "zh_currency_full": "匈牙利福林",
        "zh_currency_abbr": "福林",
        "en_country": "Hungary",
        "en_currency_full": "Hungarian Forint",
        "en_currency_abbr": "HUF"
    },
    "IDR": {
        "zh_country": "印度尼西亚",
        "zh_currency_full": "印度尼西亚盾",
        "zh_currency_abbr": "盾",
        "en_country": "Indonesia",
        "en_currency_full": "Indonesian Rupiah",
        "en_currency_abbr": "IDR"
    },
    "ILS": {
        "zh_country": "以色列",
        "zh_currency_full": "以色列新谢克尔",
        "zh_currency_abbr": "新谢克尔",
        "en_country": "Israel",
        "en_currency_full": "Israeli New Shekel",
        "en_currency_abbr": "ILS"
    },
    "IMP": {
        "zh_country": "马恩岛",
        "zh_currency_full": "马恩岛镑",
        "zh_currency_abbr": "马恩岛镑",
        "en_country": "Isle of Man",
        "en_currency_full": "Isle of Man Pound",
        "en_currency_abbr": "IMP"
    },
    "INR": {
        "zh_country": "印度",
        "zh_currency_full": "印度卢比",
        "zh_currency_abbr": "卢比",
        "en_country": "India",
        "en_currency_full": "Indian Rupee",
        "en_currency_abbr": "INR"
    },
    "IQD": {
        "zh_country": "伊拉克",
        "zh_currency_full": "伊拉克第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "Iraq",
        "en_currency_full": "Iraqi Dinar",
        "en_currency_abbr": "IQD"
    },
    "IRR": {
        "zh_country": "伊朗",
        "zh_currency_full": "伊朗里亚尔",
        "zh_currency_abbr": "里亚尔",
        "en_country": "Iran",
        "en_currency_full": "Iranian Rial",
        "en_currency_abbr": "IRR"
    },
    "ISK": {
        "zh_country": "冰岛",
        "zh_currency_full": "冰岛克朗",
        "zh_currency_abbr": "克朗",
        "en_country": "Iceland",
        "en_currency_full": "Icelandic Króna",
        "en_currency_abbr": "ISK"
    },
    "JEP": {
        "zh_country": "泽西岛",
        "zh_currency_full": "泽西岛镑",
        "zh_currency_abbr": "泽西岛镑",
        "en_country": "Jersey",
        "en_currency_full": "Jersey Pound",
        "en_currency_abbr": "JEP"
    },
    "JMD": {
        "zh_country": "牙买加",
        "zh_currency_full": "牙买加元",
        "zh_currency_abbr": "牙买加元",
        "en_country": "Jamaica",
        "en_currency_full": "Jamaican Dollar",
        "en_currency_abbr": "JMD"
    },
    "JOD": {
        "zh_country": "约旦",
        "zh_currency_full": "约旦第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "Jordan",
        "en_currency_full": "Jordanian Dinar",
        "en_currency_abbr": "JOD"
    },
    "JPY": {
        "zh_country": "日本",
        "zh_currency_full": "日元",
        "zh_currency_abbr": "日元",
        "en_country": "Japan",
        "en_currency_full": "Japanese Yen",
        "en_currency_abbr": "JPY"
    },
    "KES": {
        "zh_country": "肯尼亚",
        "zh_currency_full": "肯尼亚先令",
        "zh_currency_abbr": "先令",
        "en_country": "Kenya",
        "en_currency_full": "Kenyan Shilling",
        "en_currency_abbr": "KES"
    },
    "KGS": {
        "zh_country": "吉尔吉斯斯坦",
        "zh_currency_full": "吉尔吉斯斯坦索姆",
        "zh_currency_abbr": "索姆",
        "en_country": "Kyrgyzstan",
        "en_currency_full": "Kyrgyzstani Som",
        "en_currency_abbr": "KGS"
    },
    "KHR": {
        "zh_country": "柬埔寨",
        "zh_currency_full": "柬埔寨瑞尔",
        "zh_currency_abbr": "瑞尔",
        "en_country": "Cambodia",
        "en_currency_full": "Cambodian Riel",
        "en_currency_abbr": "KHR"
    },
    "KID": {
        "zh_country": "基里巴斯",
        "zh_currency_full": "基里巴斯元",
        "zh_currency_abbr": "基里巴斯元",
        "en_country": "Kiribati",
        "en_currency_full": "Kiribati Dollar",
        "en_currency_abbr": "KID"
    },
    "KMF": {
        "zh_country": "科摩罗",
        "zh_currency_full": "科摩罗法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "Comoros",
        "en_currency_full": "Comorian Franc",
        "en_currency_abbr": "KMF"
    },
    "KRW": {
        "zh_country": "韩国",
        "zh_currency_full": "韩国圆",
        "zh_currency_abbr": "圆",
        "en_country": "South Korea",
        "en_currency_full": "South Korean Won",
        "en_currency_abbr": "KRW"
    },
    "KWD": {
        "zh_country": "科威特",
        "zh_currency_full": "科威特第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "Kuwait",
        "en_currency_full": "Kuwaiti Dinar",
        "en_currency_abbr": "KWD"
    },
    "KYD": {
        "zh_country": "开曼群岛",
        "zh_currency_full": "开曼群岛元",
        "zh_currency_abbr": "元",
        "en_country": "Cayman Islands",
        "en_currency_full": "Cayman Islands Dollar",
        "en_currency_abbr": "KYD"
    },
    "KZT": {
        "zh_country": "哈萨克斯坦",
        "zh_currency_full": "哈萨克斯坦腾格",
        "zh_currency_abbr": "腾格",
        "en_country": "Kazakhstan",
        "en_currency_full": "Kazakhstani Tenge",
        "en_currency_abbr": "KZT"
    },
    "LAK": {
        "zh_country": "老挝",
        "zh_currency_full": "老挝基普",
        "zh_currency_abbr": "基普",
        "en_country": "Laos",
        "en_currency_full": "Lao Kip",
        "en_currency_abbr": "LAK"
    },
    "LBP": {
        "zh_country": "黎巴嫩",
        "zh_currency_full": "黎巴嫩镑",
        "zh_currency_abbr": "黎巴嫩镑",
        "en_country": "Lebanon",
        "en_currency_full": "Lebanese Pound",
        "en_currency_abbr": "LBP"
    },
    "LKR": {
        "zh_country": "斯里兰卡",
        "zh_currency_full": "斯里兰卡卢比",
        "zh_currency_abbr": "卢比",
        "en_country": "Sri Lanka",
        "en_currency_full": "Sri Lankan Rupee",
        "en_currency_abbr": "LKR"
    },
    "LRD": {
        "zh_country": "利比里亚",
        "zh_currency_full": "利比里亚元",
        "zh_currency_abbr": "元",
        "en_country": "Liberia",
        "en_currency_full": "Liberian Dollar",
        "en_currency_abbr": "LRD"
    },
    "LSL": {
        "zh_country": "莱索托",
        "zh_currency_full": "莱索托洛蒂",
        "zh_currency_abbr": "洛蒂",
        "en_country": "Lesotho",
        "en_currency_full": "Lesotho Loti",
        "en_currency_abbr": "LSL"
    },
    "LYD": {
        "zh_country": "利比亚",
        "zh_currency_full": "利比亚第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "Libya",
        "en_currency_full": "Libyan Dinar",
        "en_currency_abbr": "LYD"
    },
    "MAD": {
        "zh_country": "摩洛哥",
        "zh_currency_full": "摩洛哥迪拉姆",
        "zh_currency_abbr": "迪拉姆",
        "en_country": "Morocco",
        "en_currency_full": "Moroccan Dirham",
        "en_currency_abbr": "MAD"
    },
    "MDL": {
        "zh_country": "摩尔多瓦",
        "zh_currency_full": "摩尔多瓦列伊",
        "zh_currency_abbr": "列伊",
        "en_country": "Moldova",
        "en_currency_full": "Moldovan Leu",
        "en_currency_abbr": "MDL"
    },
    "MGA": {
        "zh_country": "马达加斯加",
        "zh_currency_full": "马达加斯加阿里亚里",
        "zh_currency_abbr": "阿里亚里",
        "en_country": "Madagascar",
        "en_currency_full": "Malagasy Ariary",
        "en_currency_abbr": "MGA"
    },
    "MKD": {
        "zh_country": "北马其顿",
        "zh_currency_full": "北马其顿第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "North Macedonia",
        "en_currency_full": "Macedonian Denar",
        "en_currency_abbr": "MKD"
    },
    "MMK": {
        "zh_country": "缅甸",
        "zh_currency_full": "缅甸元",
        "zh_currency_abbr": "缅元",
        "en_country": "Myanmar",
        "en_currency_full": "Burmese Kyat",
        "en_currency_abbr": "MMK"
    },
    "MNT": {
        "zh_country": "蒙古",
        "zh_currency_full": "蒙古图格里克",
        "zh_currency_abbr": "图格里克",
        "en_country": "Mongolia",
        "en_currency_full": "Mongolian Tögrög",
        "en_currency_abbr": "MNT"
    },
    "MOP": {
        "zh_country": "澳门",
        "zh_currency_full": "澳门元",
        "zh_currency_abbr": "澳元",
        "en_country": "Macau",
        "en_currency_full": "Macanese Pataca",
        "en_currency_abbr": "MOP"
    },
    "MRU": {
        "zh_country": "毛里塔尼亚",
        "zh_currency_full": "毛里塔尼亚乌吉亚",
        "zh_currency_abbr": "乌吉亚",
        "en_country": "Mauritania",
        "en_currency_full": "Mauritanian Ouguiya",
        "en_currency_abbr": "MRU"
    },
    "MUR": {
        "zh_country": "毛里求斯",
        "zh_currency_full": "毛里求斯卢比",
        "zh_currency_abbr": "卢比",
        "en_country": "Mauritius",
        "en_currency_full": "Mauritian Rupee",
        "en_currency_abbr": "MUR"
    },
    "MVR": {
        "zh_country": "马尔代夫",
        "zh_currency_full": "马尔代夫拉菲亚",
        "zh_currency_abbr": "拉菲亚",
        "en_country": "Maldives",
        "en_currency_full": "Maldivian Rufiyaa",
        "en_currency_abbr": "MVR"
    },
    "MWK": {
        "zh_country": "马拉维",
        "zh_currency_full": "马拉维克瓦查",
        "zh_currency_abbr": "克瓦查",
        "en_country": "Malawi",
        "en_currency_full": "Malawian Kwacha",
        "en_currency_abbr": "MWK"
    },
    "MXN": {
        "zh_country": "墨西哥",
        "zh_currency_full": "墨西哥比索",
        "zh_currency_abbr": "比索",
        "en_country": "Mexico",
        "en_currency_full": "Mexican Peso",
        "en_currency_abbr": "MXN"
    },
    "MYR": {
        "zh_country": "马来西亚",
        "zh_currency_full": "马来西亚林吉特",
        "zh_currency_abbr": "林吉特",
        "en_country": "Malaysia",
        "en_currency_full": "Malaysian Ringgit",
        "en_currency_abbr": "MYR"
    },
    "MZN": {
        "zh_country": "莫桑比克",
        "zh_currency_full": "莫桑比克梅蒂卡尔",
        "zh_currency_abbr": "梅蒂卡尔",
        "en_country": "Mozambique",
        "en_currency_full": "Mozambican Metical",
        "en_currency_abbr": "MZN"
    },
    "NAD": {
        "zh_country": "纳米比亚",
        "zh_currency_full": "纳米比亚元",
        "zh_currency_abbr": "纳米元",
        "en_country": "Namibia",
        "en_currency_full": "Namibian Dollar",
        "en_currency_abbr": "NAD"
    },
    "NGN": {
        "zh_country": "尼日利亚",
        "zh_currency_full": "尼日利亚奈拉",
        "zh_currency_abbr": "奈拉",
        "en_country": "Nigeria",
        "en_currency_full": "Nigerian Naira",
        "en_currency_abbr": "NGN"
    },
    "NIO": {
        "zh_country": "尼加拉瓜",
        "zh_currency_full": "尼加拉瓜科多巴",
        "zh_currency_abbr": "科多巴",
        "en_country": "Nicaragua",
        "en_currency_full": "Nicaraguan Córdoba",
        "en_currency_abbr": "NIO"
    },
    "NOK": {
        "zh_country": "挪威",
        "zh_currency_full": "挪威克朗",
        "zh_currency_abbr": "克朗",
        "en_country": "Norway",
        "en_currency_full": "Norwegian Krone",
        "en_currency_abbr": "NOK"
    },
    "NPR": {
        "zh_country": "尼泊尔",
        "zh_currency_full": "尼泊尔卢比",
        "zh_currency_abbr": "卢比",
        "en_country": "Nepal",
        "en_currency_full": "Nepalese Rupee",
        "en_currency_abbr": "NPR"
    },
    "NZD": {
        "zh_country": "新西兰",
        "zh_currency_full": "新西兰元",
        "zh_currency_abbr": "纽元",
        "en_country": "New Zealand",
        "en_currency_full": "New Zealand Dollar",
        "en_currency_abbr": "NZD"
    },
    "OMR": {
        "zh_country": "阿曼",
        "zh_currency_full": "阿曼里亚尔",
        "zh_currency_abbr": "里亚尔",
        "en_country": "Oman",
        "en_currency_full": "Omani Rial",
        "en_currency_abbr": "OMR"
    },
    "PAB": {
        "zh_country": "巴拿马",
        "zh_currency_full": "巴拿马巴尔博亚",
        "zh_currency_abbr": "巴尔博亚",
        "en_country": "Panama",
        "en_currency_full": "Panamanian Balboa",
        "en_currency_abbr": "PAB"
    },
    "PEN": {
        "zh_country": "秘鲁",
        "zh_currency_full": "秘鲁新索尔",
        "zh_currency_abbr": "索尔",
        "en_country": "Peru",
        "en_currency_full": "Peruvian Sol",
        "en_currency_abbr": "PEN"
    },
    "PGK": {
        "zh_country": "巴布亚新几内亚",
        "zh_currency_full": "巴布亚新几内亚基那",
        "zh_currency_abbr": "基那",
        "en_country": "Papua New Guinea",
        "en_currency_full": "Papua New Guinean Kina",
        "en_currency_abbr": "PGK"
    },
    "PHP": {
        "zh_country": "菲律宾",
        "zh_currency_full": "菲律宾比索",
        "zh_currency_abbr": "比索",
        "en_country": "Philippines",
        "en_currency_full": "Philippine Peso",
        "en_currency_abbr": "PHP"
    },
    "PKR": {
        "zh_country": "巴基斯坦",
        "zh_currency_full": "巴基斯坦卢比",
        "zh_currency_abbr": "卢比",
        "en_country": "Pakistan",
        "en_currency_full": "Pakistani Rupee",
        "en_currency_abbr": "PKR"
    },
    "PLN": {
        "zh_country": "波兰",
        "zh_currency_full": "波兰兹罗提",
        "zh_currency_abbr": "兹罗提",
        "en_country": "Poland",
        "en_currency_full": "Polish Złoty",
        "en_currency_abbr": "PLN"
    },
    "PYG": {
        "zh_country": "巴拉圭",
        "zh_currency_full": "巴拉圭瓜拉尼",
        "zh_currency_abbr": "瓜拉尼",
        "en_country": "Paraguay",
        "en_currency_full": "Paraguayan Guaraní",
        "en_currency_abbr": "PYG"
    },
    "QAR": {
        "zh_country": "卡塔尔",
        "zh_currency_full": "卡塔尔里亚尔",
        "zh_currency_abbr": "里亚尔",
        "en_country": "Qatar",
        "en_currency_full": "Qatari Riyal",
        "en_currency_abbr": "QAR"
    },
    "RON": {
        "zh_country": "罗马尼亚",
        "zh_currency_full": "罗马尼亚列伊",
        "zh_currency_abbr": "列伊",
        "en_country": "Romania",
        "en_currency_full": "Romanian Leu",
        "en_currency_abbr": "RON"
    },
    "RSD": {
        "zh_country": "塞尔维亚",
        "zh_currency_full": "塞尔维亚第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "Serbia",
        "en_currency_full": "Serbian Dinar",
        "en_currency_abbr": "RSD"
    },
    "RUB": {
        "zh_country": "俄罗斯",
        "zh_currency_full": "俄罗斯卢布",
        "zh_currency_abbr": "卢布",
        "en_country": "Russia",
        "en_currency_full": "Russian Ruble",
        "en_currency_abbr": "RUB"
    },
    "RWF": {
        "zh_country": "卢旺达",
        "zh_currency_full": "卢旺达法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "Rwanda",
        "en_currency_full": "Rwandan Franc",
        "en_currency_abbr": "RWF"
    },
    "SAR": {
        "zh_country": "沙特阿拉伯",
        "zh_currency_full": "沙特里亚尔",
        "zh_currency_abbr": "里亚尔",
        "en_country": "Saudi Arabia",
        "en_currency_full": "Saudi Riyal",
        "en_currency_abbr": "SAR"
    },
    "SBD": {
        "zh_country": "所罗门群岛",
        "zh_currency_full": "所罗门群岛元",
        "zh_currency_abbr": "所罗门群岛元",
        "en_country": "Solomon Islands",
        "en_currency_full": "Solomon Islands Dollar",
        "en_currency_abbr": "SBD"
    },
    "SCR": {
        "zh_country": "塞舌尔",
        "zh_currency_full": "塞舌尔卢比",
        "zh_currency_abbr": "卢比",
        "en_country": "Seychelles",
        "en_currency_full": "Seychellois Rupee",
        "en_currency_abbr": "SCR"
    },
    "SDG": {
        "zh_country": "苏丹",
        "zh_currency_full": "苏丹镑",
        "zh_currency_abbr": "苏丹镑",
        "en_country": "Sudan",
        "en_currency_full": "Sudanese Pound",
        "en_currency_abbr": "SDG"
    },
    "SEK": {
        "zh_country": "瑞典",
        "zh_currency_full": "瑞典克朗",
        "zh_currency_abbr": "克朗",
        "en_country": "Sweden",
        "en_currency_full": "Swedish Krona",
        "en_currency_abbr": "SEK"
    },
    "SGD": {
        "zh_country": "新加坡",
        "zh_currency_full": "新加坡元",
        "zh_currency_abbr": "新元",
        "en_country": "Singapore",
        "en_currency_full": "Singapore Dollar",
        "en_currency_abbr": "SGD"
    },
    "SHP": {
        "zh_country": "圣赫勒拿",
        "zh_currency_full": "圣赫勒拿镑",
        "zh_currency_abbr": "圣赫勒拿镑",
        "en_country": "Saint Helena",
        "en_currency_full": "Saint Helena Pound",
        "en_currency_abbr": "SHP"
    },
    "SLL": {
        "zh_country": "塞拉利昂",
        "zh_currency_full": "塞拉利昂利昂",
        "zh_currency_abbr": "利昂",
        "en_country": "Sierra Leone",
        "en_currency_full": "Sierra Leonean Leone",
        "en_currency_abbr": "SLL"
    },
    "SOS": {
        "zh_country": "索马里",
        "zh_currency_full": "索马里先令",
        "zh_currency_abbr": "先令",
        "en_country": "Somalia",
        "en_currency_full": "Somali Shilling",
        "en_currency_abbr": "SOS"
    },
    "SRD": {
        "zh_country": "苏里南",
        "zh_currency_full": "苏里南元",
        "zh_currency_abbr": "苏里南元",
        "en_country": "Suriname",
        "en_currency_full": "Surinamese Dollar",
        "en_currency_abbr": "SRD"
    },
    "SSP": {
        "zh_country": "南苏丹",
        "zh_currency_full": "南苏丹镑",
        "zh_currency_abbr": "南苏丹镑",
        "en_country": "South Sudan",
        "en_currency_full": "South Sudanese Pound",
        "en_currency_abbr": "SSP"
    },
    "STN": {
        "zh_country": "圣多美和普林西比",
        "zh_currency_full": "圣多美和普林西比多布拉",
        "zh_currency_abbr": "多布拉",
        "en_country": "São Tomé and Príncipe",
        "en_currency_full": "São Tomé and Príncipe Dobra",
        "en_currency_abbr": "STN"
    },
    "SYP": {
        "zh_country": "叙利亚",
        "zh_currency_full": "叙利亚镑",
        "zh_currency_abbr": "叙利亚镑",
        "en_country": "Syria",
        "en_currency_full": "Syrian Pound",
        "en_currency_abbr": "SYP"
    },
    "SZL": {
        "zh_country": "斯威士兰",
        "zh_currency_full": "斯威士兰里兰吉尼",
        "zh_currency_abbr": "里兰吉尼",
        "en_country": "Eswatini",
        "en_currency_full": "Eswatini Lilangeni",
        "en_currency_abbr": "SZL"
    },
    "THB": {
        "zh_country": "泰国",
        "zh_currency_full": "泰铢",
        "zh_currency_abbr": "泰铢",
        "en_country": "Thailand",
        "en_currency_full": "Thai Baht",
        "en_currency_abbr": "THB"
    },
    "TJS": {
        "zh_country": "塔吉克斯坦",
        "zh_currency_full": "塔吉克斯坦索莫尼",
        "zh_currency_abbr": "索莫尼",
        "en_country": "Tajikistan",
        "en_currency_full": "Tajikistani Somoni",
        "en_currency_abbr": "TJS"
    },
    "TMT": {
        "zh_country": "土库曼斯坦",
        "zh_currency_full": "土库曼斯坦马纳特",
        "zh_currency_abbr": "马纳特",
        "en_country": "Turkmenistan",
        "en_currency_full": "Turkmenistani Manat",
        "en_currency_abbr": "TMT"
    },
    "TND": {
        "zh_country": "突尼斯",
        "zh_currency_full": "突尼斯第纳尔",
        "zh_currency_abbr": "第纳尔",
        "en_country": "Tunisia",
        "en_currency_full": "Tunisian Dinar",
        "en_currency_abbr": "TND"
    },
    "TOP": {
        "zh_country": "汤加",
        "zh_currency_full": "汤加潘加",
        "zh_currency_abbr": "潘加",
        "en_country": "Tonga",
        "en_currency_full": "Tongan Paʻanga",
        "en_currency_abbr": "TOP"
    },
    "TRY": {
        "zh_country": "土耳其",
        "zh_currency_full": "土耳其里拉",
        "zh_currency_abbr": "里拉",
        "en_country": "Turkey",
        "en_currency_full": "Turkish Lira",
        "en_currency_abbr": "TRY"
    },
    "TTD": {
        "zh_country": "特立尼达和多巴哥",
        "zh_currency_full": "特立尼达和多巴哥元",
        "zh_currency_abbr": "特立尼达和多巴哥元",
        "en_country": "Trinidad and Tobago",
        "en_currency_full": "Trinidad and Tobago Dollar",
        "en_currency_abbr": "TTD"
    },
    "TVD": {
        "zh_country": "图瓦卢",
        "zh_currency_full": "图瓦卢元",
        "zh_currency_abbr": "图瓦卢元",
        "en_country": "Tuvalu",
        "en_currency_full": "Tuvaluan Dollar",
        "en_currency_abbr": "TVD"
    },
    "TWD": {
        "zh_country": "台湾",
        "zh_currency_full": "新台币",
        "zh_currency_abbr": "新台币",
        "en_country": "Taiwan",
        "en_currency_full": "New Taiwan Dollar",
        "en_currency_abbr": "TWD"
    },
    "TZS": {
        "zh_country": "坦桑尼亚",
        "zh_currency_full": "坦桑尼亚先令",
        "zh_currency_abbr": "先令",
        "en_country": "Tanzania",
        "en_currency_full": "Tanzanian Shilling",
        "en_currency_abbr": "TZS"
    },
    "UAH": {
        "zh_country": "乌克兰",
        "zh_currency_full": "乌克兰赫夫纳",
        "zh_currency_abbr": "赫夫纳",
        "en_country": "Ukraine",
        "en_currency_full": "Ukrainian Hryvnia",
        "en_currency_abbr": "UAH"
    },
    "UGX": {
        "zh_country": "乌干达",
        "zh_currency_full": "乌干达先令",
        "zh_currency_abbr": "先令",
        "en_country": "Uganda",
        "en_currency_full": "Ugandan Shilling",
        "en_currency_abbr": "UGX"
    },
    "USD": {
        "zh_country": "美国",
        "zh_currency_full": "美元",
        "zh_currency_abbr": "美元",
        "en_country": "United States",
        "en_currency_full": "United States Dollar",
        "en_currency_abbr": "USD"
    },
    "UYU": {
        "zh_country": "乌拉圭",
        "zh_currency_full": "乌拉圭比索",
        "zh_currency_abbr": "比索",
        "en_country": "Uruguay",
        "en_currency_full": "Uruguayan Peso",
        "en_currency_abbr": "UYU"
    },
    "UZS": {
        "zh_country": "乌兹别克斯坦",
        "zh_currency_full": "乌兹别克斯坦苏姆",
        "zh_currency_abbr": "苏姆",
        "en_country": "Uzbekistan",
        "en_currency_full": "Uzbekistani Som",
        "en_currency_abbr": "UZS"
    },
    "VES": {
        "zh_country": "委内瑞拉",
        "zh_currency_full": "委内瑞拉玻利瓦尔",
        "zh_currency_abbr": "玻利瓦尔",
        "en_country": "Venezuela",
        "en_currency_full": "Venezuelan Bolívar",
        "en_currency_abbr": "VES"
    },
    "VND": {
        "zh_country": "越南",
        "zh_currency_full": "越南盾",
        "zh_currency_abbr": "越南盾",
        "en_country": "Vietnam",
        "en_currency_full": "Vietnamese Đồng",
        "en_currency_abbr": "VND"
    },
    "VUV": {
        "zh_country": "瓦努阿图",
        "zh_currency_full": "瓦努阿图瓦图",
        "zh_currency_abbr": "瓦图",
        "en_country": "Vanuatu",
        "en_currency_full": "Vanuatu Vatu",
        "en_currency_abbr": "VUV"
    },
    "WST": {
        "zh_country": "萨摩亚",
        "zh_currency_full": "萨摩亚塔拉",
        "zh_currency_abbr": "塔拉",
        "en_country": "Samoa",
        "en_currency_full": "Samoan Tālā",
        "en_currency_abbr": "WST"
    },
    "XAF": {
        "zh_country": "中非共和国",
        "zh_currency_full": "中非法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "Central African Republic",
        "en_currency_full": "Central African CFA Franc",
        "en_currency_abbr": "XAF"
    },
    "XCD": {
        "zh_country": "东加勒比国家组织",
        "zh_currency_full": "东加勒比元",
        "zh_currency_abbr": "东加勒比元",
        "en_country": "Eastern Caribbean",
        "en_currency_full": "East Caribbean Dollar",
        "en_currency_abbr": "XCD"
    },
        "XOF": {
        "zh_country": "西非国家经济共同体",
        "zh_currency_full": "西非法郎",
        "zh_currency_abbr": "法郎",
        "en_country": "West African Economic and Monetary Union",
        "en_currency_full": "West African CFA Franc",
        "en_currency_abbr": "XOF"
    },
    "XPF": {
        "zh_country": "法属波利尼西亚",
        "zh_currency_full": "太平洋法郎",
        "zh_currency_abbr": "太平洋法郎",
        "en_country": "French Polynesia",
        "en_currency_full": "CFP Franc",
        "en_currency_abbr": "XPF"
    },
    "YER": {
        "zh_country": "也门",
        "zh_currency_full": "也门里亚尔",
        "zh_currency_abbr": "里亚尔",
        "en_country": "Yemen",
        "en_currency_full": "Yemeni Rial",
        "en_currency_abbr": "YER"
    },
    "ZAR": {
        "zh_country": "南非",
        "zh_currency_full": "南非兰特",
        "zh_currency_abbr": "兰特",
        "en_country": "South Africa",
        "en_currency_full": "South African Rand",
        "en_currency_abbr": "ZAR"
    },
    "ZMW": {
        "zh_country": "赞比亚",
        "zh_currency_full": "赞比亚克瓦查",
        "zh_currency_abbr": "克瓦查",
        "en_country": "Zambia",
        "en_currency_full": "Zambian Kwacha",
        "en_currency_abbr": "ZMW"
    },
    "ZWL": {
        "zh_country": "津巴布韦",
        "zh_currency_full": "津巴布韦元",
        "zh_currency_abbr": "津巴布韦元",
        "en_country": "Zimbabwe",
        "en_currency_full": "Zimbabwean Dollar",
        "en_currency_abbr": "ZWL"
    }
};

function searchCurrency(input) {
    const searchResults = {};
    for (const code in currencyData) {
        const currency = currencyData[code];
        for (const key in currency) {
            if (currency[key].toLowerCase().includes(input.toLowerCase())) {
                searchResults[code] = currency;
                break;
            }
        }
    }
    return searchResults;
}

// 导出模块
module.exports = { currencyData, searchCurrency, calendar, installation };

/* 示例查询，使用方法
const { currencyData, searchCurrency } = importModule('Money Code Exchange')
导入方法
console.log(searchCurrency("迪拉姆"));查询中文全称，返回AED
console.log(searchCurrency("阿联酋"));查询中文缩写，返回AED
console.log(searchCurrency("AED"));查询英文缩写，返回阿联酋迪拉姆
console.log(currencyData)
查询全部
*/
