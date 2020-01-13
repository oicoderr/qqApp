import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import emitter from '../../service/events';
import './index.scss'
import { getStorage, setStorage, removeStorage, getCurrentPageUrl, unitReplacement, buildURL, showShareMenuItem, get_OpenId_RoleId } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import configObj from '../../service/configObj'
import GenderSelectionUi from '../../components/GenderSelectionUi'
import WeekCheckIn from '../../components/WeekCheckIn'
import { AdvanceRoadUi } from '../../components/advanceRoadUi'
import HomeBandUi from '../../components/HomeBandUi'
import Drawer from '../../components/drawer'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp()

export class Index extends Component {

	config: Config = {
		navigationBarTitleText: '音乐大作战主页',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {

			routers: {
				/* 断线重连 */
				rankQueue: '/pages/rankMatch/queue',
				rankGameEntrance: '/pages/rankMatch/entrance',
				rankEnterGame: '/pages/rankMatch/enterGame',
				prizeMatch: '/pages/prizeMatch/entrance',
				prizeMatchQueue: '/pages/prizeMatch/queue',
				prizeMatchEnterGame: '/pages/prizeMatch/enterGame',
				/* 断线重连 End*/
				goTakeMoneyPage: '/pages/payTakeMoney/takeMoney',
				goPayTicketsPage: '/pages/payTakeMoney/recharge',
				goldHelpPage: '/pages/activity/goldHelp',
			},

			userInfo: {
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

			gameUserInfo: {
				roleId: -1,
				level: 1,
				imgurl: '',
				nickName: '',
				sex: 0,  		// 默认已选择性别
				copper: 1234,	// 金币 
				redEnvelope: 0, // 红包
				energy: 0,		// 能量
			},

			// 签到组件显示
			isShowWeekCheckIn: false,
			// 晋级之路
			isShowAdvanceRoadUi: false,
			// 签到基本信息
			weekCheckInInfo: {},
			// 默认勾选了签到分享
			isShareCheckedChange: true,
			// 我的乐队信息
			selfOrchestra: {},
			// 货币
			currencyChange: {
				energy: 0,
				copper: 1234,
				redEnvelope: 0,
			},

			websocketUrl: '',
		};

		this.msgProto = new MsgProto();
	}

	componentWillMount() { }

	componentDidMount() {
		let _this = this;
		getStorage('gameUserInfo', (res) => {
			if (res !== '') {
				_this.setState((preState) => {
					preState.gameUserInfo = res;
				})
			}
		});
		removeStorage('inviterInfo');
	}

	componentWillUnmount() {
		console.log('%c 主页WillUnmount，开始removeAllListeners', 'font-size:14px;background-color:#fff81a; color:#00000;');
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('getBattleTeams');
		emitter.removeAllListeners('getWeekCheckIninfo');
		emitter.removeAllListeners('closeWeekCheckIn');
		emitter.removeAllListeners('curRewardStatus');
		emitter.removeAllListeners('RedEnvelopeConvert');
		emitter.removeAllListeners('closeAdvanceRoadToast');
		emitter.removeAllListeners('checkInResult');
		emitter.removeAllListeners('getSelfOrchestra');
		emitter.removeAllListeners('currencyChange');
		emitter.removeAllListeners('requestUrl');
	}

	componentDidShow() {
		let _this = this;
		// 首页pv
		App.aldstat.sendEvent('pv-主页', get_OpenId_RoleId());

		// 显示分享
		showShareMenuItem();
		// 页面超出提示,返回当前页面URL
		let currentPageUrl = getCurrentPageUrl();

		// 获取当前版本
		configObj.getVersion();
		// 监听requestUrl
		this.eventEmitter = emitter.addListener('requestUrl', message => {
			clearInterval(message[0]);

			this.state.websocketUrl = message[1]['websocketUrl'];

			// 接受AppGlobalSocket
			if (App.globalData.websocket === '') {
				createWebSocket(this);
			} else {
				this.websocket = App.globalData.websocket;
				let websocketUrl = this.state.websocketUrl;
				if (this.websocket.isLogin) {
					// 1601 请求乐队基本信息
					this.getSelfOrchestra();
				} else {
					this.websocket.initWebSocket({
						url: websocketUrl,
						success(res) {
							// 开始登陆
							_this.websocket.onSocketOpened((res) => {
								// 1601 请求乐队基本信息
								this.getSelfOrchestra();
							});
							// 对外抛出websocket
							App.globalData.websocket = _this.websocket;
						},
						fail(err) {
							createWebSocket(_this);
						}
					});
				}
			}
		});

		// 更新金币/红包/能量-数量
		getStorage('currencyChange', (res) => {
			if (res != '') {
				_this.setState((preState) => {
					preState.currencyChange.copper = res.copper;
					preState.currencyChange.energy = res.energy;
					preState.currencyChange.redEnvelope = res.redEnvelope;
				}, () => { })
			}
		});

		// 返回并设置性别
		this.eventEmitter = emitter.once('genderMessage', (message) => {
			console.log('%c 接受< 性别选择 >子组件发送的信息==> ' + message, 'font-size:14px; color: blue;');
			App.aldstat.sendEvent('设置性别',{
				"sex" : message,
				'ids': get_OpenId_RoleId(),
      });
			this.setSex(message);
		});

		// -------------------------- 游戏被杀死，重新进入游戏 --------------------------------------
		// 1302 匹配ing杀死app，根据字段是否断线重连判断：isreconnection 1. 在匹配中杀死的
		this.eventEmitter = emitter.addListener('enterMatch', (message) => {
			clearInterval(message[1]);

			let isreconnection = message[0]['data']['isreconnection'];
			let result = message[0]['data']['result'];
			let type = message[0]['data']['type']; // 1.好友赛；2.大奖赛；3.排位赛
			console.log('%c 队列ing杀死app，开始进入队列', 'font-size:14px;color:#ffa61a;');
			// 开启断线重连并进入匹配队列
			if (isreconnection && result) {
				switch (type) {
					case 1:

						break;
					case 2:
						Taro.reLaunch({
							url: this.state.routers.prizeMatchQueue + '?isreconnection=1'
						});
						break;
					case 3:
						// 跳转排位赛匹配页
						Taro.reLaunch({
							url: this.state.routers.rankQueue + '?isreconnection=1'
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

			console.log('%c ～游戏中杀死app～', 'font-size:14px;color:#ff511f;'); console.log(message[0]['data']);
			// 排位赛杀死的
			let isreconnection_ = message[0]['data']['isreconnection'];
			// 大奖赛杀死的
			let isreconnection = message[0]['data']['redPalyerOnInstance'][0]['isreconnection'];
			// 在游戏中杀死的
			if (isreconnection_ === 1 || isreconnection === 1) {
				console.error('游戏中杀死游戏退出，进来的玩家');
				// 比赛类型 1.好友赛；2.大奖赛；3.排位赛；
				let type = message[0]['data']['redPalyerOnInstance'][0]['type'];
				switch (type) {
					case 1:

						break;
					case 2:
						Taro.reLaunch({
							url: _this.state.routers.prizeMatchEnterGame
						});
						break;
					case 3:
						// 排位赛游戏中退出跳转到队列页，因为队伍处理在队列页面
						Taro.reLaunch({
							url: buildURL(_this.state.routers.rankQueue, { item: message[0]['data'] })
						});
						break;
				}
			}
		});
		// -------------------------- 游戏被杀死，重新进入游戏 End-----------------------------------

		// 1802 回应签到基本信息
		this.eventEmitter = emitter.addListener('getWeekCheckIninfo', (message) => {
			clearInterval(message[1]);

			console.log('%c ～签到基本信息：～', 'font-size: 14px; color: #ffda57;background:#000000;'); console.log(message[0]['data']);
			let weekCheckInInfo = message[0]['data'];
			// 发给子组件签到信息
			emitter.emit('weekCheckInInfo_child', weekCheckInInfo);
			// 显示签到组件
			this.setState((preState) => {
				preState.weekCheckInInfo = weekCheckInInfo;
				preState.isShowWeekCheckIn = true;
			});
		});

		// 签到关闭
		this.eventEmitter = emitter.addListener('closeWeekCheckIn', (message) => {
			console.log('接受‘签到组件-关闭显示’的信息==>' + message);
			this.setState((preState) => {
				preState.isShowWeekCheckIn = false;
			});
		});

		// 领取奖励
		this.eventEmitter = emitter.addListener('curRewardStatus', (message) => {
			console.log('%c 接受‘签到组件-领取奖励`信息==>', 'font-size:14px;color:#007ef0;background:#d1d1d1;'); console.log(message);
			this.setState((preState) => {
				preState.isShareCheckedChange = message.shareCheckedChange;
			}, () => {
				// 请求签到信息
				_this.signIn();
			});
		});

		this.eventEmitter = emitter.addListener('RedEnvelopeConvert', (message) => {
			console.log(message);
			// this.setState({
			// 	gender: message
			// },()=>{
			// 	console.log(this.state.gender);
			// })
		});

		// 1004游戏登录成功返回基本信息
		this.eventEmitter = emitter.once('loginGameInfo', (message) => {
			// console.log('%c 接受用户游戏基本信息==> ', 'color: blue;font-size:14px;'); console.log(message);
			// 清除消息转发定时器
			clearInterval(message[1]);
			// 消息本体
			_this.setState((preState) => {
				let gameUserInfo = JSON.parse(JSON.stringify(message[0]['data']));
				preState.gameUserInfo['copper'] = unitReplacement(gameUserInfo['copper']);
				preState.gameUserInfo['redEnvelope'] = unitReplacement(gameUserInfo['redEnvelope']);
				preState.gameUserInfo['energy'] = unitReplacement(gameUserInfo['energy']);
				preState.currencyChange['copper'] = unitReplacement(gameUserInfo['copper']);
				preState.currencyChange['redEnvelope'] = unitReplacement(gameUserInfo['redEnvelope']);
				preState.currencyChange['energy'] = unitReplacement(gameUserInfo['energy']);
				preState.gameUserInfo = gameUserInfo;
				// 设置roleId
				preState.userInfo.roleId = gameUserInfo.roleId;
				setStorage('gameUserInfo', gameUserInfo);
				// 将游戏个人信息中的货币抽出,保存缓存
				setStorage('currencyChange', preState.currencyChange);
			});
		});

		// 1006游戏性别设置状态 setSex
		this.eventEmitter = emitter.once('setSex', (message) => {
			console.log('%c 设置性别状态==> ', 'color: blue;font-size:14px;'); console.log(message);
			// 清除消息转发定时器
			clearInterval(message[1]);

			// 消息本体
			_this.setState((preState) => {
				let gameUserInfo = {};
				getStorage('gameUserInfo', (res) => {
					for (let x in res) {
						gameUserInfo[x] = res[x];
					}
					gameUserInfo['sex'] = message[0]['data']['value'];
					preState.userInfo.sex = message[0]['data']['value']; // 设置本地，未设置缓存
				})
				preState.gameUserInfo = gameUserInfo;
				setStorage('gameUserInfo', gameUserInfo);
			});
		});

		// 接受晋级之路组件发送的关闭信息
		this.eventEmitter = emitter.addListener('closeAdvanceRoadToast', (message) => {
			this.setState((preState) => {
				preState.isShowAdvanceRoadUi = false;
			})
		});

		// 1804 接受签到结果 
		this.eventEmitter = emitter.addListener('checkInResult', (message) => {
			clearInterval(message[1]);

			console.log('%c 当日签到结果 ===>', 'font-size:14px;color:#ba5a81;background:#e0e0e0;'); console.log(message[0]['data']);
		});

		// 1602 接受我的乐队信息 -> 发送子组件`我的乐队信息`
		this.eventEmitter = emitter.addListener('getSelfOrchestra', (message) => {
			clearInterval(message[1]);

			let selfOrchestra = message[0]['data'];
			this.setState((preState) => {
				preState.selfOrchestra = selfOrchestra;
			});
			emitter.emit('selfOrchestra', selfOrchestra);
			console.log('%c 我的乐队信息 ===>', 'font-size:14px;color:#ff1a85;background:#e0e0e0;'); console.log(message[0]['data']);
		});

		// 1010 货币发生变化直接更新（签到奖励等需要直接更新前台）
		this.eventEmitter = emitter.addListener('currencyChange', (message) => {
			clearInterval(message[1]);

			console.log('%c 主页收到1010货币发生变化', 'font-size:14px;color:#ff311f;'); console.log(message);
			let currencyChange = message[0]['data'];
			this.setState((preState) => {
				preState.currencyChange = {
					copper: unitReplacement(currencyChange.copper),
					energy: unitReplacement(currencyChange.energy),
					redEnvelope: unitReplacement(currencyChange.redEnvelope)
				}
			}, () => {
				setStorage('currencyChange', _this.state.currencyChange);
			});
		});
	}

	componentDidHide() {
		console.log('%c 主页DidHide，开始removeAllListeners', 'font-size:14px;background-color:#fff81a; color:#00000;');
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('getBattleTeams');
		emitter.removeAllListeners('getWeekCheckIninfo');
		emitter.removeAllListeners('closeWeekCheckIn');
		emitter.removeAllListeners('curRewardStatus');
		emitter.removeAllListeners('RedEnvelopeConvert');
		emitter.removeAllListeners('closeAdvanceRoadToast');
		emitter.removeAllListeners('checkInResult');
		emitter.removeAllListeners('getSelfOrchestra');
		emitter.removeAllListeners('currencyChange');
		emitter.removeAllListeners('requestUrl');
	}

	// 设置性别
	setSex(message){
		let _this = this;
		let setSex = this.msgProto.gameSex(message);
		let parentModule = this.msgProto.parentModule(setSex);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {
				_this.setState((preState) => {
					preState.gameUserInfo.sex = message;
					preState.userInfo.sex = message;
				});
			},
			fail(err) {
				console.error('性别发送失败'); console.log(err);
			}
		});
	}

	// 大奖赛入口页
	goPrizeMatchBtn() {
		// 大奖赛点击
		App.aldstat.sendEvent('click-大奖赛', get_OpenId_RoleId());

		let prizeMatch = this.state.routers.prizeMatch;
		Taro.navigateTo({
			url: prizeMatch
		})
	}

	// 跳转排位赛入口页
	rankEntrance() {
		// 排位赛点击
		App.aldstat.sendEvent('click-排位赛', get_OpenId_RoleId());

		let rankGameEntrance = this.state.routers.rankGameEntrance;
		Taro.navigateTo({
			url: rankGameEntrance
		})
	}

	// 跳转提现页
	goTakeMoney() {
		// 兑换点击
		App.aldstat.sendEvent('click-兑换', get_OpenId_RoleId());
		let goTakeMoneyPage = this.state.routers.goTakeMoneyPage;
		Taro.navigateTo({
			url: goTakeMoneyPage
		})
	}

	// 跳转门票购买页
	goPayTickets() {
		let goPayTicketsPage = this.state.routers.goPayTicketsPage;
		Taro.navigateTo({
			url: goPayTicketsPage
		})
	}

	// 显示签到
	weekCheckIn() {
		// 签到点击
		App.aldstat.sendEvent('click-签到', get_OpenId_RoleId());
		// 1801 请求签到基本信息
		let weekCheckIn = this.msgProto.weekCheckIn();
		let parentModule = this.msgProto.parentModule(weekCheckIn);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { },
			fail(err) {
				console.error('请求签到基本信息发送失败：'); console.log(err);
			}
		});
	}

	// 请求签到
	signIn() {
		// 开始签到
		let signIn = this.msgProto.signIn();
		let parentModule = this.msgProto.parentModule(signIn);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { },
			fail(err) {
				console.error('请求我要签到发送失败：'); console.log(err);
			}
		});
	}

	// 显示晋级之路
	advanceRoad() {
		let gameUserInfo = this.state.gameUserInfo;
		let dan = gameUserInfo.dan;
		// 晋级之路子组件发送当前段位
		emitter.emit('current_dan', { 'dan': dan });
		// 头像点击
		App.aldstat.sendEvent('click-头像', get_OpenId_RoleId());

		this.setState((preState) => {
			preState.isShowAdvanceRoadUi = !preState.isShowAdvanceRoadUi;
		});
	}

	// 跳转金币助力
	goldHelp() {
		let goldHelpPage = this.state.routers.goldHelpPage;
		// 金币点击
		App.aldstat.sendEvent('click-金币+', get_OpenId_RoleId());

		Taro.navigateTo({
			url: goldHelpPage
		});
	}

	// 请求乐队基本信息
	getSelfOrchestra() {
		let selfOrchestra = this.msgProto.selfOrchestra();
		let parentModule = this.msgProto.parentModule(selfOrchestra);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.log('请求我的乐队基本信息Success') },
			fail(err) {
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	render() {
		const { sex } = this.state.gameUserInfo;
		const { redEnvelope, copper, energy } = this.state.currencyChange;
		const isShowWeekCheckIn = this.state.isShowWeekCheckIn;
		const isShowAdvanceRoadUi = this.state.isShowAdvanceRoadUi;
		return (
			<View className='index' catchtouchmove="ture">
				{/* 左侧按钮list */}
				<Drawer />

				{/* 签到 */}
				<View className={`${isShowWeekCheckIn ? '' : 'hide'}`}>
					<WeekCheckIn />
				</View>

				{/* 晋级之路 */}
				<View className={`${isShowAdvanceRoadUi ? '' : 'hide'}`}>
					<AdvanceRoadUi />
				</View>

				<View className='bgColor'>
					<View className={`genderSlection ${sex === -1 ? '' : 'hide'} `} >
						<GenderSelectionUi />
					</View>
					<View className='bgImg'></View>
					<View className='head'>
						<View onClick={this.advanceRoad.bind(this)} className='avatarWrap'>
							<View className='avatar'>
								<openData type="userAvatarUrl" lang="zh_CN"></openData>
							</View>
						</View>

						<View className='goldsWrap'>
							<View className='board-same board'></View>
							<View className='icon-same goldIcon'></View>
							<Text className='num-same goldNum'>{copper}</Text>
							<View onClick={this.goldHelp.bind(this)} className='addIcon-same addIcon' ></View>
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
						<View onClick={this.weekCheckIn.bind(this)} className='rightBtnIcon signInBtn'></View>
						<View className='hide rightBtnIcon welfareBtn'></View>
					</View>
					<View className='body'>
						<HomeBandUi />
					</View>
					<View className='foot'>
						<View onClick={this.goPrizeMatchBtn.bind(this)} className='sameBtn redEnvelopeBtn'>
							<View className='cashTip'></View>
						</View>
						<View className='bothBtn'>
							<View onClick={this.goTakeMoney.bind(this)} className='sameBtn withdrawBtn'></View>
							<View className='sameBtn OneVOneBtn'>敬请期待</View>
						</View>
						<View onClick={this.rankEntrance.bind(this)} className='sameBtn rankBtn'></View>
					</View>
				</View>
			</View>
		)
	}
}