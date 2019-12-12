import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import './entrance.scss'

export class RedEnvelopeEntrance extends Component {

	config: Config = {
		navigationBarTitleText: '红包赛',
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
				
			}

		}
	}

  	componentWillMount () {}

  	componentDidMount () {

	}
	
	componentWillUnmount () {}

	componentDidShow () { }

	componentDidHide () { }

	render () {

		return (
			<View className='index'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						
					</View>
				</View>
			</View>
		)
	}
}