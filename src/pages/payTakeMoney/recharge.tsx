import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image } from '@tarojs/components'
import { unitReplacement, getStorage } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import './recharge.scss'

import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class Recharge extends Component {
	config: Config = {
		navigationBarTitleText: '门票购买',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);
		
		this.state = {
			data:{
				chargeList: [],  		// 门票价格信息
				redEnvelope: 0,			// 当前门票数量
			},

			local_data:{
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				ticketsIcon: 'https://oss.snmgame.com/v1.0.0/ticketsIcon.png',
				tips: 'Tips：每件商品都是需要QQ钱包支付的哟!!',
			}
		};
		this.msgProto = new MsgProto();
	}

	componentWillMount () {}

	componentDidMount () {}
		

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		if(App.globalData.websocket === ''){
			console.info('%c paTakeMoney-recharge 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}
		
		// 接受1902充值模版消息
		this.eventEmitter = emitter.addListener('getRechargeMessage', (message) => {
			clearInterval(message[1]);
			this.setState((preState)=>{
				preState.data.chargeList = message[0]['data']['chargeList'];
				preState.data.redEnvelope = unitReplacement(message[0]['data']['redEnvelope']);
			})
		});

		// 1904 接受prepay_id 拉起支付, 开始支付
		this.eventEmitter = emitter.addListener('getPrePay_id', (message) => {
			clearInterval(message[1]);
			let prepay_id = message[0]['data']['value'];
			Taro.requestPayment({
				package: "prepay_id=" + prepay_id,
				bargainor_id: "",
				success(res) {
					Taro.showToast({
						title: '支付完成',
						icon: 'none',
						duration: 2000
					});
					// 更新获取到的最新货币信息
					getStorage('currencyChange',(res)=>{
						_this.setState((preState)=>{
							preState.data.redEnvelope = res.redEnvelope;
						},()=>{})
					})
				},
				fail(err) {
					console.error(err);
					Taro.showToast({
						title: err.errMsg,
						icon: 'none',
						duration: 2000
					})
				}
			})
		});

		// 请求充值模版消息
		let recharge = this.msgProto.recharge();
		let parentModule = this.msgProto.parentModule(recharge);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.info('请求充值Success')},
			fail(err){
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		})
	}

	componentDidHide () {
		emitter.removeAllListeners('getRechargeMessage');
		emitter.removeAllListeners('getPrePay_id');
	}

	// 1903 购买门票
	buyTickets(e){
		console.info(e, 10);
		let chargeid = e.currentTarget.dataset.chargeid;
		let payStencil = this.msgProto.payStencil(chargeid);
		let parentModule = this.msgProto.parentModule(payStencil);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.info('请求购买充值模版Success')},
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
		Taro.navigateBack({
			delta: 1
		});
	}

	render () {
		const { ticketsIcon, tips, backBtn } = this.state.local_data;
		const { redEnvelope } = this.state.data;
		const chargeList = this.state.data.chargeList;
		const content  = chargeList.map((cur)=>{
			return  <View className='item'>
						<View className='ticketsBg'>
							<Image src={cur.chargeIcon} className='ticketsIconImg' />
						</View>
						<View className='payBox'>
							<View className='chargeIcon'>{cur.chargeName}</View>
							<View onClick={this.buyTickets.bind(this)} data-chargeId={cur.chargeId} className='payBtn'>
								<View className='btnBody'>{ `${cur.money / 100}元购买`}</View>
							</View>
						</View>
					</View>
		});

		return (
			<View className='recharge'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='head'>
							<View className='backBtnBox'>
								<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
							</View>
							<Image src={ticketsIcon}  className='ticketsIcon'/>
							<View className='ticketsBox'>{redEnvelope}</View>
						</View>
						<View className='body'>
							<ScrollView className='scrollview'
										scrollY
										scrollWithAnimation
										scrollTop='0'>
								<View className='ticketsContent'>
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