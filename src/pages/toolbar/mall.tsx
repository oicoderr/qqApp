import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Image, Text } from '@tarojs/components'
import throttle from 'lodash/throttle'
import { setStorage, getStorage, unitReplacement } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import { websocketUrl } from '../../service/config'
import './mall.scss'
import GameLoading from '../../components/GameLoading'
import MessageToast from '../../components/MessageToast'
import createVideoAd from '../../service/createVideoAd'
import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class Mall extends Component {
	config: Config = {
		navigationBarTitleText: '商城',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);
		// 节流函数
		this.DBswitchTab = throttle(this.DBswitchTab, 1000);
		this.DBbuyProps = throttle(this.DBbuyProps, 1000);
		this.DBseeAdsGetProps = throttle(this.DBseeAdsGetProps, 1000);
		this.DBgetQuickenCard = throttle(this.DBgetQuickenCard, 1000);
		this.state = {
			routers:{
				indexPage: '/pages/index/index',
			},

			data:{
				/*
					商城信息
					consumType: (0.看广告;1.门票;2.金币;3.能量)
				*/
				list: [],
				gameDescription: [],
			},

			local_data:{
				isShowLoading: true,
				gameUserInfo: {},
				currencyChange: {
					copper: '1234',
					energy: '',
					redEnvelope: '',
				},
				isShowDirections: false,
				// 看广告领取免费道具卡id
				freeAdsId: '',
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				mallTitle: 'https://oss.snmgame.com/v1.0.0/mallTitle.png',
				energyIcon: 'https://oss.snmgame.com/v1.0.0/energyIcon.png',
				ticketsIcon: 'https://oss.snmgame.com/v1.0.0/ticketsIcon.png',
				goldIcon: 'https://oss.snmgame.com/v1.0.0/goldIconOnline.png',
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
				leadSingerTitle: '灵魂主唱',
				guitaristTitle: '劲爆吉他手',
				bassistTitle: '沉稳贝斯手',
				drummerTitle: '炸裂鼓手',
				unlockTip: '待解锁',
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

	componentWillMount () {
		// 创建激励视频
		this.videoAd= new createVideoAd();

		// 监听广告: 看完发2003，未看完不发
		this.videoAd.adGet((status)=>{ // status.isEnded: (1完整看完激励视频) - (0中途退出) 
			let data = {
				type: 5, 
				value:'',	
				param1: '', // 扩展参数暂无用
				param2: this.state.local_data.freeAdsId, // 免费道具模版id
			}
			let adsRewards = this.msgProto.adsRewards(data);
			let parentModule = this.msgProto.parentModule(adsRewards);

			if(status.isEnded){
				console.log('%c 看完广告，领取免费道具','font-size:14px;color:#0fdb24;');
				this.websocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {console.log(res) },
					fail(err) { console.log(err) }
				});
			}else{
				Taro.showToast({
					title: '领取失败',
					icon: 'none',
					duration: 1000
				});
				console.log('%c 未看完视频，不能领取免费道具哦','font-size:14px;color:#db2a0f;');
			}
		});
	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;

		if(App.globalData.websocket === ''){
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
			if(this.websocket.isLogin){
				console.log("%c 您已经登录了", 'background:#000;color:white;font-size:14px');
			}else{
				this.websocket.initWebSocket({
					url: websocketUrl,
					success(res){
						// 开始登陆
						_this.websocket.onSocketOpened((res)=>{});
						// 对外抛出websocket
						App.globalData.websocket = _this.websocket;
					},
					fail(err){
						createWebSocket(_this);
					}
				});
			}
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
			success(res) {console.log('请求商城信息Success')},
			fail(err){
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		});

		// 监听 1702 监听服务器回复商城当天已免费领取情况 
		this.eventEmitter = emitter.addListener('getMall', (message) => {
			clearInterval(message[1]);
			console.log('商城信息：');
			console.log(message[0]['data']);
			this.setState((preState)=>{
				preState.data.list = message[0]['data']['list'];
				preState.local_data.isShowLoading = false;
			});
			this.classification(message[0]['data']['list']);
		});

		// 监听 1010 货币发生变化
		this.eventEmitter = emitter.addListener('currencyChange', (message) => {
			console.error('mall 收到1010货币发生变化');console.log(message);
			clearInterval(message[1]);
			let currencyChange = message[0]['data'];
			this.setState((preState)=>{
				preState.local_data.currencyChange.copper = unitReplacement(currencyChange.copper);
				preState.local_data.currencyChange.energy = unitReplacement(currencyChange.energy);
				preState.local_data.currencyChange.redEnvelope = unitReplacement(currencyChange.redEnvelope);
			},()=>{
				setStorage('currencyChange',_this.state.local_data.currencyChange);
			});
			
		});

		// 监听 2402 玩法说明回复
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

		// 监听 子组件MessageToast 关闭弹窗消息 
		this.eventEmitter = emitter.addListener('closeMessageToast', (message) => {
			this.setState((preState)=>{
				preState.local_data.isShowDirections = false;
			})
		});
	}

	componentDidHide () {
		emitter.removeAllListeners('getMall');
		emitter.removeAllListeners('currencyChange');
		emitter.removeAllListeners('getGameDescription');
		emitter.removeAllListeners('closeMessageToast');
	}

	// 返回上一页
	goBack(){
		let indexPage = this.state.routers.indexPage;
		Taro.redirectTo({
			url: indexPage
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
				console.log('%c 乐队各类 ===>', 'font-size: 14px; color:#1a71ff;');
				console.log(leadSinger, guitarist, bassist, drummer);
			}

		}catch(err){
			//在这里处理错误
			console.error('错误：' + err);
		}
		
	}

	// tab 切换根据data-type：1 道具 2 乐队
	DBswitchTab (e){
		this.switchTab(e);

		this.setState((preState)=>{
			preState.local_data.isShowLoading = true;
		})
	}
	switchTab(e){
		let type = e.target.dataset.type;
		let getMall = this.msgProto.getMall(type);
		let parentModule = this.msgProto.parentModule(getMall);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.log(type==1?'请求道具商城信息Success':'请求乐队商城信息Success')},
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

	// 免费获取道具模版id
	DBseeAdsGetProps(e){
		this.seeAdsGetProps(e);
	}
	seeAdsGetProps(e){
		let _this = this;
		let id = e.currentTarget.dataset.id;
		let rewardCount = parseInt(e.currentTarget.dataset.rewardcount);

		if(rewardCount > 0){
			this.setState((preState)=>{
				preState.local_data.freeAdsId = id;
			},()=>{
				_this.videoAd.openVideoAd();
			})
		}else{
			Taro.showToast({
				title: '免费次数已用完',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// buyProps能量购买道具
	DBbuyProps(e){
		this.buyProps(e);
	}
	buyProps(e){
		let id = e.currentTarget.dataset.id;
		let data = {
			'id': id,
			// 暂单次单个购买
			'count': 1,
		}
		let buyProps = this.msgProto.buyProps(data);
		let parentModule = this.msgProto.parentModule(buyProps);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {console.log('请求购买道具Success')},
			fail(err){
				Taro.showToast({
					title: err.errMsg,
					icon: 'none',
					duration: 2000
				})
			}
		});
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

	render () {
		const { isShowLoading, mallTitle,  backBtn, propsText, bandText, freeTitle, freeTip, propsTitle, 
			propsTip, leadSingerTitle, guitaristTitle, bassistTitle, drummerTitle, isTab, rewardText, 
			energyIcon, ticketsIcon, goldIcon, isShowDirections, unlockTip } = this.state.local_data;
		
		const {copper, energy} = this.state.local_data.currencyChange
		// 道具
		const freePiece = this.state.local_data.freePiece;
		const propsPiece = this.state.local_data.propsPiece;
		const freePieceContent = freePiece.map((cur, index)=>{
			return  <View onClick={this.DBseeAdsGetProps.bind(this)} data-id={cur.id} data-rewardCount={cur.rewardCount} className={`item ${index%3== 1?'bothMargin':''}`}>
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
			return  <View onClick={this.DBbuyProps.bind(this)} data-id={cur.id} className={`item ${index%3== 1?'bothMargin':''}`}>
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
			return  <View onClick={this.DBbuyProps.bind(this)} data-isUnLock={cur.isUnLock} data-id={cur.id} data-rewardCount={cur.rewardCount} className={`item_ ${index%3== 1?'bothMargin':''}`}>
								<View className='cardBg_'>
									<Image src={cur.icon} className='cardImg_' />
									<View className={cur.isUnLock?'hide':'isunlock'}>
										<View className='unlockTip'>{unlockTip}</View>
									</View>
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
			return  <View onClick={this.DBbuyProps.bind(this)} data-isUnLock={cur.isUnLock} data-id={cur.id} data-rewardCount={cur.rewardCount} className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
							<View className={cur.isUnLock?'hide':'isunlock'}>
								<View className='unlockTip'>{unlockTip}</View>
							</View>
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
			return  <View onClick={this.DBbuyProps.bind(this)} data-isUnLock={cur.isUnLock} data-id={cur.id} data-rewardCount={cur.rewardCount} className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
							<View className={cur.isUnLock?'hide':'isunlock'}>
								<View className='unlockTip'>{unlockTip}</View>
							</View>
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
			return  <View onClick={this.DBbuyProps.bind(this)} data-isUnLock={cur.isUnLock} data-id={cur.id} data-rewardCount={cur.rewardCount} className={`item_ ${index%3== 1?'bothMargin':''}`}>
						<View className='cardBg_'>
							<Image src={cur.icon} className='cardImg_' />
							<View className={cur.isUnLock?'hide':'isunlock'}>
								<View className='unlockTip'>{unlockTip}</View>
							</View>
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
				<View className={`${isShowDirections?'':'hide'}`}>
					<MessageToast />
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
								<View className='energyWrap'>
									<Image src={energyIcon} className='energyIcon_' />
									<View className='num energyNum'>{energy}</View>
								</View>
							</View>
						</View>
						<View className='body'>
							<View className='backpackTitleWrap'>
								<Image src={mallTitle} className='backpackTitle' />
							</View>

							<View className='mallContent'>
								<View className='tab'>
									<View onClick={this.DBswitchTab.bind(this)} data-type='1' className={`btn ${isTab?'selectedBtn':''}`}>{propsText}</View>
									<View onClick={this.DBswitchTab.bind(this)} data-type='2' className={`btn ${isTab?'':'selectedBtn'}`}>{bandText}</View>
								</View>
								<ScrollView className='scrollview' scrollY scrollWithAnimation scrollTop='0'>
									<View className={`box ${isTab?'':'hide'}`}>
										<View className={`samePiece ${freePiece.length > 0?'':'hide'}`}>
											<View className='bar bar1'>
												<Text className='Title title1'>{freeTitle}</Text>
												<Text onClick={this.DBgetQuickenCard.bind(this)} data-type='4' className='Tip'>{freeTip}</Text>
											</View>
											<View className='main'>
												{freePieceContent}
											</View>
										</View>
										<View className={`samePiece ${propsPiece.length > 0?'':'hide'}`}>
											<View className='bar bar2'>
												<Text className='Title title2'>{propsTitle}</Text>
												<Text onClick={this.DBgetQuickenCard.bind(this)} data-type='5' className='Tip'>{propsTip}</Text>
											</View>
											<View className='main'>
												{propsPieceContent}
											</View>
										</View>
									</View>

									<View className={`box ${isTab?'hide':''}`}>
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
										<View className={`samePiece ${guitarist.length> 0?'':'hide'}`}>
											<View className='bar bar4'>
												<Text className='Title title4'>{guitaristTitle}</Text>
											</View>
											<View className='main'>
												{guitaristContent}
											</View>
										</View>
										{/* 贝斯手  */}
										<View className={`samePiece ${bassist.length> 0?'':'hide'}`}>
											<View className='bar bar6'>
												<Text className='Title title6'>{bassistTitle}</Text>
											</View>
											<View className='main'>
												{bassistContent}
											</View>
										</View>
										{/* 鼓手 */}
										<View className={`samePiece ${drummer.length> 0?'':'hide'}`}>
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