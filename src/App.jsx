import { useState } from 'react'
import { useGameStore } from './core/useGameStore'
import { hasApiKey } from './core/apiConfig'
import Intro from './scenes/Intro'
import Title from './scenes/Title'
import Surgery from './scenes/Surgery'
import AssassinScene from './scenes/AssassinScene'
import Penthouse from './scenes/Penthouse'
import TransitionScene from './scenes/TransitionScene'
import IdentityPortrait from './components/IdentityPortrait'
import ApiKeySetup from './components/ApiKeySetup'
import './styles/global.css'

// ═══ 第二幕→第三幕过场：城市夜塔 ═══
const CITY_NIGHT_DIALOGUES = [
  {
    speaker: '系统',
    text: '外科医生的身份已经剥落。你从手术室的血腥气中走出，踏入下城区的夜色。',
  },
  {
    speaker: '系统',
    text: '远处，城市塔楼的霓虹在雨幕中闪烁。你需要找到那个卖枪的人——他是你通向下一个身份的钥匙。',
  },
  {
    text: '雨滴打在你的植入物上，发出金属的冷响。你已经不再是医生了。',
  },
]

// ═══ 第三幕→第四幕过场：大楼入口 ═══
const BUILDING_ENTRANCE_DIALOGUES = [
  {
    speaker: '系统',
    text: '枪声的回响消散在黑市的巷道里。杀手的身份像弹壳一样被抛弃在地上。',
  },
  {
    speaker: '系统',
    text: '你站在那座大楼的入口前。电梯门打开着，像一张等待吞噬的嘴。上面是最后的身份——上层阶级的女儿。',
  },
  {
    text: '你走进去。电梯开始上升。每升高一层，就有一段记忆从画布上剥落。',
  },
]

// 游戏结束场景
function GameOver() {
  const { memoryColors } = useGameStore()
  const lostColors = memoryColors.filter(color => color === '#222222').length
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-10">
      <div className="text-center max-w-md">
        <div className="text-white/80 font-mono text-lg mb-6">
          [ 系统同步完成 ]
        </div>
        <div className="text-white/50 font-mono text-sm mb-8 leading-relaxed">
          你已成功剥离了 {lostColors} 种色彩。<br/>
          现在，你已成为完美的防火墙组件。<br/>
          不再有情感，不再有色彩。
        </div>
        <div className="flex justify-center gap-2 mb-8">
          {memoryColors.map((color, index) => (
            <div
              key={index}
              className="w-4 h-4"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="text-white/30 font-mono text-xs">
          死而替生 v0.1
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { scene, isDead } = useGameStore()
  const [apiSetupDone, setApiSetupDone] = useState(hasApiKey())

  const handleApiSetupComplete = () => {
    setApiSetupDone(true)
  }

  const renderScene = () => {
    if (isDead) {
      return <GameOver />
    }
    
    switch (scene) {
      case 'intro':
        return <Intro />
      case 'title':
        return <Title />
      case 'surgery':
        return <Surgery />
      case 'city_night':
        return (
          <TransitionScene
            bgImage="/assets/scenes/city_tower_night.jpg"
            nextScene="assassin"
            dialogues={CITY_NIGHT_DIALOGUES}
            identityStep={1}
          />
        )
      case 'assassin':
        return <AssassinScene />
      case 'building_entrance':
        return (
          <TransitionScene
            bgImage="/assets/scenes/building_entrance.jpg"
            nextScene="penthouse"
            dialogues={BUILDING_ENTRANCE_DIALOGUES}
            identityStep={2}
          />
        )
      case 'penthouse':
        return <Penthouse />
      default:
        return <Intro />
    }
  }
  
  return (
    <div className="w-full h-full bg-black overflow-hidden">
      {/* 全局扫描线效果 */}
      <div className="scanlines" />

      {!apiSetupDone ? (
        <ApiKeySetup onComplete={handleApiSetupComplete} />
      ) : (
        <>
          {/* 身份画像覆盖层 */}
          <IdentityPortrait />

          {/* 渲染当前场景 */}
          {renderScene()}
        </>
      )}

      {/* 调试信息（开发时显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-white/20 font-mono text-xs">
          <div>场景: {scene}</div>
          <div>状态: {isDead ? '游戏结束' : '进行中'}</div>
        </div>
      )}
    </div>
  )
}
