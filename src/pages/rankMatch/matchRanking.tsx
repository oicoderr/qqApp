import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { getStorage, setStorage } from '../../utils'
import emitter from '../../service/events'
import './matchRanking.scss'

import GameLoading from '../../components/GameLoading'
import { websocketUrl } from '../../service/config'
import MsgProto from '../../service/msgProto'
import Websocket from '../../service/webSocket'
import ReceiveMsg from '../../service/receivedMsg'

const App = Taro.getApp()


export class MatchRanking extends Component {
	
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
			routers:{
				goStartGame: '/pages/rankMatch/startGame'
			},

			// 后台返回数据
			data:{
				redPalyerOnInstance:[],
				bluePalyerOnInstance:[]
			},

			// 前台数据
			local_data:{
				// 个人排位赛信息 => 后台给
				rankUserInfo: {},
				// 个人游戏基本信息 => 缓存取
				gameUserInfo:{
					"copper": "",
					"dan": 1,
					"danDesc" :"学院小白",
					"energy": 1,
					"gloryUrl": "",
					"haveStar": 1,
					"headurl":"",
					"level": 1,
					"nickName": "",
					"redEnvelope": "",
					"roleId": '',
					"season": 1,
					"segmentTitleUrl": "",
					"sex": 1,
					"totalStar": 4
				},
				PartyATeam:[],
				PartyBTeam:[],
				isIntheGame: false,		// 是否游戏中断线，默认不是
				matchStatus: true,
				isShowLoading: true,	// 加载动画，默认开启
				isreconnection: 0,		// 是否断线重连，默认0 fasle
				redTeamBg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/redTeamBg.png',
				blueTeamBg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/blueTeam.png',
				VS: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/VS.png',
			}
		}
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		let _this = this;
		this.getGameUserInfo();

		// 匹配中是否断线重连状态
		const params = this.$router.params;
		console.info('params ==>');console.info(params);
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

		// 游戏中断线重连
		if( params.item ){
			console.info('%c 游戏中途退出重连','font-size:14px;#5d00f0;');
			let teams =  JSON.parse(params.item);
			this.setState((preState)=>{
				// 设置游戏中断线重连
				preState.local_data.isIntheGame = true;
				// 收到后台 ‘匹配成功后开始从新编队’
				console.log('B队：')
				console.info(teams['bluePalyerOnInstance']);
				this.afreshFormation(teams['redPalyerOnInstance'], teams['bluePalyerOnInstance'], ()=>{
					Taro.reLaunch({
						url: _this.state.routers.goStartGame,
					});
				});
			})
			
		}
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

		// 排位赛
		let isreconnection = this.state.local_data.isreconnection; // 是否断线重连
		let data = {type: 3,useSpeedItem: 0,};
		let matchingRequest = this.msgProto.matchingRequest(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);

		// 请求开始匹配排位
		if(!isreconnection){
			this.webSocket.sendWebSocketMsg({
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

		// 返回是否已进入匹配队列，判断不是断线重连开始进入匹配
		this.eventEmitter = emitter.addListener('enterMatch', (message) => {
			clearInterval(message[1]);
			if(!message[0]['data']['isreconnection'] && message[0]['data']['result']){
				Taro.showToast({
					title: '进入匹配队列',
					icon: 'none',
					duration: 2000,
				});
			}else {
				Taro.showToast({
					title: message[0]['data']['errormsg'],
					icon: 'none',
					duration: 2000,
				});
			}
		});

		// 匹配成功！获取对战队伍信息
		if(!this.state.local_data.isIntheGame){
			this.eventEmitter = emitter.addListener('getBattleTeams', (message) => {
				clearInterval(message[1]);
				console.info('所有队伍');
				console.log(message[0]['data']);
				let PartyATeam = message[0]['data']['redPalyerOnInstance'];
				let PartyBTeam = message[0]['data']['bluePalyerOnInstance'];
				// 收到后台 ‘匹配成功后开始从新编队’
				_this.afreshFormation(PartyATeam, PartyBTeam, ()=>{
					Taro.redirectTo({
						url: _this.state.routers.goStartGame,
					});
				});
			});
		}
	}

	componentDidHide () {}

	// 获取游戏自己基本个人信息
	getGameUserInfo(){
		let _this = this;
		getStorage('gameUserInfo',(val)=>{
			_this.setState((preState)=>{
				console.info('%c 自己游戏基本信息 ==>','font-size:14px;color:#c500f0;');
				console.log(preState);
				preState.local_data.gameUserInfo = val;
			},()=>{
				console.log(_this.state.local_data.gameUserInfo.danDesc);
			});
		})
	}

	// 重新编队
	afreshFormation(readTeam, blueTeam, callback){ // readTeam, blueTeam后台数据
		let _this = this;
		const myselfRoleId = this.state.local_data.gameUserInfo.roleId;
		let PartyATeam = JSON.parse(JSON.stringify(readTeam));
		let PartyBTeam = JSON.parse(JSON.stringify(blueTeam));
		console.info('%c 我的roleId===> '+myselfRoleId, 'font-size:14px;color:#f06300;');
		this.setState((preState)=>{
			PartyATeam.map((value, index, arr)=>{
				if(value['roleId'] == myselfRoleId){
					preState.local_data.rankUserInfo = JSON.parse(JSON.stringify(value));
					arr.splice(index,1);
					preState.local_data.PartyATeam = PartyATeam;
					preState.local_data.PartyBTeam = PartyBTeam;
					console.info('A队找到自己:'); console.info(preState.local_data.rankUserInfo)
				}else{
					preState.local_data.PartyATeam = PartyATeam;
					preState.local_data.PartyBTeam = PartyBTeam;
				}
			});

			PartyBTeam.map((value, index, arr)=>{
				if(value['roleId'] == myselfRoleId){
					preState.local_data.rankUserInfo = JSON.parse(JSON.stringify(value));
					arr.splice(index,1);
					preState.local_data.PartyATeam = PartyBTeam;
					preState.local_data.PartyBTeam = PartyATeam;
					console.info('B队找到自己:'); console.info(preState.local_data.rankUserInfo);
				}else{
					return;
				}
			});

			setStorage('rankUserInfo', _this.state.local_data.rankUserInfo ); // 个人排位信息
			setStorage('PartyATeam',_this.state.local_data.PartyATeam); 	  // 队伍A信息
			setStorage('PartyBTeam',_this.state.local_data.PartyBTeam);       // 队伍B信息
			console.info('%c 设置成功缓存: rankUserInfo / PartyATeam / PartyBTeam', 'font-size:14px;color:#0004f0;');
			if(callback)callback();
		});
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
	
	render () {
		const { matchStatus, isShowLoading, redTeamBg, blueTeamBg, VS, PartyATeam, PartyBTeam } = this.state.local_data;
		const { danDesc } = this.state.local_data.gameUserInfo;

		const redContent = PartyATeam.map((currentValue) => {
			return  <View className='redSelf'>
						<Image src={redTeamBg} className='redTeamBg' />
						<Image src={currentValue.headUrl} className='headImg redHeadPosi' />
						<View className='danDesc redDanDec'>{currentValue.danDesc}</View>
						<Text className='nickName redNickNamePosi'>{currentValue.nickName}</Text>
					</View>
		});

		const blueContent = PartyBTeam.map((currentValue) => {
			return  <View className='blueSelf'>
						<Image src={blueTeamBg} className='blueTeamBg' />
						<Image src={currentValue.headUrl} className='headImg buleHeadPosi' />
						<View className='danDesc buleDanDec'>{currentValue.danDesc}</View>
						<Text className='nickName buleNickNamePosi'>{currentValue.nickName}</Text>
					</View>
		});

		return (
			<View className='mathchRanking'>
				<View className={isShowLoading?'':'hide'}>
					<GameLoading />
				</View>

				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='title'>{ matchStatus?'匹配中...':'匹配成功' }</View>
						<View className='teams'>
							<View className='redTeam'>
								<View className='redSelf'>
									<Image src={redTeamBg} className='redTeamBg' />
									<View className='myselfHead headImg redHeadPosi'>
										<openData type="userAvatarUrl"></openData>
									</View>
									<View className='danDesc redDanDec'>{ danDesc }</View>
									<View className='nickName redNickNamePosi'>
										<openData type='userNickName' lang='zh_CN'></openData>
									</View>
								</View>
								{redContent}
							</View>
							<View className='blueTeam'>
								{blueContent}
							</View>
							<View className='VS'>
								<Image src={ VS } className='vsImg' />
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}