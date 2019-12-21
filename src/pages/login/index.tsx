import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button } from '@tarojs/components'

import { Api } from '../../service/api'
import { baseUrl } from '../../service/config'
import { setStorage, getStorage } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
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
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		// 接受AppGlobalSocket
		this.eventEmitter = emitter.addListener('AppGlobalSocket', (message) => {
			clearInterval(message[1]);

			console.info('%c 收到的App发来的webSocket', 'font-size:14px;color:#ffad1a');
			console.info(message[0]);
			let socket = message[0];
			App.globalData.webSocket = socket;
			this.webSocket = socket;
		});
	}

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
				console.info(this.webSocket,990)
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
	
	render () {
		return (
			<View className='index'>
				<Button openType='getUserInfo' onGetUserInfo={this.getUserInfo} >app登录</Button>
			</View>
		)
	}
}