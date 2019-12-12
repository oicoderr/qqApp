import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image,  RadioGroup, Radio, Label } from '@tarojs/components'
import emitter from '../../service/events';
import './index.scss'

export default class WeekCheckIn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {
                title: '签到',
                submitBtnText: '领取',
                shareText: '炫耀一下',
                shareChecked: true,
                isShow: true,
                curRewardStatus: false,
                closeImgBtn: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/closeBtn.png',
                list_day:[
                    {
                        day: '第一天',
                        coverImg: '',
                    },{
                        day: '第二天',
                        coverImg: ''
                    },{
                        day: '第三天',
                        coverImg: ''
                    },{
                        day: '第四天',
                        coverImg: ''
                    },{
                        day: '第五天',
                        coverImg: ''
                    },{
                        day: '第六天',
                        coverImg: ''
                    },{
                        day: '第七天',
                        coverImg: ''
                    }
                ]
            },
            // 后台数据
            CheckIn : {
                signInDays: 4, // 签到天数
            }
        }
    }

    componentWillMount () {}

    componentDidMount() {}

    componentWillUnmount () {}

    componentDidShow () {}

    componentDidHide () { }

    // 关闭签到弹窗,传给父组件关闭标示
    closeToast(value){
        this.setState((oldState)=>{
            let data_ = this.state.data;
            this.state.data.isShow = !value;
            return{
                data: data_
            }
        },()=>{
            emitter.emit('closeToastMessage', this.state.data.isShow);
        })
    }

    handleChange(value){
        // console.log('是否同意炫耀一下 ====》' + value);
        this.setState((oldState) => {
            let data_ = this.state.data;
            this.state.data.shareChecked = !value;
            return{
                data: data_
            }
        },()=>{
            emitter.emit('shareFlaunt', this.state.data.shareChecked);
        })
    }

    // 领取奖励
    receiveReward(value){
        this.setState((oldState) => {
            let data_ = this.state.data;
            this.state.data.curRewardStatus = !value;
            return{
                data: data_
            }
        },()=>{
            emitter.emit('curRewardStatus', this.state.data.shareChecked);
        })
    }

    render() {
        const list_day = this.state.data.list_day;
        const signInDays = this.state.CheckIn.signInDays; // 签到天数

		const content = list_day.map((currentValue, index) => {
			return <View className={`item ${index === 6?'itemBig':''}`}>
                        <Image className={'checkInDays'} src={currentValue.coverImg}></Image>
                        <View className={`tip ${index > (signInDays-1)?'hide':''}`}>已领取</View>
                        <View className={`curDays ${index > (signInDays-1)?'OffsetTop':''}`}>{currentValue.day}</View>
                    </View>
        });
        
        return (
            <View className='index'>
                <Image onClick={this.closeToast.bind(this,this.state.data.isShow)} src={this.state.data.closeImgBtn} className='closeImgBtn'></Image>
                <View className='content'>
                    
                    <View className='title'>{this.state.data.title}</View>
                    <View className='body'>
                        {content}
                    </View>

                    <View className='submitBtnBox'>
                        <View className='submitBtn'>
                            <View onClick={this.receiveReward.bind(this,this.state.data.curRewardStatus)} className='submitBtn_'>
                                {this.state.data.submitBtnText}
                            </View>
                        </View>
                    </View>
                    
                    <View className='checkBoxOption'>
                        <RadioGroup className='checkBox'>
                            <Label className='share_label' for='1' key='1'>
                                <Radio className='radio_' value={this.state.data.shareText} onClick={this.handleChange.bind(this,this.state.data.shareChecked)} checked={this.state.data.shareChecked}>{this.state.data.shareText}</Radio>
                            </Label>
                        </RadioGroup>
                    </View>
                </View>
            </View>    
        )
    }
}