import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button, Image, Text, RadioGroup, Radio, Label  } from '@tarojs/components'
import emitter from '../../service/events';
import throttle from 'lodash/throttle'
import { setStorage, getStorage, showShareMenuItem } from '../../utils'
import { UserAgreement } from '../../utils/UserAgreement'
import MessageToast from '../../components/MessageToast'
import MsgProto from '../../service/msgProto'
import { createWebSocket } from '../../service/createWebSocket'
import { websocketUrl } from '../../service/config'
import './index.scss'

const App = Taro.getApp();

export class Login extends Component {
	config: Config = {
		navigationBarTitleText: '音乐大作战登录',
		navigationBarBackgroundColor: 'rgba(138, 218, 255, 1)',
	}

	constructor(props) {
		super(props);
		// 节流函数
		this.DBdescription = throttle(this.DBdescription, 1000);
		this.state = {

			routers:{
				indexPage: '/pages/index/index'
			},

			data:{
				
			},

			local_data:{
				isAgreeNotice: false, 	// 已同意用户须知, 已打开
				isShowDirections: false,
				logo: 'https://oss.snmgame.com/v1.0.0/logo.png',
				loginBtn: 'https://oss.snmgame.com/v1.0.0/loginBtn.png',
				tip0:'同意',
				tip: '《音乐大作战用户使用须知》',
			}
		};
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		// 接受AppGlobalSocket
		this.eventEmitter = emitter.addListener('AppGlobalSocket', (message) => {
			clearInterval(message[1]);

			console.log('%c 收到的App发来的webSocket', 'font-size:14px;color:#ffad1a');
			console.log(message[0]);
			let socket = message[0];
			App.globalData.websocket = socket;
			this.websocket = socket;
		});

		// 监听 子组件MessageToast 关闭弹窗消息 
		this.eventEmitter = emitter.addListener('closeMessageToast', (message) => {
			this.setState((preState)=>{
				preState.local_data.isShowDirections = false;
			})
		});
	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		// 显示分享
		showShareMenuItem();

		if(App.globalData.websocket === ''){
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
			if(this.websocket.isLogin){
				console.log("%c 您已经登录了", 'background:#000;color:white;font-size:14px');
			}else{
				this.websocket.initWebSocket({
					url: websocketUrl,
					success(res){
						// 开始登陆
						_this.websocket.onSocketOpened((res)=>{});
						// 对外抛出websocket
						App.globalData.websocket = _this.websocket;
					},
					fail(err){
						createWebSocket(_this);
					}
				});
			}
		}
	}

	componentDidHide () {
		emitter.removeAllListeners('closeMessageToast');
		emitter.removeAllListeners('AppGlobalSocket');
	}

	getUserInfo(){
		let _this = this;
		let userInfo = {};
		Taro.getUserInfo({
			success(res) {
				userInfo = res.userInfo;
				console.log('%c 授权的基本信息 ===>', 'font-size:14px;color:#31c200;background-color:#000;'); 
				console.log(userInfo);
				getStorage('userInfo',(value)=>{
					for(let i in value){
						userInfo[i] = value[i];
					}
				});
				setStorage('userInfo', userInfo);
				// 发送昵称，头像信息
				let basicInfo_ = _this.msgProto.basicInfo(userInfo);
				let parentModule = _this.msgProto.parentModule(basicInfo_);
				_this.websocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						console.log('发送用户头像，昵称Success');
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
				if(err.errMsg === 'getUserInfo:fail scope unauthorized'){
					Taro.showToast({
						title: '请授权，解锁更多姿势',
						icon: 'none',
						duration: 2000
					})
				}
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
	// 用户说明
	DBdescription(){
		this.description();
	}
	description(){
		// 发送用户协议
		emitter.emit('messageToast', UserAgreement);
		this.setState((preState)=>{
			preState.local_data.isShowDirections = true;
		})
	}
	render () {
		const { isShowDirections, tip0, tip, logo, loginBtn } = this.state.local_data;
		return (
			<View className='login'>
				<View className={isShowDirections?'':'hide'}>
					<MessageToast />
				</View>

				<View className='bgColor'>
					<View className='bgImg'></View>
					<Image src={logo} className='logo' />
					<View className='loginBtnWrap'>
						<Image src={loginBtn} className='loginBtnImg' />
						<Button className='loginBtn' openType='getUserInfo' onGetUserInfo={this.getUserInfo} ></Button>
					</View>
					<View className='agreeInfo'>
						<RadioGroup onClick={this.DBdescription.bind(this)} className='checkBox'>
							<Label className='label' for='1' key='1'>
								<Radio className='radio_' value={tip} checked={true}>
									<View className='tip'><Text>{tip0}</Text>{tip}</View>
								</Radio>
							</Label>
						</RadioGroup>
					</View>
				</View>
			</View>
		)
	}
}