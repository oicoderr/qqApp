import Taro, { Component, Config } from '@tarojs/taro'
import 'taro-ui/dist/style/index.scss'
import './utils/ald-stat'
import Index from './pages/index'
import { setStorage, getStorage, getUa, hideShareMenu, loginRequest, getCurrentPageUrl, get_OpenId_RoleId } from './utils'
import { Api } from './service/api'
import './app.scss'
import emitter from './service/events';
import configObj from './service/configObj'
import Websocket from './service/webSocket'
import ReceiveMsg from './service/receivedMsg'
import MsgProto from './service/msgProto'

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class _App extends Component {

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
			'pages/toolbar/setting',	  			// 设置
			'pages/activity/iosCaveat',				// ios设备提示
			'pages/activity/notFound',				// 404未找到
		],

		window: {
			backgroundTextStyle: 'light',
			navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
			navigationBarTitleText: '音乐大作战',
			navigationBarTextStyle: 'white',
			navigationStyle: 'custom',
		}
	}

	globalData = {
		// 全局setTimeout, 
		timestamp: 1,
		// socket对象
		websocket: '',
		gameUserInfo: '',

		// 音效(正确/错误)
		audioObj: {
			soundOrderly: Taro.createInnerAudioContext(),
			soundError: Taro.createInnerAudioContext(),
			soundBgm: Taro.createInnerAudioContext(),
			// 正确音效
			answerOrderlyUrl:'https://oss.snmgame.com/sounds/answer_correct.wav',
			// 错误音效
			answerErrorUrl: 'https://oss.snmgame.com/sounds/answer_error.wav',
			// bgm
			soundBgmUrl: 'https://oss.snmgame.com/sounds/bgm.m4a',
		},
	}
	// socketUrl
	websocketUrl: '';
	baseUrl: '';

	componentWillMount() { }

	componentDidMount() {
		let _this = this;
		// console.error = () => { };
		console.table = () => {};
		console.log = () => {};
		console.info = () => {};
		console.warn = () => {};
		console.dir = () => {};

		// 获取当前版本
		configObj.getVersion();

		// 设备提示
		let ua = getUa();
		if (ua.system.indexOf('iOS') > -1 || ua.model.indexOf('iPhone') > -1) {
			Taro.reLaunch({
				url: '/pages/activity/iosCaveat'
			})
			return;
		}

		const params = this.$router.params;
		if (params.query) {
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
		// 监听打开页面是否存在
		this.onPageNotFound();
		// 监听requestUrl
		this.eventEmitter = emitter.once('requestUrl', message => {
			clearInterval(message[0]);

			this.websocketUrl = message[1]['websocketUrl'];
			this.baseUrl = message[1]['baseUrl'];
			// console.log('获取到的websocketUrl：' + this.websocketUrl);
			// console.log('获取到的baseUrl：' + this.baseUrl);

			// 将code发后台，获取openid及accessToken
			this.login((loginData) => {
				// app登录, appLogin.data: 返回openid，accessToken, session_key
				loginRequest(loginData, (appLogin) => {
					console.log(appLogin,1818);
					let userInfo = {};
					// 获取缓存userInfo，如果没有授权信息, 授权后并保存缓存中，如果存在openid,跳转游戏登录
					getStorage('userInfo', (res) => {
						if (!res.nickName || !res.avatarUrl) {
							console.log('%c app未在缓存中找到·userInfo·信息,请重新授权', 'font-size:14px; color:#c27d00;');
							userInfo = appLogin.data;
							setStorage('userInfo', userInfo);
							_this.createWebSocket(_this.websocketUrl);
						} else {
							// 跳转游戏主页
							_this.createWebSocket(_this.websocketUrl);
						}
					});
				})
			});
		});
		// 创建bgm
		this.createSounds(this.globalData.audioObj.soundBgm,this.globalData.audioObj.soundBgmUrl, true);
		// 创建音效
		this.createSounds(this.globalData.audioObj.soundOrderly,this.globalData.audioObj.answerOrderlyUrl, false);
		this.createSounds(this.globalData.audioObj.soundError,this.globalData.audioObj.answerErrorUrl, false);
	}

	componentDidShow() {
		let _this = this;
		// 隐藏分享
		hideShareMenu();

		// 监听1040 全局提示
		this.eventEmitter = emitter.addListener('globalTips', (message) => {
			clearInterval(message[1]);

			console.log('%c 收到1040 全局提示','font-size:14px;color:#FF0000;background-color:#C0C0C0;'); console.log(message);
			Taro.showToast({
				title: message[0].data.content,
				icon: 'none',
				duration: 2000,
			});
		});
		// 监听1002 游戏登录状态
		this.eventEmitter = emitter.addListener('loginGameStatus', (message) => {
			// console.log('%c 游戏登录状态： ', 'color: blue;font-size:14px;'); console.log(message);
			// 清除消息转发定时器
			clearInterval(message[1]);
			// 消息本体
			let loginDesc = message[0]['data']['loginDesc'];
			let loginResult = message[0]['data']['loginResult'];
			if (loginDesc && loginResult) {
				console.log('%c 登陆成功！', 'font-size:14px;color:#20ff1f;background-color:#000000;')
			} else {
				Taro.showToast({
					title: loginDesc,
					icon: 'none',
					duration: 2000,
				});
			}
		});
		// 监听2702 玩家游戏状态： 0.正常默认状态;1.匹配中;2.房间中
		this.eventEmitter = emitter.addListener('getPlayerStatus', (message) => {
			clearInterval(message[1]);
			let value = message[0]['data']['value'];
			getStorage('userInfo', (res) => {
				if (!res.nickName || !res.avatarUrl) {
					return;
				} else {
					if (value == 0) {
						Taro.reLaunch({
							url: '/pages/index/index?bgm=1',
						});
					}
				}
			})
		});

		// 清除全局定时器
		clearTimeout(this.globalData.timestamp);
		this.globalData.timestamp = 1;
	}

	componentDidHide() {
		let currentPage = getCurrentPageUrl();
		let _this = this;
		let time = 15000;

		// 支付页面会触发hide函数,将支付页面排除
		this.globalData.timestamp = setTimeout(() => {
			// if(currentPage != 'pages/payTakeMoney/recharge'){
			console.log('%c ～人为卸载socket～','font-size:14px;color:red;');
			if (_this.globalData.websocket) {
				_this.websocket = _this.globalData.websocket;
				_this.websocket.closeWebSocket();
				_this.globalData.websocket = '';
			};
			console.log('(' + _this.globalData.websocket + ')');
			console.log('%c 卸载的当前路由 ==>','font-size:14px;color:red;'); console.log(currentPage);
			// this.onDestroy();
			clearTimeout(_this.globalData.timestamp);
			// }
		}, time);

		emitter.removeAllListeners('getPlayerStatus');
	}

	componentWillUnmount() {
		emitter.removeAllListeners('getPlayerStatus');
		
	}

	/* 新版本检测升级 */
	getUpdateManager() {
		if (Taro.canIUse('getUpdateManager')) {
			const updateManager = Taro.getUpdateManager()
			updateManager.onCheckForUpdate(function (res) {
				if (res.hasUpdate) {
					updateManager.onUpdateReady(function () {
						Taro.showModal({
							title: '更新提示',
							content: '新版本已经准备好，是否重启应用？',
							success: function (res) {
								if (res.confirm) {
									updateManager.applyUpdate()
								}
							}
						})
					})
					updateManager.onUpdateFailed(function () {
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
		let _this = this;
		Taro.login({ // 获取code
			success: function (res) {
				let loginCode = res.code;
				let baseUrl = _this.baseUrl;
				let loginData = {
					'url': `${baseUrl + Api.user.login}`,
					'data': {
						'roomId': '',
						'code': `${loginCode}`
					}
				};
				if (callback) callback(loginData); // 获取accessToken，openid, roleId
			},
			fail: function (err) {
				console.error(err);
			}
		});
	}

	// qq方法（监听内存不足告警事件）
	onMemoryWarning() {
		qq.onMemoryWarning(function (res) {
			Taro.showToast({
				title: '内存警报',
				icon: 'fail',
				duration: 2000
			});
		});
	}
	// 页面丢失404Page
	onPageNotFound() {
		let _this = this;
		Taro.onPageNotFound((res) => {
			_this.aldstat.sendEvent('页面丢失', {
				'user': get_OpenId_RoleId(),
				'path': res.path,
				'query': res.query,
				'isEntryPage': res.isEntryPage, // 是否本次启动的首个页面（例如从分享等入口进来，首个页面是开发者配置的分享页面）
			});
			Taro.navigateTo({
				url: '/pages/activity/notFound',
			})
		})
	}

	// 创建网络连接
	createWebSocket(websocketUrl) {
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
			fail(err) { console.error('当前websocket连接已关闭,错误信息为:' + JSON.stringify(err)); }
		});

		// 捕获websocket异常
		this.websocket.getOnerror((err) => {
			console.log('%c appjs捕获到websocket异常', 'font-size:14px;color:red;'); console.log(err);
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
				// 对外抛出websocket
				_this.globalData.websocket = _this.websocket;
				// 开始登陆
				_this.websocket.onSocketOpened();
			},
			fail(err) { console.log(err) }
		})
	}

	// ios设备跳转提示
	iosTip() {
		let ua = getUa();
		if (ua.system.indexOf('iOS') > -1 || ua.model.indexOf('iPhone') > -1) {
			Taro.redirectTo({
				url: '/pages/activity/iosCaveat'
			})
			return;
		}
	}

	// 创建/bgm/音效(正确/错误)
	createSounds(obj, src, loop){
		// 当设置了新的 src 时，会自动开始播放
		obj.src = src;
		// 是否自动开始
		obj.autoplay = false;
		// 循环播放
		obj.loop = loop;
		// 音量范围
		obj.volume = 1;
		// 是否与其他音频混播，设置为 true 之后，不会终止其他应用或QQ内的音乐
		obj.mixWithOther = true;

		// 监听音频进入可以播放状态的事件。但不保证后面可以流畅播放
		obj.onCanplay(()=>{
			// Taro.hideLoading();
		});

		obj.onPlay(() => {
			console.log('%c ========> 开始播放音频 <=========', 'color:#0000FF;background:	#FFFF00;');
		});
		obj.onStop(()=>{
			console.log('%c ========> 停止播放音频 <=========', 'color:#FF0000;background: #C0C0C0;');
		});
		// 监听音频自然播放至结束的事件
		obj.onEnded(()=>{
			console.log('%c ========> 音频播放结束 <=========', 'color:#006400;background: #C0C0C0;');
		});

		// 监听音频播放错误事件
		obj.onError((res) => {
			switch (res.errCode){
				case 10001:
					this.toastSoundBg('系统错误');
					break;
				case 10002:
					this.toastSoundBg('网络错误');
					break;
				case 10003:
					this.toastSoundBg('文件错误');
					break;
				case 10004:
					this.toastSoundBg('格式错误');
					break;
				case -1:
					this.toastSoundBg('未知错误');
					break;
			}
		});

		// 监听音频加载中事件。当音频因为数据不足，需要停下来加载时会触
		obj.onWaiting(()=>{
			// Taro.showLoading({
			// 	title: '音频正在加载ing',
			// 	mask: true,
			// });
		});
		// 默认音频开启状态
		getStorage('sounds',(res)=>{
			if(res==''){
				setStorage('sounds',[{'type': 1, 'status': 1,},{'type': 2, 'status': 1,}]);
			}
		})
		console.log('%c Appjs音频实例创建成功','font-size:14px;color:#0000FF;background:#C0C0C0;')
	}
	// sounds 音频onError错误码
	toastSoundBg(msg){
		Taro.showToast({
			title: msg,
			icon: 'fail',
			duration: 2000
		})
	}

	// 销毁音频实例(正确/错误)
	onDestroy(){
		this.globalData.audioObj.soundBgm.destroy();
		this.globalData.audioObj.soundOrderly.destroy();
		this.globalData.audioObj.soundError.destroy();
	}

	// 在 App 类中的 render() 函数没有实际作用
	// 请勿修改此函数
	render() {
		return (
			<Index />
		)
	}
}

Taro.render(<_App />, document.getElementById('app'))