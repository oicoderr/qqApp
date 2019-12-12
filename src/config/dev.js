const isWeapp = process.env.CLIENT_ENV === 'weapp'
// 你自己的请求域名
const HOST = "http://192.168.1.198:3800"; 

module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    HOST: isWeapp ? '"/api"' : JSON.parse(HOST)
  },
  weapp: {
  },
  h5: {
    devServer: {
      // 设置代理来解决 H5 请求的跨域问题
      proxy: {
        '/': {
          target: JSON.parse(HOST),
          pathRewrite: {
            '^/': '/'
          },
          changeOrigin: true
        },
      }
    }
  }
}