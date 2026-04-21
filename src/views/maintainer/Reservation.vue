<template>
  <div class="maintainer-reservation-page">
    <div class="page-header">
      <div class="header-decoration"></div>
      <div class="header-content">
        <div>
          <h1 class="page-title">
            <span class="title-icon">
              <el-icon><Calendar /></el-icon>
            </span>
            预约处理
          </h1>
          <p class="page-subtitle">设施管理员负责已绑定设施的预约审核、现场核销与状态跟踪。</p>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">预约总数</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">待审核</div>
        <div class="stat-value">{{ stats.pending }}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">已通过</div>
        <div class="stat-value">{{ stats.approved }}</div>
      </div>
      <div class="stat-card info">
        <div class="stat-label">已完成</div>
        <div class="stat-value">{{ stats.completed }}</div>
      </div>
    </div>

    <div class="toolbar-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待审核" name="PENDING" />
        <el-tab-pane label="已通过" name="APPROVED" />
        <el-tab-pane label="已完成" name="COMPLETED" />
        <el-tab-pane label="已拒绝" name="REJECTED" />
        <el-tab-pane label="全部" name="ALL" />
      </el-tabs>

      <div class="toolbar">
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
    </div>

    <div class="table-card">
      <el-table :data="reservationList" v-loading="loading" stripe @row-click="handleRowClick">
        <el-table-column prop="facilityName" label="设施名称" min-width="150" />
        <el-table-column prop="userName" label="申请人" min-width="120" />
        <el-table-column prop="startTime" label="开始时间" min-width="170" />
        <el-table-column prop="endTime" label="结束时间" min-width="170" />
        <el-table-column prop="purpose" label="用途" min-width="180" show-overflow-tooltip />
        <el-table-column prop="verificationCode" label="核销码" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.verificationCode" type="info" effect="plain">{{ row.verificationCode }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="checkinStatus" label="签到状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getCheckinStatusType(row.checkinStatus)">{{ getCheckinStatusText(row.checkinStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="预约状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="row.status === 'PENDING'"
                size="small"
                type="success"
                plain
                @click.stop="handleApprove(row)"
              >
                通过
              </el-button>
              <el-button
                v-if="row.status === 'PENDING'"
                size="small"
                type="danger"
                plain
                @click.stop="handleReject(row)"
              >
                拒绝
              </el-button>
              <el-button
                v-if="canVerify(row)"
                size="small"
                type="warning"
                plain
                @click.stop="handleVerify(row)"
              >
                {{ getVerifyActionText(row) }}
              </el-button>
              <el-button size="small" type="primary" plain @click.stop="handleRowClick(row)">
                查看
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

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
    </div>

    <el-dialog v-model="detailDialogVisible" title="预约详情" width="760px">
      <el-descriptions v-if="currentRow" :column="2" border>
        <el-descriptions-item label="设施名称">{{ currentRow.facilityName }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentRow.userName }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ currentRow.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ currentRow.endTime }}</el-descriptions-item>
        <el-descriptions-item label="预约状态">
          <el-tag :type="getStatusType(currentRow.status)">{{ getStatusText(currentRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="签到状态">
          <el-tag :type="getCheckinStatusType(currentRow.checkinStatus)">{{ getCheckinStatusText(currentRow.checkinStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRow.verificationCode" label="核销码">
          <el-tag type="info" effect="plain">{{ currentRow.verificationCode }}</el-tag>
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
        <el-descriptions-item label="用途" :span="2">
          {{ currentRow.purpose || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="审核备注" :span="2">
          {{ currentRow.adminRemark || '无' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="auditDialogVisible" :title="auditDialogTitle" width="560px">
      <el-form ref="formRef" :model="auditForm" :rules="rules" label-width="90px">
        <el-form-item label="设施名称">
          <el-input :model-value="currentRow?.facilityName" disabled />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input :model-value="currentRow?.userName" disabled />
        </el-form-item>
        <el-form-item label="备注" prop="adminRemark">
          <el-input
            v-model="auditForm.adminRemark"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入审核意见或补充说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verifyDialogVisible" :title="verifyDialogTitle" width="420px">
      <div class="verify-info" v-if="currentRow">
        <p>设施：{{ currentRow.facilityName }}</p>
        <p>申请人：{{ currentRow.userName }}</p>
        <p>状态：{{ getCheckinStatusText(currentRow.checkinStatus) }}</p>
      </div>
      <el-form>
        <el-form-item label="核销码" label-width="80px">
          <el-input
            v-model="verifyForm.verificationCode"
            maxlength="8"
            show-word-limit
            placeholder="请输入用户提供的核销码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifyLoading" @click="handleVerifySubmit">确认核销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Search } from '@element-plus/icons-vue'
import { reservationAPI } from '../../api'
import { formatActionMessage } from '../../utils/messageText'

const loading = ref(false)
const submitLoading = ref(false)
const verifyLoading = ref(false)
const activeTab = ref('PENDING')
const searchKeyword = ref('')
const isSearchMode = ref(false)
const reservationList = ref([])
const allReservations = ref([])
const total = ref(0)
const detailDialogVisible = ref(false)
const auditDialogVisible = ref(false)
const verifyDialogVisible = ref(false)
const auditDialogTitle = ref('审核预约')
const verifyDialogTitle = ref('现场核销')
const currentRow = ref(null)
const actionType = ref('approve')
const formRef = ref(null)
const pagination = ref({
  page: 1,
  size: 10
})
const auditForm = ref({
  adminRemark: ''
})
const verifyForm = ref({
  verificationCode: ''
})

const rules = {
  adminRemark: [
    { max: 200, message: '备注不能超过 200 个字符', trigger: 'blur' }
  ]
}

const stats = computed(() => ({
  total: allReservations.value.length,
  pending: allReservations.value.filter(item => item.status === 'PENDING').length,
  approved: allReservations.value.filter(item => item.status === 'APPROVED').length,
  completed: allReservations.value.filter(item => item.status === 'COMPLETED').length
}))

onMounted(() => {
  loadReservationList()
})

const loadReservationList = async () => {
  try {
    loading.value = true
    const res = await reservationAPI.list()
    const source = Array.isArray(res.data) ? res.data : []
    allReservations.value = source

    let filtered = source
    if (activeTab.value !== 'ALL') {
      filtered = filtered.filter(item => item.status === activeTab.value)
    }

    if (isSearchMode.value && searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      filtered = filtered.filter(item =>
        (item.facilityName && item.facilityName.toLowerCase().includes(keyword)) ||
        (item.userName && item.userName.toLowerCase().includes(keyword))
      )
    }

    total.value = filtered.length
    const startIndex = (pagination.value.page - 1) * pagination.value.size
    const endIndex = startIndex + pagination.value.size
    reservationList.value = filtered.slice(startIndex, endIndex)
  } catch (error) {
    console.error('加载预约列表失败:', error)
    ElMessage.error('加载预约列表失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  pagination.value.page = 1
  loadReservationList()
}

const handleSearch = () => {
  pagination.value.page = 1
  isSearchMode.value = Boolean(searchKeyword.value.trim())
  loadReservationList()
}

const handleClearSearch = () => {
  searchKeyword.value = ''
  isSearchMode.value = false
  pagination.value.page = 1
  loadReservationList()
}

const handleSizeChange = size => {
  pagination.value.size = size
  pagination.value.page = 1
  loadReservationList()
}

const handleCurrentChange = page => {
  pagination.value.page = page
  loadReservationList()
}

const handleRowClick = row => {
  currentRow.value = row
  detailDialogVisible.value = true
}

const handleApprove = row => {
  currentRow.value = row
  actionType.value = 'approve'
  auditDialogTitle.value = '审核通过'
  auditForm.value = { adminRemark: '' }
  auditDialogVisible.value = true
}

const handleReject = row => {
  currentRow.value = row
  actionType.value = 'reject'
  auditDialogTitle.value = '拒绝预约'
  auditForm.value = { adminRemark: '' }
  auditDialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitLoading.value = true

    if (actionType.value === 'approve') {
      await reservationAPI.approve(currentRow.value.id, auditForm.value)
      ElMessage.success('预约审核已通过')
    } else {
      await reservationAPI.reject(currentRow.value.id, auditForm.value)
      ElMessage.success('预约已拒绝')
    }

    auditDialogVisible.value = false
    await loadReservationList()
  } catch (error) {
    console.error('提交审核失败:', error)
    ElMessage.error(formatActionMessage('提交审核失败', error.response?.data?.message, '提交审核失败，请稍后重试。'))
  } finally {
    submitLoading.value = false
  }
}

const handleVerify = row => {
  currentRow.value = row
  verifyDialogTitle.value = getVerifyActionText(row)
  verifyForm.value = {
    verificationCode: row.verificationCode || ''
  }
  verifyDialogVisible.value = true
}

const handleVerifySubmit = async () => {
  const code = verifyForm.value.verificationCode.trim()
  if (!code) {
    ElMessage.warning('请输入核销码')
    return
  }

  try {
    verifyLoading.value = true
    await reservationAPI.verify(currentRow.value.id, code)
    ElMessage.success('现场核销成功')
    verifyDialogVisible.value = false
    await loadReservationList()
  } catch (error) {
    console.error('现场核销失败:', error)
    ElMessage.error(formatActionMessage('现场核销失败', error.response?.data?.message, '现场核销失败，请稍后重试。'))
  } finally {
    verifyLoading.value = false
  }
}

const canVerify = row => (
  row.status === 'APPROVED' &&
  ['NOT_CHECKED', 'CHECKED_IN'].includes(row.checkinStatus) &&
  Boolean(row.verificationCode)
)

const getVerifyActionText = row => (
  row.checkinStatus === 'CHECKED_IN' ? '核销签退' : '核销签到'
)

const getStatusType = status => ({
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  COMPLETED: 'info',
  CANCELLED: 'info'
}[status] || '')

const getStatusText = status => ({
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}[status] || status)

const getCheckinStatusType = status => ({
  NOT_CHECKED: 'info',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'success',
  MISSED: 'danger'
}[status] || '')

const getCheckinStatusText = status => ({
  NOT_CHECKED: '未签到',
  CHECKED_IN: '已签到',
  CHECKED_OUT: '已签退',
  MISSED: '失约'
}[status] || status)
</script>

<style scoped>
.maintainer-reservation-page {
  min-height: calc(100vh - 88px);
}

.page-header,
.toolbar-card,
.table-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.page-header {
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
}

.header-decoration {
  height: 4px;
  background: linear-gradient(90deg, #0f766e, #14b8a6, #f59e0b);
}

.header-content {
  padding: 28px 32px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: #0f172a;
  font-size: 28px;
}

.title-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ccfbf1, #99f6e4);
  color: #0f766e;
}

.page-subtitle {
  margin: 10px 0 0 60px;
  color: #64748b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 22px 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.12);
}

.stat-card.warning {
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  box-shadow: 0 10px 24px rgba(245, 158, 11, 0.14);
}

.stat-card.success {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.14);
}

.stat-card.info {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  box-shadow: 0 10px 24px rgba(100, 116, 139, 0.14);
}

.stat-label {
  color: #475569;
  font-size: 14px;
}

.stat-value {
  margin-top: 10px;
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
}

.toolbar-card {
  padding: 20px 24px;
  margin-bottom: 24px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
}

.search-input {
  max-width: 420px;
}

.table-card {
  padding: 16px 16px 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 20px 0 8px;
}

.verify-info {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  color: #334155;
}

.verify-info p {
  margin: 6px 0;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    margin-left: 0;
  }
}
</style>
