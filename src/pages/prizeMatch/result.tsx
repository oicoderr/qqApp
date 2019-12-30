import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text, RadioGroup, Radio, Label  } from '@tarojs/components'
import emitter from '../../service/events'
import { setStorage, unitReplacement } from '../../utils';
import './result.scss'
import { createWebSocket } from '../../service/createWebSocket'
import { websocketUrl } from '../../service/config'
import GameLoading from '../../components/GameLoading'
import createVideoAd from '../../service/createVideoAd'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp()

export class PrizeReasult extends Component {

	config: Config = {
		navigationBarTitleText: '大奖赛结果',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {

			// 路由
			routers:{
				indexPage: '/pages/index/index',
				entrancePage: '/pages/prizeMatch/entrance',
			},

			// 后台返回数据
			data:{
				// 大奖赛结果页战报
				prizeMatchReport:{ 				
					endtime: 10,
					energy: 10,
					rank: 1,
					rankMsg: '看完战报就离开房间吧',
					speedtime: 1,
					successCount: 1,
					totaltime: 12,
				}
			},

			// 前台数据
			local_data:{
				isShowLoading: true,
				isShowRankResult: true,

				// 名次横幅
				firstBar: 'https://oss.snmgame.com/v1.0.0/firstBar.png',
				secondBar: 'https://oss.snmgame.com/v1.0.0/secondBar.png',
				thirdBar: 'https://oss.snmgame.com/v1.0.0/thirdBar.png',
				thanThreeBar: 'https://oss.snmgame.com/v1.0.0/4-10Bar.png',
				thanTenBar: 'https://oss.snmgame.com/v1.0.0/11Bar.png',
				confirmBtn: 'https://oss.snmgame.com/v1.0.0/confirmBtn.png',
				// 当前玩家名次
				gradeBar: 'https://oss.snmgame.com/v1.0.0/11Bar.png',
				getRewardTip: '奖励已存入当前账户',
				questionUnit: '题',
				timeUnit: '秒',
				energyIcon: 'https://oss.snmgame.com/v1.0.0/energyLittleIcon.png',
				adsTip: '观看短片，获取1张复活卡',
				checked:  true,
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
		const params = this.$router.params;
		console.log('%c 大奖赛结果页数据 ==>', 'font-size:14px;color:#1a98ff;');console.log(JSON.parse(params.item));
		if(params.item){
			const prizeMatchResult = JSON.parse(params.item);
			this.setState((preState)=>{
				preState.data.prizeMatchReport = prizeMatchResult;
				preState.local_data.isShowLoading = false; // 关闭加载动画
			},()=>{
				_this.ranking(prizeMatchResult.rank);
			});
		}else{
			Taro.showToast({
				title: '没有拿到结果页数据',
				icon: 'none',
				duration: 2000
			})
		}

		this.videoAd = new createVideoAd();

		// 下发视频监听事件
		this.videoAd.adGet((status)=>{ // status.isEnded: (1完整看完激励视频) - (0中途退出) 
			console.error('是否看完视频？' + status.isEnded);
			let entrancePage = this.state.routers.entrancePage;
			if(status.isEnded){
				console.log('%c 正常播放结束，领取复活卡','font-size:14px;color:#0fdb24;');
				let data_ = {
					type: 4,
					value: '',
					param1:'',
					param2: '',
				}
				let adsRewards = this.msgProto.adsRewards(data_);
				let parentModule = this.msgProto.parentModule(adsRewards);
				this.websocket.sendWebSocketMsg({
					data: parentModule,
					success(res) {
						Taro.showToast({
							title: '奖励领取成功',
							icon: 'none',
							mask: true,
							duration: 2000,
							success(){
								Taro.reLaunch({
									url: entrancePage
								})
							}
						});
					},
					fail(err) { console.log(err) }
				});
			}else{
				Taro.showToast({
					title: '观看完整视频可获取完整奖励',
					icon: 'none',
					duration: 2000,
					success(){
						Taro.reLaunch({
							url: entrancePage
						})
					}
				})
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

		// 1010 货币发生变化
		this.eventEmitter = emitter.addListener('currencyChange', (message) => {
			clearInterval(message[1]);
			console.error('收到1010货币发生变化, 排位赛结果观看广告->');console.log(message);
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

	// 显示名次横幅图片
	ranking(rank){
		const { firstBar, secondBar, thirdBar, thanThreeBar, thanTenBar } =  this.state.local_data;
		if(rank === 1){
			this.setState((preState)=>{
				preState.local_data.gradeBar = firstBar;
			})
		}else if(rank === 2){
			this.setState((preState)=>{
				preState.local_data.gradeBar = secondBar;
			})
		}else if(rank === 3){
			this.setState((preState)=>{
				preState.local_data.gradeBar = thirdBar;
			})
		}else if(rank > 3){
			this.setState((preState)=>{
				preState.local_data.gradeBar = thanThreeBar;
			})
		}else if(rank > 10){
			this.setState((preState)=>{
				preState.local_data.gradeBar = thanTenBar;
			})
		}else{
			this.setState((preState)=>{
				preState.local_data.gradeBar = thanTenBar;
			})
		}
    }

	// 返回主页
	goBack(){
		Taro.reLaunch({
			url: this.state.routers.indexPage
		});
	}

	// 重玩返回入口页面
	replay(){
		Taro.reLaunch({
			url: this.state.routers.entrancePage
		});
	}

	// 是否勾选观看广告
	adsStatusChange(isChecked){
		this.setState((preState)=>{
			preState.local_data.checked = !isChecked;
		});
	}

	playVideo(){
		let checked = this.state.local_data.checked;
		if(checked){
			this.videoAd.openVideoAd();
		}else{
			console.log('%c 未勾选观看广告','font-size:14px;color:#ff1aca;')
			let indexPage = this.state.routers.indexPage;
			Taro.reLaunch({
				url: indexPage
			})
		}
	}

	render () {
		const { isShowLoading, gradeBar, getRewardTip, questionUnit, timeUnit,
			energyIcon, confirmBtn, adsTip, checked } = this.state.local_data;

		const { endtime, energy, rank, rankMsg, speedtime, successCount} = this.state.data.prizeMatchReport;

		return (
			<View className='prizeMatchResult' catchtouchmove="ture">
				<View className={isShowLoading?'':'hide'} catchtouchmove="ture">
					< GameLoading />
				</View>

				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='main'>
							<View className='banner'>
								<Image src={gradeBar} className='bar' />
								<View className={`grade ${rank > 3?'':'hide'}`}>{'第'} {rank} {'名'}</View>
							</View>
							<View className='body'>
								<View className='wrap'>
									<View className='msg'>{rankMsg}</View>
									<View className='barBg successCount'>{'答对题数：'}{successCount} {questionUnit}</View>
									<View className='barBg speedtime'>{'加速卡：'}<Text>{speedtime != 0?-speedtime: '0'} {timeUnit}</Text></View>
									<View className='barBg endtime'>{'最终用时：'}{endtime} {timeUnit}</View>
									<View className='barBg energy'>
										{'获得奖励：'}
										<Text>{energy}</Text>
										<Image src={energyIcon} className='energyIcon' />
									</View>
									<View className='getRewardTip'>{getRewardTip}</View>
								</View>
							</View>
						</View>
						<View className='foot'>
							<Image onClick={this.playVideo.bind(this)} src={confirmBtn} className='confirmBtn' />
							<View className='seeAdsStatus'>
                                <RadioGroup className='checkBox'>
                                    <Label className='share_label' for='1' key='1'>
                                        <Radio className='radio_' value={adsTip} 
                                            onClick={this.adsStatusChange.bind(this,checked)} 
                                            checked={checked}>
                                            <View className='tip'>{adsTip}</View>
                                        </Radio>
                                    </Label>
                                </RadioGroup>
                            </View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}