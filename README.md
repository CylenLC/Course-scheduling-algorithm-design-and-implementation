# 📅 高校课程排课数学优化与可视化系统

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-green.svg)
![OR-Tools](https://img.shields.io/badge/Google-OR--Tools-orange.svg)

本项目是一个基于 **Google OR-Tools CP-SAT** 引擎的高校课程自动排课系统。它通过将复杂的教务规则建模为约束满足问题（Constraint Satisfaction Problem, CSP），实现了时空资源的自动化最优分配，并配以现代化的前端界面进行配置与结果可视化。

## 🌟 核心特性

### 🧠 数学模型后端 (`main.py`)
- **多维决策网格**：基于布尔张量决策变量构建排课矩阵。
- **严苛硬约束 (Hard Constraints)**：
  - **时空防冲突**：同一教室、同一时间段仅能容纳一门课程。
  - **师资唯一性**：同一教师在同一时刻不能出现在两个教室。
  - **群体同步性**：同一班级/培养方案下的课程自动避开时段重叠。
  - **容量匹配**：根据选课人数自动筛选具备足够承载能力的教室。
  - **人工阻断**：支持指定教师在特定时段的“不可用”强制约束。
- **软约束目标优化 (Soft Constraints)**：
  - **人性化偏好**：支持教师对特定时段（如早课或下午课）的偏好权重注入，系统自动寻找全局积分极大值的最优解。
- **对比实验引擎**：内置 Baseline、高强度约束、偏好牵引等多种实验场景的自动化编排。

### 🎨 现代化前端 (`frontend/`)
- **交互式参数配置**：动态调整课程数、教师数、教室容量等物理边界。
- **多维度视图转换**：
  - **全局视图**：全校课表一览。
  - **教师/学生视图**：个性化日程查询。
  - **教室视图**：房间利用率分析。
- **进度与状态可视化**：实时反馈求解引擎状态（OPTIMAL/FEASIBLE/INFEASIBLE）。
- **响应式设计**：适配不同屏幕尺寸的网格布局。

## 🛠️ 技术栈

- **后端**: Python 3.12, [Google OR-Tools](https://developers.google.com/optimization), Pandas
- **前端**: Vanilla JavaScript (ES6+), CSS3 (Modern Flex/Grid), HTML5
- **构建/运行工具**: `uv` (Python 包管理), `vite` (前端开发服务器)

## 🚀 快速开始

### 1. 后端数学模型运行
确保已安装 Python 环境，推荐使用 `uv` 进行依赖管理：

```bash
# 安装依赖
pip install ortools pandas

# 启动求解引擎
python main.py
```

### 2. 前端可视化界面启动
您可以直接进入 `frontend` 目录并使用任何静态 Web 服务器启动，或使用 Vite：

```bash
cd frontend
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173` 即可进入控制面板。

## 📊 约束说明文档

| 约束类型 | 描述 | 实现方式 |
| :--- | :--- | :--- |
| **Completeness** | 每门课程必须排满其要求的学时数 | `sum(x) == required_slots` |
| **Room Conflict** | 同一教室同一时段排课数 $\le 1$ | `sum(x) <= 1` |
| **Teacher Conflict**| 同一教师同一时段排课数 $\le 1$ | `sum(x) <= 1` |
| **Curriculum** | 同一培养方案内的课程不能冲突 | Student Group Constraint |
| **Capacity** | 教室容量必须 $\ge$ 选课人数 | Variable Masking |
| **Preferences** | 根据教师偏好权重最大化全局分值 | `Maximize(Objective)` |

## 📝 许可证

MIT License. 仅供学术交流与作业演示使用。
