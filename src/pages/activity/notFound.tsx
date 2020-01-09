import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import './notFound.scss'

export class NotFound extends Component {

	config: Config = {
		navigationBarTitleText: '404-NotFound',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);

		this.state = {

			routers: {
				indexPage: '/pages/index/index'
			},

			data: {},

			local_data: {
				bg: 'https://oss.snmgame.com/v1.0.0/notFoundBg.png',
				homeBtn: 'https://oss.snmgame.com/v1.0.0/homeBtn.png'
			}
		};
	}

	componentWillMount() { }

	componentDidMount() { }

	componentWillUnmount() { }

	componentDidShow() { }

	componentDidHide() { }

	backIndex(){
		let indexPage = this.state.routes.indexPage;
		Taro.reLaunch({
			url: indexPage,
		})
	}

	render() {
		const { bg, homeBtn } = this.state.local_data;

		return (
			<View className='notFound' catchtouchmove="ture">
				<View className='bgColor'>
					<View className='bgImg'>
						<Image src={bg} className='bg' />
					</View>
					<View className='content'>
						<Image src={homeBtn} className='homeBtn' onClic={this.backIndex.bind(this)}/>
					</View>
				</View>
			</View>
		)
	}
}