import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image, Text } from '@tarojs/components'
import throttle from 'lodash/throttle'
import { setStorage, getStorage, unitReplacement } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import './goldHelp.scss'
import GameLoading from '../../components/GameLoading'
import MessageToast from '../../components/MessageToast'
import createVideoAd from '../../service/createVideoAd'
import emitter from '../../service/events'
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
		// this.DBswitchTab = throttle(this.DBswitchTab, 1000);
		this.state = {
			data:{
				list: []
			},

			local_data:{
			}
		};

		this.msgProto = new MsgProto();
	}

	componentWillMount () {

	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;

		if(App.globalData.websocket === ''){
			console.info('%c mall 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}

		// 获取金币/能量，如果不存在就在gameUserInfo中取
		getStorage('currencyChange',(res)=>{
			this.setState((preState)=>{
				preState.local_data.currencyChange = res;
			})
		});

		// 请求商城信息, 默认请求道具商城
		let getMall = this.msgProto.getMall(1);
		let parentModule = this.msgProto.parentModule(getMall);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.info('请求商城信息Success')},
			fail(err){
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	componentDidHide () {}

	// 返回上一页
	goBack(){
		Taro.navigateBack({
			delta: 1
		});
	}

	render () {

		return (
			<View className='golgHelp'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
					
					</View>
				</View>
			</View>
		)
	}
}