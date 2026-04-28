<template>
  <div class="my-reservation-page">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-decoration"></div>
      <div class="header-content">
        <h1 class="page-title">
          <div class="title-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          我的预约
        </h1>
        <p class="page-subtitle">管理我的设施预约记录</p>
      </div>
    </div>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">预约总数</span>
        <strong>{{ reservationStats.total }}</strong>
        <p>包含历史记录与当前仍有效的预约</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">待确认</span>
        <strong>{{ reservationStats.pending }}</strong>
        <p>等待管理员处理结果的预约申请</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">待签到</span>
        <strong>{{ reservationStats.actionable }}</strong>
        <p>已通过且仍可继续操作的预约</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前筛选结果</span>
        <strong>{{ reservationStats.filtered }}</strong>
        <p>与顶部搜索条件实时联动</p>
      </article>
    </section>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-container">
        <el-input
          v-model="searchFacilityName"
          placeholder="请输入设施名称进行搜索"
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 预约表格 -->
    <div class="table-container">
      <el-table
        :data="paginatedReservationList"
        class="reservation-table"
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        @row-click="handleRowClick"
      >
        <el-table-column prop="facilityName" label="设施名称" min-width="180">
          <template #default="{ row }">
            <div class="facility-details">
              <div class="facility-name">{{ row.facilityName }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="startTime" label="开始时间" width="210">
          <template #default="{ row }">
            <div class="time-info">
              <el-icon><Clock /></el-icon>
              <span>{{ row.startTime }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="endTime" label="结束时间" width="210">
          <template #default="{ row }">
            <div class="time-info">
              <el-icon><Clock /></el-icon>
              <span>{{ row.endTime }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="purpose" label="使用目的" min-width="200" align="center">
          <template #default="{ row }">
            <div class="purpose-info">{{ row.purpose }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="150" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              class="status-tag"
              effect="light"
            >
              <el-icon>
                <CircleCheck v-if="row.status === 'APPROVED'" />
                <Clock v-else-if="row.status === 'PENDING'" />
                <CircleClose v-else-if="row.status === 'REJECTED'" />
                <Check v-else-if="row.status === 'COMPLETED'" />
                <CircleClose v-else />
              </el-icon>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="checkinStatus" label="签到状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getCheckinStatusType(row.checkinStatus)"
              class="status-tag"
              effect="light"
            >
              <el-icon>
                <CircleCheck v-if="row.checkinStatus === 'CHECKED_IN'" />
                <CircleCheck v-else-if="row.checkinStatus === 'CHECKED_OUT'" />
                <Clock v-else-if="row.checkinStatus === 'NOT_CHECKED'" />
                <CircleClose v-else-if="row.checkinStatus === 'MISSED'" />
              </el-icon>
              {{ getCheckinStatusText(row.checkinStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="verificationCode" label="核销码" width="120" align="center">
          <template #default="{ row }">
            <div v-if="row.verificationCode" class="verification-code">
              <el-tag type="info" effect="plain" size="small">
                {{ row.verificationCode }}
              </el-tag>
            </div>
            <div v-else class="no-code">-</div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                size="small"
                type="primary"
                :plain="true"
                class="action-btn view-btn"
                @click.stop="handleView(row)"
              >
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button
                v-if="(row.status === 'PENDING' || row.status === 'APPROVED') && row.checkinStatus === 'NOT_CHECKED'"
                size="small"
                type="warning"
                :plain="true"
                class="action-btn cancel-btn"
                @click.stop="handleCancel(row)"
              >
                <el-icon><Close /></el-icon>
                取消
              </el-button>
              <el-button
                v-if="row.status === 'APPROVED' && row.checkinStatus === 'NOT_CHECKED'"
                size="small"
                type="primary"
                :plain="true"
                class="action-btn checkin-btn"
                @click.stop="handleCheckin(row)"
              >
                <el-icon><Check /></el-icon>
                签到
              </el-button>
              <el-button
                v-if="row.status === 'APPROVED' && row.checkinStatus === 'CHECKED_IN'"
                size="small"
                type="success"
                :plain="true"
                class="action-btn checkout-btn"
                @click.stop="handleCheckout(row)"
              >
                <el-icon><CircleCheck /></el-icon>
                签退
              </el-button>
              <el-button
                v-if="row.status === 'APPROVED' && row.checkinStatus === 'CHECKED_OUT'"
                size="small"
                type="info"
                :plain="true"
                class="action-btn completed-btn"
                disabled
              >
                <el-icon><CircleCheck /></el-icon>
                已签退
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredReservationList.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 查看详情对话框 -->
    <el-dialog
      title="预约详情"
      v-model="viewDialogVisible"
      width="600px"
      class="reservation-dialog"
      :show-close="false"
    >
      <div class="dialog-header">
        <div class="dialog-title-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="dialog-title-text">预约详情</span>
      </div>

      <div class="dialog-content">
        <el-descriptions :column="1" border class="reservation-descriptions">
          <el-descriptions-item label="设施名称">
            <div class="description-value">{{ currentRow.facilityName }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            <div class="description-value time-value">
              <el-icon><Clock /></el-icon>
              {{ currentRow.startTime }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            <div class="description-value time-value">
              <el-icon><Clock /></el-icon>
              {{ currentRow.endTime }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="使用目的">
            <div class="description-value">{{ currentRow.purpose }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentRow.status)" class="status-tag">
              <el-icon>
                <CircleCheck v-if="currentRow.status === 'APPROVED'" />
                <Clock v-else-if="currentRow.status === 'PENDING'" />
                <CircleClose v-else-if="currentRow.status === 'REJECTED'" />
                <Check v-else-if="currentRow.status === 'COMPLETED'" />
                <CircleClose v-else />
              </el-icon>
              {{ getStatusText(currentRow.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="签到状态">
            <el-tag :type="getCheckinStatusType(currentRow.checkinStatus)" class="status-tag">
              <el-icon>
                <CircleCheck v-if="currentRow.checkinStatus === 'CHECKED_IN'" />
                <CircleCheck v-else-if="currentRow.checkinStatus === 'CHECKED_OUT'" />
                <Clock v-else-if="currentRow.checkinStatus === 'NOT_CHECKED'" />
                <CircleClose v-else-if="currentRow.checkinStatus === 'MISSED'" />
              </el-icon>
              {{ getCheckinStatusText(currentRow.checkinStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="核销码" v-if="currentRow.verificationCode">
            <el-tag type="info" effect="plain" size="small" class="verification-code-detail">
              {{ currentRow.verificationCode }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="管理员备注">
            <div class="description-value">{{ currentRow.adminRemark || '无' }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button size="large" @click="viewDialogVisible = false" class="cancel-btn">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Clock, CircleCheck, CircleClose, Check, View, Close } from '@element-plus/icons-vue';
import { reservationAPI } from '../../api';
import { formatActionMessage } from '../../utils/messageText';

const reservationList = ref([]);
const viewDialogVisible = ref(false);
const currentRow = ref({});
const userInfo = ref({});
const searchFacilityName = ref('');

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

onMounted(() => {
  const info = localStorage.getItem('userInfo');
  if (info) {
    userInfo.value = JSON.parse(info);
  }
  loadMyReservations();
});

const loadMyReservations = async () => {
  try {
    const res = await reservationAPI.getByUserId(userInfo.value.id);
    reservationList.value = res.data;
  } catch (error) {
    console.error('加载我的预约失败:', error);
  }
};

// 过滤后的预约列表（设施名称模糊搜索）
const filteredReservationList = computed(() => {
  let filtered = reservationList.value;

  if (searchFacilityName.value) {
    const searchTerm = searchFacilityName.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.facilityName && item.facilityName.toLowerCase().includes(searchTerm)
    );
  }

  // 按开始时间倒序排序（最新的记录显示在最前面）
  return [...filtered].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return timeB - timeA;
  });
});

// 分页后的预约列表
const paginatedReservationList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredReservationList.value.slice(start, end);
});

const reservationStats = computed(() => ({
  total: reservationList.value.length,
  pending: reservationList.value.filter((item) => item.status === 'PENDING').length,
  actionable: reservationList.value.filter((item) => ['PENDING', 'APPROVED'].includes(item.status) && item.checkinStatus === 'NOT_CHECKED').length,
  filtered: filteredReservationList.value.length
}));

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
};

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleView = (row) => {
  currentRow.value = row;
  viewDialogVisible.value = true;
};

const handleCancel = (row) => {
  ElMessageBox.confirm('确认取消该预约？', '取消确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'delete-confirm-dialog'
  }).then(async () => {
    try {
      await reservationAPI.cancel(row.id);
      ElMessage.success('已取消预约');
      loadMyReservations();
    } catch (error) {
      console.error('取消失败:', error);
    }
  }).catch(() => {});
};

const handleComplete = (row) => {
  ElMessageBox.confirm('确认完成该预约？完成后设施状态将更新为可用。', '完成确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
    customClass: 'complete-confirm-dialog'
  }).then(async () => {
    try {
      await reservationAPI.complete(row.id);
      ElMessage.success('预约已完成');
      loadMyReservations();
    } catch (error) {
      console.error('完成失败:', error);
    }
  }).catch(() => {});
};

const handleCheckin = (row) => {
  ElMessageBox.confirm('确认签到该预约？', '签到确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
    customClass: 'checkin-confirm-dialog'
  }).then(async () => {
    try {
      await reservationAPI.checkin(row.id);
      ElMessage.success('签到成功');
      loadMyReservations();
    } catch (error) {
      console.error('签到失败:', error);
      ElMessage.error(formatActionMessage('签到失败', error.response?.data?.message, '签到失败，请稍后重试。'));
    }
  }).catch(() => {});
};

const handleCheckout = (row) => {
  ElMessageBox.confirm('确认签退该预约？签退后预约将自动完成。', '签退确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
    customClass: 'checkout-confirm-dialog'
  }).then(async () => {
    try {
      await reservationAPI.checkout(row.id);
      ElMessage.success('签退成功，预约已完成');
      loadMyReservations();
    } catch (error) {
      console.error('签退失败:', error);
      ElMessage.error(formatActionMessage('签退失败', error.response?.data?.message, '签退失败，请稍后重试。'));
    }
  }).catch(() => {});
};

// 表格样式配置
const headerCellStyle = {
  backgroundColor: '#f8fafc',
  color: '#2d3748',
  fontWeight: '600',
  fontSize: '14px',
  borderBottom: '2px solid #e2e8f0'
};

const cellStyle = ({ row, column, rowIndex, columnIndex }) => {
  return {
    padding: '16px 12px',
    borderBottom: '1px solid #f0f0f0',
    color: '#4a5568',
    fontSize: '14px'
  };
};

// 表格行点击处理
const handleRowClick = (row) => {
  handleView(row);
};

const getStatusType = (status) => {
  const map = {
    'PENDING': 'warning',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    'COMPLETED': 'info',
    'CANCELLED': 'info'
  };
  return map[status] || '';
};

const getStatusText = (status) => {
  const map = {
    'PENDING': '待审核',
    'APPROVED': '已通过',
    'REJECTED': '已拒绝',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  };
  return map[status] || status;
};

const getCheckinStatusType = (checkinStatus) => {
  const map = {
    'NOT_CHECKED': 'info',
    'CHECKED_IN': 'success',
    'CHECKED_OUT': 'info',
    'MISSED': 'danger'
  };
  return map[checkinStatus] || '';
};

const getCheckinStatusText = (checkinStatus) => {
  const map = {
    'NOT_CHECKED': '未签到',
    'CHECKED_IN': '已签到',
    'CHECKED_OUT': '已签退',
    'MISSED': '爽约'
  };
  return map[checkinStatus] || checkinStatus;
};
</script>

<style scoped>
.my-reservation-page {
  --page-primary: #f5b7c0;
  --page-secondary: #fce4e8;
  --page-soft: rgba(252, 228, 232, 0.22);
  min-height: auto;
  padding: 0;
  background:
    radial-gradient(circle at top left, rgba(252, 228, 232, 0.18), transparent 24%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
  display: grid;
  gap: 20px;
}

.my-reservation-page .page-header,
.my-reservation-page .toolbar,
.my-reservation-page .table-container,
.my-reservation-page .pagination-container {
  margin: 0;
  border: 1px solid rgba(245, 183, 192, 0.14);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 34px rgba(94, 52, 62, 0.06);
}

.my-reservation-page .header-decoration {
  height: 0;
}

.my-reservation-page .header-content {
  padding: 28px 30px;
  border: none;
  box-shadow: none;
  background:
    radial-gradient(circle at top right, var(--page-soft), transparent 28%),
    linear-gradient(145deg, color-mix(in srgb, var(--page-soft) 75%, #ffffff) 0%, #ffffff 60%);
}

.my-reservation-page .page-title {
  color: #7a4052;
}

.my-reservation-page .title-icon {
  background: linear-gradient(135deg, rgba(252, 228, 232, 0.3), rgba(255, 255, 255, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.74);
}

.my-reservation-page .title-icon svg {
  color: var(--page-primary);
}

.my-reservation-page .summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.my-reservation-page .summary-card {
  padding: 22px 20px;
  border-radius: 22px;
  border: 1px solid rgba(245, 183, 192, 0.12);
  background: linear-gradient(145deg, rgba(252, 228, 232, 0.18), #ffffff 82%);
  box-shadow: 0 14px 26px rgba(94, 52, 62, 0.05);
}

.my-reservation-page .summary-label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  color: #8e717b;
}

.my-reservation-page .summary-card strong {
  display: block;
  font-size: 34px;
  line-height: 1;
  color: #7a4052;
}

.my-reservation-page .summary-card p {
  margin: 10px 0 0;
  color: #8e717b;
  line-height: 1.6;
}

.my-reservation-page .toolbar,
.my-reservation-page .table-container,
.my-reservation-page .pagination-container {
  padding: 22px 24px;
}

.my-reservation-page .toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.my-reservation-page .search-input :deep(.el-input__wrapper) {
  border-radius: 14px;
  box-shadow: 0 0 0 1px rgba(245, 183, 192, 0.16) inset !important;
}

.my-reservation-page .reservation-table :deep(.el-table__header th) {
  background: rgba(254, 248, 249, 0.96) !important;
  color: #7a4052;
}

.my-reservation-page .reservation-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: rgba(254, 248, 249, 0.95) !important;
}

.my-reservation-page .action-btn {
  border-radius: 999px !important;
}
</style>
<style scoped>
.my-reservation-page {
  --theme-main: #f5b7c0;
  --theme-deep: #e8909d;
  --theme-soft: rgba(252, 228, 232, 0.28);
  --theme-border: rgba(245, 183, 192, 0.18);
  --theme-shadow: rgba(94, 52, 62, 0.1);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(252, 228, 232, 0.74), transparent 24%),
    radial-gradient(circle at right center, rgba(254, 248, 249, 0.92), transparent 22%),
    linear-gradient(180deg, #fffafb 0%, #fef8f9 48%, #fffdfd 100%);
}

.page-header,
.summary-card,
.toolbar,
.table-container,
.pagination-container {
  animation: reservation-rise 0.55s ease both;
}

.page-header,
.toolbar,
.table-container,
.pagination-container {
  margin: 0;
  border: 1px solid var(--theme-border);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.page-header {
  overflow: hidden;
}

.header-decoration {
  top: 0;
  left: 0;
  right: auto;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, #f5b7c0 0%, #fce4e8 100%);
  animation: none;
}

.header-content {
  padding: 30px 34px;
  border: none;
  border-radius: 30px;
  box-shadow: none;
  background:
    radial-gradient(circle at top right, var(--theme-soft), transparent 28%),
    linear-gradient(145deg, rgba(254, 248, 249, 0.96) 0%, #ffffff 64%);
}

.page-title {
  gap: 14px;
  font-size: 32px;
  color: #7a4052;
}

.title-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(252, 228, 232, 0.42), rgba(255, 255, 255, 0.98));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.title-icon svg {
  color: var(--theme-deep);
}

.page-subtitle {
  margin-top: 10px;
  color: #8e717b;
  line-height: 1.8;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(245, 183, 192, 0.14);
  background: linear-gradient(150deg, rgba(254, 248, 249, 0.96) 0%, #ffffff 82%);
  box-shadow: 0 18px 38px rgba(94, 52, 62, 0.06);
}

.summary-card strong {
  margin: 14px 0 8px;
  font-size: 32px;
  color: #7a4052;
}

.summary-label,
.summary-card p {
  color: #8e717b;
}

.toolbar {
  padding: 24px;
}

.search-input {
  width: 320px;
}

.search-input :deep(.el-input__wrapper) {
  min-height: 46px;
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid rgba(245, 183, 192, 0.2);
  background: #fef8f9;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 4px rgba(245, 183, 192, 0.12);
}

.table-container {
  padding: 8px;
  overflow: hidden;
}

.reservation-table {
  border-radius: 22px;
}

.reservation-table :deep(.el-table) {
  --el-table-border-color: rgba(245, 183, 192, 0.12);
  --el-table-row-hover-bg-color: rgba(254, 248, 249, 0.95);
}

.reservation-table :deep(.el-table::before),
.reservation-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.reservation-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #fef8f9 0%, #fef0f2 100%) !important;
  color: #7a4052;
  padding: 18px 12px;
  border-bottom: 1px solid rgba(245, 183, 192, 0.16);
}

.reservation-table :deep(.el-table__body td.el-table__cell) {
  padding: 18px 12px;
  border-bottom: 1px solid rgba(245, 183, 192, 0.1);
  background: rgba(255, 255, 255, 0.92);
}

.reservation-table :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: rgba(254, 248, 249, 0.95) !important;
}

.facility-name {
  color: #7a4052;
  font-weight: 700;
}

.time-info,
.purpose-info,
.description-value {
  color: #8e717b;
}

.status-tag {
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  gap: 6px;
  font-weight: 600;
}

.action-buttons {
  flex-wrap: wrap;
}

.action-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.action-btn:hover:not(.is-disabled) {
  transform: translateY(-1px);
}

.view-btn {
  color: #c4677a;
  border-color: rgba(245, 183, 192, 0.2);
  background: rgba(254, 248, 249, 0.98);
}

.view-btn:hover:not(.is-disabled) {
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  box-shadow: 0 10px 20px rgba(232, 144, 157, 0.22);
}

.cancel-btn {
  color: #cd6d74;
  border-color: rgba(233, 155, 164, 0.22);
  background: rgba(255, 244, 245, 0.96);
}

.cancel-btn:hover:not(.is-disabled) {
  background: linear-gradient(135deg, #f4979f 0%, #ea7d88 100%);
  box-shadow: 0 10px 20px rgba(234, 125, 136, 0.22);
}

.checkin-btn:hover:not(.is-disabled) {
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  box-shadow: 0 10px 20px rgba(232, 144, 157, 0.2);
}

.checkout-btn:hover:not(.is-disabled) {
  background: linear-gradient(135deg, #59c7a3 0%, #33a984 100%);
  box-shadow: 0 10px 20px rgba(51, 169, 132, 0.2);
}

.pagination-container {
  padding: 18px 24px;
}

.pagination-container :deep(.el-pagination .btn-next),
.pagination-container :deep(.el-pagination .btn-prev),
.pagination-container :deep(.el-pagination .el-pager li) {
  border-radius: 12px;
}

.pagination-container :deep(.el-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  color: #ffffff;
}

.reservation-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.dialog-header {
  padding: 26px 30px 18px;
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.32), transparent 26%),
    linear-gradient(145deg, rgba(254, 248, 249, 0.96) 0%, #ffffff 62%);
}

.dialog-title-icon {
  border-radius: 16px;
  background: rgba(252, 228, 232, 0.36);
}

.dialog-title-text {
  font-size: 22px;
  color: #7a4052;
}

.dialog-content {
  padding: 0 30px 18px;
}

.reservation-descriptions {
  border-radius: 22px;
}

.dialog-footer {
  padding: 0 30px 30px;
  background: transparent;
  border-top: none;
}

.dialog-footer .cancel-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  color: #8e717b;
  border: 1px solid rgba(245, 183, 192, 0.18);
  background: #ffffff;
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

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .header-content,
  .toolbar,
  .pagination-container {
    padding: 18px;
  }

  .page-title {
    font-size: 28px;
  }

  .table-container {
    padding: 6px;
    border-radius: 22px;
    overflow-x: auto;
  }

  .reservation-table {
    min-width: 900px;
  }

  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>