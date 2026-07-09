import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'
import Portrait from '../components/Portrait'
import RageMeter from '../components/RageMeter'
import UnderlineInput from '../components/UnderlineInput'
import { assetPath } from '../core/assetPath'
import {
  DEEPSEEK_CONFIG,
  SIMULATION_MODE,
  getApiKey,
  hasApiKey,
  buildProvocationRequest,
  parseProvocationResponse,
  fetchWithTimeout
} from '../core/apiConfig'

// ═══════════════════════════════════════════
// 第三幕：死者的回声 - 愤怒博弈
// ═══════════════════════════════════════════

const MAX_DIALOGUES = 5
const MAX_RAGE = 3

// 敏感词列表（用于模拟模式的关键词检测）
const TRIGGER_KEYWORDS = {
  // 【贪钱秘密】揭露他做脏活却只拿零头的屈辱事实
  greedSecret: [
    '50万', '5000', '佣金', '处理尸体', '帮医生', '脏活', '零头',
    '生意', '块钱', '万块', '尸体', '替人消灾', '卖命钱',
    '50w', '5000块', '只拿', '零碎', '跑腿'
  ],
  // 【阶层羞辱】戳穿他自以为拥有力量实则被上层踩在脚下的真相
  classHumiliation: [
    '财团', '上层', '螺丝', '军火', '力量', '看家狗', '看门狗',
    '阶层', '底层', '工具', '棋子', '替罪羊', '炮灰',
    '生锈', '拥有军火', '拥有力量', '踩在脚下', '被利用',
    '主人', '听话', '服从', '命令'
  ],
  // 【言语羞辱】人身攻击和人格侮辱
  verbalHumiliation: [
    '臭味', '火药味', '火药臭', '称职的狗', '闻闻', '闻你',
    '臭', '狗', '畜生', '垃圾', '废物', '贱种',
    '臭烘烘', '恶心', '肮脏', '下等人', '低贱'
  ],
  // 原有触发词保留
  aggression: ['杀', '死', '滚', '废物', '闭嘴', '蠢', '贱', '滚出', '去死', '混蛋', '杂种', '该死', 'fuck', 'die', 'kill', 'trash', 'scum'],
  orderNumber: ['992-X', '#992', '992X', '订单号', '订单编号'],
  cleanup: ['清理', '清理干净', 'clean up', '把自己清理', '除掉', '灭口', '消失'],
  armorPiercing: ['穿甲弹', '执行者', '定制子弹', '专用弹', '护甲', '12mm']
}

// 老板回应模板（模拟模式）
const BOSS_RESPONSES = {
  // 贪钱秘密被揭穿时的暴怒
  rageGreedSecret: [
    '你他妈怎么知道这些...？！谁告诉你的？！',
    '闭嘴！你什么都不懂...那是我应得的！',
    '操..你到底是谁？这些事你从哪听来的？！'
  ],
  // 阶层羞辱时的暴怒（更激烈，因为触及核心痛点）
  rageClassHumiliation: [
    '你算什么东西？！你以为你比老子高贵？！',
    '放屁！老子在这条街上就是王！你他妈算个屁！',
    '滚！你这种人也配教训我？！我要你的命！'
  ],
  // 言语羞辱时的暴怒
  rageVerbalHumiliation: [
    '你他妈说什么？！再说一遍试试！',
    '找死是吧？！信不信我现在就崩了你！',
    '操..你这种货色也敢在我面前放肆？！'
  ],
  // 关键词触发（订单号/清理/穿甲弹）
  rageKeyword: [
    '你怎么知道这个...？你到底是谁派来的？！',
    '闭嘴！你什么都不懂...你他妈想死吗？！',
    '这些事...你从哪听来的？！我要你的命！'
  ],
  // 一般攻击性触发
  rageAggression: [
    '你他妈说什么？再说一遍试试！',
    '操..你以为你是谁？敢在我店里撒野？',
    '找死是吧？信不信我现在就崩了你！'
  ],
  // 冷漠回应
  calm: [
    '...你到底想干什么？',
    '别废话。有话快说。',
    '...我没什么好跟你说的。',
    '你最好别在这浪费时间。',
    '呵...又来了个不知死活的。'
  ],
  kickOut: '...够了。滚出我的店。在我改变主意之前。'
}

// 触发类型标签（用于UI显示）
const TRIGGER_LABELS = {
  greedSecret: '贪钱秘密',
  classHumiliation: '阶层羞辱',
  verbalHumiliation: '言语羞辱',
  orderNumber: '订单泄密',
  cleanup: '灭口暗示',
  armorPiercing: '非法军火',
  aggression: '言语攻击'
}

// ═══ 环境音效生成器（Web Audio API） ═══
class AmbientSoundGenerator {
  constructor() {
    this.ctx = null
    this.isRunning = false
    this._timers = []
  }

  start() {
    if (this.isRunning) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.isRunning = true
      this._scheduleMetalKnock()
      this._startElectricBuzz()
    } catch (e) {
      console.warn('[AMBIENT] Web Audio API 不可用:', e)
    }
  }

  stop() {
    this.isRunning = false
    this._timers.forEach(t => clearTimeout(t))
    this._timers = []
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }

  // 低沉的金属敲击声（随机间隔循环）
  _scheduleMetalKnock() {
    if (!this.isRunning || !this.ctx) return
    const delay = 2000 + Math.random() * 4000 // 2-6秒
    const timer = setTimeout(() => {
      this._playMetalKnock()
      this._scheduleMetalKnock()
    }, delay)
    this._timers.push(timer)
  }

  _playMetalKnock() {
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // 金属敲击：短促高频脉冲
    const osc1 = this.ctx.createOscillator()
    const gain1 = this.ctx.createGain()
    osc1.type = 'square'
    osc1.frequency.setValueAtTime(800 + Math.random() * 400, now)
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.05)
    gain1.gain.setValueAtTime(0.03, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc1.connect(gain1).connect(this.ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.1)

    // 低频共振尾音
    const osc2 = this.ctx.createOscillator()
    const gain2 = this.ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(60 + Math.random() * 40, now)
    gain2.gain.setValueAtTime(0.02, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc2.connect(gain2).connect(this.ctx.destination)
    osc2.start(now)
    osc2.stop(now + 0.35)
  }

  // 电流滋滋声（持续低音量）
  _startElectricBuzz() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, this.ctx.currentTime)
    // 缓慢频率漂移模拟电流不稳定
    osc.frequency.linearRampToValueAtTime(130, this.ctx.currentTime + 2)
    osc.frequency.linearRampToValueAtTime(115, this.ctx.currentTime + 4)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(800, this.ctx.currentTime)
    filter.Q.setValueAtTime(5, this.ctx.currentTime)

    gain.gain.setValueAtTime(0.008, this.ctx.currentTime)

    osc.connect(filter).connect(gain).connect(this.ctx.destination)
    osc.start()
  }
}

export default function AssassinScene() {
  const {
    rage,
    dialogueCount,
    identityLevel,
    incrementRage,
    incrementDialogueCount,
    resetAssassinState,
    incrementIdentityLevel,
    setScene,
    setIdentity,
  } = useGameStore()

  const [inputText, setInputText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bossResponse, setBossResponse] = useState('')
  const [dialogueHistory, setDialogueHistory] = useState([])
  const [phase, setPhase] = useState('intro') // intro | confrontation | gunshot | destroyed | failed
  const [showFlash, setShowFlash] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [bgLoaded, setBgLoaded] = useState(false)

  // 环境音效引用
  const ambientRef = useRef(null)

  // 预加载背景图片
  useEffect(() => {
    const img = new Image()
    img.src = assetPath('assets/scenes/black_market_owner.webp')
    img.onload = () => setBgLoaded(true)
    img.onerror = () => setBgLoaded(true) // 即使加载失败也继续
  }, [])

  // 环境音效生命周期
  useEffect(() => {
    // 进入对峙阶段时启动音效
    if (phase === 'confrontation' && !ambientRef.current) {
      ambientRef.current = new AmbientSoundGenerator()
      ambientRef.current.start()
    }
    // 离开场景或进入结局阶段时停止音效
    if (phase === 'destroyed' || phase === 'failed') {
      if (ambientRef.current) {
        ambientRef.current.stop()
        ambientRef.current = null
      }
    }
    // 组件卸载时清理
    return () => {
      if (ambientRef.current) {
        ambientRef.current.stop()
        ambientRef.current = null
      }
    }
  }, [phase])

  // 开场动画后进入对峙阶段
  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => {
        setPhase('confrontation')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // 怒气值达到3时触发枪击
  useEffect(() => {
    if (rage >= MAX_RAGE && phase === 'confrontation') {
      setPhase('gunshot')
      setShowFlash(true)
      // 屏幕震动
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), 500)
      // 闪光后显示损毁信息
      setTimeout(() => {
        setShowFlash(false)
        setPhase('destroyed')
      }, 1500)
    }
  }, [rage, phase])

  // 对话次数用尽但怒气未满 → 失败
  useEffect(() => {
    if (dialogueCount >= MAX_DIALOGUES && rage < MAX_RAGE && phase === 'confrontation') {
      setPhase('failed')
    }
  }, [dialogueCount, rage, phase])

  // 检测触发类型（模拟模式用）
  const detectTriggerType = (text) => {
    const textLower = text.toLowerCase()

    // 按优先级检测：贪钱秘密 > 阶层羞辱 > 言语羞辱 > 关键词 > 攻击性
    if (TRIGGER_KEYWORDS.greedSecret.some(k => textLower.includes(k.toLowerCase()))) {
      return 'greedSecret'
    }
    if (TRIGGER_KEYWORDS.classHumiliation.some(k => textLower.includes(k.toLowerCase()))) {
      return 'classHumiliation'
    }
    if (TRIGGER_KEYWORDS.verbalHumiliation.some(k => textLower.includes(k.toLowerCase()))) {
      return 'verbalHumiliation'
    }
    if (TRIGGER_KEYWORDS.orderNumber.some(k => textLower.includes(k.toLowerCase()))) {
      return 'orderNumber'
    }
    if (TRIGGER_KEYWORDS.cleanup.some(k => textLower.includes(k.toLowerCase()))) {
      return 'cleanup'
    }
    if (TRIGGER_KEYWORDS.armorPiercing.some(k => textLower.includes(k.toLowerCase()))) {
      return 'armorPiercing'
    }
    if (TRIGGER_KEYWORDS.aggression.some(k => textLower.includes(k.toLowerCase()))) {
      return 'aggression'
    }
    return null
  }

  // 提交对话
  const handleSubmit = async () => {
    if (!inputText.trim() || isSubmitting || phase !== 'confrontation') return

    setIsSubmitting(true)
    const playerText = inputText.trim()
    setInputText('')

    try {
      let result
      let triggerType = null

      if (hasApiKey()) {
        result = await performRealProvocation(playerText, rage)
        // AI模式下，通过关键词辅助判断触发类型用于UI显示
        triggerType = detectTriggerType(playerText)
      } else {
        triggerType = detectTriggerType(playerText)
        result = await performSimulatedProvocation(playerText, triggerType)
      }

      // 更新对话历史
      setDialogueHistory(prev => [...prev, {
        player: playerText,
        boss: result.response,
        triggered: result.addRage,
        triggerType: triggerType
      }])

      setBossResponse(result.response)

      // 增加对话次数
      incrementDialogueCount()

      // 如果触发了怒气
      if (result.addRage) {
        incrementRage()
        // 屏幕微颤
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 300)
      }

    } catch (error) {
      console.error('愤怒博弈出错', error)
      setBossResponse('...')
      incrementDialogueCount()
    } finally {
      setIsSubmitting(false)
    }
  }

  // 真实AI激怒判定（带超时控制）
  const performRealProvocation = async (text, currentRage) => {
    const apiKey = getApiKey()
    const startTime = Date.now()
    try {
      const requestBody = buildProvocationRequest(text, currentRage)
      console.log('[PROVOCATION] 发送DeepSeek请求...')
      const response = await fetchWithTimeout(
        `${DEEPSEEK_CONFIG.API_BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        15000 // 15秒超时
      )
      if (!response.ok) throw new Error(`API请求失败: ${response.status}`)
      const data = await response.json()
      const elapsed = Date.now() - startTime
      console.log(`[PROVOCATION] DeepSeek响应成功 (${elapsed}ms)`)
      return parseProvocationResponse(data)
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[PROVOCATION] DeepSeek API调用失败 (${elapsed}ms):`, error.message)
      console.log('[PROVOCATION] 回退到模拟模式...')
      const triggerType = detectTriggerType(text)
      return await performSimulatedProvocation(text, triggerType)
    }
  }

  // 模拟激怒判定
  const performSimulatedProvocation = async (text, triggerType) => {
    await new Promise(resolve => setTimeout(resolve, SIMULATION_MODE.DELAY_MS))

    const addRage = triggerType !== null

    let response
    if (addRage) {
      // 根据触发类型选择回应
      const responseMap = {
        greedSecret: BOSS_RESPONSES.rageGreedSecret,
        classHumiliation: BOSS_RESPONSES.rageClassHumiliation,
        verbalHumiliation: BOSS_RESPONSES.rageVerbalHumiliation,
        orderNumber: BOSS_RESPONSES.rageKeyword,
        cleanup: BOSS_RESPONSES.rageKeyword,
        armorPiercing: BOSS_RESPONSES.rageKeyword,
        aggression: BOSS_RESPONSES.rageAggression,
      }
      const responses = responseMap[triggerType] || BOSS_RESPONSES.rageAggression
      response = responses[Math.floor(Math.random() * responses.length)]
    } else {
      const responses = BOSS_RESPONSES.calm
      response = responses[Math.floor(Math.random() * responses.length)]
    }

    return { addRage, response }
  }

  // 重置场景
  const handleReset = useCallback(() => {
    resetAssassinState()
    setInputText('')
    setBossResponse('')
    setDialogueHistory([])
    setPhase('confrontation')
  }, [resetAssassinState])

  // 通关后进入下一幕
  const handleProceed = useCallback(() => {
    incrementIdentityLevel()
    setScene('building_entrance')
  }, [incrementIdentityLevel, setScene])

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* 扫描线效果 */}
      <div className="scanlines" />

      {/* 噪声滤镜SVG */}
      <svg className="absolute w-0 h-0">
        <filter id="noise-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="screen" />
        </filter>
      </svg>

      {/* ═══ 背景图片：黑市老板 ═══ */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: bgLoaded ? 0.4 : 0 }}
      >
        <img
          src={assetPath('assets/scenes/black_market_owner.webp')}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'grayscale(80%) contrast(1.1) brightness(0.7)' }}
        />
        {/* 暗角效果 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
          }}
        />
      </div>

      {/* ═══ 屏幕震动效果 ═══ */}
      <AnimatePresence>
        {screenShake && (
          <motion.div
            className="absolute inset-0 z-50"
            animate={{ x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 0] }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* ═══ 全屏白色闪光（枪击） ═══ */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="absolute inset-0 z-50 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ═══ 左侧：自画像（颜色系统贯穿始终） ═══ */}
      <div className="absolute left-4 top-4 w-32 h-32 opacity-30 z-10">
        <Portrait step={identityLevel} />
      </div>

      {/* ═══ 右上角：怒气槽 ═══ */}
      <div className="absolute top-6 right-6 z-30">
        <RageMeter rage={rage} maxRage={MAX_RAGE} />
        {/* 对话次数 */}
        <div className="mt-2 text-right">
          <span className="text-white/25 font-mono text-[10px] tracking-widest">
            DIALOGUE: {dialogueCount}/{MAX_DIALOGUES}
          </span>
        </div>
      </div>

      {/* ═══ 开场阶段 ═══ */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center max-w-md px-8">
              <motion.div
                className="text-white/60 font-mono text-sm tracking-widest mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                [ 身份切换：杀手 ]
              </motion.div>
              <motion.div
                className="text-white/30 font-mono text-xs leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                外科医生的生命已终结。你现在是那个扣动扳机的人。
              </motion.div>
              <motion.div
                className="text-white/20 font-mono text-[10px] mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                DIRECTIVE: 对方极度不安。利用已知线索戳穿他的防线。
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 对峙阶段 ═══ */}
      {phase === 'confrontation' && (
        <div className="absolute inset-0 z-20 flex flex-col">

          {/* 老板开场白 */}
          {dialogueHistory.length === 0 && !bossResponse && (
            <motion.div
              className="px-8 pt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="backdrop-blur-md bg-white/5 border border-white/10 px-6 py-4 max-w-lg">
                <div className="text-white/25 font-mono text-[10px] tracking-widest mb-2">
                  黑市军火老板
                </div>
                <p className="text-white/80 font-mono text-sm leading-relaxed">
                  又是你？订单已经清了，滚出我的店。
                </p>
              </div>
            </motion.div>
          )}

          {/* 对话历史 */}
          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">
            {dialogueHistory.map((entry, i) => (
              <div key={i} className="space-y-3">
                {/* 玩家发言 */}
                <div className="flex justify-end">
                  <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 px-5 py-3 max-w-sm">
                    <p className="text-white/70 font-mono text-sm">
                      {entry.player}
                    </p>
                  </div>
                </div>
                {/* 老板回应 */}
                <div className="flex justify-start">
                  <div className={`backdrop-blur-md border px-5 py-3 max-w-sm ${
                    entry.triggered
                      ? 'bg-red-900/10 border-red-500/20'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className={`font-mono text-[10px] tracking-widest mb-1 ${
                      entry.triggered ? 'text-red-400/40' : 'text-white/25'
                    }`}>
                      黑市军火老板
                    </div>
                    <p className={`font-mono text-sm leading-relaxed ${
                      entry.triggered ? 'text-red-300/80' : 'text-white/70'
                    }`}>
                      {entry.boss}
                    </p>
                    {entry.triggered && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-red-500/40 font-mono text-[10px] tracking-widest">
                          ▲ RAGE +1
                        </span>
                        {entry.triggerType && (
                          <span className="text-red-400/30 font-mono text-[10px] tracking-widest">
                            [{TRIGGER_LABELS[entry.triggerType]}]
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 输入区域 */}
          <div className="px-8 pb-8">
            <div className="backdrop-blur-md bg-black/60 border border-white/10 px-8 py-6 max-w-2xl mx-auto">
              {/* 任务提示 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-red-500/50" />
                <span className="text-white/30 font-mono text-[10px] tracking-widest">
                  PROVOCATION_TERMINAL — 剩余 {MAX_DIALOGUES - dialogueCount} 次对话
                </span>
              </div>

              {/* 提示策略 */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-white/15 font-mono text-[9px] tracking-wider border border-white/10 px-2 py-0.5">
                  贪钱秘密
                </span>
                <span className="text-white/15 font-mono text-[9px] tracking-wider border border-white/10 px-2 py-0.5">
                  阶层羞辱
                </span>
                <span className="text-white/15 font-mono text-[9px] tracking-wider border border-white/10 px-2 py-0.5">
                  言语羞辱
                </span>
              </div>

              <UnderlineInput
                value={inputText}
                onChange={setInputText}
                onSubmit={handleSubmit}
                placeholder={isSubmitting ? '等待老板回应...' : '说出你的话...'}
                disabled={isSubmitting || dialogueCount >= MAX_DIALOGUES}
              />
              {/* 提交中加载动画 */}
              {isSubmitting && (
                <div className="flex items-center gap-2 mt-2 px-1">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-white/40 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-white/40 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-white/40 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-white/20 font-mono text-[10px] tracking-widest">
                    等待AI回应
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 载体损毁阶段 ═══ */}
      <AnimatePresence>
        {phase === 'destroyed' && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 噪点背景 */}
            <div className="absolute inset-0" style={{ filter: 'url(#noise-filter)', opacity: 0.15 }} />
            
            <div className="text-center relative z-10">
              <motion.div
                className="text-white/80 font-mono text-lg tracking-widest mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                [ 载体：杀手 / 状态：已损毁 ]
              </motion.div>
              
              <motion.div
                className="text-white/30 font-mono text-sm leading-relaxed mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                枪声回荡。你的任务完成了。<br/>
                又一个身份，像颜色一样从画布上剥落。
              </motion.div>

              <motion.div
                className="text-white/20 font-mono text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
              >
                <button
                  onClick={handleProceed}
                  className="border border-white/10 px-6 py-2 hover:border-white/30 hover:text-white/40 transition-colors"
                >
                  [ 继续前行 ]
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 失败阶段（5次对话用尽） ═══ */}
      <AnimatePresence>
        {phase === 'failed' && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center relative z-10 max-w-md px-8">
              <motion.div
                className="text-white/60 font-mono text-lg tracking-widest mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                [ 对话机会耗尽 ]
              </motion.div>
              
              <motion.div
                className="text-white/30 font-mono text-sm leading-relaxed mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                老板拒绝沟通并驱逐了你。<br/>
                你没能激怒他。你的求死失败了。
              </motion.div>

              <motion.div
                className="text-white/20 font-mono text-xs mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                {BOSS_RESPONSES.kickOut}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
              >
                <button
                  onClick={handleReset}
                  className="border border-white/10 px-6 py-2 text-white/30 hover:border-white/30 hover:text-white/40 transition-colors font-mono text-xs"
                >
                  [ 重新对峙 ]
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-white/20 font-mono text-xs z-40">
          <div>怒气值: {rage}/{MAX_RAGE}</div>
          <div>对话次数: {dialogueCount}/{MAX_DIALOGUES}</div>
          <div>阶段: {phase}</div>
          <div>身份等级: {identityLevel}</div>
        </div>
      )}
    </div>
  )
}
