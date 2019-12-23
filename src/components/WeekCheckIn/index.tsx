import Taro, { Component } from '@tarojs/taro'
import { View, Image,  RadioGroup, Radio, Label } from '@tarojs/components'
import emitter from '../../service/events';
import './index.scss'

export default class WeekCheckIn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            local_data: {
                title: '签到',
                submitBtnText: '领取',
                shareText: '炫耀一下',
                shareChecked: true,
                isShowWeekCheckIn: false,
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
            data: {
                weekCheckIninfo: {},
                signInDays: 4, // 签到天数
            },
        }
    }

    componentWillMount () {
        let _this = this;
        // 接受签到基本数据
        this.eventEmitter = emitter.addListener('weekCheckIninfo_child', (message) => {

			console.info('～接受父组件签到基本信息：～');console.info(message);
			// 接受父组件签到基本信息
			_this.setState((preState)=>{
				preState.weekCheckIninfo = message;
			},()=>{});
			
		});
    }

    componentDidMount() {}

    componentWillUnmount () {}

    componentDidShow () {}

    componentDidHide () { }

    // 关闭签到弹窗,传给父组件关闭标示
    closeWeekCheckIn(value){
        this.setState((preState)=>{
            preState.local_data.isShowWeekCheckIn = !value;
        },()=>{});
        emitter.emit('closeWeekCheckIn', !value);
    }

    // 是否勾选炫耀一下
    shareCheckedChange(value){
        console.info('%c 签到是否同意炫耀一下 ====》' + value, 'font-size:14px;color:#9bff1f;');
        this.setState((preState) => {
            preState.local_data.shareChecked = !value;
        });
    }

    // 领取奖励
    receiveAward(value){
        this.setState((preState) => {
            preState.local_data.curRewardStatus = !value;
            preState.local_data.isShowWeekCheckIn = false;
        },()=>{
            emitter.emit('curRewardStatus', {receiveReward: 1, shareCheckedChange: this.state.local_data.shareChecked, isShowWeekCheckIn: this.state.local_data.isShowWeekCheckIn);
        })
    }

    render() {
        const list_day = this.state.local_data.list_day;
        const signInDays = this.state.data.signInDays; // 签到天数

        const { title, curRewardStatus, submitBtnText, shareChecked, shareText, isShowWeekCheckIn, closeImgBtn  } = this.state.local_data;

		const content = list_day.map((currentValue, index) => {
			return <View className={`item ${index === 6?'itemBig':''}`}>
                        <Image className={'checkInDays'} src={currentValue.coverImg}></Image>
                        <View className={`tip ${index > (signInDays-1)?'hide':''}`}>已领取</View>
                        <View className={`curDays ${index > (signInDays-1)?'OffsetTop':''}`}>{currentValue.day}</View>
                    </View>
        });
        
        return (
            <View className='index'>
                <Image onClick={this.closeWeekCheckIn.bind(this,isShowWeekCheckIn)} src={closeImgBtn} className='closeImgBtn'></Image>
                <View className='content'>
                    
                    <View className='title'>{title}</View>
                    <View className='body'>
                        {content}
                    </View>

                    <View className='submitBtnBox'>
                        <View className='submitBtn'>
                            <View onClick={this.receiveAward.bind(this,curRewardStatus)} className='submitBtn_'>
                                {submitBtnText}
                            </View>
                        </View>
                    </View>
                    
                    <View className='checkBoxOption'>
                        <RadioGroup className='checkBox'>
                            <Label className='share_label' for='1' key='1'>
                                <Radio className='radio_' value={this.state.data.shareText} onClick={this.shareCheckedChange.bind(this,shareChecked)} checked={shareChecked}>{shareText}</Radio>
                            </Label>
                        </RadioGroup>
                    </View>
                </View>
            </View>    
        )
    }
}