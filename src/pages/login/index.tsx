import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button, Image, Text, RadioGroup, Radio, Label } from '@tarojs/components'
import emitter from '../../service/events';
import throttle from 'lodash/throttle'
import { setStorage, getStorage, showShareMenuItem } from '../../utils'
import { UserAgreement } from '../../utils/UserAgreement'
import { MessageToast } from '../../components/MessageToast'
import MsgProto from '../../service/msgProto'
import { createWebSocket } from '../../service/createWebSocket'
import configObj from '../../service/configObj'
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

			routers: {
				indexPage: '/pages/index/index?bgm=1',
			},

			data: {},

			local_data: {
				isAgreeNotice: false, 	// 已同意用户须知, 已打开
				isShowDirections: false,
				logo: 'https://oss.snmgame.com/v1.0.0/logo.png',
				loginBtn: 'https://oss.snmgame.com/v1.0.0/loginBtn.png',
				tip0: '同意',
				tip: '《音乐大作战用户使用须知》',
			},

			websocketUrl: '',
		};
		this.msgProto = new MsgProto();
	}

	componentWillMount() { }

	componentDidMount() {
		// 监听 子组件MessageToast 关闭弹窗消息 
		this.eventEmitter = emitter.addListener('closeMessageToast', (message) => {
			this.setState((preState) => {
				preState.local_data.isShowDirections = false;
			})
		});
	}

	componentWillUnmount() {
		emitter.removeAllListeners('closeMessageToast');
		emitter.removeAllListeners('AppGlobalSocket');
		emitter.removeAllListeners('requestUrl');
	}

	componentDidShow() {
		let _this = this;

		// 显示分享
		showShareMenuItem();

		// 获取当前版本
		configObj.getVersion();
		// 监听requestUrl
		this.eventEmitter = emitter.addListener('requestUrl', message => {
			clearInterval(message[0]);

			_this.state.websocketUrl = message[1]['websocketUrl'];
			if (App.globalData.websocket === '') {
				createWebSocket(this);
			} else {
				this.websocket = App.globalData.websocket;
				let websocketUrl = this.state.websocketUrl;
				if (this.websocket.isLogin) {
					console.log("%c 您已经登录了", 'background:#000;color:white;font-size:14px');
				} else {
					this.websocket.initWebSocket({
						url: websocketUrl,
						success(res) {
							// 开始登游戏
							_this.websocket.onSocketOpened((res) => { });
							// 对外抛出websocket
							App.globalData.websocket = _this.websocket;
						},
						fail(err) {
							createWebSocket(_this);
						}
					});
				}
			}
		});
	}

	componentDidHide() {
		emitter.removeAllListeners('closeMessageToast');
		emitter.removeAllListeners('AppGlobalSocket');
		emitter.removeAllListeners('requestUrl');
	}

	getUserInfo() {
		let _this = this;
		let userInfo = {};
		Taro.getUserInfo({
			success(res) {
				userInfo = res.userInfo;
				console.log('%c 授权的基本信息 ===>', 'font-size:14px;color:#fff; background-color:#000;'); console.log(userInfo);
				getStorage('userInfo', (value) => {
					for (let i in value) {
						userInfo[i] = value[i];
					}
				});
				setStorage('userInfo', userInfo);
				// 发送昵称，头像信息
				_this.basicInfo(userInfo);
			},
			fail(err) {
				if (err.errMsg === 'getUserInfo:fail scope unauthorized') {
					Taro.showToast({
						title: '授权解锁更多姿势',
						icon: 'none',
						duration: 2000
					})
				}
				Taro.getSetting({
					success(res) {
						if (res.authSetting['scope.userInfo']) { // 如果已经授权，可以直接调用 getUserInfo 获取头像昵称
							Taro.getUserInfo({
								success(res) {
									getStorage('userInfo', (value) => {
										for (let i in value) {
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
	DBdescription() {
		this.description();
	}
	description() {
		// 发送用户协议
		emitter.emit('messageToast', UserAgreement);
		this.setState((preState) => {
			preState.local_data.isShowDirections = true;
		})
	}

	// 发送昵称，头像信息
	basicInfo(userInfo) {
		let _this = this;
		// 发送昵称，头像信息
		let basicInfo = this.msgProto.basicInfo(userInfo);
		let parentModule = this.msgProto.parentModule(basicInfo);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {
				console.log('%c 发送用户(头像，昵称)Success', 'font-size:14px; color:#ba5a81; background:#e3e3e3;');
				// 跳转游戏页
				let indexPage = _this.state.routers.indexPage;
				Taro.reLaunch({
					url: indexPage,
				});
			},
			fail(err) {
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	render() {
		const { isShowDirections, tip0, tip, logo, loginBtn } = this.state.local_data;
		return (
			<View className='login'>
				<View className={isShowDirections ? '' : 'hide'}>
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