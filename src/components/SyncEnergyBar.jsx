import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 同步能量槽组件 - 电池样式
 * 共3分，扣分时单元碎裂化为噪点消失，归零时触发本幕重启
 */
export default function SyncEnergyBar({ lives = 3, maxLives = 3, onDeplete }) {
  const [prevLives, setPrevLives] = useState(lives)
  const [shakingIndex, setShakingIndex] = useState(-1)
  const [crackingIndex, setCrackingIndex] = useState(-1)

  // 检测扣分事件
  useEffect(() => {
    if (lives < prevLives) {
      // 刚被扣分的那个单元索引（lives是从3开始往下扣的）
      const lostIndex = lives // lives=2时第3个碎裂，lives=1时第2个碎裂，lives=0时第1个碎裂
      setShakingIndex(lostIndex)

      // 抖动后碎裂
      const shakeTimer = setTimeout(() => {
        setShakingIndex(-1)
        setCrackingIndex(lostIndex)
      }, 400)

      // 碎裂后消失
      const crackTimer = setTimeout(() => {
        setCrackingIndex(-1)
      }, 800)

      setPrevLives(lives)

      // 归零时触发重启
      if (lives === 0 && onDeplete) {
        setTimeout(onDeplete, 1200)
      }

      return () => {
        clearTimeout(shakeTimer)
        clearTimeout(crackTimer)
      }
    }
    setPrevLives(lives)
  }, [lives])

  // 单个电池单元
  const BatteryCell = ({ index, isActive }) => {
    const isShaking = shakingIndex === index
    const isCracking = crackingIndex === index

    return (
      <div className="relative">
        {/* 电池外壳 - 1px stroke 极简风格 */}
        <motion.svg
          width="28"
          height="14"
          viewBox="0 0 28 14"
          className="block"
          animate={isShaking ? {
            x: [0, -2, 2, -1, 1, 0],
            y: [0, 1, -1, 0.5, -0.5, 0],
          } : {}}
          transition={isShaking ? { duration: 0.4 } : {}}
        >
          {/* 电池主体 */}
          <rect
            x="0"
            y="2"
            width="22"
            height="10"
            stroke={isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)'}
            strokeWidth="1"
            fill="none"
          />
          {/* 电池正极凸起 */}
          <rect
            x="22"
            y="4"
            width="4"
            height="6"
            stroke={isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)'}
            strokeWidth="1"
            fill="none"
          />
          {/* 电量填充 */}
          {isActive && !isCracking && (
            <motion.rect
              x="2"
              y="4"
              width="18"
              height="6"
              fill="rgba(255,255,255,0.5)"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.4, 0.6, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
          )}
          {/* 碎裂裂纹效果 */}
          {isCracking && (
            <motion.g
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <line x1="4" y1="3" x2="14" y2="9" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
              <line x1="10" y1="2" x2="8" y2="11" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <line x1="16" y1="4" x2="20" y2="10" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
            </motion.g>
          )}
        </motion.svg>

        {/* 碎裂噪点粒子 */}
        <AnimatePresence>
          {isCracking && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-px h-px bg-white/60"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 30,
                    y: (Math.random() - 0.5) * 20,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* 标签 */}
      <span className="text-white/40 font-mono text-[10px] mr-1 tracking-wider">
        SYNC
      </span>
      {/* 三个电池单元，从左到右：0, 1, 2 */}
      {Array.from({ length: maxLives }).map((_, i) => (
        <BatteryCell
          key={i}
          index={i}
          isActive={i < lives}
        />
      ))}
    </div>
  )
}