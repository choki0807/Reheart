import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'
import Portrait from '../components/Portrait'

/**
 * 过场场景组件 - 显示背景图片 + 叙事文本，点击跳过
 * @param {string} bgImage - 背景图片路径
 * @param {string} nextScene - 点击后跳转的场景名
 * @param {Array} dialogues - 对话序列 [{ speaker, text }] 或 [{ text }]
 * @param {string} filter - 图片滤镜 (optional)
 * @param {number} identityStep - 自画像步骤 (optional)
 */
export default function TransitionScene({ bgImage, nextScene, dialogues = [], filter, identityStep }) {
  const { setScene, identityLevel } = useGameStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const [bgLoaded, setBgLoaded] = useState(false)

  // 预加载背景图片
  useEffect(() => {
    const img = new Image()
    img.src = bgImage
    img.onload = () => setBgLoaded(true)
    img.onerror = () => setBgLoaded(true)
  }, [bgImage])

  // 打字机效果
  useEffect(() => {
    if (currentIndex >= dialogues.length) return

    const fullText = dialogues[currentIndex].text || ''
    let i = 0
    setDisplayedText('')
    setIsTyping(true)
    setIsTypingComplete(false)

    const typeInterval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.substring(0, i + 1))
        i++
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
        setIsTypingComplete(true)
      }
    }, 35)

    return () => clearInterval(typeInterval)
  }, [currentIndex])

  // 点击推进
  const handleClick = useCallback(() => {
    if (isTyping) {
      // 跳过打字，直接显示全文
      setIsTyping(false)
      setDisplayedText(dialogues[currentIndex]?.text || '')
      setIsTypingComplete(true)
      return
    }

    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // 所有对话完成，跳转下一场景
      setScene(nextScene)
    }
  }, [currentIndex, isTyping, isTypingComplete, dialogues, nextScene, setScene])

  const currentDialogue = dialogues[currentIndex]
  const step = identityStep !== undefined ? identityStep : identityLevel

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black cursor-pointer"
      onClick={handleClick}
    >
      {/* 扫描线 */}
      <div className="scanlines" />

      {/* 背景图片 */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: bgLoaded ? 1 : 0 }}
        transition={{ duration: 1.5 }}
      >
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: filter || 'grayscale(100%) contrast(1.1) brightness(0.5)',
          }}
        />
        {/* 暗角 + 渐变遮罩 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </motion.div>

      {/* 自画像 */}
      <div className="absolute left-4 top-4 w-24 h-24 opacity-20 z-10">
        <Portrait step={step} />
      </div>

      {/* 对话框 */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-8 pb-8">
        <AnimatePresence mode="wait">
          {currentDialogue && (
            <motion.div
              key={currentIndex}
              className="backdrop-blur-md bg-black/70 border border-white/10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {/* 说话者标签 */}
              {currentDialogue.speaker && (
                <div className="px-6 pt-4 pb-0">
                  <span className="text-white/30 font-mono text-[10px] tracking-widest">
                    {currentDialogue.speaker}
                  </span>
                </div>
              )}

              {/* 文字内容 */}
              <div className="px-6 py-4">
                <p className="text-white/80 font-mono text-sm leading-relaxed min-h-[3em]">
                  {displayedText}
                </p>
              </div>

              {/* 点击提示 */}
              {isTypingComplete && (
                <div className="px-6 pb-3 text-right">
                  <motion.span
                    className="text-white/20 font-mono text-[10px] tracking-widest"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {currentIndex < dialogues.length - 1 ? '[ 点击继续 ]' : '[ 点击进入 ]'}
                  </motion.span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}