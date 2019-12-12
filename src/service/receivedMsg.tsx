/*
  * @全局接受服务器返回信息
  *
  * 
  *   
*/
import Taro from '@tarojs/taro'
import emitter from './events'
import { getCurrentTime } from '../utils' // 方法类

export default class ReceiveMsg{
    constructor( message ) {
		// console.error('接收到message ===>');
		// console.info(message);
		this.tiemrMsg = '';
		this.onReceiveMsg(message);
	}

    onReceiveMsg(message){
		clearInterval(this.tiemrMsg);
		switch(message['code']){
			case 1002:  		// 服务器返回登录结果
				console.info('1002返回时间：' + getCurrentTime());
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('loginGameStatus', [message, this.tiemrMsg]);
				},500);
				break;
			case 1004:		    // 登录成功后，服务器返回角色基本信息
				// console.info('%c 发送游戏个人信息', 'font-size:14px;color:blue;');
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('loginGameInfo', [message, this.tiemrMsg]);
				},500);
				break;
			case 1006:		    // 当前性别，存在表示游戏性别设置成功
				// console.info('%c 发送游戏个人信息', 'font-size:14px;color:blue;');
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('setSex', [message, this.tiemrMsg]);
				},500);
				break;
			case 1040:  		// 服务器返回文字提示(每一步都可能会有) 1. 异常type 2.异常说明(content)
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('globalTips', [message, this.tiemrMsg]);
				},500);
				break;
			case 1010:			// 服务器推送当前货币数量: 当前剩余金币数量 / 剩余能量数量 / 门票数量
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('currencyChange', [message, this.tiemrMsg]);
				},500);
				break;
			case 1102: 			// 服务器心跳返回 1. 服务器当前时间
				// console.info('%c 服务器返回心跳','color:red;font-size:14px;'); console.info(message)
				break;
			case 1302:			// 服务器回应是否进入了匹配队列
				// console.info('%c 是否进入匹配队列 ====>','font-size:14px;color:blue;');
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('enterMatch', [message, this.tiemrMsg]);
				},500);
				break;
			case 1304: 		 	// 排位赛匹配成功
				// emitter.removeAllListeners('enterMatch');
				// console.info('排位赛匹配成功～发送队伍信息');
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('getRankBattleTeams', [message, this.tiemrMsg]);
				},500);
				// emitter.removeAllListeners('getRankBattleTeams');
				break;
			case 1306:			// 服务器广播当前题
				// console.info('%c 排位赛---发题, 发题时间 ====> '+ new Date().getSeconds(),'font-size:14px;color:blue;');
				emitter.emit('getRankQuestion', message);
				// emitter.removeAllListeners('getRankQuestion');
				break;
			case 1308:			// 服务器答题回复 questId: 题id, optionId: 正确答案id（1=>A, 2=>B ...）
				//console.info('%c 排位赛---发送正确答案', 'font-size:14px;color:blue;');
				//console.log(message);
				emitter.emit('getRankAnswer', message);
				break;
			case 1322:  		// 服务器广播上道题的回答情况(排位赛)
				// console.log('%c === 答案 ===','font-size:14px;color:#FF6A6A');
				// console.log(message);
				emitter.emit('getPrevQAInfo', message);
				break;
			case 1324:			// 游戏结束--发本局结果
				// console.log('%c 游戏结束--发本局结果','font-size:14px;color:#FF6A6A');
				// console.log(message);
				emitter.emit('getRankResultInfo', message);
				break;
			case 1326:			// 服务器排位赛战报
				// emitter.removeAllListeners('getRankBattleTeams');
				// emitter.removeAllListeners('getRankQuestion');
				// emitter.removeAllListeners('getRankAnswer');
				// emitter.removeAllListeners('getPrevQAInfo');
				// emitter.removeAllListeners('getRankResultInfo');

				emitter.emit('getRankBattleReport', message);
				break;
			case 1902: 			// 回应充值模板信息
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('getRechargeMessage', [message, this.tiemrMsg]);
				},500);
				break;
			case 1904: 			// 接受prepay_id
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('getPrePay_id', [message, this.tiemrMsg]);
				},500);
				break;
			case 2102: 			// 提现信息
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('takeMoney', [message, this.tiemrMsg]);
				},500);
				break;
			case 2104:			// 提现状态
				this.tiemrMsg = setInterval(()=>{
					emitter.emit('takeMoneyStatus', [message, this.tiemrMsg]);
				},500);
				break;
		}
    }
}