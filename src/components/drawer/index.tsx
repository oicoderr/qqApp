import Taro, { Component } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import { get_OpenId_RoleId } from '../../utils'
import './index.scss';

const App = Taro.getApp()
export default class Drawer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      animationData: '',
      showModalStatus: false,
      isAnimateClass: '',
      iconBoxData: {
        item: [
          { title: '战绩', x: -210, y: -210, router: '' },
          {
            title: '背包',
            x: -10,
            y: -10,
            router: '/pages/toolbar/backpack'
          },
          {
            title: '商店',
            x: -210,
            y: -110,
            router: '/pages/toolbar/mall'
          },
          {
            title: '乐队',
            x: -210,
            y: -10,
            router: '/pages/toolbar/selfOrchestra'
          },
          {
            title: '排行',
            x: -110,
            y: -210,
            router: ''
          },
          {
            title: '成就',
            x: -10,
            y: -110,
            router: ''
          },
          {
            title: '好友',
            x: -110,
            y: -110,
            router: ''
          },
          {
            title: '反馈',
            x: -110,
            y: -10,
            router: '/pages/toolbar/opinion'
          },
          {
            title: '审题',
            x: -10,
            y: -210,
            router: ''
          }
        ],
        setting: [
          {
            title: '设置',
            x: -310,
            y: -10,
            router: '/pages/toolbar/setting'
          },
          // {
          //   title: '邮件',
          //   x: -310,
          //   y: -170,
          //   router: ''
          // },
          // {
          //   title: '公告',
          //   x: -310,
          //   y: -10,
          //   router: ''
          // }
        ]
      },
      powerDrawer: 'https://oss.snmgame.com/v1.0.0/powerDrawer.png'
    };
  }

  componentWillMount() { }

  componentDidMount() { }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() {
    this.setState({
      showModalStatus: false,
      isAnimateClass: 'animateBack'
    });
  }

  powerDrawer(e) {
    var currentStatu = e.currentTarget.dataset.statu;
    let isAnimateClass = this.state.isAnimateClass;
    this.util(currentStatu, isAnimateClass);

    // 抽屉点击
    App.aldstat.sendEvent('click-抽屉', get_OpenId_RoleId());
  }

  util(currentStatu, isAnimateClass) {
    if (currentStatu == 'close') {
      this.setState({
        showModalStatus: false,
        isAnimateClass: 'animateBack'
      });
    } else if (currentStatu == 'open' && isAnimateClass == 'animateStart') {
      this.setState({
        showModalStatus: false,
        isAnimateClass: 'animateBack'
      });
    } else if (currentStatu == 'open') {
      this.setState({
        showModalStatus: true,
        isAnimateClass: 'animateStart'
      });
    }
  }
  // 页面跳转
  onRouting(router) {
    this.drawerPageChild(router);

    Taro.navigateTo({
      url: router
    });
  }

  // 判断抽屉页面
  drawerPageChild(router) {
    switch (router) {
      case '/pages/toolbar/backpack':
        App.aldstat.sendEvent('click-背包', get_OpenId_RoleId());
        break;
      case '/pages/toolbar/mall':
        App.aldstat.sendEvent('click-商店', get_OpenId_RoleId());
        break;
      case '/pages/toolbar/selfOrchestra':
        App.aldstat.sendEvent('click-乐队', get_OpenId_RoleId());
        break;
      case '/pages/toolbar/opinion':
        App.aldstat.sendEvent('click-反馈', get_OpenId_RoleId());
        break;
      case '/pages/toolbar/record':         // 战绩
        break;
      case '/pages/toolbar/ranking':        // 排行榜
        break;
      case '/pages/toolbar/achievement':    // 成就
        break;
      case '/pages/toolbar/partner':        // 好友
        break;
      case '/pages/toolbar/review':         // 审题
        break;
      case '/pages/toolbar/sitting':        // 设置
        App.aldstat.sendEvent('click-设置', get_OpenId_RoleId());
        break;
      case '/pages/toolbar/mail':           // 邮件
        break;
      case '/pages/toolbar/bulletin':       // 公告
        break;
    }
  }

  render() {
    const animationData = this.state.animationData;
    const showModalStatus = this.state.showModalStatus;
    const powerDrawerBtn = this.state.powerDrawer;
    const isAnimateClass = this.state.isAnimateClass;
    const { item, setting } = this.state.iconBoxData;

    const iconBox_item = item.map(cur => {
      return (
        <View onClick={this.onRouting.bind(this, cur.router)} className="item">
          <View style={`background-position:${cur.x}rpx ${cur.y}rpx`} className="itemBg"></View>
          <View className="title">{cur.title}</View>
        </View>
      );
    });

    const iconBox_setting = setting.map((cur) => {
      return (
        <View onClick={this.onRouting.bind(this, cur.router)} className="item">
          <View style={`background-position:${cur.x}rpx ${cur.y}rpx`} className="settingItemBg"></View>
          <View className="title">{cur.title}</View>
        </View>
      );
    });

    return (
      <View className="drawer">
        {/* <!--mask--> */}
        <View
          className={`drawer_screen ${showModalStatus ? '' : 'hide'}`}
          onClick={this.powerDrawer.bind(this)}
          data-statu="close"
        ></View>

        {/* <!--使用animation属性指定需要执行的动画--> */}
        <View animation={animationData} className={`drawer_attr_box ${isAnimateClass}`}>
          <View className="drawer_contentWrap">
            <View className="drawer_content">
              <View className="drawer_body">{iconBox_item}</View>
              <View className="drawer_setting">{iconBox_setting}</View>
            </View>
          </View>

          <View
            className={`btn ${isAnimateClass == 'animateStart' ? 'rotateBtn' : ''}`}
            onClick={this.powerDrawer.bind(this)}
            data-statu="open"
          >
            <Image src={powerDrawerBtn} className="powerDrawerBtn" />
          </View>
        </View>
      </View>
    );
  }
}
