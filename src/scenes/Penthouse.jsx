import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'
import Portrait from '../components/Portrait'
import { assetPath } from '../core/assetPath'

// ═══════════════════════════════════════════
// 第四幕：剪裁噩梦 → 灵魂质询 → 终局
// ═══════════════════════════════════════════

// 剪裁噩梦对话序列 (Based on Last_Act.md)
const BETRAYAL_STEPS = [
  {
    type: 'visual',
    text: '安安背对着你，站在落地镜前。镜子里，她笑得纯真烂漫，像一朵盛开在温室里的白茶花。你（管家）弯下腰，手里握着一把沉重的、泛着冷光的钢制裁缝剪。',
  },
  {
    type: 'dialogue',
    speaker: '公主',
    text: '（轻声笑着，调整着呼吸）"陈叔叔，帮我把领口这根线头也剪掉吧。爸爸说这件衣服代表着\'新生\'，我穿上它好看吗？"',
  },
  {
    type: 'dialogue',
    speaker: '你（管家）',
    text: '（手稳得像冰冷的机械，剪刀在指间发出清脆的咔哒声）"好看，小姐。这件衣服确实非常适合作为……终点。"',
  },
  {
    type: 'dialogue',
    speaker: '公主',
    text: '（没听清，微微侧头，露出纤细白皙的颈侧）"什么？你说什么终点？"',
  },
  {
    type: 'dialogue',
    speaker: '你（管家）',
    text: '（声音压得很低，带着一种大仇得报的快意）"我说，这种纯洁的白色太单调了。您教过我，这个世界需要更多的\'颜色\'。"',
  },
  {
    type: 'action',
    text: '【特写：剪刀张开的刃口】',
    description: '你没有去剪裙摆，而是猛地伸手锁住了安安的肩膀。在安安还没来得及露出惊恐表情的瞬间，你将锋利的剪刀直接刺入了她那从未受过伤的喉咙。',
    isScissorsCloseUp: true,
  },
]

// 灵魂质询系统日志
const HEART_SYSTEM_LOGS = [
  '[ 警告：逻辑闭环已建立 ]',
  '[ 身份重塑完成。你已获取"上层阶级的女儿"的所有权限与阶层配额 ]',
]

// 镜像低语
const MIRROR_WHISPER = '看啊……这就是你画出的自己。只要你点下头，你就能永远留在这个金色的梦里。'

// 结局A台词
const ENDING_A_LINES = [
  '这就是我想要的……我要住在有阳光的花园里，永远不回那个下层区。',
  '',
  '人可以伪造未来，甚至可以伪造过去。当你终于杀死了自己，这具完美的皮囊，究竟是你逃离的，还是你想成为的？',
  '如果你换掉了记忆、换掉了阶层、换掉了皮囊，那你还是那个想回家的孩子吗？还是说，那个孩子已经作为"代价"被支付掉了？',
]

// 结局B台词
const ENDING_B_LINES = [
  '我就是我，这个噩梦该结束了。',
  '',
  '并不是所有的破碎都意味着毁灭。有些时候，人必须亲手捏碎那个被赋予的、跳动的枷锁，才能在虚无的废墟之上，找回那个从未被污染的、奔跑的自己。',
  '如果自由只能在废墟中呼吸，那么瓦解便是最盛大的洗礼。在那条只有一封信的回家路上，你丢弃了神格，丢弃了阶层，却终于在最后一秒，重新长出了心脏。',
]

export default function Penthouse() {
  const { identityLevel, memoryColors, setScene, setEndingType } = useGameStore()

  // 场景阶段：betrayal → heart → choice → ending
  const [phase, setPhase] = useState('betrayal')
  const [currentStep, setCurrentStep] = useState(0)
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // 剪刀特写震动
  const [screenShake, setScreenShake] = useState(false)
  const [showShock, setShowShock] = useState(false)

  // 心脏阶段
  const [heartSystemLogIndex, setHeartSystemLogIndex] = useState(0)
  const [showMirrorWhisper, setShowMirrorWhisper] = useState(false)

  // 结局阶段
  const [endingType, setLocalEndingType] = useState(null) // 'A' | 'B'
  const [endingLineIndex, setEndingLineIndex] = useState(0)
  const [showFinalUI, setShowFinalUI] = useState(false)
  const [pixelGlitch, setPixelGlitch] = useState(false)

  // ═══ 打字机效果 ═══
  useEffect(() => {
    if (!displayedText && !isTyping) return

    if (isTyping && displayedText) {
      const targetText = displayedText
      let i = 0
      setDisplayedText('')
      const typeInterval = setInterval(() => {
        if (i < targetText.length) {
          setDisplayedText(targetText.substring(0, i + 1))
          i++
        } else {
          clearInterval(typeInterval)
          setIsTyping(false)
          setIsTypingComplete(true)
        }
      }, 40)
      return () => clearInterval(typeInterval)
    }
  }, [isTyping])

  // ═══ 开始打字 ═══
  const startTyping = useCallback((text) => {
    setDisplayedText(text)
    setIsTyping(true)
    setIsTypingComplete(false)
  }, [])

  // ═══ 剪裁噩梦：点击推进 ═══
  const handleBetrayalClick = useCallback(() => {
    if (isTyping) return
    if (!isTypingComplete) return

    const step = BETRAYAL_STEPS[currentStep]

    // 剪刀特写步骤：触发震动和背景切换
    if (step?.isScissorsCloseUp) {
      setScreenShake(true)
      setShowShock(true)
      setTimeout(() => {
        setScreenShake(false)
      }, 800)
      // 震动结束后进入心脏阶段
      setTimeout(() => {
        setPhase('heart')
        setCurrentStep(0)
        setIsTypingComplete(false)
        setDisplayedText('')
      }, 2500)
      return
    }

    // 推进到下一步
    if (currentStep < BETRAYAL_STEPS.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setIsTypingComplete(false)

      const nextStepData = BETRAYAL_STEPS[nextStep]
      if (nextStepData.type === 'action' && nextStepData.isScissorsCloseUp) {
        startTyping(nextStepData.text)
      } else if (nextStepData.text) {
        startTyping(nextStepData.text)
      }
    }
  }, [currentStep, isTyping, isTypingComplete, startTyping])

  // ═══ 初始化第一步 ═══
  useEffect(() => {
    if (phase === 'betrayal' && currentStep === 0 && !displayedText) {
      const firstStep = BETRAYAL_STEPS[0]
      if (firstStep.text) {
        startTyping(firstStep.text)
      }
    }
  }, [phase, currentStep, displayedText, startTyping])

  // ═══ 心脏阶段：系统日志自动推进 ═══
  useEffect(() => {
    if (phase !== 'heart') return

    if (heartSystemLogIndex === 0) {
      const timer = setTimeout(() => {
        startTyping(HEART_SYSTEM_LOGS[0])
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase, heartSystemLogIndex, startTyping])

  // 系统日志完成后自动推进
  const handleHeartLogComplete = useCallback(() => {
    if (heartSystemLogIndex < HEART_SYSTEM_LOGS.length - 1) {
      setTimeout(() => {
        setHeartSystemLogIndex(prev => prev + 1)
        startTyping(HEART_SYSTEM_LOGS[heartSystemLogIndex + 1])
      }, 1500)
    } else {
      // 所有系统日志完成，显示镜像低语
      setTimeout(() => {
        setShowMirrorWhisper(true)
      }, 1500)
    }
  }, [heartSystemLogIndex, startTyping])

  // 镜像低语完成后显示选择
  useEffect(() => {
    if (showMirrorWhisper) {
      const timer = setTimeout(() => {
        setPhase('choice')
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showMirrorWhisper])

  // ═══ 选择结局 ═══
  const handleChoice = useCallback((choice) => {
    setLocalEndingType(choice)
    setEndingType(choice)
    setPhase('ending')
    setEndingLineIndex(0)

    if (choice === 'B') {
      setPixelGlitch(true)
      setTimeout(() => setPixelGlitch(false), 2000)
    }
  }, [])

  // ═══ 结局台词逐行打出 ═══
  useEffect(() => {
    if (phase !== 'ending' || !endingType) return

    const lines = endingType === 'A' ? ENDING_A_LINES : ENDING_B_LINES
    if (endingLineIndex < lines.length) {
      const timer = setTimeout(() => {
        setEndingLineIndex(prev => prev + 1)
      }, endingLineIndex === 0 ? 2000 : 3000)
      return () => clearTimeout(timer)
    } else {
      // 所有台词完成，显示最终UI
      const timer = setTimeout(() => {
        setShowFinalUI(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase, endingType, endingLineIndex])

  // ═══ 返回标题 ═══
  const handleReturnToTitle = useCallback(() => {
    setScene('title')
  }, [setScene])

  // ═══ 获取当前步骤数据 ═══
  const getCurrentBetrayalStep = () => BETRAYAL_STEPS[currentStep]

  // ═══ 渲染剪裁噩梦阶段 ═══
  const renderBetrayalPhase = () => {
    const step = getCurrentBetrayalStep()
    const bgImage = showShock ? assetPath('assets/scenes/an_an_shock.webp') : assetPath('assets/scenes/bedroom_main.webp')

    return (
      <>
        {/* 背景 */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover"
            style={{
              filter: showShock ? 'brightness(0.6) contrast(1.4) saturate(0.3)' : 'brightness(0.7) contrast(1.1)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </motion.div>

        {/* 剪刀SVG - 在步骤5时特写显示 */}
        {step?.isScissorsCloseUp && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.3 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <svg width="200" height="200" viewBox="0 0 200 200" className="opacity-90">
              {/* 剪刀 - 张开的刃口 */}
              <motion.g
                animate={showShock ? { rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.3, repeat: showShock ? 3 : 0 }}
              >
                {/* 左刃 */}
                <path
                  d="M80,40 L60,140 L75,145 L95,50 Z"
                  stroke="white"
                  strokeWidth="1"
                  fill="rgba(255,255,255,0.05)"
                />
                {/* 右刃 */}
                <path
                  d="M120,40 L140,140 L125,145 L105,50 Z"
                  stroke="white"
                  strokeWidth="1"
                  fill="rgba(255,255,255,0.05)"
                />
                {/* 铰链 */}
                <circle cx="100" cy="90" r="5" stroke="white" strokeWidth="1" fill="none" />
                {/* 刃口高光 */}
                <line x1="82" y1="45" x2="62" y2="138" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
                <line x1="118" y1="45" x2="138" y2="138" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              </motion.g>
            </svg>
          </motion.div>
        )}

        {/* 对话框 */}
        <div className="absolute bottom-0 left-0 right-0 z-30 px-8 pb-8">
          <motion.div
            className="backdrop-blur-md bg-black/70 border border-white/10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 说话者标签 */}
            {step?.speaker && (
              <div className="px-6 pt-4 pb-0">
                <span className="text-white/30 font-mono text-[10px] tracking-widest">
                  {step.speaker}
                </span>
              </div>
            )}

            {/* 文字内容 */}
            <div className="px-6 py-4">
              <p className="text-white/80 font-mono text-sm leading-relaxed min-h-[3em]">
                {displayedText || (isTyping ? '' : step?.text || step?.description || '')}
              </p>
            </div>

            {/* 点击提示 */}
            {isTypingComplete && !step?.isScissorsCloseUp && (
              <div className="px-6 pb-3 text-right">
                <motion.span
                  className="text-white/20 font-mono text-[10px] tracking-widest"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  [ 点击继续 ]
                </motion.span>
              </div>
            )}

            {/* 剪刀特写步骤提示 */}
            {step?.isScissorsCloseUp && isTypingComplete && (
              <div className="px-6 pb-3 text-right">
                <motion.span
                  className="text-red-400/40 font-mono text-[10px] tracking-widest"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  [ 点击执行 ]
                </motion.span>
              </div>
            )}
          </motion.div>
        </div>
      </>
    )
  }

  // ═══ 渲染心脏阶段 ═══
  const renderHeartPhase = () => {
    return (
      <>
        {/* 纯黑背景 */}
        <div className="absolute inset-0 bg-black" />

        {/* 心脏核心图片 + 呼吸动画 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <motion.img
            src={assetPath('assets/scenes/beating_heart_core.jpg')}
            alt=""
            className="w-64 h-64 object-contain"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              filter: 'brightness(0.8) contrast(1.2)',
            }}
          />
        </motion.div>

        {/* 系统日志 */}
        <div className="absolute top-1/4 left-0 right-0 z-20 flex flex-col items-center gap-4 px-8">
          {HEART_SYSTEM_LOGS.slice(0, heartSystemLogIndex + 1).map((log, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-red-500/70 font-mono text-sm tracking-widest">
                {i === heartSystemLogIndex ? displayedText || log : log}
              </span>
            </motion.div>
          ))}
        </div>

        {/* 镜像低语 */}
        <AnimatePresence>
          {showMirrorWhisper && (
            <motion.div
              className="absolute top-[38%] left-0 right-0 z-20 flex justify-center px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
            >
              <div className="backdrop-blur-md bg-white/5 border border-white/10 px-8 py-4 max-w-lg text-center">
                <div className="text-white/25 font-mono text-[10px] tracking-widest mb-2">
                  上层女儿（镜像）的低语
                </div>
                <p className="text-white/70 font-mono text-sm leading-relaxed italic">
                  {MIRROR_WHISPER}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ═══ 渲染选择阶段 ═══
  const renderChoicePhase = () => {
    return (
      <>
        {/* 纯黑背景 */}
        <div className="absolute inset-0 bg-black" />

        {/* 心脏继续跳动 */}
        <motion.div className="absolute inset-0 flex items-center justify-center opacity-40">
          <motion.img
            src={assetPath('assets/scenes/beating_heart_core.jpg')}
            alt=""
            className="w-48 h-48 object-contain"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* 两个选择按钮 */}
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            <motion.div
              className="text-white/30 font-mono text-[10px] tracking-widest mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              灵魂的质询
            </motion.div>

            <div className="flex gap-12">
              {/* 选项A */}
              <motion.button
                onClick={() => handleChoice('A')}
                className="group relative backdrop-blur-md bg-white/[0.03] border border-white/10 px-10 py-8 hover:border-white/30 transition-all duration-500"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-white/20 font-mono text-[8px] tracking-widest mb-3">
                  OPTION A
                </div>
                <div className="text-white/70 font-mono text-base tracking-wider mb-2">
                  成为梦境
                </div>
                <div className="text-white/25 font-mono text-[10px]">
                  The Gilded Cage
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/0 group-hover:bg-white/20 transition-all duration-500" />
              </motion.button>

              {/* 选项B */}
              <motion.button
                onClick={() => handleChoice('B')}
                className="group relative backdrop-blur-md bg-white/[0.03] border border-white/10 px-10 py-8 hover:border-red-500/30 transition-all duration-500"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-red-400/20 font-mono text-[8px] tracking-widest mb-3">
                  OPTION B
                </div>
                <div className="text-white/70 font-mono text-base tracking-wider mb-2">
                  捏碎心脏
                </div>
                <div className="text-white/25 font-mono text-[10px]">
                  The Last Pulse
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-red-500/0 group-hover:bg-red-500/20 transition-all duration-500" />
              </motion.button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ═══ 渲染结局阶段 ═══
  const renderEndingPhase = () => {
    const isA = endingType === 'A'
    const lines = isA ? ENDING_A_LINES : ENDING_B_LINES
    const bgImage = isA ? assetPath('assets/scenes/ending_remain.webp') : assetPath('assets/scenes/ending_shatter.webp')

    return (
      <>
        {/* 结局背景 */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover"
            style={{
              filter: isA
                ? 'grayscale(80%) brightness(0.4) contrast(1.3)'
                : 'brightness(0.5) contrast(1.5) saturate(1.5)',
            }}
          />
          <div className={`absolute inset-0 ${isA ? 'bg-black/50' : 'bg-black/30'}`} />
        </motion.div>

        {/* 结局B：像素崩坏效果 */}
        {pixelGlitch && (
          <motion.div
            className="absolute inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7, 1, 0] }}
            transition={{ duration: 2 }}
          >
            <div className="absolute inset-0" style={{ filter: 'url(#noise-filter)', opacity: 0.4 }} />
            {/* 彩色条纹 */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-0 right-0"
                style={{
                  top: `${8 + i * 8}%`,
                  height: '2px',
                  background: `hsl(${i * 30 + 180}, 100%, 60%)`,
                  opacity: 0.3,
                }}
                animate={{
                  scaleX: [0, 1, 0],
                  opacity: [0, 0.5, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  repeat: 3,
                }}
              />
            ))}
          </motion.div>
        )}

        {/* 结局B：高亮度彩色滤镜持续效果 */}
        {!isA && !pixelGlitch && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none"
            animate={{
              opacity: [0, 0.08, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background: 'linear-gradient(45deg, #FF6B8B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* 结局台词 */}
        <div className="absolute inset-0 z-20 flex items-center justify-center px-8">
          <div className="max-w-lg text-center">
            {lines.slice(0, endingLineIndex).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5 }}
                className="mb-4"
              >
                {line ? (
                  <p className={`font-mono text-sm leading-relaxed ${
                    isA ? 'text-white/50' : 'text-white/60'
                  }`}>
                    {line}
                  </p>
                ) : (
                  <div className="h-4" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* 最终UI锁定 */}
        <AnimatePresence>
          {showFinalUI && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30 pb-12 flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2 }}
            >
              {/* 结局标签 */}
              <div className={`font-mono text-lg tracking-widest ${
                isA ? 'text-white/40' : 'text-white/60'
              }`}>
                {isA ? '[ 阶层跃迁成功：你已失格 ]' : '[ 协议终止：你是你自己 ]'}
              </div>

              {/* 自画像颜色条 */}
              <div className="flex gap-1">
                {memoryColors.map((color, i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3"
                    style={{ backgroundColor: color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                  />
                ))}
              </div>

              {/* 返回标题 */}
              <motion.button
                onClick={handleReturnToTitle}
                className="text-white/15 font-mono text-[10px] tracking-widest hover:text-white/40 transition-colors border border-white/5 px-6 py-2 hover:border-white/15"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                [ 返回标题 ]
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ═══ 打字完成回调处理 ═══
  useEffect(() => {
    if (!isTypingComplete) return

    if (phase === 'heart') {
      handleHeartLogComplete()
    }
  }, [isTypingComplete, phase, handleHeartLogComplete])

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black"
      onClick={phase === 'betrayal' ? handleBetrayalClick : undefined}
    >
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

      {/* ═══ 屏幕震动效果 ═══ */}
      <AnimatePresence>
        {screenShake && (
          <motion.div
            className="absolute inset-0 z-50"
            animate={{ x: [0, -8, 8, -5, 5, -2, 2, 0], y: [0, 4, -4, 2, -2, 0] }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* 左上角自画像 */}
      <div className="absolute left-4 top-4 w-24 h-24 opacity-20 z-10">
        <Portrait step={identityLevel} />
      </div>

      {/* ═══ 各阶段渲染 ═══ */}
      <AnimatePresence mode="wait">
        {phase === 'betrayal' && (
          <motion.div
            key="betrayal"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {renderBetrayalPhase()}
          </motion.div>
        )}

        {phase === 'heart' && (
          <motion.div
            key="heart"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            {renderHeartPhase()}
          </motion.div>
        )}

        {phase === 'choice' && (
          <motion.div
            key="choice"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {renderChoicePhase()}
          </motion.div>
        )}

        {phase === 'ending' && (
          <motion.div
            key={`ending-${endingType}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            {renderEndingPhase()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 text-white/20 font-mono text-xs z-50">
          <div>阶段: {phase}</div>
          <div>步骤: {currentStep}</div>
          <div>结局: {endingType || '未选择'}</div>
          <div>身份等级: {identityLevel}</div>
        </div>
      )}
    </div>
  )
}
