import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button, Text, Image } from '@tarojs/components'
import { Api } from '../../service/api'
import { baseUrl } from '../../service/config'
import { setStorage, getStorage, request } from '../../utils'
import { PageScrollView } from '../../components/PageScrollView'
import emitter from '../../service/events';
import { websocketUrl } from '../../service/config'
import MsgProto from '../../service/msgProto'
import './index.scss'

import Websocket from '../../service/webSocket'
import ReceiveMsg from '../../service/receivedMsg'
const App = Taro.getApp();

export class Login extends Component {
	config: Config = {
		navigationBarTitleText: '音乐大作战登录',
		navigationBarBackgroundColor: 'rgba(138, 218, 255, 1)',
	}

	constructor(props) {
		super(props);
		
		this.state = {

			routers:{
				indexPage: '/pages/index/index'
			},
			
			isAgreeNotice: false, // 已同意用户须知, 已打开
			ScrollViewData:{
				title: 'Title',
				body: '我是内容'
			}
		};
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {}

	componentDidHide () {}

	getUserInfo(){
		let _this = this;
		let userInfo = {};
		Taro.getUserInfo({
			success(res) {
				userInfo = res.userInfo;
				console.info('%c 授权的基本信息 ===>', 'font-size:14px;color:#31c200;background-color:#000;'); 
				console.info(userInfo);

				getStorage('userInfo',(value)=>{
					for(let i in value){
						userInfo[i] = value[i];
					}
				});
				setStorage('userInfo', userInfo);

				// 发送昵称，头像信息
				let basicInfo_ = _this.msgProto.basicInfo(userInfo);
				let parentModule = _this.msgProto.parentModule(basicInfo_);
				_this.webSocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						console.info('发送用户头像，昵称Success');
						// 跳转游戏页
						Taro.reLaunch({
							url: _this.state.routers.indexPage
						});
					},
					fail(err){
						Taro.showToast({
							title: err.errMsg,
							icon: 'none',
							duration: 2000
						})
					}
				});
			},
			fail(err){
				console.info('获取个人信息失败 ===>');
				console.error(err);
				Taro.getSetting({
					success(res) {
						if (res.authSetting['scope.userInfo']) { // 如果已经授权，可以直接调用 getUserInfo 获取头像昵称
							Taro.getUserInfo({
								success(res) {
									getStorage('userInfo',(value)=>{
										for(let i in value){
											userInfo[i] = value[i];
										}
									})
									setStorage('userInfo', userInfo);
								}
							})
						}
					}
				})
			}
		})
	}

	// 创建websocket
	createWebSocket(){
		let _this = this;
		console.log('%c 创建websocket对象', 'background:#000;color:white;font-size:14px');

		// 创建websocket对象
		this.websocket = new Websocket({
			// true代表启用心跳检测和断线重连
			heartCheck: true,
			isReconnection: true
		});

		// 监听websocket状态
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
			success(res) { console.log(res)},
			fail(err) { console.log(err) }
		})
		
		// 对外抛出websocket
		App.globalData.webSocket = this.websocket;
	}

	render () {
		return (
			<View className='index'>
				<Button openType='getUserInfo' onGetUserInfo={this.getUserInfo} >app登录</Button>
			</View>
		)
	}
}