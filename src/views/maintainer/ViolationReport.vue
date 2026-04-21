<template>
  <div class="violation-report-page">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="eyebrow">Violation Workflow</span>
        <h1>违规记录上报</h1>
        <p>只展示和处理当前负责人场地下的预约违规，避免跨场地误操作。</p>
      </div>

      <div class="hero-tips">
        <div class="tip-card">
          <span class="tip-label">上报范围</span>
          <strong>仅限本人负责场地</strong>
        </div>
        <div class="tip-card">
          <span class="tip-label">处理对象</span>
          <strong>必须关联预约记录</strong>
        </div>
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

          <el-form-item label="处罚分值" prop="penaltyPoints">
            <el-input-number
              v-model="violationForm.penaltyPoints"
              :min="1"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="违规描述" prop="description">
            <el-input
              v-model="violationForm.description"
              type="textarea"
              :rows="5"
              maxlength="500"
              show-word-limit
              placeholder="填写现场情况、时间、行为经过和处理依据"
            />
          </el-form-item>

          <div class="form-actions">
            <el-button type="primary" :loading="submitting" @click="submitViolation">
              提交上报
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </div>
        </el-form>
      </el-card>

      <el-card class="panel-card">
        <template #header>
          <div class="panel-header">
            <div>
              <h2>可处理违规记录</h2>
              <p>当前列表仅包含你负责场地对应的预约违规。</p>
            </div>

            <div class="panel-tools">
              <el-input
                v-model="searchDescription"
                placeholder="按描述筛选当前页"
                clearable
                class="search-input"
              />
              <el-button @click="refreshData">刷新</el-button>
            </div>
          </div>
        </template>

        <el-table :data="filteredRecords" v-loading="loading" stripe>
          <el-table-column prop="userName" label="违规用户" min-width="120" />
          <el-table-column prop="facilityName" label="所属场地" min-width="150" />
          <el-table-column prop="violationType" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getViolationTypeTag(row.violationType)" effect="light">
                {{ getViolationTypeText(row.violationType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="penaltyPoints" label="处罚" width="90" align="center">
            <template #default="{ row }">
              <span class="points-text">-{{ row.penaltyPoints || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reportedTime" label="上报时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.reportedTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewDetails(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </section>

    <el-dialog v-model="detailDialogVisible" title="违规详情" width="640px">
      <div v-if="currentViolation" class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">违规用户</span>
          <strong>{{ currentViolation.userName || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">所属场地</span>
          <strong>{{ currentViolation.facilityName || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">预约编号</span>
          <strong>#{{ currentViolation.reservationId || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">违规类型</span>
          <strong>{{ getViolationTypeText(currentViolation.violationType) }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">处罚分值</span>
          <strong>{{ currentViolation.penaltyPoints || 0 }} 分</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">状态</span>
          <strong>{{ getStatusText(currentViolation.status) }}</strong>
        </div>
        <div class="detail-item full">
          <span class="detail-label">违规描述</span>
          <p>{{ currentViolation.description || '-' }}</p>
        </div>
        <div class="detail-item">
          <span class="detail-label">上报人</span>
          <strong>{{ currentViolation.reporterName || '系统记录' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">上报时间</span>
          <strong>{{ formatDateTime(currentViolation.reportedTime) }}</strong>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { reservationAPI, userAPI } from '@/api'
import { violationAPI } from '@/api/violation'

const violationFormRef = ref()

const violationForm = reactive({
  userId: null,
  reservationId: null,
  violationType: '',
  penaltyPoints: 5,
  description: ''
})

const violationRules = {
  userId: [{ required: true, message: '请选择违规用户', trigger: 'change' }],
  reservationId: [{ required: true, message: '请选择关联预约', trigger: 'change' }],
  violationType: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  penaltyPoints: [{ required: true, message: '请填写处罚分值', trigger: 'change' }],
  description: [{ required: true, message: '请填写违规描述', trigger: 'blur' }]
}

const violationTypeOptions = [
  { label: '设备损坏', value: 'DAMAGE' },
  { label: '超时使用', value: 'OVERDUE' },
  { label: '其他违规', value: 'OTHER' }
]

const userList = ref([])
const userReservations = ref([])
const violationRecords = ref([])
const loading = ref(false)
const submitting = ref(false)
const searchDescription = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailDialogVisible = ref(false)
const currentViolation = ref(null)

const filteredRecords = computed(() => {
  const keyword = searchDescription.value.trim().toLowerCase()
  if (!keyword) {
    return violationRecords.value
  }
  return violationRecords.value.filter((item) =>
    (item.description || '').toLowerCase().includes(keyword)
  )
})

onMounted(() => {
  loadUsers()
  loadViolationRecords()
})

const loadUsers = async () => {
  try {
    const response = await userAPI.getReportableUsers()
    userList.value = response.data || []
  } catch (error) {
    console.error('加载可上报用户失败:', error)
    ElMessage.error('加载可上报用户失败')
  }
}

const handleUserChange = async (userId) => {
  violationForm.reservationId = null

  if (!userId) {
    userReservations.value = []
    return
  }

  try {
    const response = await reservationAPI.getByUserId(userId)
    userReservations.value = (response.data || []).filter((item) => !!item.id)
  } catch (error) {
    console.error('加载预约记录失败:', error)
    userReservations.value = []
    ElMessage.error('加载预约记录失败')
  }
}

const submitViolation = async () => {
  try {
    await violationFormRef.value.validate()
    submitting.value = true

    await violationAPI.reportViolation({
      ...violationForm,
      reportedTime: formatDateTimeForBackend(new Date())
    })

    ElMessage.success('违规记录上报成功')
    resetForm()
    loadUsers()
    loadViolationRecords()
  } catch (error) {
    if (error?.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('违规记录上报失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  violationFormRef.value?.resetFields()
  violationForm.userId = null
  violationForm.reservationId = null
  violationForm.violationType = ''
  violationForm.penaltyPoints = 5
  violationForm.description = ''
  userReservations.value = []
}

const loadViolationRecords = async () => {
  try {
    loading.value = true
    const response = await violationAPI.getMaintainerViolations({
      page: currentPage.value - 1,
      size: pageSize.value
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
    NO_SHOW: 'danger',
    CANCEL_FREQ: 'info',
    OTHER: ''
  }
  return map[type] || ''
}

const getStatusType = (status) => {
  const map = {
    PENDING: 'warning',
    PROCESSED: 'success',
    REJECTED: 'info',
    REVOKED: 'danger'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    PENDING: '待处理',
    PROCESSED: '已生效',
    REJECTED: '已驳回',
    REVOKED: '已撤销'
  }
  return map[status] || status || '-'
}

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const formatDateTimeForBackend = (date) => {
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
    radial-gradient(circle at top left, rgba(255, 176, 124, 0.18), transparent 28%),
    linear-gradient(180deg, #fff8f2 0%, #fffdfb 48%, #fff7ef 100%);
}

.page-hero {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(224, 153, 93, 0.18);
  box-shadow: 0 24px 60px rgba(177, 111, 43, 0.12);
}

.eyebrow {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(201, 110, 44, 0.12);
  color: #b85c26;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 14px 0 10px;
  font-size: 32px;
  line-height: 1.15;
  color: #2d1608;
}

.hero-copy p {
  margin: 0;
  color: #7a5a47;
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
  background: linear-gradient(135deg, #fff1e4 0%, #fffaf4 100%);
  border: 1px solid rgba(211, 132, 69, 0.14);
}

.tip-label {
  font-size: 13px;
  color: #9a7557;
}

.tip-card strong {
  margin-top: 10px;
  color: #552910;
  font-size: 18px;
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
  box-shadow: 0 20px 45px rgba(67, 37, 17, 0.08);
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
  color: #2d1608;
}

.panel-header p {
  margin: 8px 0 0;
  color: #8a6a54;
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
  color: #b53f2b;
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
  background: #fff7f0;
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  display: block;
  margin-bottom: 10px;
  color: #9a7557;
  font-size: 12px;
}

.detail-item strong,
.detail-item p {
  margin: 0;
  color: #2d1608;
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
