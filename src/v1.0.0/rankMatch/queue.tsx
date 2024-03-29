import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { getStorage, buildURL } from '../../utils'
import createVideoAd from '../../service/createVideoAd'
import { createWebSocket } from '../../service/createWebSocket'
import emitter from '../../service/events'
import './queue.scss'

import GameLoading from '../../components/GameLoading'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp()


export class RankQueue extends Component {
	
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
				goenterGame: '/pages/rankMatch/enterGame',
				entrancePage: '/pages/rankMatch/entrance'
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
				redTeamBg: 'https://oss.snmgame.com/v1.0.0/redTeamBg.png',
				blueTeamBg: 'https://oss.snmgame.com/v1.0.0/blueTeam.png',
				VS: 'https://oss.snmgame.com/v1.0.0/VS.png',
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
			}
		}
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		let _this = this;
		this.getGameUserInfo();

		// 匹配中断线重连状态
		const params = this.$router.params;
		console.log('params ==>');console.log(params);
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

		// 游戏中断线重连状态
		if( params.item ){
			console.log('%c 游戏中途退出重连','font-size:14px;#5d00f0;');
			let teams =  JSON.parse(params.item);
			this.setState((preState)=>{
				// 设置游戏中断线重连
				preState.local_data.isIntheGame = true;
				// 收到后台 ‘匹配成功后开始从新编队’
				let goenterGame = this.state.routers.goenterGame
				this.afreshFormation(teams['redPalyerOnInstance'], teams['bluePalyerOnInstance'], (data)=>{
					console.log('%c 断线data ===>', 'font-size:14px;color:red;')
					console.log(data);
					Taro.reLaunch({
						url: buildURL(goenterGame,{item: data})
					});
				});
			})
			
		}
	}

	componentDidMount () {}
	
	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;

		if(App.globalData.websocket === ''){
			console.log('%c rankMatch-queue 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}

		// 排位赛
		let isreconnection = this.state.local_data.isreconnection; // 是否断线重连
		let data = {type: 3,useSpeedItem: 0,};
		let matchingRequest = this.msgProto.matchingRequest(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);

		// 请求开始匹配排位
		if(!isreconnection){
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) { 
					console.log('%c 进入匹配ing','font-size:14px;color:#e66900;');
					// 进入匹配后关闭加载动画
					_this.setState((preState)=>{
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
		}else{
			_this.setState((preState)=>{
				preState.local_data.isShowLoading = false;
			});
		}

		// 1302 返回是否已进入匹配队列，判断不是断线重连开始进入匹配
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

		// 1332 排位赛退出匹配状态
		this.eventEmitter = emitter.once('exitQueueStatus', (message) => {
			clearInterval(message[1]);

			let entrancePage = this.state.routers.entrancePage;
			Taro.reLaunch({
				url: entrancePage,
				success(){
					Taro.showToast({
						title: '匹配失败',
						icon: 'none',
						duration: 2000
					})
				}
			});
		});

		// 匹配成功！获取对战队伍信息
		if(!this.state.local_data.isIntheGame){
			this.eventEmitter = emitter.addListener('getBattleTeams', (message) => {
				clearInterval(message[1]);
				let goenterGame = this.state.routers.goenterGame;
				console.log('所有队伍');
				console.log(message[0]['data']);
				let PartyATeam = message[0]['data']['redPalyerOnInstance'];
				let PartyBTeam = message[0]['data']['bluePalyerOnInstance'];
				// 收到后台 ‘匹配成功后开始从新编队’
				_this.afreshFormation(PartyATeam, PartyBTeam, (data)=>{
					Taro.reLaunch({
						url: buildURL(goenterGame,{item:data}),
					});
				});
			});
		}
	}

	componentDidHide () {
		emitter.removeAllListeners('enterMatch');
		emitter.removeAllListeners('exitQueueStatus');
	}

	// 获取游戏自己基本个人信息
	getGameUserInfo(){
		let _this = this;
		getStorage('gameUserInfo',(val)=>{
			_this.setState((preState)=>{
				console.log('%c 自己游戏基本信息 ==>','font-size:14px;color:#c500f0;');
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
		let PartyATeam_ = JSON.parse(JSON.stringify(readTeam));
		let PartyBTeam_ = JSON.parse(JSON.stringify(blueTeam));
		console.log('%c 我的roleId===> '+myselfRoleId, 'font-size:14px;color:#f06300;');
		this.setState((preState)=>{
			PartyATeam_.map((value, index, arr)=>{
				if(value['roleId'] == myselfRoleId){
					preState.local_data.rankUserInfo = JSON.parse(JSON.stringify(value));
					arr.splice(index,1);
					preState.local_data.PartyATeam = PartyATeam_;
					preState.local_data.PartyBTeam = PartyBTeam_;
					console.log('A队找到自己:'); console.log(preState.local_data.rankUserInfo)
				}else{
					preState.local_data.PartyATeam = PartyATeam_;
					preState.local_data.PartyBTeam = PartyBTeam_;
				}
			});

			PartyBTeam_.map((value, index, arr)=>{
				if(value['roleId'] == myselfRoleId){
					preState.local_data.rankUserInfo = JSON.parse(JSON.stringify(value));
					arr.splice(index,1);
					preState.local_data.PartyATeam = PartyBTeam_;
					preState.local_data.PartyBTeam = PartyATeam_;
					console.log('B队找到自己:'); console.log(preState.local_data.rankUserInfo);
				}else{
					return;
				}
			});

			let rankUserInfo = _this.state.local_data.rankUserInfo;
			let PartyATeam = _this.state.local_data.PartyATeam;
			let PartyBTeam = _this.state.local_data.PartyBTeam;
			if(callback)callback({
				'rankUserInfo': rankUserInfo,
				'PartyATeam': PartyATeam,
				'PartyBTeam': PartyBTeam,
			});
		});
	}

	// 返回上一页
	goBack(){
		// 退出排位匹配
		let exitQueue = this.msgProto.exitQueue()
		let parentModule = this.msgProto.parentModule(exitQueue);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { 
				console.log('%c 请求`退出排位`匹配Success','font-size:14px;color:#e66900;');
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

	render () {
		const { matchStatus, isShowLoading, redTeamBg, blueTeamBg, VS, PartyATeam, PartyBTeam, backBtn, 
		} = this.state.local_data;
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
					<View className='backBtnBox'>
						<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
					</View>
					<View className='body'>
						<View className='title'>{ matchStatus?'匹配中...':'匹配成功' }</View>
						<View className='teams'>
							<View className='redTeam'>
								<View className='redSelf'>
									<Image src={redTeamBg} className='redTeamBg' />
									<View className='myselfHead headImg redHeadPosi'>
										<openData type="userAvatarUrl" lang="zh_CN"></openData>
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