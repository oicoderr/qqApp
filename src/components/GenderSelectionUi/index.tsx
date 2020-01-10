import Taro, { Component } from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

var app = Taro.getApp();

export default class GenderSelectionUi extends Component {
  constructor(props) {
    super(props);
    this.state = {

      local_data: {
        title: '请选定你的乐队主唱性别',
        remark: '（性别一旦确认无法更换）',
        boyImg: 'https://oss.snmgame.com/v1.0.0/boyImg.png',
        girlImg: 'https://oss.snmgame.com/v1.0.0/girlImg.png',
        gender: 0,
        boyLogo: 'https://oss.snmgame.com/v1.0.0/boyLogo.png',
        girlLogo: 'https://oss.snmgame.com/v1.0.0/girlLogo.png',
        boyLogoTxt: '男生',
        girlLogoTxt: '女生',
        confirmTxt: '确认',
        isSlectGender: false // 女
      }
    };
  }

  componentWillMount() { }

  componentDidMount() { }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  // 发送子给父组件消息
  handleClick(that) {
    let gender = this.state.local_data.gender;
    emitter.emit('genderMessage', gender);
  }

  // 选择性别
  selectedGender = (gender) => {
    console.log()
    this.setState((preState) => {
      preState.local_data.gender = gender;
      preState.local_data.isSlectGender = Boolean(gender);
    })
  }

  render() {
    const { isSlectGender, girlLogo, boyLogo, girlImg, boyImg, title, remark, boyLogoTxt, girlLogoTxt, confirmTxt } = this.state.local_data;
    return (
      <View className="genderSelectionUi">
        <View className="body">
          <View className="head">
            <Text className="title">{title}</Text>
            <Text className="remark">{remark}</Text>
          </View>

          <View className="personWrap">
            <Image src={girlImg} className={`themePerson ${isSlectGender ? 'hide' : ''}`}></Image>
            <Image src={boyImg} className={`themePerson ${isSlectGender ? '' : 'hide'}`}></Image>
          </View>

          <View className="genders">
            <View className="gender_ leftMargin" onClick={this.selectedGender.bind(this, 1)}>
              <View className={`btn ${isSlectGender ? 'slectGender' : ''} `}>
                <Image src={boyLogo} className="boyLogo"></Image>
              </View>
              <View className="genderText boyText">{boyLogoTxt}</View>
            </View>

            <View className="gender_ rightMargin" onClick={this.selectedGender.bind(this, 0)}>
              <View className={`btn ${isSlectGender ? '' : 'slectGender'}`}>
                <Image src={girlLogo} className="girlLogo"></Image>
              </View>
              <View className="genderText girlText">{girlLogoTxt}</View>
            </View>
          </View>

          <View className="submitGender" onClick={this.handleClick.bind(this)}>
            {confirmTxt}
          </View>
        </View>
      </View>
    );
  }
}
