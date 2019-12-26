import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text, Button } from '@tarojs/components'
import './entrance.scss'
import emitter from '../../service/events';

import { getStorage, onShareApp, showShareMenuItem } from '../../utils';
import { createWebSocket } from '../../service/createWebSocket'
import createVideoAd from '../../service/createVideoAd'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp()
export class PrizeEntrance extends Component {

	config: Config = {
		navigationBarTitleText: '大奖赛入口',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			// 路由
			routers:{
				queuePage: '/pages/prizeMatch/queue',
				indexPage: '/pages/index/index',
			},

			// 后台返回数据
			data:{
				isOpen:{
					type: 1,
					value: '开放时间：上午8:00-次日凌晨2:00',
				},
				quickenCardHelpResult:{
					overCount: 0,
					speedItemCount: 0,
					currSpeedItemCount: 0,
				},
			},

			// 前台数据
			local_data:{
				gameUserInfo:{
					roleId: -1,
					level: 1,
					imgurl: '',
					nickName: '',
					sex: '-1',  	// 默认性别空
					copper: 1234,	// 金币 
					redEnvelope: 0, // 红包
					energy: 0,		// 能量
				},
				ruleTitle: '赛事规则',
				directionsTitle: '说明',
				pendingText: '待领取：',
				surplusText:'剩余：',
				adsTip: '每局比赛自动使用一张加速卡',
				quickenTip: 'Tips: 邀请好友获取加速卡，减少每局答题总耗时。',
				checked: true,     // 默认勾选观看广告
				StayTunedImg: 'https://oss.snmgame.com/v1.0.0/StayTuned.png',
				tipImg: 'https://oss.snmgame.com/v1.0.0/prizeMatch_FreeBtnTip.png',
				freeBtn: 'https://oss.snmgame.com/v1.0.0/prizeMatch_FreeBtn.png',
				ticketsBtn: 'https://oss.snmgame.com/v1.0.0/prizeMatch_ticketsBtn.png',
				entranceBg: 'https://oss.snmgame.com/v1.0.0/prizeMatch_entranceBg.png',
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				quickenCardBg: 'https://oss.snmgame.com/v1.0.0/quickenCardBg.png',
				progress_item_blank: 'https://oss.snmgame.com/v1.0.0/progress_item_blank.png',
				progress_item: 'https://oss.snmgame.com/v1.0.0/progress_item.png',
				receiveBtn: 'https://oss.snmgame.com/v1.0.0/receiveBtn.png',
				inviteBtn: 'https://oss.snmgame.com/v1.0.0/inviteBtn.png',
			}

		}
		this.msgProto = new MsgProto();
	}
	componentWillMount () {
		let _this = this;

		// 创建激励视频
		this.videoAd= new createVideoAd();

		// 监听广告: 看完发2003，未看完不发
		this.videoAd.adGet((status)=>{ // status.isEnded: (1完整看完激励视频) - (0中途退出) 
			let checked = this.state.local_data.checked;
			let data = {
				type: 3,
				value:'',
				param1: '', // 扩展参数暂无用
				param2: -1, // int(如果类型是3，这个参数是是否使用加速卡<0.不使用;1.使用>
			}
			if(checked) {data.param2 = 1} else {data.param2 = 0};
			console.info('是否勾选加速卡 ===>', data.param2);
			let adsRewards = this.msgProto.adsRewards(data);
			let parentModule = this.msgProto.parentModule(adsRewards);

			if(status.isEnded){
				console.info('%c 看完广告，进入大奖赛','font-size:14px;color:#0fdb24;');
				this.websocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						// 允许进入匹配页 1302监测返回成功后跳转匹配页
					},
					fail(err) { console.info(err) }
				});
			}else{
				console.info('%c 未看完视频，不能进入大进入大奖赛呦','font-size:14px;color:#db2a0f;');
			}
		});

		// 监听1302: 是否允许进入匹配
		this.eventEmitter = emitter.once('enterMatch', (message) => {
			clearInterval(message[1]);
			let isreconnection = message[0]['data']['isreconnection'];
			let result = message[0]['data']['result'];
			let errormsg = message[0]['data']['errormsg'];
			if(result){
				// 跳转匹配页
				Taro.reLaunch({
					url: this.state.routers.queuePage,
					success(){
						Taro.showToast({
							title: '进入匹配队列',
							icon: 'none',
							duration: 2000,
						});
					},
					fail(err){
						Taro.showToast({
							title: '请退出重新匹配',
							mask: true,
							icon: 'none',
							duration: 2000,
						});
					}
				});
				
			}else{
				Taro.showToast({
					title: errormsg,
					icon: 'none',
					duration: 2000,
				});
				// 1s后返回主页
				let timer = setTimeout(()=>{
					Taro.navigateBack({
						delta: 1
					});
				},2000);
			}
		});

		// 监听 1440： 大奖赛开放结果 
		this.eventEmitter = emitter.once('getIsPrizeOpen', (message) => {
			clearInterval(message[1]);

			this.setState((preState)=>{
				preState.data.isOpen = message[0]['data'];
			})
		});

		// 监听 1506  好友助力加速卡结果
		this.eventEmitter = emitter.once('quickenCardHelpResult', (message) => {
			clearInterval(message[1]);

			this.setState((preState)=>{
				preState.data.quickenCardHelpResult = message[0]['data'];
			},()=>{
				console.info(_this.state.data.quickenCardHelpResult,190);
			});
		});
	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		// 显示分享
		showShareMenuItem();
		if(App.globalData.websocket === ''){
			console.info('%c prize-entrance 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.websocket = App.globalData.websocket;
		}

		// 设置门票 / 能量
		getStorage('gameUserInfo',(res)=>{
			_this.setState((preState)=>{
				preState.local_data.gameUserInfo = res;
			})
		});

		// 请求大奖赛开放状态
		let isOpenPrize = this.msgProto.isOpenPrize()
		let parentModule = this.msgProto.parentModule(isOpenPrize);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.info('%c 请求大奖赛开放状态Success','font-size:14px;color:#e66900;')},
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
				console.error('请求大奖赛开放状态失败==> ');console.info(err);
			}
		});

		// 请求邀请好友领取物品情况
		let quickenCardHelp = this.msgProto.quickenCardHelp()
		let parentModule_ = this.msgProto.parentModule(quickenCardHelp);
		this.websocket.sendWebSocketMsg({
			data: parentModule_,
			success(res) { console.info('%c 请求邀请好友领取物品情况Success','font-size:14px;color:#e66900;')},
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
				console.error('请求邀请好友领取物品情况失败==> ');console.info(err);
			}
		});
	}


	componentDidHide () {}

	watchAdsGetReward(e){
		this.videoAd.openVideoAd();
	}

	// 返回上一页
	goBack(){
		let indexPage = this.state.routers.indexPage;
		Taro.navigateTo({
			url: indexPage
		});
	}

	// 开始看广告 -> 免费入场
    freeAdmission(e){
		this.videoAd.openVideoAd();
	}

	// 门票入场 -> 付费入场
	payAdmission(e){
		let data = {type: 2,useSpeedItem: 1,};
		let matchingRequest = this.msgProto.matchingRequest(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.info('%c 门票入场大奖赛匹配ing','font-size:14px;color:#e66900;')},
			fail(err) {
				Taro.showToast({
					title: err.errormsg,
					icon: 'none',
					duration: 2000
				})
				console.error('匹配错误信息==> ');console.info(err);
			}
		});
	}

	// 更改勾选状态
	checkedChange(value){
        this.setState((preState) => {
            preState.local_data.checked = !value;
        },()=>{});
	}
	
	// 分享
	onShareAppMessage(res) {
		// 邀请者roleId
		let roleId = this.state.local_data.gameUserInfo.roleId;
		// 受邀请类型(1.组队;2.加速卡)
		let param1 = 2;
		let shareData = {
			title: '酸柠檬',
			path: '/pages/login/index',
			imageUrl: 'https://oss.snmgame.com/v1.0.0/shareImg.png',
			shareCallBack: (status)=>{},
		};
		// 按钮分享
		if(res.from === 'button' && roleId){
			console.info(' =====>按钮分享加速卡<=====');
			shareData.title = '迎接音乐大考验，组建Wuli梦想乐队！';
			shareData.path = `/pages/login/index?param1=${param1}&inviterRoleId=${roleId}`,
			shareData.imageUrl = 'https://oss.snmgame.com/v1.0.0/shareImg.png';
			shareData.shareCallBack = (status)=>{
				if(status.errMsg === "shareAppMessage:fail cancel"){
					Taro.showToast({
						title: '分享失败',
						icon: 'none',
						duration: 2000,
					})
				}else{
					Taro.showToast({
						title: '分享成功',
						icon: 'none',
						duration: 2000,
					})
				}
			}
		}else{ // 右上角分享App
			shareData.title = '明星、热点、八卦知多少？一试便知！';
			shareData.path = '/pages/login/index';
			shareData.imageUrl = 'https://oss.snmgame.com/v1.0.0/shareImg.png';
			shareData.shareCallBack = (status)=>{
				if(status.errMsg === "shareAppMessage:fail cancel"){
					Taro.showToast({
						title: '分享失败',
						icon: 'none',
						duration: 2000,
					})
				}else{
					Taro.showToast({
						title: '分享成功',
						icon: 'none',
						duration: 2000,
					})
				}
			}
		}
		return onShareApp(shareData);
	}

	render () {

		const { backBtn, entranceBg, ruleTitle, freeBtn, ticketsBtn, tipImg, adsTip, checked, 
			StayTunedImg, quickenCardBg, directionsTitle, pendingText, surplusText, quickenTip, progress_item_blank,
			inviteBtn, receiveBtn
		} = this.state.local_data;
		const {type, value} = this.state.data.isOpen;
		const {energy, redEnvelope} = this.state.local_data.gameUserInfo;

		return (
			<View className='entrance' catchtouchmove="ture">
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='backBtnBox'>
						<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />

						{/* 门票bar */}
						<View className='prizeMatchBar'>
							<View className='board-same board'></View>
							<View className='icon-same ticketsIcon' ></View>
							<Text className='num-same ticketsNum'>{redEnvelope}</Text>
							<View onClick={this.goPayTickets.bind(this)} className='addIcon-same addIcon' ></View>
						</View>

						{/* 能量bar */}
						<View className='energyBar'>
							<View className='board-same board'></View>
							<View className='energyIcon'></View>
							<Text className='num-same energyNum'>{energy}</Text>
						</View>
					</View>

					<View className='body'>
						<View className='Entrance'>
							<Image src={entranceBg} className='bg'/>
							<View className='title'>{ruleTitle}</View>
							<Image src={tipImg} className='tip'/>
							<View className='items'>
								<Image onClick={this.freeAdmission.bind(this)} src={freeBtn} className='btn freeBtn'/>
								<Image onClick={this.payAdmission.bind(this)} src={ticketsBtn} className='btn ticketsBtn'/>
							</View>
							<View className='seeAdsStatus'>
                                <RadioGroup className='checkBox'>
                                    <Label className='share_label' for='1' key='1'>
                                        <Radio className='radio_' value={adsTip} 
                                            onClick={this.checkedChange.bind(this,checked)} 
                                            checked={checked}>
                                            <View className='adsTip'>{adsTip}</View>
                                        </Radio>
                                    </Label>
                                </RadioGroup>
                            </View>
							<View className={`mask ${type?'hide':''}`}>{value}</View>
						</View>

						<View className='StayTuned'>
							<Image src={StayTunedImg} className='StayTunedImg' />
						</View>
					</View>

					<View className='foot'>
						<View className='quickenCard'>
							<Image src={quickenCardBg} className='quickenCardBg'/>
							<View className='title'>
								<View className='num'>
									{pendingText}<Text decode={true}>{'999'}&ensp;</Text>张 
									{surplusText}<Text decode={true}>{'999'}&ensp;</Text>张 
								</View>
								<View className='directions'>{directionsTitle}</View>
							</View>

							<View className='progress'>
								<View className='progress_list'>
									<Image src={progress_item_blank} className='progress_item'/>
									<Image src={progress_item_blank} className='progress_item'/>
									<Image src={progress_item_blank} className='progress_item'/>
								</View>
								<Button openType='share' >share</Button>
								<View className='progress_btn'>
									<Image src={inviteBtn} className='btn inviteBtn'/>
									<Image src={receiveBtn} className='btn receiveBtn'/>
								</View>
							</View>
							<View className='tips'>{quickenTip}</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}