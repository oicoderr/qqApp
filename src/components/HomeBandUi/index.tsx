import Taro, { Component } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export default class HomeBand extends Component {
  constructor(props) {
    super(props);
    this.state = {

      data: {},

      local_data: {
        persons: [
          // 主唱
          {
            animation:{
              classAn: "",
              classSvg: "",
              height: "",
              img: "",
              steps: "",
              timeAn: "",
              width: "",
            },
          },
          // 吉他手
          {
            animation:{
              classAn: "",
              classSvg: "",
              height: "",
              img: "",
              steps: "",
              timeAn: "",
              width: "",
            },
          },

          // 贝斯手
          {
            animation:{
              classAn: "",
              classSvg: "",
              height: "",
              img: "",
              steps: "",
              timeAn: "",
              width: "",
            },
          },

          // 鼓手
          {
            animation:{
              classAn: "",
              classSvg: "",
              height: "",
              img: "",
              steps: "",
              timeAn: "",
              width: "",
            },
          },
        ],
      },

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

  componentWillUnmount() {
    emitter.removeAllListeners('selfOrchestra');
  }

  componentDidShow() {
    // 接受签到基本数据
    this.eventEmitter = emitter.addListener('selfOrchestra', message => {
      console.log('%c 接受父组件`我的乐队信息`====>', 'font-size:14px;color:#273df1;');console.log(message['list']);
      let list = message['list'];
      for(let i = 0 ; i < list.length; i++){
        list[i]['animation'] = JSON.parse(list[i]['animation']);
      }
      // 将拥有主页所展示的人物抽出
      this.elicitPart(list);
    });
  }

  componentDidHide() {
    emitter.removeAllListeners('selfOrchestra');
  }

  elicitPart(list){

    let leadSinger_data = {
      animation:{
        classAn: "",
        classSvg: "",
        height: "",
        img: "",
        steps: "",
        timeAn: "",
        width: "",
      },
      type: 1,
      status: 0,
    }

    let guitarist_data = {
      animation:{
        classAn: "",
        classSvg: "",
        height: "",
        img: "",
        steps: "",
        timeAn: "",
        width: "",
      },
      staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/guitar-shadow-1.png',
      stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/guitar-stage-shadow-1.png',
      light: '',
      type: 2,
      status: 0,
    }

    let bassist_data = {
      animation:{
        classAn: "",
        classSvg: "",
        height: "",
        img: "",
        steps: "",
        timeAn: "",
        width: "",
      },
      staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/bass-shadow-1.png',
      stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/bass-stage-shadow-1.png',
      light: '',
      type: 3,
      status: 0,
    }

    let drummer_data = {
      animation:{
        classAn: "",
        classSvg: "",
        height: "",
        img: "",
        steps: "",
        timeAn: "",
        width: "",
      },
      staticBand: 'https://oss.snmgame.com/characters/characters/shadow/characters/drum-shadow-1.png',
      stage: 'https://oss.snmgame.com/characters/characters/shadow/stages/drum-stage-shadow-1.png',
      light: '',
      type: 4,
      status: 0,
    }

    let leadSinger_ = leadSinger_data, guitarist_ = guitarist_data, bassist_ = bassist_data, drummer_ = drummer_data;
    list.forEach((currentValue)=>{
      if(currentValue.type == 1 && currentValue.status){
        leadSinger_ = currentValue;
      }else if(currentValue.type == 2 && currentValue.status){
        guitarist_ = currentValue;
      }else if(currentValue.type == 3 && currentValue.status){
        bassist_ = currentValue;
      }else if(currentValue.type == 4 && currentValue.status){
        drummer_ = currentValue;
      }
    });
    let array = [leadSinger_, guitarist_, bassist_, drummer_];
    this.setState((preState)=>{
      preState.local_data.persons = array;
    },()=>{});
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
    const persons = this.state.local_data.persons;
    const AnClass = this.state.anClass;
    // 动画
    const Animations = persons.map((cur, index)=>{
      return  <View>
                <View className={` ${AnClass[index]['main']} ${ cur['status']? '':'hide'}`} style={`width:${cur.animation.width}rpx; height:${cur.animation.height}rpx;`}>
                  <svg viewBox={`0, 0, ${cur.animation.width}, ${cur.animation.height}`} style={`position: absolute; z-index: ${70 - index}; width: ${cur.animation.width}rpx; height: ${cur.animation.height}rpx;`} >
                    <foreignObject width={cur.animation.width} height={cur.height}>
                      <View className={`${cur.animation.classSvg} ${AnClass[index]['svg']} ${AnClass[index]['status']?'play':'stop'} `} style={`background:url(${cur.animation.img}); backface-visibility: hidden;
                      animation: ${cur.animation.classAn} ${cur.animation.timeAn}s steps(${cur.animation.steps}) infinite; `}></View>
                      <View data-type={AnClass[index]['type']} data-status={AnClass[index]['status']} onClick={this.setAnimationStatus.bind(this)} className={AnClass[index]['eventArea']}></View>
                    </foreignObject>
                  </svg>
                  <Image src={cur['light']} className={AnClass[index]['light']} />
                  <Image src={cur['stage']} className={AnClass[index]['stage']} />
                </View>
        
                <View className={`${ cur['status']? 'hide': ''} ${AnClass[index]['type'] == cur['type']?AnClass[index]['sketch']:'hide'}      `}>
                  <Image src={cur.staticBand} className={AnClass[index]['svg']} />
                  <Image src={cur.light} className={AnClass[index]['light']} />
                  <Image src={cur.stage} className={AnClass[index]['stage']} />
                </View>
              </View>
    });


    return <View className="homeBand">
      {Animations}
    </View>
  }
}