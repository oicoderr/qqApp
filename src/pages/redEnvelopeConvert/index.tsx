import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button, Text, Image } from '@tarojs/components'
import { Api } from '../../service/api'
import RedExchange from '../../components/RedExchange'
import { getUserInfo, setStorage, getStorage, removeStorage, request } from '../../utils'
import emitter from '../../service/events';
import './index.scss'

export class redEnvelopeConvert extends Component {

	config: Config = {
		navigationBarTitleText: '红包卡兑换',
		navigationBarBackgroundColor: 'rgba(138, 218, 255, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			
			// 路由 annalPage:提现记录  takeMoneyPage: 提现页面
			routers:{
				annalPage: '../takeMoneyAnnal/index',
				takeMoneyPage: '../takeMoney/index',
			},

			// 后台返回数据
			data: {
				balance: '110.00',
				num: 15,
			},


			cash_data:{
				overTip: '余额提示',
				withdrawalTip: '提现记录',
				withdrawalBtnText: '提现',
				bg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/cashBg.png'
			},

			balance_data:{
				redEnvelopeBg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/redEnvelopeBg.png',
				tip: '当前红包卡数量',
				btnText: '兑换',
				numTip: '红包卡1元/个',
				isShowToast: false,
				redEnvelopeNum: 0,
			}
		}
	}

  	componentWillMount () {}

  	componentDidMount () {
		// 接受关红包兑换闭弹窗信息
      	this.eventEmitter = emitter.addListener('closeToast_RedEnvelopeConvert', (message) => {
			console.warn('接受子组件（closeToast_RedEnvelopeConvert）发送的信息==>');console.info(message);
			this.setState((oldState)=>{
				this.state.balance_data.isShowToast = message.isShowToast;
				let data_ = this.state.balance_data;
				return{
					balance_data: data_
				}
			},()=>{

			})
		});
		  
		  // 接受关红包兑换数量
      	this.eventEmitter = emitter.addListener('submit_RedEnvelopeConvert', (message) => {
			console.warn('接受子组件（submit_RedEnvelopeConvert）发送的信息==>');console.info(message);
			this.setState((oldState)=>{
				this.state.balance_data.redEnvelopeNum = message.redEnvelopeNum;
				this.state.balance_data.isShowToast = false;
				let data_ = this.state.balance_data;
				return{
					balance_data: data_
				}
			},()=>{

			})
  		});
  	}
	
	// 组件卸载时：移除监听事件
	componentWillUnmount () {
		// emitter.removeListener(this.eventEmitter);
	}

	componentDidShow () { }

	componentDidHide () { }

	// 跳转提现记录
	goAnnal(){
		Taro.navigateTo({
			url: this.state.routers.annalPage
		})
	}

	// 跳转提现页面
	goTakeMoney(){
		Taro.navigateTo({
			url: this.state.routers.takeMoneyPage
		})
	}

	// 打开红包兑换Toast
	openExchangeToast(){
		this.setState((oldState)=>{
			this.state.balance_data.isShowToast = true;
			let data_ = this.state.balance_data;
			return{
				balance_data: data_
			}
		},()=>{
			
		})
	}

	render () {
		const {bg, overTip, withdrawalBtnText, withdrawalTip } = this.state.cash_data;
		const {redEnvelopeBg, tip, btnText, isShowToast } = this.state.balance_data;

		const { num, balance } = this.state.data;

		return (
			<View className='index'>
				<View className={isShowToast?'':'hide'}>
					<RedExchange />
				</View>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='cash'>
							<Image className='cashImg' src={bg}></Image>
							<View className='bodyMiddle'>
								<View className='tip'>{overTip}</View>
								<View className='num'>{balance}<Text>元</Text></View>
								<View onClick={this.goTakeMoney.bind(this)} className='btnText'>{withdrawalBtnText}</View>
							</View>
							<View className='bodyRight'>
								<View onClick={this.goAnnal.bind(this)} className='withdrawalAnnal'>{withdrawalTip}</View>
							</View>
						</View>
						<View className='redEnvelope'>
							<Image className='redEnvelopeImg' src={redEnvelopeBg}></Image>
							<View className='bodyMiddle'>
								<View className='tip'>{tip}</View>
								<View className='num'>{num}<Text>个</Text></View>
								<View onClick={this.openExchangeToast} className='btnText'>{btnText}</View>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}