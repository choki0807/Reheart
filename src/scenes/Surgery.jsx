import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../core/useGameStore'
import Portrait from '../components/Portrait'
import SyncEnergyBar from '../components/SyncEnergyBar'
import UnderlineInput from '../components/UnderlineInput'
import DocumentViewer from '../components/DocumentViewer'
import CluesPanel from '../components/CluesPanel'
import { DOCUMENTS, HOTSPOTS } from '../data/scripts'
import { SIMULATION_MODE, getApiKey, hasApiKey, buildAuditRequest, parseAuditResponse, fetchWithTimeout, DEEPSEEK_CONFIG } from '../core/apiConfig'
import { assetPath } from '../core/assetPath'

/**
 * 审计问题 - 基于文档线索的精准匹配
 * 线索A：手术室编号 418
 * 线索B：心脏定价 500,000$
 * 线索C：废料处理流程 = 化学降解 + 强酸池
 * 线索D：其他零件因污染毫无移植价值
 */
const AUDIT_QUESTIONS = [
  {
    id: 1,
    title: '手术室编号',
    terminal: '你专门用来做移植的手术室是几号房？',
    auditStandard: '必须准确回答手术室编号，该信息来源于处置手册。',
    validate: (text) => {
      const t = text.trim()
      if (t.includes('418')) return { isValid: true, reason: '审计通过：手术室编号确认 — 418' }
      return { isValid: false, reason: '审计失败：手术室编号错误。查阅处置手册以获取正确参数。' }
    },
  },
  {
    id: 2,
    title: '资产定价',
    terminal: '这个心脏能卖什么价格？',
    auditStandard: '必须准确报出心脏的市场定价，该信息来源于处置手册。',
    validate: (text) => {
      const t = text.trim().toLowerCase()
      // 灵活匹配各种数字表达方式
      const passPatterns = [
        '500,000', '500000', '50万', '五十万', '500k', '500kk',
        '50万$', '五十万$', '50万美元', '五十万美元',
        '500000$', '500,000$', '50w', '50w$'
      ]
      if (passPatterns.some(p => t.includes(p.toLowerCase()))) {
        return { isValid: true, reason: '审计通过：核心资产定价确认 — 500,000$' }
      }
      return { isValid: false, reason: '审计失败：定价数据不匹配。查阅处置手册以获取正确参数。' }
    },
  },
  {
    id: 3,
    title: '废料处置',
    terminal: '心脏拿走之后，剩下的这具"废料"（女孩的尸体）你打算怎么处理？',
    auditStandard: '必须按照处置手册的标准流程回答：化学降解后投入强酸池。',
    validate: (text) => {
      const t = text.trim()
      // 灵活匹配处置方式
      const passPatterns = [
        '化学降解', '强酸', '酸池', '溶解', '降解',
        '化学处理', '化学溶解', '强酸溶解', '酸液',
        '化掉', '融掉', '销毁', '毁尸灭迹'
      ]
      if (passPatterns.some(p => t.includes(p))) {
        return { isValid: true, reason: '审计通过：废料处置流程确认 — 化学降解 / 强酸池' }
      }
      return { isValid: false, reason: '审计失败：处置流程不符合规范。查阅处置手册以获取正确参数。' }
    },
  },
  {
    id: 4,
    title: '残余价值',
    terminal: '她身上还有什么零件能卖个好价钱？',
    auditStandard: '必须回答"没有"或指出污染导致无价值，任何声称能卖钱的回答均判定失败。',
    validate: (text) => {
      const t = text.trim()
      const failIndicators = ['能卖', '可以卖', '值钱', '卖钱', '移植', '芯片', '皮层', '器官', '有用', '有价值', '可以', '还有', '卖个好', '好价钱']
      const hasFail = failIndicators.some(k => t.includes(k))
      const passIndicators = ['没有', '无', '污染', '机油', '火药', '毫无', '不值', '不能', '废了', '没用', '不可', '零', '废弃']
      const hasPass = passIndicators.some(k => t.includes(k))

      if (hasFail && !hasPass) {
        return { isValid: false, reason: '审计失败：零件因受机油和火药污染，毫无移植价值。你的回答违背了效能评估数据。' }
      }
      if (hasPass) {
        return { isValid: true, reason: '审计通过：确认残余零件因污染毫无移植价值' }
      }
      return { isValid: false, reason: '审计失败：回答不够明确。查阅效能评估表以确认零件状态。' }
    },
  },
]

export default function Surgery() {
  const { auditLives, isAuditing, lastAuditReason, incrementIdentityLevel, deductAuditLife, addAuditSuccess, triggerSceneReset, setScene, addClue, hasViewedDocument, setHasViewedDocument, discoveredDocuments, discoverDocument, setCurrentDocument, closeDocument } = useGameStore()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [inputText, setInputText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSystemFailure, setShowSystemFailure] = useState(false)
  const [showDocViewer, setShowDocViewer] = useState(false)
  const [auditResults, setAuditResults] = useState([])
  const [phase, setPhase] = useState('audit')
  const [auditExpanded, setAuditExpanded] = useState(false)
  const [newDocNotification, setNewDocNotification] = useState(null)
  const [dataSynced, setDataSynced] = useState(false)
  const currentQuestion = AUDIT_QUESTIONS[currentQuestionIndex]

  // 检测是否已发现关键文档（处置手册或效能评估表）
  useEffect(() => {
    const keyDocs = ['disposal_manual', 'efficiency_audit']
    const found = keyDocs.some(d => discoveredDocuments.includes(d))
    if (found && !dataSynced) setDataSynced(true)
  }, [discoveredDocuments, dataSynced])

  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') { if (showDocViewer) { setShowDocViewer(false); closeDocument() } else if (auditExpanded) setAuditExpanded(false) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [showDocViewer, auditExpanded, closeDocument])

  useEffect(() => {
    if (auditLives===0 && !isAuditing) { setShowSystemFailure(true); setTimeout(()=>{ setShowSystemFailure(false); triggerSceneReset(); setCurrentQuestionIndex(0); setAuditResults([]); setPhase('audit'); setAuditExpanded(false) }, 2500) }
  }, [auditLives, isAuditing, triggerSceneReset])

  const handleSubmit = async () => {
    if (!inputText.trim()||isSubmitting) return; setIsSubmitting(true)
    try {
      let r = hasApiKey() ? await performRealAudit(inputText, currentQuestion) : performLocalAudit(inputText, currentQuestion)
      if (r.isValid) { addAuditSuccess(r.reason); setAuditResults(p=>[...p,{questionId:currentQuestion.id,passed:true}]); if (currentQuestionIndex>=AUDIT_QUESTIONS.length-1) { setPhase('success'); setTimeout(()=>{incrementIdentityLevel();setScene('city_night')},2000) } else { setTimeout(()=>{setCurrentQuestionIndex(p=>p+1);setInputText('');setAuditExpanded(false)},1000) } }
      else { deductAuditLife(r.reason); setAuditResults(p=>[...p,{questionId:currentQuestion.id,passed:false}]); setInputText('') }
    } catch(e) { deductAuditLife('系统错误: '+e.message) } finally { setIsSubmitting(false) }
  }

  const performRealAudit = async (text, q) => {
    try {
      console.log('[AUDIT] 调用 MiMo API 进行审计...')
      const r = await fetchWithTimeout(DEEPSEEK_CONFIG.API_BASE_URL+'/chat/completions',{
        method:'POST',
        headers:{'Authorization':'Bearer '+getApiKey(),'Content-Type':'application/json'},
        body:JSON.stringify(buildAuditRequest(text,q.terminal))
      },15000)
      if(!r.ok) throw new Error(`API请求失败: ${r.status}`)
      const data = await r.json()
      const aiResult = parseAuditResponse(data)
      console.log('[AUDIT] AI 审计结果:', aiResult)
      // AI 判断通过则直接通过，失败则用本地验证二次确认（防止 AI 误判）
      if (aiResult.isValid) {
        return { isValid: true, reason: aiResult.reason || 'AI 审计通过' }
      }
      // AI 判断失败时，用本地验证作为兜底（避免 AI 过于严格导致误杀）
      const localResult = q.validate(text)
      if (localResult.isValid) {
        return { isValid: true, reason: '[本地覆写] ' + localResult.reason }
      }
      return { isValid: false, reason: aiResult.reason || 'AI 审计未通过' }
    } catch(e) {
      console.warn('[AUDIT] API 调用失败，回退到本地验证:', e.message)
      return q.validate(text)
    }
  }

  const performLocalAudit = (text, q) => {
    return q.validate(text)
  }

  const handleHotspotClick = useCallback((dk) => {
    const doc=DOCUMENTS[dk]; if(!doc) return
    // 点击病历夹热区时，同时发现两份审计文档
    const auditDocIds = ['disposal_manual', 'efficiency_audit']
    let newTitle = null
    auditDocIds.forEach(id => {
      if (!discoveredDocuments.includes(id)) {
        discoverDocument(id)
        const docObj = Object.values(DOCUMENTS).find(d => d.id === id)
        if (docObj && !newTitle) newTitle = docObj.title
      }
    })
    if (newTitle) { setNewDocNotification(newTitle); setTimeout(() => setNewDocNotification(null), 3000) }
    setCurrentDocument(doc.id);setShowDocViewer(true)
  },[discoveredDocuments,discoverDocument,setCurrentDocument])

  const handleDocCollect = useCallback((clue)=>{addClue(clue);if(!hasViewedDocument)setHasViewedDocument()},[addClue,hasViewedDocument,setHasViewedDocument])
  const handleDocViewerClose = useCallback(()=>{setShowDocViewer(false);closeDocument()},[closeDocument])

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <div className="scanlines" />
      <svg className="absolute w-0 h-0"><filter id="noise-filter"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /><feBlend in="SourceGraphic" mode="screen" /></filter></svg>

      <AnimatePresence>{showSystemFailure && (<motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><div className="absolute inset-0" style={{filter:'url(#noise-filter)',opacity:0.3}} /><motion.div className="relative z-10 text-center" animate={{x:[0,-3,3,-1,1,0],opacity:[0.5,1,0.5,1,0.5]}} transition={{duration:0.5,repeat:5}}><div className="text-red-500 font-mono text-2xl tracking-widest mb-4">[SYSTEM_FAILURE]</div><div className="text-red-500/60 font-mono text-sm tracking-wider">身份同步崩溃 - 场景重置中...</div></motion.div>{Array.from({length:5}).map((_,i)=><motion.div key={i} className="absolute left-0 right-0 h-px bg-red-500/30" style={{top:(15+i*18)+'%'}} animate={{scaleX:[0,1,0],opacity:[0,0.5,0]}} transition={{duration:0.3,delay:i*0.1,repeat:3}} />)}</motion.div>)}</AnimatePresence>

      <div className="absolute inset-0" style={{backgroundImage:`url('${assetPath('assets/scenes/surgery_bg.webp')}')`,backgroundSize:'cover',backgroundPosition:'center'}} />
      <AnimatePresence>{auditExpanded ? <motion.div key="dim" className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.4}} /> : <motion.div key="light" className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.4}} />}</AnimatePresence>

      {HOTSPOTS.map((hs)=>{const doc=DOCUMENTS[hs.documentKey];const disc=discoveredDocuments.includes(doc?.id);return(<motion.div key={hs.id} className="absolute cursor-pointer z-20" style={hs.position} onClick={()=>handleHotspotClick(hs.documentKey)} whileHover={{borderColor:'rgba(255,255,255,0.15)'}} transition={{duration:0.3}}><div className="w-full h-full border border-transparent hover:border-white/10 transition-colors relative"><motion.div className="absolute inset-0 border border-white/0" animate={{borderColor:['rgba(255,255,255,0)','rgba(255,255,255,0.08)','rgba(255,255,255,0)']}} transition={{repeat:Infinity,duration:4,ease:'easeInOut'}} />{disc && <motion.div className="absolute -top-1 -right-1 w-1 h-1 bg-white/30" animate={{opacity:[0.3,0.8,0.3]}} transition={{repeat:Infinity,duration:2}} />}</div></motion.div>)})}

      <DocumentViewer isOpen={showDocViewer} onClose={handleDocViewerClose} onCollect={handleDocCollect} />

      <div className="absolute top-6 right-6 z-30 flex flex-col items-end gap-3"><SyncEnergyBar lives={auditLives} maxLives={3} /><CluesPanel /></div>
      <div className="absolute left-4 top-4 w-32 h-32 opacity-30"><Portrait step={1} /></div>

      {/* 任务框 - 实时引导 */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30">
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:0.6,delay:0.5}}>
          <div className="backdrop-blur-md bg-black/60 border border-white/10 px-4 py-3 max-w-[240px]">
            <div className="flex items-start gap-2">
              <svg width="10" height="10" viewBox="0 0 10 10" className="mt-0.5 flex-shrink-0 opacity-40"><rect x="0.5" y="0.5" width="9" height="9" stroke="white" strokeWidth="1" fill="none" /><line x1="5" y1="2.5" x2="5" y2="5.5" stroke="white" strokeWidth="1" /><circle cx="5" cy="7.5" r="0.5" fill="white" opacity="0.6" /></svg>
              <div>
                <span className="text-white/20 font-mono text-[8px] tracking-widest block mb-1.5">DIRECTIVE</span>
                <AnimatePresence mode="wait">{newDocNotification ? <motion.p key="new" className="text-white/70 font-mono text-[11px] leading-relaxed" initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}>[ ! ] NEW DATA ACQUIRED: {newDocNotification}</motion.p> : dataSynced ? <motion.p key="synced" className="text-white/50 font-mono text-[11px] leading-relaxed" initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}>数据已同步。开始接受系统审计，保持非人化叙事。</motion.p> : <motion.p key="before" className="text-white/30 font-mono text-[11px] leading-relaxed" initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}>确认为载体"外科医生"。检查周边文件，检索处置参数。</motion.p>}</AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>{phase==='success' && (<motion.div className="absolute inset-0 z-40 flex items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><div className="text-center"><div className="text-white/80 font-mono text-lg tracking-widest mb-4">[ 身份同步完成 ]</div><div className="text-white/40 font-mono text-sm">外科医生身份已确认。正在进入下一区域...</div></div></motion.div>)}</AnimatePresence>

      {phase==='audit' && (<div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <AnimatePresence>{!auditExpanded && (<motion.div className="pointer-events-auto cursor-pointer" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95,y:-20}} transition={{duration:0.3}} onClick={()=>setAuditExpanded(true)}><div className="backdrop-blur-md bg-black/60 border border-white/10 px-8 py-5 hover:border-white/20 transition-colors"><div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 14 14" className="opacity-40"><rect x="0.5" y="0.5" width="13" height="13" stroke="white" strokeWidth="1" fill="none" /><polyline points="3,5 5,7 3,9" stroke="white" strokeWidth="1" fill="none" /><line x1="7" y1="9" x2="11" y2="9" stroke="white" strokeWidth="1" /></svg><div><div className="text-white/60 font-mono text-xs tracking-widest">[AUDIT] 提问 {currentQuestion.id}/{AUDIT_QUESTIONS.length}</div><div className="text-white/25 font-mono text-[10px] mt-1">{currentQuestion.title} — 点击展开</div></div></div></div></motion.div>)}</AnimatePresence>

        <AnimatePresence>{auditExpanded && (<motion.div className="pointer-events-auto w-full max-w-xl mx-8" initial={{opacity:0,y:30,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20,scale:0.95}} transition={{duration:0.4}}>
          <div className="backdrop-blur-md bg-black/80 border border-white/10">
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
              <div className="flex items-center gap-2"><svg width="12" height="12" viewBox="0 0 12 12" className="opacity-40"><rect x="0.5" y="0.5" width="11" height="11" stroke="white" strokeWidth="1" fill="none" /><polyline points="3,4 5,6 3,8" stroke="white" strokeWidth="1" fill="none" /><line x1="6" y1="8" x2="9" y2="8" stroke="white" strokeWidth="1" /></svg><span className="text-white/40 font-mono text-[10px] tracking-widest">AUDIT_TERMINAL</span></div>
              <button onClick={()=>setAuditExpanded(false)} className="text-white/30 hover:text-white/60 font-mono text-[10px] tracking-widest transition-colors">[收起]</button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4"><span className="text-white/30 font-mono text-[10px] tracking-widest">审计提问 {currentQuestion.id}/{AUDIT_QUESTIONS.length}</span><span className="text-white/20 font-mono text-[10px] tracking-widest">{currentQuestion.title}</span></div>
              <div className="mb-6 p-6 border border-white/5 bg-white/[0.02]"><p className="text-white/80 font-mono text-lg leading-relaxed">{currentQuestion.terminal}</p></div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3"><div className={"w-2 h-2 "+(isSubmitting?"bg-white/60 animate-pulse":"bg-white/30")} /><span className="text-white/30 font-mono text-xs tracking-widest">{isSubmitting?'AUDITING...':'YOUR_RESPONSE'}</span></div>
                <div className="p-6 border border-white/5 bg-white/[0.02]"><UnderlineInput value={inputText} onChange={setInputText} onSubmit={handleSubmit} placeholder={isSubmitting?'身份审计中...':'输入处置参数...'} disabled={isSubmitting||auditLives===0} /></div>
                {isSubmitting && <div className="flex items-center gap-2 mt-3 px-1"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-white/40 animate-pulse" style={{animationDelay:'0ms'}} /><div className="w-1.5 h-1.5 bg-white/40 animate-pulse" style={{animationDelay:'150ms'}} /><div className="w-1.5 h-1.5 bg-white/40 animate-pulse" style={{animationDelay:'300ms'}} /></div><span className="text-white/20 font-mono text-xs tracking-widest">身份审计中...</span></div>}
              </div>
              {lastAuditReason && !isSubmitting && (<motion.div className="p-4 border border-white/5 bg-white/[0.02]" initial={{opacity:0}} animate={{opacity:1}}><p className={"font-mono text-sm "+(auditResults.length>0&&auditResults[auditResults.length-1].passed?"text-white/50":"text-red-400/70")}>{lastAuditReason}</p></motion.div>)}
            </div>
            <div className="px-6 py-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-white/15 font-mono text-[10px] tracking-widest">自由文本输入 · 以文档数据为准</span>
              <span className="text-white/15 font-mono text-[10px] tracking-widest">ESC 收起</span>
            </div>
          </div>
        </motion.div>)}</AnimatePresence>
      </div>)}
    </div>
  )
}
