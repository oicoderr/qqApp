import Taro, { Component } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export default class CommonToast extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // 动态数据
      data: {
        title: '提现',
        money: 10,
        tip: '确认提取'
      },

      // 默认组件数据
      local_data: {
        cancelBtnText: '取消',
        confirmBtnText: '确认',
        closeImgBtn: 'https://oss.snmgame.com/v1.0.0/closeBtn.png'
      }
    };
  }

  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {
    let _this = this;
    this.eventEmitter = emitter.addListener('takeMoneyMessaeg', message => {
      console.warn('接受父组件（takeMoney）提现金额==>');
      console.log(message);
      _this.setState(
        () => {
          _this.state.data.money = message.money;
          let data_ = _this.state.data;
          return {
            data: data_
          };
        },
        () => {}
      );
    });
  }

  componentDidHide() {
    emitter.removeAllListeners('takeMoneyMessaeg');
  }

  // 关闭签到弹窗,发送父组件关闭标示
  closeToast(value) {
    let data = {
      isShowToast: value
    };
    emitter.emit('closeToast_CommonToast', data);
  }

  // 发送给父组件的提现金额
  submit(value) {
    let data = {
      takeMoney: value,
      isShowToast: false
    };
    emitter.emit('submitTakeMoney', data);
  }

  render() {
    const isShowToast = false;
    const { closeImgBtn, cancelBtnText, confirmBtnText } = this.state.local_data;
    const { title, tip, money } = this.state.data;

    return (
      <View className="commonToast">
        <View className="content">
          <Image onClick={this.closeToast.bind(this, isShowToast)} src={closeImgBtn} className="closeImgBtn"></Image>
          <View className="title">{title}</View>
          <View className="body">{tip + money + '元？'}</View>

          <View className="btns">
            <View onClick={this.submit.bind(this, money)} className="confirmBtn">
              <View className="confirmBtn_">{confirmBtnText}</View>
            </View>
            <View onClick={this.closeToast.bind(this, isShowToast)} className="cancelBtn">
              {cancelBtnText}
            </View>
          </View>
        </View>
      </View>
    );
  }
}
