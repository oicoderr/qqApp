import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text, RadioGroup, Radio, Label } from '@tarojs/components'
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
                calendarIcon: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/calendarIcon.png',
                weekCheckIninfo: {},
                list_day:[
                    {
                        dayText: '第一天',
                        class: 'goldIconImg',
                    },{
                        dayText: '第二天',
                        class: 'cardIconImg',
                    },{
                        dayText: '第三天',
                        class: 'goldIconImg',
                    },{
                        dayText: '第四天',
                        class: 'cardIconImg',
                    },{
                        dayText: '第五天',
                        class: 'goldIconImg',
                    },{
                        dayText: '第六天',
                        class: 'cardIconImg',
                    },{
                        dayText: '第七天',
                        class: 'boxIconImg',
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
                preState.data.weekCheckIninfo = message;
                let weekCheckIninfo = JSON.parse(JSON.stringify(message));
                let list_day = preState.local_data.list_day;
                let list = weekCheckIninfo.list;
                list.map((cur, index)=>{
                    cur.dayText = list_day[index]['dayText'];
                    cur.class = list_day[index]['class'];
                });
                preState.local_data.weekCheckIninfo = weekCheckIninfo;
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
            emitter.emit('curRewardStatus', {
                // 领取当日奖励
                receiveReward: 1, 
                // 是否勾选炫耀分享
                shareCheckedChange: this.state.local_data.shareChecked
            });
        })
    }

    render() {
        const { day } = this.state.local_data.weekCheckIninfo;
        const list_day = this.state.local_data.weekCheckIninfo.list;

        const { title, curRewardStatus, submitBtnText, shareChecked, shareText, isShowWeekCheckIn, 
            closeImgBtn, calendarIcon  } = this.state.local_data;

		const content = list_day.map((currentValue, index) => {
			return <View className={`item ${index === 6?'itemBig':''}`}>
                        <View className={`checkInDays`}>
                            <View className={`tipText ${index < day?'tipText':'hide'}`}>已领取</View>
                            <Image className={`${currentValue.class}`} src={currentValue.icon}></Image>
                            <View className={`${currentValue.type == 1?'goldNum':'hide'}`}>{currentValue.count}</View>
                        </View>
                        <View className={`curDays ${index == list_day.length-1?'OffsetWidth':''}`}>{currentValue.dayText}</View>
                    </View>
        });
        
        return (
            <View className='index'>
                <View className='calendarIconWrap'>
                    <Image src={calendarIcon} className='calendarIcon' />
                </View>
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