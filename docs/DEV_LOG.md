---

# 6. `docs/DEV_LOG.md`

```md
# DEV_LOG.md

# 开发日志

本文件用于记录项目的重要修改、设计决策、Bug、修复方法和阶段进度。

AI Agent 每次完成重要修改后，应在本文件末尾追加一条记录。

---

## 日志格式

每条日志建议使用以下格式：

```md
## YYYY-MM-DD - 修改标题

### 修改内容

1. ...
2. ...
3. ...

### 修改文件

- `src/...`
- `docs/...`

### 修改原因

说明为什么要做这次修改。

### 验收方法

1. ...
2. ...
3. ...

### 注意事项

记录本次修改后需要注意的问题。

---

## 2026-06-05 - 第一阶段 Web 最小原型实现

### 修改内容

1. 创建 Vite + React + TypeScript 项目（`linear-algebra-app`）
2. 实现数学模块：`Vec2.ts`（二维向量）、`Mat2.ts`（二维矩阵）
3. 实现渲染模块：`Camera2D.ts`（坐标转换）、`drawGrid.ts`（网格）、`drawAxes.ts`（坐标轴）、`drawVector.ts`（向量箭头）、`drawPolygon.ts`（多边形/单位正方形）
4. 实现 React 组件：`MatrixInput.tsx`（矩阵输入）、`ControlPanel.tsx`（控制面板）、`CanvasView.tsx`（Canvas 绘图区）
5. 整合所有组件到 `App.tsx`

### 修改文件

- `linear-algebra-app/src/math/Vec2.ts`
- `linear-algebra-app/src/math/Mat2.ts`
- `linear-algebra-app/src/render/Camera2D.ts`
- `linear-algebra-app/src/render/drawGrid.ts`
- `linear-algebra-app/src/render/drawAxes.ts`
- `linear-algebra-app/src/render/drawVector.ts`
- `linear-algebra-app/src/render/drawPolygon.ts`
- `linear-algebra-app/src/components/MatrixInput.tsx`
- `linear-algebra-app/src/components/ControlPanel.tsx`
- `linear-algebra-app/src/components/CanvasView.tsx`
- `linear-algebra-app/src/App.tsx`
- `linear-algebra-app/src/index.css`

### 修改原因

实现第一阶段要求的 Web 最小原型：可以输入 2×2 矩阵并播放二维线性变换动画。

### 验收方法

1. 运行 `npm run dev` 启动开发服务器
2. 浏览器打开 http://localhost:5173/
3. 输入测试矩阵并点击"播放变换"
4. 验证 ROADMAP.md 中的 7 个测试用例

### 注意事项

- 矩阵乘法顺序：先 A 后 B 对应 B * A
- 动画插值：M(t) = (1 - t)I + tA
- 坐标转换统一通过 Camera2D 完成

---

## 2026-06-05 - 第一阶段验收检查与修复

### 修改内容

1. 执行 `npm run build` 验证构建
2. 执行 TypeScript 类型检查
3. 修复矩阵输入框第二列被 Canvas 坐标轴遮挡的问题
4. 验证 7 个测试矩阵的数学正确性

### 修改文件

- `linear-algebra-app/src/components/ControlPanel.tsx` - 添加 `position: relative` 和 `z-index: 10`

### 修改原因

用户报告矩阵输入框第二列被坐标轴遮挡，无法正常输入。原因是 Canvas 容器设置了 `position: relative` 但没有 `overflow: hidden`，导致坐标轴线可能绘制到 ControlPanel 区域上方。

### 验收结果

| 检查项 | 结果 |
|--------|------|
| `npm run build` | ✅ 通过 |
| TypeScript 类型检查 | ✅ 通过（无错误） |
| 输入框遮挡问题 | ✅ 已修复 |

### 矩阵约定验证

| 测试 | 输入矩阵 | e1' | e2' | 符合预期 |
|------|----------|-----|-----|----------|
| 单位矩阵 | `[1,0;0,1]` | (1,0) | (0,1) | ✓ |
| x缩放 | `[2,0;0,1]` | (2,0) | (0,1) | ✓ |
| y缩放 | `[1,0;0,2]` | (1,0) | (0,2) | ✓ |
| 旋转90° | `[0,-1;1,0]` | (0,1) | (-1,0) | ✓ |
| 水平剪切 | `[1,1;0,1]` | (1,0) | (1,1) | ✓ |
| 压缩到x轴 | `[1,0;0,0]` | (1,0) | (0,0) | ✓ |
| y轴翻转 | `[-1,0;0,1]` | (-1,0) | (0,1) | ✓ |

### 手动验收方法

1. 浏览器打开 http://localhost:5174/
2. 逐一测试 ROADMAP.md 中的 7 个矩阵
3. 验证非法输入不导致崩溃
4. 验证重置功能恢复正常

### 注意事项

- 开发服务器端口可能因占用而变化（5173 或 5174）
- 输入框第二列现在可以正常点击输入
- 所有数学约定符合 MATH_CONVENTIONS.md

---

## 2026-06-05 - 第二阶段：抽象场景对象系统

### 修改内容

1. 创建 `src/scene/` 目录
2. 实现 `Grid.ts` - 网格场景对象
3. 实现 `VectorArrow.ts` - 向量箭头场景对象
4. 实现 `UnitSquare.ts` - 单位正方形场景对象
5. 实现 `Scene.ts` - 场景管理器
6. 重构 `CanvasView.tsx` - 移除场景管理，改用 Scene 类

### 修改文件

**新增文件：**
- `src/scene/Grid.ts`
- `src/scene/VectorArrow.ts`
- `src/scene/UnitSquare.ts`
- `src/scene/Scene.ts`

**修改文件：**
- `src/components/CanvasView.tsx` - 从 174 行减少到 145 行，drawFrame 从 77 行减少到 8 行

### 修改原因

第一阶段代码中，CanvasView.tsx 包含了大量场景对象管理和绘制逻辑，不利于扩展。第二阶段将这些逻辑抽象到独立的场景对象中，为第三阶段动画系统做准备。

### 结构审计结果

| 检查项 | 结果 |
|--------|------|
| CanvasView 是否直接调用 drawGrid/drawAxes/drawVector/drawPolygon？ | ✅ 否 |
| CanvasView 是否只负责 Canvas 生命周期？ | ✅ 是 |
| src/scene/ 是否包含 Grid/VectorArrow/UnitSquare/Scene？ | ✅ 是 |
| 场景对象是否不依赖 React？ | ✅ 是 |
| Scene.render() 是否统一控制绘制顺序？ | ✅ 是 |
| 坐标轴是否仍然正常绘制？ | ✅ 是 |
| 原始 e1/e2 和变换后 e1'/e2' 是否都被保留？ | ✅ 是 |
| 是否没有创建 src/animation/？ | ✅ 是 |
| 是否没有实现高级功能？ | ✅ 是 |

### 验收结果

| 检查项 | 结果 |
|--------|------|
| `npm run build` | ✅ 通过 |
| `npx tsc --noEmit` | ✅ 通过 |
| 7 个测试矩阵视觉效果 | ✅ 与第一阶段一致 |
| 重置功能 | ✅ 正常 |
| 非法输入 | ✅ 不崩溃 |

### Git 标签

- `stage-1-stable` - 第一阶段稳定版本
- `stage-2-stable` - 第二阶段稳定版本

### 注意事项

- 第二阶段是"看不见的改进"——视觉效果不变，但代码结构更清晰
- Grid 的 transform 参数保留供后续阶段使用（当前网格不经过变换）

---

## 2026-06-05 - Stage 4.4 - 4.7.1 实现

### Stage 4.4：行列式、面积缩放与方向翻转

**新增文件：** 无

**修改文件：**
- `src/scene/UnitSquare.ts` - 颜色根据 det 变化（黄/红/灰）
- `src/scene/Scene.ts` - 添加 showAreaLabel 选项
- `src/components/CanvasView.tsx` - 传递 showAreaLabel
- `src/components/ResultPanel.tsx` - 添加行列式显示
- `src/App.tsx` - 添加 showAreaLabel 状态

**功能：**
- ResultPanel 显示 det(currentMatrix) 和 det(finalMatrix)
- UnitSquare 颜色根据行列式变化（黄=方向保持，红=方向翻转，灰=压缩）
- 安全格式化（避免 NaN/Infinity/-0.00）

---

### Stage 4.5：逆矩阵与播放逆变换

**新增文件：** 无

**修改文件：**
- `src/components/ResultPanel.tsx` - 添加逆矩阵显示
- `src/components/CanvasView.tsx` - 添加 playInverse 方法
- `src/App.tsx` - 添加播放逆变换按钮

**功能：**
- ResultPanel 显示逆矩阵
- 播放逆变换按钮（C → I）
- 不可逆时按钮 disabled

---

### Stage 4.6：基与坐标系统最小原型

**新增文件：**
- `src/utils/basis.ts` - 基与坐标计算工具
- `src/scene/BasisGrid.ts` - 新基网格场景对象
- `src/components/BasisPanel.tsx` - 基与坐标控制面板

**修改文件：**
- `src/types/index.ts` - 添加 BasisConfig 类型
- `src/scene/Scene.ts` - 添加 BasisGrid 渲染
- `src/components/ResultPanel.tsx` - 添加新基坐标显示
- `src/components/CanvasView.tsx` - 传递 basisConfig
- `src/App.tsx` - 管理 basisConfig 状态

**功能：**
- 用户输入新基向量 b1, b2
- 构造基矩阵 P = [b1 b2]
- 判断是否可构成基
- 新基网格显示（可调强度）
- 用户向量在新基下的坐标 [v]_B

---

### Stage 4.6.1：用户向量标准坐标/新基坐标双输入

**新增文件：** 无

**修改文件：**
- `src/types/index.ts` - VectorItem 添加 controlMode 和 basisCoord
- `src/components/VectorList.tsx` - 添加新基坐标输入
- `src/App.tsx` - 添加坐标更新逻辑

**功能：**
- 每个用户向量同时显示标准坐标和新基坐标
- controlMode = 'standard' 时，编辑标准坐标，[v]_B 自动更新
- controlMode = 'basis' 时，编辑新基坐标，v 自动更新
- P 不可逆时禁用 B 坐标输入

---

### Stage 4.7：A_B = P^{-1}AP 数值显示

**新增文件：** 无

**修改文件：**
- `src/utils/basis.ts` - 添加 computeTransformInBasis 函数
- `src/components/ResultPanel.tsx` - 添加 A_B 显示

**功能：**
- 计算 A_current_B = P^{-1} * currentMatrix * P
- 计算 A_final_B = P^{-1} * finalMatrix * P
- 用户向量验证（A_B [v]_B = [A v]_B）
- 动画过程中 A_current_B 实时更新

---

### Stage 4.7.1：P^{-1}AP 路径数值演示

**新增文件：** 无

**修改文件：** 同 Stage 4.7

**功能：**
- 在 ResultPanel 中显示 P^{-1}AP 路径数值
- 用户向量验证标记（✓/✗）

---

### 未完成内容

**Stage 4.7.2：P、A、P^{-1} 三段 Canvas 动画演示**
- 目标：在 Canvas 中直观演示 [v]_B → v_E → A v_E → [Av]_B
- 状态：未实现

---

## 2026-06-06 - Stage 4.7.2：P^{-1}AP 路径演示

### 修改内容

1. 新增 `PathDemoState` 类型（`src/types/index.ts`）
2. 新增 `PathPanel.tsx` 路径演示控制面板组件
3. 修改 `App.tsx`：添加路径演示状态管理、互斥逻辑、数据变化时自动重置
4. 修改 `CanvasView.tsx`：添加路径 overlay 渲染（v_E 高亮、v_E→Av_E 动画）

### 修改文件

**新增文件：**
- `src/components/PathPanel.tsx` - 路径演示控制面板

**修改文件：**
- `src/types/index.ts` - 添加 PathDemoState 类型
- `src/App.tsx` - 添加路径演示状态、互斥、PathPanel 集成
- `src/components/CanvasView.tsx` - 添加 overlay 渲染和路径动画方法

### 设计决策

1. **overlay 而非全局状态**：路径演示不修改 currentMatrix/finalMatrix/matrixSequence/vectorSet，是独立的高亮 overlay
2. **只绘制标准平面几何向量**：Canvas 中只绘制 v_E 和 Av_E（都是标准坐标），[v]_B/[Av]_B/A_B[v]_B 只在控制面板中以数值显示
3. **互斥机制**：路径播放中禁用矩阵序列播放、单步前进/回退、播放逆变换；反之亦然。路径播放中也禁用矩阵/基/向量编辑
4. **派生计算**：PathDemoState 只存 selectedVectorId/stepIndex/isPlaying/overlayProgress，v_E/Av_E/Av_B/A_B[v]_B 每次 render 派生计算
5. **step 2 动画**：使用独立的 requestAnimationFrame 循环驱动 overlayProgress，smoothStep 缓动，1.5 秒
6. **自动重置**：basisConfig/matrixSequence/vectorSet 变化时自动重置路径演示

### 修改原因

Stage 4.7.1 已完成 P^{-1}AP 路径数值显示，Stage 4.7.2 将其扩展为 Canvas 可视化演示。

### 验收方法

1. `npm run build` ✅
2. `npx tsc --noEmit` ✅
3. 手动测试用例：
   - P=I, v=(2,1), A=[0,-1;1,0]：路径退化为 A 直接作用
   - P=[1,1;0,1], [v]_B=(1,1), A=[2,0;0,1]：v_E=(2,1), Av_E=(4,1), P^{-1}Av_E=(3,1), A_B[v]_B=(3,1)
   - P 不可逆时禁用路径演示
   - 路径播放中禁用矩阵序列播放（互斥）
   - 修改 basisConfig/matrixSequence/vectorSet 时路径自动重置

### 注意事项

- 路径演示使用 finalMatrix 作为 A（默认）
- Canvas overlay 在场景最上层绘制
- 组件卸载时清理 pathAnimFrameRef

---

## 2026-06-06 - Stage 4.8：特征值 / 特征向量可视化

### 修改内容

1. 新增 `src/utils/eigen.ts`：特征值 / 特征方向计算（analyzeEigenvalues, getEigenMeaning）
2. 新增 `src/components/EigenPanel.tsx`：特征信息控制面板（总开关、特征值列表、方向选择、t 滑块）
3. 修改 `src/types/index.ts`：新增 EigenResult、EigenDirectionResult、EigenConfig 类型
4. 修改 `src/App.tsx`：新增 eigenConfig 状态、useMemo 派生 eigenResult、集成 EigenPanel、传递数据到 CanvasView
5. 修改 `src/components/CanvasView.tsx`：新增 eigen overlay 渲染（特征方向直线 + 示例向量 v/Av）

### 设计决策

1. **EigenResult 通过 useMemo 派生**：不存 React state，从 finalMatrix 实时计算
2. **EigenConfig 只存 UI 状态**：showEigenInfo / selectedDirectionId / scalarT
3. **特征方向线覆盖整个画布**：根据 camera 可视范围计算 R，缩放平移后仍覆盖
4. **路径演示播放时降低 eigen 透明度**：避免 overlay 混乱
5. **方向符号规范化**：u 和 -u 规范为同一方向，避免重复显示
6. **λ≈0 时不画 Av 箭头**：避免零向量的异常箭头

### 验收方法

1. `npm run build` ✅
2. `npx tsc --noEmit` ✅
3. 测试矩阵：
   - [2,0;0,1]：λ=2 (x轴), λ=1 (y轴)
   - [-1,0;0,1]：λ=-1 (x轴反向), λ=1 (y轴)
   - [1,1;0,1]：λ=1，只有一条方向
   - [0,-1;1,0]：无实特征值
   - [2,0;0,2]：所有方向都是特征方向
   - [1,0;0,0]：λ=1 (x轴), λ=0 (y轴压缩到原点)

---

*文档更新时间：2026-06-06*
- 为第三阶段动画系统做好了准备