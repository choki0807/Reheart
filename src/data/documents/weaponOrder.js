/**
 * 武器店老板的订单 - 第一幕可查看档案
 * 关联第三幕关键线索
 */
export const WEAPON_ORDER_DOC = {
  id: 'weapon-order',
  title: '武器店老板的订单',
  fileName: 'The Gunsmith\'s Order.doc',
  content: [
    { type: 'header', text: '[ 订单编号：#992-X ]' },
    { type: 'field', label: '客户', value: '匿名 (特征：左胸口植入物)' },
    { type: 'field', label: '要求', value: '定制 12mm 穿甲弹头，需能贯穿标准执行官护甲。' },
    { type: 'note', text: '[ 备注：这是最后一次合作。之后我会把自己\'清理\'干净。 ]' },
  ],
  insight: '穿甲弹头...执行官护甲...这不是普通订单。有人要杀执行官，而且这个人胸口有植入物——和我一样。',
  clueSummary: '定制穿甲弹，客户有胸口植入物',
  hint: '此文档内容将作为第三幕的关键线索。',
}