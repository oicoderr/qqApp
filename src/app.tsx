import Taro, { Component, Config } from '@tarojs/taro'
import 'taro-ui/dist/style/index.scss'
import './utils/ald-stat'
import { setStorage, getStorage, onShareApp, loginRequest, getCurrentPageUrl } from './utils'
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

			'pages/WriteQuestion/index', 	  // 开始出题
			'pages/takeMoneyAnnal/index',	  // 提现记录
			'pages/toolbar/opinion',	  	  // 反馈意见
			'pages/toolbar/backpack', 	  	  // 背包
			'pages/toolbar/mall', 	  	  	  // 商城
			'pages/toolbar/selfOrchestra',	  // 我的乐队
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
		websocket: '',
		gameUserInfo: '',
	}

	componentWillMount () {
		let _this = this;
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

		// 1002 游戏登录状态
		this.eventEmitter = emitter.once('loginGameStatus', (message) => {
			// console.info('%c 游戏登录状态： ', 'color: blue;font-size:14px;'); console.info(message);
			// 清除消息转发定时器
			clearInterval(message[1]);
			// 消息本体
			let loginDesc =  message[0]['data']['loginDesc'];
			let loginResult = message[0]['data']['loginResult'];
			if(loginDesc && loginResult){
				console.info('%c 登陆成功！', 'font-size:14px;color:#20ff1f;background-color:#000000;')
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

		//
		// 分享
		Taro.useShareAppMessage(() => ({
			title: '转发标题',
			imageUrl: '',
			success(res){
				console.info(res,99)
			},
			fail(err){
				console.info(err)
			}
		}));
		// Taro.onShareAppMessage(res) {
		// // 邀请者roleId
		// let roleId = this.state.local_data.gameUserInfo.roleId;
		// // 受邀请类型(1.组队;2.加速卡)
		// let param1 = 2;
		// // 控制分享菜单展示的平台
		// Taro.showShareMenu({
		// 	// 'qzone', 'wechatFriends', 'wechatMoment'
		// 	showShareItems: ['qq'] 
		// })
		// let shareData = {
		// 	title: '酸柠檬',
		// 	path: '/pages/login/index',
		// 	imageUrl: 'https://oss.snmgame.com/v1.0.0/shareImg.png',
		// 	shareCallBack: (status)=>{},
		// };
		// // 按钮分享
		// if(res.from === 'button' && roleId){
		// 	console.info(' =====>按钮分享加速卡<=====');
		// 	shareData.title = '迎接音乐大考验，组建Wuli梦想乐队！';
		// 	shareData.path = `/pages/login/index?param1=${param1}&inviterRoleId=${roleId}`,
		// 	shareData.imageUrl = 'https://oss.snmgame.com/v1.0.0/shareImg.png';
		// 	shareData.shareCallBack = (status)=>{
		// 		if(status.errMsg === "shareAppMessage:fail cancel"){
		// 			Taro.showToast({
		// 				title: '分享失败',
		// 				icon: 'none',
		// 				duration: 2000,
		// 			})
		// 		}else{
		// 			Taro.showToast({
		// 				title: '分享成功',
		// 				icon: 'none',
		// 				duration: 2000,
		// 			})
		// 		}
		// 	}
		// }else{ // 右上角分享App
		// 	shareData.title = '明星、热点、八卦知多少？一试便知！';
		// 	shareData.path = '/pages/login/index';
		// 	shareData.imageUrl = 'https://oss.snmgame.com/v1.0.0/shareImg.png';
		// 	shareData.shareCallBack = (status)=>{
		// 		if(status.errMsg === "shareAppMessage:fail cancel"){
		// 			Taro.showToast({
		// 				title: '分享失败',
		// 				icon: 'none',
		// 				duration: 2000,
		// 			})
		// 		}else{
		// 			Taro.showToast({
		// 				title: '分享成功',
		// 				icon: 'none',
		// 				duration: 2000,
		// 			})
		// 		}
		// 	}
		// }
		// return onShareApp(shareData);
		// }
	}

	componentDidHide () {
		let currentPage = getCurrentPageUrl();
		// 支付页面会触发hide函数,将支付页面排除
		if(currentPage != 'pages/payTakeMoney/recharge'){
			console.error('～人为卸载socket～');
			if(this.globalData.websocket){
				this.websocket = this.globalData.websocket;
				this.websocket.closeWebSocket();
				this.globalData.websocket = '';
			}
			console.info('('+this.globalData.websocket+')');
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
		console.info('%c 创建websocket对象', 'background:#000;color:white;font-size:14px');
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
			console.error('appjs捕获到websocket异常');console.info(err);
			Taro.showToast({
				title: err,
				icon: 'none',
				duration: 2000
			})
		});

		// 监听网络变化
		this.websocket.onNetworkChange({
			url: websocketUrl,
			success(res) { console.info(res) },
			fail(err) { console.info(err) }
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
				console.info('～建立连接成功！可以onSocketOpened拉～');
				// 对外抛出websocket
				_this.globalData.websocket = _this.websocket;
				// 通知AppGlobalSocket
				let timer = setInterval(()=>{
					console.info('AppGlobalSocket')
					emitter.emit('AppGlobalSocket', [_this.websocket, timer]);
				},20);
				// 开始登陆
				_this.websocket.onSocketOpened();
			},
			fail(err) { console.info(err) }
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