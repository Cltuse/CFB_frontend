<template>
  <div class="page-shell reservation-theme">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="eyebrow">Reservation</span>
        <h1>预约处理</h1>
        <p>管理本人负责设施的预约审核、签到核销、签退流程。</p>        
      </div>      
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">预约总数</span>
        <strong>{{ stats.total }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">待审核</span>
        <strong>{{ stats.pending }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">可核销</span>
        <strong>{{ verifyReadyCount }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">已完成</span>
        <strong>{{ stats.completed }}</strong>
      </article>
    </section>

    <section class="control-card">
      <div class="control-copy">
        <h2>预约筛选</h2>
        <p>把状态切换、关键词检索和当前结果汇总放在一层，减少来回滚动和跳转。</p>
      </div>

      <div class="control-actions">
        <div class="filter-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['filter-chip', { active: activeTab === tab.value }]"
            type="button"
            @click="changeTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="search-group">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索设施名称或申请人"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
            @clear="handleClearSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-header">
        <div>
          <h2>预约列表</h2>
          <p>当前筛选结果 {{ filteredList.length }} 条，支持审核、核销和详情查看。</p>
        </div>
      </div>

      <el-table :data="pagedList" v-loading="loading" stripe class="reservation-table">
        <el-table-column label="设施信息" min-width="220">
          <template #default="{ row }">
            <div class="facility-cell">
              <div class="facility-avatar">
                {{ getFacilityInitial(row.facilityName) }}
              </div>
              <div class="facility-meta">
                <strong>{{ row.facilityName || '-' }}</strong>
                <span>{{ row.verificationCode ? `核销码 ${row.verificationCode}` : '待生成核销码' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="申请人" min-width="140">
          <template #default="{ row }">
            <div class="applicant-cell">
              <strong>{{ row.userName || '-' }}</strong>
              <span>{{ row.phone || '未登记联系方式' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="预约时间" min-width="220">
          <template #default="{ row }">
            <div class="time-stack">
              <span>{{ formatDateTime(row.startTime) }}</span>
              <small>{{ formatDateTime(row.endTime) }} 结束</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="用途" min-width="180" show-overflow-tooltip />
        <el-table-column label="签到状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getCheckinStatusType(row.checkinStatus)" effect="light">
              {{ getCheckinStatusText(row.checkinStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预约状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button
                v-if="row.status === 'PENDING'"
                class="action-btn success-btn"
                @click.stop="openAuditDialog(row, 'approve')"
              >
                通过
              </el-button>
              <el-button
                v-if="row.status === 'PENDING'"
                class="action-btn danger-btn"
                @click.stop="openAuditDialog(row, 'reject')"
              >
                驳回
              </el-button>
              <el-button v-if="canVerify(row)" class="action-btn warning-btn" @click.stop="openVerifyDialog(row)">
                {{ getVerifyActionText(row) }}
              </el-button>
              <el-button class="action-btn view-btn" @click.stop="openDetail(row)">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !filteredList.length" description="当前筛选条件下暂无预约记录" />

      <div class="pagination-wrap" v-if="filteredList.length">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredList.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog v-model="detailDialogVisible" title="预约详情" width="760px">
      <div v-if="currentRow" class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">设施名称</span>
          <strong>{{ currentRow.facilityName || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">申请人</span>
          <strong>{{ currentRow.userName || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">开始时间</span>
          <strong>{{ formatDateTime(currentRow.startTime) }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">结束时间</span>
          <strong>{{ formatDateTime(currentRow.endTime) }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">预约状态</span>
          <strong>{{ getStatusText(currentRow.status) }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">签到状态</span>
          <strong>{{ getCheckinStatusText(currentRow.checkinStatus) }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">核销码</span>
          <strong>{{ currentRow.verificationCode || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">核销人</span>
          <strong>{{ currentRow.verifiedByName || '-' }}</strong>
        </div>
        <div class="detail-item full">
          <span class="detail-label">预约用途</span>
          <p>{{ currentRow.purpose || '未填写' }}</p>
        </div>
        <div class="detail-item full">
          <span class="detail-label">审核备注</span>
          <p>{{ currentRow.adminRemark || '暂无备注' }}</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="auditDialogVisible"
      :title="auditAction === 'approve' ? '审核通过预约' : '驳回预约'"
      width="560px"
    >
      <el-form ref="formRef" :model="auditForm" :rules="rules" label-position="top">
        <el-form-item label="设施">
          <el-input :model-value="currentRow?.facilityName" disabled />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input :model-value="currentRow?.userName" disabled />
        </el-form-item>
        <el-form-item label="审核备注" prop="adminRemark">
          <el-input
            v-model="auditForm.adminRemark"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="填写审核意见或补充说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitAudit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verifyDialogVisible" :title="verifyDialogTitle" width="420px">
      <div class="verify-panel" v-if="currentRow">
        <p>{{ currentRow.facilityName }}</p>
        <span>{{ currentRow.userName }} · {{ getCheckinStatusText(currentRow.checkinStatus) }}</span>
      </div>
      <el-form label-position="top">
        <el-form-item label="核销码">
          <el-input
            v-model="verifyForm.verificationCode"
            maxlength="8"
            show-word-limit
            placeholder="输入用户提供的核销码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifyLoading" @click="submitVerify">确认核销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { reservationAPI } from '../../api'
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const theme = getRoleTheme(userInfo.role || 'maintainer')
const featureVars = buildFeatureVars(theme)

const tabs = [
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已驳回', value: 'REJECTED' },
  { label: '全部', value: 'ALL' }
]

const loading = ref(false)
const submitLoading = ref(false)
const verifyLoading = ref(false)
const activeTab = ref('PENDING')
const searchKeyword = ref('')
const isSearchMode = ref(false)
const reservationList = ref([])
const currentRow = ref(null)
const detailDialogVisible = ref(false)
const auditDialogVisible = ref(false)
const verifyDialogVisible = ref(false)
const verifyDialogTitle = ref('现场核销')
const auditAction = ref('approve')
const currentPage = ref(1)
const pageSize = ref(10)
const formRef = ref(null)

const auditForm = reactive({
  adminRemark: ''
})

const verifyForm = reactive({
  verificationCode: ''
})

const rules = {
  adminRemark: [{ max: 200, message: '备注不能超过 200 个字', trigger: 'blur' }]
}

const stats = computed(() => ({
  total: reservationList.value.length,
  pending: reservationList.value.filter((item) => item.status === 'PENDING').length,
  approved: reservationList.value.filter((item) => item.status === 'APPROVED').length,
  completed: reservationList.value.filter((item) => item.status === 'COMPLETED').length
}))

const verifyReadyCount = computed(() =>
  reservationList.value.filter((item) => canVerify(item)).length
)

const filteredList = computed(() => {
  let list = [...reservationList.value]

  if (activeTab.value !== 'ALL') {
    list = list.filter((item) => item.status === activeTab.value)
  }

  if (isSearchMode.value && searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    list = list.filter((item) =>
      (item.facilityName || '').toLowerCase().includes(keyword) ||
      (item.userName || '').toLowerCase().includes(keyword)
    )
  }

  return list
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

onMounted(() => {
  loadReservationList()
})

const loadReservationList = async () => {
  try {
    loading.value = true
    const response = await reservationAPI.list()
    reservationList.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('加载预约列表失败:', error)
    ElMessage.error('加载预约列表失败')
  } finally {
    loading.value = false
  }
}

const changeTab = (value) => {
  activeTab.value = value
  currentPage.value = 1
}

const handleSearch = () => {
  isSearchMode.value = Boolean(searchKeyword.value.trim())
  currentPage.value = 1
}

const handleClearSearch = () => {
  searchKeyword.value = ''
  isSearchMode.value = false
  currentPage.value = 1
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const openDetail = (row) => {
  currentRow.value = row
  detailDialogVisible.value = true
}

const openAuditDialog = (row, action) => {
  currentRow.value = row
  auditAction.value = action
  auditForm.adminRemark = ''
  auditDialogVisible.value = true
}

const submitAudit = async () => {
  try {
    await formRef.value?.validate()
    submitLoading.value = true

    if (auditAction.value === 'approve') {
      await reservationAPI.approve(currentRow.value.id, { ...auditForm })
      ElMessage.success('预约已审核通过')
    } else {
      await reservationAPI.reject(currentRow.value.id, { ...auditForm })
      ElMessage.success('预约已驳回')
    }

    auditDialogVisible.value = false
    loadReservationList()
  } catch (error) {
    console.error('提交审核失败:', error)
    ElMessage.error(resolveApiError(error, '提交审核失败'))
  } finally {
    submitLoading.value = false
  }
}

const openVerifyDialog = (row) => {
  currentRow.value = row
  verifyDialogTitle.value = getVerifyActionText(row)
  verifyForm.verificationCode = row.verificationCode || ''
  verifyDialogVisible.value = true
}

const submitVerify = async () => {
  if (!verifyForm.verificationCode.trim()) {
    ElMessage.warning('请输入核销码')
    return
  }

  try {
    verifyLoading.value = true
    await reservationAPI.verify(currentRow.value.id, verifyForm.verificationCode.trim())
    ElMessage.success('现场核销成功')
    verifyDialogVisible.value = false
    loadReservationList()
  } catch (error) {
    console.error('现场核销失败:', error)
    ElMessage.error(resolveApiError(error, '现场核销失败'))
  } finally {
    verifyLoading.value = false
  }
}

const canVerify = (row) =>
  row.status === 'APPROVED' &&
  ['NOT_CHECKED', 'CHECKED_IN'].includes(row.checkinStatus) &&
  Boolean(row.verificationCode)

const getVerifyActionText = (row) =>
  row.checkinStatus === 'CHECKED_IN' ? '核销签退' : '核销签到'

const getStatusType = (status) => ({
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  COMPLETED: 'info',
  CANCELLED: 'info'
}[status] || 'info')

const getStatusText = (status) => ({
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}[status] || status || '-')

const getCheckinStatusType = (status) => ({
  NOT_CHECKED: 'info',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'success',
  MISSED: 'danger'
}[status] || 'info')

const getCheckinStatusText = (status) => ({
  NOT_CHECKED: '未签到',
  CHECKED_IN: '已签到',
  CHECKED_OUT: '已签退',
  MISSED: '爽约'
}[status] || status || '-')

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const getFacilityInitial = (name) => {
  if (!name) {
    return '预'
  }
  return name.slice(0, 1)
}

const resolveApiError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback
</script>

<style scoped>
.reservation-theme {
  padding: 24px;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, var(--feature-soft), transparent 28%),
    linear-gradient(180deg, var(--layout-shell-top) 0%, var(--layout-shell-bottom) 100%);
}

.page-hero,
.control-card,
.panel-card {
  animation: rise-in 0.55s ease both;
}

.page-hero {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid var(--feature-soft);
  box-shadow: 0 24px 60px var(--feature-glow);
}

.eyebrow {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  min-height: 32px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--feature-soft);
  color: var(--feature-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 14px 0 10px;
  font-size: 32px;
  color: #0f172a;
}

.hero-copy p {
  margin: 0;
  color: #5b6470;
  line-height: 1.7;
  max-width: 760px;
}

.hero-copy {
  display: flex;
  flex-direction: column;
}

.hero-highlights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
  max-width: 520px;
}

.highlight-card,
.mini-card {
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid var(--feature-soft);
  background: linear-gradient(135deg, var(--feature-surface) 0%, #ffffff 100%);
}

.highlight-card {
  box-shadow: 0 12px 28px var(--feature-glow);
}

.highlight-card span,
.mini-card span,
.mini-card small {
  display: block;
  color: #6b7280;
}

.highlight-card small {
  display: block;
  margin-top: 8px;
  color: var(--feature-primary);
  font-size: 12px;
}

.highlight-card strong,
.mini-card strong {
  display: block;
  margin-top: 10px;
  color: #0f172a;
  font-size: 26px;
}

.mini-card small {
  margin-top: 8px;
  font-size: 12px;
}

.hero-aside {
  display: grid;
  gap: 14px;
}

.mini-card {
  min-height: 118px;
  box-shadow: 0 12px 28px var(--feature-glow);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.summary-card {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(17, 24, 39, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 46px rgba(17, 24, 39, 0.1);
}

.summary-label {
  color: #6b7280;
  font-size: 13px;
}

.summary-card strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  color: #0f172a;
}

.control-card,
.panel-card {
  margin-top: 20px;
  padding: 22px 24px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.08);
}

.control-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.control-copy h2,
.panel-header h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.control-copy p,
.panel-header p {
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
}

.control-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-end;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 18px;
  background: var(--feature-soft);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filter-chip {
  padding: 10px 14px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: var(--feature-primary);
  cursor: pointer;
  transition: all 0.25s ease;
}

.filter-chip.active {
  background: #ffffff;
  color: var(--feature-primary);
  box-shadow: 0 8px 18px var(--feature-glow);
}

.search-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.facility-cell,
.applicant-cell,
.facility-meta,
.time-stack {
  display: flex;
  flex-direction: column;
}

.facility-cell {
  flex-direction: row;
  align-items: center;
  gap: 14px;
}

.facility-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--feature-surface) 0%, var(--feature-soft) 100%);
  color: var(--feature-primary);
  font-weight: 700;
  flex-shrink: 0;
}

.facility-meta strong,
.applicant-cell strong {
  color: #0f172a;
}

.facility-meta span,
.applicant-cell span,
.time-stack small {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.row-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-item {
  padding: 16px;
  border-radius: 18px;
  background: var(--feature-surface);
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  display: block;
  margin-bottom: 10px;
  color: #6b7280;
  font-size: 12px;
}

.detail-item strong,
.detail-item p {
  margin: 0;
  color: #1f2937;
  line-height: 1.7;
}

.verify-panel {
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 18px;
  background: var(--feature-surface);
}

.verify-panel p {
  margin: 0 0 8px;
  color: #1f2937;
  font-weight: 700;
}

.verify-panel span {
  color: #6b7280;
}

.reservation-table :deep(.el-table__cell) {
  padding-top: 14px;
  padding-bottom: 14px;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-hero,
  .control-card {
    grid-template-columns: 1fr;
  }

  .control-card,
  .control-actions {
    align-items: stretch;
  }

  .hero-highlights {
    grid-template-columns: 1fr;
    max-width: 100%;
  }

  .search-group {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .reservation-theme {
    padding: 16px;
  }

  .summary-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
  }

  .search-group {
    flex-direction: column;
  }
}
</style>
