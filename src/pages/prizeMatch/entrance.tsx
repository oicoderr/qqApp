import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text, Button, RadioGroup, Radio, Label } from '@tarojs/components'
import './entrance.scss'
import emitter from '../../service/events'
import throttle from 'lodash/throttle'
import { getStorage, setStorage, onShareApp, showShareMenuItem, unitReplacement, get_OpenId_RoleId } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import configObj from '../../service/configObj'
import { MessageToast } from '../../components/MessageToast'
import createVideoAd from '../../service/createVideoAd'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp()
export class PrizeEntrance extends Component {

	config: Config = {
		navigationBarTitleText: '大奖赛入口',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		// 节流函数
		this.DBdescription = throttle(this.DBdescription, 1000);
		this.state = {
			// 路由
			routers: {
				queuePage: '/pages/prizeMatch/queue',
				indexPage: '/pages/index/index',
			},

			data: {
				quickenCardHelpResult: {
					overCount: 0,
					speedItemCount: 0,
					currSpeedItemCount: 0,
				},
				// 玩法说明
				gameDescription: [],
			},

			local_data: {
				gameUserInfo: {
					roleId: -1,
					level: 1,
					nickName: '',
					sex: '-1',
					copper: 1234,
					redEnvelope: 0,
					energy: 0,
				},
				// 货币
				currencyChange: {
					energy: 0,
					copper: 1234,
					redEnvelope: 0,
				},
				isShowDirections: false,
				ruleTitle: '赛事规则',
				directionsTitle: '说明',
				pendingText: '待领取：',
				surplusText: '剩余：',
				adsTip: '每局比赛自动使用一张加速卡',
				quickenTip: 'Tips: 邀请好友获取加速卡，减少每局答题总耗时。',
				mask_tip: '即将开放',
				unit_card: '张',
				inviteBtnTxt: '邀请',
				receiveBtnTxt: '领取',
				// 默认勾选观看广告
				checked: true,
				StayTunedImg: 'https://oss.snmgame.com/v1.0.0/StayTuned.png',
				tipImg: 'https://oss.snmgame.com/v1.0.0/prizeMatch_FreeBtnTip.png',
				freeBtn: 'https://oss.snmgame.com/v1.0.0/prizeMatch_FreeBtn.png',
				ticketsBtn: 'https://oss.snmgame.com/v1.0.0/prizeMatch_ticketsBtn.png',
				entranceBg: 'https://oss.snmgame.com/v1.0.0/prizeMatch_entranceBg.png',
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				quickenCardBg: 'https://oss.snmgame.com/v1.0.0/quickenCardBg.png',
				progress_item_blank: 'https://oss.snmgame.com/v1.0.0/progress_item_blank.png',
				progress_item: 'https://oss.snmgame.com/v1.0.0/progress_item.png',
			},
			websocketUrl: '',
		}
		this.msgProto = new MsgProto();
	}
	componentWillMount() {
		let _this = this;
		// 创建激励视频
		this.videoAd = new createVideoAd();

		// 监听广告: 看完发2003，未看完不发; status.isEnded: (1完整看完激励视频) - (0中途退出) 
		this.videoAd.adGet((status) => {
			_this.lookAds_todo(status);
		});
	}

	componentDidMount() { }

	componentWillUnmount() {
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('quickenCardHelpResult');
		emitter.removeAllListeners('getGameDescription');
		emitter.removeAllListeners('closeMessageToast');
		emitter.removeAllListeners('currencyChange');
		emitter.removeAllListeners('requestUrl');
	}

	componentDidShow() {
		let _this = this;
		// 显示分享
		showShareMenuItem();

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

		// 更新金币/红包/能量-数量
		getStorage('currencyChange', (res) => {
			if (res != '') {
				_this.setState((preState) => {
					preState.local_data.currencyChange.copper = res.copper;
					preState.local_data.currencyChange.energy = res.energy;
					preState.local_data.currencyChange.redEnvelope = res.redEnvelope;
				}, () => { })
			}
		});

		// 获取个人游戏信息
		getStorage('gameUserInfo', (res) => {
			_this.setState((preState) => {
				preState.local_data.gameUserInfo = res;
			})
		});

		// 监听1302: 是否允许进入匹配
		this.eventEmitter = emitter.addListener('enterMatch', (message) => {
			clearInterval(message[1]);
			let isreconnection = message[0]['data']['isreconnection'];
			let result = message[0]['data']['result'];
			let errormsg = message[0]['data']['errormsg'];
			let queuePage = this.state.routers.queuePage;
			if (result) {
				// 跳转匹配页
				Taro.navigateTo({
					url: queuePage,
					success() {
						Taro.showToast({
							title: '进入匹配队列',
							icon: 'none',
							duration: 2000,
						});
					},
					fail(err) {
						Taro.showToast({
							title: '请退出重新匹配',
							mask: true,
							icon: 'none',
							duration: 2000,
						});
					}
				});
			} else {
				Taro.showToast({
					title: errormsg,
					icon: 'none',
					duration: 2000,
				});
				// 1s后返回主页
				let timer = setTimeout(() => {
					let indexPage = this.state.routers.indexPage;
					Taro.reLaunch({
						url: indexPage
					});
					clearTimeout(timer);
				}, 1000);
			}
		});

		// 监听 1506  好友助力加速卡结果
		this.eventEmitter = emitter.addListener('quickenCardHelpResult', (message) => {
			clearInterval(message[1]);

			this.setState((preState) => {
				preState.data.quickenCardHelpResult = message[0]['data'];
			});
		});

		// 监听 2402 玩法说明回复
		this.eventEmitter = emitter.addListener('getGameDescription', (message) => {
			clearInterval(message[1]);

			let gameDescription = message[0]['data'];
			let type = message[0]['data']['type'];
			this.setState((preState) => {
				preState.data.gameDescription = gameDescription;
				preState.local_data.isShowDirections = true;
			}, () => { });
			// 发送子组件messageToast
			let messageToast_data = {
				title: '说明',
				body: gameDescription
			};
			switch (type) {
				case 1:
					messageToast_data['title'] = '金币助力';
					break;
				case 2:
					messageToast_data['title'] = '大奖赛规则';
					break;
				case 3:
					messageToast_data['title'] = '大奖赛加速卡说明';
					break;
				case 4:
					messageToast_data['title'] = '商城限免说明';
					break;
				case 5:
					messageToast_data['title'] = '道具卡使用说明';
					break;
			}
			emitter.emit('messageToast', messageToast_data);
		});

		// 监听 子组件MessageToast 关闭弹窗消息 
		this.eventEmitter = emitter.addListener('closeMessageToast', (message) => {
			this.setState((preState) => {
				preState.local_data.isShowDirections = false;
			})
		});

		// 1010 货币发生变化
		this.eventEmitter = emitter.addListener('currencyChange', (message) => {
			clearInterval(message[1]);

			let currencyChange = message[0]['data'];
			this.setState((preState) => {
				preState.local_data.currencyChange.copper = unitReplacement(currencyChange.copper);
				preState.local_data.currencyChange.energy = unitReplacement(currencyChange.energy);
				preState.local_data.currencyChange.redEnvelope = unitReplacement(currencyChange.redEnvelope);
			});
			setStorage('currencyChange', currencyChange);
		});

	}

	componentDidHide() {
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('quickenCardHelpResult');
		emitter.removeAllListeners('getGameDescription');
		emitter.removeAllListeners('closeMessageToast');
		emitter.removeAllListeners('currencyChange');
		emitter.removeAllListeners('requestUrl');
	}

	// 返回上一页
	goBack() {
		let indexPage = this.state.routers.indexPage;
		Taro.reLaunch({
			url: indexPage
		});
	}

	// 看广告免费入场 
	freeAdmission(e) {
		App.aldstat.sendEvent('click-大奖赛免费入场', get_OpenId_RoleId());
		this.videoAd.openVideoAd();
	}

	// 门票入场
	payAdmission(e) {
		let data = { type: 2, useSpeedItem: 1, };
		let matchingRequest = this.msgProto.matchingRequest(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.log('%c 门票入场大奖赛匹配ing', 'font-size:14px;color:#e66900;') },
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	// 更改勾选状态
	checkedChange(value) {
		this.setState((preState) => {
			preState.local_data.checked = !value;
		}, () => { });
	}

	// 分享
	onShareAppMessage(res) {
		// 邀请者roleId
		let roleId = this.state.local_data.gameUserInfo.roleId;
		// 受邀请类型(1.组队;2.加速卡)
		let param1 = 2;
		let shareData = {
			title: '酸柠檬',
			path: '/pages/login/index',
			imageUrl: 'https://oss.snmgame.com/v1.0.0/openQzonePublish-02.png',
			callback: (status) => { },
		};
		// 按钮分享
		if (res.from === 'button' && roleId) {
			console.log(' =====>按钮分享加速卡<=====');
			shareData.title = '迎接音乐大考验，组建Wuli梦想乐队！';
			shareData.path = `/pages/login/index?param1=${param1}&inviterRoleId=${roleId}`,
				shareData.imageUrl = 'https://oss.snmgame.com/v1.0.0/openQzonePublish-02.png';
			shareData.shareCallBack = (status) => {
				if (status.errMsg === "shareAppMessage:fail cancel") {
					Taro.showToast({
						title: '分享失败',
						icon: 'none',
						duration: 2000,
					})
				} else {
					Taro.showToast({
						title: '分享成功',
						icon: 'none',
						duration: 2000,
					})
				}
			}
		} else { // 右上角分享App
			shareData.title = '明星、热点、八卦知多少？一试便知！';
			shareData.path = '/pages/login/index';
			shareData.imageUrl = 'https://oss.snmgame.com/v1.0.0/openQzonePublish-02.png';
			shareData.shareCallBack = (status) => {
				if (status.errMsg === "shareAppMessage:fail cancel") {
					Taro.showToast({
						title: '分享失败',
						icon: 'none',
						duration: 2000,
					})
				} else {
					Taro.showToast({
						title: '分享成功',
						icon: 'none',
						duration: 2000,
					})
				}
			}
		}
		return onShareApp(shareData);
	}

	// 1301 请求大奖赛type:1.好友赛；2.大奖赛；3.排位赛
	matchPrize() {
		let data = { type: 2, useSpeedItem: 0, };
		let matchingRequest = this.msgProto.matchingRequest(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.log('%c 进入匹配ing', 'font-size:14px;color:#e66900;') },
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	// 领取加速卡
	getQuickenCard() {
		// quickenCardGet
		let quickenCardGet = this.msgProto.quickenCardGet()
		let parentModule = this.msgProto.parentModule(quickenCardGet);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.log('%c 请求领取加速卡Success', 'font-size:14px;color:#e66900;') },
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	// 观看完广告要做的事情
	lookAds_todo(status) {
		let checked = this.state.local_data.checked;
		let data = {
			type: 3,
			value: '',
			param1: '', // 扩展参数暂无用
			param2: -1, // int(如果类型是3，这个参数是是否使用加速卡<0.不使用;1.使用>
		}
		if (checked) { data.param2 = 1 } else { data.param2 = 0 };
		// console.log('是否勾选加速卡 ===>', data.param2);
		let adsRewards = this.msgProto.adsRewards(data);
		let parentModule = this.msgProto.parentModule(adsRewards);

		if (status.isEnded) {
			console.log('%c 看完广告，进入大奖赛', 'font-size:14px;color:#0fdb24;');
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) {
					// 允许进入匹配页 1302监测返回成功后跳转匹配页
				},
				fail(err) { console.log(err) }
			});
		} else {
			console.log('%c 未看完视频，不能进入大进入大奖赛呦', 'font-size:14px;color:#db2a0f;');
		}
	}

	// 请求说明
	DBdescription(e) {
		this.description(e);
	}
	description(e) {
		// 类型 type (1.金币助力;2.大奖赛规则;3.大奖赛加速卡说明;4.商城限免说明, 5.道具卡使用说明)
		let type = e.currentTarget.dataset.type;
		let gameDescription = this.msgProto.gameDescription(type);
		let parentModule = this.msgProto.parentModule(gameDescription);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { },
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	render() {
		const { backBtn, entranceBg, ruleTitle, freeBtn, ticketsBtn, tipImg, adsTip, checked,
			StayTunedImg, quickenCardBg, directionsTitle, pendingText, surplusText, quickenTip,
			progress_item_blank, progress_item, isShowDirections, mask_tip, unit_card, inviteBtnTxt, receiveBtnTxt } = this.state.local_data;
		const { energy, redEnvelope } = this.state.local_data.currencyChange;
		const { overCount, speedItemCount, currSpeedItemCount } = this.state.data.quickenCardHelpResult;

		return (
			<View className='entrance' catchtouchmove="ture">
				<View className={isShowDirections ? '' : 'hide'}>
					<MessageToast />
				</View>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='backBtnBox'>
						<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />

						{/* 门票bar */}
						<View className='prizeMatchBar'>
							<View className='board-same board'>{redEnvelope}</View>
							<View className='icon-same ticketsIcon' ></View>
							<View onClick={this.goPayTickets.bind(this)} className='hide addIcon-same addIcon' ></View>
						</View>

						{/* 能量bar */}
						<View className='energyBar'>
							<View className='board-same board'>{energy}</View>
							<View className='energyIcon'></View>
						</View>
					</View>

					<View className='body'>
						<View className='Entrance'>
							<Image src={entranceBg} className='bg' />
							<View onClick={this.DBdescription.bind(this)} data-type='2' className='title'>{ruleTitle}</View>
							<Image src={tipImg} className='tip' />
							<View className='items'>
								<Image onClick={this.freeAdmission.bind(this)} src={freeBtn} className='btn freeBtn' />
								<Image onClick={this.payAdmission.bind(this)} src={ticketsBtn} className='btn ticketsBtn' />
								<View className='mask_ hide'>{mask_tip}</View>
							</View>
							<View className='seeAdsStatus'>
								<RadioGroup className='checkBox'>
									<Label className='share_label' for='1' key='1'>
										<Radio className='radio_' value={adsTip}
											onClick={this.checkedChange.bind(this, checked)}
											checked={checked}>
											<View className='adsTip'>{adsTip}</View>
										</Radio>
									</Label>
								</RadioGroup>
							</View>
						</View>

						<View className='StayTuned'>
							<Image src={StayTunedImg} className='StayTunedImg' />
						</View>
					</View>

					<View className='foot'>
						<View className='quickenCard'>
							<Image src={quickenCardBg} className='quickenCardBg' />
							<View className='title'>
								<View className='num'>
									{pendingText}<Text decode={true}>{speedItemCount}&ensp;</Text>{unit_card}
									{surplusText}<Text decode={true}>{currSpeedItemCount}&ensp;</Text>{unit_card}
								</View>
								<View onClick={this.DBdescription.bind(this)} data-type='3' className='directions'>{directionsTitle}</View>
							</View>

							<View className='progress'>
								<View className='progress_list'>
									<Image src={overCount > 0 ? progress_item : progress_item_blank} className='progress_item' />
									<Image src={overCount > 1 ? progress_item : progress_item_blank} className='progress_item' />
									<Image src={overCount > 2 ? progress_item : progress_item_blank} className='progress_item' />
								</View>

								<View className='progress_btn'>
									<View className='inviteBtnWrap'>
										<Button openType='share' className='inviteBtn'>{inviteBtnTxt}</Button>
									</View>
									<View onClick={this.getQuickenCard.bind(this)} className='receiveBtnWrap'>
										<View className='receiveBtn'>{receiveBtnTxt}</View>
									</View>
								</View>
							</View>
							<View className='tips'>{quickenTip}</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}