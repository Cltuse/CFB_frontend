<template>
  <div class="rule-config-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Rule Config</span>
        <h1>预约规则配置</h1>
        <p>管理不同设施类别的预约规则，包括预约时长、提前天数、审批要求与开放时段。</p>
        
      </div>
      <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="handleCreate">新建规则</el-button>
          <el-button class="secondary-btn" @click="loadRuleConfigs">刷新列表</el-button>
        </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">规则总数</span>
        <strong>{{ ruleStats.total }}</strong>
        <p>当前已配置的规则条目总量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">需要审批</span>
        <strong>{{ ruleStats.needApproval }}</strong>
        <p>启用了预约审核流程的规则数量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">全局默认</span>
        <strong>{{ ruleStats.globalDefault }}</strong>
        <p>未绑定具体类别的基础规则</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前结果</span>
        <strong>{{ ruleStats.filtered }}</strong>
        <p>与搜索关键字保持同步</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>搜索与维护</h2>
        <p>可按设施类别快速检索规则，并进入编辑或历史版本查看。</p>
      </div>

      <div class="control-actions search-toolbar">
        <div class="search-fields">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索规则类别"
            class="search-input"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleClearSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="search-buttons">
          <el-button type="primary" class="primary-btn small-btn" @click="handleSearch">搜索</el-button>
          <el-button class="secondary-btn small-btn" @click="handleClearSearch">重置</el-button>
        </div>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>规则配置列表</h2>
          <p>所有已配置的预约规则，包括预约时长、提前预订范围、每日限制与审批设置等核心参数。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ filteredRuleConfigs.length }} 条</span>
          <span class="meta-chip muted-chip">全局默认 {{ ruleStats.globalDefault }} 条</span>
        </div>
      </div>

      <el-table :data="filteredRuleConfigs" class="rule-table" v-loading="loading">
        <el-table-column prop="categoryName" label="规则类别" min-width="140">
          <template #default="{ row }">
            <el-tag :type="row.categoryId ? 'primary' : 'success'" effect="light" round>
              {{ row.categoryName || '全局默认' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="minDurationMinutes" label="最小时长" width="110" align="center">
          <template #default="{ row }">{{ row.minDurationMinutes }} 分钟</template>
        </el-table-column>

        <el-table-column prop="maxDurationMinutes" label="最大时长" width="110" align="center">
          <template #default="{ row }">{{ row.maxDurationMinutes }} 分钟</template>
        </el-table-column>

        <el-table-column prop="advanceDaysMax" label="提前天数" width="100" align="center">
          <template #default="{ row }">{{ row.advanceDaysMax }} 天</template>
        </el-table-column>

        <el-table-column prop="maxBookingsPerDay" label="每日预约" width="100" align="center">
          <template #default="{ row }">{{ row.maxBookingsPerDay }} 次</template>
        </el-table-column>

        <el-table-column prop="maxActiveBookings" label="生效预约" width="100" align="center">
          <template #default="{ row }">{{ row.maxActiveBookings }} 个</template>
        </el-table-column>

        <el-table-column prop="needApproval" label="需要审批" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.needApproval ? 'warning' : 'info'" effect="light" round>
              {{ row.needApproval ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="openTime" label="开放时段" width="180" align="center">
          <template #default="{ row }">{{ row.openTime }} - {{ row.closeTime }}</template>
        </el-table-column>

        <el-table-column prop="updatedAt" label="更新时间" width="180" align="center">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button class="rule-action-btn edit-action-btn" @click="handleEdit(row)" :icon="Edit">
                编辑
              </el-button>
              <el-button class="rule-action-btn history-action-btn" @click="handleHistory(row)" :icon="Clock">
                历史版本
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !filteredRuleConfigs.length" description="当前没有符合条件的规则配置" />
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1100px"
      :close-on-click-modal="false"
      class="rule-dialog"
    >
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="140px">
        <el-form-item label="规则类别" prop="categoryId">
          <el-select v-model="ruleForm.categoryId" placeholder="选择设施类别" clearable style="width: 100%">
            <el-option label="全局默认规则" :value="null" />
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.categoryName"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="最小预约时长" prop="minDurationMinutes">
              <el-input-number v-model="ruleForm.minDurationMinutes" :min="15" :max="1440" :step="15" style="width: 100%" />
              <div class="form-tip">分钟</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大预约时长" prop="maxDurationMinutes">
              <el-input-number v-model="ruleForm.maxDurationMinutes" :min="30" :max="1440" :step="30" style="width: 100%" />
              <div class="form-tip">分钟</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时间粒度" prop="timeSlotMinutes">
              <el-input-number v-model="ruleForm.timeSlotMinutes" :min="15" :max="240" :step="15" style="width: 100%" />
              <div class="form-tip">分钟</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="提前天数" prop="advanceDaysMax">
              <el-input-number v-model="ruleForm.advanceDaysMax" :min="1" :max="365" style="width: 100%" />
              <div class="form-tip">用户最多可提前多少天预约</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预约截止时间" prop="advanceCutoffMinutes">
              <el-input-number v-model="ruleForm.advanceCutoffMinutes" :min="5" :max="1440" :step="5" style="width: 100%" />
              <div class="form-tip">开始前多少分钟停止预约</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="取消截止时间" prop="cancelDeadlineMinutes">
              <el-input-number v-model="ruleForm.cancelDeadlineMinutes" :min="5" :max="1440" :step="5" style="width: 100%" />
              <div class="form-tip">开始前多少分钟允许取消</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="每日预约次数" prop="maxBookingsPerDay">
              <el-input-number v-model="ruleForm.maxBookingsPerDay" :min="1" :max="20" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生效预约数量" prop="maxActiveBookings">
              <el-input-number v-model="ruleForm.maxActiveBookings" :min="1" :max="50" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开放时间" prop="openTime">
              <el-time-picker v-model="ruleForm.openTime" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="关闭时间" prop="closeTime">
              <el-time-picker v-model="ruleForm.closeTime" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当天预约" prop="allowSameDayBooking">
              <el-switch v-model="ruleForm.allowSameDayBooking" />
              <div class="form-tip">是否允许预约当天的设施</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="需要审批" prop="needApproval">
              <el-switch v-model="ruleForm.needApproval" />
              <div class="form-tip">预约是否需要管理员审核</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="handleSubmit" :loading="submitLoading">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="historyDialogVisible" title="规则历史版本" width="800px" class="history-dialog">
      <el-timeline>
        <el-timeline-item
          v-for="rule in ruleHistory"
          :key="rule.id"
          :timestamp="formatDateTime(rule.createdAt)"
          placement="top"
        >
          <el-card>
            <h4>{{ rule.categoryName || '全局默认' }} 规则版本</h4>
            <el-descriptions :column="3" size="small">
              <el-descriptions-item label="最小时长">{{ rule.minDurationMinutes }} 分钟</el-descriptions-item>
              <el-descriptions-item label="最大时长">{{ rule.maxDurationMinutes }} 分钟</el-descriptions-item>
              <el-descriptions-item label="提前天数">{{ rule.advanceDaysMax }} 天</el-descriptions-item>
              <el-descriptions-item label="每日预约">{{ rule.maxBookingsPerDay }} 次</el-descriptions-item>
              <el-descriptions-item label="生效预约">{{ rule.maxActiveBookings }} 个</el-descriptions-item>
              <el-descriptions-item label="需要审批">
                <el-tag :type="rule.needApproval ? 'warning' : 'info'" size="small">
                  {{ rule.needApproval ? '是' : '否' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开放时段">{{ rule.openTime }} - {{ rule.closeTime }}</el-descriptions-item>
              <el-descriptions-item label="当天预约">
                <el-tag :type="rule.allowSameDayBooking ? 'success' : 'info'" size="small">
                  {{ rule.allowSameDayBooking ? '允许' : '不允许' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock, Edit, Search } from '@element-plus/icons-vue';
import { adminAPI, facilityCategoryAPI } from '../../api';
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme';

const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

const loading = ref(false);
const submitLoading = ref(false);
const ruleConfigs = ref([]);
const filteredRuleConfigs = ref([]);
const categories = ref([]);
const ruleHistory = ref([]);
const searchKeyword = ref('');

const dialogVisible = ref(false);
const historyDialogVisible = ref(false);
const dialogTitle = ref('');
const ruleFormRef = ref(null);

const ruleForm = ref({
  categoryId: null,
  minDurationMinutes: 30,
  maxDurationMinutes: 120,
  advanceDaysMax: 7,
  advanceCutoffMinutes: 60,
  allowSameDayBooking: true,
  maxBookingsPerDay: 2,
  maxActiveBookings: 3,
  cancelDeadlineMinutes: 30,
  needApproval: false,
  openTime: '08:00:00',
  closeTime: '22:00:00',
  timeSlotMinutes: 30
});

const rules = {
  categoryId: [{ required: false, message: '请选择设施类别', trigger: 'change' }],
  minDurationMinutes: [{ required: true, message: '请输入最小预约时长', trigger: 'blur' }],
  maxDurationMinutes: [{ required: true, message: '请输入最大预约时长', trigger: 'blur' }],
  advanceDaysMax: [{ required: true, message: '请输入提前天数', trigger: 'blur' }],
  openTime: [{ required: true, message: '请选择开放时间', trigger: 'change' }],
  closeTime: [{ required: true, message: '请选择关闭时间', trigger: 'change' }]
};

const ruleStats = computed(() => ({
  total: ruleConfigs.value.length,
  needApproval: ruleConfigs.value.filter((item) => item.needApproval).length,
  globalDefault: ruleConfigs.value.filter((item) => !item.categoryId).length,
  filtered: filteredRuleConfigs.value.length
}));

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  return new Date(dateTime).toLocaleString('zh-CN');
};

const loadRuleConfigs = async () => {
  loading.value = true;
  try {
    const response = await adminAPI.getRuleConfigs();
    ruleConfigs.value = response.data || [];
    filterRuleConfigs();
  } catch (error) {
    ElMessage.error('加载规则配置失败');
  } finally {
    loading.value = false;
  }
};

const filterRuleConfigs = () => {
  if (!searchKeyword.value.trim()) {
    filteredRuleConfigs.value = ruleConfigs.value;
    return;
  }

  const keyword = searchKeyword.value.toLowerCase();
  filteredRuleConfigs.value = ruleConfigs.value.filter((config) => {
    const categoryName = config.categoryName || '全局默认';
    return categoryName.toLowerCase().includes(keyword);
  });
};

const handleSearch = () => {
  filterRuleConfigs();
};

const handleClearSearch = () => {
  searchKeyword.value = '';
  filterRuleConfigs();
};

const loadCategories = async () => {
  try {
    const response = await facilityCategoryAPI.list();
    categories.value = response.data || [];
  } catch (error) {
    ElMessage.error('加载设施类别失败');
  }
};

const resetRuleForm = () => {
  ruleForm.value = {
    categoryId: null,
    minDurationMinutes: 30,
    maxDurationMinutes: 120,
    advanceDaysMax: 7,
    advanceCutoffMinutes: 60,
    allowSameDayBooking: true,
    maxBookingsPerDay: 2,
    maxActiveBookings: 3,
    cancelDeadlineMinutes: 30,
    needApproval: false,
    openTime: '08:00:00',
    closeTime: '22:00:00',
    timeSlotMinutes: 30
  };
};

const handleCreate = () => {
  dialogTitle.value = '新建规则配置';
  resetRuleForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑规则配置';
  ruleForm.value = { ...row };
  dialogVisible.value = true;
};

const handleHistory = async (row) => {
  try {
    const response = await adminAPI.getRuleConfigHistory(row.categoryId);
    ruleHistory.value = response.data || [];
    historyDialogVisible.value = true;
  } catch (error) {
    ElMessage.error('加载历史版本失败');
  }
};

const handleSubmit = async () => {
  try {
    await ruleFormRef.value.validate();
    submitLoading.value = true;

    await adminAPI.createRuleConfig(ruleForm.value);
    ElMessage.success('规则配置保存成功');
    dialogVisible.value = false;
    loadRuleConfigs();
  } catch (error) {
    if (error !== false) {
      ElMessage.error('规则配置保存失败');
    }
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => {
  loadRuleConfigs();
  loadCategories();
});
</script>

<style scoped>
.rule-config-page {
  --theme-main: var(--feature-primary);
  --theme-deep: var(--feature-strong);
  --theme-soft: var(--feature-soft);
  --theme-border: var(--feature-border);
  --theme-shadow: var(--feature-glow);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(226, 236, 249, 0.72), transparent 26%),
    radial-gradient(circle at right center, rgba(240, 249, 252, 0.92), transparent 24%),
    linear-gradient(180deg, #f9fbff 0%, #f5f8fd 48%, #f3f7fc 100%);
}

.page-hero,
.summary-card,
.control-card,
.panel-card {
  animation: rule-rise 0.55s ease both;
}

.page-hero,
.control-card,
.panel-card,
.hero-note {
  border-radius: 28px;
  border: 1px solid var(--theme-border);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 320px;
  gap: 20px;
  padding: 30px;
  background:
    radial-gradient(circle at top right, var(--theme-soft), transparent 30%),
    linear-gradient(145deg, rgba(240, 249, 252, 0.98) 0%, #ffffff 62%);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(200, 216, 240, 0.24);
  color: #4b6f99;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2 {
  margin: 14px 0 10px;
  color: #17314d;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p {
  margin: 0;
  color: #67778f;
  line-height: 1.8;
}

.hero-actions,
.control-actions,
.panel-meta,
.row-actions,
.dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-actions {
  margin-top: 24px;
}

.primary-btn,
.secondary-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, var(--feature-primary) 0%, var(--feature-strong) 100%);
  box-shadow: 0 14px 28px rgba(63, 134, 146, 0.22);
}

.secondary-btn {
  border: 1px solid var(--feature-border);
  background: rgba(255, 255, 255, 0.9);
  color: #5b7a96;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-note {
  min-height: 132px;
  padding: 22px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.hero-note span,
.hero-note small,
.summary-label,
.summary-card p {
  color: #72839b;
}

.hero-note strong,
.summary-card strong {
  color: #17314d;
}

.hero-note strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--theme-border);
  background: linear-gradient(150deg, rgba(240, 249, 252, 0.96) 0%, #ffffff 84%);
  box-shadow: 0 18px 40px rgba(30, 41, 59, 0.06);
}

.summary-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
}

.control-card,
.panel-card {
  padding: 24px;
}

.control-actions {
  justify-content: flex-end;
  margin-top: 18px;
}

.search-input {
  width: 420px;
}

.search-input :deep(.el-input__wrapper) {
  min-height: 46px;
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid var(--feature-border);
  background: #f9fbff;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.meta-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(200, 216, 240, 0.24);
  color: #5579a4;
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(244, 249, 252, 0.96);
  color: #72839b;
}

.rule-table :deep(.el-table) {
  --el-table-border-color: rgba(132, 165, 205, 0.12);
  --el-table-row-hover-bg-color: rgba(243, 250, 252, 0.95);
  border-radius: 20px;
}

.rule-table :deep(.el-table::before),
.rule-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.rule-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f6fbfe 0%, #eef5fc 100%) !important;
  color: #225368;
}

.rule-action-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
}

.edit-action-btn {
  color: #5579a4;
  border-color: rgba(132, 165, 205, 0.24);
  background: rgba(243, 250, 252, 0.96);
}

.history-action-btn {
  color: #6f7d94;
  border-color: rgba(189, 198, 214, 0.24);
  background: rgba(247, 249, 252, 0.96);
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #72839b;
  line-height: 1.4;
}

.rule-dialog :deep(.el-dialog),
.history-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.rule-dialog :deep(.el-input__wrapper),
.rule-dialog :deep(.el-select__wrapper),
.rule-dialog :deep(.el-time-editor.el-input__wrapper),
.rule-dialog :deep(.el-input-number .el-input__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid var(--feature-border);
  background: #f9fbff;
}

.dialog-footer {
  justify-content: flex-end;
}

@keyframes rule-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1180px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .page-hero,
  .control-card,
  .panel-card {
    padding: 18px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .panel-head,
  .row-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }
}
</style>
