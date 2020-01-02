import Taro, { Component, Config } from '@tarojs/taro'
import 'taro-ui/dist/style/index.scss'
import './utils/ald-stat'
import { setStorage, getStorage, getUa, hideShareMenu, loginRequest, getCurrentPageUrl } from './utils'
import { Api } from './service/api'
import './app.scss'
import emitter from './service/events';
import { websocketUrl } from './service/config'
import Websocket from './service/webSocket'
import ReceiveMsg from './service/receivedMsg'
import MsgProto from './service/msgProto'

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends Component {

	config: Config = {

		pages: [

			'pages/login/index',			  			// app 登录
			'pages/index/index',			  			// 游戏登录
			'pages/rankMatch/entrance', 	  	// 排位赛入口
			'pages/rankMatch/queue',   	  	  // 排位赛队列
			'pages/rankMatch/enterGame',      // 排位赛开始游戏
			'pages/rankMatch/result', 	      // 排位赛结果

			'pages/prizeMatch/entrance',	  	// 大奖赛入口
			'pages/prizeMatch/queue',	  	  	// 大奖赛队列
			'pages/prizeMatch/enterGame',	  	// 大奖赛开始游戏
			'pages/prizeMatch/result',	  	  // 大奖赛结果

			'pages/payTakeMoney/takeMoney',	  // 提现
			'pages/payTakeMoney/recharge', 	  // 充值
			'pages/activity/goldHelp',		  	// 金币助力
			'pages/WriteQuestion/index', 	  	// 开始出题
			'pages/takeMoneyAnnal/index',	  	// 提现记录
			'pages/toolbar/opinion',	  	  	// 反馈意见
			'pages/toolbar/backpack', 	  	  // 背包
			'pages/toolbar/mall', 	  	  	  // 商城
			'pages/toolbar/selfOrchestra',	  // 我的乐队
			'pages/activity/iosCaveat',				// ios设备提示
		],

		window: {
			backgroundTextStyle: 'light',
			navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
			navigationBarTitleText: '音乐大作战',
			navigationBarTextStyle: 'white',
			navigationStyle: 'custom',
		},

	}

	globalData = {
		// 全局setTimeout, 
		timestamp: 1,
		websocket: '',
		gameUserInfo: '',
	}

	componentWillMount () {}

	componentDidMount () {
		let _this = this;
		console.log = () => {};
		console.info = () => {};
		console.error = () => {};
		console.warn = () => {};
		console.table = () => {};

		// 设备提示
		let ua = getUa();
		if(ua.system.indexOf('iOS')> -1 || ua.model.indexOf('iPhone') > -1){
			Taro.reLaunch({
				url: '/pages/activity/iosCaveat'
			})
			return;
		}

		const params = this.$router.params;
		if(params.query){
			let inviterRoleId = params.query.inviterRoleId;
			let param1 = parseInt(params.query.param1);
			let inviterInfo = {
				'inviterRoleId': inviterRoleId,
				'param1': param1,
			}
			setStorage('inviterInfo', inviterInfo);
		}
		this.msgProto = new MsgProto();
		// 监听内存情况
		this.onMemoryWarning();
		// 开始自动更新app
		this.getUpdateManager();

		// 将code发后台，获取openid及accessToken
		this.login((loginData)=>{
			// app登录
			loginRequest( loginData, (appLogin)=>{ // res: 返回openid，accessToken 
				let userInfo = {};
				// 获取缓存userInfo，如果没有授权信息, 授权后并保存缓存中，如果存在openid,跳转游戏登录
				getStorage('userInfo',(res)=>{
					if(!res.nickName || !res.avatarUrl ){
						console.log('%c app未在缓存中找到·userInfo·信息,请重新授权','font-size:14px; color:#c27d00;');
						userInfo = appLogin.data;
						// 开始登陆
						_this.createWebSocket();
						setStorage('userInfo', userInfo);
					}else{
						// 跳转游戏主页
						Taro.reLaunch({
							url: '/pages/index/index'
						});
					}
				});
			})
		});
	}

	componentDidShow() {

		// 隐藏分享
		hideShareMenu();

		// 监测1040 全局提示
		this.eventEmitter = emitter.addListener('globalTips', (message) => {
			console.error('收到1040 全局提示');console.log(message);
			clearInterval(message[1]);
			Taro.showToast({
				title: message[0].data.content,
				icon: 'none',
				duration: 2000,
			});
		});

		// 1002 游戏登录状态
		this.eventEmitter = emitter.once('loginGameStatus', (message) => {
			// console.log('%c 游戏登录状态： ', 'color: blue;font-size:14px;'); console.log(message);
			// 清除消息转发定时器
			clearInterval(message[1]);
			// 消息本体
			let loginDesc =  message[0]['data']['loginDesc'];
			let loginResult = message[0]['data']['loginResult'];
			if(loginDesc && loginResult){
				console.log('%c 登陆成功！', 'font-size:14px;color:#20ff1f;background-color:#000000;')
				// Taro.showToast({
				// 	title: loginDesc,
				// 	icon: 'none',
				// 	duration: 2000,
				// });
			}else{
				console.error(loginDesc);
				Taro.showToast({
					title: loginDesc,
					icon: 'none',
					duration: 2000,
				});
			}
		});

		// 清除全局定时器
		clearTimeout(this.globalData.timestamp);
		this.globalData.timestamp = 1;
		console.error('～又进来了～', this.globalData);
	}

	componentDidHide () {
		let currentPage = getCurrentPageUrl();
		let _this = this;
		let time = 10000;

		// 支付页面会触发hide函数,将支付页面排除
		this.globalData.timestamp = setTimeout(()=>{
			// if(currentPage != 'pages/payTakeMoney/recharge'){
				console.error('～人为卸载socket～');
				if(_this.globalData.websocket){
					_this.websocket = _this.globalData.websocket;
					_this.websocket.closeWebSocket();
					_this.globalData.websocket = '';
				};
				console.log('('+_this.globalData.websocket+')');
				console.error('卸载的当前路由 ==>');console.log(currentPage);
				clearTimeout(_this.globalData.timestamp);
			// }
		},time);
		
	}

	/* 新版本检测升级 */
	getUpdateManager(){
		if (Taro.canIUse('getUpdateManager')) {
			const updateManager = Taro.getUpdateManager()
			updateManager.onCheckForUpdate(function(res) {
				if (res.hasUpdate) {
				updateManager.onUpdateReady(function() {
					Taro.showModal({
					title: '更新提示',
					content: '新版本已经准备好，是否重启应用？',
					success: function(res) {
						if (res.confirm) {
						updateManager.applyUpdate()
						}
					}
					})
				})
				updateManager.onUpdateFailed(function() {
					Taro.showModal({
					title: '更新失败',
					content: '更新失败，请重新进入'
					})
				})
				}
			})
		} else {
			Taro.showModal({
				title: '提示',
				content: '当前版本过低，无法使用该功能，请升级到最新版本后重试。'
			});
		}
	}

	// app登录获取code操作
	login(callback) { 
		Taro.login({ // 获取code
			success: function(res){
				let loginCode = res.code;
				let loginData = {
					'url': `${Api.user.login}`,
					'data':{
						'roomId':'',
						'code': `${loginCode}`
					}
				};
				if(callback)callback(loginData); // 获取accessToken，openid, roleId
			},
			fail: function(err){
				console.error(err);
			}
		});
	}

	// qq方法（监听内存不足告警事件）
	onMemoryWarning(){
		qq.onMemoryWarning(function (res) {
			console.error(res);
		})
	}

	// 创建网络连接
	createWebSocket(){
		let _this = this;
		console.log('%c 创建websocket对象', 'background:#000;color:white;font-size:14px');
		// 创建websocket对象
		this.websocket = new Websocket({
			// true代表启用心跳检测和断线重连
			heartCheck: true,
			isReconnection: true
		});

		// 监听websocket关闭状态
		this.websocket.onSocketClosed({
			url: websocketUrl,
			success(res) {
				Taro.showToast({
					title: '与服务器断开连接',
					icon: 'none',
					duration: 2000
				});
			},
			fail(err) { console.error('当前websocket连接已关闭,错误信息为:' + JSON.stringify(err));}
		});

		// 捕获websocket异常
		this.websocket.getOnerror((err)=>{
			console.error('appjs捕获到websocket异常');console.log(err);
			Taro.showToast({
				title: err,
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
			console.log('%c 收到服务器内容：', 'background:#000;color:white;font-size:14px');
			console.log(message);
			// 要进行的操作
			new ReceiveMsg(message);
		})

		this.websocket.initWebSocket({
			url: websocketUrl,
			success(res) { 
				console.log('～建立连接成功！可以onSocketOpened拉～');
				// 对外抛出websocket
				_this.globalData.websocket = _this.websocket;
				// 通知AppGlobalSocket
				let timer = setInterval(()=>{
					console.log('AppGlobalSocket')
					emitter.emit('AppGlobalSocket', [_this.websocket, timer]);
				},20);
				// 开始登陆
				_this.websocket.onSocketOpened();
			},
			fail(err) { console.log(err) }
		})
	}

	// ios设备跳转提示
	iosTip(){
		let ua = getUa();
		if(ua.system.indexOf('iOS')> -1 || ua.model.indexOf('iPhone') > -1){
			Taro.redirectTo({
				url: '/pages/activity/iosCaveat'
			})
			return;
		}
	}

	// 在 App 类中的 render() 函数没有实际作用
	// 请勿修改此函数
	render () {
		return (
			<Index />
		)
	}
}

Taro.render(<App />, document.getElementById('app'))