import { create } from 'zustand'

// 初始颜色：自画像的五种颜色
const INITIAL_COLORS = [
  '#FF6B8B', // 红色头饰
  '#4ECDC4', // 蓝色瞳孔
  '#45B7D1', // 绿色衣领
  '#96CEB4', // 黄色发丝
  '#FFEAA7', // 粉色脸颊
]

export const useGameStore = create((set) => ({
  // 全局叙事状态
  scene: 'intro', // intro, surgery, elevator, penthouse
  identityLevel: 0, // 0-4
  memoryColors: [...INITIAL_COLORS],
  isDead: false,
  
  // 3分制审计系统
  auditLives: 3, // 初始3分，每次不符合扣1分
  isAuditing: false,
  lastAuditReason: '',
  auditHistory: [], // 审计历史记录
  
  // 线索收集系统
  clues: [], // 已收集的线索 [{ id, title, summary, content }]
  
  // 文档查看状态
  hasViewedDocument: false, // 是否已查看过关键文档
  discoveredDocuments: [], // 已发现的文档ID列表
  currentOpenDocument: null, // 当前查看的文档ID
  
  // 第三幕：杀手激怒系统
  rage: 0, // 老板怒气值 0-3
  dialogueCount: 0, // 已使用对话次数（最多5次）
  currentIdentity: 'doctor', // doctor | assassin
  
  // 序幕画像覆盖层
  showProloguePortrait: false, // 序幕中自画像完成后的覆盖显示

  // 第四幕：终局状态
  endingType: null, // 'A' | 'B' | null
  
  // 动作
  setScene: (scene) => set({ scene }),
  
  // 添加线索
  addClue: (clue) => set((state) => {
    // 避免重复添加
    if (state.clues.some(c => c.id === clue.id)) return state
    return { clues: [...state.clues, clue] }
  }),
  
  // 清空线索（场景重置时）
  clearClues: () => set({ clues: [] }),
  
  incrementIdentityLevel: () => set((state) => {
    const newLevel = state.identityLevel + 1
    
    // 当身份等级增加时，对应的颜色永久转为灰色
    const newColors = [...state.memoryColors]
    if (newLevel - 1 < newColors.length) {
      newColors[newLevel - 1] = '#222222' // 灰色，代表灵魂消亡
    }
    
    return {
      identityLevel: newLevel,
      memoryColors: newColors,
      isDead: newLevel >= 5,
      auditLives: 3 // 重置生命值进入下一场景
    }
  }),
  
  // 审计扣分
  deductAuditLife: (reason) => set((state) => {
    const newLives = Math.max(0, state.auditLives - 1)
    const newHistory = [...state.auditHistory, {
      timestamp: Date.now(),
      isValid: false,
      reason,
      remainingLives: newLives
    }]
    
    const result = {
      auditLives: newLives,
      lastAuditReason: reason,
      isAuditing: false,
      auditHistory: newHistory
    }
    
    // 如果生命值归零，标记需要重置场景
    if (newLives === 0) {
      result.isAuditing = true // 触发glitch效果
    }
    
    return result
  }),
  
  // 审计成功
  addAuditSuccess: (reason) => set((state) => {
    const newHistory = [...state.auditHistory, {
      timestamp: Date.now(),
      isValid: true,
      reason,
      remainingLives: state.auditLives
    }]
    
    return {
      lastAuditReason: reason,
      isAuditing: false,
      auditHistory: newHistory
    }
  }),
  
  // 重置当前场景（生命值归零后）
  resetCurrentScene: () => set({
    auditLives: 3,
    isAuditing: false,
    lastAuditReason: '场景已重置，请重新尝试。'
  }),
  
  // 触发场景重置（失败时的 glitch 效果）
  triggerSceneReset: () => {
    set({ isAuditing: true })
    // 这里会触发 glitch 动画，1秒后重置场景
    setTimeout(() => {
      set({
        auditLives: 3,
        isAuditing: false,
        lastAuditReason: '身份同步失败，场景已重置。'
      })
    }, 1000)
  },
  
  // 第三幕：增加怒气值
  incrementRage: () => set((state) => ({
    rage: Math.min(3, state.rage + 1)
  })),
  
  // 第三幕：增加对话次数
  incrementDialogueCount: () => set((state) => ({
    dialogueCount: state.dialogueCount + 1
  })),
  
  // 第三幕：重置杀手场景状态
  resetAssassinState: () => set({
    rage: 0,
    dialogueCount: 0,
  }),
  
  // 设置当前身份
  setIdentity: (identity) => set({ currentIdentity: identity }),
  
  // 第四幕：设置结局类型
  setEndingType: (type) => set({ endingType: type }),
  
  // 标记已查看关键文档
  setHasViewedDocument: () => set({ hasViewedDocument: true }),
  
  // 发现新文档（首次打开时调用）
  discoverDocument: (docId) => set((state) => {
    if (state.discoveredDocuments.includes(docId)) return state
    return {
      discoveredDocuments: [...state.discoveredDocuments, docId],
      hasViewedDocument: true,
    }
  }),
  
  // 设置当前查看的文档
  setCurrentDocument: (docId) => set({ currentOpenDocument: docId }),
  
  // 关闭文档查看器
  closeDocument: () => set({ currentOpenDocument: null }),
  
  // 序幕：控制自画像覆盖层显示
  setShowProloguePortrait: (show) => set({ showProloguePortrait: show }),
}))
