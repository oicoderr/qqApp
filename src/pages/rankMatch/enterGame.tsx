import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import GameLoading from '../../components/GameLoading'
import { buildURL, getCurrentTime } from '../../utils'
import { createWebSocket } from '../../service/createWebSocket'
import './enterGame.scss'
import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'


const App = Taro.getApp()

export class enterGame extends Component {

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
					totalCount: 5,
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
				rankUserInfo: {},
				PartyATeam: [], 		// 排位赛红队伍
				PartyBTeam: [], 		// 排位赛蓝队伍
				scoreTeamA: [],			// 积分(roleId)队伍A
				scoreTeamB: [],			// 积分(roleId)队伍B
				selfScore: {},			// 自己得分情况
				curQuestion:{			// 重新编辑后台返回的问题数据
					currContent:'',
					currIndex: 0,
					time: 10,
				},
				matchProps: {},			// 延迟卡，求助卡数量
				used_delayCardResult:{  // 延迟卡信息
					delayCard: 1,
					errmsg: "",
					errorId1: -1,
					errorId2: -1,
					helpCard: 1,
					id: 2,
					result: 1,
					time: 0,
				},
				used_helpCardResult: {  // 求助卡信息
					delayCard: 1,
					errmsg: "",
					errorId1: -1,
					errorId2: -1,
					helpCard: 1,
					id: 1,
					result: 1,
					time: 0,
				},		
				defultClass: '',	   	// 选项上层默认样式class 
				defultBottomClass: '', 	// 选项下层默认样式class 
				selectedOptionIndex: 0, // 当前题的index
				selectedOptionId: '',	// 用户所选optionId
				isShowMask: false,		// 默认不显示遮罩
				isShowLoading: true,	// 默认显示加载动画
				delayCardBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/delayCardBtn.png',
				helpCardBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/helpCardBtn.png',
				disable_delayCardBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/disable_delayCardBtn.png',
				disable_helpCardBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/disable_helpCardBtn.png',
				countdown: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/rank-countdown.png',
			}
		}
		this.msgProto = new MsgProto();
	}

	componentWillMount () {
		let _this = this;
		const params = this.$router.params;
		console.info('自己/所有队伍信息 ==>');console.info(JSON.parse(params.item));
		let item = JSON.parse(params.item);
		if(item){
			let arrayJsonA = new Array, arrayJsonB = new Array;
			item.PartyATeam.map(function(currentValue,){
				arrayJsonA.push({
					roleId: currentValue['roleId'],
					score: 0,
				})
			});

			item.PartyBTeam.map((currentValue)=>{
				arrayJsonB.push({
					roleId: currentValue['roleId'],
					score: 0,
				})
			})

			this.setState((preState)=>{
				preState.local_data.rankUserInfo = item['rankUserInfo'];
				preState.local_data.selfScore = { roleId: item['rankUserInfo']['roleId'], score: 0,}
				preState.local_data.PartyATeam = item.PartyATeam;
				preState.local_data.scoreTeamA = arrayJsonA;
				preState.local_data.PartyBTeam = item.PartyBTeam;
				preState.local_data.scoreTeamB = arrayJsonB;
			},()=>{
				console.error('设置好了scoreTeamA/B/selfScore')
				console.info(_this.state.local_data.selfScore);
				console.info(_this.state.local_data.scoreTeamA);
				console.info(_this.state.local_data.scoreTeamB);
			});
		}else{
			Taro.showToast({
				title: '未接收到队伍信息',
				mask: true,
				icon: 'none',
				duration: 2000
			})
		}
	}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidShow () {
		let _this = this;

		if(App.globalData.webSocket === ''){
			console.info('%c rankMatch-enterGame 未找到Socket','font-size:14px;color:#ff6f1a;');
			createWebSocket(this);
		}else{
			this.webSocket = App.globalData.webSocket;
		}

		// 隐藏答题遮罩
		this.setState((preState)=>{
			preState.local_data.isShowMask = false;
		},()=>{ /* console.info('%c' + this.state.local_data.isShowMask,'font-size:20px; color:pink;');*/});
		
		// 请求道具：延迟卡，求助卡数量
		this.getMatchProps();

		// 1508 接受道具卡数量
		this.eventEmitter = emitter.addListener('getMatchProps', (message) => {
			clearInterval(message[1]);
			console.info('%c 接收到比赛道具卡数量 ===>','font-size:14px;color:#f04e00;');
			console.info( message[0]['data']);
			this.setState((preState)=>{
				let data = message[0]['data'];
				preState.local_data.matchProps = data;
			},()=>{})
			
		});

		// 1338 使用道具结果
		this.eventEmitter = emitter.addListener('usedPropsResult', (message) => {
			clearInterval(message[1]);
			console.info('%c 接收到道具卡使用结果 ===>','font-size:14px;color:#f04e00;');
			console.info( message[0]['data']);

			let data = message[0]['data'];
			if(data.id == 1){
				this.setState((preState)=>{
					preState.local_data.used_helpCardResult = data;
				},()=>{});
			}else if(data.id == 2){
				this.setState((preState)=>{
					preState.local_data.used_delayCardResult = data;
				},()=>{
					// 开始倒计时
					clearInterval(this.state.data.timer);
					console.error('时间：' + data.time);
					this.getCountdown(data.time);
				});
			}
		});

		// 1306 排位赛发题
		this.eventEmitter = emitter.addListener('getQuestion', (message) => {
			clearInterval(message[1]);
			// console.info('%c 接受到的题目及选项', 'color:#000; font-size:14px;'); console.log(message[0]['data']);
			console.info('%c <========== 1306发题了 ==========>' + getCurrentTime(), 'font-size:14px;color:#f04e00;');
			let time = message[0]['data']['time'];

			clearInterval(this.state.data.timer);
			// 开始倒计时
			this.getCountdown(time); 
			// 发题后关闭加载动画
			_this.setState((preState)=>{
				preState.local_data.isShowLoading = false;
			});

			this.setState((preState)=>{
				preState.data.curQuestion = message[0]['data'];
				preState.local_data.curQuestion = this.resetQA(message[0]['data']);
				preState.local_data.used_delayCardResult = {
					delayCard: 1,
					errmsg: "",
					errorId1: -1,
					errorId2: -1,
					helpCard: 1,
					id: 2,
					result: 1,
					time: 0,
				};
				preState.local_data.used_helpCardResult = {
					delayCard: 1,
					errmsg: "",
					errorId1: -1,
					errorId2: -1,
					helpCard: 1,
					id: 1,
					result: 1,
					time: 0,
				};
			},()=>{
				// console.log('%c 处理数据时间 =======> '+  new Date().getSeconds() +'修改返回数据 =====>', 'color:pink;font-size:14px;');
			});
		});

		// 1308 接受正确答案信息
		this.eventEmitter = emitter.addListener('getAnswer', (message) => {
			clearInterval(message[1]);
			let _this = this;
			// console.log('%c 已接受到答案', 'color:blue; font-size:12px;');
			let selectedOptionId = this.state.local_data.selectedOptionId;
			this.setState((preState)=>{
				preState.data.curAnswer = message[0]['data'];
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

		// 1322 接受上一题基本信息 
		this.eventEmitter = emitter.addListener('getPrevQAInfo', (message) => {
			clearInterval(message[1]);
			console.log('%c 上一题基本信息','font-size:14px;color:#A020F0;');
			console.info(message[0]['data']);
			this.setState((preState)=>{
				preState.data.prevQAInfo = JSON.parse(JSON.stringify(message[0]['data']));
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
				},()=>{})
			})
		})

		// 1324 接受排位赛结果信息 => `跳转`结果页
		this.eventEmitter = emitter.once('getRankResultInfo', (message) => {
			clearInterval(message[1]);
			console.info('%c 接受到本局结果信息', 'color:#000; font-size:14px;');
			console.info(message[0]['data']);
			
			this.setState((preState)=>{
				preState.data.rankResultInfo = message[0]['data'];
			},()=>{
				// 跳转结果页
				Taro.redirectTo({
					url: buildURL(_this.state.routers.resultPage, {
						item:{
							'rankResultInfo': message[0]['data'],
							'rankUserInfo': _this.state.local_data.rankUserInfo
						}
					})
				})
			});
		});
	}

	componentDidHide () {
		console.info('rank-enterGame: ~DidHide拉~');
		clearInterval(this.state.data.timer);
	}
	
	// 接受到的问题答案数据放入数组, 同时设置答案optionId
	resetQA(message){
		let data = JSON.parse(JSON.stringify(message));
		data['options'] = [];
		data['options'].push({key:'A', value: data['option1'], optionId: 1},{key: 'B', value: data['option2'], optionId: 2}, {key:'C', value: data['option3'], optionId: 3}, {key:'D', value: data['option4'], optionId: 4})
		delete data['option1'];
		delete data['option2'];
		delete data['option3'];
		delete data['option4'];
		return data;
	}

	// 开始倒计时
	getCountdown(time){
		let _this = this;
		clearInterval(this.state.data.timer);

		// 隐藏遮罩，可选择答案
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
		let matchingRequest = this.msgProto.submitAnswer(data)
		let parentModule = this.msgProto.parentModule(matchingRequest);

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

	// 请求道具数量
	getMatchProps(){
		let getMatchProps = this.msgProto.getMatchProps()
		let parentModule = this.msgProto.parentModule(getMatchProps);
		this.webSocket.sendWebSocketMsg({
			data: parentModule,
			success(res) {},
			fail(err) { console.log(err) }
		});
	}

	// 使用道具
	usedProps(e){
		// id(1.求助卡;2.延时卡)
		let id = e.currentTarget.dataset.id;
		// status 是否可用道具
		let status = e.currentTarget.dataset.status;
		// 延迟卡增加的时间， 求助卡时间0
		let time = e.currentTarget.dataset.time;
		
		console.error('道具使用 ==>');
		console.info('(id: ' + id + ')','(status: ' + status + ')', '(time: ' + time + ')');

		let getMatchProps = this.msgProto.usedPropsMatch(id)
		let parentModule = this.msgProto.parentModule(getMatchProps);
		this.webSocket.sendWebSocketMsg({
			data: parentModule,
			success(res) { console.info(res)},
			fail(err) { console.log(err) }
		});
	}
	
	render () {
		const { defultClass, defultBottomClass, isShowMask, isShowLoading, selectedOptionIndex, countdown, scoreTeamA, 
			scoreTeamB, selfScore, delayCardBtn, helpCardBtn, rankUserInfo, PartyATeam, PartyBTeam, 
			matchProps, used_delayCardResult, used_helpCardResult, disable_delayCardBtn, disable_helpCardBtn, 
		} = this.state.local_data;
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
			return  <View onClick={this.submitAnswer.bind(this)} 
						data-curOptionIndex={index} // 当前题的index
						data-currQuestId={currQuestId}
						data-quesIndex={currIndex}
						data-optionId={currentValue.optionId}
					className={`optionWarp
						${ selectedOptionIndex == index? defultBottomClass:'' }
						${ index == used_helpCardResult.errorId1-1 || index == used_helpCardResult.errorId2-1? 'flaseOptionBottom':'' } `}
					>
						<View
							className={`option 
								${ selectedOptionIndex == index? defultClass:'' }
								${ index == used_helpCardResult.errorId1-1 || index == used_helpCardResult.errorId2-1? 'falseOption':'' } `}>
							<View className='optionMark'>{currentValue.key}</View>
							<View className='optionContent'>{currentValue.value}</View>
						</View>
					</View>
		});

		return (
			<View className='rankenterGame'>
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
							<View onClick={this.usedProps.bind(this)} className='cardBtn'
								data-id={used_delayCardResult.id}
								data-time={used_delayCardResult.time}
								data-status={used_delayCardResult.delayCard} >
								<Image src={`${used_delayCardResult.delayCard == 0? disable_delayCardBtn : delayCardBtn }`} 
									className='delayCardBtn'/>
								<Text className='card-num'>{matchProps.delayCount}</Text>
							</View>

							<View onClick={this.usedProps.bind(this)}  className='cardBtn'
								data-id={used_helpCardResult.id}
								data-time={used_helpCardResult.time}
								data-status={used_helpCardResult.helpCard} >
								<Image src={`${used_helpCardResult.helpCard == 0? disable_helpCardBtn : helpCardBtn }`}
									className='helpCardBtn'/>
								<Text className='card-num'>{matchProps.helpCount}</Text>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}