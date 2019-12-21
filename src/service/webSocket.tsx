/*
  *  @全局心跳 引入 MsgProto 模块
  *
  *
  *
*/
import Taro from '@tarojs/taro'
import MsgProto from '../service/msgProto'
import LoginGame from '../toolProto/getLoginGameInfo' // 游戏登录模块

export default class websocket {
	constructor({ heartCheck, isReconnection }) {
		// 是否连接
		this._isLogin = false;
		// 当前网络状态
		this._netWork = true;
		// 是否人为退出, 不是人为退出
		this._isClosed = false;
		// 心跳检测频率
		this._timeout = 3000;
		this._timeoutObj = null;
		// 当前重连次数
		this._connectNum = 0;
		// 心跳检测和断线重连开关，true为启用，false为关闭
		this._heartCheck = heartCheck;
		this._isReconnection = isReconnection;
		// 游戏是否登录
		this.loginGame = false;	
		// 实例化msg对象
		this.msgProto = new MsgProto();
	}

	// 心跳重置
	reset() {
		clearTimeout(this._timeoutObj);
		// console.info('%c 心跳重置', 'font-size: 14px; color: #ffc41a;')
		return this;
	}

	// 心跳开始
	start() {
		let _this = this;
		this._timeoutObj = setInterval(() => {
			const HeartMessage =  this.msgProto.heartModule(new Date().getTime());
			const parentModule = this.msgProto.parentModule(HeartMessage);
			Taro.sendSocketMessage({
				// 心跳发送的信息应由前后端商量后决定
				data: parentModule,
				success(res) {
					// console.info("发送心跳成功"); console.info(info)
				},
				fail(err) {
					// console.info('%c 发送心跳失败：','font-size:14px;color:#ff1a21;');console.info(err);
					_this.reset();
				}
			});
		}, this._timeout);
	}

	// 监听websocket连接关闭
	onSocketClosed(options) {
		Taro.onSocketClose(err => {
			console.error('当前websocket连接已关闭,错误信息为:' + JSON.stringify(err));
			// 停止心跳连接
			if (this._heartCheck) {
				this.reset();
			}

			// 关闭已登录开关
			this._isLogin = false;

			Taro.showToast({
				title: '与服务器断开连接',
				icon: 'none',
				duration: 2000
			})

			// 系统断开回来继续重连
			if (!this._isClosed) { // 人为退出不重连
				// 进行重连
				if (this._isReconnection) {
					this._reConnect(options);
				}
			}
		})
	}

	// 检测网络变化
	onNetworkChange(options) {
		Taro.onNetworkStatusChange(res => {
			console.error('当前网络状态:' + res.isConnected);
			if (!this._netWork) {
				this._isLogin = false;
				// 进行重连
				if (this._isReconnection) {
					this._reConnect(options)
				}
			}
		})
	}

	onSocketOpened() {
		Taro.onSocketOpen(res => {
			let _this = this;
			// 打开网络开关
			this._netWork = true;
			// 打开已登录开关
			this._isLogin = true;

			let loginModule = this.msgProto.loginModule(LoginGame.getLogin());
			let parentModule = this.msgProto.parentModule(loginModule);

			this.sendWebSocketMsg({
				data: parentModule,
				success(res) {
					_this.loginGame = true;
				},
				fail(err){
					Taro.showToast({
						title: '登陆失败请重新登陆',
						icon: 'none',
						duration: 2000,
					});
					console.error('游戏登陆失败：' + err);
				}
			});

			// 发送心跳
			if (this._heartCheck) {
				this.reset().start();
			}

		})
	}

	// 接收服务器返回的消息
	onReceivedMsg(callBack) {
		let _this = this;
		Taro.onSocketMessage(msg => {
			if (typeof callBack == "function") {
				let str = _this.msgProto.receivedMsg(msg.data);
				callBack( str );
			} else {
				console.error('参数的类型必须为函数');
			}
		})
	}

	// 建立websocket连接
	initWebSocket(options) {
		let _this = this;
		if (this._isLogin) {
			console.info("%c 您已经登录了", 'background:#000;color:white;font-size:14px');
		} else {
			// 检查网络
			Taro.getNetworkType({
				success(result) {
					if (result.networkType != 'none') {
						// 开始建立连接
						Taro.connectSocket({
							url: options.url,
							success(res) {
								if (typeof options.success == "function") {
									options.success(res)
								} else {
									console.info('%c 参数的类型必须为函数', 'background:#000;color:white;font-size:14px')
								}
							},
							fail(err) {
								if (typeof options.fail == "function") {
									options.fail(err)
								} else {
									console.info('%c 参数的类型必须为函数', 'background:#000;color:white;font-size:14px')
								}
							}
						})
					} else {
						console.error('网络已断开');
						_this._netWork = false;
						// 网络断开后显示model
						Taro.showModal({
							title: '网络错误',
							content: '请重新打开网络',
							showCancel: false,
							success: function (res) {
								if (res.confirm) {
									console.info('用户点击确定')
								}
							}
						})
					}
				}
			})
		}
	}

	// 发送websocket消息
	sendWebSocketMsg(options) {
		Taro.sendSocketMessage({
			data: options.data,
			success(res) {
				if (typeof options.success == "function") {
					options.success(res)
				} else {
					console.info('%c 参数的类型必须为函数', 'background:#000;color:white;font-size:14px')
				}
			},
			fail(err) {
				if (typeof options.fail == "function") {
					options.fail(err)
				} else {
					console.info('%c 参数的类型必须为函数', 'background:#000;color:white;font-size:14px')
				}
			}
		})
	}

	// 重连方法，会根据时间频率越来越慢
	_reConnect(options) {
		let timer, _this = this;
		if (this._connectNum < 20) {
			timer = setTimeout(() => {
				this.initWebSocket(options)
			}, 3000)
			this._connectNum += 1;
		} else if (this._connectNum > 20 && this._connectNum < 50 ) {
			timer = setTimeout(() => {
				this.initWebSocket(options)
			}, 10000)
			this._connectNum += 1;
		} else {
			this.closeWebSocket();
		}
	}

	getOnerror(callBack){
		Taro.onSocketError((errMsg)=>{
			console.info(errMsg,999)
			if(callBack)callBack(errMsg);
		})
	}

	// 关闭websocket连接
	closeWebSocket(){
		Taro.closeSocket();
		this._isLogin = false;
		this._isClosed = true;
	}
}