import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { Api } from '../../service/api'

import './index.scss'

export class TakeMoneyAnnal extends Component {

	config: Config = {
		navigationBarTitleText: '提现记录',
		navigationBarBackgroundColor: 'rgba(138, 218, 255, 1)',
		navigationBarTextStyle: 'white',
	}

	constructor(props) {
		super(props);
		this.state = {
			// 后台返回数据
			data:{
				annalSum: 100.00,
				annal:[
					{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					},{
						info: '提现至QQ钱包',
						time: '11月24日 11：22：33',
						money: '-10.00',
					}
				]
			},

			// 前台数据
			takeMoney_data:{
				balanceTip: '已提现金额',
				rmb: '元',
			}

		}
	}

  	componentWillMount () {}

  	componentDidMount () {}
	
	componentWillUnmount () {}

	componentDidShow () { }

	componentDidHide () { }
	
	// 滑动事件
	onScroll(e){
		// console.log(e.detail);
	}


	render () {
		const annalList = this.state.data.annal;
		const annalSum = this.state.data.annalSum;
		const {balanceTip, rmb} = this.state.takeMoney_data;
		
		const content = annalList.map((currentValue, index) => {
			return 	<View className='tabs'>
						<View className='info'>
							<Text className='text' decode={true} space={true}>{balanceTip + '&nbsp;' + annalSum + '&nbsp;' +rmb}</Text>
							<View className='time'>{currentValue.time}</View>
						</View>
						<View className='money'>
							{currentValue.money}<Text>元</Text>
						</View>
					</View>
        });

		return (
			<View className='index'>
				<View className='bgColor'>
					<View className='bgImg'></View>
					<View className='body'>
						<View className='moneyBox'>
							<ScrollView className='moneyBody'
								scrollY
								onScroll={this.onScroll}
							>
								{content}
							</ScrollView>
						</View>
					</View>
				</View>
			</View>
		)
	}
}