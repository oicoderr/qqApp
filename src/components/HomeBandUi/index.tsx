import Taro, { Component } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export default class HomeBand extends Component {
	constructor(props) {
		super(props);
		this.state = {

			data: {
        list:[],
      },

      local_data: {
           // 主唱
          leadSinger:{},

          // 吉他手
          guitarist:{},

          // 贝斯手
          bassist:{},

          // 鼓手
          drummer:{}
			},
		};
	}

  componentWillMount() {
    let _this = this;
    // 接受签到基本数据
    this.eventEmitter = emitter.addListener('selfOrchestra', message => {
      clearInterval(message[1]);

      // console.log('%c 接受父组件`我的乐队信息`====>', 'font-size:14px;color:#273df1;');console.log(message[0]['list']);
      let list = message[0]['list'];
      this.setState((preState)=>{
        preState.data.list = list;
      });
      // 重新分组
      this.elicitPart(list);
    });
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  // 将使用的主唱，贝斯手，吉他手，鼓手抽出
  elicitPart(list){
    // type 类型(1.主唱;2.吉他手;3.贝斯手;4.鼓手)
    let elicitPart = JSON.parse(JSON.stringify(list));
    for(let i = 0; i < elicitPart.length; i++){
      if(elicitPart[i]['type'] == 1 && elicitPart[i]['status']){
        this.setState((preState)=>{
          preState.local_data.leadSinger = elicitPart[i];
        });
      }else if(elicitPart[i]['type'] == 2 && elicitPart[i]['status']){
        this.setState((preState)=>{
          preState.local_data.leadSinger = elicitPart[i];
        });
      }else if(elicitPart[i]['type'] == 3 && elicitPart[i]['status']){
        this.setState((preState)=>{
          preState.local_data.bassist = elicitPart[i];
        });
      }else if(elicitPart[i]['type'] == 4 && elicitPart[i]['status']){
        this.setState((preState)=>{
          preState.local_data.drummer = elicitPart[i];
        });
      }
    }
    console.info(this.state.local_data, '123123123123')
  }

  render() {
    const { staticBand, stage, light, type } = this.state.local_data.leadSinger;
    const guitarist = this.state.local_data.guitarist;
    const bassist = this.state.local_data.bassist;
    const drummer = this.state.local_data.drummer;

    return  <View className="homeBand">
              <View onClick={this.leadSingerBox.bind(this)}className={`leadSingerBox ${staticBand?'':'hide'}`}>
                <Image src={staticBand} className='leadSinger'/>
                <Image src={light} className='leadLight'/>
                <Image src={stage} className='leadStage'/>
              </View>
              <View onClick={this.guitaristBox.bind(this)} className={`guitaristBox  ${guitarist.type?'':'hide'}`}>
                <Image src={guitarist.staticBand} className='guitarist'/>
                <Image src={guitarist.light} className='guitaristLight'/>
                <Image src={guitarist.stage} className='guitaristStage'/>
              </View>
              <View  className={`bassistBox ${bassist.type?'':'hide'}`}>
                <Image src={bassist.staticBand} className='bassist'/>
                <Image src={bassist.light} className='bassistLight'/>
                <Image src={bassist.stage} className='bassistStage'/>
              </View>
              <View  className={`drummerBox ${bassist.type?'':'hide'}`}>
                <Image src={drummer.staticBand} className={`drummer  ${drummer.type?'':'hide'}`}/>
                <Image src={drummer.light} className='drummerLight'/>
                <Image src={drummer.stage} className='drummerStage'/>
              </View>
            </View>;
  }
}
