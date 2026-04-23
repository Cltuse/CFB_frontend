<template>
  <div class="page-shell maintenance-theme">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="eyebrow">维护流程</span>
        <h1>维护登记</h1>
        <p>统一管理本人负责场地的维护任务，保持创建、编辑、完成和详情查看都在同一操作节奏里。</p>
      </div>

      <div class="hero-aside">
        <div class="mini-card">
          <span>待处理</span>
          <strong>{{ stats.pending }}</strong>
        </div>
        <div class="mini-card">
          <span>进行中</span>
          <strong>{{ stats.inProgress }}</strong>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">总任务数</span>
        <strong>{{ stats.total }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">待处理</span>
        <strong>{{ stats.pending }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">进行中</span>
        <strong>{{ stats.inProgress }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">已完成</span>
        <strong>{{ stats.completed }}</strong>
      </article>
    </section>

    <section class="control-card">
      <div class="control-copy">
        <h2>任务筛选</h2>
        <p>和设施、预约、违规页保持同类布局一致，只保留高频筛选和核心动作。</p>
      </div>

      <div class="control-actions">
        <el-select v-model="maintenanceStatusFilter" clearable placeholder="维护完成度" @change="handleFilterChange">
          <el-option label="全部记录" value="" />
          <el-option label="已维护" value="MAINTAINED" />
          <el-option label="未维护" value="UNMAINTAINED" />
        </el-select>
        <el-select v-model="statusFilter" clearable placeholder="任务状态" @change="handleFilterChange">
          <el-option label="全部状态" value="" />
          <el-option label="待处理" value="PENDING" />
          <el-option label="进行中" value="IN_PROGRESS" />
          <el-option label="已完成" value="COMPLETED" />
          <el-option label="已取消" value="CANCELLED" />
        </el-select>
        <el-button type="primary" @click="openCreateDialog">新建维护</el-button>
      </div>
    </section>

    <section class="panel-card">
      <el-table :data="pagedList" v-loading="loading" stripe>
        <el-table-column prop="facilityName" label="场地" min-width="160" />
        <el-table-column label="维护类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getMaintenanceTypeTag(row.maintenanceType)" effect="light">
              {{ getMaintenanceTypeText(row.maintenanceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maintainer" label="负责人" min-width="110" />
        <el-table-column prop="description" label="维护描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="计划时间" min-width="210">
          <template #default="{ row }">
            <div class="time-stack">
              <span>{{ row.startTime ? formatDateTime(row.startTime) : '未安排开始时间' }}</span>
              <small>{{ row.endTime ? `结束：${formatDateTime(row.endTime)}` : '结束时间待定' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="费用" width="110" align="center">
          <template #default="{ row }">
            {{ formatCurrency(row.cost) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click.stop="openDetail(row)">查看</el-button>
              <el-button
                link
                type="success"
                :disabled="row.status === 'COMPLETED' || row.status === 'CANCELLED'"
                @click.stop="openEditDialog(row)"
              >
                编辑
              </el-button>
              <el-button
                link
                type="warning"
                :disabled="!['PENDING', 'IN_PROGRESS'].includes(row.status)"
                @click.stop="openCompleteDialog(row)"
              >
                完成
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

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

    <el-dialog v-model="detailDialogVisible" title="维护详情" width="700px">
      <div v-if="currentRow" class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">场地名称</span>
          <strong>{{ currentRow.facilityName || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">维护类型</span>
          <strong>{{ getMaintenanceTypeText(currentRow.maintenanceType) }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">负责人</span>
          <strong>{{ currentRow.maintainer || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">任务状态</span>
          <strong>{{ getStatusText(currentRow.status) }}</strong>
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
          <span class="detail-label">费用</span>
          <strong>{{ formatCurrency(currentRow.cost) }}</strong>
        </div>
        <div class="detail-item">
          <span class="detail-label">创建时间</span>
          <strong>{{ formatDateTime(currentRow.createdAt) }}</strong>
        </div>
        <div class="detail-item full">
          <span class="detail-label">维护描述</span>
          <p>{{ currentRow.description || '-' }}</p>
        </div>
        <div class="detail-item full">
          <span class="detail-label">处理结果</span>
          <p>{{ currentRow.result || '尚未填写' }}</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="editorDialogVisible"
      :title="editorMode === 'create' ? '新建维护登记' : '编辑维护登记'"
      width="620px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="场地" prop="facilityId">
          <el-select
            v-model="form.facilityId"
            filterable
            style="width: 100%"
            :disabled="editorMode === 'edit'"
            placeholder="选择需要维护的场地"
          >
            <el-option
              v-for="facility in facilityOptions"
              :key="facility.id"
              :label="facility.name"
              :value="facility.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维护类型" prop="maintenanceType">
          <el-radio-group v-model="form.maintenanceType">
            <el-radio-button label="ROUTINE">常规维护</el-radio-button>
            <el-radio-button label="REPAIR">故障维修</el-radio-button>
            <el-radio-button label="UPGRADE">设备升级</el-radio-button>
            <el-radio-button label="OTHER">其他</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
          />
        </el-form-item>
        <el-form-item v-if="editorMode === 'edit'" label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间"
          />
        </el-form-item>
        <el-form-item label="维护描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="说明故障现象、计划和现场处理建议"
          />
        </el-form-item>
        <el-form-item v-if="editorMode === 'edit'" label="处理结果" prop="result">
          <el-input
            v-model="form.result"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="补充处理结果"
          />
        </el-form-item>
        <el-form-item v-if="editorMode === 'edit'" label="费用">
          <el-input-number v-model="form.cost" :min="0" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="editorMode === 'edit'" label="任务状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="待处理" value="PENDING" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="确认完成维护" width="520px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="处理结果">
          <el-input
            v-model="completeResult"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="填写本次维护的处理结果"
          />
        </el-form-item>
        <el-form-item label="维护费用">
          <el-input-number v-model="completeCost" :min="0" :step="10" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComplete">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { facilityAPI, maintenanceAPI } from '../../api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const maintenanceList = ref([])
const facilityOptions = ref([])
const currentRow = ref(null)
const detailDialogVisible = ref(false)
const editorDialogVisible = ref(false)
const completeDialogVisible = ref(false)
const editorMode = ref('create')
const currentUser = ref({})
const currentPage = ref(1)
const pageSize = ref(10)
const statusFilter = ref('')
const maintenanceStatusFilter = ref('')
const formRef = ref(null)
const completeResult = ref('')
const completeCost = ref(0)

const form = reactive({
  id: null,
  facilityId: null,
  maintainerId: null,
  maintenanceType: 'ROUTINE',
  description: '',
  maintainer: '',
  cost: null,
  startTime: '',
  endTime: '',
  result: '',
  status: 'PENDING'
})

const rules = {
  facilityId: [{ required: true, message: '请选择场地', trigger: 'change' }],
  maintenanceType: [{ required: true, message: '请选择维护类型', trigger: 'change' }],
  description: [{ required: true, message: '请填写维护描述', trigger: 'blur' }]
}

const stats = computed(() => ({
  total: maintenanceList.value.length,
  pending: maintenanceList.value.filter((item) => item.status === 'PENDING').length,
  inProgress: maintenanceList.value.filter((item) => item.status === 'IN_PROGRESS').length,
  completed: maintenanceList.value.filter((item) => item.status === 'COMPLETED').length
}))

const filteredList = computed(() => {
  let list = [...maintenanceList.value]

  if (maintenanceStatusFilter.value === 'MAINTAINED') {
    list = list.filter((item) => item.status === 'COMPLETED')
  } else if (maintenanceStatusFilter.value === 'UNMAINTAINED') {
    list = list.filter((item) => ['PENDING', 'IN_PROGRESS'].includes(item.status))
  }

  if (statusFilter.value) {
    list = list.filter((item) => item.status === statusFilter.value)
  }

  return list
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

onMounted(() => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    currentUser.value = JSON.parse(userInfo)
  }
  syncFiltersFromQuery(route.query)
  loadFacilities()
  loadMaintenanceList()
})

watch(
  () => route.query,
  (query) => {
    syncFiltersFromQuery(query)
  }
)

const syncFiltersFromQuery = (query) => {
  statusFilter.value = query.status || ''
  maintenanceStatusFilter.value = query.maintenanceStatus || ''
  currentPage.value = 1
}

const updateQueryParams = () => {
  const query = {}
  if (statusFilter.value) {
    query.status = statusFilter.value
  }
  if (maintenanceStatusFilter.value) {
    query.maintenanceStatus = maintenanceStatusFilter.value
  }
  router.replace({ query })
}

const loadMaintenanceList = async () => {
  try {
    loading.value = true
    const userId = currentUser.value.id
    const response = userId
      ? await maintenanceAPI.getByMaintainerId(userId)
      : await maintenanceAPI.list()
    maintenanceList.value = response.data || []
  } catch (error) {
    console.error('加载维护任务失败:', error)
    ElMessage.error('加载维护任务失败')
    maintenanceList.value = []
  } finally {
    loading.value = false
  }
}

const loadFacilities = async () => {
  try {
    const response = await facilityAPI.list()
    facilityOptions.value = response.data || []
  } catch (error) {
    console.error('加载场地选项失败:', error)
    ElMessage.error('加载场地选项失败')
  }
}

const handleFilterChange = () => {
  currentPage.value = 1
  updateQueryParams()
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

const resetForm = () => {
  form.id = null
  form.facilityId = null
  form.maintainerId = currentUser.value.id || null
  form.maintenanceType = 'ROUTINE'
  form.description = ''
  form.maintainer = currentUser.value.realName || currentUser.value.username || ''
  form.cost = null
  form.startTime = ''
  form.endTime = ''
  form.result = ''
  form.status = 'PENDING'
}

const openCreateDialog = () => {
  resetForm()
  editorMode.value = 'create'
  editorDialogVisible.value = true
}

const openEditDialog = (row) => {
  currentRow.value = row
  form.id = row.id
  form.facilityId = row.facilityId
  form.maintainerId = row.maintainerId || currentUser.value.id || null
  form.maintenanceType = normalizeMaintenanceType(row.maintenanceType)
  form.description = row.description || ''
  form.maintainer = row.maintainer || currentUser.value.realName || currentUser.value.username || ''
  form.cost = row.cost ?? null
  form.startTime = row.startTime || ''
  form.endTime = row.endTime || ''
  form.result = row.result || ''
  form.status = row.status || 'PENDING'
  editorMode.value = 'edit'
  editorDialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (editorMode.value === 'create') {
      const response = await maintenanceAPI.create({ ...form })
      if (response.code === 200) {
        ElMessage.success('维护登记创建成功')
      } else {
        ElMessage.error(response.message || '维护登记创建失败')
        return
      }
    } else {
      const response = await maintenanceAPI.update(form.id, { ...form })
      if (response.code === 200) {
        ElMessage.success('维护登记更新成功')
      } else {
        ElMessage.error(response.message || '维护登记更新失败')
        return
      }
    }

    editorDialogVisible.value = false
    loadMaintenanceList()
  } catch (error) {
    console.error('提交维护登记失败:', error)
    ElMessage.error('提交维护登记失败')
  } finally {
    submitLoading.value = false
  }
}

const openCompleteDialog = (row) => {
  currentRow.value = row
  completeResult.value = row.result || ''
  completeCost.value = Number(row.cost || 0)
  completeDialogVisible.value = true
}

const submitComplete = async () => {
  if (!completeResult.value.trim()) {
    ElMessage.warning('请填写处理结果')
    return
  }

  try {
    const response = await maintenanceAPI.complete(currentRow.value.id, {
      result: completeResult.value.trim(),
      cost: completeCost.value,
      endTime: formatDateTimeForBackend(new Date())
    })
    if (response.code === 200) {
      ElMessage.success('维护任务已完成')
      completeDialogVisible.value = false
      loadMaintenanceList()
      return
    }
    ElMessage.error(response.message || '维护任务完成失败')
  } catch (error) {
    console.error('完成维护任务失败:', error)
    ElMessage.error('完成维护任务失败')
  }
}

const normalizeMaintenanceType = (type) => {
  const map = {
    '常规维护': 'ROUTINE',
    ROUTINE: 'ROUTINE',
    '故障维修': 'REPAIR',
    REPAIR: 'REPAIR',
    '设备升级': 'UPGRADE',
    UPGRADE: 'UPGRADE',
    OTHER: 'OTHER',
    '其他': 'OTHER'
  }
  return map[type] || 'OTHER'
}

const getMaintenanceTypeText = (type) => ({
  ROUTINE: '常规维护',
  REPAIR: '故障维修',
  UPGRADE: '设备升级',
  OTHER: '其他'
}[normalizeMaintenanceType(type)] || type || '-')

const getMaintenanceTypeTag = (type) => ({
  ROUTINE: 'success',
  REPAIR: 'danger',
  UPGRADE: 'warning',
  OTHER: 'info'
}[normalizeMaintenanceType(type)] || 'info')

const getStatusText = (status) => ({
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}[status] || status || '-')

const getStatusType = (status) => ({
  PENDING: 'warning',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'info'
}[status] || 'info')

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

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) {
    return value
  }
  return `¥${numberValue.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
</script>

<style scoped>
.maintenance-theme {
  --theme-main: #2563eb;
  --theme-soft: rgba(37, 99, 235, 0.12);
  --theme-border: rgba(37, 99, 235, 0.12);
  --theme-shadow: rgba(37, 99, 235, 0.16);
  padding: 24px;
  min-height: 100%;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.18), transparent 26%),
    linear-gradient(180deg, #eff6ff 0%, #f8fbff 48%, #eef4ff 100%);
}

.page-hero,
.control-card,
.panel-card {
  animation: rise-in 0.55s ease both;
}

.page-hero {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid var(--theme-border);
  box-shadow: 0 24px 60px var(--theme-shadow);
}

.eyebrow {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--theme-soft);
  color: var(--theme-main);
  font-size: 12px;
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
  color: #52606d;
  line-height: 1.7;
}

.hero-aside {
  display: grid;
  gap: 14px;
}

.mini-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 110px;
  padding: 18px 20px;
  border-radius: 22px;
  background: linear-gradient(135deg, #edf4ff 0%, #ffffff 100%);
  border: 1px solid var(--theme-border);
}

.mini-card span {
  color: #667085;
  font-size: 13px;
}

.mini-card strong {
  margin-top: 10px;
  color: #12234a;
  font-size: 24px;
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
  gap: 18px;
}

.control-copy h2 {
  margin: 0;
  font-size: 20px;
  color: #15223a;
}

.control-copy p {
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
}

.control-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.row-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.time-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-stack small {
  color: #6b7280;
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
  background: #f5f9ff;
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
  color: #0f172a;
  line-height: 1.7;
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

  .control-card {
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .maintenance-theme {
    padding: 16px;
  }

  .summary-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
