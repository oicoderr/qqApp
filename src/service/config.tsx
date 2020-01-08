
import Taro from '@tarojs/taro'
import { setStorage, getStorage } from '../utils'
import emitter from '../service/events';
import '@tarojs/async-await'

export default class config {
	// 如果当前提的版本等于oss版本相同走测试版本，如果不同走正式socket
	constructor() {
		// 当前版本
		this.currentVersion = 'v1.0.1';
		// 1 正式  0 测试
		this.isVersionType = 1;
	}

	// 设置缓存中版本
	setStorageVersion(){
		setStorage('currentVersion', this.currentVersion);
	}

	// 请求版本信息
	async getVersion(){
		const response = await Taro.request({
			url: 'https://oss.snmgame.com/vControl/version.json',
			header: {
				'content-type': 'application/json'
			}
		});
		console.log(response,999);
		console.log('%c 版本信息：','font-size:14px;color:#D15FEE;background-color:#FAFAFA;');console.log(response.data);
		this.diffVersion(response.data);
		this.setStorageVersion();
		this.exportUrl();
	}

	// diff版本
	diffVersion(version){
		let _this = this;
		// 如果当前提的版本等于oss版本相同走测试版本，如果不同走正式socket
		getStorage('currentVersion',(res)=>{
			if(version.currentVersion == res){
				_this.isVersionType = 0;
				console.log('%c 走`测试`版本socket','font-size:14px;color:#D15FEE;background-color:#FAFAFA;');
			}else{
				_this.isVersionType = 1;
				console.log('%c 走`生产`版本socket','font-size:14px;color:#4876FF;background-color:#FAFAFA;');
			}
		})
	}

	// 抛出当前应使用的http,socket 的url
	exportUrl(){
		let isVersionType = this.isVersionType;
		let data = {};
		if(isVersionType){
			data = {
				baseUrl: 'https://login.snmgame.com/',
				websocketUrl: 'wss://game.snmgame.com/',
			};
		}else{
			data = {
				baseUrl: 'https://login.xueyan.online/',
				websocketUrl: 'wss://game.xueyan.online/',
			};
		}
		let timer = setInterval(()=>{
			emitter.emit('requestUrl', [timer, data]);
		},20)
	}
}