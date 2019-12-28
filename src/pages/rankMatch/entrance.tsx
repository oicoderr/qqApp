import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import './entrance.scss'
import emitter from '../../service/events';
import { getStorage, setStorage, unitReplacement } from '../../utils';
import { createWebSocket } from '../../service/createWebSocket'
import createVideoAd from '../../service/createVideoAd'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp()
export class RankEntrance extends Component {

	config: Config = {
		navigationBarTitleText: '排位赛入口',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			// 路由
			routers:{
				queuePage: '/pages/rankMatch/queue',
				indexPage: '/pages/index/index',
			},

			// 后台返回数据
			data:{
				gameUserInfo:{
					season: 1,				 // 第几赛季
					danDescIcon: 'https://oss.snmgame.com/v1.0.0/1levelTitle.png', 	   // 段位描述	
					segmentTitle: '国际巨星', // 段位称号
					segmentTitleUrl: 'https://oss.snmgame.com/v1.0.0/seasonTitle.png', // 当前赛季标示 
					gloryUrl:'https://oss.snmgame.com/v1.0.0/glory.png', 			   // 荣耀img	
					haveStar: 1,			 // 拥有星星			
					totalStar: 6,    		 // 总计星星
					dan: 1,					 // 当前段位
				}
			},

			// 前台数据
			local_data:{
				// 镂空星
				blankStar: 'https://oss.snmgame.com/v1.0.0/blankStar.png',
				// 发光星
				shineStar: 'https://oss.snmgame.com/v1.0.0/shineStar.png',
				// 蓝色小背景
				littileBg: 'https://oss.snmgame.com/v1.0.0/littile-bg.png',
				// 单排按钮
				rankAloneBtn: 'https://oss.snmgame.com/v1.0.0/rank-onlone-beginBtn.png',
				// 组排按钮
				rankTeamBtn: 'https://oss.snmgame.com/v1.0.0/rank-team-beginBtn.png',
				// 观看广告按钮
				watchAdsBtn: 'https://oss.snmgame.com/v1.0.0/watchAdsBtn.png',
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				rewardTip: '每天限领10次',
				// 货币
				currencyChange:{
					energy: 0,
					copper: 1234,
					redEnvelope: 0,
				},
			}
		}
		this.msgProto = new MsgProto();
	}
	componentWillMount () {
		let _this = this;
		this.videoAd= new createVideoAd();

		// （结束奖励）改为在排位赛入口页面显示的奖励btn, 看完发2003，没看完发1325，
		this.videoAd.adGet((status)=>{ // status.isEnded: (1完整看完激励视频) - (0中途退出) 
			let data = {
				value: '',
			}
			let data_= {
				type: 2,
				value: '',
				param1:'',
				param2: '', // int(如果类型是3，这个参数是是否使用加速卡<0.不使用;1.使用>
			}
			let isSeeAds = this.msgProto.adsRewards(data);
			let parentModule = this.msgProto.parentModule(isSeeAds);
			let adsRewards = this.msgProto.adsRewards(data_);
			let parentModule_ = this.msgProto.parentModule(adsRewards);
			if(status.isEnded){
				console.log('%c 正常播放结束，下发奖励','font-size:14px;color:#0fdb24;');
				this.websocket.sendWebSocketMsg({
					data: parentModule_,
					success(res) {
						Taro.showToast({
							title: ' 成功获取奖励',
							icon: 'none',
							mask: true,
							duration: 2000
						});
						// 关闭结果页Ui
						_this.setState((preState)=>{
							preState.local_data.isShowRankResult = false;
						},()=>{});
					},
					fail(err) { console.log(err) }
				});
				
			}else{
				console.log('%c 未看完视频，没有奖励啦','font-size:14px;color:#db2a0f;');
				this.websocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						Taro.showToast({
							title: '未获得结束奖励',
							icon: 'none',
							mask: true,
							duration: 2000
						});
						// 关闭结果页Ui
						_this.setState((preState)=>{
							preState.local_data.isShowRankResult = false;
						},()=>{});
					},
					fail(err) { console.log(err) }
				});
			}
		});
	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		if(App.globalData.websocket === ''){
			console.log('%c rankMatch-entrance 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}

		// 设置玩家基本信息UI显示
		console.info()
		getStorage('gameUserInfo',(res)=>{
			this.setState((preState)=>{
				preState.data.gameUserInfo = res;
			},()=>{
				console.info('设置成功gameUserInfo', _this.state.data.gameUserInfo)
			})
		});

		// 1010 货币发生变化
		this.eventEmitter = emitter.addListener('currencyChange', (message) => {
			clearInterval(message[1]);
			console.error('收到1010货币发生变化,排位赛入口页面观看广告->');console.log(message);
			let currencyChange = message[0]['data'];
			this.setState((preState)=>{
				preState.local_data.currencyChange.copper = unitReplacement(currencyChange.copper);
				preState.local_data.currencyChange.energy = unitReplacement(currencyChange.energy);
				preState.local_data.currencyChange.redEnvelope = unitReplacement(currencyChange.redEnvelope);
			},()=>{
				setStorage('currencyChange',_this.state.local_data.currencyChange);
			});
		});
	}


	componentDidHide () {
		emitter.removeAllListeners('currencyChange');
	}
	
	// 计算拥有多少星转数组
	sumHasStar(len){
		let con = [];
		for (let i = 0; i < len; i ++){
			con.push(i);
		}
		return con;
	}

	// 跳转匹配页
	goMatchRank(){
		console.log('～跳转匹配～');
		let queuePage = this.state.routers.queuePage;
		Taro.navigateTo({
			url: queuePage
		})
	}

	// 获取奖励
	watchAdsGetReward(e){
		// 开始播放激励视频
		this.videoAd.openVideoAd();
	}

	// 返回上一页
	goBack(){
		let indexPage = this.state.routers.indexPage;
		Taro.navigateTo({
			url: indexPage
		});
	}

	render () {
		const { dan, totalStar, haveStar, danDescIcon, gloryUrl, segmentTitleUrl } = this.state.data.gameUserInfo;
		const { blankStar, shineStar, littileBg, rankAloneBtn,  rankTeamBtn, watchAdsBtn, rewardTip, backBtn} = this.state.local_data;

		// <==================  星星  ==================>
		const starPosi = ['fisrtPosi','secondePosi', 'thirdPosi', 'fouthPosi', 'fifthPosi', 'sixthPosi', 'seventhPosi','eighthPosi'];
		let totalStarArr = [], haveStarArr = this.sumHasStar(haveStar), contentTotalStar, contentHaveStar;
		if(totalStar === 4){
			contentHaveStar = haveStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index+2]} zIndexTop ${haveStar > 0?'':'hide'}`} >
							<Image src={shineStar} className='shineStar' />
						</View>
			});
			totalStarArr = [0,1,2,3];
			contentTotalStar = totalStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index+2]} `} >
							<Image src={blankStar} className='blankStar' />
						</View>
			});
		}else if(totalStar === 6){
			contentHaveStar = haveStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index+1]} zIndexTop ${haveStar > 0?'':'hide'}`} >
							<Image src={shineStar} className='shineStar' />
						</View>
			});
			totalStarArr = [0,1,2,3,4,5];
			contentTotalStar = totalStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index+1]} `} >
							<Image src={blankStar} className='blankStar' />
						</View>
			});
		}else if(totalStar === 8){
			contentHaveStar = haveStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index]} zIndexTop ${haveStar > 0?'':'hide'}`} >
							<Image src={shineStar} className='shineStar' />
						</View>
			});
			totalStarArr = [0,1,2,3,4,5,6,7];
			contentTotalStar = totalStarArr.map((currentValue, index) => {
				return  <View className={`starPosi ${starPosi[index]} `} >
							<Image src={blankStar} className='blankStar' />
						</View>
			});
		}
		// <==================  星星  ==================>

		return (
			<View className='entrance' catchtouchmove="ture">
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='backBtnBox'>
						<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
					</View>

					<View className='body'>
						<View className='title'>
							<Image src={segmentTitleUrl} className='titleImg' />
						</View>
						<View className='content'>
							<Image src={littileBg} className='littleBg' />
							<Image src={gloryUrl} className='gloryImg' />
							<Image src={danDescIcon} className='segmentTitleImg' />
							<View className={`stars ${dan < 8?'':'hide'}`}>
                                {contentTotalStar}
                                {contentHaveStar}
							</View>
                            {/*   超过第8段位，星星展示 x50 */}
                            <View className={`stars ${dan > 7?'':'hide'}`}> 
                                <View className='moreStarWrap'>
                                    <Image src={shineStar} className='moreShineStar' />
                                    <View className='moreNum'>x{haveStar}</View>
                                </View>
                            </View>
						</View>
						<View className='btns'>
							<Image onClick={this.goMatchRank.bind(this)} src={rankAloneBtn} className='rankBtn rankAloneBtn' />
							<Image src={rankTeamBtn} className='rankBtn rankTeamBtn' />
						</View>
						<View className='rewardTip'>{rewardTip}</View>
						<View onClick={this.watchAdsGetReward.bind(this)} className='watchAdsGetReward'>
							<Image src={watchAdsBtn} className='watchAdsBtn'/>
							<Text className='gold'>{'100'}金币</Text>
						</View>
					</View>
				</View>
			</View>
		)
	}
}