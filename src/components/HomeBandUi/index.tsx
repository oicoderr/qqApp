import Taro, { Component } from '@tarojs/taro'
import { View, Image, RadioGroup, Radio, Label } from '@tarojs/components'
import emitter from '../../service/events';
import './index.scss'

export default class HomeBand extends Component {
    constructor(props) {
        super(props);
        this.state = {
            local_data: {
                list: [],
            },

            // 后台数据
            data: {

            },
        }
    }

    componentWillMount () {
        let _this = this;
        // 接受签到基本数据
        this.eventEmitter = emitter.addListener('selfOrchestra', (message) => {
            clearInterval(message[1]);

			console.info('～接受父组件`我的乐队信息`：～','font-size:14px;color:#273df1;');console.info(message[0]['list']);

        });
    }

    componentDidMount() {}

    componentWillUnmount () {}

    componentDidShow () {}

    componentDidHide () { }

    render() {
        
        return (
            <View className='homeBand'>
                
            </View>    
        )
    }
}