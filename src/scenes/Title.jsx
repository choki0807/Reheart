import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'
import { assetPath } from '../core/assetPath'

export default function Title() {
  const { setScene } = useGameStore()
  const [isExiting, setIsExiting] = useState(false)

  const handleClick = () => {
    if (isExiting) return
    setIsExiting(true)
    // 平滑淡出后切换到手术室场景
    setTimeout(() => {
      setScene('surgery')
    }, 1500)
  }

  return (
    <AnimatePresence>
      {!isExiting ? (
        <motion.div
          className="relative w-full h-full overflow-hidden bg-black cursor-pointer"
          onClick={handleClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {/* 扫描线效果 */}
          <div className="scanlines" />

          {/* 噪声滤镜 */}
          <svg className="absolute w-0 h-0">
            <filter id="title-noise-filter">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feBlend in="SourceGraphic" mode="screen" />
            </filter>
          </svg>

          {/* 背景图片 */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 2, delay: 0.5 }}
          >
            <img
              src={assetPath('assets/scenes/title_screen.webp')}
              alt=""
              className="w-full h-full object-cover"
              style={{
              filter: 'brightness(0.75) contrast(1.1)',
              }}
            />
            {/* 微弱噪点叠加 */}
            <div
              className="absolute inset-0 opacity-10"
              style={{ filter: 'url(#title-noise-filter)' }}
            />
          </motion.div>

          {/* 中央标题 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 1 }}
            >
              <h1
                className="font-mono text-white/90 tracking-[0.3em] text-2xl md:text-3xl"
                style={{ fontWeight: 300 }}
              >
                [ 死而替生 ]
              </h1>
            </motion.div>

            {/* 底部提示 */}
            <motion.div
              className="absolute bottom-20 left-0 right-0 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.3, 0.6] }}
              transition={{
                duration: 3,
                delay: 2.5,
                repeat: Infinity,
                repeatType: 'loop',
              }}
            >
              <span className="font-mono text-white/40 text-xs tracking-[0.2em]">
                点击以初始化载体连接...
              </span>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="w-full h-full bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        />
      )}
    </AnimatePresence>
  )
}
