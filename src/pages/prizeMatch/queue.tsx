import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import { getStorage, buildURL, getArrayItems } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import emitter from '../../service/events'
import './queue.scss'

import GameLoading from '../../components/GameLoading'
import MsgProto from '../../service/msgProto'
const App = Taro.getApp();

export class PrizeQueue extends Component {

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
				headImgPosi:[
					{
						x: -10,
						y: -10,
					},{
						x: -94,
						y: -10,
					},{
						x: -178,
						y: -10,
					},{
						x: -10,
						y: -98,
					},{
						x: -94,
						y: -98,
					},{
						x: -178,
						y: -98,
					},{
						x: -262,
						y: -98,
					},{
						x: -10,
						y: -186,
					},{
						x: -94,
						y: -186,
					},{
						x: -178,
						y: -186,
					},{
						x: -262,
						y: -186,
					},{
						x: -348,
						y: -10,
					},{
						x: -346,
						y: -10,
					},{
						x: -346,
						y: -98,
					},{
						x: -346,
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
				quitBtn: 'https://oss.snmgame.com/v1.0.0/quitBtn.png',
			}
		}
		this.msgProto = new MsgProto();
	}

	componentWillMount () {}

	componentDidMount () {
		let _this = this;
		this.getGameUserInfo();

		// 匹配中是否断线重连状态
		const params = this.$router.params;
		console.log('是否断线重连 ==>');console.log(params);
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
	}
	
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
		},500);

		if(App.globalData.websocket === ''){
			console.log('%c prize-queue 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}

		// 切换匹配头像 1s切换一次
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
					if(index>99)clearInterval(_this.state.local_data.timer);
				})
			},1000);
		});

		// 是否断线重连
		let isreconnection = this.state.local_data.isreconnection;
		let data = {type: 4,useSpeedItem: 0,};
		let matchingRequest = this.msgProto.matchingRequest(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);

		// 请求开始大奖赛
		if(isreconnection){
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) { console.log('%c 进入匹配ing','font-size:14px;color:#e66900;')},
				fail(err) {
					Taro.showToast({
						title: err.errormsg,
						icon: 'none',
						duration: 2000
					})
					console.error('匹配错误信息==> ');console.log(err);
				}
			});
		}

		// 1332 玩家离开大奖赛匹配队列 
		this.eventEmitter = emitter.addListener('exitQueueStatus', (message) => {
			clearInterval(message[1]);
			console.log('%c 玩家离开大奖赛匹配队列','font-size:14px;color:#ff641a;');
			let entrancePage = this.state.routers.entrancePage;
			Taro.redirectTo({
				url: entrancePage,
				success(){
					clearInterval(_this.state.local_data.timer);
				}
			})
		});

		// 1334 当前队伍情况
		this.eventEmitter = emitter.addListener('getTeamSituation', (message) => {
			clearInterval(message[1]);
			console.log('接受当前队伍情况 ====>');console.log(message[0]);
			let curTeamInfo = message[0]['data'];
			this.setState((preState)=>{
				preState.data.curTeamInfo = curTeamInfo;
			})
		});

		// 1304 服务器通知客户端角色进入比赛房间
		this.eventEmitter = emitter.addListener('getBattleTeams', (message) => {
			clearInterval(message[1]);
			console.log('接受当前所有参赛玩家信息 ====>');console.log(message[0]['data']);
			// 设置自己大奖赛游戏信息
			let prizeMatchUserInfo = this.getPrizeMatchUserInfo(message[0]['data']['redPalyerOnInstance']);
			let enterGame = this.state.routers.enterGame;
			// 所有参赛总人数
			let countPeople = message[0]['data']['redPalyerOnInstance'].length;
			Taro.redirectTo({
				url: buildURL(enterGame,{item: {
					'prizeMatchUserInfo': prizeMatchUserInfo,
					'count': countPeople
				}}),
				success(){
					clearInterval(_this.state.local_data.timer);
				}
			})
		});
	}

	componentDidHide () {
		clearInterval(this.state.local_data.timer);
		emitter.removeAllListeners('exitQueueStatus');
		emitter.removeAllListeners('getTeamSituation');
		emitter.removeAllListeners('getBattleTeams');
	}

	// 获取游戏自己基本个人信息
	getGameUserInfo(){
		let _this = this;
		getStorage('gameUserInfo',(val)=>{
			_this.setState((preState)=>{
				console.log('%c 自己游戏基本信息 ==>','font-size:14px;color:#c500f0;');console.log(val);
				preState.local_data.gameUserInfo = val;
			},()=>{});
		})
	}

	// 获取自己大奖赛游戏信息
	getPrizeMatchUserInfo(data){
		let _this = this;
		let roleId = this.state.local_data.gameUserInfo.roleId, prizeMatchUserInfo;
		for(let i = 0; i < data.length; i++){
			if(data[i]['roleId'] == roleId){
				prizeMatchUserInfo = data[i];
			}
		}
		return prizeMatchUserInfo;
	}

	// 退出排队
	exitQueue(e){
		let exitQueue = this.msgProto.exitQueue();
		let parentModule = this.msgProto.parentModule(exitQueue);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res){
				console.log('～发送退出请求成功～');
			},
			fail(err){
				console.log(err);
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