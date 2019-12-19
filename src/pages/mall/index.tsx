import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image, Text } from '@tarojs/components'
import { debounce, throttle} from 'lodash'
import { setStorage, getStorage } from '../../utils'
import './index.scss'
import GameLoading from '../../components/GameLoading'

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
		// 节流函数
		this.switchTab = throttle(this.switchTab, 1000);
		this.state = {
			data:{
				// 商城信息
				/*
					consumType: (0.看广告;1.门票;2.金币;3.能量)
				*/
				list: []
			},

			local_data:{
				isShowLoading: true,
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
				leadSingerTitle: '主唱',
				guitaristTitle: '吉他手',
				bassistTitle: '贝斯手',
				drummerTitle: '鼓手',
				// 主唱
				leadSinger:[],
				// 吉他手
				guitarist: [],
				// 鼓手
				drummer: [],
				// 贝斯手
				bassist: [],
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
		// 请求商城信息, 默认请求道具商城
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
				preState.local_data.isShowLoading = false;
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

	// list分类： 
	classification(list){
		let list_ = JSON.parse(JSON.stringify(list));
		try{
			// 道具类型
			if(list_[0]['tType'] == 1){
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
			}else if(list_[0]['tType'] == 2){ // 乐队类型 1主唱 2吉他手  3贝斯手 4鼓手
				let leadSinger = [], guitarist = [], bassist = [], drummer = [];
				list_.map((cur,index)=>{
					switch(cur.musicIndex){
						case 1:
							leadSinger.push(cur);
							break;
						case 2:
							guitarist.push(cur);
							break;
						case 3:
							bassist.push(cur);
							break;
						case 4:
							drummer.push(cur);
							break;
					}
				});
				this.setState((preState)=>{
					preState.local_data.leadSinger = leadSinger;
					preState.local_data.guitarist = guitarist;
					preState.local_data.bassist = bassist;
					preState.local_data.drummer = drummer;
				});
				console.info('乐队各类 ===>', 'font-size: 14px; color:#1a71ff;');
				console.info(leadSinger, guitarist, bassist, drummer);
			}

		}catch(err){
			//在这里处理错误
			console.error('错误：' + err);
		}
		
	}

	// tab 切换根据data-type：1 道具 2 乐队
	tabSelected (e){
		this.switchTab(e);

		this.setState((preState)=>{
			preState.local_data.isShowLoading = true;
		})
	}

	switchTab = (e) =>{
		let type = e.target.dataset.type;
		let getMall = this.msgProto.getMall(type);
		let parentModule = this.msgProto.parentModule(getMall);
		this.webSocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.info(type==1?'请求道具商城信息Success':'请求乐队商城信息Success')},
			fail(err){
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
		if(type == 1){
			this.setState((preState)=>{
				preState.local_data.isTab = true;
			})
		}else if(type == 2){
			this.setState((preState)=>{
				preState.local_data.isTab = false;
			})
		}

		this.setState((preState)=>{
			preState.local_data.isShowLoading = false;
		})
	}

	// 获取道具模版id
	seeAdsGetProps(e){
		let id = e.currentTarget.dataset.id;

	}


	render () {
		const { isShowLoading, mallTitle, backBtn, propsText, bandText, freeTitle, freeTip, propsTitle, 
			propsTip, leadSingerTitle, guitaristTitle, bassistTitle, drummerTitle, isTab, rewardText, energyIcon, ticketsIcon, goldIcon  } = this.state.local_data;
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
		const leadSinger = this.state.local_data.leadSinger;
		const guitarist = this.state.local_data.guitarist;
		const bassist = this.state.local_data.bassist;
		const drummer = this.state.local_data.drummer;
		const leadSingerContent = leadSinger.map((cur, index)=>{
			return  <View className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
						</View>
						<View className='name name_'>{cur.name}*{cur.count}</View>
						
						<View className='consumCountWrap'>
							<Image src={`${cur.consumType==1?ticketsIcon:''}`} className= {`icon ticketsIcon ${cur.consumType==1?'':'hide'}`} />
							<Image src={`${cur.consumType==2?goldIcon:''}`} className={`icon goldIcon ${cur.consumType==2?'':'hide'}`} />
							<Image src={`${cur.consumType==3?energyIcon:''}`} className={`icon energyIcon ${cur.consumType==3?'':'hide'}`} />
							<View className='consumCount'>{cur.consumCount}</View>
						</View>
					</View>
		});
		const guitaristContent = guitarist.map((cur, index)=>{
			return  <View className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
						</View>
						<View className='name name_'>{cur.name}*{cur.count}</View>
						
						<View className='consumCountWrap'>
							<Image src={`${cur.consumType==1?ticketsIcon:''}`} className= {`icon ticketsIcon ${cur.consumType==1?'':'hide'}`} />
							<Image src={`${cur.consumType==2?goldIcon:''}`} className={`icon goldIcon ${cur.consumType==2?'':'hide'}`} />
							<Image src={`${cur.consumType==3?energyIcon:''}`} className={`icon energyIcon ${cur.consumType==3?'':'hide'}`} />
							<View className='consumCount'>{cur.consumCount}</View>
						</View>
					</View>
		});
		const bassistContent = bassist.map((cur, index)=>{
			return  <View className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
						</View>
						<View className='name name_'>{cur.name}*{cur.count}</View>
						
						<View className='consumCountWrap'>
							<Image src={`${cur.consumType==1?ticketsIcon:''}`} className= {`icon ticketsIcon ${cur.consumType==1?'':'hide'}`} />
							<Image src={`${cur.consumType==2?goldIcon:''}`} className={`icon goldIcon ${cur.consumType==2?'':'hide'}`} />
							<Image src={`${cur.consumType==3?energyIcon:''}`} className={`icon energyIcon ${cur.consumType==3?'':'hide'}`} />
							<View className='consumCount'>{cur.consumCount}</View>
						</View>
					</View>
		});
		const drummerContent = drummer.map((cur, index)=>{
			return  <View className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
						</View>
						<View className='name name_'>{cur.name}*{cur.count}</View>
						
						<View className='consumCountWrap'>
							<Image src={`${cur.consumType==1?ticketsIcon:''}`} className= {`icon ticketsIcon ${cur.consumType==1?'':'hide'}`} />
							<Image src={`${cur.consumType==2?goldIcon:''}`} className={`icon goldIcon ${cur.consumType==2?'':'hide'}`} />
							<Image src={`${cur.consumType==3?energyIcon:''}`} className={`icon energyIcon ${cur.consumType==3?'':'hide'}`} />
							<View className='consumCount'>{cur.consumCount}</View>
						</View>
					</View>
		});

		return (
			<View className='mall'>
				<View className={`${isShowLoading?'':'hide'}`}>
					< GameLoading />
				</View>
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
										<View className='samePiece'>
											<View className='bar bar1'>
												<Text className='Title title1'>{freeTitle}</Text>
												<Text className='Tip'>{freeTip}</Text>
											</View>
											<View className='main'>
												{freePieceContent}
											</View>
										</View>
										<View className='samePiece'>
											<View className='bar bar2'>
												<Text className='Title title2'>{propsTitle}</Text>
												<Text className='Tip'>{propsTip}</Text>
											</View>
											<View className='main'>
												{propsPieceContent}
											</View>
										</View>
									</View>

									<View className={`box ${isTab?'hide':''}`}>
										{/* 主唱 */}
										<View className='samePiece'>
											<View className='bar bar3'>
												<Text className='Title title3'>{leadSingerTitle}</Text>
											</View>
											<View className='main'>
												{leadSingerContent}
											</View>
										</View>
										{/* 吉他手 */}
										<View className='samePiece'>
											<View className='bar bar4'>
												<Text className='Title title4'>{guitaristTitle}</Text>
											</View>
											<View className='main'>
												{guitaristContent}
											</View>
										</View>
										{/* 贝斯手  */}
										<View className='samePiece'>
											<View className='bar bar6'>
												<Text className='Title title6'>{bassistTitle}</Text>
											</View>
											<View className='main'>
												{bassistContent}
											</View>
										</View>
										{/* 鼓手 */}
										<View className='samePiece'>
											<View className='bar bar5'>
												<Text className='Title title5'>{drummerTitle}</Text>
											</View>
											<View className='main'>
												{drummerContent}
											</View>
										</View>
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