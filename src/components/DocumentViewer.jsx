import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'
import { DOCUMENTS } from '../data/scripts'

/**
 * 文档查看器 - 全屏图片 Overlay
 * 点击热区弹出，居中显示文档图片
 * bg-black/80 半透明背景，1px 白色边框，底部关闭按钮
 */

// 审计相关文档的显示顺序
const AUDIT_DOC_KEYS = ['DISPOSAL_MANUAL', 'EFFICIENCY_AUDIT']

export default function DocumentViewer({ isOpen, onClose }) {
  const { discoveredDocuments, currentOpenDocument, setCurrentDocument, closeDocument, addClue, hasViewedDocument, setHasViewedDocument } = useGameStore()
  const [tabIndex, setTabIndex] = useState(0)

  // 获取已发现的审计文档列表
  const availableDocs = AUDIT_DOC_KEYS
    .filter(key => discoveredDocuments.includes(DOCUMENTS[key]?.id))
    .map(key => ({ key, ...DOCUMENTS[key] }))

  // 如果有当前打开的文档，优先显示
  const currentDoc = currentOpenDocument
    ? Object.values(DOCUMENTS).find(d => d.id === currentOpenDocument)
    : availableDocs[tabIndex]

  const handleClose = useCallback(() => {
    setTabIndex(0)
    onClose()
  }, [onClose])

  const handleSwitchTab = (idx) => {
    setTabIndex(idx)
    const doc = availableDocs[idx]
    if (doc) setCurrentDocument(doc.id)
  }

  // 点击背景区域关闭
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleClose()
  }, [handleClose])

  if (!isOpen || !currentDoc) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
        >
          {/* 文档容器 */}
          <motion.div
            className="relative flex flex-col items-center max-w-3xl w-full mx-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 文档标题 */}
            <div className="mb-3 text-center">
              <span className="text-white/40 font-mono text-[10px] tracking-widest">
                DOCUMENT // {currentDoc.title}
              </span>
            </div>

            {/* 图片 - 1px 白色边框 */}
            <div className="border border-white p-0">
              <img
                src={currentDoc.path}
                alt={currentDoc.title}
                className="max-h-[65vh] w-auto object-contain"
                draggable={false}
              />
            </div>

            {/* 文档切换标签（多个文档时显示） */}
            {availableDocs.length > 1 && (
              <div className="flex items-center gap-4 mt-4">
                {availableDocs.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSwitchTab(idx)}
                    className={`
                      font-mono text-[10px] tracking-widest px-3 py-1.5 border transition-colors
                      ${tabIndex === idx
                        ? 'border-white/30 text-white/60 bg-white/5'
                        : 'border-white/10 text-white/25 hover:text-white/40 hover:border-white/20'
                      }
                    `}
                  >
                    {idx === 0 ? '处置手册' : '效能评估'}
                  </button>
                ))}
              </div>
            )}

            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="mt-5 font-mono text-[10px] tracking-widest text-white/30 border border-white/10 px-6 py-2 hover:text-white/60 hover:border-white/25 transition-colors"
            >
              [ 关闭并返回审计 ]
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}