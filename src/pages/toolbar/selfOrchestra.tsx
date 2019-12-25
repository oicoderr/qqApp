import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image, Text } from '@tarojs/components'
import throttle from 'lodash/throttle'
import { createWebSocket } from '../../service/createWebSocket'
import './selfOrchestra.scss'
import GameLoading from '../../components/GameLoading'
import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class SelfOrchestra extends Component {
	config: Config = {
		navigationBarTitleText: '我的乐队',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);
		// 节流函数
		this.DBreplaceOrchestra = throttle(this.DBreplaceOrchestra, 1000);
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
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				orchestraTitleImg: 'https://oss.snmgame.com/v1.0.0/orchestraTitleImg.png',
				usingPrompt: 'https://oss.snmgame.com/v1.0.0/usingBtn.png',
				replaceBtn: 'https://oss.snmgame.com/v1.0.0/replaceBtn.png',
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

		if(App.globalData.websocket === ''){
			console.info('%c mall 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}

		// 请求乐队基本信息
		let selfOrchestra = this.msgProto.selfOrchestra();
		let parentModule = this.msgProto.parentModule(selfOrchestra);
		this.websocket.sendWebSocketMsg({
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
			// 乐队人物类型 1主唱 2吉他手  3贝斯手 4鼓手
			let leadSinger = [], guitarist = [], bassist = [], drummer = [];
			list_.map((cur,index)=>{
				switch(cur.type){
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
		}catch(err){
			//在这里处理错误
			console.error('错误：' + err);
		}
		
	}

	// 替换主页乐队显示
	DBreplaceOrchestra(e){
		this.replaceOrchestra(e);
	}

	replaceOrchestra(e){
		let id = e.currentTarget.dataset.id;
		if( id!= -1){
			let usedOrchestra = this.msgProto.usedOrchestra(id);
			let parentModule = this.msgProto.parentModule(usedOrchestra);
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) {console.info('请求`使用乐队主页显示`Success')},
				fail(err){
					Taro.showToast({
						title: err.errMsg,
						icon: 'none',
						duration: 2000
					})
				}
			});
		}
	}

	render () {
		const { isShowLoading, orchestraTitleImg,  backBtn, usingPrompt, replaceBtn,
			leadSingerTitle, guitaristTitle, bassistTitle, drummerTitle } = this.state.local_data;

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
						
						<View onClick={this.DBreplaceOrchestra.bind(this)} data-id={!cur.status?cur.id:'-1'} className='btn'>
							<Image src={cur.status?usingPrompt:replaceBtn} className='btnImg' />
						</View>
					</View>
		});
		const guitaristContent = guitarist.map((cur, index)=>{
			return  <View className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
						</View>
						<View className='name name_'>{cur.name}*{cur.count}</View>
						
						<View onClick={this.DBreplaceOrchestra.bind(this)} data-id={!cur.status?cur.id:'-1'} className='btn'>
							<Image src={cur.status?usingPrompt:replaceBtn} className='btnImg' />
						</View>
					</View>
		});
		const bassistContent = bassist.map((cur, index)=>{
			return  <View className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
						</View>
						<View className='name name_'>{cur.name}*{cur.count}</View>
						
						<View onClick={this.DBreplaceOrchestra.bind(this)} data-id={!cur.status?cur.id:'-1'} className='btn'>
							<Image src={cur.status?usingPrompt:replaceBtn} className='btnImg' />
						</View>
					</View>
		});
		const drummerContent = drummer.map((cur, index)=>{
			return  <View className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
						</View>
						<View className='name name_'>{cur.name}*{cur.count}</View>
						
						<View onClick={this.DBreplaceOrchestra.bind(this)} data-id={!cur.status?cur.id:'-1'} className='btn'>
							<Image src={cur.status?usingPrompt:replaceBtn} className='btnImg' />
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
										<View className={`samePiece ${leadSinger.length > 0?'':'hide'}`}>
											<View className='bar bar3'>
												<Text className='Title title3'>{leadSingerTitle}</Text>
											</View>
											<View className='main'>
												{leadSingerContent}
											</View>
										</View>
										{/* 吉他手 */}
										<View className={`samePiece ${guitarist.length > 0?'':'hide'}`}>
											<View className='bar bar4'>
												<Text className='Title title4'>{guitaristTitle}</Text>
											</View>
											<View className='main'>
												{guitaristContent}
											</View>
										</View>
										{/* 贝斯手  */}
										<View className={`samePiece ${bassist.length > 0?'':'hide'}`}>
											<View className='bar bar6'>
												<Text className='Title title6'>{bassistTitle}</Text>
											</View>
											<View className='main'>
												{bassistContent}
											</View>
										</View>
										{/* 鼓手 */}
										<View className={`samePiece ${drummer.length > 0?'':'hide'}`}>
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