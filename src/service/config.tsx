
import Taro from '@tarojs/taro'
import { setStorage, getStorage } from '../utils'

class config {
	// 如果当前提的版本等于oss版本相同走测试版本，如果不同走正式socket
	constructor() {
		// 当前版本
		this.currentVersion = 'v.1.0.0';
		// 1 正式  2 测试
		this.isVersionType = 1;
	}

	// 设置缓存中版本
	setStorageVersion(){
		setStorage('currentVersion', this.currentVersion);
	}

	// 请求版本信息
	getVersion(){
		Taro.request({
			url: 'https://oss.snmgame.com/vControl/version.json',
			header: {
				'content-type': 'application/json'
			}
		})
		.then(res =>{
			let version = JSON.parse(JSON.stringify(res.data));
			console.log('%c 版本信息：','font-size:14px;color:#FF3030;');console.log(version);
			this.diffVersion(version);
			this.setStorageVersion();
		})
	}

	// diff版本
	diffVersion(version){
		let _this = this;
		// 如果当前提的版本等于oss版本相同走测试版本，如果不同走正式socket
		getStorage('currentVersion',(res)=>{
			if(version.currentVersion == res){
				_this.isVersionType = 0;
			}else{
				_this.isVersionType = 1;
			}
		})
	}

	// 抛出当前应使用的http,socket 的url
	exportUrl(){
		let isVersionType = this.isVersionType;
		if(isVersionType){
			let data = {
				baseUrl: 'https://login.snmgame.com/',
				websocketUrl: 'wss://game.snmgame.com/',
			}
			urls(data);
			
		}else{
			let data = {
				baseUrl: 'https://login.xueyan.online/',
				websocketUrl: 'wss://game.xueyan.online/',
			}
			urls(data);
		}
	}
}

export const urls = (data) =>{
	return data;
}

let config_ = new config();
config_.getVersion();


// 如果当前提的版本等于oss版本相同走测试版本，如果不同走正式socket
const baseUrl = 'https://login.snmgame.com/';
const websocketUrl = 'wss://game.snmgame.com/';
const test_baseUrl = 'https://login.xueyan.online/';
const test_websocketUrl = 'wss://game.xueyan.online';
export {
	baseUrl,
	websocketUrl
}