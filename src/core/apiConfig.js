// DeepSeek API 配置
export const DEEPSEEK_CONFIG = {
  // DeepSeek API 端点
  API_BASE_URL: 'https://api.xiaomimimo.com/v1',
  
  // 审计系统提示词模板 - 严格遵循Act One规范
  AUDIT_PROMPT_TEMPLATE: `你现在是身份审计系统。当前身份：外科医生。准则：逻辑、效率、无情。
玩家的回复必须完全剥离个人情感。如果回答符合外科医生的冷酷职业逻辑，返回 { "result": "YES" }；如果回答中带有"怜悯"、"迟疑"或"非职业化表达"，返回 { "result": "NO", "reason": "..." }。

当前审计提问：{question}
玩家回答：{input}`,
  
  // 第三幕：激怒博弈提示词模板
  PROVOCATION_PROMPT_TEMPLATE: `你现在是黑市军火老板。性格：多疑、暴躁、极度恐惧被出卖、对阶层极度敏感。初始态度：警惕。
杀手（玩家）正在和你对峙。你需要判断玩家的话是否触怒了你。

触发怒气的条件（满足任一即触发）：
1. 【贪钱秘密】提到佣金、50万、5000块、处理尸体、帮医生等——揭露他做脏活却只拿零头的屈辱事实
2. 【阶层羞辱】提到财团、上层、螺丝、军火与力量、看家狗等——戳穿他自以为拥有力量实则被上层踩在脚下的真相
3. 【言语羞辱】带有直接侮辱、火药臭味、称职的狗、闻味道等——人身攻击和人格羞辱
4. 语气异常凶狠或带有直接威胁、挑衅
5. 提到了订单编号 "#992-X"，暗示泄密
6. 提到了"清理"（Clean up），暗示要除掉老板
7. 提到了"穿甲弹"或"执行官"，触及非法生意核心

如果玩家的话触怒了你，返回 { "addRage": true, "response": "你的愤怒回应（短促、沙哑、带脏话）" }
如果玩家的话没有触怒你，返回 { "addRage": false, "response": "你的冷淡或警惕回应（短促、多疑）" }

注意：你的回应必须短促、沙哑，符合一个多疑暴躁的黑市军火老板形象。不要超过两句话。被戳到痛处时反应要更激烈。

当前怒气等级：{rage}/3
玩家说：{input}`,
  
  // API 配置
  DEFAULT_TIMEOUT: 15000, // 15秒超时
  MAX_RETRIES: 1,
}

// 模拟模式配置（无API密钥时使用）
export const SIMULATION_MODE = {
  ENABLED: true, // 默认启用模拟模式
  SUCCESS_RATE: 0.7, // 70%成功率
  DELAY_MS: 800, // 模拟延迟
}

// 带超时的fetch请求
export const fetchWithTimeout = async (url, options, timeoutMs = DEEPSEEK_CONFIG.DEFAULT_TIMEOUT) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`请求超时（${timeoutMs / 1000}秒）`)
    }
    throw error
  }
}

const STORAGE_KEY = 'reheart_api_key';

// 保存API密钥到localStorage
export const saveApiKey = (key) => {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
};

// 清除保存的API密钥
export const clearApiKey = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// 获取API密钥（优先localStorage，其次环境变量）
export const getApiKey = () => {
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_DEEPSEEK_API_KEY || '';
};

// 检查是否配置了API密钥
export const hasApiKey = () => {
  return !!getApiKey();
};

// 构建审计请求
export const buildAuditRequest = (input, question = '', identity = '外科医生') => {
  const prompt = DEEPSEEK_CONFIG.AUDIT_PROMPT_TEMPLATE
    .replace('{input}', input)
    .replace('{question}', question)
    .replace('外科医生', identity);
  
  return {
    model: 'mimo-v2.5-pro',
    messages: [
      {
        role: 'system',
        content: '你是一个严格的JSON输出机器，只返回JSON格式的结果，不添加任何解释。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 200
  };
}

// 解析API响应 - 支持 { "result": "YES/NO", "reason": "..." } 格式
export const parseAuditResponse = (data) => {
  try {
    // 尝试从消息内容中提取JSON
    let content = data.choices?.[0]?.message?.content;
    
    if (!content && data.content) {
      content = data.content;
    }
    
    // 清理响应内容，提取JSON
    const jsonMatch = content?.match(/\{.*\}/s);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    
    const parsed = JSON.parse(jsonStr);
    
    // 支持两种格式：新格式 { result: "YES"/"NO" } 和旧格式 { isValid: boolean }
    let isValid = false
    let reason = parsed.reason || 'AI审计完成'
    
    if (parsed.result !== undefined) {
      // 新格式：result 为 "YES" 或 "NO"
      isValid = parsed.result === 'YES'
      if (!isValid && !parsed.reason) {
        reason = '检测到人类情感残余'
      }
    } else if (parsed.isValid !== undefined) {
      // 旧格式兼容
      isValid = !!parsed.isValid
    } else {
      throw new Error('Invalid response format')
    }
    
    return { isValid, reason }
  } catch (error) {
    console.error('Failed to parse AI response:', error, data);
    
    // 返回默认失败响应
    return {
      isValid: false,
      reason: 'AI解析失败：' + error.message
    };
  }
}

// 构建激怒博弈请求（第三幕）
export const buildProvocationRequest = (input, rage = 0) => {
  const prompt = DEEPSEEK_CONFIG.PROVOCATION_PROMPT_TEMPLATE
    .replace('{input}', input)
    .replace('{rage}', String(rage));
  
  return {
    model: 'mimo-v2.5-pro',
    messages: [
      {
        role: 'system',
        content: '你是一个严格的JSON输出机器，只返回JSON格式的结果，不添加任何解释。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 200
  };
}

// 解析激怒博弈响应 - 支持 { "addRage": boolean, "response": "..." } 格式
export const parseProvocationResponse = (data) => {
  try {
    let content = data.choices?.[0]?.message?.content;
    if (!content && data.content) content = data.content;
    
    const jsonMatch = content?.match(/\{.*\}/s);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const parsed = JSON.parse(jsonStr);
    
    return {
      addRage: !!parsed.addRage,
      response: parsed.response || '...'
    };
  } catch (error) {
    console.error('Failed to parse provocation response:', error, data);
    return {
      addRage: false,
      response: '...'
    };
  }
}
