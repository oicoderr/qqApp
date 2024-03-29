import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import GameLoading from '../../components/GameLoading'
import { buildURL, getCurrentTime, get_OpenId_RoleId, getStorage } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import configObj from '../../service/configObj'
import './enterGame.scss'
import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp()

export class PrizeEnterGame extends Component {

	config: Config = {
		navigationBarTitleText: '大奖赛游戏开始',
		navigationBarBackgroundColor: 'rgba(97, 130, 242, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {

			// 路由
			routers: {
				resultPage: '/pages/prizeMatch/result',
			},

			// 后台返回数据
			data: {
				timer: '', 										// 计时器
				secondsTimer: '',							// 3s计时器
				time: '10',										// 倒计时
				curQuestion: {},							// 当前题
				preQuestionInfo: {							// 上一题回答基本信息
					answerErrorCount: '',
					lastQuestId: '',
					list: [],
					optionId: '',
					waitreceivetime: 3,
				},
			},

			// 前台数据
			local_data: {
				prevQuesTxt: '本题答错',
				revivalTxt: '上题复活',
				waiteOtherRevivalTxt: '等待他人复活中……',
				dieOutTxt: '已淘汰：',
				surplusTxt: '剩余人数：',
				countdownPrizeMatch: 'https://oss.snmgame.com/v1.0.0/countdownPrizeMatch.png',
				defultClass: '',	   					// 选项上层默认样式class 
				defultBottomClass: '', 				// 选项下层默认样式class
				isShowMask: false,						// 默认不显示遮罩
				isShowLoading: true,					// 默认显示加载动画
				curQuestion: {								// 当前题
					currCount: 30,
					dieCount: 0,								// 已淘汰人数
					receiveCount: 0,						// 复活人数
					currContent: '',						// 当前题文案
					currIndex: 0,
					time: 10,
					totalCount: '',
					list: [0, 0, 0, 0],
					isSuccess: -1,
					selfSelectId: -1,
				},
				selectedOptionIndex: -1,			// 当前题index
				memoryIndex: -1,							// 记忆当前index
				selectedOptionId: '',					// 所选题optionId
				preQuestionInfo: {						// 上一题回答基本信息
					answerErrorCount: '',
					lastQuestId: '',
					list: [],
					optionId: '',
					waitreceivetime: 3,
				},
				prizeMatchUserInfo: {},				// 大奖赛个人信息
				isAnswerCorrect: {							// 玩家选择10s后显示当前答案是否正确
					isSuccess: 0,
					optionId: '',
					questId: '',
				},
				unit: '人',
				dieInfo: {
					toastTitle: '哎呦，答错了',
					toastContent: '我觉得我还可以再抢救一下！',
					toastBtn1: '算了',
					toastBtn2: '复活',
					toastUnit: '秒',
				},
				isShowToast: false,						// 是否显示复活toast
			},

			websocketUrl: '',
		}

		this.msgProto = new MsgProto();
	}

	componentWillMount() { }

	componentDidMount() {
		// 设置总人数
		const params = this.$router.params;
		console.log('%c 收到大奖赛自己信息 / 参赛总人数 ==>', 'font-size:14px;color:#ff751a;'); console.log(JSON.parse(params.item));
		let item = JSON.parse(params.item);
		if (item) {
			this.setState((preState) => {
				preState.local_data.curQuestion.currCount = item.count;
				preState.local_data.prizeMatchUserInfo = item.prizeMatchUserInfo;
			})
		}
	}

	componentWillUnmount() {
		clearInterval(this.state.data.timer);
		emitter.removeAllListeners('getQuestion');
		emitter.removeAllListeners('getAnswer');
		emitter.removeAllListeners('getPrizePrevQAInfo');
		emitter.removeAllListeners('getResurrectResult');
		emitter.removeAllListeners('getPrizeMatchReport');
		emitter.removeAllListeners('getRenascenceInfo');
		emitter.removeAllListeners('requestUrl');
	}

	componentDidShow() {
		let _this = this;
		// 大奖赛答题pv
		App.aldstat.sendEvent('pv-大奖赛比赛', get_OpenId_RoleId());

		// 获取当前版本
		configObj.getVersion();
		// 监听requestUrl
		this.eventEmitter = emitter.addListener('requestUrl', message => {
			clearInterval(message[0]);

			this.state.websocketUrl = message[1]['websocketUrl'];

			// 接受AppGlobalSocket
			if (App.globalData.websocket === '') {
				createWebSocket(this);
			} else {
				this.websocket = App.globalData.websocket;
				let websocketUrl = this.state.websocketUrl;
				if (this.websocket.isLogin) {
					console.log("%c 您已经登录了", 'background:#000;color:white;font-size:14px');
				} else {
					this.websocket.initWebSocket({
						url: websocketUrl,
						success(res) {
							// 开始登陆
							_this.websocket.onSocketOpened((res) => { });
							// 对外抛出websocket
							App.globalData.websocket = _this.websocket;
						},
						fail(err) {
							createWebSocket(_this);
						}
					});
				}
			}
		});

		// 隐藏答题遮罩
		this.setState((preState) => {
			preState.local_data.isShowMask = false;
		}, () => {
			// console.log('%c' + this.state.local_data.isShowMask,'font-size:20px; color:pink;');
		});

		// 1306 服务器广播当前题
		this.eventEmitter = emitter.addListener('getQuestion', (message) => {
			clearInterval(message[1]);
			console.log('%c 1306发题了: ' + getCurrentTime(), 'font-size:14px;color:#1a4dff;'); console.log(message[0]['data']);
			let time = message[0]['data']['time'];
			clearInterval(this.state.data.timer);
			// 取消所有选中样式
			this.setState((preState) => {
				preState.data.curQuestion = message[0]['data'];
				preState.local_data.curQuestion = this.resetQA(message[0]['data']);
				preState.local_data.curQuestion.correctOption = -1;
				preState.local_data.selectedOptionIndex = -1;
				preState.local_data.memoryIndex = -1;
				// 隐藏答错人数提示
				preState.local_data.curQuestion['answerErrorCount'] = 0;
				// 隐藏答复活人数提示
				preState.local_data.curQuestion['receiveCount'] = 0;
				// 清空所选答案人数
				preState.local_data.curQuestion['list'] = [0, 0, 0, 0];
				// 清除用户所选答案状态
				preState.local_data.curQuestion['isSuccess'] = -1;
				preState.local_data.curQuestion['selfSelectId'] = -1;
			}, () => { });
			// 开始倒计时
			this.getCountdown(time);
			// 发题后关闭加载动画
			this.setState((preState) => {
				preState.local_data.isShowLoading = false;
			});
		});

		// 1308 接受答案通知
		this.eventEmitter = emitter.addListener('getAnswer', (message) => {
			clearInterval(message[1]);

			this.setState((preState) => {
				preState.local_data.isAnswerCorrect = message[0]['data'];
			}, () => {
				console.log('%c 已接受到答案', 'color:#1a9cff; font-size:14px;');
				console.log(message[0]['data']);
			})
		});

		// 1312 服务器广播上道题的统计
		this.eventEmitter = emitter.addListener('getPrizePrevQAInfo', (message) => {
			clearInterval(message[1]);
			console.log('%c 服务器广播上一题统计 ====>', 'color:#ff9d1a;font-size:14px;'); console.log(message[0]);
			this.setState((preState) => {
				preState.data.preQuestionInfo = message[0]['data'];
				let preQuestionInfo = JSON.parse(JSON.stringify(message[0]['data']));
				preState.local_data.preQuestionInfo = preQuestionInfo;
				// 上一题quesId
				preState.local_data.curQuestion['lastQuestId'] = preQuestionInfo['lastQuestId'];
				// 复活时间
				preState.local_data.curQuestion['waitreceivetime'] = preQuestionInfo['waitreceivetime'];
				// 是否可以复活
				preState.local_data.curQuestion['receive'] = preQuestionInfo['receive'];
				// 在curQuestion中添加正确答案
				preState.local_data.curQuestion['correctOption'] = preQuestionInfo['optionId'];
				// 添加各答案答对/打错人数
				preState.local_data.curQuestion['answerErrorCount'] = preQuestionInfo['answerErrorCount'];
				preState.local_data.curQuestion['list'] = preQuestionInfo['list'];
				// 清除选中样式
				preState.local_data.curQuestion['correctOption'] = -1;
				preState.local_data.selectedOptionIndex = -1;
				// 显示用户是否选择正确, 正确/错误显示
				preState.local_data.curQuestion['isSuccess'] = preState.local_data.isAnswerCorrect.isSuccess;
				preState.local_data.curQuestion['selfSelectId'] = preState.local_data.isAnswerCorrect.optionId;
			}, () => {
				let optionId = _this.state.local_data.preQuestionInfo.optionId;
				let selectedOptionId = _this.state.local_data.selectedOptionId;

				// 自己是否选择正确答案,错误->提示`是否复活`
				if (optionId != selectedOptionId) {
					// 复活倒计时开始
					let time = _this.state.local_data.curQuestion.waitreceivetime;
					// 是否可以复活状态
					let receive = _this.state.local_data.curQuestion.receive;
					if (receive) {
						clearInterval(_this.state.data.secondsTimer);
						_this.resurrectionCountdown(time, () => {
							// 倒计时结束1.关闭弹窗
							_this.setState((preState) => {
								preState.local_data.isShowToast = false;
							}, () => { })
						});
						// 显示是否弹窗
						_this.isResurrection();
					}
				}

				// 播放正确/错误音效
				let isSuccess = _this.state.local_data.curQuestion['isSuccess'];
				let sound_orderly = App.globalData.audioObj.soundOrderly;
				let sound_error = App.globalData.audioObj.soundError;
				getStorage('sounds',(res)=>{
					if(res[1]['type'] == 2 && res[1]['status'] == 1){
						// 正确/错误音效
						if(isSuccess){
							_this.playSound(sound_orderly);
						}else{
							_this.playSound(sound_error);
						}
					}
				});
			})
		});

		// 1314 获取复活结果 
		this.eventEmitter = emitter.addListener('getResurrectResult', (message) => {
			clearInterval(message[1]);

			console.log('%c 是否复活成功 ====>', 'color:#ff9d1a;font-size:14px;'); console.log(message[0]);
			let isSuccess = message[0]['data']['value'];
			if (isSuccess) {
				this.setState((preState) => {
					preState.local_data.isShowToast = false;
				}, () => {
					Taro.showToast({
						title: '成功复活',
						icon: 'none',
						mask: false,
						duration: 1000
					})
					console.log('%c ～复活成功～可以继续答题了', 'font-size:14px;color:#ff1ac9;')
				})
			} else {
				Taro.showToast({
					title: '复活失败(时间到了)',
					icon: 'none',
					mask: false,
					duration: 1000,
				});
			}
		});

		// 1318 发送战报(看完战报就离开房间吧)
		this.eventEmitter = emitter.once('getPrizeMatchReport', (message) => {
			clearInterval(message[1]);

			console.log('%c 服务器广播战报 ====>', 'color:#ff9d1a;font-size:14px;'); console.log(message[0]);
			// 取消所有选中样式
			this.setState((preState) => {
				preState.local_data.curQuestion.correctOption = -1;
				preState.local_data.selectedOptionIndex = -1;
				preState.local_data.memoryIndex = -1;
			}, () => {
				Taro.reLaunch({
					url: buildURL(_this.state.routers.resultPage, { item: message[0]['data'] })
				})
			});
		});

		// 1320 广播复活信息（活着的玩家可以看到）
		this.eventEmitter = emitter.addListener('getRenascenceInfo', (message) => {
			clearInterval(message[1]);

			console.log('%c 服务器广播复活情况信息 ====>', 'color:#ff9d1a;font-size:14px;'); console.log(message[0]);
			this.setState((preState) => {
				preState.data.preQuestionInfo = message[0]['data'];
				let preQuestionInfo = JSON.parse(JSON.stringify(message[0]['data']));
				// 添加全局剩余人数
				preState.local_data.curQuestion['currCount'] = preQuestionInfo['currCount'];
				// 添加全局答错人数
				preState.local_data.curQuestion['dieCount'] = preQuestionInfo['dieCount'];
				// 添加全局复活人数
				preState.local_data.curQuestion['receiveCount'] = preQuestionInfo['receiveCount'];
				// 隐藏答错人数提醒
				preState.local_data.curQuestion['answerErrorCount'] = 0;
			}, () => {
				console.log('%c 收到[ 复活信息 ]后的curQuestion =====>', 'font-size:14px;color:#1ae3ff;')
				console.log(_this.state.local_data.curQuestion);
			})
		});
	}

	componentDidHide() {
		clearInterval(this.state.data.timer);
		emitter.removeAllListeners('getQuestion');
		emitter.removeAllListeners('getAnswer');
		emitter.removeAllListeners('getPrizePrevQAInfo');
		emitter.removeAllListeners('getResurrectResult');
		emitter.removeAllListeners('getPrizeMatchReport');
		emitter.removeAllListeners('getRenascenceInfo');
		emitter.removeAllListeners('requestUrl');
	}

	// 接受到的问题答案数据放入数组, 同时设置答案optionId
	resetQA(data_) {
		data_['options'] = [];
		data_['options'].push(
			{ key: 'A', value: data_['option1'], optionId: 1 },
			{ key: 'B', value: data_['option2'], optionId: 2 },
			{ key: 'C', value: data_['option3'], optionId: 3 },
			{ key: 'D', value: data_['option4'], optionId: 4 }
		)
		delete data_['option1'];
		delete data_['option2'];
		delete data_['option3'];
		delete data_['option4'];
		return data_;
	}

	// 开始倒计时
	getCountdown(time) {
		let _this = this;
		// 关闭遮罩，可选择答案
		this.setState((preState) => {
			preState.local_data.isShowMask = false;
		}, () => { });
		this.setState((preState) => {
			clearInterval(preState.data.timer);
			preState.data.timer = setInterval(function () {
				if (time > 0) {
					time--;
					_this.setState((preState) => {
						preState.local_data.curQuestion.time = time < 10 ? '0' + time : time;
					}, () => { })
				} else {
					clearInterval(_this.state.data.timer);
					// 开启遮罩，不可选择
					_this.setState((preState) => {
						preState.local_data.isShowMask = true;
					}, () => { });
				}
			}, 1000)
		}, () => { })
	}

	// 发送用户所选optionId，更改选中样式
	submitAnswer(e) {
		let _this = this;
		let optionId = e.currentTarget.dataset.optionid; 	  		 // 用户所选optionId
		let currquestid = e.currentTarget.dataset.currquestid;		 // 当前题id
		let curOptionIndex = e.currentTarget.dataset.curoptionindex; // 用户所选当前题的index

		console.log('%c 发送1307用户所选当前题的index ==>' + curOptionIndex, 'color:#1a9aff;font-size:14px;');
		let data = {
			questId: currquestid,
			optionId: optionId
		}
		let matchingRequest = this.msgProto.submitAnswer(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);

		// 设置所选答案index - optionId
		this.setState((preState) => {
			preState.local_data.selectedOptionIndex = curOptionIndex;
			preState.local_data.memoryIndex = curOptionIndex;
			preState.local_data.selectedOptionId = optionId;
		}, () => { });

		console.log('%c 发送questId为：' + currquestid + '， 答案optionId为： ' + optionId, 'font-size:14px;color:#FF4500;');
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {
				// 显示遮罩，无法选题
				_this.setState((preState) => {
					preState.local_data.isShowMask = true;
				}, () => { });
			},
			fail(err) { console.log(err) }
		});
	}

	// 显示复活弹窗
	isResurrection() {
		// 大奖赛是否复活pv
		App.aldstat.sendEvent('pv-大奖赛复活', get_OpenId_RoleId());
		this.setState((preState) => {
			preState.local_data.isShowToast = true;
		}, () => { })
	}

	// 复活倒计时
	resurrectionCountdown(time, callback) {
		let _this = this;
		clearInterval(_this.state.data.secondsTimer);
		this.state.data.secondsTimer = setInterval(() => {
			time -= 1;
			if (time < 0) {
				_this.setState((preState) => {
					preState.local_data.preQuestionInfo.waitreceivetime = 0;
				}, () => {
					clearInterval(_this.state.data.secondsTimer);
					if (callback) callback();
				});
			} else {
				_this.setState((preState) => {
					preState.local_data.preQuestionInfo.waitreceivetime = time;
				});
			}
		}, 1000)
	}

	// 取消复活，跳转战报
	toastCancel(e) {
		let _this = this;
		let data = 0;
		let resurrect = this.msgProto.resurrect(data)
		let parentModule = this.msgProto.parentModule(resurrect);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {
				_this.setState((preState) => {
					preState.local_data.isShowToast = false;
				}, () => { console.log('选择 --> 取消复活') });
			},
			fail(err) { console.log(err) }
		});
	}

	// 确认复活
	toastConfirm(e) {
		let _this = this;
		let data = 1;
		let resurrect = this.msgProto.resurrect(data)
		let parentModule = this.msgProto.parentModule(resurrect);
		this.websocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.log('选择 --> 确认复活') },
			fail(err) { console.log(err) }
		});
	}

	// 播放音效
	playSound(obj){
		obj.play();
	}

	// 停止播放音效
	stopSound(obj){
		obj.stop();
	}

	render() {
		const {
			countdownPrizeMatch, surplusTxt, dieOutTxt, isShowMask, isShowToast, isShowLoading,
			selectedOptionIndex, unit, memoryIndex, prevQuesTxt, revivalTxt, waiteOtherRevivalTxt,
		} = this.state.local_data;
		// 当前题
		const { currContent, currIndex, currQuestId, time, totalCount, options, answerErrorCount,
			correctOption, currCount, dieCount, receiveCount, list, selfSelectId, isSuccess,
		} = this.state.local_data.curQuestion;

		// 弹窗提示
		const { toastTitle, toastContent, toastBtn1, toastBtn2, toastUnit } = this.state.local_data.dieInfo;

		// 复活时间
		const { waitreceivetime } = this.state.local_data.preQuestionInfo;

		const Answer = options.map((currentValue, index) => { // selectedOptionIndex 所选题的index
			return <View className={`optionBox`}>
				<View onClick={this.submitAnswer.bind(this)}
					className={`optionWarp 
							${selectedOptionIndex == index ? 'selectedOption' : ''} 
							${selfSelectId == currentValue.optionId && isSuccess ? 'trueOptionBottom' : ''}
							${memoryIndex == index && !isSuccess ? 'flaseOptionBottom' : ''}`}

					data-curOptionIndex={index}
					data-currQuestId={currQuestId}
					data-quesIndex={currIndex}
					data-optionId={currentValue.optionId}
				>
					<View className={`option 
							${selfSelectId == currentValue.optionId && isSuccess ? 'trueOption' : ''}
							${memoryIndex == index && !isSuccess ? 'falseOption' : ''}`}>
						<View className='optionMark'>{currentValue.key}</View>
						<View className='optionContent'><Text decode="true">{currentValue.value}</Text></View>
					</View>
				</View>
				<View className='optionPeople'>{list[index]}人</View>
			</View>
		});

		return (
			<View className='prizeMatch'>
				{/* 加载loading */}
				<View className={isShowLoading ? '' : 'hide'}>
					<GameLoading />
				</View>

				{/* 挂了弹窗提示是否复活 */}
				<View className={`toast ${isShowToast ? '' : 'hide'}`}>
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
								<View className='people surplus'>{surplusTxt}{currCount}{unit}</View>
								<View className='countdown_time'>{time}</View>
								<View className='people dieOut'>{dieOutTxt}{dieCount}{unit}</View>
							</View>
							<View className='questionBg'>
								<View className='questionText'>{currIndex + 1}. <Text decode="true">{currContent}</Text></View>
							</View>
						</View>
						{/* 答案 */}
						<View className='content'>
							<View className={`mask ${isShowMask ? '' : 'hide'}`}></View>
							{Answer}
						</View>
						{/* 提示答错人数 */}
						<View className={`footer ${answerErrorCount > 0 ? '' : 'hide'}`}>
							<View className='wrongAnswer'>{prevQuesTxt}<Text decode={true}>&ensp;{answerErrorCount}&ensp;</Text>{unit},{waiteOtherRevivalTxt}</View>
						</View>
						{/* 提示复活人数 */}
						<View className={`footer ${receiveCount > 0 ? '' : 'hide'}`}>
							<View className='wrongAnswer'>{revivalTxt}<Text decode={true}>&ensp;{receiveCount}&ensp;</Text>{unit}</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}