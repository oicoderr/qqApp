import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import GameLoading from '../../components/GameLoading'
import { getStorage, buildURL, getCurrentTime } from '../../utils'
import './enterGame.scss'
import emitter from '../../service/events'
import { websocketUrl } from '../../service/config'
import MsgProto from '../../service/msgProto'
import Websocket from '../../service/webSocket'
import ReceiveMsg from '../../service/receivedMsg'

const App = Taro.getApp()

export class enterGame extends Component {

	config: Config = {
		navigationBarTitleText: '大奖赛游戏开始',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			// 路由
			routers:{
				resultPage: '/pages/prizeMatch/result',
			},
			// 后台返回数据
			data:{
				timer:'', 				// 计时器
				time: '10',				// 倒计时
				curQuestion: {},		// 当前题
				preQuestionInfo:{		// 上一题回答基本信息
					answerErrorCount: '',
					lastQuestId: '',
					list: [],
					optionId: '',
					waitreceivetime: 3,
				},		
			},

			// 前台数据
			local_data:{
				dieOutText: '已淘汰：',
				surplusText: '剩余人数：',
				countdownPrizeMatch: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/countdownPrizeMatch.png',
				defultClass: '',	   	// 选项上层默认样式class 
				defultBottomClass: '', 	// 选项下层默认样式class
				isShowMask: false,		// 默认不显示遮罩
				isShowLoading: false,	// 默认显示加载动画
				curQuestion: {			// 当前题
					currCount: 30,
					dieCount: 0,		// 已淘汰人数
					receiveCount: 0,	// 复活人数
					currContent: '',	// 当前题文案
					currIndex: 0,	
					time: 10,
					totalCount:'',
					list:[ 0, 0, 0, 0 ],
				},
				selectedOptionIndex: -1,// 当前题index
				selectedOptionId: '',	// 所选题optionId
				preQuestionInfo: {		// 上一题回答基本信息
					answerErrorCount: '',
					lastQuestId: '',
					list: [],
					optionId: '',
					waitreceivetime: 3,
				},	
				prizeMatchUserInfo:{},	// 大奖赛个人信息
				unit: '人',
				dieInfo:{
					toastTitle: '哎呦，答错了',
					toastContent: '我觉得我还可以再抢救一下！',
					toastBtn1: '算了',
					toastBtn2: '复活',
					toastUnit: '秒',
				},
				isShowToast: false,		// 是否显示复活toast
			}
		}
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		this.getPrizeMatchUserInfo();
		// 设置总人数
		const params = this.$router.params;
		console.info('收到总参赛人数 ==>');console.info(params);
		let count = params.countPeople;
		if(count){
			this.setState((preState)=>{
				preState.local_data.curQuestion.currCount = count;
			})
		}
	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;

		// 判断是否已经创建了wss请求
		if(App.globalData.webSocket === ''){
			this.webSocket.sendWebSocketMsg({//不管wss请求是否关闭，都会发送消息，如果发送失败说明没有ws请求
				data: 'ws alive test',
				success(data) {
					Taro.showToast({
						title: 'wss is ok',
						mask: true,
						icon: 'none',
						duration: 2000,
					})
				},
				fail(err) {
					console.info('可以重连了:' + err.errMsg, 'color: red; font-size:14px;');
					
					_this.createSocket();
				}
			})
		}

		// 隐藏答题遮罩
		this.setState((preState)=>{
			preState.local_data.isShowMask = false;
		},()=>{
			// console.info('%c' + this.state.local_data.isShowMask,'font-size:20px; color:pink;');
		});

		// 1306 服务器广播当前题
		this.eventEmitter = emitter.addListener('getQuestion', (message) => {
			clearInterval(message[1]);
			console.info('%c 1306发题了: ' + getCurrentTime(), 'font-size:14px;color:#1a4dff;');console.info(message[0]['data']);
			let time = message[0]['data']['time'];
			clearInterval(this.state.data.timer);
			// 取消所有选中样式
			this.setState((preState)=>{
				preState.data.curQuestion = message[0]['data'];
				preState.local_data.curQuestion = this.resetQA(message[0]['data']);
				preState.local_data.curQuestion.correctOption = -1;
				preState.local_data.selectedOptionIndex = -1;
				// 隐藏答错人数提示
				preState.local_data.curQuestion.answerErrorCount = 0;
				// 隐藏答复活人数提示
				preState.local_data.curQuestion.receiveCount = 0;
			},()=>{	/*console.info(_this.state.local_data.curQuestion);*/ });
			// 开始倒计时
			this.getCountdown(time);
			// 发题后关闭加载动画
			this.setState((preState)=>{
				preState.local_data.isShowLoading = false;
			})
		});

		// 1308 接受答案通知
		this.eventEmitter = emitter.addListener('getAnswer', (message) => {
			clearInterval(message[1]);
			console.info('%c 已接受到答案', 'color:#1a9cff; font-size:14px;');
			console.info(message[0]['data']);
		});

		// 1312 服务器广播上道题的统计
		this.eventEmitter = emitter.addListener('getPrizePrevQAInfo', (message) => {
			clearInterval(message[1]);			
			console.info('%c 服务器广播上一题统计 ====>','color:#ff9d1a;font-size:14px;');console.info(message[0]);
			this.setState((preState)=>{
				preState.data.preQuestionInfo = message[0]['data'];
				preState.local_data.preQuestionInfo = JSON.parse(JSON.stringify(message[0]['data']));
				// 上一题quesId
				preState.local_data.curQuestion['lastQuestId'] = JSON.parse(JSON.stringify(message[0]['data']['lastQuestId']));
				// 复活时间
				preState.local_data.curQuestion['waitreceivetime'] = JSON.parse(JSON.stringify(message[0]['data']['waitreceivetime']));
				// 在curQuestion中添加正确答案
				preState.local_data.curQuestion['correctOption'] = JSON.parse(JSON.stringify(message[0]['data']['optionId']));
				// 添加各答案答对/打错人数
				preState.local_data.curQuestion['answerErrorCount'] = JSON.parse(JSON.stringify(message[0]['data']['answerErrorCount']));
				preState.local_data.curQuestion['list'] = JSON.parse(JSON.stringify(message[0]['data']['list']));
				// 清除选中样式
				preState.local_data.curQuestion.correctOption = -1;
				preState.local_data.selectedOptionIndex = -1;
			},()=>{
				console.info('%c 最终的curQuestion =====>', 'font-size:14px;color:#1ae3ff;')
				console.info(_this.state.local_data.curQuestion);
				let optionId = _this.state.local_data.preQuestionInfo.optionId;
				let selectedOptionId = _this.state.local_data.selectedOptionId;
				// 自己是否选择正确答案
				if(optionId == selectedOptionId){

				}else{	// 提示`是否复活`
					// 复活倒计时开始
					let time = _this.state.local_data.curQuestion.waitreceivetime;
					_this.resurrectionCountdown(time,()=>{
						// 倒计时结束1.关闭弹窗
						_this.setState((preState)=>{
							preState.local_data.isShowToast = false;
						},()=>{})
					});
					// 显示是否弹窗
					_this.isResurrection();
				}
			})
		});

		// 1314 获取复活结果 
		this.eventEmitter = emitter.addListener('getResurrectResult', (message) => {
			clearInterval(message[1]);			
			console.info('%c 是否复活成功 ====>','color:#ff9d1a;font-size:14px;');console.info(message[0]);
			let isSuccess = message[0]['data']['value'];
			if(isSuccess){
				this.setState((preState)=>{
					preState.local_data.isShowToast = false;
				},()=>{
					Taro.showToast({
						title: '成功复活',
						icon: 'none',
						mask: false,
						duration: 1000
					})
					console.info('%c ～复活成功～可以继续答题了','font-size:14px;color:#ff1ac9;')
				})
			}else{
				Taro.showToast({
					title: '复活失败(时间到了)',
					icon: 'none',
					mask: false,
					duration: 1000,
				})
			}
		});

		// 1318 发送战报(看完战报就离开房间吧)
		this.eventEmitter = emitter.once('getPrizeMatchReport', (message) => {
			clearInterval(message[1]);			
			console.info('%c 服务器广播战报 ====>','color:#ff9d1a;font-size:14px;');console.info(message[0]);
			// 取消所有选中样式
			this.setState((preState)=>{
				preState.local_data.curQuestion.correctOption = -1;
				preState.local_data.selectedOptionIndex = -1;
			},()=>{
				Taro.redirectTo({
					url: buildURL(_this.state.routers.resultPage,{item: message[0]['data']})
				})
			});
		});

		// 1320 广播复活信息（活着的玩家可以看到）
		this.eventEmitter = emitter.addListener('getRenascenceInfo', (message) => {
			clearInterval(message[1]);			
			console.info('%c 服务器广播复活情况信息 ====>','color:#ff9d1a;font-size:14px;');console.info(message[0]);
			this.setState((preState)=>{
				preState.data.preQuestionInfo = message[0]['data'];
				// 添加全局剩余人数
				preState.local_data.curQuestion['currCount'] = JSON.parse(JSON.stringify(message[0]['data']['currCount']));
				// 添加全局答错人数
				preState.local_data.curQuestion['dieCount'] = JSON.parse(JSON.stringify(message[0]['data']['dieCount']));
				// 添加全局复活人数
				preState.local_data.curQuestion['receiveCount'] = JSON.parse(JSON.stringify(message[0]['data']['receiveCount']));
				// 隐藏答错人数提醒
				preState.local_data.curQuestion['answerErrorCount'] = 0;
			},()=>{
				console.info('%c 收到[ 复活信息 ]后的curQuestion =====>', 'font-size:14px;color:#1ae3ff;')
				console.info(_this.state.local_data.curQuestion);
			})
		});
	}

	componentDidHide () {
		console.info('~Hide了~');
		clearInterval(this.state.data.timer);
	}
	
	// 接受到的问题答案数据放入数组, 同时设置答案optionId
	resetQA(data_){
		data_['options'] = [];
		data_['options'].push(
			{key:'A', value: data_['option1'], optionId: 1},
			{key:'B', value: data_['option2'], optionId: 2}, 
			{key:'C', value: data_['option3'], optionId: 3}, 
			{key:'D', value: data_['option4'], optionId: 4}
		)
		delete data_['option1'];
		delete data_['option2'];
		delete data_['option3'];
		delete data_['option4'];
		return data_;
	}

	// 获取自己游戏信息
	getPrizeMatchUserInfo(){
		let _this = this;
		getStorage('prizeMatchUserInfo',(res)=>{
			_this.setState((preState)=>{
				preState.local_data.prizeMatchUserInfo = res;
			})
		})
	}

	// 开始倒计时
	getCountdown(time){
		let _this = this;
		// 关闭遮罩，可选择答案
		this.setState((preState)=>{
			preState.local_data.isShowMask = false;
		},()=>{});
		this.setState((preState)=>{
			clearInterval(preState.data.timer);
			preState.data.timer = setInterval(function(){
				if( time > 0 ){
					time--;
					// console.error('倒计时==>' + time);
					_this.setState((preState)=>{
						preState.local_data.curQuestion.time = time < 10? '0'+ time: time;
					},()=>{})
				}else{
					// console.error('倒计时结束');
					clearInterval(_this.state.data.timer);
					// 开启遮罩，不可选择
					_this.setState((preState)=>{
						preState.local_data.isShowMask = true;
					},()=>{});
				}
			},1000)
		},()=>{})
	}

	// 发送用户所选optionId，更改选中样式
	submitAnswer(e){
		let _this = this;
		let optionId = e.currentTarget.dataset.optionid; 	  		 // 用户所选optionId
		let currquestid = e.currentTarget.dataset.currquestid;		 // 当前题id
		let curOptionIndex = e.currentTarget.dataset.curoptionindex; // 用户所选当前题的index

		console.info('%c 发送1307用户所选当前题的index ==>' + curOptionIndex,'color:#1a9aff;font-size:14px;');
		let data = {
			questId: currquestid,
			optionId: optionId
		}
		let matchingRequest = this.msgProto.submitAnswer(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);

		// 设置所选答案index - optionId
		this.setState((preState)=>{
			preState.local_data.selectedOptionIndex = curOptionIndex;
			preState.local_data.selectedOptionId = optionId;
		},()=>{});

		console.info('%c 发送questId为：'+ currquestid +'， 答案optionId为： ' + optionId, 'font-size:14px;color:#FF4500;');
		this.webSocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {
				// 显示遮罩，无法选题
				_this.setState((preState)=>{
					preState.local_data.isShowMask = true;
				},()=>{});
			},
			fail(err) { console.log(err) }
		});
	}

	// 主动断开重新new和联接，重新登录
	createSocket(){
		// 创建websocket对象
		this.websocket = new Websocket({
			// true代表启用心跳检测和断线重连
			heartCheck: true,
			isReconnection: true
		});

		// 监听websocket关闭状态
		this.websocket.onSocketClosed({
			url: websocketUrl,
			success(res) { console.log(res) },
			fail(err) { console.log(err) }
		})

		// 捕获websocket异常
		this.websocket.getOnerror((err)=>{
			console.error('捕获到了异常');console.info(err);
			Taro.showToast({
				title: err.errMsg,
				icon: 'none',
				duration: 2000
			})
		});

		// 监听网络变化
		this.websocket.onNetworkChange({
			url: websocketUrl,
			success(res) { console.log(res) },
			fail(err) { console.log(err) }
		})

		// 监听服务器返回
		this.websocket.onReceivedMsg(result => {
			let message = JSON.parse(result);
			let messageData = JSON.parse(message.data);
			message.data = messageData;
			console.log('%c 收到服务器内容：', 'background:#000;color:white;font-size:14px');console.info(message);
			// 要进行的操作
			new ReceiveMsg(message);
		})
		
		this.websocket.initWebSocket({
			url: websocketUrl,
			success(res) { console.log('～建立连接成功！linkWebsocket～')},
			fail(err) { console.log(err) }
		})
		
		// 对外抛出websocket
		App.globalData.webSocket = this.websocket;
	}

	// 显示复活弹窗
	isResurrection(){
		this.setState((preState)=>{
			preState.local_data.isShowToast = true;
		},()=>{})
	}

	// 复活倒计时
	resurrectionCountdown(time, callback){
		let _this = this, timer;
		clearInterval(timer);
		timer = setInterval(()=>{
			time-=1;
			if(time < 0){
				_this.setState((preState)=>{
					preState.local_data.preQuestionInfo.waitreceivetime = 0;
				},()=>{
					clearInterval(time);
					if(callback)callback();
				});
			}else{
				_this.setState((preState)=>{
					preState.local_data.preQuestionInfo.waitreceivetime = time;
				});
			}
		},1000)
	}	

	// 取消复活，跳转战报
	toastCancel(e){
		let _this = this;
		let data = 0;
		let resurrect = this.msgProto.resurrect(data)
		let parentModule = this.msgProto.parentModule(resurrect);
		this.webSocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {
				_this.setState((preState)=>{
					preState.local_data.isShowToast = false;
				},()=>{console.info('选择 --> 取消复活')});
			},
			fail(err) { console.log(err) }
		});
	}

	// 确认复活
	toastConfirm(e){
		let _this = this;
		let data = 1;
		let resurrect = this.msgProto.resurrect(data)
		let parentModule = this.msgProto.parentModule(resurrect);
		this.webSocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.info('选择 --> 确认复活')},
			fail(err) { console.info(err) }
		});
	}

	render () {
		const {
			countdownPrizeMatch, surplusText, dieOutText, isShowMask, isShowToast,
			isShowLoading, selectedOptionIndex, unit,
		} = this.state.local_data;
		// 当前题
		const { currContent, currIndex, currQuestId, time, totalCount, options, answerErrorCount,
			correctOption, currCount, dieCount, receiveCount, list,
		} = this.state.local_data.curQuestion;

		// 弹窗提示
		const { toastTitle, toastContent, toastBtn1, toastBtn2, toastUnit} = this.state.local_data.dieInfo;

		// 复活时间
		const { waitreceivetime } = this.state.local_data.preQuestionInfo;

		const Answer  = options.map((currentValue,index) => { // selectedOptionIndex 所选题的index
			return  <View className={`optionBox`}>
						<View onClick={this.submitAnswer.bind(this)} 
							className=
							{`optionWarp 
							${selectedOptionIndex == index?'selectedOption':''} 
							${correctOption == currentValue.optionId?'trueOptionBottom':''}`}
							data-curOptionIndex={index}
							data-currQuestId={currQuestId}
							data-quesIndex={currIndex} 
							data-optionId={currentValue.optionId}
						>
							<View className={`option ${ correctOption == currentValue.optionId?'trueOption':''}`}>
								<View className='optionMark'>{currentValue.key}</View>
								<View className='optionContent'>{currentValue.value}</View>
							</View>
						</View>
						<View className='optionPeople'>{list[index]}人</View>
					</View>
		});

		return (
			<View className='prizeMatch'>
				{/* 加载loading */}
				<View className={isShowLoading?'':'hide'}>
					<GameLoading />
				</View>

				{/* 挂了弹窗提示是否复活 */}
				<View className={`toast ${isShowToast?'':'hide'}`}>
					<View className='content'>
						<View className='title'>{toastTitle}</View>
						<View className='body'>{toastContent}</View>
						<View className='btns'>
							<View onClick={this.toastCancel.bind(this)} className='cancelBtnWarp'>
								<View className='cancelBtn'>{toastBtn1}</View>
							</View>
							<View onClick={this.toastConfirm.bind(this)} className='confirmBtnWarp'>
								<View className='confirmBtn'>{toastBtn2}({waitreceivetime}){toastUnit}</View>
							</View>
						</View>
					</View>
				</View>

				{/* 内容区 */}
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='head'>
							<View className='countdownWrap'>
								<Image src={countdownPrizeMatch} className='countdown' />
								<View className='people surplus'>{surplusText}{currCount}{unit}</View>
								<View className='countdown_time'>{time}</View>
								<View className='people dieOut'>{dieOutText}{dieCount}{unit}</View>
							</View>
							<View className='questionBg'>
								<View className='questionText'>{currIndex+1}. {currContent}</View>
							</View>
						</View>
						{/* 答案 */}
						<View className='content'>
							<View className={`mask ${isShowMask?'':'hide'}`}></View>
							{Answer}
						</View>
						{/* 提示答错人数 */}
						<View className={`footer ${ answerErrorCount > 0?'':'hide'}`}>
							<View className='wrongAnswer'>{'本题答错'}<Text decode={true}>&ensp;{answerErrorCount}&ensp;</Text>{unit},{'等待他人复活中……'}</View>
						</View>
						{/* 提示复活人数 */}
						<View className={`footer ${receiveCount > 0?'':'hide'}`}>
							<View className='wrongAnswer'>{'上题复活'}<Text decode={true}>&ensp;{receiveCount}&ensp;</Text>{unit}</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}