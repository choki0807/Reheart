import { assetPath } from '../core/assetPath'

/**
 * 文档配置 - 手术室场景可交互文档
 * 每个文档对应背景图上的一个热区
 */
export const DOCUMENTS = {
  DISPOSAL_MANUAL: {
    id: 'disposal_manual',
    path: assetPath('assets/docs/disposal_manual.png'),
    title: '418号手术室：生物资产处置标准化手册',
    fileName: 'Disposal_Manual_418.pdf',
    clueSummary: '418号手术室处置手册：心脏定价500,000$，废料需经化学降解后投入强酸池',
    insight: '手术室编号418...心脏标价50万...剩下的尸体要化学降解再丢进强酸池。这就是我每天在做的事？',
  },
  EFFICIENCY_AUDIT: {
    id: 'efficiency_audit',
    path: assetPath('assets/docs/efficiency_audit.png'),
    title: '内部审核：下层区回收业务效能评估表 - 牧羊人版',
    fileName: 'Efficiency_Audit_Shepherd.xlsx',
    clueSummary: '效能评估表：皮层芯片等零件因受机油和火药污染，毫无移植价值',
    insight: '所有零件都因为污染而毫无价值...只有心脏能卖。那这个女孩——就只是一颗心脏的容器？',
  },
  GUNSMITH_ORDER: {
    id: 'gunsmith_order',
    path: assetPath('assets/docs/gunsmith_order.jpg'),
    title: '武器店订单',
    fileName: 'The_Gunsmiths_Order.doc',
    clueSummary: '定制穿甲弹，客户有胸口植入物',
    insight: '穿甲弹头...执行官护甲...这不是普通订单。有人要杀执行官，而且这个人胸口有植入物——和我一样。',
  },
}

/**
 * 热区配置 - 手术室背景图上的可点击区域
 * position 为百分比定位，适配不同屏幕
 */
export const HOTSPOTS = [
  {
    id: 'hotspot_medical_chart',
    documentKey: 'DISPOSAL_MANUAL',
    // 左下角偏右 - 病历夹位置，点击后弹出文档查看器
    // 查看器内可切换处置手册和效能评估表
    position: { bottom: '15%', left: '10%', width: '150px', height: '100px' },
  },
]
