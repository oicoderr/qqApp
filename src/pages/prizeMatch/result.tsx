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
				entrancePage: '/pages/rankMatch/entrance',
			},

			// 后台返回数据
			data:{
				rankBattleReport:{},  // 排位赛结果页战报
			},

			// 前台数据
			local_data:{
				isShowLoading: true,
				isShowRankResult: true,
				rankUserInfo:{},
				PartyATeam: [], 		// 红队 战报各玩家数据
				PartyBTeam: [],			// 蓝队
				resultBg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/result-container.png',
				scoreBg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/rank-scoreBg.png',
				goldIcon: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/goldIcon.png',
				goBackBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/goBackBtn.png',
				replayBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/replayBtn.png',

				victoryTitleUrl:'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/victoryTitle.png',
				failTitleUrl:'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/failTitle.png',
				drawTitleUrl:'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/drawTitle.png',
				rankResultTitleUrl: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/victoryTitle.png', // 显示输，赢，平横幅
				personMvpUrl: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/personMvp.png', // 个人mvp-logo
				leftGetAward: [],
				rightGetAward: [],
				selfRankBattleReport:{}, // 自己的rank战报
				rankResultInfo: {},
				rankBattleReport:{		 // 结果页战报
					PartyATeam:[],
					PartyBTeam:[],
					rewardAds: 100,		 // 战报页看广告奖励金币
				},	 
			}
		}
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		let _this = this;
		// 额外奖励
		this.videoAd = new createVideoAd();

		// 下发视频监听事件 (排位额外奖励)
		this.videoAd.adGet((status)=>{ // status.isEnded: (1完整看完激励视频) - (0中途退出) 
			console.error('是否征途退出？' + status);
			if(status.isEnded){
				console.info('%c 正常播放结束，下发奖励','font-size:14px;color:#0fdb24;');
				let data_ = {
					type: 1,
					value: '',
					param1:'',
					param2: '', // int(如果类型是3，这个参数是是否使用加速卡<0.不使用;1.使用>
				}
				let adsRewards = this.msgProto.adsRewards(data_);
				let parentModule = this.msgProto.parentModule(adsRewards);
				this.webSocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						Taro.showToast({
							title: '成功获取奖励',
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
				let isSeeAds = this.msgProto.isSeeAds('');
				let parentModule = this.msgProto.parentModule(isSeeAds);
				this.webSocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						Taro.showToast({
							title: '未获取额外奖励',
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

	componentDidMount () {
		let _this = this;
		this.getRankUserInfo();
		// 获取本局结果页数据
		getStorage('rankResultInfo',(res)=>{
			console.error(' ====== rank结果页数据 ======');
			console.log(res);
			this.setState((preState)=>{
				preState.local_data.rankResultInfo = res;
			},()=>{});
			// 本局结果页数据发送给子组件rankResultInfoUi
			emitter.emit('rankResultInfo', res);
		});

		// 接受子组件 ==> 返回是否勾选播放激励视频状态
		this.eventEmitter = emitter.addListener('isCheckPlayVideo', (message) => {
            console.info('%c 接受子组件 `rankResultInfoUi` 返回是否勾选播放激励视频状态','color:#3c3c3c;fon-size:14px;'); console.info(message);
            if(message){
				console.info('%c ～ 开始播放激励视频 ～',' font-size: 14px; color: #c200be;');
				// 开始播放激励广告
				this.videoAd.openVideoAd();

				// 关闭结果页Ui
				this.setState((preState)=>{
					preState.local_data.isShowRankResult = message;
				},()=>{});
			}else{
				console.error('～未勾选观看激励视频，无法播放视频～');
				let isSeeAds = this.msgProto.isSeeAds('');
				let parentModule = this.msgProto.parentModule(isSeeAds);
				this.webSocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						Taro.showToast({
							title: '未获取额外奖励',
							icon: 'none',
							mask: true,
							duration: 2000
						});
						// 关闭结果页Ui，显示战报页
						_this.setState((preState)=>{
							preState.local_data.isShowRankResult = false;
						},()=>{});
					},
					fail(err) { console.log(err) }
				});
			}
		});

		// 接受排位赛结果战报
		this.eventEmitter = emitter.addListener('getRankBattleReport', (message) => {
            console.info('%c 接受排位赛结果战报','color:#3c3c3c;fon-size:14px;background-color:#BBFFFF;'); console.info(message);
			// 设置输赢平横幅
			this.successFailDraw(message['data']['result']);
			// 奖项列表
			let leftGetAward_ = [
				{
					key: '胜利',
					value: message['data']['rewardinit']
				},{
					key: 'MVP',
					value: message['data']['mvp']
				},{
					key: '金币卡',
					value: message['data']['goldItem']
				}
			]
			let rightGetAward_ = [
				{
					key: '连胜',
					value: message['data']['row']
				},{
					key: '组队',
					value: message['data']['team']
				},{
					key: '额外奖励',
					value: message['data']['other']
				}
			]

			let rankBattleReport = JSON.parse(JSON.stringify(message['data']));
			this.setState((preState)=>{
				preState.data.rankBattleReport = message['data'];
				preState.local_data.rankBattleReport = this.reForm(rankBattleReport);
				preState.local_data.selfRankBattleReport;
				// 设置奖项列表
				preState.local_data.leftGetAward = leftGetAward_;
				preState.local_data.rightGetAward = rightGetAward_;
			},()=>{});
		});
		// 接受广告id
		this.eventEmitter = emitter.addListener('getAdUnitId', (message) => {
            console.info('%c 接受排位赛`广告id`','color:#3c3c3c;fon-size:16px;background-color:#BBFFFF;'); console.info(message);
			let type = message['data']['type'];
			let adUnitId = message['data']['value'];
			console.info('type:' + type);console.log('adUnitId:' + adUnitId);

			if(type == 1){ 		// 额外奖励
				this.videoAd = new createVideoAd(adUnitId);
				// 下发视频监听事件 (排位额外奖励)
				this.videoAd.adGet((status)=>{ // status.isEnded: (1完整看完激励视频) - (0中途退出) 
					if(status.isEnded){
						console.info('%c 正常播放结束，下发奖励','font-size:14px;color:#0fdb24;');
						console.error(adUnitId);
						let data_ = {
							type: 1,
							value: adUnitId,
							param1:'',
							param2: '', // int(如果类型是3，这个参数是是否使用加速卡<0.不使用;1.使用>
						}
						let adsRewards = this.msgProto.adsRewards(data_);
						let parentModule = this.msgProto.parentModule(adsRewards);
						this.webSocket.sendWebSocketMsg({
							data: parentModule,
							success(res) {
								Taro.showToast({
									title: '成功获取奖励',
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

						let isSeeAds = this.msgProto.isSeeAds();
						let parentModule = this.msgProto.parentModule(isSeeAds);
						this.webSocket.sendWebSocketMsg({
							data: parentModule,
							success(res) {
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
		});

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
		// 关闭加载动画
		let timerOut = setTimeout(()=>{
			_this.setState((preState)=>{
				preState.local_data.isShowLoading = false;
			},()=>{
				clearTimeout(timerOut);
			})
		},500);
	}

	componentDidHide () {}

	// 获取自己排位模式个人信息
	getRankUserInfo(){
		let _this = this;
		getStorage('rankUserInfo',(val)=>{
			_this.setState((preState)=>{
				preState.local_data.rankUserInfo = val;
			},()=>{})
		})
	}

	// 重新编队
	reForm(data){
		let _this = this;
		let list = data.palyerOnInstance;
		let selfRoleId = this.state.local_data.rankUserInfo.roleId;
		let teamA = new Array, teamB = new Array;

		list.map((cur, index, arr)=>{
			if(cur['camp'] === 1){	// camp:1进A队 <==> camp:0进B队		
				teamA.push(cur);
			}else{
				teamB.push(cur);
			}
		});

		teamA.map((cur,index)=>{
			if(cur['roleId'] == selfRoleId){
				_this.state.local_data.selfRankBattleReport = cur;
				teamA.splice(index,1);
				_this.state.local_data.PartyATeam = teamA;
				_this.state.local_data.PartyBTeam = teamB;
			}
		});

		teamB.map((cur,index)=>{
			if(cur['roleId'] == selfRoleId){
				_this.state.local_data.selfRankBattleReport = cur;
				teamB.splice(index,1);
				_this.state.local_data.PartyATeam = teamB;
				_this.state.local_data.PartyBTeam = teamA;
			}
		})

		return data;
	}

	// 显示胜负平横幅图片
	successFailDraw(resultCode){
        const { victoryTitleUrl, failTitleUrl, drawTitleUrl } =  this.state.local_data;
        switch (resultCode){
            case 0:
                this.setState((preState)=>{
                    preState.local_data.rankResultTitleUrl = failTitleUrl;
                })
                break;
            case 1:
                this.setState((preState)=>{
                    preState.local_data.rankResultTitleUrl = victoryTitleUrl;
                })
                break;
            case -1:
                this.setState((preState)=>{
                    preState.local_data.rankResultTitleUrl = drawTitleUrl;
                })
                break;
            default:
                this.setState((preState)=>{
                    preState.local_data.rankResultTitleUrl = victoryTitleUrl;
                })
                break;
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
	
	render () {
		const { isShowLoading, isShowRankResult, resultBg, scoreBg, goldIcon, leftGetAward, rightGetAward, goBackBtn,
			replayBtn, PartyATeam, PartyBTeam, rankResultTitleUrl, personMvpUrl} = this.state.local_data;
		const { selfCamp, blueScore, redScore, mvpRoleId } = this.state.local_data.rankBattleReport;
		const { score, camp, roleId } = this.state.local_data.selfRankBattleReport;

		const leftList = leftGetAward.map((currentValue) => {
			return  <View className='score'>
						<Text>{currentValue.key}</Text>
						<Text>{currentValue.value}</Text>
					</View>
		});
		
		const rightList = rightGetAward.map((currentValue) => {
			return  <View className='score'>
						<Text>{currentValue.key}</Text>
						<Text>{currentValue.value}</Text>
					</View>
		});

		const redContent = PartyATeam.map((currentValue) => {
			return <View className='player' data-roleId={currentValue.roleId} data-camp={currentValue.camp}>
						<Image src={ personMvpUrl } className={`personMvp ${currentValue.roleId === mvpRoleId?'':'hide'}`}/>
						<View className='myselfHead headImg'>
							<Image src={currentValue.headUrl} className='userAvatarUrl'/>
						</View>
						<View className='nameAndscore'>
							<View className='nickName'>
								{currentValue.nickName}
							</View>
							<View className='curScore'>{currentValue.score}</View>
						</View>
					</View>
		});

		const blueContent = PartyBTeam.map((currentValue) => {
			return 	<View className='player' data-roleId={currentValue.roleId} data-camp={currentValue.camp}>
						<Image src={ personMvpUrl } className={`personMvp ${currentValue.roleId === mvpRoleId?'':'hide'}`}/>
						<View className='myselfHead headImg'>
							<Image src={currentValue.headUrl} className='userAvatarUrl'/>
						</View>
						<View className='nameAndscore'>
							<View className='nickName'>
								{currentValue.nickName}
							</View>
							<View className='curScore'>{currentValue.score}</View>
						</View>
					</View>
		});

		return (
			<View className='rankResult' catchtouchmove="ture">
				<View className={isShowLoading?'':'hide'} catchtouchmove="ture">
					< GameLoading />
				</View>

				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='head'>
							<View className='container'>
								<Image src={rankResultTitleUrl} className='titleImg'/>
								<View className='scoreBgWrap'>
									<View className='score_ redScore'>{selfCamp?blueScore:redScore}</View>
									<Image src={scoreBg} className='scoreBg' />
									<View className='score_ blueScore'>{selfCamp?redScore:blueScore}</View>
								</View>
								<Image src={resultBg} className='bg' />
								<View className='team redTeam'>
									<View className='player' data-roleId={roleId} data-camp={camp}>
										<Image src={ personMvpUrl } className={`personMvp ${roleId === mvpRoleId?'':'hide'}`}/>
										<View className='myselfHead headImg'>
											<openData type="userAvatarUrl"></openData>
										</View>
										<View className='nameAndscore'>
											<View className='nickName'>
												<openData type='userNickName' lang='zh_CN'></openData>
											</View>
											<View className='curScore'>{ score }</View>
										</View>
									</View>
									{redContent}
								</View>

								<View className='team blueTeam'>
									{blueContent}
								</View>
							</View>
						</View>
						<View className='content'>
							<View className='goldIconWarp'>
								<Image src={goldIcon} className='goldIcon'/>
							</View>
							<View className='list'>{leftList}</View>
							<View className='list'>{rightList}</View>
						</View>
						<View className='foot'>
							<View className='btns'>
								<Image onClick={this.goBack.bind(this)} src={goBackBtn} className='btn goBackBtn'/>
								<Image onClick={this.replay.bind(this)} src={replayBtn} className='btn replayBtn'/>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}