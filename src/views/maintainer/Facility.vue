<template>
  <div class="page-shell facility-theme">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="eyebrow">设施运营</span>
        <h1>设施管理</h1>
        <p>统一查看本人负责场地的状态、预约安排和维护入口，详情页同步展示未来排期。</p>
      </div>

      <div class="hero-aside">
        <div class="mini-card">
          <span>负责场地</span>
          <strong>{{ stats.total }}</strong>
        </div>
        <div class="mini-card">
          <span>当前可用</span>
          <strong>{{ stats.available }}</strong>
        </div>
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
      </div>
    </section>

    <section class="panel-card">
      <el-table :data="facilityList" v-loading="loading" stripe>
        <el-table-column label="场地信息" min-width="260">
          <template #default="{ row }">
            <div class="facility-cell">
              <div class="facility-thumb">
                <img :src="row.imageUrl || fallbackImage" :alt="row.name">
              </div>
              <div>
                <div class="facility-name">{{ row.name }}</div>
                <div class="facility-meta">{{ row.model || '未填写型号' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" min-width="130" />
        <el-table-column prop="location" label="位置" min-width="170" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="120" align="center">
          <template #default="{ row }">
            {{ formatCurrency(row.price) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click.stop="openDetail(row)">查看详情</el-button>
              <el-button
                link
                type="success"
                :disabled="row.status === 'MAINTENANCE'"
                @click.stop="openMaintenanceDialog(row)"
              >
                发起维护
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
    </section>

    <el-drawer
      v-model="detailDrawerVisible"
      title="场地详情"
      size="760px"
      class="detail-drawer"
    >
      <div v-loading="detailLoading" class="detail-layout">
        <template v-if="detailFacility">
          <section class="detail-hero">
            <img :src="detailFacility.imageUrl || fallbackImage" :alt="detailFacility.name">
            <div class="detail-hero-copy">
              <span class="eyebrow">设施详情</span>
              <h2>{{ detailFacility.name }}</h2>
              <p>{{ detailFacility.description || '暂无场地介绍。' }}</p>
              <div class="detail-tags">
                <el-tag :type="getStatusType(detailFacility.status)" effect="light">
                  {{ getStatusText(detailFacility.status) }}
                </el-tag>
                <el-tag effect="light">{{ detailFacility.category || '未分类' }}</el-tag>
                <el-tag effect="light">{{ detailFacility.location || '位置未填写' }}</el-tag>
              </div>
            </div>
          </section>

          <section class="detail-grid">
            <article class="detail-info-card">
              <span class="detail-label">型号</span>
              <strong>{{ detailFacility.model || '-' }}</strong>
            </article>
            <article class="detail-info-card">
              <span class="detail-label">购买日期</span>
              <strong>{{ detailFacility.purchaseDate || '-' }}</strong>
            </article>
            <article class="detail-info-card">
              <span class="detail-label">价格</span>
              <strong>{{ formatCurrency(detailFacility.price) }}</strong>
            </article>
            <article class="detail-info-card">
              <span class="detail-label">未来 {{ detailQueryDays }} 天预约</span>
              <strong>{{ upcomingReservations.length }}</strong>
            </article>
          </section>

          <section class="timeline-panel">
            <div class="section-title">
              <h3>近期预约时间线</h3>
              <span>按开始时间排序</span>
            </div>

            <div v-if="upcomingReservations.length" class="timeline-list">
              <article v-for="item in upcomingReservations" :key="item.id" class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-top">
                    <strong>{{ formatDateTime(item.startTime) }}</strong>
                    <el-tag size="small" :type="getReservationStatusType(item.status)" effect="light">
                      {{ getReservationStatusText(item.status) }}
                    </el-tag>
                  </div>
                  <p>{{ item.userName || '未知用户' }} · {{ item.purpose || '未填写用途' }}</p>
                  <span>{{ formatDateTime(item.endTime) }} 结束</span>
                </div>
              </article>
            </div>
            <el-empty v-else description="未来几天暂无预约安排" />
          </section>
        </template>
      </div>
    </el-drawer>

    <el-dialog
      v-model="maintenanceDialogVisible"
      title="发起维护登记"
      width="580px"
      destroy-on-close
    >
      <el-form ref="maintenanceFormRef" :model="maintenanceForm" :rules="maintenanceRules" label-position="top">
        <el-form-item label="场地名称">
          <el-input :model-value="currentFacility.name" disabled />
        </el-form-item>
        <el-form-item label="维护类型" prop="maintenanceType">
          <el-select v-model="maintenanceForm.maintenanceType" style="width: 100%">
            <el-option label="常规维护" value="ROUTINE" />
            <el-option label="故障维修" value="REPAIR" />
            <el-option label="设备升级" value="UPGRADE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始时间" prop="startTime">
          <el-date-picker
            v-model="maintenanceForm.startTime"
            type="datetime"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择计划开始时间"
          />
        </el-form-item>
        <el-form-item label="维护描述" prop="description">
          <el-input
            v-model="maintenanceForm.description"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="填写维护原因、现场情况与计划安排"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="maintenanceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMaintenance">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { facilityAPI, maintenanceAPI } from '../../api'

const fallbackImage = '/files/facility/default-facility.svg'

const loading = ref(false)
const detailLoading = ref(false)
const allFacilities = ref([])
const facilityList = ref([])
const total = ref(0)
const searchKeyword = ref('')
const isSearchMode = ref(false)
const detailDrawerVisible = ref(false)
const maintenanceDialogVisible = ref(false)
const detailFacility = ref(null)
const detailQueryDays = ref(7)
const upcomingReservations = ref([])
const currentFacility = ref({})
const maintenanceFormRef = ref(null)
const currentUser = ref({})

const pagination = reactive({
  page: 1,
  size: 10,
  sortBy: 'id',
  sortDir: 'desc'
})

const maintenanceForm = reactive({
  facilityId: null,
  maintainerId: null,
  maintenanceType: 'ROUTINE',
  description: '',
  startTime: ''
})

const maintenanceRules = {
  maintenanceType: [{ required: true, message: '请选择维护类型', trigger: 'change' }],
  description: [{ required: true, message: '请填写维护描述', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择计划开始时间', trigger: 'change' }]
}

const stats = computed(() => ({
  total: allFacilities.value.length || 0,
  available: allFacilities.value.filter((item) => item.status === 'AVAILABLE').length,
  maintenance: allFacilities.value.filter((item) => item.status === 'MAINTENANCE').length,
  damaged: allFacilities.value.filter((item) => item.status === 'DAMAGED').length
}))

onMounted(() => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    currentUser.value = JSON.parse(userInfo)
  }
  loadFacilityStats()
  loadFacilityList()
})

const loadFacilityStats = async () => {
  try {
    const result = await facilityAPI.list()
    allFacilities.value = result.data || []
  } catch (error) {
    console.error('加载场地统计失败:', error)
    allFacilities.value = []
  }
}

const loadFacilityList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page - 1,
      size: pagination.size,
      sortBy: pagination.sortBy,
      sortDir: pagination.sortDir
    }

    const result = isSearchMode.value && searchKeyword.value.trim()
      ? await facilityAPI.searchPage(searchKeyword.value.trim(), params)
      : await facilityAPI.listPage(params)

    if (result.code === 200) {
      facilityList.value = result.data.content || []
      total.value = result.data.totalElements || 0
      return
    }

    ElMessage.error(result.message || '获取场地列表失败')
  } catch (error) {
    console.error('加载场地列表失败:', error)
    ElMessage.error('加载场地列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  isSearchMode.value = Boolean(searchKeyword.value.trim())
  loadFacilityList()
}

const handleClearSearch = () => {
  searchKeyword.value = ''
  isSearchMode.value = false
  pagination.page = 1
  loadFacilityList()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadFacilityList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadFacilityList()
}

const openDetail = async (row) => {
  currentFacility.value = { ...row }
  detailDrawerVisible.value = true
  detailLoading.value = true

  try {
    const result = await facilityAPI.getDetail(row.id, 7)
    const payload = result.data || {}
    detailFacility.value = payload.facility || row
    upcomingReservations.value = payload.reservations || []
    detailQueryDays.value = payload.queryDays || 7
  } catch (error) {
    console.error('加载场地详情失败:', error)
    detailFacility.value = row
    upcomingReservations.value = []
    ElMessage.error('加载场地详情失败')
  } finally {
    detailLoading.value = false
  }
}

const openMaintenanceDialog = (row) => {
  currentFacility.value = { ...row }
  maintenanceForm.facilityId = row.id
  maintenanceForm.maintainerId = currentUser.value.id || null
  maintenanceForm.maintenanceType = 'ROUTINE'
  maintenanceForm.description = ''
  maintenanceForm.startTime = ''
  maintenanceDialogVisible.value = true
}

const submitMaintenance = async () => {
  try {
    await maintenanceFormRef.value.validate()
    const result = await maintenanceAPI.create({ ...maintenanceForm })
    if (result.code === 200) {
      ElMessage.success('维护登记已创建')
      maintenanceDialogVisible.value = false
      loadFacilityStats()
      loadFacilityList()
      return
    }
    ElMessage.error(result.message || '维护登记创建失败')
  } catch (error) {
    console.error('提交维护登记失败:', error)
    ElMessage.error('提交维护登记失败')
  }
}

const getStatusType = (status) => ({
  AVAILABLE: 'success',
  MAINTENANCE: 'warning',
  DAMAGED: 'danger'
}[status] || 'info')

const getStatusText = (status) => ({
  AVAILABLE: '可用',
  MAINTENANCE: '维护中',
  DAMAGED: '损坏'
}[status] || status || '-')

const getReservationStatusType = (status) => ({
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  COMPLETED: 'info',
  CANCELLED: 'info'
}[status] || '')

const getReservationStatusText = (status) => ({
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}[status] || status || '-')

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

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped>
.facility-theme {
  --theme-main: #0f766e;
  --theme-soft: rgba(15, 118, 110, 0.12);
  --theme-border: rgba(15, 118, 110, 0.12);
  --theme-shadow: rgba(15, 118, 110, 0.16);
  padding: 24px;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(45, 212, 191, 0.18), transparent 26%),
    linear-gradient(180deg, #effcf9 0%, #f7fdfc 46%, #eefbf7 100%);
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
  background: linear-gradient(135deg, #ebfffa 0%, #ffffff 100%);
  border: 1px solid var(--theme-border);
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
  background: #effff8;
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
  background: linear-gradient(135deg, #effff8 0%, #ffffff 100%);
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
  background: #f8fffd;
  border: 1px solid rgba(15, 118, 110, 0.08);
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
  background: #fbfffe;
  border: 1px solid rgba(15, 118, 110, 0.08);
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
  background: linear-gradient(135deg, #14b8a6, #0f766e);
  box-shadow: 0 0 0 6px rgba(20, 184, 166, 0.12);
}

.timeline-content {
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 118, 110, 0.08);
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
