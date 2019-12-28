/* eslint-disable react/react-in-jsx-scope */
import Taro, { Component } from '@tarojs/taro';
import { View, Input, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export default class RedExchange extends Component {
	constructor(props) {
    super(props);
    this.state = {
      local_data: {
        title: '红包卡兑换',
        tip: '红包卡兑换数量:',
        cancelBtnText: '取消',
        confirmBtnText: '兑换',
        confirmType: '完成',
        minLength: 1,
        maxLength: 5,
        curValue: 1, // 提交给后台的数量
        addIcon: 'https://oss.snmgame.com/v1.0.0/addIcon.png',
        removeIcon: 'https://oss.snmgame.com/v1.0.0/removeIcon.png',
        closeImgBtn: 'https://oss.snmgame.com/v1.0.0/closeBtn.png'
      }
    };
  }

  componentWillMount() {}

  componentDidMount() {
    this.eventEmitter = emitter.addListener('getWebSocket', message => {
      console.warn(message, 'abc');
      // this.setState({
      // 	gender: message
      // },()=>{
      // 	console.log(this.state.gender);
      // })
    });
  }

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  // 关闭签到弹窗,传给父组件关闭标示
  closeToast(value) {
    let data_ = {
      isShowToast: false
    };
    emitter.emit('closeToast_RedEnvelopeConvert', data_);
  }

  // 发送给后台确认的兑换红包数量
  submitMessage(val) {
    const curValue = this.state.local_data.curValue;
    let data_ = {
      redEnvelopeNum: curValue
    };
    emitter.emit('RedEnvelopeConvert', data_);
  }

  onChange(val) {
    let value = parseInt(val.detail.value);
    this.setState(
      () => {
        let data_ = this.state.local_data;
        this.state.local_data.curValue = value;
        return {
          data: data_
        };
      },
      () => {}
    );
  }

  // 加数
  add(value) {
    this.setState(
      oldState => {
        let data_ = this.state.local_data;
        this.state.local_data.curValue = value + 1;
        return {
          data: data_
        };
      },
      () => {}
    );
  }

  // 减数
  remove(value) {
    this.setState(
      oldState => {
        let data_ = this.state.local_data;
        this.state.local_data.curValue = value - 1;
        if (this.state.local_data.curValue < 1) this.state.local_data.curValue = 1;
        return {
          data: data_
        };
      },
      () => {}
    );
  }

  render() {
    const {
      closeImgBtn,
      cancelBtnText,
      confirmBtnText,
      title,
      tip,
      curValue,
      addIcon,
      minLength,
      maxLength,
      confirmType,
      removeIcon
    } = this.state.local_data;

    return (
      <View className="redExchange">
        <View className="content">
          <Image onClick={this.closeToast.bind(this)} src={closeImgBtn} className="closeImgBtn"></Image>
          <View className="title">{title}</View>
          <View className="body">
            <View className="countBox">
              <View className="tip">{tip}</View>
              <View className="countWrap">
                <View className="add" onClick={this.add.bind(this, curValue)}>
                  <Image className="addIcon" src={addIcon}></Image>
                </View>
                <View className="inputBoard">
                  <Input
                    type="number"
                    onChange={this.onChange.bind(this)}
                    placeholder={curValue}
                    maxLength={maxLength}
                    minLength={minLength}
                    value={curValue}
                    confirmType={confirmType}
                  />
                </View>
                <View className="remove" onClick={this.remove.bind(this, curValue)}>
                  <Image className="removeIcon" src={removeIcon}></Image>
                </View>
              </View>
            </View>
            <View className="btns">
              <View onClick={this.closeToast.bind(this)} className="cancelBtn">
                {cancelBtnText}
              </View>
              <View onClick={this.submitMessage.bind(this)} className="confirmBtn">
                <View className="confirmBtn_">{confirmBtnText}</View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
}
