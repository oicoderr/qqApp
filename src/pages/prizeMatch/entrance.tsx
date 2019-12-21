import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import './entrance.scss'
import emitter from '../../service/events';

import { getStorage } from '../../utils';
import { createWebSocket } from '../../service/createWebSocket'
import createVideoAd from '../../service/createVideoAd'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp()
export class RankEntrance extends Component {

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
				StayTunedImg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/StayTuned.png',
				tipImg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/prizeMatch_FreeBtnTip.png',
				freeBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/prizeMatch_FreeBtn.png',
				ticketsBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/prizeMatch_ticketsBtn.png',
				entranceBg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/prizeMatch_entranceBg.png',
				backBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/backBtn.png',
				quickenCardBg: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/quickenCardBg.png',
				progress_item_blank: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/progress_item_blank.png',
				progress_item: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/progress_item.png',
				receiveBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/receiveBtn.png',
				inviteBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/inviteBtn.png',
			}

		}
		this.msgProto = new MsgProto();
	}
	componentWillMount () {
		let _this = this;

		// 创建激励视频
		this.videoAd= new createVideoAd();

		// 监测广告: 看完发2003，未看完不发
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
				this.webSocket.sendWebSocketMsg({
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

		// 监测1302: 是否允许进入匹配
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
	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		if(App.globalData.webSocket === ''){
			console.info('%c prize-entrance 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.webSocket = App.globalData.webSocket;
		}

		// 设置门票 / 能量
		getStorage('gameUserInfo',(res)=>{
			_this.setState((preState)=>{
				preState.local_data.gameUserInfo = res;
			})
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
		this.webSocket.sendWebSocketMsg({
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

	render () {

		const { backBtn, entranceBg, ruleTitle, freeBtn, ticketsBtn, tipImg, adsTip, checked, 
			StayTunedImg, quickenCardBg, directionsTitle, pendingText, surplusText, quickenTip, progress_item_blank,
			progress_item, inviteBtn, receiveBtn
		} = this.state.local_data;
		
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