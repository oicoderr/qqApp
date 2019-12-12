const delay = require('mocker-api/utils/delay'); // 延时 模拟请求异步问题
const mockjs = require('mockjs');
const BookData = require('./book');

/**
|--------------------------------------------------
| @hasOwnProperty
| 返回一个布尔值
| 指示对象自身属性中是否具有指定的属性（也就是是否有指定的键）
|
| @trim
| 返回的是一个新的字符串
| 从一个字符串的两端删除空白字符 在这个上下文中的空白字符是所有的空白字符 (space, tab, no-break space 等) 以及所有行终止符字符（如 LF，CR）
|--------------------------------------------------
*/

const Query = (options, dataSource) => {
  let { current, pageSize, ...other } = options;
  current = current || 1;
  pageSize = pageSize || 10;
  for (let key in other) {
    if ({}.hasOwnProperty.call(other, key)) {
      dataSource = dataSource.filter(item => {
        if ({}.hasOwnProperty.call(item, key)) {
          return String(item[key]).trim().indexOf(decodeURI(other[key]).trim()) > -1
        }
        return true
      })
    }
  }
  return { current, pageSize, dataSource }
}

const data = {
  'POST /api/getAccessTokenNewUser': {
    accessToken: 'accessToken0001',
    openid: 'openid00001',
    userType: 0, //新用户登录
  },
  
  'POST /api/getAccessTokenOldUser': {
    accessToken: 'accessToken0001',
    openid: 'openid00001',
    userType: 1, // 老用户登录
    userInfo:{
      "nickName":"D.",
      "avatarUrl":"https://thirdqq.qlogo.cn/qqapp/1110031752/D34CEF6E17E9063AD4FD4E4602022152/100",
      "gender": 1,
      "language":"zh_CN",
      "city":"艾欧尼亚",
      "country":"班德尔城",
      "province":"德玛西亚",
    }
  },

  'POST /api/saveUserInfo': {
    message: 'OK'
  },

  'POST /api/login': {
    data: {
      openid: 'openid00001',
      userInfo:{
        nickName: 'D.',
        gender: 1,
      }
    },
    statusCode: '200'
  },

  'GET /api/user': {
    data: {
      userId: 1,
      userName: 'Lily',
      userSex: 6
    },
    statusCode: '200'
  },

  'GET /api/swiper': (req, res) => {
    res.json(
      {
        id: 1,
        //query 方法获取Get参数,如 /api/hi?name=tony
        username: req.query["name"],
      }
    )
  },

  //可以直接使用mockjs生成mock数据
  'GET /api/mock': mockjs.mock({
    'list|10-100': 1,
  }),

  'GET /api/book/list': (req, res) => {
    const { query } = req;
    const { current, pageSize, dataSource } = Query(query, BookData.data.lists);
    res.status('200').json({
      data: {
        lists: dataSource.slice((current - 1) * pageSize, current * pageSize),
        pageInfo: {
          current: Number(current),
          pageSize: Number(pageSize),
          total: dataSource.length,
          maxCurrent: dataSource.length % pageSize >= 0 ? Math.ceil(dataSource.length / pageSize) : dataSource.data.length / pageSize
        }
      },
      statusCode: '200'
    })
  }
}
//使用delay方法可以延迟返回数据
module.exports = delay(data, 1000)