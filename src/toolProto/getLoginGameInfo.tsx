import Taro from '@tarojs/taro'
import { getStorage } from '../utils'

export default class LoginGame {
    constructor(){}

    static getRoomId(){
        return '';
    }

    static getLogin () {
        this.loginGameInfo = {
            'openId': '',
            'password': '',
            'channel': '',
            'roomid': '',
            'device': ''
        };

        getStorage('userInfo', (val) => {
            this.loginGameInfo['openId'] = val['openid'];
            this.loginGameInfo['channel'] = 1; // 渠道(0.pc,1.qq)
            this.loginGameInfo['roomid'] = LoginGame.getRoomId();
        });
        return this.loginGameInfo;
    }
}