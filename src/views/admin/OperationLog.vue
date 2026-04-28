<template>
  <div class="admin-log-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Operation Log</span>
        <h1>操作日志</h1>
        <p>展示系统内所有操作记录，包括操作人、操作时间、操作类型、操作对象等信息。</p>
        
      </div>
      <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="loadOperationLogs">刷新日志</el-button>
          <el-button class="secondary-btn" @click="resetSearch">清空筛选</el-button>
        </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">当前页记录</span>
        <strong>{{ logData.length }}</strong>
        <p>本页已经加载到表格中的日志数量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已启用筛选</span>
        <strong>{{ activeFilterCount }}</strong>
        <p>当前筛选面板中生效的条件组合数量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前页高风险操作</span>
        <strong>{{ riskCount }}</strong>
        <p>包含删除、拒绝、拉黑等关键操作的日志数</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">操作类型数</span>
        <strong>{{ currentTypeCount }}</strong>
        <p>本页已出现的不同操作类型数量</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>多条件筛选</h2>
        <p>根据操作人、操作类型、时间范围等条件筛选操作记录，快速定位到相关记录。</p>
      </div>

      <el-form :model="searchForm" class="search-form" label-position="top">
        <div class="form-grid">
          <el-form-item label="操作人">
            <el-select
              v-model="searchForm.operatorId"
              placeholder="选择操作人"
              clearable
              filterable
              remote
              :remote-method="searchOperators"
              :loading="operatorLoading"
            >
              <el-option
                v-for="operator in operatorOptions"
                :key="operator.id"
                :label="`${operator.realName} (${operator.username})`"
                :value="operator.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="操作类型">
            <el-select v-model="searchForm.operationType" placeholder="选择操作类型" clearable>
              <el-option
                v-for="type in operationTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="开始时间">
            <el-date-picker
              v-model="searchForm.startTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="结束时间">
            <el-date-picker
              v-model="searchForm.endTime"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <div class="control-actions">
          <el-button type="primary" class="primary-btn small-btn" @click="handleSearch">搜索</el-button>
          <el-button class="secondary-btn small-btn" @click="resetSearch">重置</el-button>
        </div>
      </el-form>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>日志列表</h2>
          <p>列表中强化了操作类型、目标对象、时间和详情展示，适合在审计时快速筛查问题来源。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ pagination.total }} 条</span>
          <span class="meta-chip muted-chip">当前页 {{ logData.length }} 条</span>
        </div>
      </div>

      <el-table :data="logData" class="log-table" v-loading="loading" @row-click="handleView">
        <el-table-column prop="operatorName" label="操作人" min-width="120">
          <template #default="{ row }">
            <span>{{ row.operatorName || '系统' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="operationType" label="操作类型" min-width="220" align="center">
          <template #default="{ row }">
            <el-tag :type="getOperationTypeType(row.operationType)" effect="light" round>
              {{ getOperationTypeText(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="targetId" label="目标 ID" width="110" align="center">
          <template #default="{ row }">
            <span>{{ row.targetId || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="detail" label="操作详情" min-width="240" show-overflow-tooltip />

        <el-table-column prop="ipAddress" label="IP 地址" width="150" align="center">
          <template #default="{ row }">
            <span>{{ row.ipAddress || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="操作时间" min-width="180" align="center">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button class="action-btn view-btn" @click.stop="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !logData.length" description="当前没有符合条件的操作日志" />

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="detailDialogVisible"
      width="760px"
      class="detail-dialog"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-badge">
            <el-icon><Document /></el-icon>
          </div>
          <div>
            <h3>日志详情</h3>
            <p>{{ currentDetail?.operatorName || '系统操作' }}</p>
          </div>
        </div>
      </template>

      <div v-if="currentDetail" class="detail-layout">
        <section class="detail-summary-grid">
          <article class="detail-summary-card">
            <span>操作人</span>
            <strong>{{ currentDetail.operatorName || '系统' }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>操作类型</span>
            <strong>{{ getOperationTypeText(currentDetail.operationType) }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>目标 ID</span>
            <strong>{{ currentDetail.targetId || '-' }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>操作时间</span>
            <strong>{{ formatDateTime(currentDetail.createdAt) }}</strong>
          </article>
        </section>

        <section class="detail-panel">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="操作人">{{ currentDetail.operatorName || '系统' }}</el-descriptions-item>
            <el-descriptions-item label="操作类型">
              <el-tag :type="getOperationTypeType(currentDetail.operationType)" effect="light" round>
                {{ getOperationTypeText(currentDetail.operationType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="目标 ID">{{ currentDetail.targetId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="IP 地址">{{ currentDetail.ipAddress || '-' }}</el-descriptions-item>
            <el-descriptions-item label="操作时间" :span="2">{{ formatDateTime(currentDetail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="详情说明" :span="2">{{ currentDetail.detail || '-' }}</el-descriptions-item>
          </el-descriptions>
        </section>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import { adminAPI, userAPI } from '../../api';
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme';

const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

const loading = ref(false);
const operatorLoading = ref(false);
const detailDialogVisible = ref(false);
const logData = ref([]);
const operatorOptions = ref([]);
const operationTypes = ref([]);
const currentDetail = ref(null);

const searchForm = reactive({
  operatorId: '',
  operationType: '',
  startTime: '',
  endTime: ''
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const operatorCount = computed(() => new Set(logData.value.map((item) => item.operatorName || item.operatorId || 'system')).size);
const activeFilterCount = computed(() => [searchForm.operatorId, searchForm.operationType, searchForm.startTime, searchForm.endTime].filter(Boolean).length);
const riskCount = computed(() =>
  logData.value.filter((item) =>
    ['REJECT', 'DELETE', 'BLACKLIST', 'REMOVE_BLACKLIST', 'ADD_BLACKLIST', 'REVOKE'].some((keyword) =>
      String(item.operationType || '').includes(keyword)
    )
  ).length
);
const currentTypeCount = computed(() => new Set(logData.value.map((item) => item.operationType)).size);

onMounted(() => {
  loadOperationTypes();
  loadOperationLogs();
});

async function loadOperationTypes() {
  try {
    const response = await adminAPI.getOperationTypes();
    const types = response.data || [];
    operationTypes.value = types.map((type) => ({
      value: type,
      label: getOperationTypeText(type)
    }));
  } catch (error) {
    console.error('加载操作类型失败:', error);
  }
}

async function loadOperationLogs() {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage - 1,
      size: pagination.pageSize
    };

    if (searchForm.operatorId) {
      params.operatorId = searchForm.operatorId;
    }
    if (searchForm.operationType) {
      params.operationType = searchForm.operationType;
    }
    if (searchForm.startTime) {
      params.startTime = searchForm.startTime;
    }
    if (searchForm.endTime) {
      params.endTime = searchForm.endTime;
    }

    const response = await adminAPI.getOperationLogs(params);
    const data = response.data || {};
    logData.value = data.content || [];
    pagination.total = data.totalElements || 0;
  } catch (error) {
    console.error('加载操作日志失败:', error);
    ElMessage.error('加载操作日志失败');
    logData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.currentPage = 1;
  loadOperationLogs();
}

function resetSearch() {
  searchForm.operatorId = '';
  searchForm.operationType = '';
  searchForm.startTime = '';
  searchForm.endTime = '';
  operatorOptions.value = [];
  pagination.currentPage = 1;
  loadOperationLogs();
}

function handleSizeChange(size) {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadOperationLogs();
}

function handleCurrentChange(page) {
  pagination.currentPage = page;
  loadOperationLogs();
}

async function searchOperators(query) {
  if (!query || query.length < 2) {
    operatorOptions.value = [];
    return;
  }

  operatorLoading.value = true;
  try {
    const response = await userAPI.searchUsers(query);
    operatorOptions.value = response.data || [];
  } catch (error) {
    console.error('搜索操作人失败:', error);
    ElMessage.error('搜索操作人失败');
  } finally {
    operatorLoading.value = false;
  }
}

function handleView(row) {
  currentDetail.value = row;
  detailDialogVisible.value = true;
}

function formatDateTime(dateTime) {
  if (!dateTime) {
    return '';
  }
  return new Date(dateTime).toLocaleString('zh-CN');
}

function getOperationTypeType(type) {
  if (!type) {
    return 'info';
  }
  if (type.includes('DELETE') || type.includes('REJECT') || type.includes('BLACKLIST')) {
    return 'danger';
  }
  if (type.includes('APPROVE') || type.includes('COMPLETE') || type.includes('VERIFY')) {
    return 'success';
  }
  if (type.includes('UPDATE')) {
    return 'warning';
  }
  return 'info';
}

function getOperationTypeText(type) {
  return (
    {
      APPROVE_BOOKING: '审批通过预约',
      APPROVE_RESERVATION: '审批通过预约',
      REJECT_BOOKING: '拒绝预约',
      REJECT_RESERVATION: '拒绝预约',
      VERIFY_CHECKIN: '核验签到',
      VERIFY_CHECKOUT: '核验签退',
      ADD_BLACKLIST: '加入黑名单',
      REMOVE_BLACKLIST: '移出黑名单',
      AUTO_EXPIRE_BLACKLIST: '批量过期黑名单',
      REPLY_FEEDBACK: '回复反馈',
      UPDATE_FEEDBACK_STATUS: '更新反馈状态',
      DELETE_FEEDBACK: '删除反馈',
      UPDATE_RULE: '更新规则',
      DELETE_RULE: '删除规则',
      PUBLISH_NOTICE: '发布通知',
      UPDATE_NOTICE: '更新通知',
      DELETE_NOTICE: '删除通知',
      PUBLISH_SCHEDULED_NOTICE: '发布定时通知',
      CREATE_FACILITY: '创建设施',
      UPDATE_FACILITY: '更新设施',
      UPDATE_FACILITY_STATUS: '变更设施状态',
      DELETE_FACILITY: '删除设施',
      UPLOAD_FACILITY_IMAGE: '上传设施图片',
      DELETE_FACILITY_IMAGE: '删除设施图片',
      CREATE_FACILITY_CATEGORY: '创建设施分类',
      UPDATE_FACILITY_CATEGORY: '更新设施分类',
      TOGGLE_FACILITY_CATEGORY_STATUS: '切换分类状态',
      DELETE_FACILITY_CATEGORY: '删除设施分类',
      CREATE_MAINTENANCE: '创建维护记录',
      UPDATE_MAINTENANCE: '更新维护记录',
      COMPLETE_MAINTENANCE: '完成维护',
      DELETE_MAINTENANCE: '删除维护记录',
      CREATE_VIOLATION: '创建违规记录',
      APPROVE_VIOLATION: '通过违规记录',
      REJECT_VIOLATION: '拒绝违规记录',
      REVOKE_VIOLATION: '撤销违规记录'
    }[type] || type
  );
}
</script>

<style scoped>
.admin-log-page {
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
  animation: log-rise 0.55s ease both;
}

.page-hero,
.control-card,
.panel-card,
.hero-note,
.detail-summary-card,
.detail-panel {
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
.section-copy h2,
.dialog-header h3 {
  margin: 14px 0 10px;
  color: #17314d;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p,
.dialog-header p {
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

.small-btn {
  min-height: 46px;
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
.summary-card p,
.detail-summary-card span {
  color: #72839b;
}

.hero-note strong,
.summary-card strong,
.detail-summary-card strong {
  color: #19324e;
}

.hero-note strong,
.summary-card strong {
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
  border: 1px solid var(--feature-border);
  background: linear-gradient(150deg, rgba(240, 249, 252, 0.96) 0%, #ffffff 84%);
  box-shadow: 0 18px 40px rgba(30, 41, 59, 0.06);
}

.summary-card p {
  margin: 0;
  line-height: 1.7;
}

.control-card,
.panel-card {
  padding: 24px;
}

.search-form {
  margin-top: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.control-actions {
  justify-content: flex-end;
  margin-top: 4px;
}

.search-form :deep(.el-select__wrapper),
.search-form :deep(.el-input__wrapper),
.search-form :deep(.el-date-editor.el-input__wrapper) {
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

.log-table :deep(.el-table) {
  --el-table-border-color: rgba(132, 165, 205, 0.12);
  --el-table-row-hover-bg-color: rgba(243, 250, 252, 0.95);
  border-radius: 20px;
}

.log-table :deep(.el-table::before),
.log-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.log-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f6fbfe 0%, #eef5fc 100%) !important;
  color: #225368;
}

.action-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
}

.view-btn {
  color: #5579a4;
  border-color: rgba(132, 165, 205, 0.24);
  background: rgba(247, 249, 252, 0.96);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.detail-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dialog-badge {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(200, 216, 240, 0.24);
  color: var(--theme-deep);
}

.detail-layout {
  display: grid;
  gap: 18px;
}

.detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.detail-summary-card {
  padding: 18px;
  box-shadow: none;
  background: linear-gradient(150deg, rgba(240, 249, 252, 0.96) 0%, #ffffff 84%);
}

.detail-summary-card strong {
  display: block;
  margin-top: 10px;
  font-size: 18px;
}

.detail-panel {
  padding: 18px;
}

.dialog-footer {
  justify-content: flex-end;
}

@keyframes log-rise {
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
  .summary-grid,
  .detail-summary-grid,
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid,
  .detail-summary-grid,
  .form-grid {
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
  .control-actions,
  .row-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>