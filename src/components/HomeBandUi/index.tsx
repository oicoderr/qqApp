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
      default_data: {
        // 吉他手
        guitarist_: {
          staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/guitar-shadow-1.png',
          stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/guitar-stage-shadow-1.png',
          light: '',
        },

        // 贝斯手
        bassist_: {
          staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/bass-shadow-1.png',
          stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/bass-stage-shadow-1.png',
          light: '',
        },

        // 鼓手
        drummer_: {
          staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/drum-shadow-1.png',
          stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/drum-stage-shadow-1.png',
          light: '',
        }
      }
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
    console.log(elicitPart,123)
  }


  render() {
    const { staticBand, stage, light, type } = this.state.local_data.leadSinger;
    const guitarist = this.state.local_data.guitarist;
    const bassist = this.state.local_data.bassist;
    const drummer = this.state.local_data.drummer;

    // 当前主页展示人物参数：主唱
    //  width, height, bgSizeW, bgSizeH, img, steps, timeAn, classAn 
    const leadSingerAnParams = this.state.local_data.leadSinger.animation;

    // 默认空缺主人物
    const { guitarist_, bassist_, drummer_ } = this.state.default_data;

    return <View className="homeBand">
      <View className={`leadSingerBox ${type ? '' : 'hide'}`} style={`width:${leadSingerAnParams.width}rpx; height:${leadSingerAnParams.height}rpx;`}>

        {/* 主唱人物 *由于行间style rpx会被强行更改未px，解决方案：class替换行间 */}
        <svg viewBox={`0, 0, ${leadSingerAnParams.width}, ${leadSingerAnParams.height}`} className='svgClass'
          style={`position: absolute; z-index: 70; width: ${leadSingerAnParams.width}rpx; height: ${leadSingerAnParams.height}rpx;`} >

          <foreignObject width={leadSingerAnParams.width} height={leadSingerAnParams.height}>
            <View className={leadSingerAnParams.classSvg}
            style={`background:url(${leadSingerAnParams.img});
            animation: ${leadSingerAnParams.classAn} ${leadSingerAnParams.timeAn}s steps(${leadSingerAnParams.steps}) infinite; 
            animation-fill-mode: forwards;
            background-repeat: no-repeat;`}>

            </View>
          </foreignObject>
        </svg>

        <Image src={light} className='leadLight' />
        <Image src={stage} className='leadStage' />

      </View>

      <View className={`guitaristBox ${guitarist.type ? '' : 'hide'}`}>
        <Image src={guitarist.staticBand} className='guitarist' />
        <Image src={guitarist.light} className='guitaristLight' />
        <Image src={guitarist.stage} className='guitaristStage' />
      </View>
      {/* 空缺填充 */}
      <View className={`guitaristBox ${guitarist.type ? 'hide' : ''}`}>
        <Image src={guitarist_.staticBand} className='guitarist' />
        <Image src={guitarist_.light} className='guitaristLight' />
        <Image src={guitarist_.stage} className='guitaristStage' />
      </View>


      <View className={`bassistBox ${bassist.type ? '' : 'hide'}`}>
        <Image src={bassist.staticBand} className='bassist' />
        <Image src={bassist.light} className='bassistLight' />
        <Image src={bassist.stage} className='bassistStage' />
      </View>
      {/* 空缺填充 */}
      <View className={`bassistBox ${bassist.type ? 'hide' : ''}`}>
        <Image src={bassist_.staticBand} className='bassist' />
        <Image src={bassist_.light} className='bassistLight' />
        <Image src={bassist_.stage} className='bassistStage' />
      </View>

      <View className={`drummerBox ${drummer.type ? '' : 'hide'}`}>
        <Image src={drummer.staticBand} className={`drummer`} />
        <Image src={drummer.light} className='drummerLight' />
        <Image src={drummer.stage} className='drummerStage' />
      </View>
      {/* 空缺填充 */}
      <View className={`drummerBox ${drummer.type ? 'hide' : ''}`}>
        <Image src={drummer_.staticBand} className={`drummer`} />
        <Image src={drummer_.light} className='drummerLight' />
        <Image src={drummer_.stage} className='drummerStage' />
      </View>

    </View>;
  }
}
