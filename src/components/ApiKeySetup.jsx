import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { saveApiKey, hasApiKey } from '../core/apiConfig'

/**
 * API Key 配置弹窗
 * 让玩家输入自己的 Kimi API Key，纯前端部署时避免 Key 泄露
 */
export default function ApiKeySetup({ onComplete }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(false)
  const inputRef = useRef(null)

  // 自动聚焦
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 500)
    return () => clearTimeout(timer)
  }, [])

  // 检查是否已有保存的 Key（内置 Key 始终可用）
  useEffect(() => {
    if (hasApiKey()) {
      onComplete()
    }
  }, [onComplete])

  const handleSave = () => {
    const trimmed = key.trim()
    if (!trimmed) {
      setError('请输入 API Key')
      return
    }
    if (!trimmed.startsWith('sk-')) {
      setError('Key 格式似乎不对，Kimi 的 Key 通常以 sk- 开头')
      return
    }
    saveApiKey(trimmed)
    setError('')
    onComplete()
  }

  const handleSkip = () => {
    onComplete()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* 装饰性扫描线 */}
      <div className="scanlines opacity-30" />

      <motion.div
        className="relative w-full max-w-md mx-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* 顶部边框线 */}
        <motion.div
          className="h-px w-full mb-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
        />

        {/* 标题 */}
        <div className="mb-2">
          <div className="text-white/40 font-mono text-xs tracking-[0.3em] mb-3">
            [ 系统初始化 ]
          </div>
          <h2 className="text-white/90 font-mono text-xl tracking-wider">
            神经网络接入
          </h2>
        </div>

        {/* 说明 */}
        <div className="text-white/50 font-mono text-sm leading-relaxed mb-8">
          <p className="mb-3">
            游戏已内置小米 MiMo API Key，可直接体验 AI 对话。
          </p>
          <p className="mb-3 text-white/40 text-xs">
            如需使用自己的 Key，可在下方输入（会覆盖内置 Key）。
          </p>
          <p className="text-white/30 text-xs">
            Key 仅保存在你的浏览器本地，不会上传到任何服务器。
          </p>
        </div>

        {/* 输入区域 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/40 font-mono text-xs">API KEY</span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-white/25 font-mono text-[10px] hover:text-white/50 transition-colors"
            >
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>

          <div className="relative">
            <input
              ref={inputRef}
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => {
                setKey(e.target.value)
                setError('')
              }}
              onKeyDown={handleKeyDown}
              placeholder="sk-..."
              className="w-full bg-transparent border-b border-white/20 focus:border-white/50 text-white/90 font-mono text-sm py-2 pr-8 outline-none placeholder:text-white/15 tracking-wider transition-colors"
              style={{ fontSize: '16px' }}
            />
            {key && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => { setKey(''); inputRef.current?.focus() }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 font-mono text-xs px-1"
              >
                ×
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400/80 font-mono text-xs mt-2"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="px-6 py-2 border border-white/30 text-white/80 font-mono text-sm tracking-wider hover:bg-white/5 hover:border-white/50 transition-colors"
          >
            连接 ↵
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSkip}
            className="px-4 py-2 text-white/30 font-mono text-sm tracking-wider hover:text-white/60 transition-colors"
          >
            使用内置 Key 继续
          </motion.button>
        </div>

        {/* 底部边框线 */}
        <motion.div
          className="h-px w-full mt-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        />

        {/* 底部提示 */}
        <div className="mt-4 text-white/20 font-mono text-[10px] text-center">
          获取 Key: platform.moonshot.cn
        </div>
      </motion.div>
    </motion.div>
  )
}
