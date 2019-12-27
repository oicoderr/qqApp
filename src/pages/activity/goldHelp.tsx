import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text, ScrollView } from '@tarojs/components'
import './goldHelp.scss'
import emitter from '../../service/events'
import throttle from 'lodash/throttle'
import { getStorage, formatSeconds } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import GameLoading from '../../components/GameLoading'
import MessageToast from '../../components/MessageToast'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class GoldHelp extends Component {

	config: Config = {
		navigationBarTitleText: '金币助力',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);
		// 节流函数
		this.DBgetQuickenCard = throttle(this.DBgetQuickenCard, 1000);
		this.state = {

			data:{
				gameDescription: [],
				// 金币助力信息
				getGoldHelpInfo:{},
			},

			local_data:{
				timer: '',
				isShowDirections: false,
				isShowGameLoading: true,
				// 倒计时时间h,m,s
				countdown:{},
				currencyChange: {},
				howPlayTip: '玩法说明',
				baseGoldTxt: '基础金币',
				inviteTxt0: '邀请好友助力',
				inviteTxt1: '+10%基础金币',
				inviteTxt2: '当前金币累计：',
				countdownTxt: '领取倒计时：',
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				goldIcon: 'https://oss.snmgame.com/v1.0.0/goldIconOnline.png',
				gold_help_bg: 'https://oss.snmgame.com/v1.0.0/gold_help_bg.png',
				goldIconOverlay: 'https://oss.snmgame.com/v1.0.0/goldIcon.png',
				addIcon: 'https://oss.snmgame.com/v1.0.0/addIcon.png',
				receiveBtn: 'https://oss.snmgame.com/v1.0.0/receiveBtn_goldHelp.png',
			}
		};

		this.msgProto = new MsgProto();
	}

	componentWillMount () {}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {

		if(App.globalData.websocket === ''){
			console.info('%c mall 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}

		// 获取金币/能量
		getStorage('currencyChange',(res)=>{
			this.setState((preState)=>{
				console.info(res,1111223)
				preState.local_data.currencyChange = res;
			})
		});

		// 请求金币助力信息
		this.goldHelpInfo();

		// 2402 玩法说明回复
		this.eventEmitter = emitter.addListener('getGameDescription', (message) => {
			clearInterval(message[1]);

			let gameDescription = message[0]['data'];
			let type = message[0]['data']['type'];
			this.setState((preState)=>{
				preState.data.gameDescription = gameDescription;
				preState.local_data.isShowDirections = true;
			},()=>{});

			// 发送子组件messageToast
			let messageToast_data = {
				title: '说明',
				body: gameDescription
			};
			switch (type){
				case 1:
					messageToast_data['title'] = '金币助力';
					break;
				case 2:
					messageToast_data['title'] = '大奖赛规则';
					break;
				case 3:
					messageToast_data['title'] = '大奖赛加速卡说明';
					break;
				case 4:
					messageToast_data['title'] = '商城限免说明';
					break;
				case 5:
					messageToast_data['title'] = '道具卡使用说明';
					break;
			}
			emitter.emit('messageToast', messageToast_data);
		});

		// 1512 金币助力信息
		this.eventEmitter = emitter.addListener('getGoldHelp', (message) => {
			clearInterval(message[1]);

			let getGoldHelpInfo = message[0]['data'];
			console.info('%c 收到1512 金币助力信息', 'background-color: #000; color:#fff;font-size:14px;');console.info(getGoldHelpInfo);
			// 开始倒计时
			let maxtime = formatSeconds(getGoldHelpInfo.cd);
			this.timeDown(maxtime);
			this.setState((preState)=>{
				preState.data.getGoldHelpInfo = getGoldHelpInfo;
				preState.local_data.isShowGameLoading = false;
			});
		});

		// 监听 子组件MessageToast 关闭弹窗消息 
		this.eventEmitter = emitter.addListener('closeMessageToast', (message) => {
			this.setState((preState)=>{
				preState.local_data.isShowDirections = false;
			})
		});
	}

	componentDidHide () {
		clearInterval(this.state.local_data.timer);
		emitter.removeAllListeners('getGameDescription');
		emitter.removeAllListeners('getGoldHelp');
		emitter.removeAllListeners('closeMessageToast');
	}

	// 请求说明
	DBgetQuickenCard(e){
		this.description(e);
	}
	description(e){
		// 类型 type (1.金币助力;2.大奖赛规则;3.大奖赛加速卡说明;4.商城限免说明, 5.道具卡使用说明)
		let type = e.currentTarget.dataset.type;
		let gameDescription = this.msgProto.gameDescription(type);
		let parentModule = this.msgProto.parentModule(gameDescription);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {},
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	// 请求金币助力信息
	goldHelpInfo(){
		let goldHelpInfo = this.msgProto.goldHelpInfo();
		let parentModule = this.msgProto.parentModule(goldHelpInfo);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {},
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	// 返回上一页
	goBack(){
		Taro.navigateBack({
			delta: 1
		});
	}

	// 倒计时
	timeDown(maxtime) {
		let _this = this;
		var h = maxtime.substring(0,2);
		var m = maxtime.substring(3,5);
		var s = maxtime.substring(6,8);
		if(h =='00' && m=='00' && s=='00'){
			clearInterval(_this.state.local_data.timer);
			_this.setState((preState)=>{
				preState.local_data.countdown.hour = h;
				preState.local_data.countdown.minutes = m;
				preState.local_data.countdown.seconds = s;
			});
			return;
		}else{
			//进行倒计时显示
			this.state.local_data.timer = setInterval(function(){
				--s;
				if(s < 0){
					--m;
					s=59;
				}
				if( m < 0){
					--h;
					m=59
				}
				if( h < 0){
					s=0;
					m=0;
				}
				// 判断当时分秒小于10时补0
				function checkTime(i){
					if (i < 10 && i > -1) {
						i = '0' + i
					}
					return i;
				}
				s = checkTime(s);
				m = checkTime(m);
				_this.setState((preState)=>{
					preState.local_data.countdown.hour = h;
					preState.local_data.countdown.minutes = m;
					preState.local_data.countdown.seconds = s;
				});
			},1000);
		}
	}

	// 领取金币助力
	receiveGoldHelp(){
		let receiveGoldHelp = this.msgProto.receiveGoldHelp();
		let parentModule = this.msgProto.parentModule(receiveGoldHelp);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {},
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	render () {
		const { backBtn, goldIcon, goldIconOverlay, addIcon, gold_help_bg, baseGoldTxt, 
			isShowDirections, howPlayTip, inviteTxt0, inviteTxt1, inviteTxt2, countdownTxt, 
			receiveBtn,isShowGameLoading,} = this.state.local_data;
		const { bonus, cd, icon, currCopper, list} = this.state.data.getGoldHelpInfo;
		const { hour, minutes, seconds } = this.state.local_data.countdown;
		const {copper, energy, redEnvelope} = this.state.local_data.currencyChange;
		const content = list.map((cur,index)=>{
			return  <View className={`item ${index%2?'marginLeft':''}`}>
						<Image src={cur} className='headUrl'/>
						<View className='golgNum'>
							<Image src={goldIconOverlay} className='goldIconOverlay' />
							<View className='num'>
								<View className='addSymbol'>
									+<Text className='bonus'>{bonus}%</Text>
								</View>
								<View className='baseGoldTxt'>{baseGoldTxt}</View>
							</View>
						</View>
					</View>
		})

		return (
			<View className='golgHelp'>
				<View className={isShowDirections?'':'hide'}>
					<MessageToast />
				</View>
				<View className={isShowGameLoading?'':'hide'}>
					<GameLoading />
				</View>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='head'>
							<View className='backBtnBox'>
								<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
								<View className='goldWrap'>
									<Image src={goldIcon} className='goldIcon_' />
									<View className='num goldNum'>{copper}</View>
								</View>
							</View>
						</View>

						<View className='body'>
							<View className='gold_help_box'>
								<Image src={gold_help_bg} className='gold_help_bg'></Image>
								<View onClick={this.DBgetQuickenCard.bind(this)} data-type='1' className='howPlayTip'>{howPlayTip}</View>
								<ScrollView  className='scrollview' scrollY scrollWithAnimation>
									<View className='itemBox'>
										{content}
									</View>
								</ScrollView>
								<View className='inviteBox'>
									<View className='inviteWrap'>
										<Image src={addIcon} className='addIcon'></Image>
										<View className='inviteTxtBox'>
											<View className='inviteTxt0'>{inviteTxt0}</View>
											<View className='inviteTxt1'>{inviteTxt1}</View>
										</View>
									</View>
								</View>
								<View className='inviteTxt3'>{inviteTxt2}</View>
								<View className='goldTotal'>
									<Image src={goldIconOverlay} className='goldIconOverlay' />
									<View className='currCopper'>+{currCopper}</View>
								</View>
							</View>
							{/* 倒计时 */}
							<View className='countdown'>
								<Text className='countdownTxt'>{countdownTxt}</Text>
								<View className='hour'>{hour}</View>:
								<View className='minute'>{minutes}</View>:
								<View className='second'>{seconds}</View>
							</View>
							<View onClick={this.receiveGoldHelp.bind(this)} className='receiveBtnWrap'>
								<Image src={receiveBtn} className='receiveBtn' />
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}