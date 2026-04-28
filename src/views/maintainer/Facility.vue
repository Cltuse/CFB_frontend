<template>
  <div class="page-shell facility-theme">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="eyebrow">Facility Management</span>
        <h1>设施管理</h1>
        <p>管理本人负责场地的状态、预约安排和维护入口，详情页同步展示未来排期。</p>
      </div>

    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">总场地数</span>
        <strong>{{ stats.total }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">可用中</span>
        <strong>{{ stats.available }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">维护中</span>
        <strong>{{ stats.maintenance }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">损坏待处理</span>
        <strong>{{ stats.damaged }}</strong>
      </article>
    </section>

    <section class="control-card">
      <div class="control-copy">
        <h2>场地列表</h2>
        <p>同类管理页统一采用概览卡片 + 操作区 + 数据表格的布局。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索场地名称、型号或分类"
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
        <el-button type="success" @click="openCreateDialog">新建场地</el-button>
      </div>
    </section>

    <section class="panel-card">
      <el-table
        ref="tableRef"
        :data="paginatedFacilities"
        stripe
        highlight-current-row
        empty-text="暂无场地数据"
        @sort-change="handleSortChange"
      >
        <el-table-column label="设施" min-width="200">
          <template #default="{ row }">
            <div class="facility-cell">
              <div class="facility-thumb">
                <img
                  :src="getImageSrc(row.image)"
                  :alt="row.name"
                />
              </div>
              <div>
                <div class="facility-name">
                  <el-link type="primary" :underline="false" @click="handleRowClick(row)">{{
                    row.name
                  }}</el-link>
                </div>
                <div class="facility-meta">
                  {{ row.model ? row.model + ' / ' : '' }}{{ row.categoryName || '-' }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="150" />
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button size="small" type="primary" @click="handleRowClick(row)">详情/排期</el-button>
              <el-button size="small" :type="row.status === 'MAINTENANCE' ? 'warning' : 'default'" @click="handleEditStatus(row)">{{ row.status === 'MAINTENANCE' ? '恢复可用' : '标记维护' }}</el-button>
              <el-button size="small" type="danger" plain @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next, total"
          @current-change="handlePageChange"
        />
      </div>
    </section>

    <section v-if="selectedFacility" class="detail-layout">
      <div class="detail-hero">
        <img
          :src="getImageSrc(selectedFacility.image)"
          :alt="selectedFacility.name"
        />
        <div class="detail-hero-copy">
          <h2>{{ selectedFacility.name }}</h2>
          <p>{{ selectedFacility.description || '暂无描述' }}</p>
          <div class="detail-tags">
            <el-tag size="small" effect="plain">{{ selectedFacility.categoryName }}</el-tag>
            <el-tag size="small" effect="plain">{{ selectedFacility.location }}</el-tag>
            <el-tag size="small" :type="statusType(selectedFacility.status)">{{ statusLabel(selectedFacility.status) }}</el-tag>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-info-card">
          <span class="detail-label">型号</span>
          <strong>{{ selectedFacility.model || '-' }}</strong>
        </div>
        <div class="detail-info-card">
          <span class="detail-label">采购时间</span>
          <strong>{{ formatDate(selectedFacility.purchaseDate) }}</strong>
        </div>
        <div class="detail-info-card">
          <span class="detail-label">使用年限</span>
          <strong>{{ selectedFacility.lifespan ? selectedFacility.lifespan + ' 年' : '-' }}</strong>
        </div>
        <div class="detail-info-card">
          <span class="detail-label">价格</span>
          <strong>{{ formatPrice(selectedFacility.price) }}</strong>
        </div>
      </div>

      <div v-if="facilityTimeline.length" class="timeline-panel">
        <div class="section-title">
          <h3>📋 未来排期（{{ facilityTimeline.length }} 条）</h3>
          <span>按时间正序排列</span>
        </div>
        <div class="timeline-list">
          <div v-for="event in facilityTimeline" :key="event.id" class="timeline-item">
            <div class="timeline-dot" />
            <div class="timeline-content">
              <div class="timeline-top">
                <el-tag size="small" effect="plain">{{ event.statusLabel || event.status }}</el-tag>
                <span>{{ formatRange(event.startTime, event.endTime) }}</span>
              </div>
              <p>{{ event.username || '未知用户' }} · {{ event.purpose || '无备注' }}</p>
              <span v-if="event.createdAt">预约时间: {{ formatDateTime(event.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <el-dialog v-model="createVisible" title="新建场地" width="560px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入场地名称" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="createForm.categoryId" placeholder="请选择分类" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="createForm.location" placeholder="例如：体育馆 A 区 101" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="createForm.model" placeholder="选填" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
        <el-form-item label="采购时间">
          <el-date-picker v-model="createForm.purchaseDate" type="date" placeholder="选填" style="width:100%" />
        </el-form-item>
        <el-form-item label="使用年限">
          <el-input-number v-model="createForm.lifespan" :min="0" :max="100" placeholder="年" style="width:100%" />
        </el-form-item>
        <el-form-item label="价格 (元)">
          <el-input-number v-model="createForm.price" :min="0" :step="100" placeholder="选填" style="width:100%" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleImageChange"
          >
            <el-button size="small">选择图片</el-button>
            <template #tip>
              <span v-if="createForm.image" class="image-name">{{ createForm.image.name }}</span>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">确认新建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" :title="statusDialogTitle" width="420px" destroy-on-close>
      <el-form ref="statusFormRef" :model="statusForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="statusType(statusTarget?.status)">{{ statusLabel(statusTarget?.status) }}</el-tag>
        </el-form-item>
        <el-form-item label="变更原因" prop="reason">
          <el-input
            v-model="statusForm.reason"
            type="textarea"
            :rows="3"
            :placeholder="statusTarget?.status === 'MAINTENANCE' ? '恢复可用原因' : '标记维护原因'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button :type="statusTarget?.status === 'MAINTENANCE' ? 'primary' : 'warning'" :loading="statusLoading" @click="confirmStatusChange">
          {{ statusTarget?.status === 'MAINTENANCE' ? '确认恢复' : '确认维护' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { facilityAPI, facilityCategoryAPI } from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme'
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const theme = getRoleTheme(userInfo.role || 'maintainer')
const featureVars = buildFeatureVars(theme)

const router = useRouter()

const tableRef = ref(null)
const createFormRef = ref(null)
const statusFormRef = ref(null)

const searchKeyword = ref('')
const facilities = ref([])
const categories = ref([])
const selectedFacility = ref(null)
const facilityTimeline = ref([])
const selectedSort = ref({ prop: 'name', order: 'ascending' })

const createVisible = ref(false)
const createLoading = ref(false)
const createForm = ref({
  name: '',
  categoryId: null,
  location: '',
  model: '',
  description: '',
  purchaseDate: null,
  lifespan: null,
  price: null,
  image: null
})
const createRules = {
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  name: [{ required: true, message: '请输入场地名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入位置', trigger: 'blur' }]
}

const statusDialogVisible = ref(false)
const statusLoading = ref(false)
const statusTarget = ref(null)
const statusForm = ref({ reason: '' })
const statusDialogTitle = ref('')

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const stats = ref({
  total: 0,
  available: 0,
  maintenance: 0,
  damaged: 0
})

const paginatedFacilities = ref([])

const normalizeFacility = (facility = {}) => ({
  ...facility,
  categoryName: facility.categoryName || facility.category || '-',
  image: facility.image || facility.imageUrl || '',
  imageUrl: facility.imageUrl || facility.image || ''
})

onMounted(async () => {
  await Promise.all([loadFacilities(), loadCategories()])
  applyPagination()
})

const loadFacilities = async () => {
  try {
    const response = await facilityAPI.mine()
    const rawList = response.data?.list || response.data?.records || response.data || []
    const list = Array.isArray(rawList) ? rawList.map(normalizeFacility) : []

    facilities.value = list
    pagination.value.total = list.length
    stats.value.total = list.length
    stats.value.available = list.filter((f) => f.status === 'AVAILABLE' || f.status === 'ACTIVE').length
    stats.value.maintenance = list.filter((f) => f.status === 'MAINTENANCE').length
    stats.value.damaged = list.filter((f) => f.status === 'DAMAGED' || f.status === 'INACTIVE').length
  } catch (error) {
    console.error('加载设施列表失败', error)
  }
}

const loadCategories = async () => {
  try {
    const response = await facilityCategoryAPI.getCategoryList()
    const rawList = response.data?.list || response.data?.records || response.data || []
    categories.value = Array.isArray(rawList)
      ? rawList.map((item) => ({
          ...item,
          name: item.name || item.categoryName || item.category || '未命名分类'
        }))
      : []
  } catch (error) {
    console.error('加载分类失败', error)
  }
}

const applyPagination = () => {
  const page = pagination.value.current
  const size = pagination.value.pageSize
  const start = (page - 1) * size
  const end = start + size

  let list = facilities.value
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter(
      (f) =>
        (f.name && f.name.toLowerCase().includes(keyword)) ||
        (f.model && f.model.toLowerCase().includes(keyword)) ||
        (f.categoryName && f.categoryName.toLowerCase().includes(keyword))
    )
  }

  pagination.value.total = list.length
  paginatedFacilities.value = list.slice(start, end)
  selectedFacility.value = null
}

const handleSearch = () => {
  pagination.value.current = 1
  applyPagination()
}

const handleClearSearch = () => {
  pagination.value.current = 1
  applyPagination()
}

const handlePageChange = () => {
  applyPagination()
}

const handleSortChange = ({ prop, order }) => {
  selectedSort.value = { prop, order }
}

const handleRowClick = (row) => {
  selectedFacility.value = normalizeFacility(row)
  loadTimeline(row.id)
}

const loadTimeline = async (facilityId) => {
  try {
    const response = await facilityAPI.getFacilityTimeline(facilityId)
    const data = response.data?.reservations || response.data || []
    facilityTimeline.value = Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          username: item.username || item.userName || '未知用户'
        }))
      : []
  } catch (error) {
    console.error('加载排期失败', error)
    facilityTimeline.value = []
  }
}

const openCreateDialog = () => {
  createForm.value = {
    name: '',
    categoryId: null,
    location: '',
    model: '',
    description: '',
    purchaseDate: null,
    lifespan: null,
    price: null,
    image: null
  }
  createVisible.value = true
}

const handleImageChange = (uploadFile) => {
  createForm.value.image = uploadFile.raw || uploadFile
}

const handleCreate = async () => {
  ElMessage.info('新增场地请使用管理员账号操作')
  createVisible.value = false
  return
  const valid = await createFormRef.value.validate().catch(() => {})
  if (!valid) return
  createLoading.value = true
  try {
    await facilityAPI.createFacility(createForm.value)
    ElMessage.success('场地创建成功')
    createVisible.value = false
    await loadFacilities()
    applyPagination()
  } catch (error) {
    console.error('创建场地失败', error)
  } finally {
    createLoading.value = false
  }
}

const handleEditStatus = (row) => {
  statusTarget.value = row
  statusForm.value = { reason: '' }
  statusDialogTitle.value = row.status === 'MAINTENANCE' ? '恢复可用' : '标记维护'
  statusDialogVisible.value = true
}

const confirmStatusChange = async () => {
  statusLoading.value = true
  try {
    const targetStatus = statusTarget.value.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'
    await facilityAPI.updateFacilityStatus(statusTarget.value.id, targetStatus, statusForm.value.reason)
    ElMessage.success('状态更新成功')
    statusDialogVisible.value = false
    await loadFacilities()
    applyPagination()
  } catch (error) {
    console.error('状态更新失败', error)
  } finally {
    statusLoading.value = false
  }
}

const handleDelete = async (row) => {
  ElMessageBox.alert(`当前账号只能维护状态，场地“${row.name}”的删除需要管理员操作。`, '无法删除', {
    confirmButtonText: '我知道了'
  }).catch(() => {})
  return
  try {
    await ElMessageBox.confirm(`确定删除场地「${row.name}」吗？此操作不可撤销。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
    await facilityAPI.deleteFacility(row.id)
    ElMessage.success('删除成功')
    await loadFacilities()
    applyPagination()
  } catch (error) {
    console.error('删除场地失败', error)
  }
}

const statusType = (status) => {
  const map = {
    AVAILABLE: 'success',
    ACTIVE: 'success',
    MAINTENANCE: 'warning',
    DAMAGED: 'danger',
    INACTIVE: 'danger'
  }
  return map[status] || 'info'
}

const statusLabel = (status) => {
  const map = {
    AVAILABLE: '可用',
    ACTIVE: '可用',
    MAINTENANCE: '维护中',
    DAMAGED: '损坏',
    INACTIVE: '停用'
  }
  return map[status] || status || '-'
}

const getImageSrc = (image) => {
  if (!image) return '/files/facility/default-facility.svg'
  if (image.startsWith('http') || image.startsWith('/')) return image
  return `http://localhost:8081/api/files/${image}`
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('zh-CN')
}

const formatRange = (start, end) => {
  if (!start || !end) return '-'
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleDateString('zh-CN')} ${s.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} ~ ${e.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

const formatPrice = (value) => {
  if (!value && value !== 0) return '-'
  const numberValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numberValue)) return '-'
  return `¥${numberValue.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  return `¥${numberValue.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped>
.facility-theme {
  padding: 24px;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, var(--feature-soft), transparent 26%),
    linear-gradient(180deg, var(--layout-shell-top) 0%, var(--layout-shell-bottom) 100%);
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
  background: linear-gradient(135deg, var(--feature-surface) 0%, #ffffff 100%);
  border: 1px solid var(--feature-soft);
}

.mini-card span {
  color: #5f6b75;
  font-size: 13px;
}

.mini-card strong {
  margin-top: 10px;
  color: #102a27;
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
  color: #102a27;
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
}

.search-input {
  width: 280px;
}

.facility-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.facility-thumb {
  width: 54px;
  height: 54px;
  overflow: hidden;
  border-radius: 16px;
  background: var(--feature-surface);
  flex-shrink: 0;
}

.facility-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.facility-name {
  font-weight: 700;
  color: #0f172a;
}

.facility-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #667085;
}

.row-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.detail-layout {
  display: grid;
  gap: 22px;
}

.detail-hero {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--feature-surface) 0%, #ffffff 100%);
}

.detail-hero img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 20px;
}

.detail-hero-copy h2 {
  margin: 12px 0 10px;
  color: #102a27;
}

.detail-hero-copy p {
  margin: 0;
  color: #56616b;
  line-height: 1.7;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.detail-info-card {
  padding: 16px;
  border-radius: 18px;
  background: var(--feature-surface);
  border: 1px solid var(--feature-soft);
}

.detail-label {
  display: block;
  color: #6b7280;
  font-size: 12px;
}

.detail-info-card strong {
  display: block;
  margin-top: 10px;
  color: #102a27;
  line-height: 1.5;
}

.timeline-panel {
  padding: 18px;
  border-radius: 24px;
  background: var(--feature-surface);
  border: 1px solid var(--feature-soft);
}

.section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title h3 {
  margin: 0;
  color: #0f172a;
}

.section-title span {
  color: #6b7280;
  font-size: 12px;
}

.timeline-list {
  display: grid;
  gap: 14px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 14px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  margin-top: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--feature-primary), var(--feature-secondary));
  box-shadow: 0 0 0 6px var(--feature-glow);
}

.timeline-content {
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid var(--feature-soft);
}

.timeline-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.timeline-content p {
  margin: 10px 0 6px;
  color: #1f2937;
}

.timeline-content span {
  color: #6b7280;
  font-size: 12px;
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
  .summary-grid,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-hero,
  .detail-hero,
  .control-card {
    grid-template-columns: 1fr;
  }

  .control-card {
    align-items: stretch;
  }

  .control-actions,
  .search-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .facility-theme {
    padding: 16px;
  }

  .summary-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
