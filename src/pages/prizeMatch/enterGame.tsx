import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import GameLoading from '../../components/GameLoading'
import { getStorage, setStorage, getCurrentTime } from '../../utils'
import './enterGame.scss'
import emitter from '../../service/events'
import { websocketUrl } from '../../service/config'
import MsgProto from '../../service/msgProto'
import Websocket from '../../service/webSocket'
import ReceiveMsg from '../../service/receivedMsg'

const App = Taro.getApp()

export class StartGame extends Component {

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
				resultPage: '/pages/rankMatch/result'
			},
			// 后台返回数据
			data:{
				timer:'', 				// 计时器
				time: '10',				// 倒计时
				curQuestion: {},		// 当前题
				preQuestionInfo:{},		// 上一题回答基本信息
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
				curQuestion: {},		// 当前题
				selectedOptionIndex: -1,// 当前题index
				selectedOptionId: '',	// 所选题optionId
				preQuestionInfo: '',	// 上一题回答基本信息
				prizeMatchUserInfo:{},	// 大奖赛个人信息
				unit: '人',
			}
		}
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		this.getPrizeMatchUserInfo();
	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
		// 关闭加载动画
		let timerOut = setTimeout(()=>{
			_this.setState((preState)=>{
				preState.local_data.isShowLoading = false;
			},()=>{
				clearTimeout(timerOut);
			})
		},500)

		// 判断是否已经创建了wss请求
		if(App.globalData.webSocket === ''){
			this.webSocket.sendWebSocketMsg({//不管wss请求是否关闭，都会发送消息，如果发送失败说明没有ws请求
				data: 'ws alive test',
				success(data) {
					console.log('wss is ok:')
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
			console.info('%c 306发题了: ' + getCurrentTime(), 'font-size:14px;color:#1a4dff;');console.info(message[0]['data']);
			let time = message[0]['data']['time'];
			clearInterval(this.state.data.timer);
			// 开始倒计时
			this.getCountdown(time); 

			this.setState((presState)=>{
				presState.data.curQuestion = message[0]['data'];
				presState.local_data.curQuestion = this.resetQA(message[0]['data']);
			},()=>{
				console.log(_this.state.local_data.curQuestion,123)
			})
		});

		// 1308 接受答案通知
		this.eventEmitter = emitter.addListener('getAnswer', (message) => {
			clearInterval(message[1]);
			console.info('%c 已接受到答案', 'color:blue; font-size:12px;');
			console.info(message[0]['data']);
		});

		// 1312 服务器广播上道题的统计
		this.eventEmitter = emitter.addListener('getPrevQAInfo', (message) => {
			clearInterval(message[1]);			
			console.info('%c 服务器广播上一题统计 ====>','color:#ff9d1a;font-size:14px;');console.info(message[0]);
			this.setState((preState)=>{
				preState.data.preQuestionInfo = message[0]['data'];
				preState.local_data.preQuestionInfo = JSON.parse(JSON.stringify(message[0]['data']));
				// 在curQuestion中添加正确答案
				preState.local_data.curQuestion['correctOption'] = JSON.parse(JSON.stringify(message[0]['data']['optionId']));
				// 添加玩家复活时间： (0意思是大家都答对了)
				preState.local_data.curQuestion['waitreceivetime'] = JSON.parse(JSON.stringify(message[0]['data']['waitreceivetime']));
				// 添加全局答错人数
				preState.local_data.curQuestion['answerErrorCount'] = JSON.parse(JSON.stringify(message[0]['data']['answerErrorCount']));
				// 添加各答案答对/打错人数: list
				preState.local_data.curQuestion['IdValueBean'] = JSON.parse(JSON.stringify(message[0]['data']['IdValueBean']));
			},()=>{
				console.info('%c 收到上到题广播添加信息后的curQuestion =====>', 'font-size:14px;color:#1ae3ff;')
				console.info(_this.state.local_data.curQuestion);
			})
		});

		// 接受排位赛结果信息 => `跳转`结果页
		this.eventEmitter = emitter.once('getRankResultInfo', (message) => {
			console.log('%c 接受到本局结果信息', 'color:#000; font-size:14px;');
			console.log(message['data']);

			this.setState((preState)=>{
				preState.data.rankResultInfo = message['data'];
			},()=>{
				// 跳转结果页
				setStorage('rankResultInfo', message['data']);
				Taro.redirectTo({
					url: this.state.routers.resultPage
				})
			});
		});
	}

	componentDidHide () {
		console.info('~Hide了~');
		clearInterval(this.state.data.timer);
	}
	
	// 接受到的问题答案数据放入数组, 同时设置答案optionId
	resetQA(data_){
		let data = JSON.parse(JSON.stringify(data_));
		data['options'] = [];
		data['options'].push(
			{key:'A', value: data['option1'], optionId: 1},
			{key:'B', value: data['option2'], optionId: 2}, 
			{key:'C', value: data['option3'], optionId: 3}, 
			{key:'D', value: data['option4'], optionId: 4}
		)
		delete data['option1'];
		delete data['option2'];
		delete data['option3'];
		delete data['option4'];
		return data;
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
			preState.data.timer = setInterval(function(){			// 执行计时器
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
		let matchingGame = this.msgProto.submitAnswer(data)
		let parentModule = this.msgProto.parentModule(matchingGame);

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
				},()=>{})
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

	render () {
		const {
			countdownPrizeMatch, surplusText, dieOutText, isShowMask, 
			defultClass, defultBottomClass, isShowLoading, selectedOptionIndex, unit
		} = this.state.local_data;
		// 当前题
		const { currContent, currIndex, currQuestId, time, totalCount, options, 
			correctOption, waitreceivetime, answerErrorCount, IdValueBean,
		
		} = this.state.local_data.curQuestion;

		const Answer  = options.map((currentValue,index) => { // selectedOptionIndex 所选题的index
			return  <View className={`optionBox`}>
						<View onClick={this.submitAnswer.bind(this)} 
							className=
							{`optionWarp 
							${selectedOptionIndex == index?'selectedOption':''} 
							${correctOption == currentValue.optionId?'trueOption':''}`}
							data-curOptionIndex={index}
							data-currQuestId={currQuestId}
							data-quesIndex={currIndex} 
							data-optionId={currentValue.optionId}
						>
							<View className={`option ${ correctOption == currentValue.optionId?'trueOptionBottom':''}`}>
								<View className='optionMark'>{currentValue.key}</View>
								<View className='optionContent'>{currentValue.value}</View>
							</View>
						</View>
						<View className='optionPeople'>{'10'}人</View>
					</View>
		});

		return (
			<View className='prizeMatch'>
				{/* 加载loading */}
				<View className={isShowLoading?'':'hide'}>
					<GameLoading />
				</View>
				{/* 内容区 */}
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='head'>
							<View className='countdownWrap'>
								<Image src={countdownPrizeMatch} className='countdown' />
								<View className='people surplus'>{surplusText}{'10'}{unit}</View>
								<View className='countdown_time'>{time}</View>
								<View className='people dieOut'>{dieOutText}{answerErrorCount}{unit}</View>
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
					</View>
				</View>
			</View>
		)
	}
}