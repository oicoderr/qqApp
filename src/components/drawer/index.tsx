import Taro, { Component } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import emitter from '../../service/events';
import './index.scss'

export default class Drawer extends Component{
    constructor(props) {
        super(props);
        this.state = {
            animationData: '',
            showModalStatus: false,
            isAnimateClass: '',
            iconBoxData: {
                item:[
                    {   title: '战绩',
                        x: -210,
                        y: -210,
                        router: '/pages/index/index',
                    },{
                        title: '背包',
                        x: -10,
                        y: -10,
                        router: '/pages/backpack/index',
                    },{
                        title: '商店',
                        x: -210,
                        y: -110,
                        router: '/pages/mall/index',
                    },{
                        title: '乐队',
                        x: -210,
                        y: -10,
                        router: '/pages/selfOrchestra/index',
                    },{
                        title: '排行',
                        x: -110,
                        y: -210,
                        router: '',
                    },{
                        title: '成就',
                        x: -10,
                        y: -110,
                        router: '',
                    },{
                        title: '好友',
                        x: -110,
                        y: -110,
                        router: '',
                    },{
                        title: '反馈',
                        x: -110,
                        y: -10,
                        router: '',
                    },{
                        title: '审题',
                        x: -10,
                        y: -210,
                        router: '',
                    }
                ],
                setting:[
                    {
                        title: '设置',
                        x: -310,
                        y: -10,
                        router: '',
                    },{
                        title: '邮件',
                        x: -310,
                        y: -170,
                        router: '',
                    },{
                        title: '公告',
                        x: -310,
                        y: -10,
                        router: '',
                    }
                ]
            },
            powerDrawer: 'https://snm-qqapp-test.oss-cn-beijing.aliyuncs.com/qqApp-v1.0.0/powerDrawer.png',
        }
    }

    componentWillMount () {}

    componentDidMount() {}

    componentWillUnmount () {}

    componentDidShow () {}

    componentDidHide () {
        this.setState({
            showModalStatus: false,
            isAnimateClass: 'animateBack'
        });
    }

    powerDrawer (e) {
        var currentStatu = e.currentTarget.dataset.statu;
        let isAnimateClass = this.state.isAnimateClass;
        this.util(currentStatu, isAnimateClass)
    }

    util(currentStatu, isAnimateClass) {
        if (currentStatu == "close") {
            this.setState({
                showModalStatus: false,
                isAnimateClass: 'animateBack'
            });
        }else if(currentStatu == "open" && isAnimateClass == 'animateStart' ){
            this.setState({
                showModalStatus: false,
                isAnimateClass: 'animateBack'
            });
        }else if(currentStatu == "open" ){
            this.setState({
                showModalStatus: true,
                isAnimateClass: 'animateStart'
            });
        }
    }
    // 页面跳转
    onRouting(router){
        Taro.navigateTo({
            url: router
        })
    }
    render() {
        const animationData = this.state.animationData;
        const showModalStatus = this.state.showModalStatus;
        const powerDrawerBtn = this.state.powerDrawer;
        const isAnimateClass = this.state.isAnimateClass;
        const { item, setting } = this.state.iconBoxData;
        
        const iconBox_item = item.map((cur)=>{
            return  <View onClick={this.onRouting.bind(this,cur.router)} className='item'>
                        <View style={`background-position:${cur.x}rpx ${cur.y}rpx`} className='itemBg'></View>
                        <View className='title'>{cur.title}</View>
                    </View>
        })

        const iconBox_setting = setting.map((cur, index)=>{
            return  <View onClick={this.onRouting.bind(this,cur.router)} className='item'>
                        <View 
                        style= {`background-position:${cur.x}rpx ${cur.y}rpx`} className='settingItemBg'></View>
                        <View className='title'>{cur.title}</View>
                    </View>
        })

        return (
            <View className='drawer'>
                {/* <!--mask--> */}
                <View className={`drawer_screen ${showModalStatus?'':'hide'}`} onClick={this.powerDrawer.bind(this)} data-statu="close"></View>

                {/* <!--使用animation属性指定需要执行的动画--> */}
                <View animation={animationData} className={`drawer_attr_box ${isAnimateClass}`}>
                    <View className='drawer_contentWrap'>
                        <View className="drawer_content">
                            <View className="drawer_body">
                                {iconBox_item}
                            </View>
                            <View className='drawer_setting'>
                                {iconBox_setting}
                            </View>
                        </View>
                    </View>

                    <View className={`btn ${isAnimateClass == 'animateStart'?'rotateBtn':''}`} onClick={this.powerDrawer.bind(this)} data-statu="open" >
                        <Image src={powerDrawerBtn} className='powerDrawerBtn' />
                    </View>
                </View>
            </View>    
        )
    }
}