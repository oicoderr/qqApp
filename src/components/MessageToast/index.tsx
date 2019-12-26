import Taro, { Component } from '@tarojs/taro'
import { View, ScrollView, Text, Image } from '@tarojs/components'
import emitter from '../../service/events';
import './index.scss'

export class MessageToast extends Component {
    constructor(props) {
        super(props);
        this.state.data = {
            title: '提示',
            body: '内容',
            confirmBtn: 'https://oss.snmgame.com/v1.0.0/confirmBtn.png',
            closeImgBtn: 'https://oss.snmgame.com/v1.0.0/closeBtn.png',
        }
    }

    componentWillMount () {}

    componentDidMount = () => {
        // 接受各种提示说明
		this.eventEmitter = emitter.addListener('messageToast', (message) => {
            let title = message.title;
            let body = message.body.list;
            this.setState((preState)=>{
                preState.data.title = title;
                let content: string = '';
                for(let i = 0; i < body.length; i++){
                    content += body[i] + '\n';
                }
                preState.data.body = content;
            });
		});
    }

    componentWillUnmount () { }

    componentDidShow () {}

    componentDidHide () { }

    // 关闭弹窗
    cancel(e){
        this.closeToast();
    }

    // 确认信息
    confirm(e){
        this.closeToast();
    }

    // 父组件发送关闭弹窗消息
    closeToast(){
        emitter.emit('closeMessageToast', {closeMessageToast: 1 });
    }

    render() {
        const scrollTop = 0
        const Threshold = 20
        const { title, body, confirmBtn, closeImgBtn } = this.state.data;
        return (
            <View className='messageToast'>
                <View className='content'>
                    <View onClick={this.cancel.bind(this)} className='closeImgBtnWrap'>
                        <Image src={closeImgBtn} className='closeImgBtn' />
                    </View>
                    <View className='box'>
                        <View className='title'>{title}</View>
                        <ScrollView
                            className='scrollview'
                            scrollY
                            scrollWithAnimation
                            scrollTop={scrollTop}
                            lowerThreshold={Threshold}
                            upperThreshold={Threshold}
                        >
                            <Text className='body' decode={true}>{body}</Text>
                        </ScrollView>
                        <View className='confirm'>
                            <Image onClick={this.confirm.bind(this)} src={confirmBtn} className='confirmBtn' />
                        </View>
                    </View>
                </View>
            </View>
        )
    }
}