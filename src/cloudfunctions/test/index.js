'use strict'

/**
 * 简单的云函数 - 获取当前时间（测试云环境是否正常）
 */

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  return {
    success: true,
    message: '云函数运行正常！',
    timestamp: new Date().toISOString(),
    openid: wxContext.OPENID || '未登录',
    appid: wxContext.APPID || '未知AppID'
  }
}
