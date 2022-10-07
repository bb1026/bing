
var timeNow = document.getElementById("timeNow");
var dateNow = document.getElementById("dateNow");
var weekNow = document.getElementById("weekNow");
var whichDay = document.getElementById("whichDay");
var yearAnimal = document.getElementById("yearAnimal");
var monthXZ = document.getElementById("monthXZ");
var chineseEra = document.getElementById("chineseEra");

var start ={Year:2000,
			Mon:0,
			Day:31,
			SmallColdDay:6,
			SmallColdHour:2,
			SmallColdMin:5,} ;//万年历最早能查到的日期
var end = {Year:2099};//万年历最早能查到的年份


var XZLibrary = "摩羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手";//所有的星座名
var XZZone = [1222,122,222,321,421,522,622,722,822,922,1022,1122,1222];//每个星座的日期间隔
var GLibrary = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
var ZLibrary = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
var SXLibrary = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
var solarTerm = ["小寒", "大寒","立春", "雨水","惊蛰", "春分","清明", "谷雨","立夏", "小满","芒种", "夏至",
        		 "小暑", "大暑","立秋", "处暑","白露", "秋分","寒露", "霜降","立冬", "小雪","大雪", "冬至"];
var termInfo = [0, 21208, 42467, 63836, 85337, 107014,128867, 150921, 173149, 195551, 218072,240693, 263343, 285989, 308563, 331033,
        		353350, 375494, 397447, 419210, 440795,462224, 483532, 504758];//求节气日期的定气常数（各个节气到小寒的分钟数）
var LunarFestival = ["0101 春节","0115 元宵节","0202 龙头节","0505 端午节","0707 七夕节","0715 中元节","0815 中秋节",
					"0909 重阳节","1001 寒衣节","1015 下元节","1208 腊八节","1223 小年"];
var CalFestival = ["0101 元旦","0202 湿地日","0214 情人节","0308 妇女节","0312 植树节","0315 消费者权益日","0401 愚人节","0404 清明节","0422 地球日",
        			 "0501 劳动节","0504 五四青年节","0512 护士节","0518 博物馆日","0601 儿童节","0605 环境日","0623 奥林匹克日",
        			 "0701 建党节","0801 建军节","0903 抗战胜利日","0910 教师节","1001 国庆节",
        			 "1020 骨质疏松日","1117 学生日","1201 艾滋病日",
        			 "1224 平安夜","1225 圣诞节"];
var OtherFestival = ["0520 母亲节","0630 父亲节","1144 感恩节"];
var holidayPlan = ["01033","02137","04043","05023","06113","09173","10077"];
var lunarDay = [ "一", "二", "三", "四", "五", "六", "七", "八", "九","十"];
var lunarMon = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "腊"];
var gBLibrary = ["祭祀","安葬","嫁娶","出行","祈福","动土","安床","开光","纳采","入殓",
"移徙","破土","解除","入宅","修造","栽种","开市","移柩","订盟","拆卸","立卷","交易","求嗣",
"上梁","纳财","起基","斋醮","赴任","冠笄","安门"]

/*农历日期资料*/
var lunarInfo = [0x4bd8, 0x4ae0, 0xa570, 0x54d5, 0xd260, 0xd950,
		0x5554, 0x56af, 0x9ad0, 0x55d2, 0x4ae0, 0xa5b6, 0xa4d0, 0xd250, 0xd295,
		0xb54f, 0xd6a0, 0xada2, 0x95b0, 0x4977, 0x497f, 0xa4b0, 0xb4b5, 0x6a50,
		0x6d40, 0xab54, 0x2b6f, 0x9570, 0x52f2, 0x4970, 0x6566, 0xd4a0, 0xea50,
		0x6a95, 0x5adf, 0x2b60, 0x86e3, 0x92ef, 0xc8d7, 0xc95f, 0xd4a0, 0xd8a6,
		0xb55f, 0x56a0, 0xa5b4, 0x25df, 0x92d0, 0xd2b2, 0xa950, 0xb557, 0x6ca0,
		0xb550, 0x5355, 0x4daf, 0xa5b0, 0x4573, 0x52bf, 0xa9a8, 0xe950, 0x6aa0,
		0xaea6, 0xab50, 0x4b60, 0xaae4, 0xa570, 0x5260, 0xf263, 0xd950, 0x5b57,
		0x56a0, 0x96d0, 0x4dd5, 0x4ad0, 0xa4d0, 0xd4d4, 0xd250, 0xd558, 0xb540,
		0xb6a0, 0x95a6, 0x95bf, 0x49b0, 0xa974, 0xa4b0, 0xb27a, 0x6a50, 0x6d40,
		0xaf46, 0xab60, 0x9570, 0x4af5, 0x4970, 0x64b0, 0x74a3, 0xea50, 0x6b58,
		0x5ac0, 0xab60, 0x96d5, 0x92e0, 0xc960, 0xd954, 0xd4a0, 0xda50, 0x7552,
		0x56a0, 0xabb7, 0x25d0, 0x92d0, 0xcab5, 0xa950, 0xb4a0, 0xbaa4, 0xad50,
		0x55d9, 0x4ba0, 0xa5b0, 0x5176, 0x52bf, 0xa930, 0x7954, 0x6aa0, 0xad50,
		0x5b52, 0x4b60, 0xa6e6, 0xa4e0, 0xd260, 0xea65, 0xd530, 0x5aa0, 0x76a3,
		0x96d0, 0x4afb, 0x4ad0, 0xa4d0, 0xd0b6, 0xd25f, 0xd520, 0xdd45, 0xb5a0,
		0x56d0, 0x55b2, 0x49b0, 0xa577, 0xa4b0, 0xaa50, 0xb255, 0x6d2f, 0xada0,
		0x4b63, 0x937f, 0x49f8, 0x4970, 0x64b0, 0x68a6, 0xea5f, 0x6b20, 0xa6c4,
		0xaaef, 0x92e0, 0xd2e3, 0xc960, 0xd557, 0xd4a0, 0xda50, 0x5d55, 0x56a0,
		0xa6d0, 0x55d4, 0x52d0, 0xa9b8, 0xa950, 0xb4a0, 0xb6a6, 0xad50, 0x55a0,
		0xaba4, 0xa5b0, 0x52b0, 0xb273, 0x6930, 0x7337, 0x6aa0, 0xad50, 0x4b55,
		0x4b6f, 0xa570, 0x54e4, 0xd260, 0xe968, 0xd520, 0xdaa0, 0x6aa6, 0x56df,
		0x4ae0, 0xa9d4, 0xa4d0, 0xd150, 0xf252, 0xd520];
var today = new Date(); //创建一个日期对象，新创建的对象自动获取当前系统的时间

var TyearNum,TmonthNum,TdayNum,TweekNum;

TyearNum = today.getFullYear(); //得到当前年份
TmonthNum = today.getMonth() + 1; //得到当前月份，要加1
TdayNum = today.getDate(); //得到当前日期
TweekNum = today.getDay();//得到当前星期数					

/*将获取到的星期数转换成中文汉字*/
function transToChinese(num){
	var chineseWeek;
	switch(num){
		case 1:
		chineseWeek = "一";
		break;

		case 2:
		chineseWeek = "二";
		break;

		case 3:
		chineseWeek = "三";
		break;

		case 4:
		chineseWeek = "四";
		break;

		case 5:
		chineseWeek = "五";
		break;

		case 6:
		chineseWeek = "六";
		break;

		case 0:
		chineseWeek = "日";
		break;
	}
	return chineseWeek;
}

/*规范时间格式的函数，*/
function timeStandard(num,sep){
		var newNum;
		if(num < 10)						 
		{
			newNum = "0" + num + sep;
		} 
		else 
		{
			newNum = num + sep;
		}
			return newNum;

}

/*获取当前时间的函数*/
function getTimeNow() {
				
	var today = new Date(); //创建一个日期对象，新创建的对象自动获取当前系统的时间	
	var ThourNum, TminuteNum, TsecondNum;
	ThourNum = today.getHours(); //得到当前小时
	TminuteNum = today.getMinutes(); //得到当前分钟
	TsecondNum = today.getSeconds(); //得到当前秒钟							
	displayBjTime(ThourNum,TminuteNum,TsecondNum);
				

}
window.setInterval("getTimeNow();", 1000);//每隔一秒钟调用一次getTimeNow函数

function getMonthNow(){
	

	CalDate.selectYear.selectedIndex=TyearNum - 1901;
   	CalDate.selectMonth.selectedIndex=TmonthNum - 1;
   	CalDate.holidayPlan.selectedIndex=0;
   //console.log(CalDate.selectYear.selectedIndex);
    displayTable(TyearNum,TmonthNum);

    displayRDayInfo(TyearNum,TmonthNum,TdayNum,TweekNum);
   
    getTimeNow();
}		


window.onload = getMonthNow();//页面加载完毕，调用getTimeNow函数
//window.onload = getTimeNow;//页面加载完毕，调用getTimeNow函数

/*根据月份和日期判断星座*/
function judgeXZ(month,day){
	var XZresult;	
    if((100 * month + day) >= XZZone[0] || (100 * month + day) < XZZone[1])
    { var i = 0; }
    else
    {
       for(var i = 1;i < 12;i++)
        {
            if((100 * month + day) >= XZZone[i] && (100 * month + day) < XZZone[i + 1])
            {break;} 
        }
    }
            
    XZresult = XZLibrary.substring(2 * i,2 * i + 2) + '座';
    return XZresult;
}

/*根据年份判断干支*/
function judgeGZ(year,month,day){
	var GZresult = Array(3);
	var tempObj = new Date(year,month-1,day);
	//var week = DayObj.getDay();
	var onelunarDate = new lunarDate(tempObj);
	//console.log(DayObj);
	/*年的干支*/
    var i= year - start.Year + 36 ;
    var Gyear =  GLibrary[i % 10] ;
    var Zyear = ZLibrary[i % 12]
    GZresult[0] =Gyear+Zyear;

    /*月的干支*/
    for(var i=0;i<=4;i++)
    {
    	if(Gyear==GLibrary[i]||Gyear==GLibrary[i+5])
    	{
    		if(month==1)
    		{	
    			if(i==4)
    			{
    				GZresult[1]=GLibrary[0]+ZLibrary[2];
    			}
    			else
    			{
    				GZresult[1]=GLibrary[2*i+2]+ZLibrary[2];
    			}
    			
    		}
    		else
    		{    			    				    			
    			GZresult[1]=GLibrary[(2*i+2+onelunarDate.month-1)%10]+ZLibrary[(2+onelunarDate.month-1)%12];
    		}
    	}
    }



    /*日的干支*/
    var centuryNum = (Math.floor(onelunarDate.year/100)+1);
    var tempLunYear = onelunarDate.year;
    //console.log(tempLunYear.toString().substr(2,2));
    var last2Str = parseInt(tempLunYear.toString().substr(2,2));
    var Gday = 4*(centuryNum-1)+Math.round((centuryNum-1)/4)+5*last2Str+Math.round(last2Str/4)+
    Math.round(3*(onelunarDate.month+1)/5)+onelunarDate.day-3;
    
    var Zday,j;
    if(onelunarDate.month%2==0)
    {
    	j=6;
    } 
    else
    {
    	j=0;
    }
    var Zday = 8*(centuryNum-1)+Math.round((centuryNum-1)/4)+5*last2Str+Math.round(last2Str/4)+
    Math.round(3*(onelunarDate.month+1)/5)+onelunarDate.day+7+j;
    GZresult[2]=GLibrary[Gday%10]+ZLibrary[Zday%12];

    return GZresult;
}

/*根据年份判断生肖*/
function judgeSX(year){
	var SXresult;	
    SXresult = SXLibrary[(year - 1900) % 12];
    return SXresult;
}

/*判断这一天是否为节气*/
function judgeSolarTerm(year, month,day){
	var term;
	/*根据年月返回该月的两个节气，一个公历月有两个节气*/
	function getSolarTerm(year, month) {
        
	    // 返回某年的第n个节气为几日(从0小寒起算)
	    function computeTermDay(y, n) {//'节气日的时差公式(时差为分钟)(从1900年大寒到现在这一节气的的分钟数）
	        var d = new Date((31556925974.7 * (y - start.Year) + termInfo[n] * 60000) + Date.UTC(start.Year,start.Mon, start.SmallColdDay, start.SmallColdHour, start.SmallColdMin));
	        //console.log(d);//31556925974.7一年的毫秒数
	        return d.getUTCDate();
	    }

	    // month 转为 [0-11] 范畴
	    month = month - 1;
	 
	    // 计算节气
	    var n1 = month * 2;
	    var n2 = month * 2 + 1;
	    // day1, day2 为当月的两个节气日
	    var day1 = computeTermDay(year, n1);
	    var day2 = computeTermDay(year, n2);
	    // 当月的两个节气名称
	    var term1 = solarTerm[n1];
	    var term2 = solarTerm[n2];
	 
	    // 返回结果
	    return {
	        day1: day1,
	        term1: term1,
	        day2: day2,
	        term2: term2
	    };
	}
	var getTerms = getSolarTerm(year, month);
	if(day==getTerms.day1)
	{
		term = getTerms.term1;
	}
	else if(day==getTerms.day2)
	{
		term = getTerms.term2;
	}
	else
	{
		term ="";
	}
	return term;
}

/*得到m的二进制的右边数第n+1位（为0或者1）*/
function getBit(m,n){
	return (m >> n) & 1;
}

/*根据年份判断这一年是否有闰月，将闰月的月份和天数保存在数组leapMon里面*/
function leapMonth(year) {
		var leapMon =[];
		var ifHasLeap = lunarInfo[year - start.Year] & 0xf;//日期信息lunarInfo数组中，后四位代表这一年是否有闰月，以及润几月				
		if(ifHasLeap == 0xf)
		{
			leapMon[0] = 0;
		}
		else
		{
			leapMon[0] = ifHasLeap;
		}
		if(leapMon[0])
		{
			leapMon[1] = (lunarInfo[year - start.Year + 1] & 0xf) == 0xf ? 30 : 29;
		}
		else
		{
			leapMon[1] = 0;
		}
		return leapMon;
}

/*获得某一农历年的每个月的天数，存在MonDays中*/
function oneYearLMonDays(year){
		var LMonDays =[];
		for (var i = 15,j=0; i >= 4; i--,j++)
		{

			if(getBit(lunarInfo[year - start.Year],i))
			{
				LMonDays[j] = 30;
			}
			else
			{
				LMonDays[j] = 29;
			}
		}
		//console.log(MonDays);
		return LMonDays;
}

/*获得某一公历年的每个月的天数，存在CMonDays中*/
function oneYearCMonDays(year){
	var CMonInfo = [1,3,5,7,8,10,12];
	var CMonDays = new Array(12);
	
	for(i = 1;i<13;i++)
	{
		if(CMonInfo.indexOf(i) == -1)
		{
			CMonDays[i-1] = 30;
		}
		else
		{
			CMonDays[i-1] = 31;
		}
	}

	if( (year % 4 == 0 && year % 100 != 0)|| year % 400 == 0)
	{
		CMonDays[1] = 29; 
	}
	else 
	{
		CMonDays[1] = 28; 
	}
	return CMonDays;
}

/*根据年份计算农历的这一年有多少天*/
function oneLunarYearNum(year) {
		var MonDays = oneYearLMonDays(year);
		var leapMonDays = leapMonth(year);
		var sum = 0;		
		for(var i = 0;i < 12;i++)
		{
			sum += MonDays[i];			
		}
								
		return (sum + leapMonDays[1]);
		
}

/*根据年、月、日来算出对应的农历的日期*/
function lunarDate(objDate) {
		var i, j;
		var leapMonNum = 0; 
		var temp = 0;
		var timeDifference = (Date.UTC(objDate.getFullYear(), objDate.getMonth(), objDate.getDate()) - Date.UTC(start.Year,start.Mon, start.Day)) / 86400000;

		for (i = start.Year; i < end.Year ; i++) {
			temp = oneLunarYearNum(i);
			timeDifference -= temp;
			if(timeDifference < 0)
			{	timeDifference += temp;
				break;}			
		}

		this.year = i;
		leapMonNum = leapMonth(this.year)[0]; //闰哪个月
		//console.log(leap);
		this.isLeap = false;
		
			//闰月
			if(leapMonNum != 0){
				for(j = 0; j < 12; j++)
				{
					if(j == leapMonNum && this.isLeap == false)
					{
						temp = leapMonth(this.year)[1];
						timeDifference -= temp;
						--j;
						this.isLeap = true;
					}
					else
					{
						temp = oneYearLMonDays(this.year)[j]
						timeDifference -= temp;	
					}
					if(timeDifference < 0)
					{
						timeDifference += temp;
						break;
					}
				}
				
			}
			else{

				for(j = 0; j < 12; j++)
				{
					temp = oneYearLMonDays(this.year)[j]
					timeDifference -= temp;	
					if(timeDifference < 0)
					{
						timeDifference += temp;
						break;
					}
				}							
			}
			
		
		//console.log(timeDifference);
		this.month = j + 1;
		this.day = timeDifference + 1;
}

/*根据农历月日数字转换成汉字表示*/
function displayLunar(month,day){
		
		this.month =  lunarMon[month - 1] + "月";

		if(day <= 10)
		{
			this.day = "初" + lunarDay[day - 1];
		}
		else if(day > 10 && day < 20)	
		{
			
			day %= 10;
			this.day = "十" + lunarDay[day - 1];
			
		}	
		else if(parseInt(day) == 20 )
		{
			this.day = "廿十" ;
		}
		else if(day == 30)
		{
			this.day = "三十" ;
		}
		else
		{
			day %= 20;
			this.day = "廿" + lunarDay[day - 1];
		}
}	
	
//var a=new displayLunar(2,20);
//console.log(a.month);
//console.log(a.day);

/*根据年月日判断节日*/
function judgeFes(year,month,day){
	//将传入的月份和日期转换成合适的形式
	var monthSdar = timeStandard(month,"");
	var daySdar = timeStandard(day,"");

	//由传入的公历的年月日得到对应的农历的年月日
	var DayObj = new Date(year,month-1,day);
	var week = DayObj.getDay();
	var onelunarDate = new lunarDate(DayObj);
	var LunMonthSdar = timeStandard(onelunarDate.month,"");
	var LunDaySdar = timeStandard(onelunarDate.day,"");
	//console.log(month);
	//console.log(day);

	//判断公历节日
	var CalFilterResult = CalFestival.filter(
			function(item,index,array)
			{				
				return (parseInt(item.substr(0,2)) == monthSdar && parseInt(item.substr(2,4))==daySdar);				
			}
	)
	//console.log(CalFilterResult);
	if(CalFilterResult!="")
	{
		
		CalFilterResult=CalFilterResult[0].substr(5);
		
	
	}
	else
	{
		CalFilterResult="";
	}


	//判断农历节日
	var LunarFilterResult = LunarFestival.filter(
			function(item,index,array)
			{				
				return (parseInt(item.substr(0,2)) == LunMonthSdar && parseInt(item.substr(2,4))==LunDaySdar);				
			}
	)
	if(LunarFilterResult!="")
	{
		LunarFilterResult = LunarFilterResult[0].substr(5);
	}
	else
	{
		LunarFilterResult="";
	}


	//判断特殊节日
	var whickWeek = day%7 + 1;
	var OtherFilterResult = OtherFestival.filter(
			function(item,index,array)
			{				
				return (parseInt(item.substr(0,2)) == monthSdar && parseInt(item.substr(2,3)) == whickWeek&&parseInt(item.substr(3,4)) == week);				
			}
	)
	if(OtherFilterResult!="")
	{
		OtherFilterResult = OtherFilterResult[0].substr(5);
	}
	else
	{
		OtherFilterResult ="";
	}

	return {
	CalFestival:CalFilterResult,
	LunarFestival:LunarFilterResult,
	OtherFestival:OtherFilterResult
	}

	
}

/*根据年月日判断节日，获得这一天的所有信息：农历日期、节日、星座、干支、生肖、节气、星期几、是这个月的第几周*/
function oneDayAll(year,month,day){
	var DayObj = new Date(year,month-1,day);
	//var DayObj = new Date(1949,7,23);
	//农历年月日
	var onelunarDate = new lunarDate(DayObj);
	this.LunYear = onelunarDate.year;
	this.LunMonth = onelunarDate.month;
	this.LunDay = onelunarDate.day;

	//节日
	var Festival = judgeFes(year,month,day);
	this.CalFestival = Festival.CalFestival;
	this.LunarFestival = Festival.LunarFestival;
	this.OtherFestival = Festival.OtherFestival;

	//星座
	this.XZ = judgeXZ(month,day);

	//干支
	this.GZ = judgeGZ(year,month,day);

	//生肖
	this.SX = judgeSX(year);

	//节气
	this.solarTerm = judgeSolarTerm(year,month,day);

	//星期几
	this.week = DayObj.getDay();

	//是这个月的第几周
	this.whickWeek = (day%7 + 1);
}


/*根据年月判断，获得这一个月的一些信息：这个月的第一天是周几，这个月有多少天*/
function oneMonthAll(year,month){
	var firDayObj = new Date(year,month-1,1);

	/*这个月的第一天是周几*/
	this.firDayWhichWeek = firDayObj.getDay();

	/*这个月有多少天-公历*/
	var oneYearMonDay = oneYearCMonDays(year);
	//console.log(oneYearMonDay);
	this.monthNum = oneYearMonDay[month-1];
	//console.log(this.monthNum);

}

/*根据年、月显示表格中的信息*/
function displayTable(year,month){
	var oneMonth = new oneMonthAll(year,month);
	var PreMonth = new oneMonthAll(year,month-1);
	var PreYearLastMon = new oneMonthAll(year-1,12);
	//var toDay = new Date();
	//console.log(oneMonth);
	var calObj = new Array(36);
	var lunObj = new Array(36);
	var boxObj = new Array(36);
	var hTranObj = new Array(36);

	var CalDate,oneSomeDay,displaySomeLun,fesString;
	var holidayMon = Array(7);
	var holidayDay = Array(7);
	var holidayNum = Array(7);
	
	for(var i = 1;i<36;i++)
	{
		//calObj=eval('calD'+ i);
	    //lunObj=eval('lunD'+ i);
	    //boxObj=eval('box'+i);
	    calObj[i] = document.getElementById("calD"+i);
	    lunObj[i] = document.getElementById("lunD"+i);
	    hTranObj[i] = document.getElementById("hTran"+i);
	    boxObj[i] = document.getElementById("box"+i);
	    
	    calObj[i].className = "calDateNum";
	    lunObj[i].className = "lunarDate";
	    boxObj[i].className = "";
	    hTranObj[i].style.display = "none";
		if(i<(oneMonth.firDayWhichWeek+1))
		{
			if(month == 1)
			{
				CalDate = PreYearLastMon.monthNum - oneMonth.firDayWhichWeek + i;
				oneSomeDay = new oneDayAll(year-1,12,CalDate);
				clickBox(boxObj,i,year-1,12);
			}
			else
			{
				CalDate = PreMonth.monthNum - oneMonth.firDayWhichWeek + i;
				oneSomeDay = new oneDayAll(year,month-1,CalDate);
				clickBox(boxObj,i,year,month-1);
			}
			
	      	calObj[i].className = "greyDisplay";
	      	lunObj[i].className = "greyDisplay";

		}
		else if(i>=(oneMonth.firDayWhichWeek+1)&&i < (oneMonth.firDayWhichWeek + 1 + oneMonth.monthNum))
		{
		  CalDate = i - oneMonth.firDayWhichWeek;

	      oneSomeDay = new oneDayAll(year,month,CalDate);
	      if(oneSomeDay.week == 0|| oneSomeDay.week == 6)  
	      {
	        	calObj[i].className = "redColor";
		  }

			/*点击每一天显示右边的信息栏*/
			clickBox(boxObj,i,year,month);

  		 	/*显示2016年的休假安排*/
			if(year == TyearNum)
			{																												
				for(var j=0;j<7;j++)
				{	
					holidayMon[j] = parseInt(holidayPlan[j].substr(0,2));
					holidayDay[j] = parseInt(holidayPlan[j].substr(2,2));
					holidayNum[j] =	parseInt(holidayPlan[j].substr(4,1));

					if(month == holidayMon[j]&&CalDate==holidayDay[j])
					{						
							 
							if(month==5 && CalDate==2)
							{
								boxObj[i].className = "redBack";
								hTranObj[i].style.display = "block";
								boxObj[i-1].className = "redBack";
								hTranObj[i-1].style.display = "block";	
							}
							
							else
							{
								for(var h=holidayNum[j]-1;h>=0;h--)
								{															
									boxObj[i-h].className = "redBack";
									hTranObj[i-h].style.display = "block";								
								}
							}
								
							
								
																			
					}
					
					
				}
			}
  		 	
		}
		else 
		{
		  CalDate = i - oneMonth.firDayWhichWeek -oneMonth.monthNum;
	    
	      oneSomeDay = new oneDayAll(year,month+1,CalDate);
	      /*点击每一天显示右边的信息栏*/
			if(month==12)
			{
				clickBox(boxObj,i,year+1,1);
			}
			else
			{
				

    			clickBox(boxObj,i,year,month+1);  
			}
	      calObj[i].className = "greyDisplay";
	      lunObj[i].className = "greyDisplay";
		}
		
		calObj[i].innerHTML = CalDate;

		var displaySomeLun = new displayLunar(oneSomeDay.LunMonth,oneSomeDay.LunDay);
		if(oneSomeDay.CalFestival=="" && oneSomeDay.LunarFestival=="" && oneSomeDay.OtherFestival==""&&oneSomeDay.solarTerm=="")
	    {
	      	lunObj[i].innerHTML = displaySomeLun.day;
	      	//console.log(displaySomeLun);
	    }
	    else
	    {
	      	fesString = oneSomeDay.solarTerm+oneSomeDay.CalFestival + oneSomeDay.LunarFestival + oneSomeDay.OtherFestival;
	      	if(fesString.length>3)
			{lunObj[i].innerHTML=fesString.substr(0,2)+"...";}
			else
			{lunObj[i].innerHTML=fesString.substr(0);}

	      	if(calObj[i].className != "greyDisplay")
	      	{
	      		//lunObj.style.color = 'rgb(250, 148, 32)';
	      		lunObj[i].className = "orgColor"
	      	}
	    }

	    /*展示当前日期*/
		
	    if(year==TyearNum && month==TmonthNum && CalDate==TdayNum)
	    {
	    	
	    	boxObj[i].className = "isToday";
	    
	    }
	   

	}	

	if(year == TyearNum && month==4 )
	{
		boxObj[35].className = "redBack";
		hTranObj[35].style.display = "block";
	}
			
}
//displayTable(1901,1);
//在下拉列表中选择年月时,调用自定义函数displayTable();,显示公历和农历的相关信息
function changeCaldate() {
   var y,m;
   y=CalDate.selectYear.selectedIndex+1901;
   m=CalDate.selectMonth.selectedIndex+1;
   displayTable(y,m);
}

function displayBjTime(hour,minute,second)
{
	/*以格式2016-04-07输出日期，以20:12:13格式输出当前时间*/
	
	hour = timeStandard(hour,":");
	minute = timeStandard(minute,":");
	second = timeStandard(second,"");				
	timeNow.innerHTML = hour + minute + second;					
}

/*右边显示每一天的详细信息*/
function displayRDayInfo(year,month,day,week)
{
	yearStr = year + "-";
	monthStr = timeStandard(month,"-");
	dayStr = timeStandard(day,"");

	dateNow.innerHTML = yearStr + monthStr + dayStr;
	weekNow.innerHTML = transToChinese(week);
	whichDay.innerHTML = day;	

	yearAnimal.innerHTML = "[" + 	judgeSX(year) + ']';
	monthXZ.innerHTML = judgeXZ(month,day);
	var GZObj = judgeGZ(year,month,day);
	chineseEra.innerHTML = 	GZObj[0]+"年"+GZObj[1]+"月"+GZObj[2]+"日";
	var targetObj = new oneDayAll(year,month,day);
	var displayObj = new displayLunar(targetObj.LunMonth,targetObj.LunDay);
	lunarCal.innerHTML = "农历" + displayObj.month + displayObj.day;

	var goodBadItems =goodAndBad(year,month,day);
	suitItems.innerHTML = goodBadItems.goodEvent[0]+" "+goodBadItems.goodEvent[1]+" "+goodBadItems.goodEvent[2];
	avoidItems.innerHTML = goodBadItems.badEvent[0]+" "+goodBadItems.badEvent[1]+" "+goodBadItems.badEvent[2];
}
//displayRDayInfo(2016,4,15,5);
/*返回今天*/
var gotoToday = document.getElementById("back-to-today");

gotoToday.onclick = function(){
	CalDate.selectYear.selectedIndex = TyearNum;
	CalDate.selectMonth.selectedIndex = TmonthNum - 1;
}

/*查看2016年假日安排*/
function checkHolidayPlan(){
	
	var holN = CalDate.holidayPlan.selectedIndex-1; 
	goHoliday(holN);
	
}

/*根据输入的节日对应的selecedIndex来显示日历中的数据和右边的信息栏*/
function goHoliday(holN){		
		var holidayDate = ["0101","0208","0404","0501","0609","0915","1001"]
		var year = TyearNum;
		var month = parseInt(holidayDate[holN].substr(0,2));
		var day = parseInt(holidayDate[holN].substr(2,2));
		CalDate.selectYear.selectedIndex = 115;
		CalDate.selectMonth.selectedIndex = month - 1;
		var holiObj = new Date(year,month-1,day);
		var week = holiObj.getDay();
		displayTable(year,month);
		displayRDayInfo(year,month,day,week);
	} 

/*月份加减*/
var preMon = document.getElementById("prev-month");
var nextMon = document.getElementById("next-month");

preMon.onclick = function(){
	if(CalDate.selectMonth.selectedIndex > 0)
	{
		CalDate.selectMonth.selectedIndex--;
	}
	else
	{
		CalDate.selectMonth.selectedIndex = 0;
	}
	changeCaldate();
	
}

nextMon.onclick = function(){
	if(CalDate.selectMonth.selectedIndex < 11)
	{
		CalDate.selectMonth.selectedIndex++;
	}
	else
	{
		CalDate.selectMonth.selectedIndex = 11;
	}
	changeCaldate();
}

/*宜忌事项*/
function goodAndBad(year,month,day){
	var gNum =Math.floor(4* Math.random());
	var bNum =Math.floor(4* Math.random());
	var Ran ;
	var goodEvent = ["","",""];
	var badEvent = ["","",""];
	var gbObj = new oneDayAll(year,month,day);
	var num = (gbObj.LunDay)%30;
	
	for(var j=0;j<gNum;j++)
	{			
		goodEvent[j] = gBLibrary[(2+j*5)%30];		
	}	
	for(var j=0;j<bNum;j++)
	{
			
		badEvent[j] = gBLibrary[(4+j*5)%30];		
	}
						
	return{
		goodEvent:goodEvent,
		badEvent:badEvent
		}
	
}

/*点击每一天显示右边的信息栏*/
function clickBox(boxObj,x,year,month){
    
	boxObj[x].onclick = function(){
	var box = event.currentTarget ? event.currentTarget : event.srcElement;//解决IE9下没有currentTarget这个属性的问题
	while(box.nodeName!="TD")
	{
		box = box.parentNode;  
	}
    var targetDay = parseInt(box.firstChild.innerHTML);

    var dayClick = new oneDayAll(year,month,targetDay);
    displayRDayInfo(year,month,targetDay,dayClick.week);}
}

