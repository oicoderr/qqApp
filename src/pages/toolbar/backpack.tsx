import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image } from '@tarojs/components'
import Websocket from '../../service/webSocket'
import { unitReplacement, setStorage, getStorage } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import './backpack.scss'

import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class BackPack extends Component {
	config: Config = {
		navigationBarTitleText: '小书包',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);

		this.state = {
			data:{
				list: []
			},

			local_data:{
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				backpackTitle: 'https://oss.snmgame.com/v1.0.0/backpackTitle.png',
				usedBtn: 'https://oss.snmgame.com/v1.0.0/usedBtn.png',
				tipHaveCard: '拥有',
				tipCard: '局内道具',
				// 是否成功使用道具
				isUsedSuccess: false,
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
			console.info('%c backpack 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}

		// 请求背包信息
		this.getBackPack();

		// 1502 监听背包
		this.eventEmitter = emitter.addListener('getBackpack', (message) => {
			clearInterval(message[1]);

			this.setState((preState)=>{
				preState.data.list = message[0]['data']['list'];
			})
		});

		// 1504 服务器回复背包内道具id剩余道具数量 
		this.eventEmitter = emitter.addListener('propsInfo', (message) => {
			clearInterval(message[1]);

			let list = this.state.data.list;
			let curPropsCount = message[0]['data']['count'];
			let curPropsId= message[0]['data']['id'];
			list.map((cur, index)=>{
				if(cur.id == curPropsId){
					_this.setState((preState)=>{
						preState.data.list[index].count = curPropsCount;
					});
				}
			});
			// 如果请求的是宝箱，再请求背包数据
			if(curPropsId == 6){
				this.getBackPack();
			}
		});
	}

	componentDidHide () {
		emitter.removeAllListeners('getBackpack');
		emitter.removeAllListeners('propsInfo');
	}

	// 返回上一页
	goBack(){
		Taro.navigateBack({
			delta: 1
		});
	}

	// 道具使用
	usedCard(e){
		let count = e.currentTarget.dataset.count;
		let id = e.currentTarget.dataset.id;
		let data = {
			'id': id,
			'count': 1,
		};
		if(count > 0){
			let usedProps = this.msgProto.usedProps(data);
			let parentModule = this.msgProto.parentModule(usedProps);
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) {
					Taro.showToast({
						title: '使用成功',
						icon: 'none',
						duration: 2000
					});
				},
				fail(err){
					Taro.showToast({
						title: err.errMsg,
						icon: 'none',
						duration: 2000
					})
				}
			});
		}else{
			Taro.showToast({
				title: '道具不足',
				icon: 'none',
				duration: 2000
			});
		}
	}

	// 请求背包信息
	getBackPack(){
		let getBackpack = this.msgProto.getBackpack();
		let parentModule = this.msgProto.parentModule(getBackpack);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.info('请求背包信息Success')},
			fail(err){
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
	}

	render () {
		const { backpackTitle, backBtn, tipCard, tipHaveCard, usedBtn, isUsedSuccess } = this.state.local_data;
		const list = this.state.data.list;
		const content  = list.map((cur, index)=>{
			return  <View className={`item ${index%3== 1?'bothMargin':''}`} data-count={cur.count} data-type={cur.type}>
						<View className='cardBg'>
							<Image src={cur.icon} className='cardImg' />
							<View className='haveNum'>{tipHaveCard} {cur.count}</View>
						</View>
						<View className='name'>{cur.name}</View>
						<View className={`isUsed`}>
							<View className={`tipCard ${cur.type?'hide':''}`}>{tipCard}</View>
							<Image onClick={this.usedCard.bind(this)} data-id={cur.id} data-count={cur.count} data-name={cur.name} data-type={cur.type} src={usedBtn} className={`usedBtn ${cur.type?'':'hide'}`} />
						</View>
					</View>
		});

		return (
			<View className='backpack'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='head'>
							<View className='backBtnBox'>
								<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
							</View>
						</View>
						<View className='body'>
							<View className='backpackTitleWrap'>
								<Image src={backpackTitle} className='backpackTitle' />
							</View>
							<View className='backpackContent'>
								<ScrollView className='scrollview' scrollY scrollWithAnimation scrollTop='0'>
									<View className='box'>
										{content}
									</View>
								</ScrollView>
							</View>
						</View>
					</View>
					{/* 宝箱提示 */}
					{/* <View className={`commonTip ${isUsedSuccess?'':'hide'}`}>{}</View> */}
				</View>
			</View>
		)
	}
}