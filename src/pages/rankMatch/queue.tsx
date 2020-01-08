import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
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
		navigationBarTitleText: '排位赛',
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
				goenterGame: '/pages/rankMatch/enterGame',
				entrancePage: '/pages/rankMatch/entrance'
			},

			// 后台返回数据
			data: {
				curTeamInfo: { currCount: 1, maxCount: 6 },
				redPalyerOnInstance: [],
				bluePalyerOnInstance: []
			},

			// 前台数据
			local_data: {
				timer: '',						// 定时器
				selectedHead: [],
				selectedPosi: [],
				isShowLoading: true,
				isreconnection: 0,		// 断线重连
				isIntheGame: false,		// 是否游戏中断线，默认不是
				quitBtn: 'https://oss.snmgame.com/v1.0.0/quitBtn.png',
				// 个人排位赛信息 => 后台给
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
				headImgPosi: [
					{
						x: -10,
						y: -10,
					}, {
						x: -94,
						y: -10,
					}, {
						x: -178,
						y: -10,
					}, {
						x: -10,
						y: -98,
					}, {
						x: -94,
						y: -98,
					}, {
						x: -178,
						y: -98,
					}, {
						x: -262,
						y: -98,
					}, {
						x: -10,
						y: -186,
					}, {
						x: -94,
						y: -186,
					}, {
						x: -178,
						y: -186,
					}, {
						x: -262,
						y: -186,
					}, {
						x: -348,
						y: -10,
					}, {
						x: -346,
						y: -10,
					}, {
						x: -346,
						y: -98,
					}, {
						x: -346,
						y: -186,
					}, {
						x: -10,
						y: -274,
					}, {
						x: -94,
						y: -274,
					}, {
						x: -178,
						y: -274,
					}
				],
				headPosi: [
					{
						x: 320,
						y: 152,
					}, {
						x: 328,
						y: 340,
					}, {
						x: 460,
						y: 286,
					}, {
						x: 92,
						y: 688,
					}, {
						x: 428,
						y: 676,
					}, {
						x: 430,
						y: 550,
					}, {
						x: 347,
						y: 250,
					}, {
						x: 185,
						y: 275,
					}, {
						x: 6,
						y: 478,
					}, {
						x: 540,
						y: 242,
					}, {
						x: 190,
						y: 506,
					}, {
						x: 200,
						y: 172,
					}, {
						x: 340,
						y: 780,
					}, {
						x: 146,
						y: 623,
					}, {
						x: 430,
						y: 756,
					}, {
						x: 536,
						y: 540,
					}, {
						x: 250,
						y: 347,
					}, {
						x: 60,
						y: 660,
					}
				],
				matchStatus: true,
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				v3Img: 'https://oss.snmgame.com/v1.0.0/3v3.png',
			},
			websocketUrl: '',
		}
		this.msgProto = new MsgProto();
	}

	componentWillMount() { }

	componentDidMount() {
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
				let goenterGame = this.state.routers.goenterGame
				this.afreshFormation(teams['redPalyerOnInstance'], teams['bluePalyerOnInstance'], (data) => {
					console.error('断线data ===>')
					console.log(data);
					Taro.reLaunch({
						url: buildURL(goenterGame, { item: data })
					});
				});
			})

		}
	}

	componentWillUnmount() {
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('exitQueueStatus');
		emitter.removeAllListeners('requestUrl');
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
				} else {
					this.websocket.initWebSocket({
						url: websocketUrl,
						success(res) {
							// 开始登陆
							_this.websocket.onSocketOpened((res) => { });
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

		// 切换匹配头像 1s切换一次
		this.setState((preState) => {
			let headImgPosi = preState.local_data.headImgPosi;
			let headPosi = preState.local_data.headPosi;
			preState.local_data.selectedHead = getArrayItems(headImgPosi, 6);
			preState.local_data.selectedPosi = getArrayItems(headPosi, 6);
		}, () => {
			let index = 1;
			_this.state.local_data.timer = setInterval(() => {
				index += 1;
				this.setState((preState) => {
					let headImgPosi = preState.local_data.headImgPosi;
					let headPosi = preState.local_data.headPosi;
					preState.local_data.selectedHead = getArrayItems(headImgPosi, 6);
					preState.local_data.selectedPosi = getArrayItems(headPosi, 6);
				}, () => {
					if (index > 99) clearInterval(_this.state.local_data.timer);
				})
			}, 1000);
		});

		// 排位赛
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
					console.error('匹配错误信息==> '); console.log(err);
				}
			});
		} else {
			_this.setState((preState) => {
				preState.local_data.isShowLoading = false;
			});
		}

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
		if (!this.state.local_data.isIntheGame) {
			this.eventEmitter = emitter.addListener('getBattleTeams', (message) => {
				clearInterval(message[1]);
				let goenterGame = this.state.routers.goenterGame;
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
						url: buildURL(goenterGame, { item: data }),
					});
				});
			});
		}
	}

	componentDidHide() { }

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
			console.error('所有队伍 ===>')
			console.log(rankUserInfo, PartyATeam, PartyBTeam)
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
		const { isShowLoading, quitBtn, selectedHead, selectedPosi, v3Img } = this.state.local_data;
		const { curTeamInfo } = this.state.data;
		const headImg = selectedPosi.map((cur, index) => {
			return <View className='headImg headSize' style={`background-position: ${selectedHead[index].x}rpx ${selectedHead[index].y}rpx; top: ${cur.y}rpx;left: ${cur.x}rpx`}></View>
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
							<View className='status'>
								<Image onClick={this.exitQueue.bind(this)} src={quitBtn} className='quitBtn' />
								<View className='text'>{'匹配中...'}</View>
							</View>
							<View className='content'>
								<View className='circle outer'>
									<View className='circle middle'>
										<View className='circle inner'>
											<View className='avatarWrap'>
												<View className='avatar'>
													<openData type="userAvatarUrl"></openData>
												</View>
											</View>
										</View>
									</View>
								</View>
								{/* <View className='queuePeopleNum'>当前人数: {curTeamInfo['currCount']}/{curTeamInfo['maxCount']}</View> */}
								<View className="v3">
									<Image src={v3Img} className='v3Img' />
								</View>
								{/* 头像 */}
								{headImg}
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}