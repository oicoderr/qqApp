/* eslint-disable react/react-in-jsx-scope */
import { Component } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export class MessageToast extends Component {
  constructor(props) {
    super(props);
    this.state.data = {
      title: '晋级之路',
      closeImgBtn: 'https://oss.snmgame.com/v1.0.0/closeBtn.png',
      road_line: 'https://oss.snmgame.com/v1.0.0/road_line.png',
      // 当前段位
      current_dan: 1,
      headPosi: [
        {
          x: 290,
          y: 760
        },
        {
          x: 320,
          y: 670
        },
        {
          x: 352,
          y: 576
        },
        {
          x: 375,
          y: 485
        },
        {
          x: 408,
          y: 390
        },
        {
          x: 440,
          y: 300
        },
        {
          x: 469,
          y: 210
        },
        {
          x: 498,
          y: 126
        }
      ],
      orchestraTitleList: [
        {
          title: '解锁贝斯手',
          class: 'orchestraTitleItem1'
        },
        {
          title: '解锁吉他手',
          class: 'orchestraTitleItem2'
        },
        {
          title: '解锁鼓手',
          class: 'orchestraTitleItem3'
        }
      ],
      list: [
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/1levelTitle.png',
          itemTitle: '音乐小白',
          class: 'level1',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/2levelTitle.png',
          itemTitle: '流浪歌手',
          class: 'level2',
          orchestra: '解锁贝斯手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/3levelTitle.png',
          itemTitle: '酒吧驻唱',
          class: 'level3',
          orchestra: '解锁吉他手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/4levelTitle.png',
          itemTitle: '网络红人',
          class: 'level4',
          orchestra: '解锁鼓手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/5levelTitle.png',
          itemTitle: '签约歌手',
          class: 'level5',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/6levelTitle.png',
          itemTitle: '国民偶像',
          class: 'level6',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/7levelTitle.png',
          itemTitle: '亚洲天王',
          class: 'level7',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/8levelTitle.png',
          itemTitle: '国际巨星',
          class: 'level8',
          orchestra: ''
        }
      ],
      list_mask: [
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/1levelTitle.png',
          itemTitle: '音乐小白',
          class: 'level1',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/2levelTitle_mask.png',
          itemTitle: '流浪歌手',
          class: 'level2',
          orchestra: '解锁贝斯手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/3levelTitle_mask.png',
          itemTitle: '酒吧驻唱',
          class: 'level3',
          orchestra: '解锁吉他手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/4levelTitle_mask.png',
          itemTitle: '网络红人',
          class: 'level4',
          orchestra: '解锁鼓手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/5levelTitle_mask.png',
          itemTitle: '签约歌手',
          class: 'level5',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/6levelTitle_mask.png',
          itemTitle: '国民偶像',
          class: 'level6',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/7levelTitle_mask.png',
          itemTitle: '亚洲天王',
          class: 'level7',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/8levelTitle_mask.png',
          itemTitle: '国际巨星',
          class: 'level8',
          orchestra: ''
        }
      ],
      reusltList: [
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/1levelTitle.png',
          itemTitle: '音乐小白',
          class: 'level1',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/2levelTitle_mask.png',
          itemTitle: '流浪歌手',
          class: 'level2',
          orchestra: '解锁贝斯手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/3levelTitle_mask.png',
          itemTitle: '酒吧驻唱',
          class: 'level3',
          orchestra: '解锁吉他手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/4levelTitle_mask.png',
          itemTitle: '网络红人',
          class: 'level4',
          orchestra: '解锁鼓手'
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/5levelTitle_mask.png',
          itemTitle: '签约歌手',
          class: 'level5',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/6levelTitle_mask.png',
          itemTitle: '国民偶像',
          class: 'level6',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/7levelTitle_mask.png',
          itemTitle: '亚洲天王',
          class: 'level7',
          orchestra: ''
        },
        {
          itemImg: 'https://oss.snmgame.com/v1.0.0/8levelTitle_mask.png',
          itemTitle: '国际巨星',
          class: 'level8',
          orchestra: ''
        }
      ],
      reusltHeadPosi: { x: 290, y: 790 }
    };
  }

  componentWillMount() {}

  componentDidMount = () => {};

  componentWillUnmount() {}

  componentDidShow() {
    let _this = this;
    // 接受当前段位
    this.eventEmitter = emitter.once('current_dan', message => {
      let dan = message['dan'];
      this.setState(
        preState => {
          preState.data.dan = dan;
        },
        () => {
          _this.setHeadPosi(dan);
          _this.setRoadSign(dan);
        }
      );
    });
  }

  componentDidHide() {}

  // 父组件发送关闭弹窗消息
  cancel(e) {
    emitter.emit('closeAdvanceRoadToast', { closeAdvanceRoadToast: 1 });
  }

  // 设置头像位置
  setHeadPosi(dan) {
    let reusltHeadPosi = {};
    let headPosi = this.state.data.headPosi;
    switch (dan) {
      case 1:
        reusltHeadPosi = headPosi[0];
        break;
      case 2:
        reusltHeadPosi = headPosi[1];
        break;
      case 3:
        reusltHeadPosi = headPosi[2];
        break;
      case 4:
        reusltHeadPosi = headPosi[3];
        break;
      case 5:
        reusltHeadPosi = headPosi[4];
        break;
      case 6:
        reusltHeadPosi = headPosi[5];
        break;
      case 7:
        reusltHeadPosi = headPosi[6];
        break;
      case 8:
        reusltHeadPosi = headPosi[7];
        break;
      default:
        reusltHeadPosi = headPosi[0];
    }
    console.log(reusltHeadPosi, 7888);
    this.setState(preState => {
      preState.data.reusltHeadPosi = reusltHeadPosi;
    });
  }

  // 设置晋级之路段位路标显示
  setRoadSign(dan) {
    let reusltList = new Array();
    let list = this.state.data.list;
    let list_mask = this.state.data.list_mask;
    // 未到达的路标个数
    let last_mask = list.length - dan;
    for (let i = 0; i < list.length; i++) {
      if (i < dan) {
        reusltList.push(list[i]);
        console.log(list[i], 789);
      }
    }
    for (let i = dan; i < list.length + 1 - dan; i++) {
      console.log(i, '>>----11');
      reusltList.push(list_mask[i]);
    }
    this.setState(
      preState => {
        preState.data.reusltList = reusltList;
      },
      () => {}
    );
  }

  render() {
    const { closeImgBtn, road_line, title, reusltList, orchestraTitleList, reusltHeadPosi } = this.state.data;
    const content = reusltList.map(cur => {
      return (
        <View className={`itemPosi ${cur.class}`}>
          <Image src={cur.itemImg} className="rankItem" />
        </View>
      );
    });

    const orchestraList = orchestraTitleList.map((cur, index) => {
      return <View className={`orchestraTitle ${cur.class}`}>{cur.title}</View>;
    });

    return (
      <View className="messageToast">
        <View className="content">
          <View onClick={this.cancel.bind(this)} className="closeImgBtnWrap">
            <Image src={closeImgBtn} className="closeImgBtn" />
          </View>
          <View className="box">
            <View className="title">{title}</View>
            <Image src={road_line} className="road_line" />
            {orchestraList}
            {content}
            <View className="avatarWrap" style={`left: ${reusltHeadPosi.x}rpx; top: ${reusltHeadPosi.y}rpx;`}>
              <View className="avatar">
                <openData type="userAvatarUrl"></openData>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
}
