<template>
  <div class="violation-report-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="eyebrow">Violation Workflow</span>
        <h1>违规记录上报</h1>
        <p>上报当前负责场地下的预约违规记录，包括违规用户、违规预约、违规时间等。</p>
      </div>
      
    </section>

    <section class="content-grid">
      <el-card class="panel-card">
        <template #header>
          <div class="panel-header">
            <div>
              <h2>新增违规</h2>
              <p>先选用户，再选择该用户在你负责场地下的预约。</p>
            </div>
          </div>
        </template>

        <el-form
          ref="violationFormRef"
          :model="violationForm"
          :rules="violationRules"
          label-position="top"
          class="violation-form"
        >
          <el-form-item label="违规用户" prop="userId">
            <el-select
              v-model="violationForm.userId"
              placeholder="选择可上报用户"
              filterable
              clearable
              style="width: 100%"
              @change="handleUserChange"
            >
              <el-option
                v-for="user in userList"
                :key="user.id"
                :label="formatUserLabel(user)"
                :value="user.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="关联预约" prop="reservationId">
            <el-select
              v-model="violationForm.reservationId"
              placeholder="选择该用户在你负责场地的预约"
              filterable
              clearable
              style="width: 100%"
              :disabled="!violationForm.userId"
            >
              <el-option
                v-for="reservation in userReservations"
                :key="reservation.id"
                :label="formatReservationLabel(reservation)"
                :value="reservation.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="违规类型" prop="violationType">
            <el-select
              v-model="violationForm.violationType"
              placeholder="选择违规类型"
              style="width: 100%"
            >
              <el-option
                v-for="item in violationTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="违规描述" prop="description">
            <el-input
              v-model="violationForm.description"
              type="textarea"
              :rows="4"
              maxlength="300"
              show-word-limit
              placeholder="描述违规情况，包括时间、地点、具体行为等"
            />
          </el-form-item>

          <el-form-item label="扣分" prop="points">
            <el-input-number
              v-model="violationForm.points"
              :min="1"
              :max="100"
              placeholder="扣除信用分数"
              style="width: 100%"
            />
          </el-form-item>

          <div class="form-actions">
            <el-button type="primary" :loading="submitLoading" @click="submitViolation">
              提交违规上报
            </el-button>
            <el-button @click="resetForm">重置表单</el-button>
          </div>
        </el-form>
      </el-card>

      <section>
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>违规记录</h2>
                <p>当前负责场地下的已上报违规记录列表。</p>
              </div>
              <div class="panel-tools">
                <el-input
                  v-model="searchDescription"
                  placeholder="搜索违规描述"
                  clearable
                  class="search-input"
                  @keyup.enter="searchViolations"
                  @clear="resetSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button type="primary" @click="searchViolations">搜索</el-button>
              </div>
            </div>
          </template>

          <el-table :data="violationRecords" v-loading="loading" stripe class="records-table">
            <el-table-column label="用户" min-width="120">
              <template #default="{ row }">
                {{ row.userName || row.user?.realName || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="违规类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getViolationTypeTag(row.violationType)" effect="light">
                  {{ getViolationTypeText(row.violationType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="扣分" width="80" align="center">
              <template #default="{ row }">
                <span class="points-text">{{ row.points }}</span>
              </template>
            </el-table-column>
            <el-table-column label="描述" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.description || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="上报时间" width="170">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="viewDetails(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && !violationRecords.length" description="当前暂无违规记录" />

          <div class="pagination-wrap" v-if="total > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </section>
    </section>

    <el-dialog v-model="detailDialogVisible" title="违规详情" width="600px">
      <div v-if="currentViolation" class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">用户</span>
          <strong>{{ currentViolation.userName || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">违规类型</span>
          <strong>{{ getViolationTypeText(currentViolation.violationType) }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">扣分</span>
          <strong>{{ currentViolation.points }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">上报时间</span>
          <strong>{{ formatDateTime(currentViolation.createTime) }}</strong>
        </div>
        <div class="detail-item full">
          <span class="detail-label">违规描述</span>
          <p>{{ currentViolation.description || '暂无描述' }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { violationAPI } from '../../api'
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme(userInfo.role || 'maintainer'))
}))

const violationFormRef = ref(null)
const submitLoading = ref(false)
const loading = ref(false)
const userList = ref([])
const userReservations = ref([])
const violationRecords = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchDescription = ref('')
const detailDialogVisible = ref(false)
const currentViolation = ref(null)

const violationForm = reactive({
  userId: null,
  reservationId: null,
  violationType: '',
  description: '',
  points: 1
})

const violationRules = {
  userId: [{ required: true, message: '请选择违规用户', trigger: 'change' }],
  reservationId: [{ required: true, message: '请选择关联预约', trigger: 'change' }],
  violationType: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  description: [
    { required: true, message: '请输入违规描述', trigger: 'blur' },
    { max: 300, message: '描述不能超过 300 个字', trigger: 'blur' }
  ],
  points: [
    { required: true, message: '请设置扣分数值', trigger: 'blur' }
  ]
}

const violationTypeOptions = [
  { value: 'DAMAGE', label: '设备损坏' },
  { value: 'OVERDUE', label: '超时使用' },
  { value: 'NO_SHOW', label: '爽约' },
  { value: 'CANCEL_FREQ', label: '频繁取消' },
  { value: 'OTHER', label: '其他违规' }
]

onMounted(() => {
  loadUsers()
  loadViolationRecords()
})

const loadUsers = async () => {
  try {
    const response = await violationAPI.getReportableUsers()
    userList.value = response.data || []
  } catch (error) {
    console.error('加载可上报用户失败:', error)
    ElMessage.error('加载可上报用户失败')
  }
}

const handleUserChange = async (userId) => {
  violationForm.reservationId = null
  userReservations.value = []

  if (!userId) return

  try {
    const response = await violationAPI.getUserReservations(userId)
    userReservations.value = response.data || []
  } catch (error) {
    console.error('加载用户预约失败:', error)
    ElMessage.error('加载用户预约失败')
  }
}

const submitViolation = async () => {
  try {
    await violationFormRef.value.validate()
    submitLoading.value = true

    await violationAPI.create(violationForm)
    ElMessage.success('违规上报成功')
    resetForm()
    loadViolationRecords()
  } catch (error) {
    if (error?.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error.message !== 'Validation failed') {
      console.error('提交违规失败:', error)
      ElMessage.error('提交违规失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const resetForm = () => {
  violationForm.userId = null
  violationForm.reservationId = null
  violationForm.violationType = ''
  violationForm.description = ''
  violationForm.points = 1
  userReservations.value = []
  violationFormRef.value?.resetFields()
}

const loadViolationRecords = async () => {
  try {
    loading.value = true
    const response = await violationAPI.list({
      page: currentPage.value - 1,
      size: pageSize.value,
      description: searchDescription.value || undefined
    })
    const pageData = response.data || {}
    violationRecords.value = pageData.content || []
    total.value = pageData.totalElements || 0
  } catch (error) {
    console.error('加载违规记录失败:', error)
    ElMessage.error('加载违规记录失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  searchDescription.value = ''
  currentPage.value = 1
  loadUsers()
  loadViolationRecords()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadViolationRecords()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadViolationRecords()
}

const viewDetails = (record) => {
  currentViolation.value = record
  detailDialogVisible.value = true
}

const formatUserLabel = (user) => {
  const roleMap = {
    USER: '用户',
    STUDENT: '学生',
    TEACHER: '教师'
  }
  const name = user.realName || user.username || '未知用户'
  return `${name} (${roleMap[user.role] || user.role || '用户'})`
}

const formatReservationLabel = (reservation) => {
  const facility = reservation.facilityName || `场地 #${reservation.facilityId}`
  return `${facility} · ${formatDateTime(reservation.startTime)}`
}

const getViolationTypeText = (type) => {
  const map = {
    DAMAGE: '设备损坏',
    OVERDUE: '超时使用',
    NO_SHOW: '爽约',
    CANCEL_FREQ: '频繁取消',
    OTHER: '其他违规'
  }
  return map[type] || type || '-'
}

const getViolationTypeTag = (type) => {
  const map = {
    DAMAGE: 'danger',
    OVERDUE: 'warning',
    NO_SHOW: 'info',
    CANCEL_FREQ: '',
    OTHER: ''
  }
  return map[type] || ''
}

const searchViolations = () => {
  currentPage.value = 1
  loadViolationRecords()
}

const resetSearch = () => {
  searchDescription.value = ''
  currentPage.value = 1
  loadViolationRecords()
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
</script>

<style scoped>
.violation-report-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, var(--feature-soft), transparent 28%),
    linear-gradient(180deg, var(--layout-shell-top) 0%, var(--layout-shell-bottom) 100%);
}

.page-hero {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--feature-soft);
  box-shadow: 0 24px 60px var(--feature-glow);
}

.eyebrow {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--feature-soft);
  color: var(--feature-primary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 14px 0 10px;
  font-size: 32px;
  line-height: 1.15;
  color: #0f172a;
}

.hero-copy p {
  margin: 0;
  color: #5b6470;
  line-height: 1.7;
}

.hero-tips {
  display: grid;
  gap: 14px;
}

.tip-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 110px;
  padding: 18px 20px;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--feature-surface) 0%, #ffffff 100%);
  border: 1px solid var(--feature-soft);
}

.tip-label {
  font-size: 13px;
  color: #6b7280;
}

.tip-card strong {
  margin-top: 10px;
  color: #0f172a;
  font-size: 18px;
}

.tip-action-card {
  align-items: flex-start;
}

.tip-refresh-btn {
  margin-top: 12px;
  min-height: 40px;
  border-radius: 14px;
  border-color: var(--feature-border);
  color: var(--feature-primary);
  background: rgba(255, 255, 255, 0.92);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 20px;
  margin-top: 22px;
}

.panel-card {
  border: none;
  border-radius: 26px;
  box-shadow: 0 20px 45px rgba(17, 24, 39, 0.08);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.panel-header p {
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
}

.panel-tools {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 220px;
}

.violation-form {
  padding-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.points-text {
  font-weight: 700;
  color: var(--feature-primary);
}

.records-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%) !important;
}

.records-table :deep(.el-table::before),
.records-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
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

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .violation-report-page {
    padding: 16px;
  }

  .page-hero {
    grid-template-columns: 1fr;
    padding: 22px;
  }

  .panel-header {
    flex-direction: column;
  }

  .panel-tools,
  .search-input {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
