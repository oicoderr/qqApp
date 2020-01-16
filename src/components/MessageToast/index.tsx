import Taro, { Component } from '@tarojs/taro';
import { View, ScrollView, Text, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export class MessageToast extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        confirmBtn: 'https://oss.snmgame.com/v1.0.0/sureBtn.png',
        closeImgBtn: 'https://oss.snmgame.com/v1.0.0/closeBtn.png'
      },
      userAgreement_data: []
    };
  }

  componentWillMount() { }

  componentDidMount = () => {

  };

  componentWillUnmount() { }

  componentDidShow() {
    // 接受各种提示说明
    this.eventEmitter = emitter.addListener('messageToast', message => {
      if (message['type'] == undefined) {
        let title = message.title;
        let bodyList = message.body.list;
        this.setState(preState => {
          preState.data.title = title;
          let content: string = '';
          for (let i = 0; i < bodyList.length; i++) {
            content += bodyList[i] + '\n';
          }
          preState.data.body = content;
        });
      } else {
        this.setState(preState => {
          preState.userAgreement_data = message;
        });
      }
    });
  }

  componentDidHide() {
    emitter.removeAllListeners('messageToast');
  }

  // 关闭弹窗
  cancel(e) {
    this.closeToast();
  }

  // 确认信息
  confirm(e) {
    this.closeToast();
  }

  // 父组件发送关闭弹窗消息
  closeToast() {
    emitter.emit('closeMessageToast', { closeMessageToast: 1 });
  }

  render() {
    const scrollTop = 0;
    const Threshold = 20;
    const { title, body, confirmBtn, closeImgBtn } = this.state.data;
    const { Headline, list } = this.state.userAgreement_data;
    const content = list.map(cur => {
      return (
        <View className="item">
          <View className="title" decode={true}>
            {cur.title}
          </View>
          <Text className="body" decode={true}>
            {cur.body}
          </Text>
        </View>
      );
    });
    return (
      <View className="messageToast">
        <View className="content">
          <View onClick={this.cancel.bind(this)} className="closeImgBtnWrap">
            <Image src={closeImgBtn} className="closeImgBtn" />
          </View>
          <View className="box">
            <View className="title">{body ? title : Headline}</View>
            <ScrollView
              className="scrollview"
              scrollY
              scrollWithAnimation
              scrollTop={scrollTop}
              lowerThreshold={Threshold}
              upperThreshold={Threshold}
            >
              <Text className={`body ${body ? '' : 'hide'}`} decode={true}>
                {body}
              </Text>
              <View className={`userAgreement ${body ? 'hide' : ''}`}>{content}</View>
            </ScrollView>
            <View className="confirm">
              <Image onClick={this.confirm.bind(this)} src={confirmBtn} className="confirmBtn" />
            </View>
          </View>
        </View>
      </View>
    );
  }
}
