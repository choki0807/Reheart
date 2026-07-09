import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'
import WeChatFrame from '../components/WeChatFrame'
import CatSketch from '../components/CatSketch'
import Terminal from '../components/Terminal'
import { assetPath } from '../core/assetPath'

// 根据 prologue.md 的完整序幕阶段定义
const PHASES = {
  // 阶段一：冷漠的信道 (5个步骤)
  PHASE_1_MOBILE: {
    name: '手机对话',
    steps: [
      { type: 'visual', description: '中央浮现 1px 线条勾勒的极简手机框' },
      { type: 'dialogue', text: '我：妈妈，对不起打扰了，能不能借我50块钱？我快没东西吃了。' },
      { type: 'dialogue', text: '( 状态栏：对方正在输入... 持续3秒 )' },
      { type: 'dialogue', text: '妈：我有自己的家庭。' },
      { type: 'dialogue', text: '( 提示音效：对方已开启朋友验证，你还不是他（她）朋友。 )' }
    ]
  },
  
  // 阶段二：画室的呓语 (5个步骤)
  PHASE_2_PORTRAIT: {
    name: '自画像绘制',
    steps: [
      { type: 'dialogue', text: '女主：它甚至不愿意为了这50块钱维持那个虚假的圆圈。' },
      { type: 'dialogue', text: '女主：没关系，阿喵。我有你，我还有这幅画。' },
      { type: 'dialogue', text: '女主：这块红色是太阳的颜色，虽然我只在旧平板的广告位里见过它。' },
      { type: 'dialogue', text: '女主：最后……一笔。阿喵，你看，我把自己画得多么完整。' },
      { type: 'visual', description: '沉闷的枪响。全屏剧烈颤抖（Glitch）。自画像中心炸裂。全屏转黑，色彩瞬间抽离。', autoTrigger: true }
    ]
  },
  
  // 阶段三：意识荒原 (6个步骤)
  PHASE_3_VOID: {
    name: '猫的对话',
    steps: [
      { type: 'dialogue', text: '猫：你的画还没画完，对吗？' },
      { type: 'dialogue', text: '女主：...', delay: 2000 },
      { type: 'dialogue', text: '猫：她们拿走了你的命，我把它还给你。但代价是，你要成为我。' },
      { type: 'dialogue', text: '猫：让我成为你的心，去拿回那些本该属于你的颜色。' },
      { type: 'dialogue', text: '女主：...', delay: 2000 },
      { type: 'visual', description: '猫的轮廓解构，化为无数细线汇聚。心跳声（低频震动）。' }
    ]
  },
  
  // 阶段四：手术台：强制夺舍 (3个闪烁)
  PHASE_4_SURGERY: {
    name: '手术台觉醒',
    steps: [
      { type: 'visual', description: '画面极暗，模拟濒死视角的模糊感。' },
      { type: 'dialogue', text: '医生声音：准备关机，这个载体已经冷了。', flash: true, flashDuration: 0.2 },
      { type: 'dialogue', text: '医生声音：等等，它的心率...在以非生物频率跳动？', flash: true, flashDuration: 0.4 },
      { type: 'dialogue', text: '[ 系统日志：正在建立神经连接... ]\n[ 载体：外科医生 / 状态：被接管 ]', flash: true, flashDuration: 1.5 }
    ]
  },
  
  // 阶段五：视角翻转 (2个步骤，第2步后结束)
  PHASE_5_FLIP: {
    name: '视角翻转',
    steps: [
      { type: 'visual', description: '白光散去。场景从"仰视"转变为"俯视"。' },
      { type: 'dialogue', text: '女主（通过医生的口音）：...这是，我？', autoSwitch: true }
    ]
  }
}

// 将所有步骤扁平化
const ALL_STEPS = []
let stepId = 0
Object.values(PHASES).forEach(phase => {
  phase.steps.forEach(step => {
    ALL_STEPS.push({
      id: stepId++,
      ...step,
      phase: phase.name
    })
  })
})

// 微信消息数据（用于阶段一）
const WECHAT_MESSAGES = [
  { side: 'left', text: '妈妈，对不起打扰了，能不能借我50块钱？我快没东西吃了。', isTyping: true },
  { side: 'right', text: '我有自己的家庭。', isTyping: false }
]

export default function Intro() {
  const { setScene, incrementIdentityLevel, setShowProloguePortrait } = useGameStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashDuration, setFlashDuration] = useState(0)
  const [showGlitch, setShowGlitch] = useState(false)
  const [portraitGrayscale, setPortraitGrayscale] = useState(false)
  const [showDeathMoment, setShowDeathMoment] = useState(false)
  
  const currentStepData = ALL_STEPS[currentStep]
  
  // 处理点击推进
  const handleClickNext = () => {
    if (isTypingComplete && !currentStepData.autoTrigger && !currentStepData.autoSwitch) {
      if (currentStep < ALL_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
        setIsTypingComplete(false)
      }
    }
  }
  
  // 处理文字显示完成
  const handleTypingComplete = () => {
    setIsTypingComplete(true)
    
    // 如果是自动触发的步骤，等待后自动推进
    if (currentStepData.autoTrigger) {
      setTimeout(() => {
        if (currentStep < ALL_STEPS.length - 1) {
          setCurrentStep(prev => prev + 1)
          setIsTypingComplete(false)
        }
      }, 2000)
    }
    
    // 如果是自动切换场景的步骤（阶段五第2步）
    if (currentStepData.autoSwitch) {
      setTimeout(() => {
        incrementIdentityLevel() // 身份等级设为1，自画像第一路径变灰
        setScene('title') // 转场至标题页，而非直接进入手术室
      }, 3000)
    }
    
    // 如果是闪烁步骤
    if (currentStepData.flash) {
      setShowFlash(true)
      setFlashDuration(currentStepData.flashDuration * 1000)
      
      // 闪烁结束后自动推进到下一步
      setTimeout(() => {
        setShowFlash(false)
        
        // 如果不是最后一步，自动推进
        if (currentStep < ALL_STEPS.length - 1) {
          setCurrentStep(prev => prev + 1)
          setIsTypingComplete(false)
        }
      }, currentStepData.flashDuration * 1000)
    }
    
    // 自画像完成时（步骤8："最后……一笔"），显示身份画像覆盖层
    if (currentStep === 8) {
      setShowProloguePortrait(true)
    }
    
    // 如果是枪击步骤（阶段二第5步，步骤9），隐藏画像覆盖层
    if (currentStepData.description && currentStepData.description.includes('枪响')) {
      setShowProloguePortrait(false)
      setShowGlitch(true)
      setPortraitGrayscale(true)
      setTimeout(() => {
        setShowGlitch(false)
      }, 1000)
    }
  }

  // 阶段三开始时渐显 death_moment 图片
  useEffect(() => {
    // 步骤11是阶段三的开始（5+5+1=11）
    if (currentStep >= 11 && currentStep <= 16) {
      const timer = setTimeout(() => {
        setShowDeathMoment(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setShowDeathMoment(false)
    }
  }, [currentStep])
  
  // 获取当前Terminal文本
  const getCurrentTerminalText = () => {
    if (!currentStepData) return ''
    
    if (currentStepData.type === 'dialogue') {
      return currentStepData.text
    }
    
    if (currentStepData.type === 'visual') {
      return currentStepData.description || ''
    }
    
    return ''
  }
  
  // 判断是否显示点击提示
  const shouldShowClickPrompt = () => {
    if (!isTypingComplete) return false
    if (currentStepData.autoTrigger || currentStepData.autoSwitch) return false
    if (currentStepData.flash) return false
    return true
  }
  
  // 判断是否允许Terminal点击
  const shouldAllowTerminalClick = () => {
    if (!isTypingComplete) return false
    if (currentStepData.autoTrigger || currentStepData.autoSwitch) return false
    if (currentStepData.flash) return false
    return true
  }
  
  // 渲染当前步骤的视觉元素
  const renderVisualElements = () => {
    // 阶段一：手机对话 (步骤0-4)
    if (currentStep >= 0 && currentStep <= 4) {
      const wechatIndex = Math.max(0, currentStep - 1)
      const isDestroyed = currentStep >= 4
      
      return (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <WeChatFrame 
            messages={wechatIndex > 0 ? WECHAT_MESSAGES.slice(0, Math.min(wechatIndex, 2)) : []}
            isDestroyed={isDestroyed}
          />
          
          {/* 呼吸感微动 */}
          <motion.div
            className="absolute inset-0"
            animate={{ 
              y: [0, -1, 0],
            }}
            transition={{ 
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )
    }
    
    // 阶段二：自画像绘制 (步骤5-9)
    if (currentStep >= 5 && currentStep <= 9) {
      const isGunshotStep = currentStep === 9 // 步骤9是枪击步骤
      
      return (
        <div className="absolute inset-0">
          {/* 自画像背景图 - portrait_full.png */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isGunshotStep && portraitGrayscale ? 0.5 : 0.85,
              filter: portraitGrayscale ? 'grayscale(100%) brightness(0.5)' : 'brightness(0.85)',
              x: showGlitch ? [0, -8, 8, -4, 4, 0] : 0,
            }}
            transition={{ 
              opacity: { duration: 1 },
              filter: { duration: 0.3 },
              x: { duration: 0.15, repeat: showGlitch ? 3 : 0 }
            }}
          >
            <img
              src={assetPath('assets/scenes/portrait_full.webp')}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* 微弱噪点叠加 */}
            <div
              className="absolute inset-0 opacity-10"
              style={{ filter: 'url(#noise-filter)' }}
            />
          </motion.div>

          <CatSketch />
          
          {/* 枪击Glitch效果 */}
          {showGlitch && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1, 0] }}
              transition={{ duration: 0.8 }}
            >
              <div className="absolute inset-0 bg-red-900/30" />
              <div
                className="absolute inset-0"
                style={{ filter: 'url(#noise-filter)' }}
              />
            </motion.div>
          )}
        </div>
      )
    }
    
    // 阶段三：猫的对话 (步骤10-15)
    if (currentStep >= 10 && currentStep <= 15) {
      return (
        <div className="absolute inset-0">
          {/* 倒地时刻背景图 - death_moment.png */}
          <AnimatePresence>
            {showDeathMoment && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
              >
                <img
                  src={assetPath('assets/scenes/death_moment.webp')}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    filter: 'blur(2px) brightness(0.7) contrast(1.2)',
                    transform: 'scaleY(0.8) translateY(20%)', // 低角度视感
                  }}
                />
                {/* 微弱噪点叠加 */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ filter: 'url(#noise-filter)' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 猫的1px轮廓叠加 */}
          <CatSketch />
        </div>
      )
    }
    
    // 阶段四：手术台 (步骤16-19)
    if (currentStep >= 16 && currentStep <= 19) {
      return (
        <div className="absolute inset-0">
          {/* 手术台背景 */}
          <svg width="100%" height="100%" viewBox="0 0 300 200" className="opacity-10">
            <rect
              x="50"
              y="80"
              width="200"
              height="40"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              fill="none"
            />
            <circle
              cx="150"
              cy="40"
              r="20"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>
      )
    }
    
    // 阶段五：视角翻转 (步骤20-21)
    if (currentStep >= 20 && currentStep <= 21) {
      return (
        <div className="absolute inset-0">
          {/* 视角翻转效果 */}
          <motion.div
            className="absolute inset-0"
            animate={{ 
              scaleY: currentStep >= 21 ? -1 : 1
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )
    }
    
    return null
  }
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* 扫描线效果 */}
      <div className="scanlines" />
      
      {/* 噪声滤镜（用于glitch效果） */}
      <svg className="absolute w-0 h-0">
        <filter id="noise-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="screen" />
        </filter>
      </svg>
      
      {/* 闪烁效果 */}
      {showFlash && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: flashDuration / 1000 }}
        />
      )}
      
      {/* 视觉元素 */}
      {renderVisualElements()}
      
      {/* Terminal对话框 */}
      <Terminal 
        text={getCurrentTerminalText()}
        onClick={shouldAllowTerminalClick() ? handleClickNext : undefined}
        showClickPrompt={shouldShowClickPrompt()}
        onComplete={handleTypingComplete}
        showCursor={!isTypingComplete}
      />
      
      {/* 调试信息（仅开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 text-white/20 font-mono text-xs">
          <div>步骤: {currentStep}/{ALL_STEPS.length - 1}</div>
          <div>阶段: {currentStepData?.phase || '未知'}</div>
          <div>类型: {currentStepData?.type || '未知'}</div>
        </div>
      )}
    </div>
  )
}
