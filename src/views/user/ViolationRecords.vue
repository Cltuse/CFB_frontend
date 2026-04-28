<template>
  <div class="violation-page">
    <section class="page-header">
      <div class="header-content">
        <div>
          <span class="page-kicker">信用与违规信息</span>
          <h1 class="page-title">违规记录</h1>
          <p class="page-subtitle">查看历史违规、处罚分值和当前信用分，页面信息更集中、更容易核对。</p>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">生效中违规</span>
        <strong>{{ violationCount }}</strong>
        <p>当前仍然生效的违规次数</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">累计扣分</span>
        <strong>{{ totalDeduction }}</strong>
        <p>按已处理记录统计的处罚分值总和</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前信用分</span>
        <strong>{{ currentCreditScore }}</strong>
        <p>根据现有违规处理结果计算得出</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前筛选结果</span>
        <strong>{{ filteredViolationList.length }}</strong>
        <p>会随搜索条件实时变化</p>
      </article>
    </section>

    <section class="toolbar-card">
      <el-input
        v-model="searchDescription"
        placeholder="输入违规描述关键词进行筛选"
        class="search-input"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button class="secondary-btn" @click="refreshData">刷新数据</el-button>
    </section>

    <section class="table-card">
      <div class="table-head">
        <div>
          <h2>违规记录列表</h2>
          <p>使用更清晰的卡片式表格，重点突出违规类型、处罚分值和状态。</p>
        </div>
      </div>

      <el-table
        :data="paginatedViolationList"
        class="violation-table"
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        @row-click="handleRowClick"
      >
        <el-table-column prop="violationType" label="违规类型" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getViolationTypeTagType(row.violationType)" effect="light" round>
              {{ getViolationTypeText(row.violationType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="违规描述" min-width="320">
          <template #default="{ row }">
            <div class="description-text">{{ row.description || '暂无描述' }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="reportedTime" label="上报时间" width="200">
          <template #default="{ row }">
            <span class="time-text">{{ formatDateTime(row.reportedTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="penaltyPoints" label="处罚分" width="120" align="center">
          <template #default="{ row }">
            <span class="penalty-value">{{ row.penaltyPoints || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" round>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button class="view-btn" @click.stop="showViolationDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="pagination-card">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredViolationList.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </section>

    <el-dialog
      v-model="detailDialogVisible"
      width="640px"
      class="detail-dialog"
      title="违规记录详情"
      :before-close="handleCloseDetail"
    >
      <div v-if="currentViolation" class="detail-layout">
        <section class="detail-panel">
          <h3>信用信息</h3>
          <div class="detail-grid">
            <article class="detail-item">
              <label>当前信用分</label>
              <strong>{{ currentCreditScore }}</strong>
            </article>
            <article class="detail-item">
              <label>处罚分</label>
              <strong>{{ currentViolation.penaltyPoints || 0 }}</strong>
            </article>
          </div>
        </section>

        <section class="detail-panel">
          <h3>基本信息</h3>
          <div class="detail-grid">
            <article class="detail-item">
              <label>违规类型</label>
              <strong>{{ getViolationTypeText(currentViolation.violationType) }}</strong>
            </article>
            <article class="detail-item">
              <label>上报人</label>
              <strong>{{ currentViolation.reporterName || '系统记录' }}</strong>
            </article>
            <article class="detail-item">
              <label>上报时间</label>
              <strong>{{ formatDateTime(currentViolation.reportedTime) || '暂无数据' }}</strong>
            </article>
            <article class="detail-item">
              <label>状态</label>
              <strong>{{ getStatusText(currentViolation.status) }}</strong>
            </article>
          </div>
        </section>

        <section class="detail-panel">
          <h3>违规描述</h3>
          <p class="detail-description">{{ currentViolation.description || '暂无描述' }}</p>
        </section>

        <section v-if="currentViolation.facilityName" class="detail-panel">
          <h3>关联设施</h3>
          <p class="detail-description">{{ currentViolation.facilityName }}</p>
        </section>

        <section v-if="currentViolation.expireTime" class="detail-panel">
          <h3>有效期</h3>
          <p class="detail-description">有效至：{{ formatDateTime(currentViolation.expireTime) }}</p>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { userClientAPI, violationAPI } from '../../api';
import { formatDateTime } from '@/utils/date';

const VIOLATION_FETCH_LIMIT = 500;

const userInfo = ref({});
const violationList = ref([]);
const currentViolation = ref(null);
const detailDialogVisible = ref(false);
const searchDescription = ref('');
const currentCreditScore = ref(100);
const violationCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

onMounted(() => {
  const info = localStorage.getItem('userInfo');
  if (!info) {
    ElMessage.error('请先登录');
    return;
  }

  try {
    userInfo.value = JSON.parse(info);
    if (!userInfo.value.id) {
      ElMessage.error('用户信息不完整，请重新登录');
      return;
    }
    refreshData();
  } catch (error) {
    console.error('解析用户信息失败:', error);
    ElMessage.error('用户信息解析失败');
  }
});

const filteredViolationList = computed(() => {
  let filtered = violationList.value;
  if (searchDescription.value) {
    const keyword = searchDescription.value.toLowerCase();
    filtered = filtered.filter((item) => item.description && item.description.toLowerCase().includes(keyword));
  }
  return filtered;
});

const paginatedViolationList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredViolationList.value.slice(start, end);
});

const processedViolationList = computed(() => violationList.value.filter((item) => item.status === 'PROCESSED'));
const totalDeduction = computed(() =>
  processedViolationList.value.reduce((sum, item) => sum + (item.penaltyPoints || 0), 0)
);

const loadViolationCount = async () => {
  try {
    const res = await violationAPI.getUserViolationCount(userInfo.value.id);
    if (res?.code === 200) {
      violationCount.value = res.data || 0;
    }
  } catch (error) {
    console.error('获取违规次数失败:', error);
  }
};

const loadCurrentCreditScore = async () => {
  try {
    const res = await violationAPI.getUserCurrentCreditScore(userInfo.value.id);
    if (res?.code === 200) {
      currentCreditScore.value = res.data || 100;
    }
  } catch (error) {
    console.error('获取信用分失败:', error);
  }
};

const loadMyViolations = async () => {
  try {
    // 后端已有分页接口，这里先拉取足够大的结果集，保证前端搜索和分页都能覆盖历史记录。
    const res = await userClientAPI.getMyViolationRecords(userInfo.value.id, 0, VIOLATION_FETCH_LIMIT);
    if (Array.isArray(res?.data)) {
      violationList.value = res.data;
      return;
    }
    if (Array.isArray(res?.data?.violations)) {
      violationList.value = res.data.violations;
      return;
    }
    violationList.value = [];
  } catch (error) {
    console.error('加载违规记录失败:', error);
    ElMessage.error('加载违规记录失败');
    violationList.value = [];
  }
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleRowClick = (row) => {
  showViolationDetail(row);
};

const showViolationDetail = (row) => {
  currentViolation.value = row;
  detailDialogVisible.value = true;
};

const handleCloseDetail = () => {
  detailDialogVisible.value = false;
  currentViolation.value = null;
};

const refreshData = () => {
  currentPage.value = 1;
  loadMyViolations();
  loadCurrentCreditScore();
  loadViolationCount();
};

const getViolationTypeTagType = (type) => {
  const map = {
    NO_SHOW: 'danger',
    OVERDUE: 'warning',
    CANCEL_FREQ: 'info',
    DAMAGE: 'danger',
    OTHER: 'info'
  };
  return map[type] || 'info';
};

const getViolationTypeText = (type) => {
  const map = {
    NO_SHOW: '爽约',
    OVERDUE: '超时占用',
    CANCEL_FREQ: '频繁取消',
    DAMAGE: '损坏公物',
    OTHER: '其他违规'
  };
  return map[type] || '未知类型';
};

const getStatusType = (status) => {
  const map = {
    PENDING: 'warning',
    PROCESSED: 'success',
    REVOKED: 'info',
    REJECTED: 'danger',
    EXPIRED: 'info',
    APPEALED: 'primary'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    PENDING: '待处理',
    PROCESSED: '已处理',
    REVOKED: '已撤销',
    REJECTED: '已驳回',
    EXPIRED: '已过期',
    APPEALED: '申诉中'
  };
  return map[status] || status;
};

const headerCellStyle = {
  backgroundColor: '#fffafb',
  color: '#7a4052',
  fontWeight: '600',
  fontSize: '14px',
  borderBottom: '1px solid rgba(245, 183, 192, 0.16)'
};

const cellStyle = () => ({
  padding: '16px 12px',
  borderBottom: '1px solid #fce4e8',
  color: '#755e59',
  fontSize: '14px'
});
</script>

<style scoped>
.violation-page {
  --page-primary: #f5b7c0;
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(252, 228, 232, 0.28), transparent 30%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.page-header,
.summary-card,
.toolbar-card,
.table-card,
.pagination-card {
  border-radius: 30px;
  border: 1px solid rgba(245, 183, 192, 0.14);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 40px rgba(94, 52, 62, 0.05);
}

.header-content {
  padding: 30px;
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.28), transparent 24%),
    linear-gradient(145deg, rgba(252, 228, 232, 0.16) 0%, #ffffff 64%);
}

.page-kicker {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(245, 183, 192, 0.14);
  color: #c4677a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.page-title {
  margin: 16px 0 10px;
  font-size: 34px;
  color: #7a4052;
}

.page-subtitle {
  margin: 0;
  color: #8e717b;
  line-height: 1.8;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px 20px;
  background: linear-gradient(145deg, rgba(252, 228, 232, 0.18), #ffffff 82%);
}

.summary-label {
  display: block;
  color: #8e717b;
  font-size: 13px;
}

.summary-card strong {
  display: block;
  margin: 12px 0 8px;
  font-size: 32px;
  line-height: 1;
  color: #7a4052;
}

.summary-card p {
  margin: 0;
  color: #8e717b;
  line-height: 1.6;
}

.toolbar-card {
  padding: 22px 24px;
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.search-input {
  width: 320px;
}

.violation-page :deep(.el-input__wrapper) {
  border-radius: 16px;
  box-shadow: none;
  background: #fffafb;
  border: 1px solid rgba(245, 183, 192, 0.18);
}

.secondary-btn,
.view-btn {
  min-height: 42px;
  border-radius: 14px;
}

.secondary-btn {
  border: 1px solid rgba(245, 183, 192, 0.18);
  background: #ffffff;
  color: #c4677a;
}

.table-card,
.pagination-card {
  padding: 24px;
}

.table-head {
  margin-bottom: 16px;
}

.table-head h2 {
  margin: 0;
  color: #7a4052;
}

.table-head p {
  margin: 8px 0 0;
  color: #8e717b;
  line-height: 1.7;
}

.violation-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: rgba(252, 228, 232, 0.3) !important;
}

.description-text,
.time-text {
  color: #755e59;
  line-height: 1.6;
}

.penalty-value {
  color: #d66a4f;
  font-weight: 700;
}

.view-btn {
  min-height: 36px;
  padding: 0 18px;
  border: 1px solid rgba(245, 183, 192, 0.18);
  background: rgba(255, 246, 243, 0.92);
  color: #c4677a;
}

.pagination-card {
  display: flex;
  justify-content: center;
}

.detail-layout {
  display: grid;
  gap: 16px;
}

.detail-panel {
  padding: 18px;
  border-radius: 22px;
  background: #fffafb;
  border: 1px solid rgba(245, 183, 192, 0.14);
}

.detail-panel h3 {
  margin: 0 0 14px;
  color: #7a4052;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  padding: 14px;
  border-radius: 18px;
  background: #ffffff;
}

.detail-item label {
  display: block;
  color: #8e717b;
  font-size: 12px;
}

.detail-item strong {
  display: block;
  margin-top: 8px;
  color: #7a4052;
  line-height: 1.6;
}

.detail-description {
  margin: 0;
  color: #755e59;
  line-height: 1.8;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .summary-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .header-content,
  .toolbar-card,
  .table-card,
  .pagination-card {
    padding: 18px;
  }

  .page-title {
    font-size: 28px;
  }

  .toolbar-card {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }
}
</style>
<style scoped>
.violation-page {
  --theme-deep: #e8909d;
  --theme-border: rgba(245, 183, 192, 0.16);
  --theme-shadow: rgba(94, 52, 62, 0.08);
  background:
    radial-gradient(circle at top left, rgba(252, 228, 232, 0.36), transparent 30%),
    radial-gradient(circle at right center, rgba(254, 248, 249, 0.95), transparent 24%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.page-header,
.summary-card,
.toolbar-card,
.table-card,
.pagination-card,
.detail-panel {
  animation: violation-rise 0.55s ease both;
  border-color: var(--theme-border);
  box-shadow: 0 20px 46px var(--theme-shadow);
}

.header-content {
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.32), transparent 24%),
    linear-gradient(145deg, rgba(254, 248, 249, 0.96) 0%, #ffffff 64%);
}

.summary-card {
  background: linear-gradient(150deg, rgba(254, 248, 249, 0.96), #ffffff 82%);
}

.toolbar-card,
.table-card,
.pagination-card {
  border-radius: 28px;
}

.violation-page :deep(.el-input__wrapper) {
  border-color: rgba(245, 183, 192, 0.2);
}

.table-card {
  overflow: hidden;
}

.violation-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #fffafb 0%, #fce4e8 100%) !important;
}

.violation-table :deep(.el-table::before),
.violation-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.view-btn {
  border-radius: 999px;
}

.view-btn:hover {
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  color: #ffffff;
  box-shadow: 0 12px 22px rgba(232, 144, 157, 0.18);
}

.detail-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

@keyframes violation-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
