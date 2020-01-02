import Taro, { Component } from '@tarojs/taro';
import { View, Image, Text, RadioGroup, Radio, Label, Button } from '@tarojs/components';
import emitter from '../../service/events';
import { onShareApp } from '../../utils';
import './index.scss';

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
        closeImgBtn: 'https://oss.snmgame.com/v1.0.0/closeBtn.png',
        calendarIcon: 'https://oss.snmgame.com/v1.0.0/calendarIcon.png',
        weekCheckIninfo: {},
        list_day: [
          {
            dayText: '第一天',
            class: 'goldIconImg'
          },
          {
            dayText: '第二天',
            class: 'cardIconImg'
          },
          {
            dayText: '第三天',
            class: 'goldIconImg'
          },
          {
            dayText: '第四天',
            class: 'cardIconImg'
          },
          {
            dayText: '第五天',
            class: 'goldIconImg'
          },
          {
            dayText: '第六天',
            class: 'cardIconImg'
          },
          {
            dayText: '第七天',
            class: 'boxIconImg'
          }
        ]
      },
      // 后台数据
      data: {
        weekCheckIninfo: {},
        signInDays: 4 // 签到天数
      }
    };
  }

  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {
    let _this = this;
    // 接受签到基本数据
    this.eventEmitter = emitter.addListener('weekCheckIninfo_child', message => {
      console.log('～接受父组件签到基本信息：～');
      console.log(message);
      // 接受父组件签到基本信息
      _this.setState(
        preState => {
          preState.data.weekCheckIninfo = message;
          let weekCheckIninfo = JSON.parse(JSON.stringify(message));
          let list_day = preState.local_data.list_day;
          let list = weekCheckIninfo.list;
          list.map((cur, index) => {
            cur.dayText = list_day[index]['dayText'];
            cur.class = list_day[index]['class'];
          });
          preState.local_data.weekCheckIninfo = weekCheckIninfo;
        },
        () => {}
      );
    });
  }

  componentDidHide() {
    emitter.removeAllListeners('weekCheckIninfo_child');
  }

  // 关闭签到弹窗,传给父组件关闭标示
  closeWeekCheckIn(value) {
    this.setState(
      preState => {
        preState.local_data.isShowWeekCheckIn = !value;
      },
      () => {}
    );
    emitter.emit('closeWeekCheckIn', !value);
  }

  // 是否勾选炫耀一下
  shareCheckedChange(value) {
    console.log('%c 签到是否同意炫耀一下: ' + value, 'font-size:14px;color:#f04800;background:#000000;');
    this.setState(preState => {
      preState.local_data.shareChecked = !value;
    });
  }

  // 领取奖励
  receiveAward(value) {
    this.setState(
      preState => {
        preState.local_data.curRewardStatus = !value;
        preState.local_data.isShowWeekCheckIn = false;
      },
      () => {
        emitter.emit('curRewardStatus', {
          // 领取当日奖励
          receiveReward: 1,
          // 是否勾选炫耀分享
          shareCheckedChange: this.state.local_data.shareChecked
        });
      }
    );
  }

  // 签到分享，右上角分享
  onShareAppMessage(res) {
    let shareData = {
      title: '明星、热点、八卦知多少？一试便知！',
      path: '/pages/login/index',
      imageUrl: 'https://oss.snmgame.com/v1.0.0/shareImg.png',
      callback: status => {
        if (status.errMsg === 'shareAppMessage:fail cancel') {
          Taro.showToast({
            title: '分享失败',
            icon: 'none',
            duration: 2000
          });
        } else {
          Taro.showToast({
            title: '分享成功',
            icon: 'none',
            duration: 2000
          });
        }
      }
    };
    return onShareApp(shareData);
  }

  render() {
    const { day } = this.state.local_data.weekCheckIninfo;
    const list_day = this.state.local_data.weekCheckIninfo.list;

    const {
      title,
      curRewardStatus,
      submitBtnText,
      shareChecked,
      shareText,
      isShowWeekCheckIn,
      closeImgBtn,
      calendarIcon
    } = this.state.local_data;

    const content = list_day.map((currentValue, index) => {
      return (
        <View className={`item ${index === 6 ? 'itemBig' : ''}`}>
          <View className={`checkInDays`}>
            <View className={`tipText ${index < day ? 'tipText' : 'hide'}`}>已领取</View>
            <Image className={`${currentValue.class}`} src={currentValue.icon}></Image>
            <View className={`${currentValue.type == 1 ? 'goldNum' : 'hide'}`}>{currentValue.count}</View>
          </View>
          <View className={`curDays ${index == list_day.length - 1 ? 'OffsetWidth' : ''}`}>{currentValue.dayText}</View>
        </View>
      );
    });

    return (
      <View className="weekCheckIn">
        <View className="calendarIconWrap">
          <Image src={calendarIcon} className="calendarIcon" />
        </View>
        <Image
          onClick={this.closeWeekCheckIn.bind(this, isShowWeekCheckIn)}
          src={closeImgBtn}
          className="closeImgBtn"
        ></Image>
        <View className="content">
          <View className="title">{title}</View>
          <View className="body">{content}</View>

          <View className="submitBtnBox">
            <View className="submitBtn">
              <Button openType="share" onClick={this.receiveAward.bind(this, curRewardStatus)} className="submitBtn_">
                {submitBtnText}
              </Button>
            </View>
          </View>

          <View className="checkBoxOption">
            <RadioGroup className="checkBox">
              <Label className="share_label" for="1" key="1">
                <Radio
                  className="radio_"
                  value={this.state.data.shareText}
                  onClick={this.shareCheckedChange.bind(this, shareChecked)}
                  checked={shareChecked}
                >
                  {shareText}
                </Radio>
              </Label>
            </RadioGroup>
          </View>
        </View>
      </View>
    );
  }
}
