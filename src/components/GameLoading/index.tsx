import Taro, { Component } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import './index.scss'

export default class GameLoading extends Component{
    constructor(props) {
        super(props);
        this.state = {
            // 默认组件数据
            local_data:{
                loadingText: '正在加载中，请稍后...',
                loadingGif: 'https://oss.snmgame.com/v1.0.0/LOAD.gif'
            }
        }
    }

    componentWillMount () {}

    componentDidMount() {}

    componentWillUnmount () {}

    componentDidShow () {}

    componentDidHide () {}

    render() {
        const { loadingGif, loadingText } = this.state.local_data;

        return (
            <View className='loading'>
                <View className='loadingGifWrap'>
                    <View className='loadingGif'>
                        <Image src={loadingGif} className='gif' />
                    </View>
                    <View className='text'>{loadingText}</View>
                </View>
            </View>
        )
    }
}