import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
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
				rule:[
					'1.玩家每天前5次出题获得20金币奖励，超过5题不再奖励金币。',
					'2.任意所出题目被其他玩家审核超过20次，且点赞数-反对数≥10，奖励出题玩家50金币。',
					'3.系统审核通过，奖励出题玩家100金币。'
				]
			},

			// 前台数据
			local_data:{
				ruleText: '玩法:',
				writeQuestionText: '出题',
				writeQuestionAnnalText: '出题记录',
				isBtnType: 2, // 0：出题  1:出题记录
			}

		}
	}

  	componentWillMount () {}

  	componentDidMount () {
		console.log(this.state.local_data.isBtnType)
	}
	
	componentWillUnmount () {}

	componentDidShow () { }

	componentDidHide () { }
	
	// 跳转出题页
	goWirteQuestionPage(){
		this.setState((oldState)=>{
			this.state.local_data.isBtnType = 0;
			let data_ = this.state.local_data;
			return{
				local_data: data_
			}
		},()=>{
			Taro.navigateTo({
				url: this.state.routers.writeQuestionPage
			})
		})
	}

	// 跳转出题记录页
	goWirteQuestionAnnalPage(){
		this.setState((oldState)=>{
			this.state.local_data.isBtnType = 1;
			let data_ = this.state.local_data;
			return{
				local_data: data_
			}
		},()=>{
			Taro.navigateTo({
				url: this.state.routers.writeQuestionAnnalPage
			})
		})
	}

	render () {
		const  {ruleText, writeQuestionText, writeQuestionAnnalText, isBtnType} = this.state.local_data;
		const rule = this.state.data.rule;

		const content = rule.map((currentValue, index) => {
			return  <View className='tab'>
						{currentValue}
					</View>
		})

		return (
			<View className='index'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='wirteQuestionBox'>
							<View className='wirteQuestion'>
								<View className='btns'>
									<View onClick={this.goWirteQuestionPage.bind(this)} className='writeQuestionWrap'>
										<View className={`writeQuestion ${ isBtnType === 0?'selectedBtn':''}` } >{writeQuestionText}</View>
									</View>
									<View onClick={this.goWirteQuestionAnnalPage.bind(this)} className='writeQuestionWrap'>
										<View className={`writeQuestion ${ isBtnType === 1?'selectedBtn':''}` }>{writeQuestionAnnalText}</View>
									</View>
								</View>
								<View className='tipList'>
									<View>{ruleText}</View>
									{content}
								</View>
							</View>
						</View>
					</View>
				</View>
			</View>
		)
	}
}