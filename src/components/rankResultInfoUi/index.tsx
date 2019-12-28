import Taro, { Component } from '@tarojs/taro';
import { View, Image, RadioGroup, Radio, Label } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export default class RankResultInfo extends Component {
	constructor(props) {
    super(props);
    this.state = {
      // 动态数据
      data: {
        rankResultInfo: {
          result: 1, // 0.失败;1.胜利;-1平局
          dan: 1, // 当前段位
          danDesc: '', // 段位描述
          haveStar: 1,
          totalStar: 4,
          gloryUrl: 'https://oss.snmgame.com/v1.0.0/glory.png' // 段位的icon
        }
      },

      // 默认组件数据
      local_data: {
        successUrl: 'https://oss.snmgame.com/v1.0.0/victoryTitle.png',
        failUrl: 'https://oss.snmgame.com/v1.0.0/failTitle.png',
        drawUrl: 'https://oss.snmgame.com/v1.0.0/drawTitle.png',
        bgImg: 'https://oss.snmgame.com/v1.0.0/rankBg.png',
        confirmBtnUrl: 'https://oss.snmgame.com/v1.0.0/rankResultSureBtn.png',
        // 镂空星
        blankStar: 'https://oss.snmgame.com/v1.0.0/blankStar.png',
        // 发光星
        shineStar: 'https://oss.snmgame.com/v1.0.0/shineStar.png',
        checked: true, // 默认勾选观看广告
        adsTip: '观看短片，获取额外金币',
        rankResultUrl: '' // 对局胜负平结果
      }
    };
  }

  componentWillMount() {
    this.eventEmitter = emitter.addListener('rankResultInfo', message => {
      clearInterval(message[1]);

      console.log('%c 接受父组件rank-Result数据', 'font-size:16px;color:#db740f;');
      console.log(message);
      this.setState(
        preState => {
          preState.data.rankResultInfo = message[0];
        },
        () => {
          this.successFailDraw(message[0].result);
        }
      );
    });
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  // 开始看广告
  submitSeeAds(e) {
    // 勾选观看广告, 发送给父组件
    emitter.emit('isCheckPlayVideo', this.state.local_data.checked);
  }

  // 显示胜负平横幅图片
  successFailDraw(resultCode) {
    const { successUrl, failUrl, drawUrl } = this.state.local_data;
    switch (resultCode) {
      case 0:
        this.setState(preState => {
          preState.local_data.rankResultUrl = failUrl;
        });
        break;
      case 1:
        this.setState(preState => {
          preState.local_data.rankResultUrl = successUrl;
        });
        break;
      case -1:
        this.setState(preState => {
          preState.local_data.rankResultUrl = drawUrl;
        });
        break;
      default:
        this.setState(preState => {
          preState.local_data.rankResultUrl = successUrl;
        });
        break;
    }
  }

  // 计算拥有多少星转数组
  sumHasStar(len) {
    let con = [];
    for (let i = 0; i < len; i++) {
      con.push(i);
    }
    return con;
  }

  // 是否同意观看激励视频,发送给父组件< rank-result >
  handleChange(value) {
    this.setState(
      preState => {
        preState.local_data.checked = !value;
      },
      () => {
        emitter.emit('isFinishWatching', '1');
      }
    );
  }

  render() {
    const { result, dan, danDesc, haveStar, totalStar, gloryUrl } = this.state.data.rankResultInfo;
    const {
      rankResultUrl,
      bgImg,
      blankStar,
      shineStar,
      confirmBtnUrl,
      seeAdsStatus,
      adsTip,
      checked
    } = this.state.local_data;

    // <==================  星星  ==================>
    const starPosi = [
      'fisrtPosi',
      'secondePosi',
      'thirdPosi',
      'fouthPosi',
      'fifthPosi',
      'sixthPosi',
      'seventhPosi',
      'eighthPosi'
    ];
    let totalStarArr = new Array(),
      haveStarArr = this.sumHasStar(haveStar),
      contentTotalStar,
      contentHaveStar;
    if (totalStar === 4) {
      contentHaveStar = haveStarArr.map((currentValue, index) => {
        return (
          <View className={`starPosi ${starPosi[index + 2]} zIndexTop ${haveStar > 0 ? '' : 'hide'}`}>
            <Image src={shineStar} className="shineStar" />
          </View>
        );
      });
      totalStarArr = [0, 1, 2, 3];
      contentTotalStar = totalStarArr.map((currentValue, index) => {
        return (
          <View className={`starPosi ${starPosi[index + 2]} `}>
            <Image src={blankStar} className="blankStar" />
          </View>
        );
      });
    } else if (totalStar === 6) {
      contentHaveStar = haveStarArr.map((currentValue, index) => {
        return (
          <View className={`starPosi ${starPosi[index + 1]} zIndexTop ${haveStar > 0 ? '' : 'hide'}`}>
            <Image src={shineStar} className="shineStar" />
          </View>
        );
      });
      totalStarArr = [0, 1, 2, 3, 4, 5];
      contentTotalStar = totalStarArr.map((currentValue, index) => {
        return (
          <View className={`starPosi ${starPosi[index + 1]} `}>
            <Image src={blankStar} className="blankStar" />
          </View>
        );
      });
    } else if (totalStar === 8) {
      contentHaveStar = haveStarArr.map((currentValue, index) => {
        return (
          <View className={`starPosi ${starPosi[index]} zIndexTop ${haveStar > 0 ? '' : 'hide'}`}>
            <Image src={shineStar} className="shineStar" />
          </View>
        );
      });
      totalStarArr = [0, 1, 2, 3, 4, 5, 6, 7];
      contentTotalStar = totalStarArr.map((currentValue, index) => {
        return (
          <View className={`starPosi ${starPosi[index]} `}>
            <Image src={blankStar} className="blankStar" />
          </View>
        );
      });
    }
    // <==================  星星  ==================>

    return (
      <View className="rankResultInfo">
        <View className="bgColor">
          <View className="bgImg"></View>
          <View className="content">
            <View className="titleWrap">
              <Image src={rankResultUrl} className="titleImg" />
            </View>
            <View className="body">
              <Image src={bgImg} className="rankResultBgImg" />
              <Image src={gloryUrl} className="glory" />
              <View className={`stars ${dan < 8 ? '' : 'hide'}`}>
                {contentTotalStar}
                {contentHaveStar}
              </View>
              {/*   超过第8段位，星星展示 x50 */}
              <View className={`stars ${dan > 7 ? '' : 'hide'}`}>
                <View className="moreStarWrap">
                  <Image src={shineStar} className="moreShineStar" />
                  <View className="moreNum">x{haveStar}</View>
                </View>
              </View>
            </View>
            <View className="foot">
              <Image src={confirmBtnUrl} onClick={this.submitSeeAds.bind(this)} className="submitBtn" />
              <View className="seeAdsStatus">
                <RadioGroup className="checkBox">
                  <Label className="share_label" for="1" key="1">
                    <Radio
                      className="radio_"
                      value={adsTip}
                      onClick={this.handleChange.bind(this, checked)}
                      checked={checked}
                    >
                      <View className="tip">{adsTip}</View>
                    </Radio>
                  </Label>
                </RadioGroup>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
}
