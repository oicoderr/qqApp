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
        leadSinger: {
          animation:{
            classAn: "",
            classSvg: "",
            height: "",
            img: "",
            steps: "",
            timeAn: "",
            width: "",
          }
        },

        // 吉他手
        guitarist: {
          animation:{
            classAn: "",
            classSvg: "",
            height: "",
            img: "",
            steps: "",
            timeAn: "",
            width: "",
          }
        },

        // 贝斯手
        bassist: {
          animation:{
            classAn: "",
            classSvg: "",
            height: "",
            img: "",
            steps: "",
            timeAn: "",
            width: "",
          }
        },

        // 鼓手
        drummer: {
          animation:{
            classAn: "",
            classSvg: "",
            height: "",
            img: "",
            steps: "",
            timeAn: "",
            width: "",
          }
        }
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
      ],

      // 各动画class(位置，大小信息, 灯光，舞台)
      anClass: [{
        'main': 'leadSingerBox',
        'light': 'leadLight',
        'stage': 'leadStage',
        'svg': 'leadSvg',
        'type': 1,
        'status': true,
        'eventArea': 'leadSingerArea', // 控制播放/暂停点击区
      },{
        'main': 'guitaristBox',
        'light': 'guitaristLight',
        'stage': 'guitaristStage',
        'svg': 'guitaristSvg',
        'type': 2,
        'status': true,
        'sketch': 'guitaristBox_',
        'eventArea': 'guitaristArea',
      },{
        'main': 'bassistBox',
        'light': 'bassistLight',
        'stage': 'bassistStage',
        'svg': 'bassistSvg',
        'type': 3,
        'status': true,
        'sketch': 'bassistBox_',
        'eventArea': 'bassistArea',
      },{
        'main': 'drummerBox',
        'light': 'drummerLight',
        'stage': 'drummerStage',
        'svg': 'drummerSvg',
        'type': 4,
        'status': true,
        'sketch': 'drummerBox_',
        'eventArea': 'drummerArea',
      }],
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
    console.log('%c 主页乐队动画：','font-size:14px;color:#FF6347;background:#F8F8FF;');console.log(elicitPart);
  }

  // 更改播放/暂停状态
  setAnimationStatus(e){
    // type: 1主唱 2吉他手 3贝斯手 4鼓手
    let type = e.currentTarget.dataset.type;
    let status = e.currentTarget.dataset.status;
    let anClass = this.state.anClass;
    anClass.map((cur,index)=>{
      if(cur['type'] == type){
        this.setState((preState)=>{
          preState.anClass[index]['status'] = !status;
        })
      }
    })
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
    let AnClass = this.state.anClass;

    // 动画
    const Animations = AnArry.map((cur, index)=>{
      return  <View className={`${AnClass[index]['main']} ${protagonist[index]['type'] ? '' : 'hide'}`} style={`width:${cur.width}rpx; height:${cur.height}rpx;`}>
                <svg viewBox={`0, 0, ${cur.width}, ${cur.height}`} style={`position: absolute; z-index: ${70 - index}; width: ${cur.width}rpx; height: ${cur.height}rpx;`} >
                  <foreignObject width={cur.width} height={cur.height}>
                    <View className={`${cur.classSvg} ${AnClass[index]['svg']} ${AnClass[index]['status']?'play':'stop'} `} style={`background:url(${cur.img}); backface-visibility: hidden;
                    animation: ${cur.classAn} ${cur.timeAn}s steps(${cur.steps}) infinite; `}></View>
                    <View data-type={AnClass[index]['type']} data-status={AnClass[index]['status']} onClick={this.setAnimationStatus.bind(this)} className={AnClass[index]['eventArea']}></View>
                  </foreignObject>
                </svg>
                <Image src={protagonist[index]['light']} className={AnClass[index]['light']} />
                <Image src={protagonist[index]['stage']} className={AnClass[index]['stage']} />
              </View>
    })
    // 剪影
    const Silhouette = default_data.map((cur,index)=>{
      return <View className={`${AnClass[index+1]['sketch']} ${protagonist[index+1]['type'] ? 'hide' : ''}`}>
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
