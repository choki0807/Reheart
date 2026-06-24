import { motion, AnimatePresence } from 'framer-motion'

/**
 * 怒气值显示组件 - 3格1px红色方块
 * 遵循1px极简主义：无圆角，纯色块
 */
export default function RageMeter({ rage = 0, maxRage = 3 }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 font-mono text-[10px] tracking-widest">
        RAGE:
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRage }).map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 border border-white/20"
            animate={{
              backgroundColor: i < rage
                ? 'rgba(255,50,50,0.9)'
                : 'rgba(255,255,255,0.03)',
              borderColor: i < rage
                ? 'rgba(255,50,50,0.6)'
                : 'rgba(255,255,255,0.2)',
            }}
            transition={{ duration: 0.3 }}
          >
            {/* 怒气激活时的微颤效果 */}
            <AnimatePresence>
              {i < rage && (
                <motion.div
                  className="w-full h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ backgroundColor: 'rgba(255,50,50,0.4)' }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <span className="text-white/25 font-mono text-[10px]">
        {rage}/{maxRage}
      </span>
    </div>
  )
}