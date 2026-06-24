import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'

// ═══════════════════════════════════════════
// 身份画像组件 - 根据当前幕自动加载对应画像
// ═══════════════════════════════════════════

/**
 * 场景 → 画像映射
 * 每个场景对应一张身份画像，结局场景不显示
 */
const SCENE_PORTRAIT_MAP = {
  // 序幕：女主自画像（仅在 overlay 模式下显示）
  intro: 'protagonist_self.webp',
  // Act 1 手术室：医生画像
  surgery: 'doctor_734.jpg',
  // Act 1→2 过场：杀手画像（提前展示下一身份）
  city_night: 'assassin_rain.jpg',
  // Act 2 雨夜高塔：杀手画像
  assassin: 'assassin_rain.jpg',
  // Act 2→3 过场：老板画像
  building_entrance: 'boss_l102.jpg',
  // Act 3 黑市军火：老板画像
  penthouse: 'boss_l102.jpg',
  // 结局场景：不显示画像
  // ending_a, ending_b 等不在映射中 → 返回 null
}

const PORTRAIT_BASE_PATH = '/assets/portraits'

export default function IdentityPortrait() {
  const { scene, showProloguePortrait, setShowProloguePortrait } = useGameStore()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(null)

  // 获取当前场景对应的画像
  const portraitFile = SCENE_PORTRAIT_MAP[scene] || null
  const isPrologue = scene === 'intro'
  const isOverlay = isPrologue && showProloguePortrait

  // 场景切换时重置加载状态
  useEffect(() => {
    setImageLoaded(false)
    if (portraitFile) {
      // 预加载图片
      const img = new Image()
      img.src = `${PORTRAIT_BASE_PATH}/${portraitFile}`
      img.onload = () => {
        setCurrentSrc(portraitFile)
        setImageLoaded(true)
      }
      img.onerror = () => {
        // 图片不存在时使用占位符（1px边框的空框）
        setCurrentSrc(portraitFile)
        setImageLoaded(true)
      }
    } else {
      setCurrentSrc(null)
    }
  }, [scene, portraitFile])

  // 序幕结束（中枪事件）时卸载 overlay
  useEffect(() => {
    if (isPrologue && showProloguePortrait) {
      // 监听场景切换，一旦离开 intro 就关闭 overlay
      return () => {
        setShowProloguePortrait(false)
      }
    }
  }, [isPrologue, showProloguePortrait, setShowProloguePortrait])

  // 无画像可显示
  if (!portraitFile && !isOverlay) return null

  // ═══ 序幕覆盖模式 ═══
  if (isOverlay) {
    return (
      <AnimatePresence>
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* 背景模糊 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* 画像居中 */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="border border-white/20 p-1">
              {imageLoaded ? (
                <img
                  src={`${PORTRAIT_BASE_PATH}/${currentSrc}`}
                  alt="自画像"
                  className="w-64 h-64 object-contain"
                  style={{ filter: 'grayscale(30%) contrast(1.1)' }}
                />
              ) : (
                // 占位符：1px边框空框
                <div className="w-64 h-64 border border-white/10 flex items-center justify-center">
                  <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-20">
                    <rect x="0.5" y="0.5" width="59" height="59" stroke="white" strokeWidth="1" fill="none" />
                    <line x1="20" y1="20" x2="40" y2="40" stroke="white" strokeWidth="1" />
                    <line x1="40" y1="20" x2="20" y2="40" stroke="white" strokeWidth="1" />
                  </svg>
                </div>
              )}
            </div>
            <div className="text-center mt-4">
              <span className="text-white/40 font-mono text-[10px] tracking-widest">
                SELF_PORTRAIT
              </span>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ═══ 通用模式：左上角小画像 ═══
  if (!currentSrc) return null

  return (
    <AnimatePresence>
      <motion.div
        className="absolute top-4 left-4 z-10 pointer-events-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: imageLoaded ? 0.8 : 0, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="border border-white/10 p-px" style={{ width: '100px', height: '100px' }}>
          {imageLoaded ? (
            <img
              src={`${PORTRAIT_BASE_PATH}/${currentSrc}`}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'grayscale(60%) contrast(1.2) brightness(0.8)' }}
            />
          ) : (
            <div className="w-full h-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
              <div className="w-2 h-2 bg-white/10 animate-pulse" />
            </div>
          )}
        </div>
        {/* 场景标签 */}
        <div className="mt-1 text-center">
          <span className="text-white/15 font-mono text-[7px] tracking-widest">
            ID_{scene.toUpperCase()}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}