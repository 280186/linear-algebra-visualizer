# HANDOFF.md - 项目交接文档

## 一、项目概述

这是一个 3Blue1Brown 风格的二维线性代数交互式演示软件，用于帮助用户直观理解矩阵变换、基变换、坐标系统等线性代数概念。

**技术栈**：TypeScript + Vite + React + Canvas

**当前稳定阶段**：Stage 4.7.1（P^{-1}AP 路径数值演示）

---

## 二、已实现功能列表

### 基础功能
- [x] 2×2 矩阵输入（支持整数、小数、分数）
- [x] 矩阵序列（添加/删除/编辑/拖动排序）
- [x] 用户向量集合（添加/删除/编辑）
- [x] Canvas 缩放（鼠标滚轮）
- [x] Canvas 平移（鼠标拖拽）
- [x] 暂停/继续/重置

### 动画系统
- [x] Timeline 动画调度器
- [x] ApplyMatrixAnimation 矩阵变换动画
- [x] 缓动函数（linear, smoothStep, easeInOutCubic）
- [x] 播放完整序列
- [x] 单步前进/回退
- [x] 播放逆变换（C → I）

### 数学功能
- [x] 行列式显示（det, |det|, 面积缩放, 方向翻转）
- [x] 逆矩阵显示
- [x] 非交换性验证（M2*M1 ≠ M1*M2）
- [x] 新基 b1, b2 输入
- [x] 基矩阵 P = [b1 b2]
- [x] 新基网格显示
- [x] 用户向量标准坐标/新基坐标双输入
- [x] A_B = P^{-1}AP 数值显示
- [x] 用户向量验证（A_B [v]_B = [A v]_B）

### 显示功能
- [x] 变换网格（可调强度）
- [x] 新基网格（可调强度）
- [x] 向量标签显示
- [x] 标签防重叠

---

## 三、当前主要架构

```
src/
├── animation/          # 动画系统
│   ├── Animation.ts    # 动画接口
│   ├── Timeline.ts     # 动画调度器
│   ├── ApplyMatrixAnimation.ts
│   └── easing.ts
├── components/         # React 组件
│   ├── App.tsx         # 主应用
│   ├── CanvasView.tsx  # Canvas 绘图区
│   ├── ControlPanel.tsx (已废弃，改用 BasisPanel)
│   ├── MatrixInput.tsx # 矩阵输入
│   ├── MatrixList.tsx  # 矩阵序列列表
│   ├── VectorList.tsx  # 向量列表
│   ├── ResultPanel.tsx # 结果面板
│   ├── BasisPanel.tsx  # 基与坐标面板
│   └── ResizableSidebar.tsx
├── math/               # 数学模块
│   ├── Vec2.ts         # 二维向量
│   └── Mat2.ts         # 二维矩阵
├── render/             # 渲染模块
│   ├── Camera2D.ts     # 坐标转换
│   ├── drawGrid.ts     # 网格绘制
│   ├── drawAxes.ts     # 坐标轴绘制
│   ├── drawVector.ts   # 向量绘制
│   ├── drawPolygon.ts  # 多边形绘制
│   └── drawTransformedAxes.ts
├── scene/              # 场景对象
│   ├── Scene.ts        # 场景管理器
│   ├── Grid.ts         # 网格
│   ├── VectorArrow.ts  # 向量箭头
│   ├── UnitSquare.ts   # 单位正方形
│   ├── UserVector.ts   # 用户向量
│   └── BasisGrid.ts    # 新基网格
├── types/              # 类型定义
│   └── index.ts
└── utils/              # 工具函数
    ├── id.ts           # ID 生成
    ├── numberInput.ts  # 数字解析
    ├── matrixSequence.ts
    └── basis.ts        # 基与坐标计算
```

---

## 四、关键数学约定

### 列向量约定

```text
向量 v = (x, y) 视为列向量 [x, y]^T

矩阵 A = [a b; c d] 作用于 v：
x' = a*x + b*y
y' = c*x + d*y

第一列 (a, c) 是 e1 的像
第二列 (b, d) 是 e2 的像
```

### 矩阵乘法顺序

```text
先执行 A，再执行 B，对应组合矩阵 B*A
multiplyMat(m) 语义：this * m
```

### 基矩阵约定

```text
新基 b1, b2 构成基矩阵 P = [b1 b2]
b1 是第一列，b2 是第二列

标准坐标到新基坐标：[v]_B = P^{-1} v
新基坐标到标准坐标：v = P [v]_B
同一线性变换在新基下的矩阵：A_B = P^{-1} A P
```

### EPS 判断

```text
const EPS = 1e-8;
Math.abs(det) < EPS => 不可逆
```

---

## 五、关键文件说明

| 文件 | 职责 |
|------|------|
| `src/App.tsx` | 主应用，管理所有状态 |
| `src/components/CanvasView.tsx` | Canvas 绘图，动画循环 |
| `src/scene/Scene.ts` | 场景管理，统一渲染 |
| `src/math/Mat2.ts` | 矩阵类，inverse(), multiplyMat() |
| `src/utils/basis.ts` | 基与坐标计算 |
| `src/components/ResultPanel.tsx` | 结果显示 |

---

## 六、当前未完成内容

### Stage 4.7.2 尚未实现

**目标**：P、A、P^{-1} 三段 Canvas 动画演示

**路径**：
```text
step 0: 显示 [v]_B
step 1: P [v]_B = v_E
step 2: A v_E
step 3: P^{-1} A v_E = [Av]_B
step 4: 对比 A_B [v]_B
```

### 其他未实现

- Stage 4.8：特征值/特征向量
- Stage 4.9：控制面板折叠分区整理与 UI 清理
- Stage 5.0：视觉风格统一，向 3Blue1Brown 风格靠近

---

## 七、下一步建议

1. **Stage 4.7.2**：P、A、P^{-1} 三段 Canvas 动画演示
2. **Stage 4.8**：特征值/特征向量
3. **Stage 4.9**：控制面板折叠分区整理与 UI 清理
4. **Stage 5.0**：视觉风格统一

---

## 八、已知风险

1. **输入框中间态**：已修复，但需持续关注
2. **标签防重叠**：简单实现，复杂场景可能仍有重叠
3. **新基网格范围**：使用 P^{-1} 反推，极端情况可能有边界问题

---

## 九、如何运行和测试

### 安装

```bash
cd linear-algebra-app
npm install
```

### 开发模式

```bash
npm run dev
# 访问 http://localhost:5173/
```

### 构建检查

```bash
npm run build
npx tsc --noEmit
```

### 测试用例

1. 标准基：P=I, v=(2,1) → [v]_B=(2,1)
2. 斜基：P=[1,1;0,1], v=(2,1) → [v]_B=(1,1)
3. 旋转矩阵：A=[0,-1;1,0] → e1→(0,1), e2→(-1,0)
4. 非交换性：M1=[1,1;0,1], M2=[0,-1;1,0] → M2*M1 ≠ M1*M2
5. 逆变换：可逆矩阵 C → 动画回到 I

---

*文档更新时间：2026-06-05*
*当前阶段：Stage 4.7.1*
*下一步：Stage 4.7.2 Canvas 三段动画演示*
