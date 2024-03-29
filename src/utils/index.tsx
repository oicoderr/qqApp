import Taro from '@tarojs/taro'

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

// 金币/能量//门票单位置换
export const unitReplacement = (val) => {
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
    } else {
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
    // console.log('%c 获取的Storage====> ' + key, 'font-size:14px;color:#8700d6;');console.log(value);
    if (callback) callback(value);
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
    success(res) {
      console.log(res);
    },
    fail(err) {
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
export const getNetworkStatusChange = (callback) => {
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
      } else if (networkType == '4g' || networkType == 'wifi') {
        if (callback) callback();
      }
    }
  });

  Taro.onNetworkStatusChange(function (res) {
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
    } else if (res.networkType == '4g' || res.networkType == 'wifi') {
      if (callback) callback();
    }
  });
}

/*获取当前页路由*/
export const getCurrentPageUrl = () => {
  var pages = Taro.getCurrentPages();        // 获取加载的页面
  var currentPage = pages[pages.length - 1]    // 获取当前页面的对象
  var url = currentPage.route;               // 当前页面url
  if (pages.length == 10) {
    console.log('%c 当前currentPage ==>', 'font-size:16px;color:#ff581f;')
    console.log(pages)
    Taro.showToast({
      title: "页面打开太多，请回退关闭几个页面",
      icon: 'none',
      duration: 2000
    });
    setTimeout(() => {
      Taro.reLaunch({
        url: '/pages/idnex/index'
      })
    }, 2000);
  }
  return url
}

/* 授权获取个人信息 */
export const getUserInfo = (callback) => {
  Taro.getUserInfo({
    success(res) {
      if (callback) callback(res)
    },
    fail(err) {
      console.log(err)
      Taro.getSetting({
        success(res) {
          if (res.authSetting['scope.userInfo']) {// 如果已经授权，可以直接调用 getUserInfo 获取头像昵称
            Taro.getUserInfo({
              success(res) {
                if (callback) callback(res);
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
  let { url, data } = params;

  // 缓存获取openid
  getStorage('userInfo', (res) => {
    Taro.request({
      url: `${url}`,
      method: `${method}`,
      data: `${data}`,
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
            if (callback) callback(res);
          }
        } else {
          Taro.showToast({
            title: '服务器开小差了，请稍后重试',
            icon: 'none'
          });
        }
      },
      fail(err) {
        Taro.showToast({
          title: err,
          icon: 'fail',
          duration: 2000
        })
      }
    })

  });
}

/* 登录请求 */
export const loginRequest = (params, callback) => {
  let { url, data } = params;
  data = JSON.stringify(data);
  Taro.request({
    url: `${url}`,
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
          if (callback) callback(res);
        }
      } else {
        Taro.showToast({
          title: '服务器开小差了，请稍后重试',
          icon: 'none'
        });
      }
    },
    fail(err) {
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

  function zeroFill(i) {
    if (i >= 0 && i <= 9) {
      return "0" + i;
    } else {
      return i;
    }
  }

  return curTime;
}

/* 构建url */
export const buildURL = (url, query = {}, isSequence = true) => {
  if (!query) return url
  const joiner = url.match(/\?/) ? '&' : '?'
  const queryStr = Object.keys(query)
    .map(key => `${key}=${encodeURIComponent(isSequence ? JSON.stringify(query[key]) : query[key])}`)
    .join('&')
  return url + joiner + queryStr
}

/* 随机数 */
export const getArrayItems = (arr, num) => {
  //新建一个数组,将传入的数组复制过来,用于运算,而不要直接操作传入的数组;
  var temp_array = new Array();
  for (var index in arr) {
    temp_array.push(arr[index]);
  }
  //取出的数值项,保存在此数组
  var return_array = new Array();
  for (var i = 0; i < num; i++) {
    //判断如果数组还有可以取出的元素,以防下标越界
    if (temp_array.length > 0) {
      //在数组中产生一个随机索引
      var arrIndex = Math.floor(Math.random() * temp_array.length);
      //将此随机索引的对应的数组元素值复制出来
      return_array[i] = temp_array[arrIndex];
      //然后删掉此索引的数组元素,这时候temp_array变为新的数组
      temp_array.splice(arrIndex, 1);
    } else {
      //数组中数据项取完后,退出循环,比如数组本来只有10项,但要求取出20项.
      break;
    }
  }
  return return_array;
}

/* 大奖赛加速卡转发 */
export const onShareApp = (params) => {
  const { title, path, imageUrl, callback } = params;
  let defaultImageUrl = 'https://oss.snmgame.com/v1.0.0/openQzonePublish-02.png';
  return {
    title: title,
    path: path,
    imageUrl: imageUrl || defaultImageUrl,
    shareAppType: 'qq',
    query: '',
    success(res) {
      callback(res);
    },
    fail(err) {
      callback(err);
    }
  }
}

/* 隐藏分享转发平台 */
export const hideShareMenu = () => {
  Taro.hideShareMenu({
    // 'qq', 'qzone', 'wechatFriends', 'wechatMoment'
    hideShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment'],
    success(res) {
      // console.log('～隐藏分享成功～');
    },
    fail(err) {
      // console.log('～隐藏分享失败～：' + err);
    }
  })
}

/* 显示分享转发平台：qq */
export const showShareMenuItem = () => {
  Taro.showShareMenu({
    showShareItems: ['qq', 'qzone'],
    success(res) {
      console.log('～显示分享qq成功～');
    },
    fail(err) {
      console.log('～显示分享失败～：' + err);
    },
    complete(){ }
  })
}

/* 转发QQ说说平台 */
export const qqOpenQzonePublish = (data={text:'酸柠檬', img:''}) => {
  qq.openQzonePublish({
    text: data.text,
    media: [
      {
        type: 'photo',
        path: data.img
      }
    ]
})
}

/* 将秒转换成时间格式 */
export const formatSeconds = (value) => {
  var theTime = parseInt(value);
  var theTime1 = 0;
  var theTime2 = 0;
  if (theTime >= 60) {
    theTime1 = parseInt(theTime / 60);
    theTime = parseInt(theTime % 60);
    if (theTime1 >= 60) {
      theTime2 = parseInt(theTime1 / 60);
      theTime1 = parseInt(theTime1 % 60);
    }
  }
  if (theTime < 10) {
    theTime = "0" + parseInt(theTime)
  }
  var result = "" + theTime + "";
  if (theTime1 >= 0) {
    if (theTime1 < 10) {
      theTime1 = "0" + parseInt(theTime1)
    }
    result = "" + theTime1 + ":" + result;
  }
  if (theTime2 >= 0) {
    if (theTime2 < 10) {
      theTime2 = "0" + parseInt(theTime2)
    }
    result = "" + theTime2 + ":" + result;
  }
  return result;
}
/* 获取roleId / openid*/
export const get_OpenId_RoleId = () => {
  try {
    const userInfo = Taro.getStorageSync('userInfo');
    const gameUserInfo = Taro.getStorageSync('gameUserInfo');

    return JSON.stringify({
      'openId': userInfo.openid,
      'roleId': gameUserInfo.roleId,
    })
  } catch (err) {
    console.log(err)
  }
}