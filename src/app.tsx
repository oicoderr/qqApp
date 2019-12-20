import Taro, { Component, Config } from '@tarojs/taro'
import 'taro-ui/dist/style/index.scss'
import './utils/ald-stat'
import { setStorage, getStorage, loginRequest, getCurrentPageUrl } from './utils'
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
			
			'pages/login/index',			  // app 登录
			'pages/index/index',			  // 游戏登录
			'pages/rankMatch/entrance', 	  // 排位赛入口
			'pages/rankMatch/queue',   	  	  // 排位赛队列
			'pages/rankMatch/enterGame',      // 排位赛开始游戏
			'pages/rankMatch/result', 	      // 排位赛结果
			
			'pages/prizeMatch/entrance',	  // 大奖赛入口
			'pages/prizeMatch/queue',	  	  // 大奖赛队列
			'pages/prizeMatch/enterGame',	  // 大奖赛开始游戏
			'pages/prizeMatch/result',	  	  // 大奖赛结果

			'pages/payTakeMoney/takeMoney',	  // 提现
			'pages/payTakeMoney/recharge', 	  // 充值

			'pages/backpack/index', 	  	  // 背包
			'pages/mall/index', 	  	  	  // 商城

			'pages/startWriteQuestion/index',
			'pages/writeQuestion/index',
			'pages/redEnvelopeConvert/index', // 提现
			'pages/takeMoneyAnnal/index',	  // 提现记录
			'pages/takeMoney/index',
			
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
		webSocket: '',
		gameUserInfo: '',
	}

	componentWillMount () {
		let _this = this;
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
						console.info('%c app未在缓存中找到·userInfo·信息,请重新授权','font-size:14px; color:#c27d00;');
						// 重新授权登录
						Taro.showToast({
							title: '请授权，解锁更多姿势～',
							icon: 'none',
							duration: 2000
						});
						userInfo = appLogin.data;
						// 开始登陆
						_this.createWebSocket();
						setStorage('userInfo', userInfo);
					}else{
						// 跳转游戏主页
						Taro.redirectTo({
							url: '/pages/index/index'
						});
					}
				});
			})
		});
	}

	componentDidMount () {}

	componentDidShow() {
		// 监测1040 全局提示
		this.eventEmitter = emitter.addListener('globalTips', (message) => {
			console.error('收到1040 全局提示');console.info(message);
			clearInterval(message[1]);
			Taro.showToast({
				title: message[0].data.content,
				icon: 'none',
				duration: 2000,
			});
		});

		// 1010 货币发生变化
		this.eventEmitter = emitter.addListener('currencyChange', (message) => {
			console.error('收到1010货币发生变化');console.info(message);
			clearInterval(message[1]);
			let currencyChange = message[0]['data'];
			setStorage('currencyChange',currencyChange);
		});
	}

	componentDidHide () {
		let currentPage = getCurrentPageUrl();
		// 支付页面会触发hide函数,将支付页面排除
		if(currentPage != 'pages/payTakeMoney/recharge'){
			console.error('～人为卸载socket～');
			if(this.globalData.webSocket){
				this.websocket = this.globalData.webSocket;
				this.websocket.closeWebSocket();
				this.globalData.webSocket = '';
			}
			console.info('('+this.globalData.webSocket+')',1111);
			console.error('卸载的当前路由 ==>');console.info(currentPage);
		}
		
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
			console.error('appjs捕获到websocket异常, ～开始重连～');console.info(err);
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
			console.info('%c 收到服务器内容：', 'background:#000;color:white;font-size:14px');
			console.info(message);
			// 要进行的操作
			new ReceiveMsg(message);
		})
		
		this.websocket.initWebSocket({
			url: websocketUrl,
			success(res) { 
				console.log('～建立连接成功！可以onSocketOpened拉～');
				// 开始登陆
				_this.websocket.onSocketOpened();
				// 对外抛出websocket
				_this.globalData.webSocket = _this.websocket;
			},
			fail(err) { console.log(err) }
		})
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