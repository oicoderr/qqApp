/*
  * @全局接受服务器返回信息
  *	@code 消息
  * @emitter node.js 转发
  * 
*/
import emitter from './events'

export default class ReceiveMsg {
	constructor(message) {
		// 定时器集
		this.timerCount = [];
		this.onReceiveMsg(message);
	}

	onReceiveMsg(message) {
		let _this = this;
		// 清空定时器集
		for (let i = 0; i <= this.timerCount.length; i++) {
			clearInterval(this.timerCount[i]);
		};
		switch (message['code']) {
			case 1002:  		// 服务器返回登录结果
				this.timerCount[0] = setInterval(() => {
					emitter.emit('loginGameStatus', [message, _this.timerCount[0]]);
				}, 20);
				break;
			case 1004:		    // 登录成功后，服务器返回角色基本信息
				// console.log('%c 发送游戏个人信息', 'font-size:14px;color:blue;');
				this.timerCount[1] = setInterval(() => {
					emitter.emit('loginGameInfo', [message, this.timerCount[1]]);
				}, 20);
				break;
			case 1006:		    // 当前性别，存在表示游戏性别设置成功
				// console.log('%c 发送游戏个人信息', 'font-size:14px;color:blue;');
				this.timerCount[2] = setInterval(() => {
					emitter.emit('setSex', [message, this.timerCount[2]]);
				}, 20);
				break;
			case 1040:  		// 服务器返回文字提示(每一步都可能会有) 1. 异常type 2.异常说明(content)
				this.timerCount[3] = setInterval(() => {
					emitter.emit('globalTips', [message, this.timerCount[3]]);
				}, 20);
				break;
			case 1010:			// 服务器推送当前货币数量: 当前剩余金币数量 / 剩余能量数量 / 门票数量
				this.timerCount[4] = setInterval(() => {
					emitter.emit('currencyChange', [message, this.timerCount[4]]);
				}, 20);
				break;
			case 1102: 			// 服务器心跳返回 1. 服务器当前时间
				// console.log('%c 服务器返回心跳','color:red;font-size:14px;'); console.log(message)
				break;
			case 1302:			// 服务器回应是否进入了匹配队列
				// console.log('%c 是否进入匹配队列 ====>','font-size:14px;color:blue;');
				this.timerCount[5] = setInterval(() => {
					emitter.emit('enterMatch', [message, this.timerCount[5]]);
				}, 20);
				break;
			case 1304: 		 	// 排位赛匹配成功
				// console.log('排位赛匹配成功～发送队伍信息');
				this.timerCount[6] = setInterval(() => {
					emitter.emit('getBattleTeams', [message, this.timerCount[6]]);
				}, 20);
				break;
			case 1306:			// 服务器广播当前题
				this.timerCount[7] = setInterval(() => {
					emitter.emit('getQuestion', [message, this.timerCount[7]]);
				}, 20);
				break;
			case 1308:			// 服务器答题回复 questId: 题id, optionId: 正确答案id（1=>A, 2=>B ...）
				//console.log('%c 排位赛---发送正确答案', 'font-size:14px;color:blue;'); console.log(message);
				this.timerCount[8] = setInterval(() => {
					emitter.emit('getAnswer', [message, this.timerCount[8]]);
				}, 20);
				break;
			case 1320:			// 大奖赛玩家复活信息
				this.timerCount[9] = setInterval(() => {
					emitter.emit('getRenascenceInfo', [message, this.timerCount[9]]);
				}, 20);
				break;
			case 1314:			// 复活结果（大奖赛）
				this.timerCount[10] = setInterval(() => {
					emitter.emit('getResurrectResult', [message, this.timerCount[10]]);
				}, 20);
				break;
			case 1318:
				this.timerCount[11] = setInterval(() => {
					emitter.emit('getPrizeMatchReport', [message, this.timerCount[11]]);
				}, 20);
				break;
			case 1322:  		// 服务器广播上道题的回答情况(排位赛)
				// console.log('%c === 答案 ===','font-size:14px;color:#FF6A6A');console.log(message);
				this.timerCount[12] = setInterval(() => {
					emitter.emit('getPrevQAInfo', [message, this.timerCount[12]]);
				}, 20);
				break;
			case 1324:			// 游戏结束--发本局结果
				// console.log('%c 游戏结束--发本局结果','font-size:14px;color:#FF6A6A');console.log(message);
				this.timerCount[13] = setInterval(() => {
					emitter.emit('getRankResultInfo', [message, this.timerCount[13]]);
				}, 20);
				break;
			case 1326:			// 服务器排位赛战报
				this.timerCount[14] = setInterval(() => {
					emitter.emit('getRankBattleReport', [message, this.timerCount[14]]);
				}, 20);
				break;
			case 1332:			// 响应大奖赛退出状态 
				this.timerCount[15] = setInterval(() => {
					emitter.emit('exitQueueStatus', [message, this.timerCount[15]]);
				}, 20);
			case 1334:			// 大奖赛当前队伍情况
				this.timerCount[16] = setInterval(() => {
					emitter.emit('getTeamSituation', [message, this.timerCount[16]]);
				}, 20);
				break;
			case 1312:			// 服务器广播上道题的统计（红包赛消息）
				this.timerCount[17] = setInterval(() => {
					emitter.emit('getPrizePrevQAInfo', [message, this.timerCount[17]]);
				}, 20);
				break;
			case 1902: 			// 回应充值模板信息
				this.timerCount[18] = setInterval(() => {
					emitter.emit('getRechargeMessage', [message, this.timerCount[18]]);
				}, 20);
				break;
			case 1904: 			// 接受prepay_id
				this.timerCount[19] = setInterval(() => {
					emitter.emit('getPrePay_id', [message, this.timerCount[19]]);
				}, 20);
				break;
			case 2102: 			// 提现信息
				this.timerCount[20] = setInterval(() => {
					emitter.emit('takeMoney', [message, this.timerCount[20]]);
				}, 20);
				break;
			case 2104:			// 提现状态
				this.timerCount[21] = setInterval(() => {
					emitter.emit('takeMoneyStatus', [message, this.timerCount[21]]);
				}, 20);
				break;
			case 1502:			// 背包数据
				this.timerCount[22] = setInterval(() => {
					emitter.emit('getBackpack', [message, this.timerCount[22]]);
				}, 20);
				break;
			case 1504:			// 服务器回复背包内道具id剩余道具数量
				this.timerCount[23] = setInterval(() => {
					emitter.emit('propsInfo', [message, this.timerCount[23]]);
				}, 20);
				break;
			case 1702: 			// 服务器回复商城当天已免费领取情况
				this.timerCount[24] = setInterval(() => {
					emitter.emit('getMall', [message, this.timerCount[24]]);
				}, 20);
				break;
			case 1508:			// 延时卡和求助卡数量
				this.timerCount[25] = setInterval(() => {
					emitter.emit('getMatchProps', [message, this.timerCount[25]]);
				}, 20);
				break;
			case 1338:			// 比赛使用道具结果
				this.timerCount[26] = setInterval(() => {
					emitter.emit('usedPropsResult', [message, this.timerCount[26]]);
				}, 20);
				break;
			case 1602:			// 我的乐队
				this.timerCount[27] = setInterval(() => {
					emitter.emit('getSelfOrchestra', [message, this.timerCount[27]]);
				}, 20);
				break;
			case 1802:			// 回应签到基本信息
				this.timerCount[28] = setInterval(() => {
					emitter.emit('getWeekCheckIninfo', [message, this.timerCount[28]]);
				}, 20);
				break;
			case 2202:			// 反馈结果
				this.timerCount[29] = setInterval(() => {
					emitter.emit('getOpinionResult', [message, this.timerCount[29]]);
				}, 20);
				break;
			case 1804: 			// 当天签到结果
				this.timerCount[30] = setInterval(() => {
					emitter.emit('checkInResult', [message, this.timerCount[30]]);
				}, 20);
				break;
			case 1506:			// 主力加速卡结果
				this.timerCount[31] = setInterval(() => {
					emitter.emit('quickenCardHelpResult', [message, this.timerCount[31]]);
				}, 20);
				break;
			case 2402:			// 玩法说明回
				this.timerCount[32] = setInterval(() => {
					emitter.emit('getGameDescription', [message, this.timerCount[32]]);
				}, 20);
				break;
			case 1512:			// 金币助力信息
				this.timerCount[33] = setInterval(() => {
					emitter.emit('getGoldHelp', [message, this.timerCount[33]]);
				}, 20);
				break;
			case 1310:			// 排位赛成员列表
				this.timerCount[34] = setInterval(() => {
					emitter.emit('getRankPlayer', [message, this.timerCount[34]]);
				}, 20);
				break;
		}
	}
}