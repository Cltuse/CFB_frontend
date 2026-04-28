<template>
  <div class="admin-reservation-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Reservation</span>
        <h1>预约记录管理</h1>
        <p>管理系统内所有预约记录，包括预约状态、申请人、设施、时间等信息。</p>
        
      </div>
      <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="loadReservationList">刷新列表</el-button>
          <el-button class="secondary-btn" @click="handleClearSearch">清空筛选</el-button>
        </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">预约总数</span>
        <strong>{{ stats.total }}</strong>
        <p>系统内全部预约记录</p>
      </article>
      <article class="stat-card warning-card">
        <span class="stat-label">待审核</span>
        <strong>{{ stats.pending }}</strong>
        <p>需要管理员处理的预约申请</p>
      </article>
      <article class="stat-card success-card">
        <span class="stat-label">已通过</span>
        <strong>{{ stats.approved }}</strong>
        <p>已进入执行流程的预约</p>
      </article>
      <article class="stat-card info-card">
        <span class="stat-label">已完成</span>
        <strong>{{ stats.completed }}</strong>
        <p>已结束并归档的预约记录</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>筛选与视图切换</h2>
        
        <p>根据预约状态、设施名称或申请人筛选预约记录。</p>
        
      </div>
      
      <el-tabs v-model="activeTab" class="status-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="待审核" name="PENDING" />
        <el-tab-pane label="已通过" name="APPROVED" />
        <el-tab-pane label="已完成" name="COMPLETED" />
        <el-tab-pane label="已拒绝" name="REJECTED" />
        <el-tab-pane label="全部" name="ALL" />
      </el-tabs>
      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设施名称或申请人"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClearSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>


    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>预约记录列表</h2>
          <p>点击任意记录可查看完整预约信息、签到状态、核销码与审核备注。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ total }} 条</span>
          <span class="meta-chip muted-chip">当前页 {{ reservationList.length }} 条</span>
        </div>
      </div>

      <el-table :data="reservationList" v-loading="loading" class="reservation-table" @row-click="handleRowClick">
        <el-table-column prop="facilityName" label="设施名称" min-width="160" />
        <el-table-column prop="userName" label="申请人" min-width="120" />
        <el-table-column prop="startTime" label="开始时间" min-width="170" />
        <el-table-column prop="endTime" label="结束时间" min-width="170" />
        <el-table-column prop="purpose" label="使用用途" min-width="180" show-overflow-tooltip />
        <el-table-column prop="verificationCode" label="核销码" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.verificationCode" type="info" effect="plain" round>{{ row.verificationCode }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="checkinStatus" label="签到状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getCheckinStatusType(row.checkinStatus)" effect="light" round>
              {{ getCheckinStatusText(row.checkinStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="预约状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" round>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain class="view-btn" @click.stop="handleRowClick(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !reservationList.length" description="当前没有符合条件的预约记录" />

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog v-model="detailDialogVisible" width="760px" class="detail-dialog" :show-close="false">
      <template #header>
        <div class="dialog-header">
          <div class="dialog-badge">
            <el-icon><Document /></el-icon>
          </div>
          <div>
            <h3>预约详情</h3>
            <p>{{ currentRow?.facilityName || '预约记录' }}</p>
          </div>
        </div>
      </template>

      <div v-if="currentRow" class="detail-layout">
        <section class="detail-summary-grid">
          <article class="detail-summary-card">
            <span>申请人</span>
            <strong>{{ currentRow.userName }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>预约状态</span>
            <strong>{{ getStatusText(currentRow.status) }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>签到状态</span>
            <strong>{{ getCheckinStatusText(currentRow.checkinStatus) }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>核销码</span>
            <strong>{{ currentRow.verificationCode || '未生成' }}</strong>
          </article>
        </section>

        <section class="detail-panel">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设施名称">{{ currentRow.facilityName }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ currentRow.userName }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ currentRow.startTime }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ currentRow.endTime }}</el-descriptions-item>
            <el-descriptions-item label="预约状态">
              <el-tag :type="getStatusType(currentRow.status)" effect="light" round>
                {{ getStatusText(currentRow.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="签到状态">
              <el-tag :type="getCheckinStatusType(currentRow.checkinStatus)" effect="light" round>
                {{ getCheckinStatusText(currentRow.checkinStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentRow.verifiedByName" label="核销人">
              {{ currentRow.verifiedByName }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentRow.checkinTime" label="签到时间">
              {{ currentRow.checkinTime }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentRow.checkoutTime" label="签退时间">
              {{ currentRow.checkoutTime }}
            </el-descriptions-item>
            <el-descriptions-item label="使用用途" :span="2">
              {{ currentRow.purpose || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="审核备注" :span="2">
              {{ currentRow.adminRemark || '无' }}
            </el-descriptions-item>
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
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Search } from '@element-plus/icons-vue';
import { reservationAPI } from '../../api';
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme';

const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

const loading = ref(false);
const activeTab = ref('PENDING');
const searchKeyword = ref('');
const isSearchMode = ref(false);
const reservationList = ref([]);
const allReservations = ref([]);
const total = ref(0);
const detailDialogVisible = ref(false);
const currentRow = ref(null);
const pagination = ref({
  page: 1,
  size: 10
});

const stats = computed(() => ({
  total: allReservations.value.length,
  pending: allReservations.value.filter((item) => item.status === 'PENDING').length,
  approved: allReservations.value.filter((item) => item.status === 'APPROVED').length,
  completed: allReservations.value.filter((item) => item.status === 'COMPLETED').length
}));

const pendingCheckins = computed(() =>
  allReservations.value.filter((item) => item.status === 'APPROVED' && item.checkinStatus === 'NOT_CHECKED').length
);

const currentTabLabel = computed(
  () =>
    ({
      PENDING: '当前为待审核视图',
      APPROVED: '当前为已通过视图',
      COMPLETED: '当前为已完成视图',
      REJECTED: '当前为已拒绝视图',
      ALL: '当前为全部预约视图'
    })[activeTab.value] || '当前预约视图'
);

onMounted(() => {
  loadReservationList();
});

const loadReservationList = async () => {
  try {
    loading.value = true;
    const res = await reservationAPI.list();
    const source = Array.isArray(res.data) ? res.data : [];
    allReservations.value = source;

    let filtered = source;
    if (activeTab.value !== 'ALL') {
      filtered = filtered.filter((item) => item.status === activeTab.value);
    }

    if (isSearchMode.value && searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.facilityName && item.facilityName.toLowerCase().includes(keyword)) ||
          (item.userName && item.userName.toLowerCase().includes(keyword))
      );
    }

    total.value = filtered.length;
    const startIndex = (pagination.value.page - 1) * pagination.value.size;
    const endIndex = startIndex + pagination.value.size;
    reservationList.value = filtered.slice(startIndex, endIndex);
  } catch (error) {
    console.error('加载预约列表失败:', error);
    ElMessage.error('加载预约列表失败');
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  pagination.value.page = 1;
  loadReservationList();
};

const handleSearch = () => {
  pagination.value.page = 1;
  isSearchMode.value = Boolean(searchKeyword.value.trim());
  loadReservationList();
};

const handleClearSearch = () => {
  searchKeyword.value = '';
  isSearchMode.value = false;
  pagination.value.page = 1;
  loadReservationList();
};

const handleSizeChange = (size) => {
  pagination.value.size = size;
  pagination.value.page = 1;
  loadReservationList();
};

const handleCurrentChange = (page) => {
  pagination.value.page = page;
  loadReservationList();
};

const handleRowClick = (row) => {
  currentRow.value = row;
  detailDialogVisible.value = true;
};

const getStatusType = (status) =>
  ({
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    COMPLETED: 'info',
    CANCELLED: 'info'
  })[status] || '';

const getStatusText = (status) =>
  ({
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  })[status] || status;

const getCheckinStatusType = (status) =>
  ({
    NOT_CHECKED: 'info',
    CHECKED_IN: 'success',
    CHECKED_OUT: 'success',
    MISSED: 'danger'
  })[status] || '';

const getCheckinStatusText = (status) =>
  ({
    NOT_CHECKED: '未签到',
    CHECKED_IN: '已签到',
    CHECKED_OUT: '已签退',
    MISSED: '失约'
  })[status] || status;
</script>

<style scoped>
.admin-reservation-page {
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
.stat-card,
.control-card,
.panel-card {
  animation: reservation-rise 0.55s ease both;
}

.page-hero,
.control-card,
.panel-card,
.hero-note,
.detail-panel,
.detail-summary-card {
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
.stat-label,
.stat-card p,
.detail-summary-card span {
  color: #72839b;
}

.hero-note strong,
.stat-card strong,
.detail-summary-card strong {
  color: #19324e;
}

.hero-note strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--feature-border);
  background: linear-gradient(150deg, rgba(240, 249, 252, 0.96) 0%, #ffffff 84%);
  box-shadow: 0 18px 40px rgba(30, 41, 59, 0.06);
}

.warning-card {
  background: linear-gradient(150deg, rgba(255, 247, 232, 0.96) 0%, #ffffff 84%);
}

.success-card {
  background: linear-gradient(150deg, rgba(238, 251, 244, 0.96) 0%, #ffffff 84%);
}

.info-card {
  background: linear-gradient(150deg, rgba(244, 247, 251, 0.96) 0%, #ffffff 84%);
}

.stat-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
}

.stat-card p {
  margin: 0;
  line-height: 1.65;
}

.control-card,
.panel-card {
  padding: 24px;
}

.status-tabs {
  margin-top: 4px;
}

.status-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.status-tabs :deep(.el-tabs__nav-wrap::after) {
  background: rgba(200, 216, 240, 0.12);
}

.status-tabs :deep(.el-tabs__item) {
  height: 38px;
  border-radius: 999px;
  padding: 0 16px;
  color: #6b7f9c;
}

.status-tabs :deep(.el-tabs__item.is-active) {
  color: #4b6f99;
}

.status-tabs :deep(.el-tabs__active-bar) {
  display: none;
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

.reservation-table :deep(.el-table) {
  --el-table-border-color: rgba(132, 165, 205, 0.12);
  --el-table-row-hover-bg-color: rgba(243, 250, 252, 0.95);
  border-radius: 20px;
}

.reservation-table :deep(.el-table::before),
.reservation-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.reservation-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f6fbfe 0%, #eef5fc 100%) !important;
  color: #225368;
}

.view-btn {
  border-radius: 999px;
  color: #5579a4;
  border-color: rgba(132, 165, 205, 0.24);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
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
  padding: 26px 30px 18px;
  background:
    radial-gradient(circle at top right, rgba(200, 216, 240, 0.32), transparent 26%),
    linear-gradient(145deg, rgba(240, 249, 252, 0.96) 0%, #ffffff 62%);
}

.dialog-badge {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 16px;
  background: rgba(200, 216, 240, 0.34);
  color: var(--feature-strong);
}

.detail-layout {
  display: grid;
  gap: 18px;
  padding: 0 30px 18px;
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
  padding: 8px;
}

.detail-panel :deep(.el-descriptions__label) {
  color: #607697;
}

.dialog-footer {
  justify-content: flex-end;
  padding: 0 30px 30px;
}

@keyframes reservation-rise {
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
  .stats-grid,
  .detail-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid,
  .detail-summary-grid {
    grid-template-columns: 1fr;
  }

  .page-hero,
  .control-card,
  .panel-card,
  .dialog-header,
  .detail-layout,
  .dialog-footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .panel-head,
  .dialog-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }
}
</style>