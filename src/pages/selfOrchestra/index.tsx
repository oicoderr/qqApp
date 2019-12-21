import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image, Text } from '@tarojs/components'
import throttle from 'lodash/throttle'
import { createWebSocket } from '../../service/createWebSocket'
import './index.scss'
import GameLoading from '../../components/GameLoading'
import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class Login extends Component {
	config: Config = {
		navigationBarTitleText: '我的乐队',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);
		// 节流函数
		this.state = {
			data:{
				/*
					乐队基本数据
					type: (1.主唱;2.吉他手;3.贝斯手;4.鼓手)
				*/
				list: []
			},

			local_data:{
				isShowLoading: true,
				backBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/backBtn.png',
				orchestraTitleImg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/orchestraTitleImg.png',
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
	}

	componentWillMount () {}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;

		if(App.globalData.webSocket === ''){
			console.info('%c mall 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.webSocket = App.globalData.webSocket;
		}

		// 请求乐队基本信息
		let selfOrchestra = this.msgProto.selfOrchestra();
		let parentModule = this.msgProto.parentModule(selfOrchestra);
		this.webSocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.info('请求我的乐队基本信息Success')},
			fail(err){
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		});

		// 1602 服务器回复乐队基本数据
		this.eventEmitter = emitter.addListener('getSelfOrchestra', (message) => {
			clearInterval(message[1]);

			console.info('乐队基本信息:');
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
			if(list_[0]['type'] == 1){
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
			}else if(list_[0]['type'] == 2){ // 乐队类型 1主唱 2吉他手  3贝斯手 4鼓手
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
				console.info('%c 乐队各类 ===>', 'font-size: 14px; color:#1a71ff;');
				console.info(leadSinger, guitarist, bassist, drummer);
			}

		}catch(err){
			//在这里处理错误
			console.error('错误：' + err);
		}
		
	}

	render () {
		const { isShowLoading, orchestraTitleImg,  backBtn, propsText, bandText, freeTitle, freeTip, propsTitle, 
			propsTip, leadSingerTitle, guitaristTitle, bassistTitle, drummerTitle, isTab, rewardText, 
			energyIcon, ticketsIcon, goldIcon  } = this.state.local_data;

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
			<View className='selfOrchestra'>
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
								<Image src={orchestraTitleImg} className='backpackTitle' />
							</View>
							<View className='mallContent'>
								<ScrollView className='scrollview' scrollY scrollWithAnimation scrollTop='0'>
									<View className={`box`}>
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