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
            'device': '',
            'param1': 0, // 受邀请类型(1.组队;2.加速卡)
            'param2': '', // 受邀请内容(暂定为邀请者的roleId)
        };
        // 个人信息
        getStorage('userInfo', (val) => {
            this.loginGameInfo['openId'] = val['openid'];
            this.loginGameInfo['channel'] = 1; // 渠道(0.pc,1.qq)
            this.loginGameInfo['roomid'] = LoginGame.getRoomId();
        });
        //  邀请者信息
        getStorage('inviterInfo', (val) => {
            if(!val.param1){
                this.loginGameInfo['param1'] = 0;
                this.loginGameInfo['param2'] = '';
            }else{
                this.loginGameInfo['param1'] = val['param1'];
                this.loginGameInfo['param2'] = val['inviterRoleId'];
            }
        });
        return this.loginGameInfo;
    }
}