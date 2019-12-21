/*
  *  @qq小程序激励型广告
  *  @type  0 小程序 1微信小程序 
  *
  *
*/
import Taro from '@tarojs/taro'
export default class createVideoAd {

	constructor() {
        // 广告 adUnitId
        this._adUnitId = '4f94e1ce9678a2d2e8d456b68f1321a0';
        // 创建广告对象
        this.videoAd = null;
	}

    adGet(callback){
        let adUnitId = this._adUnitId;
        if (qq.createRewardedVideoAd) {
            // 加载激励视频广告
            this.videoAd = qq.createRewardedVideoAd({
                adUnitId: adUnitId,
                // multiton: false
            });

            this.videoAd.onLoad(() => {
                console.info('激励视频 广告加载成功')
            });

            //捕捉错误
            this.videoAd.onError(err => {
                console.info('<======  视频播放失败 ======>');
                console.info(err);
                Taro.showToast({
                    title: this.videoAdErrHandle(err),
                    icon: 'none',
                    duration: 2000
                });
            });

            // 监听`关闭`
            this.videoAd.onClose((status) => {
                if (status && status.isEnded || status === undefined) {
                    if(callback)callback(status)
                } else {
                    if(callback)callback(status)
                }
            })
        }
    }

    openVideoAd() {
        // 在合适的位置打开广告
        if (this.videoAd) {
            this.videoAd.show().catch(err => {
                // 失败重试
                this.videoAd.load()
                .then(() => this.videoAd.show())
                .catch(err => {
                    console.info('<======  视频播放失败2 ======>');
                    console.info(err);
                    Taro.showToast({
                        title: this.videoAdErrHandle(err),
                        icon: 'none'
                    })
                })
            })
        }
    }
    
    videoAdErrHandle(err){
        const errHandle={
            1000:'后端接口调用失败',
            1001:'参数错误',
            1002:'广告单元无效',
            1003:'内部错误',
            1004:'无合适的广告',
            1005:'广告组件审核中',
            1006:'广告组件被驳回',
            1007:'广告组件被封禁',
            1008:'广告单元已关闭',
        }
        return errHandle[err.errCode] || '视频加载错误,重新加载页面试试吧'
    }
}