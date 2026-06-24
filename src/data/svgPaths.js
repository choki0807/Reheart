// 自画像SVG路径数据
export const PORTRAIT_PATHS = [
  {
    id: 'headpiece',
    path: 'M 100,50 C 80,30 120,20 140,40 C 160,60 140,80 120,70 C 100,60 90,50 100,50 Z',
    color: '#FF6B8B', // 红色
    label: '头饰'
  },
  {
    id: 'eyes',
    path: 'M 90,80 C 85,75 95,70 100,75 C 105,80 115,75 120,80 C 125,85 115,90 110,85 C 105,80 95,85 90,80 Z',
    color: '#4ECDC4', // 蓝色
    label: '瞳孔'
  },
  {
    id: 'collar',
    path: 'M 85,110 C 80,120 120,125 125,115 C 130,105 115,100 105,105 C 95,110 90,100 85,110 Z',
    color: '#45B7D1', // 绿色
    label: '衣领'
  },
  {
    id: 'hair',
    path: 'M 70,60 C 65,40 75,30 85,35 C 95,40 105,35 115,40 C 125,45 135,35 140,50 C 145,65 135,75 125,70 C 115,65 105,70 95,65 C 85,60 75,80 70,60 Z',
    color: '#96CEB4', // 黄色
    label: '发丝'
  },
  {
    id: 'cheek',
    path: 'M 95,95 C 90,100 105,105 110,100 C 115,95 110,90 105,90 C 100,90 100,90 95,95 Z',
    color: '#FFEAA7', // 粉色
    label: '脸颊'
  }
]

// 猫轮廓SVG路径
export const CAT_PATHS = [
  {
    id: 'ears',
    path: 'M 50,30 L 45,10 L 55,20 M 70,30 L 75,10 L 65,20',
    stroke: '#FFFFFF'
  },
  {
    id: 'face',
    path: 'M 50,30 C 45,40 65,45 70,30 C 75,15 55,15 50,30 Z',
    stroke: '#FFFFFF'
  },
  {
    id: 'whiskers',
    path: 'M 40,35 L 30,33 M 40,38 L 30,40 M 40,41 L 30,43 M 80,35 L 90,33 M 80,38 L 90,40 M 80,41 L 90,43',
    stroke: '#FFFFFF'
  }
]

// 手机框SVG路径
export const PHONE_FRAME = {
  width: 300,
  height: 500,
  path: 'M 10,10 L 290,10 L 290,490 L 10,490 Z'
}

// 微信聊天气泡
export const WECHAT_BUBBLES = {
  left: {
    path: 'M 20,20 L 180,20 L 200,30 L 180,40 L 20,40 Z',
    width: 200,
    height: 40
  },
  right: {
    path: 'M 100,20 L 280,20 L 280,40 L 100,40 L 80,30 Z',
    width: 200,
    height: 40
  }
}