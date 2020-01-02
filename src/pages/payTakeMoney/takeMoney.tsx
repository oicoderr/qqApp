import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image } from '@tarojs/components'
import { unitReplacement, getStorage } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import { websocketUrl } from '../../service/config'
import './takeMoney.scss'
import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class TakeMoney extends Component {
	config: Config = {
		navigationBarTitleText: '兑换中心',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);
		
		this.state = {

			routers:{
				indexPage: '/pages/index/index',
			},

			data:{
				list: [],  		// 能量兑换列表
				energy: 0,		// 当前拥有能量数
			},

			local_data:{
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				tips: 'Tips：现金红包存入QQ钱包！每件商品每日可以兑换一次哟！',
				exchangeTxt: '兑换',
				energyIcon: 'https://oss.snmgame.com/v1.0.0/energyIcon.png',
				energyLittleIcon: 'https://oss.snmgame.com/v1.0.0/energyLittleIcon.png',
			}
		};
		this.msgProto = new MsgProto();
	}

	componentWillMount () {}

	componentDidMount () {}

	componentWillUnmount () {
		emitter.removeAllListeners('takeMoney');
		emitter.removeAllListeners('takeMoneyStatus');
	}

	componentDidShow () {
		let _this = this;

		if(App.globalData.websocket === ''){
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
			if(this.websocket.isLogin){
				console.log("%c 您已经登录了", 'background:#000;color:white;font-size:14px');
				this.takeMoneyInfo();
			}else{
				this.websocket.initWebSocket({
					url: websocketUrl,
					success(res){
						// 开始登陆
						_this.websocket.onSocketOpened((res)=>{
							_this.takeMoneyInfo();
						});
						// 对外抛出websocket
						App.globalData.websocket = _this.websocket;
					},
					fail(err){
						createWebSocket(_this);
					}
				});
			}
		}

		// 2102提现信息
		this.eventEmitter = emitter.addListener('takeMoney', (message) => {
			clearInterval(message[1]);
			// console.log('收到2102');console.log(message[0]);
			this.setState((preState)=>{
				preState.data.list = message[0]['data']['list'];
				preState.data.energy = unitReplacement(message[0]['data']['energy']);
			})
		}); 

		// 2104提现成功/失败状态
		this.eventEmitter = emitter.addListener('takeMoneyStatus', (message) => {
			clearInterval(message[1]);
			let type = message[0]['data']['type'];
			let msg = message[0]['data']['value']=='ok'?'提现成功': message[0]['data']['value'];
			Taro.showToast({
				title: msg,
				icon: 'none',
				duration: 2000
			});
			if(message[0]['data']['value'] == 'ok'){
				getStorage('currencyChange',(res)=>{
					let energy = res.energy
					this.setState((preState)=>{
						preState.data.energy = energy;
					},()=>{})
				})
			}
		});
	}

	componentDidHide () {}

	// 开始能量兑换现金，提现
	takeMoney(e){
		let {redid, exchangecount} = e.currentTarget.dataset;
		if(exchangecount > 0 && redid){
			let takeMoney = this.msgProto.takeMoney(redid);
			let parentModule = this.msgProto.parentModule(takeMoney);
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) {console.log('请求提现Success')},
				fail(err){
					Taro.showToast({
						title: err.errMsg,
						icon: 'none',
						duration: 2000
					})
				}
			})
		}else{
			Taro.showToast({
				title: '兑换次数已用完',
				icon: 'none',
				mask: true,
				duration: 2000
			});
		}
	}

	// 请求提现信息
	takeMoneyInfo(){
		// 请求提现信息
		let takeMoneyInfo = this.msgProto.takeMoneyInfo();
		let parentModule = this.msgProto.parentModule(takeMoneyInfo);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.log('请求提现信息Success')},
			fail(err){
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		})
	}

	// 返回上一页
	goBack(){
		let indexPage = this.state.routers.indexPage;
		Taro.reLaunch({
			url: indexPage
		});
	}

	render () {
		const { energyIcon, energyLittleIcon, tips, backBtn, exchangeTxt } = this.state.local_data;
		const energy = this.state.data.energy;
		const list = this.state.data.list;

		const content  = list.map((cur)=>{
			return  <View className='item'>
						<View className='energyBg'>
							<Image src={cur.redIcon} className='energyIconImg' />
						</View>
						<View className='takeMoneyBox'>
							<View className='energyWrap'>
								<View className='energyNum'>
									<Image src={energyLittleIcon} className='energyLittleIcon'/>
									<View className='num'>{cur.money}</View>
								</View>
							</View>
							<View onClick={this.takeMoney.bind(this)} className={`takeBtn ${cur.exchangeCount < 1?'banTakeMoney':''}`} data-redId={cur.redId} data-exchangeCount={cur.exchangeCount}>
								<View className={`btnBody ${cur.exchangeCount < 1?'banTakeMoney':''}`}>{exchangeTxt}</View>
							</View>
						</View>
					</View>
		});

		return (
			<View className='takeMoney'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='head'>
							<View className='backBtnBox'>
								<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
							</View>
							<Image src={energyIcon}  className='energyIcon'/>
							<View className='energyBox'>{energy}</View>
						</View>
						<View className='body'>
							<ScrollView className='scrollview'
										scrollY
										scrollWithAnimation
										scrollTop='0'>
								<View className='energyContent'>
									{content}
								</View>
							</ScrollView>
							<View className='tips'>{tips}</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}