import Taro from '@tarojs/taro'
import { baseUrl } from '../service/config'
import App from '../app'

export const promisify = (func, ctx) => {
  // 返回一个新的function
  return function () {
    // 初始化this作用域
    var ctx = ctx || this;
    // 新方法返回的promise
    return new Promise((resolve, reject) => {
      // 调用原来的非promise方法func，绑定作用域，传参，以及callback（callback为func的最后一个参数）
      func.call(ctx, ...arguments, function () {
        // 将回调函数中的的第一个参数error单独取出
        var args = Array.prototype.map.call(arguments, item => item);
        var err = args.shift();
        // 判断是否有error
        if (err) {
          reject(err)
        } else {
          // 没有error则将后续参数resolve出来
          args = args.length > 1 ? args : args[0];
          resolve(args);
        }
      });
    })
  };
};

export const promiseImage = (url) => {
  return new Promise(function (resolve, reject) {
    resolve(url)
  })
}

export const isChinese = (str) => {
  if (escape(str).indexOf("%u") < 0) return false
  return true
}

export const handleName = (str) => {
  let res = emoj2str(str)
  if (isChinese(res)) {
    res = res.length > 4 ? res.slice(0, 4) + '...' : res
  } else {
    res = res.length > 7 ? res.slice(0, 7) + '...' : res
  }
  return res
}

export const emoj2str = (str) => {
  return unescape(escape(str).replace(/\%uD.{3}/g, ''))
}

export const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

export const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 金币/红包单位置换
export const unitReplacement = (val) =>{
  const units = ['K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'S', 'O', 'N', 'H', 'X'];
  let str1 = val.toString();
  let str = str1.replace(/,/g, "");
  let strLength = str.length;
  if (strLength <= 3) {
    return str;
  } else if (strLength > 42) {
    return 999 + 'max';
  } else {
    const unitIndex = Math.ceil(strLength / 3) - 2
    const unit = units[unitIndex]
    const leftLength = strLength - (3 * (Math.ceil(strLength / 3) - 1))
    return str.substring(0, leftLength) + '.' + str.substring(leftLength, leftLength + 2) + unit
  }
}

/* 获取设备信息 */
export const getUa = () => {
  try {
    const res = Taro.getSystemInfoSync();
    return JSON.parse(JSON.stringify(res));
  } catch (err) {
    Taro.showToast({
      title: err.errmsg,
      icon: 'none',
      mask: true,
      duration: 1500
    })
  }
}

/* 设置数据存储 */
export const setStorage = (key, value) => {
  try {
    const keyWord = Taro.getStorageSync(key);
    if (keyWord) {
      Taro.setStorageSync(key, value);
      // Taro.showModal({
      //   title: '提示',
      //   content: 'storage存在相同key:' + key + ',请重新设置缓存',
      //   showCancel: true, 
      //   success(res) {
      //     if (res.confirm) {
      //       console.log('用户确定替换Storage-key：'+ key);
      //       Taro.setStorageSync(key, value);
      //     } else if (res.cancel) {
      //       console.log('用户点击取消替换Storage-key：'+ key);
      //     }
      //   }
      // })
    }else{
      Taro.setStorageSync(key, value);
    }
  } catch (err) {
    Taro.showToast({
      title: err.errmsg,
      icon: 'none',
      mask: true,
      duration: 1500
    })
  }
}

/* 获取指定缓存 */
export const getStorage = (key, callback) => {
  try {
    const value = Taro.getStorageSync(key);
    // console.log('%c 获取的Storage====> ' + key, 'font-size:14px;color:#8700d6;');console.info(value);
    if(callback)callback(value);
  } catch (err) {
    Taro.showToast({
      title: err.errmsg,
      icon: 'none',
      mask: true,
      duration: 1500
    });
  }
}

/* 清除指定缓存 异步 */
export const removeStorage = (key) => {
  Taro.removeStorage({
    key: key,
    success(res){
      console.log(res);
    },
    fail(err){
      console.log(err)
    }
  });
}

/* 清空缓存  **慎用** */
export const clearStorage = () => {
  try {
    Taro.clearStorageSync();
  } catch (err) {
    Taro.showToast({
      title: err.errmsg,
      icon: 'none',
      mask: true,
      duration: 1500
    });
  }
}

/* 网络检查状态/ 是否有网络true/false */
export const  getNetworkStatusChange = (callback) => {
  Taro.getNetworkType({
    success(res) {
      const networkType = res.networkType;
      if (networkType == 'none') {
        Taro.showToast({
          title: '请检查网络连接',
          icon: 'loading',
          duration: 2000,
        })
        return false;
      } else if (networkType == '2g') {
        Taro.showToast({
          title: '网络连接不稳定',
          icon: 'none',
          image: '../images/warning.png',
          duration: 2000,
        })
      } else if (networkType == '4g' || networkType == 'wifi'){
        if(callback)callback();
      }
    }
  });

  Taro.onNetworkStatusChange(function(res) {
    if (!res.isConnected) {
      Taro.showToast({
        title: '请检查网络连接',
        icon: 'loading',
        duration: 2000,
      })
      return false;
    } else if (res.networkType == '2g') {
      Taro.showToast({
        title: '网络连接不稳定',
        icon: 'none',
        image: '../images/warning.png',
        duration: 2000,
      })
    } else if (res.networkType == '4g' || res.networkType == 'wifi'){
      if(callback)callback();
    }
  });
}

/*获取当前页路由*/
export const getCurrentPageUrl = () => {
  var pages = Taro.getCurrentPages()         // 获取加载的页面
  var currentPage = pages[pages.length-1]    // 获取当前页面的对象
  var url = currentPage.route;               // 当前页面url
  return url
}

/* 授权获取个人信息 */
export const getUserInfo = (callback) => {
  Taro.getUserInfo({
    success(res) {
      if(callback)callback(res)
    },
    fail(err){
      console.info(err)
      Taro.getSetting({
        success(res) {
          if (res.authSetting['scope.userInfo']) {// 如果已经授权，可以直接调用 getUserInfo 获取头像昵称
            Taro.getUserInfo({
              success(res) {
                if(callback)callback(res);
              }
            })
          }
        }
      })
    }
  })
}

/* 网络请求 */
export const request = (method = 'GET', params, callback) => {
  let { url, data} = params;

  // 缓存获取openid
  getStorage('userInfo',(res)=>{

    Taro.request({
      url: `${baseUrl + url}`,
      method: `${method}`,
      data:  `${data}`,
      header: {
        'X-Access-Token': `${res.openid}`,
      },
      success(res) {
        if (res.statusCode == 200) {
          // 统一处理错误
          if (res.data.code == 'ERROR_WITH_MESSAGE') {
            Taro.showToast({
              title: res.data.message,
              icon: 'none',
            })
          } else if (res.data.code == 'UNKNOWN_ERROR') {
            Taro.showToast({
              title: '未知错误',
              icon: 'none',
            })
          } else {
            if(callback)callback(res);
          }
        } else {
          Taro.showToast({
            title: '服务器开小差了，请稍后重试',
            icon: 'none'
          });
        }
      },
      fail(err){
        console.error(err,'ERR');
      }
    })

  });
}

/* 登录请求 */
export const loginRequest = (params, callback) => {
  let { url, data} = params;
  data = JSON.stringify(data);
  Taro.request({
    url: `${baseUrl + url}`,
    method: `POST`,
    data: `${data}`,
    success(res) {
      if (res.statusCode == 200) {
        // 统一处理错误
        if (res.data.code == 'ERROR_WITH_MESSAGE') {
          Taro.showToast({
            title: res.data.message,
            icon: 'none',
          })
        } else if (res.data.code == 'UNKNOWN_ERROR') {
          Taro.showToast({
            title: '未知错误',
            icon: 'none',
          })
        } else {
          if(callback)callback(res);
        }
      } else {
        Taro.showToast({
          title: '服务器开小差了，请稍后重试',
          icon: 'none'
        });
      }
    },
    fail(err){
      Taro.showToast({
        title: err.errMsg,
				icon: 'none',
				duration: 2000
      })
    }
  })
}

export const getCurrentTime = () => {
  var date = new Date();//当前时间
  var month = zeroFill(date.getMonth() + 1);//月
  var day = zeroFill(date.getDate());//日
  var hour = zeroFill(date.getHours());//时
  var minute = zeroFill(date.getMinutes());//分
  var second = zeroFill(date.getSeconds());//秒
  
  //当前时间
  var curTime = date.getFullYear() + "-" + month + "-" + day
      + " " + hour + ":" + minute + "--" + second + '秒';
  
  function zeroFill(i){
    if (i >= 0 && i <= 9) {
      return "0" + i;
    } else {
      return i;
    }
  }
  
  return curTime;
}

// 构建url
export const buildURL = (url, query = {}, isSequence = true) => {
  if (!query) return url
  const joiner = url.match(/\?/) ? '&' : '?'
  const queryStr = Object.keys(query)
    .map(key => `${key}=${encodeURIComponent(isSequence ? JSON.stringify(query[key]) : query[key])}`)
    .join('&')
  return url + joiner + queryStr
}
