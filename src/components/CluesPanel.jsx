import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'

/**
 * 线索面板 - 右上角，收集并展示已获取的线索
 * 点击展开/收起，审计时可参考
 */
export default function CluesPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedClueId, setExpandedClueId] = useState(null)
  const clues = useGameStore((s) => s.clues)

  return (
    <div className="relative">
      {/* 触发标签 */}
      <motion.div
        className="cursor-pointer flex items-center gap-1.5"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ opacity: 1 }}
      >
        <span className="text-white/30 font-mono text-[10px] tracking-widest border border-white/10 px-2 py-1 hover:text-white/50 hover:border-white/20 transition-colors">
          [CLUES{clues.length > 0 ? `:${clues.length}` : ''}]
        </span>
      </motion.div>

      {/* 展开面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-8 right-0 w-72 z-40"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border border-white/10 bg-black/90 backdrop-blur-md">
              {/* 标题栏 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-white/50 font-mono text-[10px] tracking-widest">
                  COLLECTED_CLUES
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/30 hover:text-white/60 font-mono text-[10px]"
                >
                  [×]
                </button>
              </div>

              {/* 线索列表 */}
              <div className="max-h-60 overflow-y-auto">
                {clues.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <span className="text-white/15 font-mono text-xs">
                      暂无线索
                    </span>
                  </div>
                ) : (
                  clues.map((clue) => (
                    <div
                      key={clue.id}
                      className="border-b border-white/5 last:border-b-0"
                    >
                      {/* 线索标题 */}
                      <div
                        className="px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setExpandedClueId(
                          expandedClueId === clue.id ? null : clue.id
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {/* 文件图标 */}
                          <svg width="10" height="12" viewBox="0 0 10 12" className="opacity-30 flex-shrink-0">
                            <rect x="0.5" y="0.5" width="7" height="11" stroke="white" strokeWidth="1" fill="none" />
                            <polyline points="7.5,0.5 9.5,2.5 9.5,11.5 0.5,11.5" stroke="white" strokeWidth="1" fill="none" />
                          </svg>
                          <span className="text-white/60 font-mono text-xs">
                            {clue.title}
                          </span>
                          <span className="text-white/20 font-mono text-[10px] ml-auto">
                            {expandedClueId === clue.id ? '−' : '+'}
                          </span>
                        </div>
                        {/* 摘要 */}
                        <p className="text-white/30 font-mono text-[10px] mt-1 ml-4">
                          {clue.summary}
                        </p>
                      </div>

                      {/* 展开详情 */}
                      <AnimatePresence>
                        {expandedClueId === clue.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 ml-4 border-l border-white/10">
                              <p className="text-white/40 font-mono text-[11px] leading-relaxed">
                                {clue.content}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}