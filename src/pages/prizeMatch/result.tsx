import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import emitter from '../../service/events';
import { getStorage, removeStorage,  } from '../../utils'
import './result.scss'

import GameLoading from '../../components/GameLoading'

import createVideoAd from '../../service/createVideoAd'
import { websocketUrl } from '../../service/config'
import MsgProto from '../../service/msgProto'
import Websocket from '../../service/webSocket'
import ReceiveMsg from '../../service/receivedMsg'

const App = Taro.getApp()

export class Reasult extends Component {

	config: Config = {
		navigationBarTitleText: '大奖赛结果',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {

			// 路由
			routers:{
				indexPage: '/pages/index/index',
				entrancePage: '/pages/prizeMatch/entrance',
			},

			// 后台返回数据
			data:{
				// 大奖赛结果页战报
				prizeMatchReport:{ 				
					endtime: 10,
					energy: 10,
					rank: 1,
					rankMsg: '看完战报就离开房间吧',
					speedtime: 1,
					successCount: 1,
					totaltime: 12,
				}
			},

			// 前台数据
			local_data:{
				isShowLoading: true,
				isShowRankResult: true,

				// 名次横幅
				firstBar: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/firstBar.png',
				secondBar: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/secondBar.png',
				thirdBar: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/thirdBar.png',
				thanThreeBar: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/4-10Bar.png',
				thanTenBar: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/11Bar.png',
				confirmBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/confirmBtn.png',
				// 当前玩家名次
				gradeBar: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/11Bar.png',
				getRewardTip: '奖励已存入当前账户',
				questionUnit: '题',
				timeUnit: '秒',
				energyIcon: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/energyLittleIcon.png',
				adsTip: '观看短片，获取1张复活卡',
				checked:  true,
			}
		}
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		let _this = this;
		const params = this.$router.params;
		console.info('%c 大奖赛结果页数据 ==>', 'font-size:14px;color:#1a98ff;');console.info(JSON.parse(params.item));
		if(params.item){
			const prizeMatchResult = JSON.parse(params.item);
			this.setState((preState)=>{
				preState.data.prizeMatchReport = prizeMatchResult;
			},()=>{
				_this.ranking(prizeMatchResult.rank);
			});
		}else{
			Taro.showToast({
				title: '没有拿到结果页数据',
				icon: 'none',
				duration: 2000
			})
		}

		this.videoAd = new createVideoAd();

		// 下发视频监听事件
		this.videoAd.adGet((status)=>{ // status.isEnded: (1完整看完激励视频) - (0中途退出) 
			console.error('是否看完视频？' + status);
			if(status.isEnded){
				console.info('%c 正常播放结束，领取复活卡','font-size:14px;color:#0fdb24;');
				let data_ = {
					type: 4,
					value: '',
					param1:'',
					param2: '',
				}
				let adsRewards = this.msgProto.adsRewards(data_);
				let parentModule = this.msgProto.parentModule(adsRewards);
				let indexPage = this.state.routers.indexPage;
				this.webSocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						Taro.showToast({
							title: '成功获取奖励',
							icon: 'none',
							mask: true,
							duration: 2000,
							success(){
								Taro.redirectTo({
									url: indexPage
								})
							}
						});
					},
					fail(err) { console.log(err) }
				});
			}else{console.info('%c 大奖赛结束未看广告','font-size:14px;color:#ff541a;')}
		});
	}

	componentDidMount () {}
	
	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		// 关闭加载动画
		let timerOut = setTimeout(()=>{
			_this.setState((preState)=>{
				preState.local_data.isShowLoading = false;
			},()=>{
				clearTimeout(timerOut);
			})
		},800);

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

	// 显示名次横幅图片
	ranking(rank){
		const { firstBar, secondBar, thirdBar, thanThreeBar, thanTenBar } =  this.state.local_data;
		if(rank === 1){
			this.setState((preState)=>{
				preState.local_data.gradeBar = firstBar;
			})
		}else if(rank === 2){
			this.setState((preState)=>{
				preState.local_data.gradeBar = secondBar;
			})
		}else if(rank === 3){
			this.setState((preState)=>{
				preState.local_data.gradeBar = thirdBar;
			})
		}else if(rank > 3){
			this.setState((preState)=>{
				preState.local_data.gradeBar = thanThreeBar;
			})
		}else if(rank > 10){
			this.setState((preState)=>{
				preState.local_data.gradeBar = thanTenBar;
			})
		}else{
			this.setState((preState)=>{
				preState.local_data.gradeBar = thanTenBar;
			})
		}
    }

	// 返回主页
	goBack(){
		this.clearLocalStorage();
		Taro.redirectTo({
			url: this.state.routers.indexPage
		});
	}

	// 重玩返回入口页面
	replay(){
		this.clearLocalStorage();
		Taro.redirectTo({
			url: this.state.routers.entrancePage
		});
	}

	// 清除本局游戏缓存
	clearLocalStorage(){
		removeStorage('PartyATeam');
		removeStorage('PartyBTeam');
		removeStorage('rankUserInfo');
		removeStorage('rankResultInfo');
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

	// 是否勾选观看广告
	adsStatusChange(isChecked){
		this.setState((preState)=>{
			preState.local_data.checked = !isChecked;
		});
	}

	playVideo(){
		let checked = this.state.local_data.checked;
		if(checked){
			this.videoAd.openVideoAd();
		}else{
			console.info('%c 未勾选观看广告','font-size:14px;color:#ff1aca;')
			let indexPage = this.state.routers.indexPage;
			Taro.redirectTo({
				url: indexPage
			})
		}
	}

	render () {
		const { isShowLoading, gradeBar, getRewardTip, questionUnit, timeUnit,
			energyIcon, confirmBtn, adsTip, checked, isShowRankResult, rankResultTitleUrl} 
			= this.state.local_data;

		const { endtime, energy, rank, rankMsg, speedtime, successCount, totaltime} = this.state.data.prizeMatchReport;

		return (
			<View className='prizeMatchResult' catchtouchmove="ture">
				<View className={isShowLoading?'':'hide'} catchtouchmove="ture">
					< GameLoading />
				</View>

				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='main'>
							<View className='banner'>
								<Image src={gradeBar} className='bar' />
								<View className={`grade ${rank > 3?'':'hide'}`}>{'第'} {rank} {'名'}</View>
							</View>
							<View className='body'>
								<View className='wrap'>
									<View className='msg'>{rankMsg}</View>
									<View className='barBg successCount'>{'答对题数：'}{successCount} {questionUnit}</View>
									<View className='barBg speedtime'>{'加速卡：'}<Text>-{speedtime} {timeUnit}</Text></View>
									<View className='barBg endtime'>{'最终用时：'}{endtime} {timeUnit}</View>
									<View className='barBg energy'>
										{'获得奖励：'}
										<Text>{energy}</Text>
										<Image src={energyIcon} className='energyIcon' />
									</View>
									<View className='getRewardTip'>{getRewardTip}</View>
								</View>
							</View>
						</View>
						<View className='foot'>
							<Image onClick={this.playVideo.bind(this)} src={confirmBtn} className='confirmBtn' />
							<View className='seeAdsStatus'>
                                <RadioGroup className='checkBox'>
                                    <Label className='share_label' for='1' key='1'>
                                        <Radio className='radio_' value={adsTip} 
                                            onClick={this.adsStatusChange.bind(this,checked)} 
                                            checked={checked}>
                                            <View className='tip'>{adsTip}</View>
                                        </Radio>
                                    </Label>
                                </RadioGroup>
                            </View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}