import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import GameLoading from '../../components/GameLoading'
import { getStorage, setStorage, getCurrentTime } from '../../utils'
import './startGame.scss'
import emitter from '../../service/events'
import { websocketUrl } from '../../service/config'
import MsgProto from '../../service/msgProto'
import Websocket from '../../service/webSocket'
import ReceiveMsg from '../../service/receivedMsg'

const App = Taro.getApp()

export class StartGame extends Component {

	config: Config = {
		navigationBarTitleText: '排位赛～开始比赛～',
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
				curQuestion:{
					currContent:'',
					currIndex: null,
					currQuestId: null,
					option1:'',
					option2: '',
					option3: '',
					option4: '',
					time: 10,
					totalCount: 5 
				},
				isSuccess: -1,

				curAnswer: {			// 当前题正确答案
					questId: '',
					optionId: '',      	// 正确选项id
					isSuccess: '',
				},	

				prevQAInfo:{			// 所有人的得分情况
					blueScore: 0, 
					lastQuestId: '',
					optionId:'',
					redScore: 0,
					selfCamp:'',
					list:[],
				},
				rankResultInfo:{},		// 结果页数据
			},

			// 前台数据
			local_data:{
				rankUserInfo:{},
				PartyATeam: [], 		// 排位赛红队伍
				PartyBTeam: [], 		// 排位赛蓝队伍
				scoreTeamA:[],			// 积分(roleId)队伍A
				scoreTeamB:[],			// 积分(roleId)队伍B
				selfScore:{},			// 自己得分情况
				curQuestion:{			// 重新编辑后台返回的问题数据
					currContent:'',
					currIndex: 0,
					time: 10,
				},			
				defultClass: '',	   	// 选项上层默认样式class 
				defultBottomClass: '', 	// 选项下层默认样式class 
				selectedOptionIndex: 0, // 当前题的index
				selectedOptionId:'',	// 用户所选optionId
				isShowMask: false,		// 默认不显示遮罩
				isShowLoading: true,	// 默认显示加载动画
				delayCardBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/delayCardBtn.png',
				helpCardBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/helpCardBtn.png',
				countdown: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/rank-countdown.png',
			}
		}
		this.webSocket = App.globalData.webSocket;
		this.msgProto = new MsgProto();
	}

	componentWillMount () {}

	componentDidMount () {
		// 获取'自己' 及 `队伍信息`
		this.getRankUserInfo(()=>{});
		this.getPartyTeamInfo();
	}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;
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

		// 关闭加载动画
		let timerOut = setTimeout(()=>{
			_this.setState((preState)=>{
				preState.local_data.isShowLoading = false;
			},()=>{
				clearTimeout(timerOut);
			})
		},500)

		// 接受排位赛发题
		this.eventEmitter = emitter.addListener('getRankQuestion', (message) => {
			// console.log('%c 接受到的题目及选项', 'color:#000; font-size:14px;');
			// console.log(message['data']);
			console.info('%c <========== 1306发题了 ==========>' + getCurrentTime(), 'font-size:14px;color:#f04e00;');
			let time = message['data']['time'];

			clearInterval(this.state.data.timer);
			// 开始倒计时
			this.getCountdown(time); 

			this.setState((preState)=>{
				preState.data.curQuestion = message['data'];
				preState.local_data.curQuestion = this.resetQA(message);
			},()=>{
				// console.log('%c 处理数据时间 =======> '+  new Date().getSeconds() +'修改返回数据 =====>', 'color:pink;font-size:14px;');
				// console.log(this.state.local_data.curQuestion);
			});
		});

		// 接受正确答案信息
		this.eventEmitter = emitter.addListener('getRankAnswer', (message) => {
			let _this = this;
			// console.log('%c 已接受到答案', 'color:blue; font-size:12px;');
			let selectedOptionId = this.state.local_data.selectedOptionId;
			this.setState((preState)=>{
				preState.data.curAnswer = message['data'];
			},()=>{
				if( selectedOptionId == this.state.data.curAnswer.optionId){
					this.setState((preState)=>{
						preState.local_data.defultClass = 'trueOption';
						preState.local_data.defultBottomClass = 'trueOptionBottom';
					},()=>{
						// console.info('%c 选则正确', 'color:#228B22;font-size:14px;background-color:#3c3c3c;');

						// 消失选中样式
						let timer = setTimeout(()=>{
							_this.setState((preState)=>{
								preState.local_data.defultClass = '';
								preState.local_data.defultBottomClass = '';
							},()=>{
								clearTimeout(timer);
							})
						},1000);

					})
				}else{
					this.setState((preState)=>{
						preState.local_data.defultClass = 'falseOption';
						preState.local_data.defultBottomClass = 'flaseOptionBottom';
					},()=>{
						// console.info('%c 选则错误', 'color:#EE6363;font-size:14px;background-color:#3c3c3c;');
						// 消失选中样式
						let timer = setTimeout(()=>{
							_this.setState((preState)=>{
								preState.local_data.defultClass = '';
								preState.local_data.defultBottomClass = '';
							},()=>{
								clearTimeout(timer);
							})
						},1000);
					})
				}
			})
		});

		// 接受上一题基本信息 
		this.eventEmitter = emitter.addListener('getPrevQAInfo', (message) => {
			console.log('%c 上一题基本信息','font-size:14px;color:#A020F0;');
			console.info(message['data']);
			this.setState((preState)=>{
				preState.data.prevQAInfo = JSON.parse(JSON.stringify(message['data']));
			},()=>{
				let list = this.state.data.prevQAInfo.list;			// 上一题得分情况
				let scoreTeamA = this.state.local_data.scoreTeamA;	// A队积分信息
				let scoreTeamB = this.state.local_data.scoreTeamB;	// B对积分信息
				let selfScore = this.state.local_data.selfScore;	// 自己的积分信息
				
				// 找到我的积分信息
				list.map(function (cur) {
					if( selfScore['roleId'] == cur['roleId']){
						_this.state.local_data.selfScore['score'] = cur['currScore'];
					}
				});

				// 找到A队伍积分信息
				list.map(function (cur, index) {
					if( scoreTeamA.length >0 && index < scoreTeamA.length && scoreTeamA[index]['roleId'] == cur['roleId']){
						_this.state.local_data.scoreTeamA[index]['score'] = cur['currScore'];
					}
				});

				// 找到B队伍积分信息
				list.map(function (cur, index) {
					if( scoreTeamB.length > 0 && index < scoreTeamB.length && scoreTeamB[index]['roleId'] == cur['roleId']){
						console.log(_this.state.local_data.scoreTeamB, 7777)
						_this.state.local_data.scoreTeamB[index]['score'] = cur['currScore'];
					}
				});
			
				this.setState((preState)=>{
					preState.local_data.selfScore = selfScore;
					preState.local_data.scoreTeamA = scoreTeamA;
					preState.local_data.scoreTeamB = scoreTeamB;
				},()=>{
					console.info('%c <==== 自己 - 各队伍 ====>', 'font-size:14px;color:#f08a00;');
					console.log(this.state.local_data.selfScore);
					console.log(this.state.local_data.scoreTeamA);
					console.log(this.state.local_data.scoreTeamB);
				})
			})
		})

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
	resetQA(message){
		let data = JSON.parse(JSON.stringify(message['data']));
		data['options'] = [];
		data['options'].push({key:'A', value: data['option1'], optionId: 1},{key: 'B', value: data['option2'], optionId: 2}, {key:'C', value: data['option3'], optionId: 3}, {key:'D', value: data['option4'], optionId: 4})
		delete data['option1'];
		delete data['option2'];
		delete data['option3'];
		delete data['option4'];
		return data;
	}

	// 获取自己排位模式个人信息
	getRankUserInfo(callback){
		let _this = this;
		getStorage('rankUserInfo',(val)=>{
			_this.setState((preState)=>{
				preState.local_data.rankUserInfo = val
			},()=>{
				console.info('%c 自己的排位模式个人信息 ===>','color:#FF83FA;font-size:14px;');
				console.info(this.state.local_data.rankUserInfo);
				if(callback)callback();
			})
		})
	}

	// 获取排位赛队伍信息
	getPartyTeamInfo(){
		let _this = this;
		getStorage('PartyATeam',(val)=>{
			_this.setState((preState)=>{
				preState.local_data.PartyATeam = val;
			},()=>{
				// console.log(' 获取排位赛‘A’队伍信息 ===>','font-szie:18px; color:#000;');console.log(this.state.local_data.PartyATeam);
				// 获取各个队伍roleId，重新放入新数组
				let PartyATeam = this.state.local_data.PartyATeam;
				let arrayJson = new Array;
				PartyATeam.map(function(currentValue,index,arr){
					arrayJson.push({
						roleId: currentValue['roleId'],
						score: 0,
					})
				})

				this.setState((preState)=>{
					preState.local_data.scoreTeamA = arrayJson;
				},()=>{
					console.error('设置好了scoreTeamA')
					console.info(this.state.local_data.scoreTeamA);
				})
			})
		})
		getStorage('PartyBTeam',(val)=>{
			_this.setState((preState)=>{
				preState.local_data.PartyBTeam = val;
			},()=>{
				// console.log('%c 获取排位赛‘B’队伍信息 ===>', 'font-szie:18px; color:#000;');console.log(this.state.local_data.PartyBTeam);
				// 获取各个队伍roleId，重新放入新数组json中，score空
				let PartyBTeam = this.state.local_data.PartyBTeam;
				let arrayJson = new Array;
				PartyBTeam.map((currentValue,index,arr)=>{
					arrayJson.push({
						roleId: currentValue['roleId'],
						score: 0,
					})
				})
				this.setState((preState)=>{
					preState.local_data.scoreTeamB = arrayJson;
				},()=>{
					// console.error('设置好了scoreTeamB')
					console.info(this.state.local_data.scoreTeamB);
				})
			})
		})

		// 自己的roleId
		this.getRankUserInfo(()=>{
			let rankUserInfo = this.state.local_data.rankUserInfo;
			this.setState((preState)=>{
				preState.local_data.selfScore = {
					roleId: rankUserInfo['roleId'],
					score: 0,
				};
			},()=>{
				// console.error('设置好了 selfScore ')
				console.info(this.state.local_data.selfScore);
			})
		})
	}

	// 开始倒计时
	getCountdown(time){
		let _this = this;
		clearInterval(this.state.data.timer);

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
	
	// 发送用户所选optionId
	submitAnswer(e){
		let _this = this;
		let optionId = e.currentTarget.dataset.optionid; 	  		 // 用户所选optionId
		let currquestid = e.currentTarget.dataset.currquestid;
		let curOptionIndex = e.currentTarget.dataset.curoptionindex; // 用户所选当前题的index
		// console.info('%c 用户所选当前题的index ==>' + curOptionIndex,'color:#FFC125;font-size:14px;');
		let data = {
			questId: currquestid,
			optionId: optionId
		}
		let matchingGame = this.msgProto.submitRankAnswer(data)
		let parentModule = this.msgProto.parentModule(matchingGame);

		// 设置所选答案index - optionId
		this.setState((preState)=>{
			preState.local_data.selectedOptionIndex = curOptionIndex;
			preState.local_data.selectedOptionId = optionId;
		},()=>{});

		// console.info('%c 发送questId为：'+ currquestid +'， 答案optionId为： ' + optionId, 'font-size:14px;color:#FF4500;');
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
		const { defultClass, defultBottomClass, isShowMask, isShowLoading, selectedOptionIndex, countdown, scoreTeamA, 
			scoreTeamB, selfScore, delayCardBtn, helpCardBtn, rankUserInfo, PartyATeam, PartyBTeam } = this.state.local_data;
		const { currContent, currIndex, currQuestId, time, totalCount, options } = this.state.local_data.curQuestion;
		const {blueScore, redScore, selfCamp} = this.state.data.prevQAInfo;

		const redContent = PartyATeam.map((currentValue,index) => {
			return  <View className='redSelf' data-roleId={currentValue.roleId}>
						<Image src={currentValue.headUrl} className='headImg' />
						<View className='personalScore'>
							{currentValue.roleId == scoreTeamA[index]['roleId']? scoreTeamA[index]['score'] : ''}
						</View>
					</View>
		});

		const blueContent = PartyBTeam.map((currentValue,index) => {
			return  <View className='blueSelf' data-roleId={currentValue.roleId}>
						<Image src={currentValue.headUrl} className='headImg' />
						<View className='personalScore blueTeamBgColor'>
							{currentValue.roleId == scoreTeamB[index]['roleId']? scoreTeamB[index]['score'] : ''}
						</View>
						<View className='hide falseOptionHeadMask'></View>
					</View>
		});

		const Answer  = options.map((currentValue,index) => { // selectedOptionIndex 所选题的index
			return  <View className={`optionWarp ${ selectedOptionIndex == index? defultBottomClass:'' }`}>
						<View 
							onClick={this.submitAnswer.bind(this)} 
							className={`option ${ selectedOptionIndex == index? defultClass:'' }`}
							data-curOptionIndex={index} // 当前题的index
							data-currQuestId={currQuestId} 
							data-quesIndex={currIndex} 
							data-optionId={currentValue.optionId}
						>
							<View className='optionMark'>{currentValue.key}</View>
							<View className='optionContent'>{currentValue.value}</View>
						</View>
					</View>
		});

		return (
			<View className='rankStartGame'>
				<View className={isShowLoading?'':'hide'}>
					<GameLoading />
				</View>
				
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='head'>
							<View className='redTeam'>
								<View className='redSelf' data-roleId={rankUserInfo.roleId}>
									<View className='myselfHead headImg'>
										<openData type="userAvatarUrl"></openData>
									</View>
									<View className='personalScore'>{selfScore.score}</View>
								</View>
								{ redContent }
							</View>
							
							<View className='question' data-totalCount={totalCount}>
								<View className='countdownWrap'>
									<Image src={countdown} className='countdown-score'/>
									<View className='score teamAScore'>{selfCamp?blueScore : redScore}</View>
									<View className='countdown'>{time}</View>
									<View className='score teamBScore'>{selfCamp?redScore : blueScore}</View>
								</View>
								<View className='Text'>{currIndex+1}. { currContent }</View>
							</View>

							<View className='blueTeam'>
								{ blueContent }
							</View>
						</View>
						<View className='content'>
							<View className={`mask ${isShowMask?'':'hide'}`}></View>
							{ Answer }
						</View>
						<View className='foot'>
							<View className='cardBtn'>
								<Image src={delayCardBtn} className='delayCardBtn'/>
								<Text className='card-num'>{12}</Text>
							</View>
							
							<View className='cardBtn'>
								<Image src={helpCardBtn} className='helpCardBtn'/>
								<Text className='card-num'>{32}</Text>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}