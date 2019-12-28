/* eslint-disable react/react-in-jsx-scope */
import Taro, { Component } from '@tarojs/taro';
import { View, Image, RadioGroup, Radio, Label } from '@tarojs/components';
import emitter from '../../service/events';
import './index.scss';

export default class HomeBand extends Component {
	constructor(props) {
		super(props);
		this.state = {
			// 后台数据
			data: {
        leadSinger:{
        
          leadStage: 'https://oss.snmgame.com/gif/leadBoy/lead_stage.png',
          leadLight: 'https://oss.snmgame.com/gif/leadBoy/lead_light.png',
        },
        guitarist:{
          
          guitaristStage: 'https://oss.snmgame.com/gif/guitarist/guitarist_stage.png',
          guitaristLight: 'https://oss.snmgame.com/gif/guitarist/guitarist_light.png',
        },
        bassist:{
          
          bassistStage: 'https://oss.snmgame.com/gif/bassist/bassist_stage.png',
          bassistLight: 'https://oss.snmgame.com/gif/bassist/bassist_light.png',
        },
        drummer:{
          
          drummerStage: 'https://oss.snmgame.com/gif/drummer/drummer_stage.png',
          drummerLight: 'https://oss.snmgame.com/gif/drummer/drummer_light.png',
        }
      },

      local_data: {
        list: [],
        
			},
		};
	}

  componentWillMount() {
    let _this = this;
    // 接受签到基本数据
    this.eventEmitter = emitter.addListener('selfOrchestra', message => {
      clearInterval(message[1]);

      console.log('%c 接受父组件`我的乐队信息`====>', 'font-size:14px;color:#273df1;');
      console.log(message[0]['list']);
    });
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  leadSingerBox(){
    console.info('0000000');
  }
  
  guitaristBox(){
    console.info('guitaristBox11111');
  }
  bassistBox(){
    console.info('bassistBox22222');
  }
  render() {
    const { leadSingerGif, leadStage, leadLight } = this.state.data.leadSinger;
    const { guitaristGif, guitaristStage, guitaristLight } = this.state.data.guitarist;
    const { bassistGif, bassistStage, bassistLight } = this.state.data.bassist;
    const { drummerGif, drummerStage, drummerLight } = this.state.data.drummer;

    return  <View className="homeBand">
              <View onClick={this.leadSingerBox.bind(this)}className='leadSingerBox'>
                {/* <View className='leadSinger_'></View> */}
                <Image src={leadLight} className='leadLight'/>
                <Image src={leadStage} className='leadStage'/>
              </View>
              <View onClick={this.guitaristBox.bind(this)} className='guitaristBox'>
                <Image src={guitaristGif} className='guitarist'/>
                <Image src={guitaristLight} className='guitaristLight'/>
                <Image src={guitaristStage} className='guitaristStage'/>
              </View>
              <View onClick={this.bassistBox.bind(this)} className='bassistBox'>
                <Image src={bassistGif} className='bassist'/>
                <Image src={bassistLight} className='bassistLight'/>
                <Image src={bassistStage} className='bassistStage'/>
              </View>
              <View className='drummerBox'>
                <Image src={drummerGif} className='drummer'/>
                <Image src={drummerLight} className='drummerLight'/>
                <Image src={drummerStage} className='drummerStage'/>
              </View>
            </View>;
  }
}
