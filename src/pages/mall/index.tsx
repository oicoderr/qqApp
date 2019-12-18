import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image, Text } from '@tarojs/components'
import { unitReplacement, setStorage, getStorage } from '../../utils'
import './index.scss'

import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class Login extends Component {
	config: Config = {
		navigationBarTitleText: '商城',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);
		
		this.state = {
			data:{
				// 商城信息
				/*
					consumType: (0.看广告;1.门票;2.金币;3.能量)
				*/
				list: []
			},

			local_data:{
				backBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/backBtn.png',
				mallTitle: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/mallTitle.png',
				energyIcon: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/energyIcon.png',
				ticketsIcon: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/ticketsIcon.png',
				goldIcon: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/goldIconOnline.png',
				propsText: '道具卡',
				bandText: '乐队',
				// 可以免费获取的道具
				freePiece: [],
				// 需消费才可获取的道具
				propsPiece: [],
				freeTitle: '限时免费',
				freeTip: '限免说明',
				propsTitle: '道具商店',
				propsTip:'道具卡功能介绍',
				// 默认打开道具商城
				isTab: true,
				rewardText: '今日限免',
			}
		};
		this.msgProto = new MsgProto();
		this.webSocket = App.globalData.webSocket;
	}

	componentWillMount () {}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		// 请求商城信息
		let getMall = this.msgProto.getMall(1);
		let parentModule = this.msgProto.parentModule(getMall);
		this.webSocket.sendWebSocketMsg({
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

		// 1702 监听服务器回复商城当天已免费领取情况 
		this.eventEmitter = emitter.addListener('getMall', (message) => {
			clearInterval(message[1]);
			console.info('商城信息：');
			console.info(message[0]['data']);
			this.setState((preState)=>{
				preState.data.list = message[0]['data']['list'];
			});
			this.classification(message[0]['data']['list']);
		});
	}

	componentDidHide () {}

	// 返回上一页
	goBack(){
		Taro.navigateBack({
			delta: 1
		});
	}

	// list分类
	classification(list){
		let list_ = JSON.parse(JSON.stringify(list));
		let freePiece = [], propsPiece = [];
		list_.map((cur,index)=>{
			if(cur.consumType == 0){ // 将0看广告获得道具放在道具类
				freePiece.push(cur);
			}else{
				propsPiece.push(cur);
			}
		});
		this.setState((preState)=>{
			preState.local_data.freePiece = freePiece;
			preState.local_data.propsPiece = propsPiece;
		})
	}

	// tab 切换根据data-type：1 道具 2 乐队
	tabSelected(e){
		let type = e.currentTarget.dataset.type;
		if(type == 1){
			this.setState((preState)=>{
				preState.local_data.isTab = true;
			})
		}else if(type == 2){
			this.setState((preState)=>{
				preState.local_data.isTab = false;
			})
		}
	}

	// 获取管道道具模版id
	seeAdsGetProps(e){
		let id = e.currentTarget.dataset.id;


	}

	render () {
		const { mallTitle, backBtn, propsText, bandText, freeTitle, freeTip, propsTitle, 
			propsTip, isTab, rewardText, energyIcon, ticketsIcon, goldIcon  } = this.state.local_data;
		// 道具
		const freePiece = this.state.local_data.freePiece;
		const propsPiece = this.state.local_data.propsPiece;

		const freePieceContent = freePiece.map((cur, index)=>{
			return  <View onClick={this.seeAdsGetProps.bind(this)} data-id={cur.id} className={`item ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg'>
							<Image src={cur.icon} className='cardImg' />
						</View>
						<View className='name'>{cur.name}</View>
						<View className='rewardCount'>
							<View className='rewardText'>
								{rewardText}
							</View>
							<Text className='rewardCountText'>{cur.rewardCount}</Text>
						</View>
					</View>
		});
		const propsPieceContent = propsPiece.map((cur, index)=>{
			return  <View className={`item ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg'>
							<Image src={cur.icon} className='cardImg' />
						</View>
						<View className='name'>{cur.name}*{cur.count}</View>
						
						<View className='consumCountWrap'>
							<Image src={`${cur.consumType==1?ticketsIcon:''}`} className= {`icon ticketsIcon ${cur.consumType==1?'':'hide'}`} />
							<Image src={`${cur.consumType==2?goldIcon:''}`} className={`icon goldIcon ${cur.consumType==2?'':'hide'}`} />
							<Image src={`${cur.consumType==3?energyIcon:''}`} className={`icon energyIcon ${cur.consumType==3?'':'hide'}`} />
							<View className='consumCount'>{cur.consumCount}</View>
						</View>
					</View>
		});
		// 乐队


		return (
			<View className='mall'>
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
								<Image src={mallTitle} className='backpackTitle' />
							</View>

							<View className='mallContent'>
								<View className='tab'>
									<View onClick={this.tabSelected.bind(this)} data-type='1' className={`btn ${isTab?'selectedBtn':''}`}>{propsText}</View>
									<View onClick={this.tabSelected.bind(this)} data-type='2' className={`btn ${isTab?'':'selectedBtn'}`}>{bandText}</View>
								</View>
								<ScrollView className='scrollview' scrollY scrollWithAnimation scrollTop='0'>
									<View className={`box ${isTab?'':'hide'}`}>
										<View className='freePiece'>
											<View className='bar'>
												<Text className='freeTitle'>{freeTitle}</Text>
												<Text className='freeTip'>{freeTip}</Text>
											</View>
											<View className='main'>
												{freePieceContent}
											</View>
										</View>
										<View className='propsPiece'>
											<View className='bar'>
												<Text className='propsTitle'>{propsTitle}</Text>
												<Text className='propsTip'>{propsTip}</Text>
											</View>
											<View className='main'>
												{propsPieceContent}
											</View>
										</View>
									</View>

									<View className={`box ${isTab?'hide':''}`}>
										乐队呀
									</View>
								</ScrollView>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}