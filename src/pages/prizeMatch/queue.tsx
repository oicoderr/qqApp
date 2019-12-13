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


export class MatchRanking extends Component {

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
				enterGame: '/pages/'
			},

			// 后台返回数据
			data:{
			
			},

			// 前台数据
			local_data:{
				timer: '',			// 定时器
				headImgPosi:[
					{
						x: 0,
						y: 0,
					},{
						x: -64,
						y: 0,
					},{
						x: -128,
						y: 0,
					},{
						x: -192,
						y: 0,
					},{
						x: -256,
						y: 0,
					},{
						x: -320,
						y: 0,
					},{
						x: -384,
						y: 0,
					},{
						x: -448,
						y: 0,
					},{
						x: -512,
						y: 0,
					},{
						x: 0,
						y: -68,
					},{
						x: -64,
						y: -68,
					},{
						x: -128,
						y: -68,
					},{
						x: -192,
						y: -68,
					},{
						x: -256,
						y: -68,
					},{
						x: -320,
						y: -68,
					},{
						x: -384,
						y: -68,
					},{
						x: -448,
						y: -68,
					},{
						x: -513,
						y: -68,
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
						x: 392,
						y: 688,
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
						x: 428,
						y: 676,
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
				quitBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/quitBtn.png',
			}
		}
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		let _this = this;
		
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
		const { isShowLoading, quitBtn, selectedHead, selectedPosi } = this.state.local_data;
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
							<Image src={quitBtn} className='quitBtn' />
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
							<View className='queuePeopleNum'>当前人数: {'44'}/{'50'}</View>
							{/* 头像 */}
							{headImg}
						</View>
					</View>
				</View>
			</View>
		)
	}
}