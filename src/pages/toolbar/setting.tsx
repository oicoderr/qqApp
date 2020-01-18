import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image, Text } from '@tarojs/components'
import { createWebSocket } from '../../service/createWebSocket'
import configObj from '../../service/configObj'
import './setting.scss'
import { getStorage, setStorage } from '../../utils'
import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class Setting extends Component {
	config: Config = {
		navigationBarTitleText: '设置',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);

		this.state = {
			bgmStatus: true,
			musicEffectsStatus: true,

			routers: {
				loginPage: '/pages/login/index',
				indexPage: '/pages/index/index',
			},

			data: {},

			local_data: {
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				settingTitle: 'https://oss.snmgame.com/v1.0.0/settingTitle.png',
				signOutBtn: 'https://oss.snmgame.com/v1.0.0/signOutBtn.png',

				list: [
					{
						id: 1,
						txt: '音乐',
						openBtn: 'https://oss.snmgame.com/v1.0.0/settingBtnOpen.png',
						shutDownBtn: 'https://oss.snmgame.com/v1.0.0/settingBtnShutDown.png',
						status: 0, // 默认开启状态（显示关闭按钮）
					}, {
						id: 2,
						txt: '音效',
						openBtn: 'https://oss.snmgame.com/v1.0.0/settingBtnOpen.png',
						shutDownBtn: 'https://oss.snmgame.com/v1.0.0/settingBtnShutDown.png',
						status: 0, // 默认开启状态（显示关闭按钮）
					}
				]
			},

			websocketUrl: '',
		};
		this.msgProto = new MsgProto();
	}

	componentWillMount() { }

	componentDidMount() { }

	componentWillUnmount() {
		emitter.removeAllListeners('requestUrl');
	}

	componentDidShow() {
		let _this = this;

		// 获取当前版本
		configObj.getVersion();
		// 监听requestUrl
		this.eventEmitter = emitter.addListener('requestUrl', message => {
			clearInterval(message[0]);

			this.state.websocketUrl = message[1]['websocketUrl'];

			// 接受AppGlobalSocket
			if (App.globalData.websocket === '') {
				createWebSocket(this);
			} else {
				this.websocket = App.globalData.websocket;
				let websocketUrl = this.state.websocketUrl;
				if (this.websocket.isLogin) {
					console.log("%c 您已经登录了", 'background:#000;color:white;font-size:14px');
				} else {
					this.websocket.initWebSocket({
						url: websocketUrl,
						success(res) {
							// 开始登陆
							_this.websocket.onSocketOpened((res) => { });
							// 对外抛出websocket
							App.globalData.websocket = _this.websocket;
						},
						fail(err) {
							createWebSocket(_this);
						}
					});
				}
			}
		});

		// 获取bgm播放状态
		getStorage('sounds',(res)=>{
			if(res[0]['type'] == 1){
				if(res[0]['status']){
					_this.setState((preState)=>{
						preState.local_data.list[0]['status'] = 0;
					});
				}else{
					_this.setState((preState)=>{
						preState.local_data.list[0]['status'] = 1;
					});
				}
			}
			if(res[1]['type'] == 2){
				if(res[1]['status']){
					_this.setState((preState)=>{
						preState.local_data.list[1]['status'] = 0;
					});
				}else{
					_this.setState((preState)=>{
						preState.local_data.list[1]['status'] = 1;
					});
				}
			}
		})
	}

	componentDidHide() { }

	// 返回上一页
	goBack() {
		let indexPage = this.state.routers.indexPage;
		Taro.reLaunch({
			url: indexPage
		});
	}

	// 开关Id: 0bgm, 1音效
	musicSwitch(e) {
		let _this = this;
		let id = e.currentTarget.dataset.id;
		let status = e.currentTarget.dataset.status;
		let list = this.state.local_data.list;
		list.map((cur, index) => {
			if (id === cur['id']) {
				_this.setState((preState) => {
					preState.local_data.list[index]['status'] = !status;
				});
				// bgm 开关
				if(id == 1){
					if(status){
						App.globalData.audioObj.soundBgm.play();
						getStorage('sounds',(res)=>{
							let sounds = JSON.parse(JSON.stringify(res))
							sounds.map((cur)=>{
								if(cur['type'] == 1){
									sounds[0] = {'type': 1,'status': 1,};
								}
							});
							setStorage('sounds',sounds);
						});
					}else{
						App.globalData.audioObj.soundBgm.stop();
						getStorage('sounds',(res)=>{
							let sounds = JSON.parse(JSON.stringify(res))
							sounds.map((cur)=>{
								if(cur['type'] == 1){
									sounds[0] = {'type': 1,'status': 0,};
								}
							});
							setStorage('sounds',sounds);
						});
					}
				}else if(id == 2){ // 音效开关
					if(status){
						getStorage('sounds',(res)=>{
							let sounds = JSON.parse(JSON.stringify(res))
							sounds.map((cur)=>{
								if(cur['type'] == 2){
									sounds[1] = {'type': 2,'status': 1,};
								}
							});
							setStorage('sounds',sounds);
						});
					}else{
						getStorage('sounds',(res)=>{
							let sounds = JSON.parse(JSON.stringify(res))
							sounds.map((cur)=>{
								if(cur['type'] == 2){
									sounds[1] = {'type': 2,'status': 0,};
								}
							});
							setStorage('sounds',sounds);
						});
					}
				}
			}
		})
	}

	// 退出登录
	signOut(){
		// 销毁bgm实例
		App.globalData.InnerAudioContext.destroy();
		let loginPage = this.state.routers.loginPage;
		Taro.reLaunch({
			url: loginPage,
		});
	}

	render() {
		const { settingTitle, backBtn, list, signOutBtn } = this.state.local_data;
		const content = list.map((cur) => {
			return <View className='item'>
				<Text>{cur.txt}</Text>
				<Image data-id={cur.id} data-status={cur.status} onClick={this.musicSwitch.bind(this)} src={cur.status ? cur.openBtn:cur.shutDownBtn } className='btn'></Image>
			</View>
		})

		return (
			<View className='setting'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='head'>
							<View className='backBtnBox'>
								<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
							</View>
						</View>
						<View className='body'>
							<View className='settingTitleWrap'>
								<Image src={settingTitle} className='settingTitle' />
							</View>
							<View className='settingContent'>
								<ScrollView className='scrollview' scrollY scrollWithAnimation scrollTop='0'>
									<View className='box'>
										{content}
									</View>
								</ScrollView>
								<View onClick={this.signOut.bind(this)} className='signOutBtnWrap'>
									<Image src={signOutBtn} className='signOutBtn' />
								</View>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}