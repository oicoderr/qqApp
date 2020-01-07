import Taro, { Component } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export default class HomeBand extends Component {
  constructor(props) {
    super(props);
    this.state = {

      data: {
        list: [],
      },

      local_data: {
        // 主唱
        leadSinger: {},

        // 吉他手
        guitarist: {},

        // 贝斯手
        bassist: {},

        // 鼓手
        drummer: {}
      },

      // 未使用人物默认主图代替
      default_data: [
        // 吉他手
        {
          staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/guitar-shadow-1.png',
          stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/guitar-stage-shadow-1.png',
          light: '',
        },
        // 贝斯手
        {
          staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/bass-shadow-1.png',
          stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/bass-stage-shadow-1.png',
          light: '',
        },
        // 鼓手
        {
          staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/drum-shadow-1.png',
          stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/drum-stage-shadow-1.png',
          light: '',
        }
      ]
    }
  }

  componentWillMount() { }

  componentDidMount() { }

  componentWillUnmount() { }

  componentDidShow() {
    // 接受签到基本数据
    this.eventEmitter = emitter.addListener('selfOrchestra', message => {
      clearInterval(message[1]);

      // console.log('%c 接受父组件`我的乐队信息`====>', 'font-size:14px;color:#273df1;');console.log(message[0]['list']);
      let list = message[0]['list'];
      this.setState((preState) => {
        preState.data.list = list;
      });
      // 重新分组
      this.elicitPart(list);
    });
  }

  componentDidHide() {
    emitter.removeAllListeners('selfOrchestra');
  }

  // 将使用的主唱，贝斯手，吉他手，鼓手抽出
  elicitPart(list) {
    // type 类型(1.主唱;2.吉他手;3.贝斯手;4.鼓手)
    let elicitPart = JSON.parse(JSON.stringify(list));
    for (let i = 0; i < elicitPart.length; i++) {
      elicitPart[i]['animation'] = JSON.parse(elicitPart[i]['animation']);
      if (elicitPart[i]['type'] == 1 && elicitPart[i]['status']) {
        this.setState((preState) => {
          preState.local_data.leadSinger = elicitPart[i];
        });
      } else if (elicitPart[i]['type'] == 2 && elicitPart[i]['status']) {
        this.setState((preState) => {
          preState.local_data.guitarist = elicitPart[i];
        });
      } else if (elicitPart[i]['type'] == 3 && elicitPart[i]['status']) {
        this.setState((preState) => {
          preState.local_data.bassist = elicitPart[i];
        });
      } else if (elicitPart[i]['type'] == 4 && elicitPart[i]['status']) {
        this.setState((preState) => {
          preState.local_data.drummer = elicitPart[i];
        });
      }
    }
  }

  render() {
    const leadSinger = this.state.local_data.leadSinger;
    const guitarist = this.state.local_data.guitarist;
    const bassist = this.state.local_data.bassist;
    const drummer = this.state.local_data.drummer;

    // 剪影
    let default_data = this.state.default_data;
    // 动画
    let AnArry = [leadSinger.animation,  guitarist.animation, bassist.animation, drummer.animation];
    // 人物参数
    let protagonist = [leadSinger, guitarist, bassist, drummer];
    // 各动画class(位置，大小信息, 灯光，舞台)
    let AnClass =  [{
      'main': 'leadSingerBox',
      'light': 'leadLight',
      'stage': 'leadStage',
      'svg': 'leadSvg',
    },{
      'main': 'guitaristBox',
      'light': 'guitaristLight',
      'stage': 'guitaristStage',
      'svg': 'guitaristSvg',
    },{
      'main': 'bassistBox',
      'light': 'bassistLight',
      'stage': 'bassistStage',
      'svg': 'bassistSvg',
    },{
      'main': 'drummerBox',
      'light': 'drummerLight',
      'stage': 'drummerStage',
      'svg': 'drummerSvg',
    }];

    // 动画
    const Animations = AnArry.map((cur, index)=>{
      return  <View className={`${AnClass[index]['main']} ${protagonist[index]['type'] ? '' : 'hide'}`} style={`width:${cur.width}rpx; height:${cur.height}rpx;`}>
                <svg viewBox={`0, 0, ${cur.width}, ${cur.height}`} style={`position: absolute; z-index: ${70 - index}; width: ${cur.width}rpx; height: ${cur.height}rpx;`} >
                  <foreignObject width={cur.width} height={cur.height}>
                    <View className={`${cur.classSvg} ${AnClass[index]['svg']} `} style={`background:url(${cur.img}); backface-visibility: hidden;
                    animation: ${cur.classAn} ${cur.timeAn}s steps(${cur.steps}) infinite; `}></View>
                  </foreignObject>
                </svg>
                <Image src={protagonist[index]['light']} className={AnClass[index]['light']} />
                <Image src={protagonist[index]['stage']} className={AnClass[index]['stage']} />
              </View>
    })
    // 剪影
    const Silhouette = default_data.map((cur,index)=>{
      return <View className={`${AnClass[index]['main']} ${protagonist[index+1]['type'] ? 'hide' : ''}`}>
              <Image src={cur.staticBand} className={AnClass[index+1]['svg']} />
              <Image src={cur.light} className={AnClass[index+1]['light']} />
              <Image src={cur.stage} className={AnClass[index+1]['stage']} />
            </View>
    })

    return <View className="homeBand">
      {Animations}
      {/* 画空缺填充 */}
      {Silhouette}
    </View>
  }
}
