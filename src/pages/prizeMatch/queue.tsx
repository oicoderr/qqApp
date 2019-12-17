import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { getStorage, setStorage, getArrayItems } from '../../utils'
import emitter from '../../service/events'
import './queue.scss'

import GameLoading from '../../components/GameLoading'
import { websocketUrl } from '../../service/config'
import MsgProto from '../../service/msgProto'
import Websocket from '../../service/webSocket'
import ReceiveMsg from '../../service/receivedMsg'

const App = Taro.getApp()


export class enterGame extends Component {

	config: Config = {
		navigationBarTitleText: '大奖赛匹配ing',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		// 实例化msg对象
		this.msgProto = new MsgProto();

		this.state = {
			// 路由
			routers:{
				enterGame: '/pages/prizeMatch/enterGame',
				entrancePage: '/pages/prizeMatch/entrance'
			},

			// 后台返回数据
			data:{
				curTeamInfo: {currCount:1, maxCount:50}
			},

			// 前台数据
			local_data:{
				timer: '',				// 定时器
				gameUserInfo: {},	
				prizeMatchUserInfo: {},
				headImgPosi:[
					{
						x: -10,
						y: -10,
					},{
						x: -180,
						y: -10,
					},{
						x: -10,
						y: -98,
					},{
						x: -95,
						y: -10,
					},{
						x: -178,
						y: -98,
					},{
						x: -264,
						y: -10,
					},{
						x: -264,
						y: -98,
					},{
						x: -10,
						y: -186,
					},{
						x: -94,
						y: -186,
					},{
						x: -178,
						y: -86,
					},{
						x: -262,
						y: -186
					},{
						x: -348,
						y: -10,
					},{
						x: -348,
						y: -98,
					},{
						x: -348,
						y: -186,
					},{
						x: -10,
						y: -274,
					},{
						x: -94,
						y: -274,
					},{
						x: -178,
						y: -274,
					},{
						x: -178,
						y: -274,
					}
				],
				headPosi:[
					{
						x: 320,
						y: 152,
					},{
						x: 328,
						y: 340,
					},{
						x: 460,
						y: 286,
					},{
						x: 92,
						y: 688,
					},{
						x: 428,
						y: 676,
					},{
						x: 430,
						y: 550,
					},{
						x: 347,
						y: 250,
					},{
						x: 185,
						y: 275,
					},{
						x: 6,
						y: 478,
					},{
						x: 540,
						y: 242,
					},{
						x: 190,
						y: 506,
					},{
						x: 200,
						y: 172,
					},{
						x: 340,
						y: 780,
					},{
						x: 146,
						y: 623,
					},{
						x: 430,
						y: 756,
					},{
						x: 536,
						y: 540,
					},{
						x: 250,
						y: 347,
					},{
						x: 60,
						y: 660,
					}
				],
				selectedHead:[],
				selectedPosi:[],
				isShowLoading: true,
				isreconnection: 0,		// 断线重连
				isIntheGame: false,		// 是否游戏中断线，默认不是
				quitBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/quitBtn.png',
			}
		}
		this.websocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		let _this = this;
		this.getGameUserInfo();

		// 匹配中是否断线重连状态
		const params = this.$router.params;
		console.info('是否断线重连 ==>');console.info(params);
		const isreconnection = params.isreconnection;
		if(isreconnection === '1'){
			this.setState((preState)=>{
				preState.local_data.isreconnection = 1;
			});
		}else{
			this.setState((preState)=>{
				preState.local_data.isreconnection = 0;
			});
		}

		// 1332 玩家离开大奖赛匹配队列 
		this.eventEmitter = emitter.once('exitQueueStatus', (message) => {
			clearInterval(message[1]);
			console.info('%c 玩家离开大奖赛匹配队列','font-size:14px;color:#ff641a;');
			let entrancePage = this.state.routers.entrancePage;
			Taro.redirectTo({
				url: entrancePage
			})
		});

		// 1334 当前队伍情况
		this.eventEmitter = emitter.addListener('getTeamSituation', (message) => {
			clearInterval(message[1]);
			console.info('接受当前队伍情况 ====>');console.info(message[0]);
			let curTeamInfo = message[0]['data'];
			this.setState((preState)=>{
				preState.data.curTeamInfo = curTeamInfo;
			})
		});

		// 1304 服务器通知客户端角色进入比赛房间
		this.eventEmitter = emitter.once('getBattleTeams', (message) => {
			clearInterval(message[1]);
			console.info('接受当前所有参赛玩家信息 ====>');console.info(message[0]['data']);
			// 设置自己大奖赛游戏信息
			this.setPrizeMatchUserInfo(message[0]['data']['redPalyerOnInstance']);
			let enterGame = this.state.routers.enterGame;
			// 所有参赛总人数
			let countPeople = message[0]['data']['redPalyerOnInstance'].length;
			Taro.redirectTo({
				url: enterGame + '?countPeople=' + countPeople
			})
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
		},500)
		// 切换匹配头像 1.5s切换一次
		this.setState((preState)=>{
			let headImgPosi = preState.local_data.headImgPosi;
			let headPosi = preState.local_data.headPosi;
			preState.local_data.selectedHead = getArrayItems(headImgPosi,6);
			preState.local_data.selectedPosi = getArrayItems(headPosi,6);
		},()=>{
			let index = 1;
			_this.state.local_data.timer = setInterval(()=>{
				index+=1;
				this.setState((preState)=>{
					let headImgPosi = preState.local_data.headImgPosi;
					let headPosi = preState.local_data.headPosi;
					preState.local_data.selectedHead = getArrayItems(headImgPosi,6);
					preState.local_data.selectedPosi = getArrayItems(headPosi,6);
				},()=>{
					if(index>3)clearInterval(_this.state.local_data.timer);
				})
			},1500);
			// console.info(this.state.local_data.selectedHead);
			// console.info(this.state.local_data.selectedPosi);
		})

		// 判断是否已经创建了wss请求
		if(App.globalData.webSocket === ''){
			this.websocket.sendWebSocketMsg({//不管wss请求是否关闭，都会发送消息，如果发送失败说明没有ws请求
				data: 'ws alive test',
				success(data) {
					Taro.showToast({
						title: 'wss is ok',
						mask: true,
						icon: 'none',
						duration: 2000,
					})
				},
				fail(err) {
					console.info('可以重连了:' + err.errMsg, 'color: red; font-size:14px;');
					_this.createSocket();
				}
			})
		}

		// 是否断线重连
		let isreconnection = this.state.local_data.isreconnection;
		let data = {type: 4,useSpeedItem: 0,};
		let matchingRequest = this.msgProto.matchingRequest(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);

		// 请求开始大奖赛
		if(isreconnection){
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) { console.info('%c 进入匹配ing','font-size:14px;color:#e66900;')},
				fail(err) {
					Taro.showToast({
						title: err.errormsg,
						icon: 'none',
						duration: 2000
					})
					console.error('匹配错误信息==> ');console.info(err);
				}
			});
		}
	}

	componentDidHide () {}

	// 获取游戏自己基本个人信息
	getGameUserInfo(){
		let _this = this;
		getStorage('gameUserInfo',(val)=>{
			_this.setState((preState)=>{
				console.info('%c 自己游戏基本信息 ==>','font-size:14px;color:#c500f0;');console.info(val);
				preState.local_data.gameUserInfo = val;
			},()=>{});
		})
	}

	// 设置自己大奖赛游戏信息
	setPrizeMatchUserInfo(data){
		let _this = this;
		let roleId = this.state.local_data.gameUserInfo.roleId;
		for(let i = 0; i < data.length; i++){
			if(data[i]['roleId'] == roleId){
				setStorage('prizeMatchUserInfo',data[i]);
				this.setState((preState)=>{
					preState.local_data.prizeMatchUserInfo = JSON.parse(JSON.stringify(data[i]));
				},()=>{})
			}
		}
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
	
	// 退出排队
	exitQueue(e){
		let exitQueue = this.msgProto.exitQueue();
		let parentModule = this.msgProto.parentModule(exitQueue);
		console.log(this.websocket,1234)
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res){
				console.info('～发送退出请求成功～');
			},
			fail(err){
				console.info(err);
			}
		})
	}


	render () {
		const { isShowLoading, quitBtn, selectedHead, selectedPosi } = this.state.local_data;
		const { curTeamInfo } = this.state.data;

		const headImg = selectedPosi.map((cur,index)=>{
			return  <View className='headImg headSize' style={`background-position: ${selectedHead[index].x}rpx ${selectedHead[index].y}rpx; top: ${cur.y}rpx;left: ${cur.x}rpx`}></View>
		});

		return (
			<View className='queue'>
				{/* 入场加载动画 */}
				<View className={isShowLoading?'':'hide'}>
					<GameLoading />
				</View>

				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='mask_black'></View>
					<View className='body'>
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
							<View className='queuePeopleNum'>当前人数: {curTeamInfo['currCount']}/{curTeamInfo['maxCount']}</View>
							{/* 头像 */}
							{headImg}
						</View>
					</View>
				</View>
			</View>
		)
	}
}