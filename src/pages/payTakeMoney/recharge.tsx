import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image, Text } from '@tarojs/components'
import { unitReplacement, getStorage } from '../../utils'
import createVideoAd from '../../service/createVideoAd'
import { createWebSocket } from '../../service/createWebSocket'
import configObj from '../../service/configObj'
import './recharge.scss'
import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class Recharge extends Component {
	config: Config = {
		navigationBarTitleText: '门票购买',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);

		this.state = {

			routers: {
				indexPage: '/pages/index/index',
			},

			data: {
				chargeList: [],  		// 门票价格信息
				redEnvelope: 0,			// 当前门票数量
				redReceiveCount: 3, // 看视频免费领取门票次数
			},

			local_data: {
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				ticketsIcon: 'https://oss.snmgame.com/v1.0.0/ticketsIcon.png',
				tips: 'Tips：每件商品都是需要QQ钱包支付的哟!!',
				bar1Txt: '限时免费',
				bar2Txt: '购买门票',
				txt1: '观看短片送门票',
				txt2: '看即送，不限观看时长',
				openTip: '暂未开放',
				freeTxt: '今日限免',
				oneIcon: 'https://oss.snmgame.com/v1.0.0/oneIcon.png',
			},

			websocketUrl: '',
		};

		this.msgProto = new MsgProto();
	}

	componentWillMount() { }

	componentDidMount() {
		this.videoAd = new createVideoAd();
		// status.isEnded: (1完整看完激励视频) - (0中途退出);
		this.videoAd.adGet((status) => {
			let redReceiveCount = this.state.data.redReceiveCount;
			if (redReceiveCount < 1) {
				return;
			} else {
				let data_ = {
					type: 6,
					value: '',
					param1: '',
					param2: '',
				}
				let adsRewards = this.msgProto.adsRewards(data_);
				let parentModule = this.msgProto.parentModule(adsRewards);
				this.websocket.sendWebSocketMsg({
					data: parentModule,
					success(res) { },
					fail(err) {
						Taro.showToast({
							title: '门票领取发送失败',
							icon: 'none',
							duration: 2000
						});
					}
				});
			}
		});
	}

	componentWillUnmount() {
		emitter.removeAllListeners('getRechargeMessage');
		emitter.removeAllListeners('getPrePay_id');
		emitter.removeAllListeners('requestUrl');
	}

	componentDidShow() {
		let _this = this;

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
					this.getRecharge();
				} else {
					this.websocket.initWebSocket({
						url: websocketUrl,
						success(res) {
							// 开始登陆
							_this.websocket.onSocketOpened((res) => {
								_this.getRecharge();
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

		// 接受1902充值模版消息
		this.eventEmitter = emitter.addListener('getRechargeMessage', (message) => {
			clearInterval(message[1]);
			this.setState((preState) => {
				preState.data.chargeList = message[0]['data']['chargeList'];
				preState.data.redEnvelope = unitReplacement(message[0]['data']['redEnvelope']);
				preState.data.redReceiveCount = message[0]['data']['redReceiveCount'];
			})
		});

		// 1904 接受prepay_id 拉起支付, 开始支付
		this.eventEmitter = emitter.addListener('getPrePay_id', (message) => {
			clearInterval(message[1]);
			let prepay_id = message[0]['data']['value'];
			Taro.requestPayment({
				package: "prepay_id=" + prepay_id,
				bargainor_id: "",
				success(res) {
					Taro.showToast({
						title: '支付完成',
						icon: 'none',
						duration: 2000
					});
					// 更新获取到的最新货币信息
					getStorage('currencyChange', (res) => {
						_this.setState((preState) => {
							preState.data.redEnvelope = res.redEnvelope;
						}, () => { })
					})
				},
				fail(err) {
					Taro.showToast({
						title: err.errMsg,
						icon: 'none',
						duration: 2000
					})
				}
			})
		});
	}

	componentDidHide() {
		emitter.removeAllListeners('getRechargeMessage');
		emitter.removeAllListeners('getPrePay_id');
		emitter.removeAllListeners('requestUrl');
	}

	// 1903 购买门票
	buyTickets(e) {
		console.log(e, 10);
		let chargeid = e.currentTarget.dataset.chargeid;
		let payStencil = this.msgProto.payStencil(chargeid);
		let parentModule = this.msgProto.parentModule(payStencil);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.log('请求购买充值模版Success') },
			fail(err) {
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		})
	}

	// 观看视频获取免费门票
	watchAdsGetReward(e) {
		// 开始播放激励视频
		this.videoAd.openVideoAd();
	}

	// 返回上一页
	goBack() {
		let indexPage = this.state.routers.indexPage;
		Taro.reLaunch({
			url: indexPage
		});
	}

	// 请求充值模版消息
	getRecharge() {
		let recharge = this.msgProto.recharge();
		let parentModule = this.msgProto.parentModule(recharge);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.log('请求充值模版消息Success') },
			fail(err) {
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		})
	}

	render() {
		const { ticketsIcon, tips, backBtn, bar1Txt, bar2Txt, openTip, oneIcon, txt1, txt2, freeTxt } = this.state.local_data;
		const { redEnvelope, redReceiveCount } = this.state.data;
		const chargeList = this.state.data.chargeList;

		const content = chargeList.map((cur) => {
			return <View className='item'>
				<View className='ticketsBg'>
					<Image src={cur.chargeIcon} className='ticketsIconImg' />
				</View>
				<View className='payBox'>
					<View className='chargeIcon'>{cur.chargeName}</View>
					<View onClick={this.buyTickets.bind(this)} data-chargeId={cur.chargeId} className='payBtn'>
						<View className='btnBody'>{`${cur.money / 100}元购买`}</View>
					</View>
				</View>
			</View>
		});

		return (
			<View className='recharge'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='head'>
							<View className='backBtnBox'>
								<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
							</View>
							<Image src={ticketsIcon} className='ticketsIcon' />
							<View className='ticketsBox'>{redEnvelope}</View>
						</View>
						<View className='body'>
							<ScrollView className='scrollview'
								scrollY
								scrollWithAnimation
								scrollTop='0'>
								<View className='ticketsContent'>
									{/* 看视频免费领取门票 */}
									<View onClick={this.watchAdsGetReward.bind(this)} data-times={redReceiveCount} className='freeTicketsBox'>
										<View className='bar1'>{bar1Txt}</View>
										<View className='box'>
											<View className='ticket'>
												<Image src={oneIcon} className='ticketImg' />
											</View>
											<View className='ticket_tips'>
												<View className='txt1'>{txt1}</View>
												<View className='txt2'>{txt2}</View>
											</View>
											<View className='freeTimesBox'>
												<View className='freeTimes'>
													{freeTxt}
												</View>
												<View className='times'>{redReceiveCount}</View>
											</View>
										</View>
									</View>
									{/* 门票 */}
									<View className='ticketsBox'>
										<View className='bar2'>{bar2Txt}</View>
										{content}
										<View className='mask'>{openTip}</View>
									</View>
								</View>
							</ScrollView>
							<View className='tips'>{tips}</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}