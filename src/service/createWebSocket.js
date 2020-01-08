 /* jshint esversion: 6 */
import Taro from '@tarojs/taro';
import Websocket from '../service/webSocket';
import ReceiveMsg from '../service/receivedMsg';
import configObj from '../service/configObj';

const App = Taro.getApp();

export const createWebSocket = (that) => {
	// console.log('%c createWebSocket-url' + that.state.websocketUrl, 'background-color:#C1CDCD;color:#8A2BE2;font-size:14px;');
	console.log('%c 创建createWebSocket对象', 'background:#000;color:white;font-size:14px;');
	// 创建websocket对象
	that.websocket = new Websocket({
		heartCheck: true,
		isReconnection: true
	});

	// 监听websocket关闭状态
	that.websocket.onSocketClosed({
		url: that.state.websocketUrl,
		success(res) {},
		fail(err) {
			console.error('当前websocket连接已关闭,错误信息为:' + JSON.stringify(err));
		}
	});

	// 监听网络变化
	that.websocket.onNetworkChange({
		url: that.state.websocketUrl,
		success(res) {
			console.log(res);
		},
		fail(err) {
			console.log(err);
		}
	});

	// 监听服务器返回
	that.websocket.onReceivedMsg(result => {
		let message = JSON.parse(result);
		let messageData = JSON.parse(message.data);
		message.data = messageData;
		console.log('%c 收到服务器内容：' + message['code'], 'background:#000;color:white;font-size:14px');
		console.log(message['code'] != 1102 ? message : message['code']);
		// 要进行的操作
		new ReceiveMsg(message);
	});

	that.websocket.initWebSocket({
		url: that.state.websocketUrl,
		success(res) {
			console.log('～建立连接成功！可以onSocketOpened拉～');
			// 开始登陆
			that.websocket.onSocketOpened();
			// 对外抛出websocket
			App.globalData.websocket = that.websocket;
		},
		fail(err) {
			console.log(err);
		}
	});
};