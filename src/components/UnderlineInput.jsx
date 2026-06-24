import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

/**
 * 1px下划线输入框 - 替代标准HTML Input
 * 特性：闪烁光标、1px下划线、电子杂音反馈
 */
export default function UnderlineInput({
  value = '',
  onChange,
  onSubmit,
  placeholder = '',
  disabled = false,
  autoFocus = true,
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const inputRef = useRef(null)
  const cursorTimerRef = useRef(null)

  // 闪烁光标
  useEffect(() => {
    cursorTimerRef.current = setInterval(() => {
      setCursorVisible(prev => !prev)
    }, 530)

    return () => clearInterval(cursorTimerRef.current)
  }, [])

  // 自动聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [autoFocus, disabled])

  // 点击区域聚焦
  const handleAreaClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])

  // 键盘事件
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault()
      onSubmit(e)
    }
  }, [onSubmit])

  // 输入事件 - 触发微弱电子杂音反馈（视觉模拟）
  const handleChange = useCallback((e) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }, [onChange])

  const showCursor = isFocused && !disabled && cursorVisible
  const hasText = value.length > 0

  return (
    <div
      className="relative w-full cursor-text"
      onClick={handleAreaClick}
    >
      {/* 隐藏的真实input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-text"
        style={{ fontSize: '16px' }} // 防止iOS缩放
      />

      {/* 可视化输入区域 */}
      <div className="relative pb-2">
        {/* 输入文字显示 */}
        <div className="font-mono text-3xl text-white/90 min-h-[1.5em] flex items-center">
          {/* 占位符 */}
          {!hasText && !isFocused && (
            <span className="text-white/20">{placeholder}</span>
          )}
          {!hasText && isFocused && (
            <span className="text-white/15">{placeholder}</span>
          )}

          {/* 已输入文字 */}
          {hasText && (
            <motion.span
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              className="text-white/90 tracking-wider"
            >
              {value}
            </motion.span>
          )}

          {/* 闪烁光标 */}
          {showCursor && (
            <motion.span
              className="inline-block w-px h-[1.2em] bg-white/70 ml-px align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.06, repeat: Infinity, ease: 'steps(2)' }}
            />
          )}
        </div>

        {/* 1px下划线 */}
        <motion.div
          className="h-px w-full"
          animate={{
            backgroundColor: isFocused
              ? 'rgba(255,255,255,0.5)'
              : hasText
                ? 'rgba(255,255,255,0.3)'
                : 'rgba(255,255,255,0.1)',
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 聚焦时的扩展线（微妙的呼吸感） */}
        {isFocused && (
          <motion.div
            className="h-px w-full"
            animate={{
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', marginTop: '1px' }}
          />
        )}
      </div>

      {/* 提交提示 */}
      <div className="flex justify-end mt-3">
        <span className="text-white/25 font-mono text-xs tracking-wider">
          {disabled ? '...' : 'ENTER ↵'}
        </span>
      </div>
    </div>
  )
}