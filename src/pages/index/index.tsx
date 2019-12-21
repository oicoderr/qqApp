import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import emitter from '../../service/events';
import './index.scss'
import { getStorage, setStorage, unitReplacement, buildURL } from '../../utils'

import GenderSelectionUi from '../../components/GenderSelectionUi'
import WeekCheckIn from '../../components/WeekCheckIn'
import RedExchange from '../../components/RedExchange'
import CommonToast from '../../components/CommonToast'
import Drawer from '../../components/drawer'
import MsgProto from '../../service/msgProto'
import { createWebSocket } from '../../service/createWebSocket'
const App = Taro.getApp()

export class Index extends Component {
	config: Config = {
		navigationBarTitleText: '音乐大作战主页',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			routers:{
				/* 断线重连 */
				rankQueue: '/pages/rankMatch/queue',
				rankGameEntrance: '/pages/rankMatch/entrance',
				rankEnterGame: '/pages/rankMatch/enterGame',
				prizeMatch: '/pages/prizeMatch/entrance',
				prizeMatchQueue: '/pages/prizeMatch/queue',
				prizeMatchEnterGame: '/pages/prizeMatch/enterGame',
				/* 断线重连 End*/
				goTakeMoneyPage: '/pages/payTakeMoney/takeMoney',
				goPayTicketsPage: '/pages/payTakeMoney/recharge'
			},

			userInfo:{
				"nickName": "",
				"avatarUrl": "",
				"gender": 1,
				"language": "zh_CN",
				"city": "",
				"country": "",
				"province": "",
				"accessToken": "",
				"openid": "",
				"session_key": "",
			},

			gameUserInfo:{
				roleId: -1,
				level: 1,
				imgurl: '',
				nickName: '',
				sex: 0,  		// 默认已选择性别
				copper: 1234,	// 金币 
				redEnvelope: 0, // 红包
				energy: 0,		// 能量
			},

			personTheme: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/personTheme.png',

		};
		this.msgProto = new MsgProto();
	}

	componentWillMount () {}

	componentDidMount () {
		let _this = this;
		// console.info(getCurrentTime(),'DidMount');
		getStorage('gameUserInfo',(res)=>{
			if(res!==''){
				_this.setState((preState)=>{
					preState.gameUserInfo = res;
				})
			}
		});
		
		this.eventEmitter = emitter.addListener('closeToastMessage', (message) => {
			console.warn('接受‘签到组件-关闭显示’发送的信息==>' + message);
			// this.setState({
			// 	gender: message
			// },()=>{
			// 	console.info(this.state.gender);
			// })
		});

		this.eventEmitter = emitter.addListener('shareFlaunt', (message) => {
			console.warn('接受‘签到组件-炫耀一下’发送的信息==>' + message);
			// this.setState({
			// 	gender: message
			// },()=>{
			// 	console.info(this.state.gender);
			// })
		});

		this.eventEmitter = emitter.addListener('curRewardStatus', (message) => {
			console.warn('接受‘签到组件-奖励状态’发送的信息==>' + message);
			// this.setState({
			// 	gender: message
			// },()=>{
			// 	console.info(this.state.gender);
			// })
		});

		this.eventEmitter = emitter.addListener('RedEnvelopeConvert', (message) => {
			console.warn( message, 111);
			// this.setState({
			// 	gender: message
			// },()=>{
			// 	console.info(this.state.gender);
			// })
		});
		// <====================  other  ====================>
		// 返回并设置性别
		this.eventEmitter = emitter.once('genderMessage', (message) => {
			console.info('%c 接受< 性别选择 >子组件发送的信息==> ' + message, 'font-size:14px; color: blue;');
			let slectSex = _this.msgProto.gameSex(message);
			let parentModule = _this.msgProto.parentModule(slectSex);
			_this.webSocket.sendWebSocketMsg({
				data: parentModule,
				success(res) {
					_this.setState((preState)=>{
						preState.gameUserInfo.sex = message;
						preState.userInfo.sex = message;
					},()=>{})
				},
				fail(err){
					console.error('性别发送失败');console.info(err);
				}
			});
		});

		// 1004游戏登录成功返回基本信息
		this.eventEmitter = emitter.once('loginGameInfo', (message) => {
			// console.info('%c 接受用户游戏基本信息==> ', 'color: blue;font-size:14px;'); console.info(message);
			// 清除消息转发定时器
			clearInterval(message[1]);
			// 消息本体
			_this.setState((preState)=>{
				let gameUserInfo = JSON.parse(JSON.stringify(message[0]['data']));
				gameUserInfo['copper'] = unitReplacement(gameUserInfo['copper']);
				gameUserInfo['redEnvelope'] = unitReplacement(gameUserInfo['redEnvelope']);
				gameUserInfo['energy'] = unitReplacement(gameUserInfo['energy']);
				preState.gameUserInfo = gameUserInfo;
				// 设置roleId
				preState.userInfo.roleId = gameUserInfo.roleId;
				setStorage('gameUserInfo', gameUserInfo);
			});
		});

		// 1006游戏性别设置状态 setSex
		this.eventEmitter = emitter.once('setSex', (message) => {
			console.info('%c 设置性别状态==> ', 'color: blue;font-size:14px;'); console.info(message);
			// 清除消息转发定时器
			clearInterval(message[1]);

			// 消息本体
			_this.setState((preState)=>{
				let gameUserInfo = {};
				getStorage('gameUserInfo',(res)=>{
					for(let x in res){
						gameUserInfo[x] = res[x];
					}
					gameUserInfo['sex'] = message[0]['data']['value'];
					preState.userInfo.sex = message[0]['data']['value']; // 设置本地，未设置缓存
				})
				preState.gameUserInfo = gameUserInfo;
				setStorage('gameUserInfo', gameUserInfo);
			});
		});
	}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		// 接受AppGlobalSocket
		if(App.globalData.webSocket === ''){
			console.info('%c indexPAge 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.webSocket = App.globalData.webSocket;
		}

		// 更新金币/红包/能量-数量
		getStorage('currencyChange',(res)=>{
			if(res!=''){
				_this.setState((preState)=>{
					preState.gameUserInfo.copper = unitReplacement(res.copper);
					preState.gameUserInfo.energy = unitReplacement(res.energy);
					preState.gameUserInfo.redEnvelope = unitReplacement(res.redEnvelope);
				})
			}
		});

// -------------------------- 游戏被杀死，重新进入游戏 --------------------------------------
		// 1302 匹配ing杀死app，根据字段是否断线重连判断：isreconnection 1. 在匹配中杀死的
		this.eventEmitter = emitter.addListener('enterMatch', (message) => {
			clearInterval(message[1]);

			let isreconnection = message[0]['data']['isreconnection'];
			let result = message[0]['data']['result'];
			let type =  message[0]['data']['type']; // 1.好友赛；2.大奖赛；3.排位赛
			console.info('%c 队列ing杀死app，开始进入队列','font-size:14px;color:#ffa61a;');
			// 开启断线重连并进入匹配队列
			if(isreconnection && result){
				switch(type){
					case 1:

						break;
					case 2:
						Taro.redirectTo({
							url: this.state.routers.prizeMatchQueue + '?isreconnection=1'
						});
						break;
					case 3:
						// 跳转排位赛匹配页
						Taro.redirectTo({
							url: this.state.routers.enterGamePage + '?isreconnection=1'
						});
						break;
				}
				Taro.showToast({
					title: '进入匹配队列',
					icon: 'none',
					duration: 2000,
				});
			}
		});

		// 1304 - 2.在游戏中杀死的
		this.eventEmitter = emitter.addListener('getBattleTeams', (message) => {
			clearInterval(message[1]);

			console.error('～游戏中杀死app～');console.info(message[0]['data']);
			// 排位赛杀死的
			let isreconnection_ = message[0]['data']['isreconnection']; 
			// 大奖赛杀死的
			let isreconnection = message[0]['data']['redPalyerOnInstance'][0]['isreconnection'];
			// 在游戏中杀死的
			if(isreconnection_ === 1 || isreconnection === 1){
				console.error('游戏中杀死游戏退出，进来的玩家');
				// 比赛类型 1.好友赛；2.大奖赛；3.排位赛；
				let type = message[0]['data']['redPalyerOnInstance'][0]['type'];
				switch(type){
					case 1:
	
						break;
					case 2:
						Taro.redirectTo({
							url: _this.state.routers.prizeMatchEnterGame
						});
						break;
					case 3:
						// 排位赛游戏中退出跳转到队列页，因为队伍处理在队列页面
						Taro.redirectTo({
							url: buildURL(_this.state.routers.rankQueue,{item: message[0]['data']})
						});
						break;
				}
			}else{
				console.info('%c ～正常进入比赛玩家～','font-size:14px; color:#ffc61a;');
			}
		});
// -------------------------- 游戏被杀死，重新进入游戏 End-----------------------------------
	}

	componentDidHide () {
		console.info('%c 主页DidHide，开始removeAllListeners','font-size:14px;background-color:#fff81a; color:#00000;');
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('getBattleTeams');
		emitter.removeAllListeners('getQuestion');
		emitter.removeAllListeners('getAnswer');
		emitter.removeAllListeners('getRenascenceInfo');
		emitter.removeAllListeners('getResurrectResult');
		emitter.removeAllListeners('getPrizeMatchReport');
		emitter.removeAllListeners('getPrevQAInfo');
		emitter.removeAllListeners('getRankResultInfo');
		emitter.removeAllListeners('getRankBattleReport');
		emitter.removeAllListeners('exitQueueStatus');
		emitter.removeAllListeners('getTeamSituation');
		emitter.removeAllListeners('getPrizePrevQAInfo');
		emitter.removeAllListeners('getRechargeMessage');
		emitter.removeAllListeners('getPrePay_id');
		emitter.removeAllListeners('takeMoney');
		emitter.removeAllListeners('takeMoneyStatus');
		emitter.removeAllListeners('getBackpack');
		emitter.removeAllListeners('propsInfo');
		emitter.removeAllListeners('getMall');
		emitter.removeAllListeners('getMatchProps');
		emitter.removeAllListeners('usedPropsResult');
	}

	// 红包赛入口页
	goPrizeMatchBtn(){
		let prizeMatch = this.state.routers.prizeMatch;
		Taro.navigateTo({
			url: prizeMatch
		})
	}

	// 跳转排位赛入口页
	rankEntrance(){
		let rankGameEntrance = this.state.routers.rankGameEntrance;
		Taro.navigateTo({
			url: rankGameEntrance
		})
	}

	// 跳转提现页
	goTakeMoney(){
		Taro.navigateTo({
			url: this.state.routers.goTakeMoneyPage
		})
	}

	// 跳转门票购买页
	goPayTickets(){
		Taro.navigateTo({
			url: this.state.routers.goPayTicketsPage
		})
	}

	render () {
		const {redEnvelope, copper, sex } = this.state.gameUserInfo;
		const personTheme = this.state.personTheme;

		return (
			<View className='index' catchtouchmove="ture">
				{/* 左侧按钮list */}
				< Drawer />

				<View className='hide'>
					< WeekCheckIn />
				</View>

				<View className='hide'>
					< RedExchange />
				</View>

				<View className='hide'>
					< CommonToast />
				</View>

				<View className='bgColor'>
					<View className={`genderSlection ${ sex === -1?'':'hide'} `} > 
						<GenderSelectionUi />
					</View>
					<View className='bgImg'></View>
					<View className='head'>
						<View className='avatarWrap'>
							<View className='avatar'>
								<openData type="userAvatarUrl"></openData>
							</View>
						</View>
						
						<View className='goldsWrap'>
							<View className='board-same board'></View>
							<View className='icon-same goldIcon'></View>
							<Text className='num-same goldNum'>{copper}</Text>
							<View className='addIcon-same addIcon' ></View>
						</View>
						<View className='redEnvelopeWrap'>
							<View className='board-same board'></View>
							<View className='icon-same envelopeIcon' ></View>
							<Text className='num-same envelopeNum'>{redEnvelope}</Text>
							<View onClick={this.goPayTickets.bind(this)} className='addIcon-same addIcon' ></View>
						</View>
					</View>

					{/* 右侧按钮list */}
					<View className='rightListBtn'>
						<View className='rightBtnIcon problemBtn'></View>
						<View className='rightBtnIcon signInBtn'></View>
						<View className='rightBtnIcon welfareBtn'></View>
					</View>

					<View className='body'>
						<Image src={ personTheme } className='personTheme'></Image>
					</View>

					<View className='foot'>
						<View onClick={this.goPrizeMatchBtn.bind(this)} className='sameBtn redEnvelopeBtn'></View>
						<View className='bothBtn'>
							<View onClick={this.goTakeMoney.bind(this)} className='sameBtn withdrawBtn'></View>
							<View className='sameBtn OneVOneBtn'></View>
						</View>
						<View onClick={this.rankEntrance.bind(this)} className='sameBtn rankBtn'></View>
					</View>
				</View>
			</View>
		)
	}
}