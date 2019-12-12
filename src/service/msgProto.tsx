import Json3 from 'json3'

export default class MsgProto{
    constructor(){
    }

    // 顶级父模块 encode
    parentModule(params){
        const { code, data} = params;
        return this.str2buf(encodeURIComponent(Json3.stringify({
            'code': code,
            'data': Json3.stringify(data)
        })))
    }

    loginModule(params){
        const { openId, password, channel, roomid, device } = params;
        return {
            'code': 1001,
            'data': {
                'openId': openId,
                'password': password,
                'channel': channel,
                'roomid': roomid,
                'device': device
            }
        }
    }

     // 1101 前台发送心跳
    heartModule(data){
        let _this = this;
        return {
            'code': 1101,
            'data': data,
        };
    }
    
    // 1007 登录页发送昵称，头像
    basicInfo(params){
        const { nickName, avatarUrl } = params;
        return {
            'code': 1007,
            'data': {
                'nickname': nickName,
                'imgurl': avatarUrl,
            }
        };
    }

    // 1301 匹配比赛
    matchingGame(params){ // type 1.好友赛；2.红包赛；3.排位赛；4.大奖赛
        const { type, useSpeedItem } = params;
        return {
            'code': 1301,
            'data': {
                'type': type,
                'useSpeedItem': useSpeedItem
            }
        }
    }

    // 1307 排位赛发送答题内容
    submitRankAnswer(params){
        const { questId, optionId } = params;
        return {
            'code': 1307,
            'data': {
                'questId': questId,
                'optionId': optionId
            }
        }
    }

    // 1325 是否是看广告 与比赛绑定的结束奖励, 看完广告发
    isSeeAds(val){ 
        return {
            'code': 1325,
            'data':{
                'value': val
            }
        }
    }

    // 2003 是否看完广告
    adsRewards (data) { // type 1.排位赛额外奖励;2.排位赛100金币奖励;3.免费进大奖赛
        const {type, value, param1, param2} = data
        return {
            'code': 2003,
            'data':{
                'type': type,
                'value': value,
                'param1': param1,
                'param2': param2,
            }
        }
    }

    // 1005 发送性别选择
    gameSex(val){
        return {
            'code': 1005,
            'data':{
                'value': val,
            }
        }
    }

    /* -------------------------- 充值 -------------------------- */
    // 1901 请求充值模版信息
    recharge(){
        return {
            'code': 1901,
            'data':{
                'value': '',
            }
        }
    }
    // 1903 购买充值模板
    payStencil(id){
        return {
            'code': 1903,
            'data':{
                'id': id,
            }
        }
    }
    /* -------------------------- 充值 End------------------------- */

    /* -------------------------- 提现 -------------------------- */
    // 2101 能量信息
    takeMoneyInfo(){
        return{
            'code': 2101,
            'data':{
                'value': '',
            }
        }
    }
    // 2103 请求提现
    takeMoney(id){
        return {
            'code': 2103,
            'data':{
                'id': id,
            }
        }
    }
     /* -------------------------- 提现 End-------------------------- */












    // 反序列化接受服务器返回信息
    receivedMsg(str){
        return decodeURIComponent( this.buf2str((str)))
    }

    // ArrayBuffer转为字符串，参数为ArrayBuffer对象
	buf2str(buf) {
		return String.fromCharCode.apply(null, new Uint8Array(buf));
	}
	
	// 字符串转为ArrayBuffer对象，参数为字符串
	str2buf(str) {
		var buf = new ArrayBuffer(str.length*2); // 每个字符占用2个字节
		var bufView = new Uint8Array(buf);
		for (let i=0, strLen=str.length; i<strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	}
}
