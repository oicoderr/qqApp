# QQ小程序
## 技术栈
- React
- Taro (https://taro-docs.jd.com/taro/docs/README.html) 
- Taro UI (https://aotu.io/notes/2018/08/27/the-birth-of-taro-ui/)
- Mock  (https://github.com/nuysoft/Mock/wiki)
- Sass
- ES6/Es7

## 项目运行
```javascript
# 全局安装taro脚手架
npm install -g @tarojs/cli
npm i taro-ui

# 安装项目依赖
npm install

# Mock
npm install --save-dev mockjs    
npm install --save-dev mocker-api
// 需要重新打开一个命令窗口
npm run mock

```

## 适配
```javascript
# QQ小程序
# 微信小程序

```

## 项目结构
    ├── .temp                  // H5编译结果目录
    ├── dist                   // 小程序编译结果目录
    ├── mock                   // mock数据
    ├── config                 // Taro配置目录
    │   ├── dev.js             // 开发时配置
    │   ├── index.js           // 默认配置
    │   └── prod.js            // 打包时配置
    ├── screenshots            // 项目截图，和项目开发无关
    ├── site                   // H5静态文件（打包文件）
    ├── src                    // 源码目录
    │   ├── components         // 组件
    │   ├── config             // 项目开发配置
    │   ├── service            // 请求
    │   │   ├── api            // 请求API接口
    │   │   ├── config         // 请求配置信息
    │   │   ├── index          // 到处配置信息
    │   ├── pages              // 页面文件目录
    │   │   └── index
    │   │       ├── index.tsx  // 页面逻辑
    │   │       ├── index.scss // 页面样式
    │   │       └── service.js // 页面api
    │   ├── utils              // 常用工具类
    │   │    └── index.js      // 集成dva 
    │   ├── app.tsx            // 入口文件
    │   ├── app.scss           // 全局样式
    │   └── index.html         // 模版文件
    └── package.json

## License

[MIT](LICENSE)