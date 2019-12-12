import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import './entrance.scss'
import emitter from '../../service/events';

import { getStorage, setStorage } from '../../utils';

import createVideoAd from '../../service/createVideoAd'
import { websocketUrl } from '../../service/config'
import MsgProto from '../../service/msgProto'
import Websocket from '../../service/webSocket'
import ReceiveMsg from '../../service/receivedMsg'

const App = Taro.getApp()
export class RankEntrance extends Component {

	config: Config = {
		navigationBarTitleText: '排位赛入口',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			// 路由
			routers:{
				matchRanking: '/pages/rankMatch/matchRanking',
			},

			// 后台返回数据
			data:{
				season: 1,				 // 第几赛季
				seasonTitleUrl: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/seasonTitle.png',// 当前赛季img
				segmentTitle: '国际巨星', // 段位称号
				segmentTitleUrl: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/segmentTitle.png',// 段位img
				gloryUrl:'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/glory.png', // 荣耀img	
				haveStar: 1,			 // 拥有星星			
				totalStar: 6,    		 // 总计星星
				dan: 1,					 // 当前段位
			},

			// 前台数据
			local_data:{
				// 镂空星
				blankStar: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/blankStar.png',
				// 发光星
				shineStar: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/shineStar.png',
				// 蓝色小背景
				littileBg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/littile-bg.png',
				// 单排按钮
				rankAloneBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/rank-onlone-beginBtn.png',
				// 组排按钮
				rankTeamBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/rank-team-beginBtn.png',
				// 观看广告按钮
				watchAdsBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/watchAdsBtn.png',
				rewardTip: '每天限领10次',
				backBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/backBtn.png',
			}

		}
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}
	componentWillMount () {
		let _this = this;
		this.videoAd= new createVideoAd();

		// （结束奖励）改为在排位赛入口页面显示的奖励btn, 看完发2003，没看完发1325，
		this.videoAd.adGet((status)=>{ // status.isEnded: (1完整看完激励视频) - (0中途退出) 
			let data = {
				value: '',
			}
			let data_= {
				type: 2,
				value: '',
				param1:'',
				param2: '', // int(如果类型是3，这个参数是是否使用加速卡<0.不使用;1.使用>
			}
			let isSeeAds = this.msgProto.adsRewards(data);
			let parentModule = this.msgProto.parentModule(isSeeAds);

			let adsRewards = this.msgProto.adsRewards(data_);
			let parentModule_ = this.msgProto.parentModule(adsRewards);

			if(status.isEnded){
				console.info('%c 正常播放结束，下发奖励','font-size:14px;color:#0fdb24;');
				this.webSocket.sendWebSocketMsg({
					data: parentModule_,
					success(res) {
						Taro.showToast({
							title: ' 成功获取奖励',
							icon: 'none',
							mask: true,
							duration: 2000
						});
						// 关闭结果页Ui
						_this.setState((preState)=>{
							preState.local_data.isShowRankResult = false;
						},()=>{});
					},
					fail(err) { console.log(err) }
				});
				
			}else{
				console.log('%c 未看完视频，没有奖励啦','font-size:14px;color:#db2a0f;');
				
				this.webSocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						Taro.showToast({
							title: '未获得结束奖励',
							icon: 'none',
							mask: true,
							duration: 2000
						});
						// 关闭结果页Ui
						_this.setState((preState)=>{
							preState.local_data.isShowRankResult = false;
						},()=>{});
					},
					fail(err) { console.log(err) }
				});
			}
		});
	}

	// 设置玩家基本信息UI显示
	componentDidMount () {
		let _this = this;
		getStorage('gameUserInfo',(res)=>{
			this.setState((preState)=>{
				preState.data = res;
			})
		});
		/*
			// 货币发生变化通知
			this.eventEmitter = emitter.once('currencyChange', (message) => {
				clearInterval(message[1]);
				console.info('%c 金币变化啦','color:#3c3c3c;fon-size:16px;background-color:#BBFFFF;'); console.info(message);
				setStorage('currencyChange', message[0]);
			});
		*/
	}
	
	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		// 判断是否已经创建了wss请求
		if(App.globalData.webSocket === ''){
			this.webSocket.sendWebSocketMsg({//不管wss请求是否关闭，都会发送消息，如果发送失败说明没有ws请求
				data: 'ws alive test',
				success(data) {
					console.log('wss is ok:')
				},
				fail(err) {
					console.info('可以重连了:' + err.errMsg, 'color: red; font-size:14px;');
					_this.createSocket();
				}
			})
		}
	}


	componentDidHide () {}
	
	// 计算拥有多少星转数组
	sumHasStar(len){
		let con = [];
		for (let i = 0; i < len; i ++){
			con.push(i);
		}
		return con;
	}

	// 跳转匹配页
	goMatchRank(){
		console.info('～跳转匹配～');
		let matchRanking = this.state.routers.matchRanking;
		Taro.navigateTo({
			url: matchRanking
		})
	}

	// 获取奖励
	watchAdsGetReward(e){
		// 开始播放激励视频
		this.videoAd.openVideoAd();
	}

	// 主动断开重新new和联接，重新登录
	createSocket(){
		// 创建websocket对象
		this.websocket = new Websocket({
			// true代表启用心跳检测和断线重连
			heartCheck: true,
			isReconnection: true
		});

		// 监听websocket关闭状态
		this.websocket.onSocketClosed({
			url: websocketUrl,
			success(res) { console.log(res) },
			fail(err) { console.log(err) }
		})

		// 捕获websocket异常
		this.websocket.getOnerror((err)=>{
			console.error('捕获到了异常');console.info(err);
			Taro.showToast({
				title: err.errMsg,
				icon: 'none',
				duration: 2000
			})
		});

		// 监听网络变化
		this.websocket.onNetworkChange({
			url: websocketUrl,
			success(res) { console.log(res) },
			fail(err) { console.log(err) }
		})

		// 监听服务器返回
		this.websocket.onReceivedMsg(result => {
			let message = JSON.parse(result);
			let messageData = JSON.parse(message.data);
			message.data = messageData;
			console.log('%c 收到服务器内容：', 'background:#000;color:white;font-size:14px');console.info(message);
			// 要进行的操作
			new ReceiveMsg(message);
		})
		
		this.websocket.initWebSocket({
			url: websocketUrl,
			success(res) { console.log('～建立连接成功！linkWebsocket～')},
			fail(err) { console.log(err) }
		})
		
		// 对外抛出websocket
		App.globalData.webSocket = this.websocket;

	}

	// 返回上一页
	goBack(){
		Taro.navigateBack({
			delta: 1
		});
	}

	render () {
		const { dan, seasonTitleUrl, segmentTitleUrl, gloryUrl, totalStar, haveStar } = this.state.data;
		const { blankStar, shineStar, littileBg, rankAloneBtn,  rankTeamBtn, watchAdsBtn, rewardTip, backBtn} = this.state.local_data;
		
		// <==================  星星  ==================>
		const starPosi = ['fisrtPosi','secondePosi', 'thirdPosi', 'fouthPosi', 'fifthPosi', 'sixthPosi', 'seventhPosi','eighthPosi'];
		let totalStarArr = [], haveStarArr = this.sumHasStar(haveStar), contentTotalStar, contentHaveStar;
		if(totalStar === 4){
			contentHaveStar = haveStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index+2]} zIndexTop ${haveStar > 0?'':'hide'}`} >
							<Image src={shineStar} className='shineStar' />
						</View>
			});
			totalStarArr = [0,1,2,3];
			contentTotalStar = totalStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index+2]} `} >
							<Image src={blankStar} className='blankStar' />
						</View>
			});
		}else if(totalStar === 6){
			contentHaveStar = haveStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index+1]} zIndexTop ${haveStar > 0?'':'hide'}`} >
							<Image src={shineStar} className='shineStar' />
						</View>
			});
			totalStarArr = [0,1,2,3,4,5];
			contentTotalStar = totalStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index+1]} `} >
							<Image src={blankStar} className='blankStar' />
						</View>
			});
		}else if(totalStar === 8){
			contentHaveStar = haveStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index]} zIndexTop ${haveStar > 0?'':'hide'}`} >
							<Image src={shineStar} className='shineStar' />
						</View>
			});
			totalStarArr = [0,1,2,3,4,5,6,7];
			contentTotalStar = totalStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index]} `} >
							<Image src={blankStar} className='blankStar' />
						</View>
			});
		}
		// <==================  星星  ==================>

		return (
			<View className='entrance' catchtouchmove="ture">
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='backBtnBox'>
						<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
					</View>

					<View className='body'>
						<View className='title'>
							<Image src={seasonTitleUrl} className='titleImg' />
						</View>
						<View className='content'>
							<Image src={littileBg} className='littleBg' />
							<Image src={gloryUrl} className='gloryImg' />
							<Image src={segmentTitleUrl} className='segmentTitleImg' />
							<View className={`stars ${dan < 8?'':'hide'}`}>
                                {contentTotalStar}
                                {contentHaveStar}
							</View>
                            {/*   超过第8段位，星星展示 x50 */}
                            <View className={`stars ${dan > 7?'':'hide'}`}> 
                                <View className='moreStarWrap'>
                                    <Image src={shineStar} className='moreShineStar' />
                                    <View className='moreNum'>x{haveStar}</View>
                                </View>
                            </View>
						</View>
						<View className='btns'>
							<Image onClick={this.goMatchRank.bind(this)} src={rankAloneBtn} className='rankBtn rankAloneBtn' />
							<Image src={rankTeamBtn} className='rankBtn rankTeamBtn' />
						</View>
						<View className='rewardTip'>{rewardTip}</View>
						<View onClick={this.watchAdsGetReward.bind(this)} className='watchAdsGetReward'>
							<Image src={watchAdsBtn} className='watchAdsBtn'/>
							<Text className='gold'>{'100'}金币</Text>
						</View>
					</View>
				</View>
			</View>
		)
	}
}