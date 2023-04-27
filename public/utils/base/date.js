/*
 * @Description: Date处理方法集
 * @Version: 
 * @Author: kangjinrui
 * @Date: 2022-10-20 10:38:03
 * @LastEditors: kangjinrui
 * @LastEditTime: 2022-11-28 17:14:21
 */
/**
 * 根据指定时间间隔划分指定时间范围
 * @param {*} interval 时间间隔
 * @param {*} timeList 时间范围
 * @returns 时间数组
 */
export function customTimeSegment(interval = 30, timeList = ["04:00 - 24:00"]) {
    let openTime = timeList;
    let y = new Date().getFullYear();
    let m = new Date().getMonth() + 1;
    let d = new Date().getDate();
    let start = [],
        end = []; //start起始时间数组，end结束时间数组
    for (let i = 0, len = openTime.length; i < len; i++) {
        //将时间字符串转换成日期格式并存入开始时间数组和结束时间数组
        let [s, e] = openTime[i].split("-");
        start.push(new Date(y + "/" + m + "/" + d + " " + s));
        end.push(new Date(y + "/" + m + "/" + d + " " + e));
    }
    let list = [];

    function formatTime(time) {
        //时间为个位数则补零
        return time < 10 ? "0" + time : time;
    }
    for (let i = 0, len = start.length; i < len; i++) {
        let len2 = (end[i].getTime() - start[i].getTime()) / (interval * 60 * 1000); //计算各子区间以半小时为间隔拆分后的数组长度
        for (let j = 0; j < len2; j++) {
            if (start[i].getTime() + interval * 60 * 1000 <= end[i].getTime()) {
                //将各子区间日期按半小时递增转换为时间并存入list数组
                let ss = new Date(start[i].getTime() + interval * 60 * 1000 * j),
                    ee = new Date(start[i].getTime() + interval * 60 * 1000 * (j + 1));
                list.push([
                    formatTime(ss.getHours()) + ":" + formatTime(ss.getMinutes()),
                    formatTime(ee.getHours()) + ":" + formatTime(ee.getMinutes()),
                ]);
            }
        }
    }
    list = list.map((item) => {
        // return item.join("-");
        return item[0];
    });

    return list
}

/**
 * 时间戳转时间字符串
 * @param {*} timeStamp 时间戳
 * @param {*} format    格式
 * @returns 时间字符串
 */
export function timestamp2String(timeStamp, format) {
    var t = new Date(timeStamp);
    var tf = function(i) {
        return (i < 10 ? '0' : '') + i
    };
    return format.replace(/yyyy| MM| dd| HH| mm| ss/g,
        function(a) {
            switch (a) {
                case 'yyyy':
                    return tf(t.getFullYear());
                    break;
                case 'MM':
                    return tf(t.getMonth() + 1);
                    break;
                case 'mm':
                    return tf(t.getMinutes());
                    break;
                case 'dd':
                    return tf(t.getDate());
                    break;
                case 'HH':
                    return tf(t.getHours());
                    break;
                case 'ss':
                    return tf(t.getSeconds());
                    break;
            }
        })
}

/**
 * 日期字符串截止到天
 * @param {*} date 日期Date
 * @returns 日期字符串
 */
export function date2StringD(date = new Date()) {
    let y = date.getFullYear();
    let m = date.getMonth() + 1;
    m = m < 10 ? `0${m}` : m;
    let d = date.getDate();
    d = d < 10 ? `0${d}` : d;
    return `${y}-${m}-${d}`;
}

export function date2StringH(date = new Date()) {
    let y = date.getFullYear();
    let m = date.getMonth() + 1;
    m = m < 10 ? `0${m}` : m;
    let d = date.getDate();
    d = d < 10 ? `0${d}` : d;
    let h = date.getHours();
    h = h < 10 ? `0${h}` : h;
    return `${y}-${m}-${d} ${h}`;
}

export function date2StringD2(date = new Date()) {
    let y = date.getFullYear();
    let m = date.getMonth() + 1;
    m = m < 10 ? `0${m}` : m;
    let d = date.getDate();
    d = d < 10 ? `0${d}` : d;
    return `${y}年${m}月${d}日`;
}

/**
 * 取count周前的时间
 * @param {*} count number
 * @param {*} date 日期
 * @returns count周前
 */
export function formatDateWeek(count, date = new Date()) {
    let mytime = date;
    mytime = new Date(mytime.getTime() - 86400000 * count);
    let y = mytime.getFullYear();
    let m = mytime.getMonth() + 1;
    m = m < 10 ? `0${m}` : m;
    let d = mytime.getDate();
    d = d < 10 ? `0${d}` : d;
    return `${y}-${m}-${d}`;
}

// 返回上一个8点
export function formatDateTime8H() {
    let mytime = new Date();
    let h = mytime.getHours();
    if (h < 8) {
        mytime = new Date(mytime.getTime() - 86400000);
    }
    let y = mytime.getFullYear();
    let m = mytime.getMonth() + 1;
    m = m < 10 ? `0${m}` : m;
    let d = mytime.getDate();
    d = d < 10 ? `0${d}` : d;
    return `${y}-${m}-${d} 08:00`;
}

/**
 * 将任意格式的日期转为 new Date() 类型
 * @param {*} date 日期
 * @param {boolean} allowNull 转换结果是否允许为null
 * @returns
 */
export function convertAnyToDate(date, allowNull = false) {
	let dateType = Object.prototype.toString.call(date); // 传入的时间的类型
	let timeObj = null; // 时间对象
	// 获取时间对象
	if (dateType == "[object Date]") {
		timeObj = new Date(date);
	} else if (dateType == "[object String]") {
		// 判断是否为纯数字，纯数字即视为时间戳
		let test = /^\d+$/.test(date);
		if (test) {
			let tempDate = parseInt(date);
			let tempTimeStamp = date.length == 10 ? tempDate * 1000 : tempDate;
			timeObj = new Date(tempTimeStamp);
		} else {
			// 利用是否能转换为时间戳判断是否为日期格式字符串
			let tempTime = new Date(date).getTime();
			if (null != tempTime && undefined != tempTime && !isNaN(tempTime)) {
				timeObj = new Date(tempTime);
			}
		}
	} else if (dateType == "[object Number]") {
		let timestamp = date.toString().length == 10 ? date * 1000 : date;
		timeObj = new Date(timestamp);
	}
	if (timeObj == null && !allowNull) {
		timeObj = new Date();
	}
	return timeObj;
}