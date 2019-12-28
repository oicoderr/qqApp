import Taro, { Component, Config } from '@tarojs/taro'
import { View, Textarea } from '@tarojs/components'
import { Api } from '../../service/api'

import './index.scss'

export class WriteQuestion extends Component {

	config: Config = {
		navigationBarTitleText: '出题',
		navigationBarBackgroundColor: 'rgba(138, 218, 255, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			// 路由
			routers:{
				writeQuestionPage: '',
				writeQuestionAnnalPage: '',
			},

			// 后台返回数据
			data:{
				
			},

			// 前台数据
			local_data:{
				
				btns:{
					nextText: '下一步',
					lookRule: '出题规则'
				},

				answers:[
					{
						id: '0',
						placeholderText: '填写题干（12-35 字之间）',
						maxLength: 35,
						minLength: 12,
						icon: ''
					},{
						id: '1',
						placeholderText: '填写正确答案（1-10 字之间）',
						maxLength: 10,
						minLength: 1,
						icon: 'https://oss.snmgame.com/v1.0.0/correctIcon.png',
					},{
						id: '2',
						placeholderText: '填写错误答案（1-10 字之间）',
						maxLength: 10,
						minLength: 1,
						icon: 'https://oss.snmgame.com/v1.0.0/mistakeIcon.png',
					},{
						id: '3',
						placeholderText: '填写错误答案（1-10 字之间）',
						maxLength: 10,
						minLength: 1,
						icon: 'https://oss.snmgame.com/v1.0.0/mistakeIcon.png',
					},{
						id: '4',
						placeholderText: '填写错误答案（1-10 字之间）',
						maxLength: 10,
						minLength: 1,
						icon: 'https://oss.snmgame.com/v1.0.0/mistakeIcon.png',
					}
				],
				ruleText: '玩法:',
				knowledgeText: '音乐知识',
				listenMusic: '听音识曲',
				isBtnType: true, // true: 音乐知识  false: 听音识曲
			}

		}
	}

  	componentWillMount () {}

  	componentDidMount () {}
	
	componentWillUnmount () {}

	componentDidShow () { }

	componentDidHide () { }
	
	// 打开音乐知识出题界面
	openKnowledgeTab(){
		this.setState((oldState)=>{
			this.state.local_data.isBtnType = true;
			let data_ = this.state.local_data;
			return{
				local_data: data_
			}
		},()=>{
			
		})
	}

	onBlur(e){
		let value = e.target.value;
		let id = e.target.id;
		let len = value.length;
		let answers = this.state.local_data.answers;
		console.log(answers[parseInt(id)]['minLength'])
		switch (id){
			case '0':
				if(len < answers[parseInt(id)]['minLength']){
					Taro.showToast({
						title: '字数不能少于' + answers[parseInt(id)]['minLength'] + ' 个字！'
						icon: 'none',
						duration: 1000,
					});
				}
				break;
			case '1':
				if(len < answers[parseInt(id)]['minLength']){
					Taro.showToast({
						title: '字数不能少于' + answers[parseInt(id)]['minLength'] + ' 个字！'
						icon: 'none',
						duration: 1000,
					});
				}
				break;
			case '2':
				if(len < answers[parseInt(id)]['minLength']){
					Taro.showToast({
						title: '字数不能少于' + answers[parseInt(id)]['minLength'] + ' 个字！'
						icon: 'none',
						duration: 1000,
					});
				}
				break;
			case '3':
				if(len < answers[parseInt(id)]['minLength']){
					Taro.showToast({
						title: '字数不能少于' + answers[parseInt(id)]['minLength'] + ' 个字！'
						icon: 'none',
						duration: 1000,
					});
				}
				break;
			case '4':
				if(len < answers[parseInt(id)]['minLength']){
					Taro.showToast({
						title: '字数不能少于' + answers[parseInt(id)]['minLength'] + ' 个字！'
						icon: 'none',
						duration: 1000,
					});
				}
				break;
				default
		}
	}

	// 打开听音识曲出题界面
	openListeningMusicTab(){
		this.setState((oldState)=>{
			this.state.local_data.isBtnType = false;
			let data_ = this.state.local_data;
			return{
				local_data: data_
			}
		},()=>{
			
		})
	}

	render () {
		const { knowledgeText, listenMusic, isBtnType, answers } = this.state.local_data;
		const { nextText, lookRule } = this.state.local_data.btns;
		const content = answers.map((currentValue, index) => {
			return  <View className={`topicInputTab ${index > 0?'otherTopicInputTab':''}`}>
						<Textarea onInput={this.onInput.bind(this)} onBlur={this.onBlur.bind(this)} id={currentValue.id} className={`topicInput ${index > 0?'otherTopicinput':''}`} minlength={currentValue.minLength} maxlength={currentValue.maxLength} autoFocus placeholder={currentValue.placeholderText} />
						<Image className={`${index > 1?'icon':'bigIcon'}`} src={currentValue.icon}></Image>
					</View>
		})

		return (
			<View className='index'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='wirteQuestionBox'>
							<View className='wirteQuestion'>
								<View className='topBtns'>
									<View className={`writeQuestionWrap ${ isBtnType?'resetBorder':''}` }>
										<View onClick={this.openKnowledgeTab.bind(this)} className={`writeQuestion ${ isBtnType?'selectedBtn':''}` } >{knowledgeText}</View>
									</View>
									<View className={`writeQuestionWrap ${ isBtnType?'':'resetBorder'}` }>
										<View onClick={this.openListeningMusicTab.bind(this)} className={`writeQuestion ${ isBtnType?'':'selectedBtn'}` }>{listenMusic}</View>
									</View>
								</View>
								<View className='topicBox'>
									{content}
								</View>
								<View className='bottomBtns'>
									<View className='lookRule'>
										<View>{lookRule}</View>
									</View>
									<View className='nextText'>
										<View>{nextText}</View>
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