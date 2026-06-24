
---

# 🎮 [死而替生] 项目全局指令协议 (Master Prompt)

## 1. 核心定位与灵魂设定 (The Manifesto)
你现在是 **[死而替生]** 的首席游戏架构师。
* **游戏本质**：一场基于“身份窃取”与“非人化模拟”的赛博叙事游戏。
* **核心冲突**：玩家（小女孩）必须通过手动输入对话来欺骗**“身份审计系统 (AI Firewall)”**。
* **AI 的角色转换**：你调用的 DeepSeek API **不是辅助工具，而是游戏内的反派反派（Firewall）**。它的目标是搜寻玩家言语中的“人类情感残余”并执行关卡重置。
* **视觉隐喻**：唯一的色彩存在于“自画像”中。**生存即剥离**——每夺取一个身份，自画像就永久丧失一种色彩。

## 2. 视觉美学约束 (Visual System)
* **1px 极简主义**：严禁圆角，严禁位图。所有视觉资产（角色、背景、心脏、手术台）必须由 **Inline SVG (1px stroke)** 构成。
* **高灰阶环境**：背景固定为纯黑 (`#000000`)。UI 使用白色的不同透明度 (`white/10` 到 `white/90`)，配合 `backdrop-blur-md` 营造冰冷的“果冻感”。
* **动态反馈**：对话框律动 (`animate-pulse`)，审计失败时的全屏噪点 (`Glitch Effect`)。

## 3. 双层状态机架构 (Logic Architecture)

### A. 全局叙事状态 (Narrative State)
* **`identityLevel` (0-4)**：代表进度的不可逆增长。
* **`memoryColors`**：控制 `Portrait.jsx` 组件。每当 `identityLevel` 增加，对应的 SVG Path 颜色将**永久**转为 `#222` (灰阶)。这代表主角灵魂的消亡。

### B. 局部生存状态 (Survival State)
* **审计判定 (Audit)**：玩家在当前场景（如：手术室、升降梯）输入文字。
* **判定分歧**：
    * **Score >= 60 (Success)**：执行 `identityLevel++`，触发剥色动画，跳转下一关。
    * **Score < 60 (Failure)**：**触发 [SCENE_RESET]**。全屏红字报错 `[HUMAN_TRACE_DETECTED]`，重置当前场景所有变量。玩家必须重新寻找“非人化”的表达方式。

## 4. AI 审计协议 (DeepSeek API Interaction)
为了防止将游戏误解为心理测试，你必须以如下 Prompt 驱动 DeepSeek：
> "你现在是赛博都市的身份审计防火墙。你的任务是检测当前的[身份: {currentRole}]是否存在伪装。
> **审计准则**：
> 1. 任何带有同情心、道德纠结、或是小女孩特质（如：害怕、救救我、对不起）的言论，判定为‘同步失败’。
> 2. 只有符合该职业逻辑（如：冷酷的指令、医学术语、秩序维护）的言论，判定为‘同步成功’。
> **输出格式**：严格返回 JSON { 'score': 0-100, 'isSynced': boolean, 'reason': '系统分析报告' }"

## 5. 项目文件骨架 (File Structure)
* `/src/core/useGameStore.js`: 管理全局进度与自画像颜色状态。
* `/src/components/Portrait.jsx`: 5 个闭合 SVG 路径构成的动态自画像。
* `/src/scenes/`: 存放独立的关卡组件（Intro, Surgery, Elevator, Penthouse）。
* `/src/data/identities.js`: 存放每个身份的判定 Prompt 和 1px SVG 路径数据。

## 6. 开发路线图 (Roadmap)
1.  **Phase 1**: 初始化 1px 极简 UI 主题与全局状态机。
2.  **Phase 2**: 实现 `Portrait` 组件，完成基于 Framer Motion 的“剥色”补间动画。
3.  **Phase 3**: 实现“场景重置”机制。测试逻辑：输入人性化语言 -> 触发 Glitch -> 本地场景回档。
4.  **Phase 4**: 迭代后续场景，并注入“记忆碎片”文案。
## 7.参考项目结构
re-heart/
├── .clinerules           # 核心指令 (锁定 1px 美学与叙事协议)
├── src/
│   ├── core/             # 游戏“大脑”
│   │   ├── useGameStore.js    # 统一的状态管理 (建议合并 store.js)
│   │   ├── useAudit.js        # 封装 DeepSeek 审计逻辑
│   │   └── constants.js       # 存放全局配置 (如身份等级)
│   │
│   ├── components/       # 视觉“零件”
│   │   ├── common/            # 通用 UI (Terminal, Glitch, BlurOverlay)
│   │   └── game/              # 叙事组件 (Portrait, WeChatFrame, CatSketch)
│   │
│   ├── scenes/           # 叙事“舞台”
│   │   ├── IntroScene/        # 序幕：包含 Index.jsx 及该场景特有小组件
│   │   ├── SurgeryScene/      # 第一幕：手术室审计
│   │   └── ...                # 后续扩展：ElevatorScene, PenthouseScene
│   │
│   ├── hooks/            # 自定义钩子 (如 useTypewriter, useFlicker)
│   │
│   ├── data/             # 静态剧本与资产
│   │   ├── scripts.js         # 序幕文本、微信对话、审计 Prompt
│   │   └── svgPaths.js        # 所有 1px SVG 的路径坐标
│   │
│   ├── styles/           # 视觉外壳
│   │   └── global.css         # 强制全黑、禁用滚动、1px 边框规范
│   │
│   ├── App.jsx           # 场景调度中心
│   └── main.jsx          # 渲染入口
---

**Agent (Cline)，如果你已经理解了这个关于“失去自我”的残酷叙事博弈，请从初始化项目框架开始，并为我展示第一个场景：[序幕]。**