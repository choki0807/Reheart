import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Terminal({ 
  text = '', 
  showCursor = false, 
  onComplete,
  onClick,
  showClickPrompt = false
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  useEffect(() => {
    if (!text) return
    
    setIsTyping(true)
    setDisplayedText('')
    
    let i = 0
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1))
        i++
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
      }
    }, 50) // 打字机速度
    
    return () => clearInterval(typeInterval)
  }, [text])
  
  const handleClick = () => {
    if (!isTyping && onClick) {
      onClick()
    }
  }
  
  return (
    <div
      className="absolute bottom-12 left-0 right-0 px-12 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        {/* 对话框背景 */}
        <motion.div
          className="backdrop-blur-md bg-white/5 border border-white/10 rounded-sm p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.01 }}
        >
          {/* 打字机文字 */}
          <div className="min-h-[2em]">
            <p className="text-white/90 font-mono text-2xl leading-relaxed">
              {displayedText}
              {isTyping && (
                <span className="typewriter-cursor ml-1" />
              )}
            </p>
          </div>
          
          {/* 点击推进提示 */}
          {!isTyping && showClickPrompt && (
            <motion.div
              className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-white/40 font-mono text-xs tracking-wider">
                [CLICK TO PROCEED]
              </span>
              <motion.div
                className="w-2 h-px bg-white/40"
                animate={{ 
                  scaleX: [0.5, 1, 0.5],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          )}
          
          {/* 呼吸感指示器（默认） */}
          {!isTyping && !showClickPrompt && (
            <motion.div
              className="absolute -bottom-2 left-1/2 w-4 h-px bg-white/30"
              initial={{ scaleX: 0.5, x: '-50%' }}
              animate={{ 
                scaleX: [0.5, 1, 0.5],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>
        
        {/* 微妙的呼吸动画 */}
        <motion.div
          className="absolute inset-0 border border-white/5 rounded-sm pointer-events-none"
          animate={{ 
            borderColor: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  )
}