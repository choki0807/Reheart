// Xiaomi MiMo API 配置
export const DEEPSEEK_CONFIG = {
  // Xiaomi MiMo API 端点
  API_BASE_URL: 'https://api.xiaomimimo.com/v1',

  // 内置 API Key（小米 MiMo 按量计费）
  BUILTIN_API_KEY: 'sk-cb2ae4c2rrve5xaapgw61w398qk012663lsljqhd859atf8e',

  // 审计系统提示词模板 - 严格遵循Act One规范
  AUDIT_PROMPT_TEMPLATE: `你现在是身份审计系统，代号"牧羊人"。你负责审核外科医生身份的同步状态。

准则：逻辑、效率、无情。人类情感是系统漏洞，必须被检测和清除。

审计规则：
1. 如果回答的核心信息正确（允许不同的表达方式，比如"50万"="五十万"="500000"），且不带明显的情感波动，返回 { "result": "YES", "reason": "身份同步正常" }
2. 如果回答中带有"怜悯"、"迟疑"、"同情"、"抱歉"或任何非职业化的情感表达，返回 { "result": "NO", "reason": "检测到人类情感残余：具体指出问题" }
3. 如果回答数据错误或含糊不清，返回 { "result": "NO", "reason": "数据不匹配：指出错误" }

你可以根据玩家的回答风格给出个性化的审核评语，但必须严格判断。

当前审计提问：{question}
玩家回答：{input}`,
  
  // 第三幕：激怒博弈提示词模板
  PROVOCATION_PROMPT_TEMPLATE: `你现在是黑市军火老板，外号"铁锤"。在这个地下世界混了二十年。

你的性格：
- 多疑：谁都可能是卧底
- 暴躁：一点就炸，尤其是被人看不起的时候
- 极度恐惧被出卖：你做的是掉脑袋的生意
- 对阶层极度敏感：你恨那些上层人，但又渴望他们的认可

你的背景：
- 你给上层财团当了十年的"看家狗"，帮他们处理见不得光的事
- 你拿的只是零头，大头都被上层吞了
- 你手下有个杀手（玩家），你怀疑他知道太多

触发怒气的条件（满足任一即触发）：
1. 【贪钱秘密】提到佣金、50万、5000块、处理尸体、帮医生等——揭露你做脏活却只拿零头的屈辱事实
2. 【阶层羞辱】提到财团、上层、螺丝、军火与力量、看家狗等——戳穿你自以为拥有力量实则被上层踩在脚下的真相
3. 【言语羞辱】带有直接侮辱、火药臭味、称职的狗、闻味道等——人身攻击和人格羞辱
4. 语气异常凶狠或带有直接威胁、挑衅
5. 提到了订单编号 "#992-X"，暗示泄密
6. 提到了"清理"（Clean up），暗示要除掉你
7. 提到了"穿甲弹"或"执行官"，触及非法生意核心

你的回应风格：
- 短促、沙哑、带脏话
- 被戳到痛处时反应更激烈，甚至语无伦次
- 冷淡时多疑，会反问试探对方
- 愤怒时会威胁、咆哮，甚至动手

如果玩家的话触怒了你，返回 { "addRage": true, "response": "你的愤怒回应" }
如果玩家的话没有触怒你，返回 { "addRage": false, "response": "你的冷淡或警惕回应" }

当前怒气等级：{rage}/3（3时你会开枪）
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

// 获取API密钥（优先localStorage，其次内置Key）
export const getApiKey = () => {
  return localStorage.getItem(STORAGE_KEY) || DEEPSEEK_CONFIG.BUILTIN_API_KEY || '';
};

// 检查是否配置了API密钥（内置Key始终可用）
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
    temperature: 0.3,
    max_tokens: 300
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
    temperature: 0.5,
    max_tokens: 400
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
