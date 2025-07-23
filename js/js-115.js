// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: people-carry;
this.name = "考勤记录";
this.widget_ID = "js-115";
this.version = "v1.3";

const fm = FileManager.local();
const settingsPath = fm.joinPath(fm.documentsDirectory(), "settings.json");
const recordsPath = fm.joinPath(fm.documentsDirectory(), "records.json");

const defaultSettings = {
  baseSalary: 2200,
  Housing_allowance: 250,
  attendance: 50,
  rateWeekday: 1.5,
  rateSaturday: 1.5,
  rateSunday: 2.0,
  method: "daily",
  dateRangeMode: "natural",
  fromDay: 11,
  toDay: 12,
  weekHours: 40,
  customFields: {}
};

const fixed = [
  { k: "baseSalary", l: "底薪" },
  { k: "Housing_allowance", l: "住房津贴" },
  { k: "attendance", l: "全勤奖" },
  { k: "rateWeekday", l: "工作日(倍)" },
  { k: "rateSaturday", l: "星期六(倍)" },
  { k: "rateSunday", l: "星期日(倍)" }
];

let settings, records;
function loadData() {
  if (!fm.fileExists(settingsPath)) {
    fm.writeString(settingsPath, JSON.stringify(defaultSettings, null, 2));
  }
  if (!fm.fileExists(recordsPath)) {
    fm.writeString(recordsPath, JSON.stringify({}, null, 2));
  }
  settings = JSON.parse(fm.readString(settingsPath));
  records = JSON.parse(fm.readString(recordsPath));
}
loadData();

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

const webView = new WebView();

async function loadHTML() {
  const inj = { settings, records, currentYear, currentMonth };
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
body { 
  font-family: -apple-system; 
  padding: 1em; 
  margin: 0;
  -webkit-text-size-adjust: 100%;
}
.calendar { 
  display: grid; 
  grid-template-columns: repeat(7, 1fr); 
  gap: 4px; 
  margin-top: 12px; 
}
.day { 
  padding: 6px; 
  border: 1px solid #ccc; 
  text-align: center; 
  font-size: 18px; 
  cursor: pointer;
  min-height: 40px;
  box-sizing: border-box;
}
.sun, .sat { color: red }
.title { 
  font-size: 22px; 
  text-align: center; 
  margin: 1em 0;
  font-weight: bold;
}
.nav-btn, .settings-btn, .btn {
  background: #007AFF; 
  color: #fff; 
  padding: 8px 12px; 
  border: none;
  border-radius: 5px; 
  cursor: pointer; 
  font-size: 14px; 
  margin: 4px;
}
.btn-danger { 
  background: #d33;
}
#stat { 
  position: fixed; 
  bottom: 78px; 
  left: 50%; 
  transform: translateX(-50%); 
  width: 87%; 
  background: #fff; 
  border: 1px solid #ccc; 
  padding: 12px; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.2); 
  font-size: 16px;
  border-radius: 8px;
}
.salary-tag {
  position: fixed;
  bottom: 100px;
  right: 30px;
  transform: rotate(0deg);
  transform-origin: right bottom;
  background: #4CAF50;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 22px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  white-space: nowrap;
}
#inputBox {
  display: none;
  position: fixed;
  width: 80%;
  max-width: 300px;
  left: 50%;
  top: 30%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 999;
  box-sizing: border-box;
}
#inputBox .btn-row {
  display: flex;
  margin: 12px -3px 15px;
}
#settingsBox { 
  display: none; 
  position: fixed; 
  width: 90%; 
  height: 100%; 
  top: 50%; 
  left: 50%; 
  transform: translate(-50%, -50%); 
  background: #fff; 
  border: 1px solid #ccc; 
  border-radius: 10px; 
  padding: 1em; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
  overflow: auto; 
  z-index: 1000;
}
#batchEditBox {
  display: none;
  position: fixed;
  width: 80%;
  max-height: 80%;
  left: 10%;
  top: 15%;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 1em;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 1001;
  overflow-y: auto;
}
.batch-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.batch-edit-row {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}
.batch-edit-row span {
  margin-left: 8px;
}
.batch-edit-day {
  width: 35%;
  font-weight: bold;
  font-size: 14px;
}
.batch-edit-input {
  width: 40%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
#settingsBox label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
#settingsBox input, #settingsBox select {
  padding: 8px; 
  font-size: 14px;
  margin-bottom: 12px; 
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 4px;
}
#settingsBox input {
  width: 100%; 
}
#settingsBox select {
  width: 40%; 
}
#settingsTable { 
  width: 100%; 
  border-collapse: collapse;
  margin: 12px 0;
}
#settingsTable th, #settingsTable td {
  border: 1px solid #ccc; 
  padding: 8px;
  text-align: center; 
  font-size: 22px;
}
.calendar-header {
  display: grid; 
  grid-template-columns: repeat(7, 1fr);
  font-weight: bold; 
  text-align: center;
  margin-bottom: 8px;
}
.calendar-header div {
  font-size: 16px;
  padding: 6px 0;
}
#hourInput {
  width: calc(100% - 8px);
  padding: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}
.time-btn {
  flex: 1;
  padding: 8px 5px;
  margin: 0 3px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.time-btn:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.time-btn:active {
  background: #d0d0d0;
  transform: translateY(0);
}
#weekHours {
  width: 100px;
  display: block;
  margin-bottom: 15px;
}
/* iOS风格开关样式 */
.ios-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 30px;
}

.ios-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.ios-switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e0e0e0;
  transition: .4s;
  border-radius: 34px;
}

.ios-switch-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

input:checked + .ios-switch-slider {
  background-color: #34C759; /* iOS绿色 */
}

input:checked + .ios-switch-slider:before {
  transform: translateX(20px);
}

.ios-switch:active .ios-switch-slider:before {
  width: 30px;
}

select, input, label {
  vertical-align: middle;
  box-sizing: border-box;
  font-family: -apple-system, sans-serif;
  font-size: 14px;
}

label {
  line-height: 1.3;
  padding-bottom: 1px;
}
</style>
</head>
<body>

<div style="display:flex;justify-content:center;flex-wrap:wrap">
  <button class="nav-btn" onclick="prevMonth()">‹‹上月</button>
  <button class="nav-btn" onclick="goCurrentMonth()">当月</button>
  <button class="nav-btn" onclick="nextMonth()">下月››</button>
  <button class="settings-btn" onclick="openSettings()">设置</button>
  <button class="btn" onclick="openBatchEdit()">批量</button>
  <button class="btn" onclick="restartScript()" style="background:#4CAF50;">刷新</button>
</div>

<div class="title" id="monthTitle"></div>
<div class="calendar-header" id="weekHeader"></div>
<div class="calendar" id="calendar"></div>
<div id="stat"></div>

<!-- 单日添加弹窗和快捷数字 -->
<div id="inputBox">
  <div id="inputDate" style="font-weight:bold;margin-bottom:8px"></div>
  <div id="inputWeek" style="margin-bottom:8px;font-size:14px;"></div>
  <input type="number" id="hourInput" placeholder="输入加班小时" onchange="formatInput(this)">
  
  <div class="btn-row">
  <button class="time-btn" onclick="fillHours(0)">0小时</button>
    <button class="time-btn" onclick="fillHours(1)">1小时</button>
    <button class="time-btn" onclick="fillHours(2)">2小时</button>
    <button class="time-btn" onclick="fillHours(4)">4小时</button>
    <button class="time-btn" onclick="fillHours(8)">8小时</button>
  </div>
  
  <div style="display:flex;justify-content:flex-end">
    <button class="btn" onclick="saveHour()">保存</button>
    <button class="btn btn-danger" onclick="closeInput()" style="margin-left:10px">取消</button>
  </div>
</div>

<!-- 设置弹窗 -->
<div id="settingsBox">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:8px;">
    <h3 style="margin:0;">设置</h3>
    <button class="btn btn-danger" onclick="closeSettings()" style="padding:4px 8px; font-size:14px;">
      × 关闭
    </button>
  </div>
  
  <!-- iOS风格开关 -->
  <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f0f0f0; font-size: 22px;">
    <span>显示工资信息</span>
    <label class="ios-switch">
      <input type="checkbox" id="salaryToggle" checked>
      <span class="ios-switch-slider"></span>
    </label>
  </div>
  
<div style="display:flex; align-items:center; margin:15px 0; height:34px;">
  <div style="display:flex; align-items:center; margin-right:20px;">
    <label style="width:80px; display:flex; align-items:center; height:34px; margin:0; font-size: 18px;">周期模式:</label>
    <select id="modeSelect" onchange="toggleCustom()" 
            style="width:90px; height:34px; padding:6px 8px; margin:0;">
      <option value="natural">自然月</option>
      <option value="custom">非自然月</option>
    </select>
  </div>
  <div style="display:flex; align-items:center;">
    <label style="width:80px; display:flex; align-items:center; height:34px; margin:0; font-size: 18px;">周工作时:</label>
    <input type="number" id="weekHours" min="1" step="0.1" 
           style="width:90px; height:34px; padding:6px 8px; margin:0;">
  </div>
</div>

<div style="display:flex; align-items:center; margin-bottom:15px; height:34px;">
  <div style="display:flex; align-items:center; margin-right:20px;">
    <label style="width:80px; display:flex; align-items:center; height:34px; margin:0; font-size: 18px;">开始日期:</label>
    <select id="fromDay" style="width:90px; height:34px; padding:6px 8px; margin:0;"></select>
  </div>
  <div style="display:flex; align-items:center;">
    <label style="width:80px; display:flex; align-items:center; height:34px; margin:0; font-size: 18px;">结束日期:</label>
    <select id="toDay" style="width:90px; height:34px; padding:6px 8px; margin:0;"></select>
  </div>
</div>
  
  <table id="settingsTable">
    <thead>
      <tr>
        <th style="width:40%">名称</th>
        <th style="width:40%">数值</th>
        <th style="width:20%">操作</th>
      </tr>
    </thead>
    <tbody id="settingsBody"></tbody>
  </table>
  
  <div style="margin-top:15px">
    <button class="btn" onclick="addField()">+ 添加字段</button>
    <button class="btn" onclick="saveSettings()" style="margin-left:10px">✓ 保存</button>
    <button class="btn btn-danger" onclick="closeSettings()">× 关闭</button>
  </div>
</div>

<!-- 批量添加弹窗 -->
<div id="batchEditBox">
  <div class="batch-edit-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
    <h3 style="margin:0">批量添加加班时间</h3>
    <button onclick="closeBatchEdit()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#666;">
      &times; 关闭
    </button>
  </div>
  
  <div id="batchEditContent"></div>
  
  <div style="display:flex;justify-content:space-between;margin-top:15px">
    <button class="btn" onclick="saveBatchEdit()">保存全部</button>
    <button class="btn btn-danger" onclick="closeBatchEdit()">取消</button>
  </div>
</div>

<script>
let raw = ${JSON.stringify(inj)};

// 加班时间控制
function formatInput(input) {
  let value = parseFloat(input.value);
  if (isNaN(value)) value = 0;
  value = Math.min(10, Math.max(0, Math.round(value * 2) / 2));
  input.value = value % 1 === 0 ? value : value.toFixed(1);
}

// 初始化开关状态
document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('salaryToggle');
  
  // 从设置加载状态
  if (raw.settings.hasOwnProperty('showSalary')) {
    toggle.checked = raw.settings.showSalary;
  }
  
  // 添加切换事件
  toggle.addEventListener('change', function() {
    document.querySelectorAll('.salary-display').forEach(el => {
      el.style.display = this.checked ? 'block' : 'none';
    });
    
    // 保存设置
    raw.settings.showSalary = this.checked;
    window._result = JSON.stringify({ 
      type: 'save-settings', 
      settings: raw.settings 
    });
    
    if (this.checked) {
      this.parentElement.classList.add('active');
      setTimeout(() => this.parentElement.classList.remove('active'), 300);
    }
  });
});
// 苹果开关风格

function fillHours(hours) {
  const input = document.getElementById('hourInput');
  input.value = hours;
  input.focus();
  input.dispatchEvent(new Event('change')); 
}

function pad(n) { return ('' + n).padStart(2, '0'); }
function weekdayLabel(dt) {
  return ["日", "一", "二", "三", "四", "五", "六"][new Date(dt).getDay()];
}

function computeRange(year, month) {
  if (raw.settings.dateRangeMode === "natural") {
    return {
      start: year + '-' + pad(month + 1) + '-01',
      end: year + '-' + pad(month + 1) + '-' + pad(new Date(year, month + 1, 0).getDate())
    };
  } else {
    const fd = +raw.settings.fromDay;
    const td = +raw.settings.toDay;
    let startMonth, endMonth;
    
    if (fd <= td) {
      startMonth = month;
      endMonth = month;
    } else {
      startMonth = month;
      endMonth = (month + 1) % 12; 
    }

    const s = new Date(year, startMonth, fd);
    const e = new Date(
      endMonth === 0 ? year + 1 : year, 
      endMonth, 
      td
    );
    
    return {
      start: s.getFullYear() + '-' + pad(s.getMonth() + 1) + '-' + pad(s.getDate()),
      end: e.getFullYear() + '-' + pad(e.getMonth() + 1) + '-' + pad(e.getDate())
    };
  }
}

function calculateSalary() {
  const hourlyRate = (raw.settings.baseSalary * 12) / (raw.settings.weekHours * 52);
  const rng = computeRange(raw.currentYear, raw.currentMonth);
  let weekdayPay = 0, saturdayPay = 0, sundayPay = 0;

  for (let d = new Date(rng.start); d <= new Date(rng.end); d.setDate(d.getDate() + 1)) {
    const dt = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const w = d.getDay(), hrs = raw.records[dt]?.hours || 0;
    
    if (hrs > 0) {
      if (w === 0) {
        sundayPay += hrs * hourlyRate * raw.settings.rateSunday;
      } else if (w === 6) {
        saturdayPay += hrs * hourlyRate * raw.settings.rateSaturday;
      } else {
        weekdayPay += hrs * hourlyRate * raw.settings.rateWeekday;
      }
    }
  }

  const overtimePay = weekdayPay + saturdayPay + sundayPay;
  const customFieldsSum = Object.values(raw.settings.customFields).reduce((sum, val) => {
    const num = Number(val);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return {
    base: raw.settings.baseSalary,
    overtime: overtimePay,
    allowance: raw.settings.Housing_allowance || 0,
    attendance: raw.settings.attendance || 0,
    custom: customFieldsSum,
    get total() {
      return this.base + this.overtime + this.allowance + this.attendance + this.custom;
    },
    hourlyRate: hourlyRate
  };
}

function computeStats() {
  const rng = computeRange(raw.currentYear, raw.currentMonth);
  const sd = new Date(rng.start), ed = new Date(rng.end);
  let wday = 0, wsat = 0, wsun = 0, workdays = 0, totalDays = 0;
  
  for (let d = new Date(sd); d <= ed; d.setDate(d.getDate() + 1)) {
    totalDays++;
    const dt = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const w = d.getDay(), hrs = raw.records[dt]?.hours || 0;
    if (hrs > 0) {
      workdays++;
      if (w === 0) wsun += hrs;
      else if (w === 6) wsat += hrs;
      else wday += hrs;
    }
  }
  
  const unpaid = totalDays - workdays;
  const salary = calculateSalary();
  let showSalary = raw.settings?.showSalary !== false;
  
  let salaryTag = document.getElementById('salaryTag');
  if (!salaryTag) {
    salaryTag = document.createElement('div');
    salaryTag.id = 'salaryTag';
    salaryTag.className = 'salary-tag';
    document.body.appendChild(salaryTag);
  }
  salaryTag.style.display = 'block'; 
  
  function updateSalaryTag(visible) {
    salaryTag.textContent = \`总工资: $\${visible ? salary.total.toFixed(2) : '0000.00'}\`;
  }
  
  function getStatHTML(visible) {
  const { wday, wsat, wsun } = getOvertimeHours();
    return \`
      工作日@\${visible ? (salary.hourlyRate * raw.settings.rateWeekday).toFixed(2) : '00.00'}: \${wday}小时 | $\${visible ? (wday * salary.hourlyRate * raw.settings.rateWeekday).toFixed(2) : '0.00'}<br>
        星期六@\${visible ? (salary.hourlyRate * raw.settings.rateSaturday).toFixed(2) : '00.00'}: \${wsat}小时 | $\${visible ? (wsat * salary.hourlyRate * raw.settings.rateSaturday).toFixed(2) : '0.00'}<br>
        星期日@\${visible ? (salary.hourlyRate * raw.settings.rateSunday).toFixed(2) : '00.00'}: \${wsun}小时 | $\${visible ? (wsun * salary.hourlyRate * raw.settings.rateSunday).toFixed(2) : '0.00'}<br>
        基础薪资: $\${visible ? \`\${salary.base.toFixed(2)}\` : '0000.00'}<br>
        住房津贴: $\${visible ? \`\${salary.allowance.toFixed(2)}\` : '0.00'}<br>
        全勤奖金: $\${visible ? \`\${salary.attendance.toFixed(2)}\` : '0.00'}<br>
        其它项目: $\${visible ? \`\${salary.custom.toFixed(2)}\` : '0.00'}
    \`;
  }
  
  // 新增函数：从 raw.records 获取最新的加班时间
function getOvertimeHours() {
  const rng = computeRange(raw.currentYear, raw.currentMonth);
  let wday = 0, wsat = 0, wsun = 0;
  
  for (let d = new Date(rng.start); d <= new Date(rng.end); d.setDate(d.getDate() + 1)) {
    const dt = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const w = d.getDay(), hrs = raw.records[dt]?.hours || 0;
    
    if (hrs > 0) {
      if (w === 0) wsun += hrs;
      else if (w === 6) wsat += hrs;
      else wday += hrs;
    }
  }
  
  return { wday, wsat, wsun };
};
  
  updateSalaryTag(showSalary); 
  document.getElementById('stat').innerHTML = getStatHTML(showSalary);
  
  let salarySwitch = document.getElementById('salaryTagToggle');
  if (!salarySwitch) {
    const switchContainer = document.createElement('div');
    switchContainer.className = 'salary-switch';
    switchContainer.style = 'position: fixed; bottom: 210px; right: 20px; z-index: 101;';
    switchContainer.innerHTML = \`
      <label class="ios-switch">
        <input type="checkbox" id="salaryTagToggle">
        <span class="ios-switch-slider"></span>
      </label>
    \`;
    document.body.appendChild(switchContainer);
    salarySwitch = document.getElementById('salaryTagToggle');
    
    salarySwitch.addEventListener('change', function() {
      const isChecked = this.checked;
      const salary = calculateSalary();
      updateSalaryTag(isChecked, salary); 
      document.getElementById('stat').innerHTML = getStatHTML(isChecked, salary);
    });
  }
  salarySwitch.checked = showSalary;
}

function render() {
  const today = new Date();
  const todayStr = \`\${today.getFullYear()}-\${pad(today.getMonth() + 1)}-\${pad(today.getDate())}\`;
  const year = raw.currentYear, month = raw.currentMonth;
  const rng = computeRange(year, month);
  const startDate = new Date(rng.start);
  const endDate = new Date(rng.end);

  const title = raw.settings.dateRangeMode === "natural"
    ? year + '年 ' + (month + 1) + '月'
    : rng.start.slice(0, 7).replace('-', '年') + '月 ~ ' + rng.end.slice(0, 7).replace('-', '年') + '月';

  document.getElementById('monthTitle').textContent = title;

  const wh = document.getElementById('weekHeader');
  wh.innerHTML = '';
  ["日", "一", "二", "三", "四", "五", "六"].forEach((d, i) =>
    wh.innerHTML += (i === 0 || i === 6
      ? \`<div style="color:red;font-size:16px;">\${d}</div>\`
      : \`<div style="font-size:16px;">\${d}</div>\`)
  );

  const cal = document.getElementById('calendar');
  cal.innerHTML = "";

  const sw = startDate.getDay();
  for (let i = 0; i < sw; i++) cal.innerHTML += "<div></div>";

  const temp = new Date(startDate);
  while (temp <= endDate) {
    const dstr = \`\${temp.getFullYear()}-\${pad(temp.getMonth() + 1)}-\${pad(temp.getDate())}\`;
    const w = temp.getDay();
    const hrs = raw.records[dstr]?.hours || 0;
    
    const isToday = dstr === todayStr;
    const dayStyle = hrs > 0 
      ? \`background-color: #e6f7ff; border-color: \${isToday ? '#FF9500' : '#91d5ff'};\`
      
      : \`background-color: #f5f5f5; color: \${isToday ? '#FF9500' : '#ccc'};\`;
    
    cal.innerHTML += \`
      <div class="day \${w === 0 ? 'sun' : w === 6 ? 'sat' : ''}" 
           onclick="openInput('\${dstr}')"
           style="\${dayStyle}">
        \${temp.getDate()}<br>
        <span style="color:#666;font-size:14px">\${hrs}hrs</span>
      </div>\`;
    temp.setDate(temp.getDate() + 1);
  }

  computeStats();
}

function openInput(d) {
  document.getElementById('inputDate').textContent = d;
  document.getElementById('inputWeek').textContent = "星期" + weekdayLabel(d);
  document.getElementById('hourInput').value = raw.records[d]?.hours || '';
  document.getElementById('inputBox').style.display = 'block';
  document.getElementById('hourInput').focus();
}

function closeInput() {
  document.getElementById('inputBox').style.display = 'none';
}

function saveHour() {
  const d = document.getElementById('inputDate').textContent;
  let h = parseFloat(document.getElementById('hourInput').value);
  if (isNaN(h) || h < 0) h = 0;
  const w = new Date(d).getDay();
  const r = w === 0 ? raw.settings.rateSunday : 
            w === 6 ? raw.settings.rateSaturday : raw.settings.rateWeekday;
  
  if (h > 0) {
    raw.records[d] = { hours: h, rate: r };
  } else if (raw.records[d]) {
    delete raw.records[d];
  }
  
  window._result = JSON.stringify({ type: 'save-records', records: raw.records });
  closeInput();
  render();
}

// 批量添加功能
function openBatchEdit() {
  const rng = computeRange(raw.currentYear, raw.currentMonth);
  const content = document.getElementById('batchEditContent');
  content.innerHTML = '';
  
  for (let d = new Date(rng.start); d <= new Date(rng.end); d.setDate(d.getDate() + 1)) {
    const dt = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const w = d.getDay();
    const hrs = raw.records[dt]?.hours || 0;
    const dayName = ['周日','周一','周二','周三','周四','周五','周六'][w];
    const isWeekend = w === 0 || w === 6;
    
    content.innerHTML += \`
      <div class="batch-edit-row">
        <div class="batch-edit-day" style="color:\${isWeekend ? 'red' : 'inherit'}">\${dt.slice(5)} \${dayName}</div>
        <input type="number" class="batch-edit-input" data-date="\${dt}" value="\${hrs}" placeholder="0" onblur="formatInput(this)"><span>小时</span>
      </div>\`;
  }
  
  document.getElementById('batchEditBox').style.display = 'block';
}

function closeBatchEdit() {
  document.getElementById('batchEditBox').style.display = 'none';
}

function saveBatchEdit() {
  const inputs = document.querySelectorAll('.batch-edit-input');
  inputs.forEach(input => {
    const date = input.dataset.date;
    let hours = parseFloat(input.value) || 0;
    if (hours < 0) hours = 0;
    
    if (hours > 0) {
      const w = new Date(date).getDay();
      const rate = w === 0 ? raw.settings.rateSunday : 
                  w === 6 ? raw.settings.rateSaturday : raw.settings.rateWeekday;
      raw.records[date] = { hours, rate };
    } else if (raw.records[date]) {
      delete raw.records[date];
    }
  });
  
  window._result = JSON.stringify({ type: 'save-records', records: raw.records });
  closeBatchEdit();
  render();
}

function openSettings() {
  document.getElementById('settingsBox').style.display = 'block';
  document.getElementById('modeSelect').value = raw.settings.dateRangeMode;
  ['fromDay','toDay'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = Array.from({length:31}, (_,i) => \`<option value="\${i+1}">\${i+1}</option>\`).join("");
    sel.value = raw.settings[id];
  });
  document.getElementById('weekHours').value = raw.settings.weekHours;
  toggleCustom();
  loadFields();
}

function closeSettings() {
  document.getElementById('settingsBox').style.display = 'none';
}

function toggleCustom() {
  const mode = document.getElementById('modeSelect').value;
  document.getElementById('fromDay').disabled = mode !== 'custom';
  document.getElementById('toDay').disabled = mode !== 'custom';
}

function loadFields() {
  const tb = document.getElementById('settingsBody');
  tb.innerHTML = '';
  ${JSON.stringify(fixed)}.forEach(f => tb.insertAdjacentHTML('beforeend',
    \`<tr><td>\${f.l}</td><td><input type="text" data-k="\${f.k}" value="\${raw.settings[f.k]}"></td><td></td></tr>\`));
  for (let k in raw.settings.customFields) {
    tb.insertAdjacentHTML('beforeend',
      \`<tr><td><input type="text" data-k="custom:\${k}" value="\${k}"></td><td><input type="text" data-v="custom:\${k}" value="\${raw.settings.customFields[k]}"></td><td><button class="btn btn-danger" onclick="delField(this)">删</button></td></tr>\`);
  }
}

function addField() {
  document.getElementById('settingsBody').insertAdjacentHTML('beforeend',
    \`<tr><td><input type="text" placeholder="字段名"></td><td><input type="text" placeholder="金额"></td><td><button class="btn btn-danger" onclick="delField(this)">删</button></td></tr>\`);
}

function delField(btn) {
  const row = btn.closest('tr');
  const keyInput = row.querySelector('input[data-k]');
  
  if (keyInput && keyInput.dataset.k.startsWith('custom:')) {
    const fieldName = keyInput.dataset.k.replace('custom:', '');
    delete raw.settings.customFields[fieldName];
    row.remove();
    
    // 触发保存
    window._result = JSON.stringify({ 
      type: 'save-settings', 
      settings: raw.settings 
    });
  } else {
    row.remove();
  }
}

function saveSettings() {
  const mode = document.getElementById('modeSelect').value;
  const fd = +document.getElementById('fromDay').value;
  const td = +document.getElementById('toDay').value;
  const wh = +document.getElementById('weekHours').value || 48;
  const tb = document.getElementById('settingsBody').querySelectorAll('tr');
  const newS = { ...raw.settings, customFields: {}, dateRangeMode: mode, fromDay: fd, toDay: td, weekHours: wh };
  
  tb.forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs.length === 2) {
      const key = inputs[0].value.trim();
      const value = inputs[1].value.trim();
      if (key && value) {
        newS.customFields[key] = isNaN(value) ? value : parseFloat(value);
      }
    } else if (inputs.length === 1) {
      const key = inputs[0].dataset?.k;
      if (key) {
        const value = inputs[0].value;
        if (key.startsWith('custom:')) {
          newS.customFields[key.replace('custom:', '')] = isNaN(value) ? value : parseFloat(value);
        } else {
          newS[key] = isNaN(value) ? value : parseFloat(value);
        }
      }
    }
  });
  
  raw.settings = newS;
  window._result = JSON.stringify({ type: 'save-settings', settings: raw.settings });
  closeSettings();
  render();
}

function prevMonth() {
  raw.currentMonth = (raw.currentMonth + 11) % 12;
  if (raw.currentMonth === 11) raw.currentYear--;
  window._result = JSON.stringify({ type: 'change-month', year: raw.currentYear, month: raw.currentMonth });
  render();
}

function nextMonth() {
  raw.currentMonth = (raw.currentMonth + 1) % 12;
  if (raw.currentMonth === 0) raw.currentYear++;
  window._result = JSON.stringify({ type: 'change-month', year: raw.currentYear, month: raw.currentMonth });
  render();
}

function goCurrentMonth() {
  const now = new Date();
  raw.currentYear = now.getFullYear();
  raw.currentMonth = now.getMonth();
  window._result = JSON.stringify({ 
    type: 'change-month', 
    year: raw.currentYear, 
    month: raw.currentMonth 
  });
  render();
}

function restartScript() {
  window._result = JSON.stringify({
    type: 'restart-script',
  });
}

// 初始渲染
render();
</script>
</body>
</html>`;

  await webView.loadHTML(html);
  webView.present(true);
}

await loadHTML();

// Scriptable 后台监听 WebView 通信
const timer = new Timer();
timer.repeats = true;
timer.timeInterval = 200;
timer.schedule(async () => {
  const res = await webView.evaluateJavaScript("window._result", false);
  if (res) {
    await webView.evaluateJavaScript("window._result=null", false);
    const m = JSON.parse(res);
    if (m.type === "save-records") {
      records = m.records;
      fm.writeString(recordsPath, JSON.stringify(records, null, 2));
    } else if (m.type === "save-settings") {
      settings = m.settings;
      fm.writeString(settingsPath, JSON.stringify(settings, null, 2));
    } else if (m.type === "change-month") {
      currentYear = m.year;
      currentMonth = m.month;
    } else if (m.type === "restart-script") {
      Safari.open(`scriptable:///run/${encodeURIComponent(Script.name())}`);
    }
    
    loadData();
    await webView.evaluateJavaScript(`raw=${JSON.stringify({ settings, records, currentYear, currentMonth })}`, false);
    await webView.evaluateJavaScript(`render()`, false);
  }
});