import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button, Text, Image } from '@tarojs/components'
import { Api } from '../../service/api'
import CommonToast from '../../components/CommonToast'
import { getUserInfo, setStorage, getStorage, removeStorage, request } from '../../utils'
import emitter from '../../service/events';
import './index.scss'
import { connect } from 'net';

export class TakeMoney extends Component {

	config: Config = {
		navigationBarTitleText: '提现',
		navigationBarBackgroundColor: 'rgba(138, 218, 255, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			// 后台返回数据
			data:{
				money_balance: 110.00,
				money_tab: [10, 20, 30],
			},
			// 前台数据
			takeMoney_data:{
				balanceTip: '余额',
				moneyTabImg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/money_tabs.png',
				tip: 'Tips：每日可以进行一次提现操作，每日提现限额为30，并存入QQ钱包。',
				isShowToast: false,
				takeMoney: ''
			}

		}
	}

  	componentWillMount () {

  	}

  	componentDidMount () {
		// 窗口关闭/打开消息
      	this.eventEmitter = emitter.addListener('closeToast_CommonToast', (message) => {
			console.warn('接受==子组件==（commonToast）发送的信息==>'); console.info(message);
			this.setState((oldState)=>{
				this.state.takeMoney_data.isShowToast = message.isShowToast;
				let data_ = this.state.takeMoney_data;
				return{
					takeMoney_data: data_
				}
			},()=>{

			})
		  });
		
		// 确认提现信息
		this.eventEmitter = emitter.addListener('submitTakeMoney', (message) => {
			console.warn('接受==子组件==（commonToast）确认提现金额信息==>'); console.info(message);
			this.setState((oldState)=>{
				this.state.takeMoney_data.takeMoney = message.takeMoney;
				this.state.takeMoney_data.isShowToast = message.isShowToast;
				let data_ = this.state.takeMoney_data;
				return{
					takeMoney_data: data_
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

	// 选择提现金额
	selectMoneyTab(value){
		this.setState((oldState)=>{
			let takeMoney_data_ = this.state.takeMoney_data;
			this.state.takeMoney_data.isShowToast = true;
			return{
				takeMoney_data: takeMoney_data_
			}
		},()=>{
			let takeMoneyMessage = {
				money: value
			};
			emitter.emit('takeMoneyMessaeg', takeMoneyMessage);
		})
	}
	
	// 跳转提现记录
	goAnnal(){
		Taro.navigateTo({
			url: this.state.routers.annalPage
		})
	}

	render () {
		const {money_tab, money_balance} = this.state.data;
		const {isShowToast, moneyTabImg, balanceTip, tip} = this.state.takeMoney_data;
		
		const content = money_tab.map((currentValue, index) => {
			return 	<View onClick={this.selectMoneyTab.bind(this, currentValue)} className='tabs'>
						<Image src={moneyTabImg} className='moneyTabImg'></Image>
						<View className='money'>
							{currentValue}<Text>元</Text>
						</View>
					</View>
        });

		return (
			<View className='index'>
				<View className={isShowToast?'':'hide'}>
					<CommonToast />
				</View>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='moneyBox'>
							<View className='moneyBody'>
								<View className='balance'>
									<Text decode={true} space={true}>{balanceTip}&nbsp;{money_balance}&nbsp;元</Text>
								</View>
								<View className='tabsBox'>
									{content}
								</View>
								<View className='receiveTip'>{tip}</View>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}