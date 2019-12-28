import Taro, { Component } from '@tarojs/taro';
import { View, Text, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export default class GenderSelectionUi extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '请选定你的乐队主唱性别',
      remark: '（性别一旦确认无法更换）',
      boyImg: 'https://oss.snmgame.com/v1.0.0/personTheme.png',
      girlImg: 'https://oss.snmgame.com/v1.0.0/personTheme.png',
      gender: 0,
      boyLogo: 'https://oss.snmgame.com/v1.0.0/boyLogo.png',
      girlLogo: 'https://oss.snmgame.com/v1.0.0/girlLogo.png',
      isSlectGender: false // 女
    };
  }

  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  // 发送子给父组件消息
  handleClick(that) {
    emitter.emit('genderMessage', this.state.gender);
  }

  // 选择性别
  selectedGender = gender => {
    this.setState(
      {
        gender: gender,
        isSlectGender: Boolean(gender)
      },
      () => {
        // console.log(gender, Boolean(gender))
      }
    );
  };

  render() {
    return (
      <View className="content">
        <View className="body">
          <View className="head">
            <Text className="title">{this.state.title}</Text>
            <Text className="remark">{this.state.remark}</Text>
          </View>

          <View className="personWrap">
            <Image src={this.state.girlImg} className="themePerson"></Image>
          </View>

          <View className="genders">
            <View className="gender_ leftMargin" onClick={this.selectedGender.bind(this, 1)}>
              <View className={`btn ${!this.state.isSlectGender ? '' : 'slectGender'} `}>
                <Image src={this.state.boyLogo} className="boyLogo"></Image>
              </View>
              <View className="genderText boyText">男生</View>
            </View>

            <View className="gender_ rightMargin" onClick={this.selectedGender.bind(this, 0)}>
              <View className={`btn ${!this.state.isSlectGender ? 'slectGender' : ''} `}>
                <Image src={this.state.girlLogo} className="girlLogo"></Image>
              </View>
              <View className="genderText girlText">女生</View>
            </View>
          </View>

          <View className="submitGender" onClick={this.handleClick.bind(this)}>
            确定
          </View>
        </View>
      </View>
    );
  }
}
