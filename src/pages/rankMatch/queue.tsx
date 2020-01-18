import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { getStorage, buildURL, getArrayItems, get_OpenId_RoleId } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import configObj from '../../service/configObj'
import emitter from '../../service/events'
import './queue.scss'

import GameLoading from '../../components/GameLoading'
import MsgProto from '../../service/msgProto'
const App = Taro.getApp();

export class PrizeQueue extends Component {

	config: Config = {
		navigationBarTitleText: '排位赛队列',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		// 实例化msg对象
		this.msgProto = new MsgProto();

		this.state = {
			// 路由
			routers: {
				goenterGamePage: '/pages/rankMatch/enterGame',
				entrancePage: '/pages/rankMatch/entrance'
			},

			// 后台返回数据
			data: {
				redPalyerOnInstance: [],
				bluePalyerOnInstance: []
			},

			// 前台数据
			local_data: {
				timer: '',						// 定时器
				players: [],					// 所有玩家头像
				curTeamInfo: { currCount: 1, maxCount: 6 },
				playerPosition: [			// 头像位置
					{
						x: 66,
						y: 434,
						headUrl: 'https://oss.snmgame.com/v1.0.0/rankDefaultHeadImg.png',
					}, {
						x: 162,
						y: 640,
						headUrl: 'https://oss.snmgame.com/v1.0.0/rankDefaultHeadImg.png',
					}, {
						x: 457,
						y: 241,
						headUrl: 'https://oss.snmgame.com/v1.0.0/rankDefaultHeadImg.png',
					}, {
						x: 534,
						y: 434,
						headUrl: 'https://oss.snmgame.com/v1.0.0/rankDefaultHeadImg.png',
					}, {
						x: 457,
						y: 620,
						headUrl: 'https://oss.snmgame.com/v1.0.0/rankDefaultHeadImg.png',
					}
				],
				isShowLoading: true,
				isreconnection: 0,		// 断线重连
				isIntheGame: false,		// 是否游戏中断线，默认不是
				rankUserInfo: {},
				// 个人游戏基本信息 => 缓存取
				gameUserInfo: {
					"copper": "",
					"dan": 1,
					"danDesc": "学院小白",
					"energy": 1,
					"gloryUrl": "",
					"haveStar": 1,
					"headurl": "",
					"level": 1,
					"nickName": "",
					"redEnvelope": "",
					"roleId": '',
					"season": 1,
					"segmentTitleUrl": "",
					"sex": 1,
					"totalStar": 4
				},
				PartyATeam: [],
				PartyBTeam: [],
				matchStatus: true,
				quitBtn: 'https://oss.snmgame.com/v1.0.0/rankQuitBtn.png',
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				rankCenterIcon: 'https://oss.snmgame.com/v1.0.0/rankCenterIcon.png',
				rankQueueTip: 'https://oss.snmgame.com/v1.0.0/rankQueueTip.png',
				searchIcon: 'https://oss.snmgame.com/v1.0.0/searchIcon.gif',
				rankDefaultHeadImg: 'https://oss.snmgame.com/v1.0.0/rankDefaultHeadImg.png',
				matchingTxt: '匹配中...',
			},
			websocketUrl: '',
		}
		this.msgProto = new MsgProto();
	}

	componentDidMount() {
		// 获取个人游戏信息
		this.getGameUserInfo();

		// 匹配中断线重连状态
		const params = this.$router.params;
		console.log('params ==>'); console.log(params);
		const isreconnection = params.isreconnection;
		if (isreconnection === '1') {
			this.setState((preState) => {
				preState.local_data.isreconnection = 1;
			});
		} else {
			this.setState((preState) => {
				preState.local_data.isreconnection = 0;
			});
		}

		// 游戏中断线重连状态
		if (params.item) {
			console.log('%c 游戏中途退出重连', 'font-size:14px;#5d00f0;');
			let teams = JSON.parse(params.item);
			this.setState((preState) => {
				// 设置游戏中断线重连
				preState.local_data.isIntheGame = true;
				// 收到后台 ‘匹配成功后开始从新编队’
				let goenterGamePage = this.state.routers.goenterGamePage;
				this.afreshFormation(teams['redPalyerOnInstance'], teams['bluePalyerOnInstance'], (data) => {
					console.log('%c 断线重连data ===>', 'font-size:14px;color:red;')
					console.log(data);
					Taro.reLaunch({
						url: buildURL(goenterGamePage, { item: data })
					});
				});
			})
		}
	}

	componentWillUnmount() {
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('exitQueueStatus');
		emitter.removeAllListeners('requestUrl');
		emitter.removeAllListeners('getRankPlayer');
	}

	componentDidShow() {
		let _this = this;
		// 排位赛匹配pv
		App.aldstat.sendEvent('pv-排位赛匹配', get_OpenId_RoleId());

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
					console.log("%c 您已经登录了", 'background:#000;color:white;font-size:14px');
					this.rankMatching();
				} else {
					this.websocket.initWebSocket({
						url: websocketUrl,
						success(res) {
							// 开始登陆
							_this.websocket.onSocketOpened((res) => {
								_this.rankMatching();
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

		// 1310 匹配成功的玩家头像list
		this.eventEmitter = emitter.addListener('getRankPlayer', (message) => {
			clearInterval(message[1]);
			let list = JSON.parse(JSON.stringify(message[0]['data']['list']));
			let myRoleId = this.state.local_data.gameUserInfo.roleId;
			let playerPosition = this.state.local_data.playerPosition;
			list.map((cur, index) => {
				if (cur.roleId == myRoleId) {
					list.splice(index, 1);
				}
			});

			this.setState((preState) => {
				list.map((cur, index) => {
					preState.local_data.playerPosition[index]['headUrl'] = cur.headUrl;
					preState.local_data.curTeamInfo = { currCount: 6, maxCount: 6 };
				});
				preState.local_data.players = list;
			});
		});

		// 1302 返回是否已进入匹配队列，判断不是断线重连开始进入匹配
		this.eventEmitter = emitter.addListener('enterMatch', (message) => {
			clearInterval(message[1]);

			if (!message[0]['data']['isreconnection'] && message[0]['data']['result']) {
				Taro.showToast({
					title: '进入匹配队列',
					icon: 'none',
					duration: 2000,
				});
			} else {
				Taro.showToast({
					title: message[0]['data']['errormsg'],
					icon: 'none',
					duration: 2000,
				});
			}
		});

		// 1332 排位赛退出匹配状态
		this.eventEmitter = emitter.once('exitQueueStatus', (message) => {
			clearInterval(message[1]);

			let entrancePage = this.state.routers.entrancePage;
			Taro.redirectTo({
				url: entrancePage,
				success() {
					Taro.showToast({
						title: '退出匹配',
						icon: 'none',
						duration: 2000
					});
				}
			});
		});

		// 匹配成功！获取对战队伍信息
		let isIntheGame = this.state.local_data.isIntheGame;
		if (!isIntheGame) {
			this.eventEmitter = emitter.addListener('getBattleTeams', (message) => {
				clearInterval(message[1]);
				let goenterGamePage = this.state.routers.goenterGamePage;
				this.setState((preState) => {
					preState.data.curTeamInfo = { currCount: 6, maxCount: 6 };
				});
				console.log('所有队伍');
				console.log(message[0]['data']);
				let PartyATeam = message[0]['data']['redPalyerOnInstance'];
				let PartyBTeam = message[0]['data']['bluePalyerOnInstance'];
				// 收到后台 ‘匹配成功后开始从新编队’
				_this.afreshFormation(PartyATeam, PartyBTeam, (data) => {
					Taro.reLaunch({
						url: buildURL(goenterGamePage, { item: data }),
					});
				});
			});
		}
	}

	componentDidHide() {
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('exitQueueStatus');
		emitter.removeAllListeners('requestUrl');
		emitter.removeAllListeners('getRankPlayer');
	}

	rankMatching() {
		let _this = this;
		// 请求排位赛
		let isreconnection = this.state.local_data.isreconnection; // 是否断线重连
		let data = { type: 3, useSpeedItem: 0, };
		let matchingRequest = this.msgProto.matchingRequest(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);

		// 请求开始匹配排位
		if (!isreconnection) {
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) {
					console.log('%c 进入匹配ing', 'font-size:14px;color:#e66900;');
					// 进入匹配后关闭加载动画
					_this.setState((preState) => {
						preState.local_data.isShowLoading = false;
					});
				},
				fail(err) {
					Taro.showToast({
						title: err.errormsg,
						icon: 'none',
						duration: 2000
					})
				}
			});
		} else {
			_this.setState((preState) => {
				preState.local_data.isShowLoading = false;
			});
		}
	}

	// 获取游戏自己基本个人信息
	getGameUserInfo() {
		let _this = this;
		getStorage('gameUserInfo', (val) => {
			_this.setState((preState) => {
				console.log('%c 自己游戏基本信息 ==>', 'font-size:14px;color:#c500f0;');
				console.log(preState);
				preState.local_data.gameUserInfo = val;
			}, () => {
				console.log(_this.state.local_data.gameUserInfo);
			});
		})
	}

	// 重新编队
	afreshFormation(readTeam, blueTeam, callback) { // readTeam, blueTeam后台数据
		let _this = this;
		const myselfRoleId = this.state.local_data.gameUserInfo.roleId;
		let PartyATeam_ = JSON.parse(JSON.stringify(readTeam));
		let PartyBTeam_ = JSON.parse(JSON.stringify(blueTeam));
		console.log('%c 我的roleId===> ' + myselfRoleId, 'font-size:14px;color:#f06300;');
		this.setState((preState) => {
			PartyATeam_.map((value, index, arr) => {
				if (value['roleId'] == myselfRoleId) {
					preState.local_data.rankUserInfo = JSON.parse(JSON.stringify(value));
					arr.splice(index, 1);
					preState.local_data.PartyATeam = PartyATeam_;
					preState.local_data.PartyBTeam = PartyBTeam_;
					console.log('A队找到自己:'); console.log(preState.local_data.rankUserInfo)
				} else {
					preState.local_data.PartyATeam = PartyATeam_;
					preState.local_data.PartyBTeam = PartyBTeam_;
				}
			});

			PartyBTeam_.map((value, index, arr) => {
				if (value['roleId'] == myselfRoleId) {
					preState.local_data.rankUserInfo = JSON.parse(JSON.stringify(value));
					arr.splice(index, 1);
					preState.local_data.PartyATeam = PartyBTeam_;
					preState.local_data.PartyBTeam = PartyATeam_;
					console.log('B队找到自己:'); console.log(preState.local_data.rankUserInfo);
				} else {
					return;
				}
			});

			let rankUserInfo = _this.state.local_data.rankUserInfo;
			let PartyATeam = _this.state.local_data.PartyATeam;
			let PartyBTeam = _this.state.local_data.PartyBTeam;

			if (callback) callback({
				'rankUserInfo': rankUserInfo,
				'PartyATeam': PartyATeam,
				'PartyBTeam': PartyBTeam,
			});
		});
	}

	// 退出排位匹配
	exitQueue() {
		let exitQueue = this.msgProto.exitQueue()
		let parentModule = this.msgProto.parentModule(exitQueue);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {
				console.log('%c 请求`退出排位`匹配Success', 'font-size:14px;color:#e66900;');
			},
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				});
			}
		});
	}

	render() {
		const { isShowLoading, quitBtn, rankCenterIcon, curTeamInfo,
			rankQueueTip, searchIcon, matchingTxt, playerPosition } = this.state.local_data;

		const playerHeadImg = playerPosition.map((cur) => {
			return <View className='playerHead' style={`position: absolute;top: ${cur['y']}rpx; left:${cur['x']}rpx;`}>
				<Image src={cur.headUrl} className='headUrl' />
			</View>
		});

		return (
			<View className='queue'>
				{/* 入场加载动画 */}
				<View className={isShowLoading ? '' : 'hide'}>
					<GameLoading />
				</View>

				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='mask_black'></View>
					<View className='body'>
						<View className='main'>
							<View className='matchingWrap'>
								<Image src={rankQueueTip} className='rankMatchTip' />
								<View className='matching'>
									<Image src={searchIcon} className='searchIcon' />
									<View className='txt'>
										<Text className='matchingTxt'>{matchingTxt}</Text>
										<Text className='queuePeopleNum'>{curTeamInfo['currCount']}/{curTeamInfo['maxCount']}</Text>
									</View>
								</View>
							</View>
							<View className='content'>
								<View className='circle outer'>
									<View className='avatar'>
										<openData type="userAvatarUrl" lang="zh_CN"></openData>
									</View>
									{playerHeadImg}
									<View className='circle middle'>
										<View className='circle inner'>
											<Image src={rankCenterIcon} className='rankCenterIcon' />
										</View>
									</View>
								</View>
							</View>
							<View className='exitQueueWrap'>
								<Image onClick={this.exitQueue.bind(this)} src={quitBtn} className='quitBtn' />
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}