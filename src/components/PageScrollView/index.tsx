import Taro, { Component } from '@tarojs/taro'
import { View, ScrollView, Text } from '@tarojs/components'
import emitter from '../../service/events';
import './index.scss'

export class PageScrollView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '',
            body: ''
        }
    }

    componentWillMount () {}

    componentDidMount = () => {
        // console.log(this.props)
        if(this.props.ScrollViewData){
            let title = this.props.ScrollViewData.title;
            let body = this.props.ScrollViewData.body;
            this.setState({
                title: title,
                body: body
            });
        }else{
            Taro.showToast({
                title: '未接受到ScrollViewData',
                icon: 'none',
                mask: true,
                duration: 1500
            })
        }
    }

    componentWillUnmount () { }

    componentDidShow () {}

    componentDidHide () { }

    onScrollToUpper = (e) => {
        console.log(e.detail);
    }
    
    onScroll(e){
        console.log(e.detail);
    }
    // 发送子给父组件消息
    handleClick = (message) => {
        emitter.emit('changeMessage', message);
    };

    render() {
        const scrollTop = 0
        const Threshold = 20
        return (
            <View className='content'>
                <View className='title'>{this.state.title}</View>
                <ScrollView
                    className='scrollview'
                    scrollY
                    scrollWithAnimation
                    scrollTop={scrollTop}
                    lowerThreshold={Threshold}
                    upperThreshold={Threshold}
                    onScrollToUpper={this.onScrollToUpper.bind(this)} // 使用箭头函数的时候 可以这样写 `onScrollToUpper={this.onScrollToUpper}`
                    onScroll={this.onScroll}
                    onClick={this.handleClick.bind(this, '我是子组件返回给父组件的消息')}
                >
                    <Text className='body'>{this.state.body}</Text>
                </ScrollView>
                <View className='confirm'>
                    <View className='btnWrap'>
                        <View className='btn'>确认</View>
                    </View>
                </View>
            </View>
        )
    }
}