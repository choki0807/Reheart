import { motion } from 'framer-motion'
import { PHONE_FRAME, WECHAT_BUBBLES } from '../data/svgPaths'

export default function WeChatFrame({ messages = [], isDestroyed = false }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 手机框 */}
      <motion.svg
        width="320"
        height="520"
        viewBox="0 0 300 500"
        className="absolute"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: isDestroyed ? 0 : 1,
          scale: isDestroyed ? 0.8 : 1
        }}
        transition={{ duration: 0.5 }}
      >
        {/* 手机外框 */}
        <motion.path
          d={PHONE_FRAME.path}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ 
            pathLength: 1,
            opacity: isDestroyed ? 0 : 1
          }}
          transition={{ 
            duration: 1, 
            ease: "easeInOut",
            opacity: { duration: 0.3 }
          }}
        />
        
        {/* 聊天气泡 */}
        {messages.map((msg, index) => {
          const isLeft = msg.side === 'left'
          const bubble = isLeft ? WECHAT_BUBBLES.left : WECHAT_BUBBLES.right
          const x = isLeft ? 20 : 100
          const y = 80 + index * 60
          
          return (
            <motion.g
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isDestroyed ? 0 : 1,
                y: isDestroyed ? 10 : 0
              }}
              transition={{ 
                delay: 0.5 + index * 0.3, 
                duration: 0.3 
              }}
            >
              {/* 气泡框 */}
              <path
                d={bubble.path}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="1"
                fill="rgba(255, 255, 255, 0.05)"
                transform={`translate(${x}, ${y})`}
              />
              
              {/* 文字（模拟） */}
              <text
                x={x + (isLeft ? 30 : 110)}
                y={y + 25}
                fill="rgba(255, 255, 255, 0.8)"
                fontSize="12"
                fontFamily="'Courier New', monospace"
                textAnchor={isLeft ? 'start' : 'end'}
              >
                {msg.text}
              </text>
              
              {/* 打字机光标 */}
              {msg.isTyping && (
                <motion.rect
                  x={x + (isLeft ? 30 : 110) + msg.text.length * 6}
                  y={y + 18}
                  width="1"
                  height="12"
                  fill="rgba(255, 255, 255, 0.8)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </motion.g>
          )
        })}
      </motion.svg>
      
      {/* 灰尘散落效果（只在手机粉碎时显示） */}
      {isDestroyed && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-px bg-white"
              style={{
                left: `${50 + Math.random() * 20}%`,
                top: `${50 + Math.random() * 20}%`,
              }}
              initial={{ 
                opacity: 0,
                x: 0,
                y: 0,
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                opacity: [0, 0.7, 0],
                x: Math.random() * 200 - 100,
                y: Math.random() * 200 - 100,
                scale: [0, 1, 0],
                rotate: Math.random() * 360
              }}
              transition={{
                delay: Math.random() * 0.3,
                duration: 1.5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
      
      {/* 手机粉碎碎片效果 */}
      {isDestroyed && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * (Math.PI / 180)
            const distance = 80 + Math.random() * 40
            
            return (
              <motion.div
                key={`fragment-${i}`}
                className="absolute w-6 h-6"
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: '-12px',
                  marginTop: '-12px',
                }}
                initial={{ 
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0
                }}
                animate={{ 
                  opacity: [1, 0.7, 0],
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  rotate: 180
                }}
                transition={{
                  delay: 0.1 + i * 0.05,
                  duration: 1,
                  ease: "easeOut"
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <rect
                    x="2"
                    y="2"
                    width="20"
                    height="20"
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}