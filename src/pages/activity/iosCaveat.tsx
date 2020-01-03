import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text, Button, ScrollView } from '@tarojs/components'
import './iosCaveat.scss'

export class IosCaveat extends Component {

	config: Config = {
		navigationBarTitleText: 'ios提示',
		navigationBarBackgroundColor: 'rgba(84, 135, 246, 1)',
	}

	constructor(props) {
		super(props);

		this.state = {

			data: {
			},

			local_data: {
				tipImg: 'https://oss.snmgame.com/v1.0.0/IOStip.png',
				logo: 'https://oss.snmgame.com/v1.0.0/logo.png'
			}
		};
	}

	componentWillMount() { }

	componentDidMount() { }

	componentWillUnmount() { }

	componentDidShow() { }

	componentDidHide() { }

	render() {
		const { tipImg, logo } = this.state.local_data;

		return (
			<View className='iosCaveat' catchtouchmove="ture">
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='content'>
						<Image src={logo} className='logo' />
						<Image src={tipImg} className='tipImg' />
					</View>
				</View>
			</View>
		)
	}
}