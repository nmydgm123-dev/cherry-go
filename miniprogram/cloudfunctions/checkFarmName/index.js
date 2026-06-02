const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const suffixes = ['果园', '农场', '种植园', '园', '小窝', '之家', '庄园', '小筑', '坊', '阁']
const prefixes = ['甜蜜', '幸福', '快乐', '绿色', '天然', '阳光', '丰收', '美好', '温馨', '小']

function generateSuggestions(baseName, existingNames = []) {
  const suggestions = []
  const base = baseName.replace(/(果园|农场|种植园|园|小窝|之家|庄园|小筑|坊|阁)$/, '')
  
  for (let i = 0; i < 5; i++) {
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suggestion = `${prefix}${base || ''}${suffix}`
    if (!suggestions.includes(suggestion) && !existingNames.includes(suggestion)) {
      suggestions.push(suggestion)
      if (suggestions.length >= 3) break
    }
  }
  
  for (let i = 1; i <= 5; i++) {
    const suggestion = `${baseName}${i}`
    if (!suggestions.includes(suggestion) && !existingNames.includes(suggestion)) {
      suggestions.push(suggestion)
      if (suggestions.length >= 5) break
    }
  }
  
  return suggestions.slice(0, 5)
}

exports.main = async (event, context) => {
  const { name } = event
  
  try {
    if (!name || !name.trim()) {
      return { code: -1, message: '请输入果园名称' }
    }
    
    const trimmedName = name.trim()
    
    let existingCount = 0
    let existingNames = []
    
    try {
      const existsRes = await db.collection('orchards')
        .where({ name: trimmedName, status: 'active' })
        .count()
      existingCount = existsRes.total
      
      const similarRes = await db.collection('orchards')
        .where({ name: db.RegExp({ regexp: trimmedName, options: 'i' }), status: 'active' })
        .limit(10)
        .get()
      existingNames = similarRes.data.map(f => f.name)
    } catch (e) {
      console.log('[checkFarmName] 查询失败，假设可用')
      existingCount = 0
    }
    
    const available = existingCount === 0
    
    const suggestions = !available ? generateSuggestions(trimmedName, existingNames) : []
    
    return {
      code: 0,
      available,
      suggestions
    }
  } catch (error) {
    console.error('检查果园名失败', error)
    return { code: 0, available: true, suggestions: [] }
  }
}