import { motion } from 'framer-motion'
import { CAT_PATHS } from '../data/svgPaths'

export default function CatSketch() {
  return (
    <div className="absolute left-10 bottom-20">
      <svg
        width="120"
        height="80"
        viewBox="0 0 120 60"
        className="svg-stroke-1 svg-fill-transparent"
      >
        {/* 绘制猫的各个部分 */}
        {CAT_PATHS.map((pathData, index) => (
          <motion.path
            key={pathData.id}
            d={pathData.path}
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="1"
            fill="none"
            initial={{ 
              pathLength: 0,
              opacity: 0
            }}
            animate={{ 
              pathLength: 1,
              opacity: 1
            }}
            transition={{
              pathLength: { 
                duration: 1.5, 
                delay: index * 0.2,
                ease: "easeInOut" 
              },
              opacity: { 
                duration: 0.5,
                delay: index * 0.2
              }
            }}
          />
        ))}
        
        {/* 胡须的微动 */}
        {CAT_PATHS.filter(p => p.id === 'whiskers')[0] && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.path
                key={`whisker-${i}`}
                d={i < 3 
                  ? `M ${40 + i * 0.5},${35 + i} L ${30},${33 + i * 2}`
                  : `M ${80 + (i-3) * 0.5},${35 + (i-3)} L ${90},${33 + (i-3) * 2}`
                }
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
              />
            ))}
          </>
        )}
      </svg>
    </div>
  )
}