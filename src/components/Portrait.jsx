import { motion } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'
import { PORTRAIT_PATHS } from '../data/svgPaths'
import clsx from 'clsx'

export default function Portrait({ step = 0 }) {
  const { memoryColors } = useGameStore()
  
  // step: 0 = 不显示, 1-5 = 显示对应部分
  const visibleCount = Math.min(step, PORTRAIT_PATHS.length)
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 自画像SVG容器 */}
      <svg
        width="300"
        height="300"
        viewBox="0 0 200 150"
        className="svg-stroke-1 svg-fill-transparent"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 添加一个微妙的背景圆 */}
        <circle
          cx="100"
          cy="75"
          r="60"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
          fill="none"
        />
        
        {/* 绘制每个部分 */}
        {PORTRAIT_PATHS.map((pathData, index) => {
          const currentColor = memoryColors[index] || pathData.color
          const isVisible = index < visibleCount
          const isLastAdded = index === visibleCount - 1
          
          return (
            <motion.path
              key={pathData.id}
              d={pathData.path}
              initial={{ 
                opacity: 0, 
                pathLength: 0,
                fill: isVisible ? currentColor : 'transparent'
              }}
              animate={{ 
                opacity: isVisible ? 1 : 0,
                pathLength: isVisible ? 1 : 0,
                fill: isVisible ? currentColor : 'transparent',
                transition: {
                  pathLength: { duration: isLastAdded ? 1.5 : 0, ease: "easeInOut" },
                  opacity: { duration: isLastAdded ? 0.8 : 0 },
                  fill: { duration: isLastAdded ? 1 : 0 }
                }
              }}
              stroke={isVisible ? currentColor : 'transparent'}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fillOpacity="0.3"
              className={clsx(
                "transition-colors duration-1000",
                currentColor === '#222222' && 'opacity-60'
              )}
            />
          )
        })}
        
        {/* 中心圆孔（枪击效果） */}
        <motion.circle
          cx="100"
          cy="75"
          r="0"
          initial={{ r: 0, opacity: 0 }}
          animate={{ r: 5, opacity: 1 }}
          transition={{ duration: 0.3 }}
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          className="hidden"
          id="bullet-hole"
        />
      </svg>
      
      {/* 色彩标签 */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
        {PORTRAIT_PATHS.map((pathData, index) => {
          const currentColor = memoryColors[index] || pathData.color
          const isLost = currentColor === '#222222'
          const isVisible = index < visibleCount
          
          return (
            <div key={pathData.id} className="flex flex-col items-center">
              <motion.div 
                className="w-3 h-3 rounded-sm transition-all duration-500"
                style={{ 
                  backgroundColor: isLost ? '#222222' : (isVisible ? currentColor : 'rgba(255,255,255,0.1)'),
                  opacity: isLost ? 0.4 : (isVisible ? 0.8 : 0.2)
                }}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: isVisible ? [0.8, 1.2, 1] : 0.8,
                  opacity: isVisible ? [0.2, 1, 0.8] : 0.2
                }}
                transition={{ 
                  duration: isVisible ? 0.6 : 0,
                  times: isVisible ? [0, 0.5, 1] : undefined
                }}
              />
              <span className="text-xs mt-1 opacity-50">
                {isLost ? '██' : (isVisible ? pathData.label : '?')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}