import Taro, { Component, Config } from '@tarojs/taro'
import { View, Textarea, Text, Image, Input } from '@tarojs/components'
import { createWebSocket } from '../../service/createWebSocket'
import { websocketUrl } from '../../service/config'
import './opinion.scss'

import emitter from '../../service/events'
import MsgProto from '../../service/msgProto'

const App = Taro.getApp();

export class Opinion extends Component {
	config: Config = {
		navigationBarTitleText: '反馈',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);

		this.state = {
			routers:{
				indexPage: '/pages/index/index',
			},

			data:{},

			local_data:{
				// 反馈内容
				contentVal: '',
				contactVal: '',
				textareaVal: '',
				inputVal: '',
				placeholder: '请输入内容（200字内）',
				contactTip: '联系方式',
				tip1: 'Tips：我们将对优质反馈予以奖励',
				tip2: '或者直接联系我们的客服小姐姐',
				tip3: '娑娜:',
				tipQQ: '3438538225',
				maxlength: 200,
				qqIcon: 'https://oss.snmgame.com/v1.0.0/qqIcon.png',
				backBtn: 'https://oss.snmgame.com/v1.0.0/backBtn.png',
				opinionTitleImg: 'https://oss.snmgame.com/v1.0.0/opinionTitleImg.png',
				submitBtn: 'https://oss.snmgame.com/v1.0.0/submitBtn.png',
			}
		};
		this.msgProto = new MsgProto();
	}

	componentWillMount () {}

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

		// 2202 监听反馈结果
		this.eventEmitter = emitter.addListener('getOpinionResult', (message) => {
			clearInterval(message[1]);
			
			if(message[0]['data']['value']){
				Taro.showToast({
					title: '反馈成功',
					icon: 'none',
					duration: 2000
				});
				this.setState((preState)=>{
					preState.local_data.textareaVal = ' ';
					preState.local_data.inputVal = ' ';
				},()=>{})
			}else{
				Taro.showToast({
					title: '反馈失败',
					icon: 'none',
					duration: 2000
				});
			}
		});
	}

	componentDidHide () {
		emitter.removeAllListeners('getOpinionResult');
	}

	// 返回上一页
	goBack(){
		let indexPage = this.state.routers.indexPage;
		Taro.reLaunch({
			url: indexPage
		});
	}
	// 记录反馈内容
	onInput(e){
		let detail = e.detail.value;
		let cursor = e.detail.cursor;
		console.log(e)
		this.setState((preState)=>{
			preState.local_data.contentVal = detail;
		});
	}
	// 记录联系方式
	contactInput(e){
		let detail = e.detail.value;
		this.setState((preState)=>{
			preState.local_data.contactVal = detail;
		});
	}

	// 提交反馈
	submit(){
		// 发送反馈信息
		let contentVal = String(this.state.local_data.contentVal);
		let contactVal = this.state.local_data.contactVal;
		let data = {
			content: contentVal,
			contact: contactVal,
		};

		if(contentVal.length > 9){
			let opinion = this.msgProto.opinion(data);
			let parentModule = this.msgProto.parentModule(opinion);
			this.websocket.sendWebSocketMsg({
				data: parentModule,
				success(res) {console.log('发送反馈信息Success')},
				fail(err){
					Taro.showToast({
						title: err.errMsg,
						icon: 'none',
						duration: 2000
					})
				}
			});
		}else{
			Taro.showToast({
				title: '请填写反馈内容',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 复制QQ好
	copyQQ(){
		var that = this;
		Taro.setClipboardData({
			//准备复制的数据
			data: that.state.local_data.tipQQ,
			success(res){
				Taro.showToast({
					title: '复制成功',
					duration: 1000,
				});
			}
		});
	}

	render () {
		const { opinionTitleImg, backBtn, submitBtn, placeholder, contactTip, textareaVal,inputVal,
			maxlength, qqIcon, tip1, tip2, tip3, tipQQ } = this.state.local_data;

		return (
			<View className='opinion'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<View className='head'>
							<View className='backBtnBox'>
								<Image onClick={this.goBack.bind(this)} src={backBtn} className='backBtn' />
							</View>
						</View>
						<View className='body'>
							<View className='opinionTitleWrap'>
								<Image src={opinionTitleImg} className='opinionTitle' />
							</View>
							<View className='opinionContent'>
								<View className='detailWrap'>
									<Textarea value={textareaVal} onInput={this.onInput.bind(this)} maxlength={maxlength} placeholder={placeholder} autoHeight autoFocus/>
								</View>
								<View className='contact'>
									<Input onInput={this.contactInput.bind(this)} value={inputVal} type='number' placeholder={contactTip} maxLength='11'/>
								</View>
								<View onClick={this.submit.bind(this)} className='submit'>
									<Image src={submitBtn} className='submitBtn' />
								</View>
								<View className='tip1'>
									{tip1}
								</View>
								<View className='tips'>
									<View className='tip2'>{tip2}</View>
									<View className='tip3'>
										<Image src={qqIcon} className='qqIcon'/>
										<Text decode='true' className='customer'>{tip3}&ensp;</Text>
										<Text onClick={this.copyQQ.bind(this)}>{tipQQ}</Text>
									</View>
								</View>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}