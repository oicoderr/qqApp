import Taro from '@tarojs/taro'
import Websocket from '../service/webSocket'
import ReceiveMsg from '../service/receivedMsg'
import { websocketUrl } from '../service/config'
const App = Taro.getApp();

export const  createWebSocket = (that) =>{
    let _this = that;
    console.log(that,1111999)
    console.log('%c 创建websocket对象', 'background:#000;color:white;font-size:14px');
    // 创建websocket对象
    that.websocket = new Websocket({
        // true代表启用心跳检测和断线重连
        heartCheck: true,
        isReconnection: true
    });

    // 监听websocket关闭状态
    that.websocket.onSocketClosed({
        url: websocketUrl,
        success(res) {},
        fail(err) { console.error('当前websocket连接已关闭,错误信息为:' + JSON.stringify(err));}
    });

    // 监听网络变化
    that.websocket.onNetworkChange({
        url: websocketUrl,
        success(res) { console.log(res) },
        fail(err) { console.log(err) }
    })

    // 监听服务器返回
    that.websocket.onReceivedMsg(result => {
        let message = JSON.parse(result);
        let messageData = JSON.parse(message.data);
        message.data = messageData;
        console.info('%c 收到服务器内容：', 'background:#000;color:white;font-size:14px');
        console.info(message);
        // 要进行的操作
        new ReceiveMsg(message);
    })
    
    that.websocket.initWebSocket({
        url: websocketUrl,
        success(res) { 
            console.log('～建立连接成功！可以onSocketOpened拉～');
            // 开始登陆
            _this.websocket.onSocketOpened();
            // 对外抛出websocket
            App.globalData.webSocket = _this.websocket;
        },
        fail(err) { console.log(err) }
    })
}