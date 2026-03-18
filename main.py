"""
基于 Google OR-Tools CP-SAT 的高校课程排课数学优化器
核心功能：
1. 构建高维布尔张量决策网络
2. 注入多级时空防冲突与容量守恒硬约束 (Hard Constraints)
3. 建立基于教师权重偏好的软约束目标函数寻优机制 (Soft Constraints)
4. 支持动态场景对比与边界条件扰动实验
"""
import pandas as pd
from ortools.sat.python import cp_model

class EnhancedCourseTimetablingSolver:
    def __init__(self, days_count, periods_count, rooms_count):
        """初始化系统物理宇宙的维度边界"""
        self.days = days_count
        self.periods = periods_count
        self.num_rooms = rooms_count
        
        # 实例化 CP-SAT 底层数学模型与业务数据存储结构
        self.model = cp_model.CpModel()
        self.courses = []
        self.teachers = []
        self.rooms = {}             # {room_id: capacity}
        self.course_teacher_map = {}
        self.course_requirements = {}
        self.course_enrollments = {} # {course_id: enrollment}
        self.curricula = {}          # {curriculum_id: [course_ids]}
        
        self.preferences = {}       # 软约束：偏好权重字典 {(teacher, day, period): weight}
        self.unavailabilities = []  # 硬约束：阻断坐标列表 [(teacher, day, period)]
        
        # 多维布尔决策变量张量池：x[(course, room, day, period)]
        self.x = {}
        
    def register_room(self, room_id, capacity):
        """注册教室及其承载容量"""
        self.rooms[room_id] = capacity

    def register_course(self, course_id, teacher_id, required_slots, enrollment=0):
        """向教务系统注册课程任务、教职工绑定关系、需求容量及选课人数"""
        self.courses.append(course_id)
        if teacher_id not in self.teachers:
            self.teachers.append(teacher_id)
        self.course_teacher_map[course_id] = teacher_id
        self.course_requirements[course_id] = required_slots
        self.course_enrollments[course_id] = enrollment

    def register_curriculum(self, curriculum_id, course_list):
        """注册课程集合（学生族群），确保其内部课程在时空上不冲突"""
        self.curricula[curriculum_id] = course_list
        
    def inject_preference_weight(self, teacher_id, day, period, weight):
        """为特定教师的特定时空坐标注入偏好权重标量"""
        self.preferences[(teacher_id, day, period)] = weight
        
    def enforce_unavailability(self, teacher_id, day, period):
        """施加不可抗力硬阻断：该教师在此坐标被剥夺排课资格"""
        self.unavailabilities.append((teacher_id, day, period))
        
    def compile_mathematical_model(self):
        """编译底层数学模型：将业务规则转译为 CP-SAT 识别的合取范式系统"""
        room_ids = list(self.rooms.keys())
        num_rooms = len(room_ids)

        # 第一步：铺设全量决策变量张量网格
        for c in self.courses:
            for r_idx in range(num_rooms):
                for d in range(self.days):
                    for p in range(self.periods):
                        var_identifier = f'x_c{c}_r{r_idx}_d{d}_p{p}'
                        self.x[(c, r_idx, d, p)] = self.model.NewBoolVar(var_identifier)
                        
        # 第二步：强加需求守恒硬约束 (Completeness Constraint)
        # 每门课所有被激活的时间槽加总，必须完美拟合其法定需求量 
        room_ids = list(self.rooms.keys())
        num_rooms = len(room_ids)

        for c in self.courses:
            self.model.Add(
                sum(self.x[(c, r_idx, d, p)] 
                    for r_idx in range(num_rooms) 
                    for d in range(self.days) 
                    for p in range(self.periods)) == self.course_requirements[c]
            )
            
        # 第三步：强加物理空间防重叠硬约束 (Room Overlap Preventer)
        # 同一房间、同一日期的同一刻度，进驻的课程数不得突破空间承载上限(1) 
        for r_idx in range(num_rooms):
            for d in range(self.days):
                for p in range(self.periods):
                    self.model.Add(
                        sum(self.x[(c, r_idx, d, p)] for c in self.courses) <= 1
                    )
                    
        # 第四步：强加师资力量防分身硬约束 (Teacher Overlap Preventer)
        # 纵使跨越不同教室，同一名人类教师在同一时刻亦仅能授课一次 [19]
        for t in self.teachers:
            t_courses = [c for c in self.courses if self.course_teacher_map[c] == t]
            for d in range(self.days):
                for p in range(self.periods):
                    self.model.Add(
                        sum(self.x[(c, r_idx, d, p)] 
                            for c in t_courses 
                            for r_idx in range(num_rooms)) <= 1
                    )

        # 第五步：强加学生族群（Curriculum）防冲突硬约束
        # 同一培养方案下的课程，在同一时段不得重叠，防止学生“分身乏术”
        for curr_id, curr_courses in self.curricula.items():
            for d in range(self.days):
                for p in range(self.periods):
                    self.model.Add(
                        sum(self.x[(c, r_idx, d, p)] 
                            for c in curr_courses 
                            for r_idx in range(num_rooms)) <= 1
                    )

        # 第六步：强加物理空间承载力硬约束 (Capacity Constraint)
        # 如果教室容量小于课程预计选课人数，则该变量强制归零
        for c in self.courses:
            enrollment = self.course_enrollments.get(c, 0)
            for r_idx, r_id in enumerate(room_ids):
                capacity = self.rooms[r_id]
                if capacity < enrollment:
                    for d in range(self.days):
                        for p in range(self.periods):
                            self.model.Add(self.x[(c, r_idx, d, p)] == 0)
                    
        # 第五步：强加特定时空剥夺硬约束 (Forced Unavailability)
        # 针对系统登记的阻断坐标，直接抹杀对应布尔变量的激活可能 
        for (t, d, p) in self.unavailabilities:
            t_courses = [c for c in self.courses if self.course_teacher_map[c] == t]
            for c in t_courses:
                for r_idx in range(num_rooms):
                    self.model.Add(self.x[(c, r_idx, d, p)] == 0)

        # 第六步：凝聚全局目标函数 (Global Objective Function)
        # 遍历张量空间，依据预设权重对被激活节点进行积分最大化 
        objective_gradient_terms = []
        for c in self.courses:
            t = self.course_teacher_map[c]
            for r_idx in range(num_rooms):
                for d in range(self.days):
                    for p in range(self.periods):
                        weight = self.preferences.get((t, d, p), 10)
                        objective_gradient_terms.append(self.x[(c, r_idx, d, p)] * weight)
                        
        self.model.Maximize(sum(objective_gradient_terms))

    def execute_solving_engine(self):
        """点火 CP-SAT 寻优引擎，并对结果张量进行逆向工程解码展示"""
        solver = cp_model.CpSolver()
        # 对于复杂系统，可显式引入寻优时间限制等安全阈值参数 [4]
        # solver.parameters.max_time_in_seconds = 30.0 
        status_code = solver.Solve(self.model)
        
        if status_code in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            print(f"[*] 引擎返回终端状态标识: {solver.StatusName(status_code)}")
            print(f"[*] 全局偏好总积分极大值: {solver.ObjectiveValue()}")
            
            room_ids = list(self.rooms.keys())
            decoded_schedule = []
            for d in range(self.days):
                for p in range(self.periods):
                    for r_idx, r_id in enumerate(room_ids):
                        for c in self.courses:
                            if solver.Value(self.x[(c, r_idx, d, p)]) == 1:
                                t = self.course_teacher_map[c]
                                decoded_schedule.append({
                                    'Day': f'Day_{d+1}',
                                    'Period': f'P_{p+1}',
                                    'Room': r_id,
                                    'Course': c,
                                    'Teacher': t
                                })
            return pd.DataFrame(decoded_schedule)
        else:
            print("[!] 求解引擎宣告失败：系统模型遭受致命级硬冲突，无任何可行解 (INFEASIBLE)。")
            return None

# ==========================================
# 实验编排与任务分发微服务模块
# ==========================================
def orchestrate_experiment(scenario_label, unavailability_list=[], priority_list=[]):
    print(f"\n{'='*50}")
    print(f"启动独立对照容器：{scenario_label}")
    print(f"{'='*50}")
    
    # 按照标准学制维度初始化排课器
    engine = EnhancedCourseTimetablingSolver(days_count=5, periods_count=4, rooms_count=2)
    engine.register_room("Room_A", 40)
    engine.register_room("Room_B", 60)
    
    # 挂载预配置的各类基础教务负荷
    engine.register_course("Advanced_Math", "T1", 4, enrollment=35)
    engine.register_course("Linear_Algebra", "T1", 2, enrollment=30)
    engine.register_course("Quantum_Phys", "T2", 5, enrollment=45)
    engine.register_course("Organic_Chem", "T3", 3, enrollment=55)
    engine.register_course("Inorganic_Chem", "T3", 4, enrollment=25)
    
    # 注入培养方案限制：高数与线代属于同一种培养方案，不能重叠
    engine.register_curriculum("STEM_Freshman", ["Advanced_Math", "Linear_Algebra"])
    
    # 散布基础人性化偏好基调
    for day in range(5):
        engine.inject_preference_weight("T1", day, 0, 20) # T1 教授偏向极早时段
        engine.inject_preference_weight("T2", day, 2, 15) # T2 教授偏向午后时段
        engine.inject_preference_weight("T2", day, 3, 15)
        
    # 依照参数指令实施特定干扰注入
    for block in unavailability_list:
        engine.enforce_unavailability(*block)
    for boost in priority_list:
        engine.inject_preference_weight(*boost)
        
    # 激活并收集数据
    engine.compile_mathematical_model()
    outcome_df = engine.execute_solving_engine()
    
    if outcome_df is not None:
        print(outcome_df.sort_values(by=['Day', 'Period', 'Room']).head(8).to_string(index=False))

# --- 触发全矩阵自动化实验序列 ---

# [对比组一] Baseline 场景：真空无干预态运行
orchestrate_experiment("Baseline (全局基准稳态)")

# [对比组二] Experiment A：激进削减资源可行域
exp_a_blocks = []
for p in range(4):
    exp_a_blocks.append(("T1", 4, p)) # 抹除周五全天权限
    exp_a_blocks.append(("T2", 4, p)) 
for p in [2, 3]:
    exp_a_blocks.append(("T1", 2, p)) # 连带抹除周三下午权限
orchestrate_experiment("Experiment A (引入高强度不可用硬约束)", unavailability_list=exp_a_blocks)

# [对比组三] Experiment B：人为制造极值偏好黑洞效应
exp_b_boosts = []
for p in range(4):
    # 将 T3 针对周四全天偏好施加千分之倍数的诱导乘数
    exp_b_boosts.append(("T3", 3, p, 100)) 
orchestrate_experiment("Experiment B (引入异常极值偏好软约束牵引)", priority_list=exp_b_boosts)