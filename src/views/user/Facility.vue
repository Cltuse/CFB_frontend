<template>
  <div class="page-shell facility-theme">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-kicker">设施浏览</span>
        <h1>校园设施</h1>
        <p>浏览、筛选和预约公共设施，每张卡片都包含基本信息和状态标识，方便快速判断。</p>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">全部设施</span>
        <strong>{{ stats.total }}</strong>
        <p>当前系统中登记的所有设施</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">可预约</span>
        <strong>{{ stats.available }}</strong>
        <p>状态正常、接受预约的设施</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">维护中</span>
        <strong>{{ stats.maintenance }}</strong>
        <p>正在维保、暂不可预约</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已损坏</span>
        <strong>{{ stats.damaged }}</strong>
        <p>损坏待处理中</p>
      </article>
    </section>

    <!-- 筛选器 -->
    <section class="panel-card control-card">
      <div class="control-row">
        <el-input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索设施名称…"
          clearable
          :prefix-icon="Search"
        />
        <el-select v-model="selectedCategory" class="filter-select" placeholder="全部类别" clearable>
          <el-option value="" label="全部类别" />
          <el-option v-for="c in categories" :key="c.id" :value="c.name" :label="c.name" />
        </el-select>
        <el-select v-model="selectedStatus" class="filter-select" placeholder="全部状态" clearable>
          <el-option value="" label="全部状态" />
          <el-option value="AVAILABLE" label="可预约" />
          <el-option value="MAINTENANCE" label="维护中" />
          <el-option value="DAMAGED" label="已损坏" />
        </el-select>
        <el-button class="reset-btn" @click="resetFilters">重置</el-button>
      </div>
    </section>

    <!-- 设施列表卡片 -->
    <section class="panel-card facility-panel" ref="listSectionRef">
      <div class="panel-head">
        <div class="panel-meta">
          <span class="meta-chip">共 {{ filteredFacilityList.length }} 条结果</span>
          <span class="meta-chip meta-muted" v-if="selectedCategory || selectedStatus || searchKeyword">
            <span>筛选结果</span>
            <strong>{{ filteredFacilityList.length }}</strong>
            <small>会随着条件实时变化</small>
          </span>
        </div>
      </div>

      <template v-if="loading">
        <div v-loading="loading" style="min-height: 240px"></div>
      </template>
      <template v-else>
        <div v-if="paginatedFacilityList.length" class="facility-grid">
          <article
            v-for="item in paginatedFacilityList"
            :key="item.id"
            class="facility-card"
            @click="openDetail(item)"
          >
            <div class="card-media">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
              <div v-else class="card-media-fallback">📦</div>
            </div>
            <div class="card-body">
              <div class="card-tags">
                <el-tag :type="getStatusType(item.status)" effect="light" size="small">
                  {{ getStatusText(item.status) }}
                </el-tag>
                <el-tag effect="light" size="small" class="tag-category">{{ item.category || '未分类' }}</el-tag>
              </div>
              <h3 class="card-title">{{ item.name }}</h3>
              <p class="card-desc">{{ item.description || '暂无设施介绍。' }}</p>
              <div class="card-meta">
                <span>{{ item.location || '未填写位置' }}</span>
                <span>{{ item.model || '未填写型号' }}</span>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <h3>暂无设施</h3>
          <p>当前没有符合筛选条件的设施，可尝试放宽筛选条件。</p>
        </div>
        <div class="pagination-wrap" v-if="filteredFacilityList.length">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[8, 12, 20, 40]"
            :total="filteredFacilityList.length"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </template>
    </section>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      size="620px"
      class="detail-drawer"
      direction="rtl"
      :with-header="false"
    >
      <div v-loading="detailLoading" class="detail-layout" v-if="detailFacility">
        <section class="detail-hero">
          <img
            v-if="detailFacility.imageUrl"
            :src="detailFacility.imageUrl"
            :alt="detailFacility.name"
            class="detail-image"
            @error="handleImageError"
          />
          <div class="detail-copy">
            <span class="eyebrow">设施详情</span>
            <h2>{{ detailFacility.name }}</h2>
            <p>{{ detailFacility.description || '暂无设施介绍。' }}</p>
            <div class="detail-tags">
              <el-tag :type="getStatusType(detailFacility.status)" effect="light">
                {{ getStatusText(detailFacility.status) }}
              </el-tag>
              <el-tag effect="light">{{ detailFacility.category || '未分类' }}</el-tag>
              <el-tag effect="light">{{ detailFacility.location || '未填写位置' }}</el-tag>
            </div>
          </div>
        </section>

        <section class="detail-grid">
          <article class="detail-info-card">
            <span class="detail-label">型号</span>
            <strong>{{ detailFacility.model || '未填写' }}</strong>
          </article>
          <article class="detail-info-card">
            <span class="detail-label">购入日期</span>
            <strong>{{ detailFacility.purchaseDate || '未填写' }}</strong>
          </article>
          <article class="detail-info-card">
            <span class="detail-label">预约状态</span>
            <strong>{{ detailFacility.status === 'AVAILABLE' ? '可直接预约' : '暂不可预约' }}</strong>
          </article>
        </section>

        <section class="detail-panel" v-if="upcomingReservations.length">
          <h3>近期待占用</h3>
          <div class="timeline-list">
            <div v-for="res in upcomingReservations.slice(0, 6)" :key="res.id" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-top">
                  <span class="res-time">{{ formatTime(res.startTime) }} - {{ formatTime(res.endTime) }}</span>
                  <el-tag :type="getStatusType(res.status)" effect="light" size="small">
                    {{ getStatusText(res.status) }}
                  </el-tag>
                </div>
                <p>{{ res.purpose || res.reason || '未填写用途说明' }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="drawer-actions">
          <el-button
            class="reserve-btn"
            :disabled="detailFacility.status !== 'AVAILABLE'"
            @click="handleReserve(detailFacility)"
          >
            {{ detailFacility.status === 'AVAILABLE' ? '立即预约' : '暂不可预约' }}
          </el-button>
          <el-button class="drawer-close-btn" @click="drawerVisible = false">关闭详情</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 预约对话框 -->
    <el-dialog v-model="dialogVisible" width="500px" class="reserve-dialog" :show-close="false">
      <div class="dialog-header">
        <div class="dialog-badge">
          <el-icon :size="26"><Calendar /></el-icon>
        </div>
        <div>
          <h3>提交预约</h3>
          <p>{{ currentFacility.name || '请选择设施' }}</p>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="reserve-form"
      >
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            :disabled-date="disabledDate"
            :disabled-hours="disabledHours"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            :disabled-date="disabledDate"
            :disabled-hours="disabledHours"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="预约用途" prop="purpose">
          <el-input
            v-model="form.purpose"
            type="textarea"
            :rows="3"
            placeholder="请填写预约用途"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button class="submit-btn" :loading="submitting" @click="handleSubmit">提交预约</el-button>
      </template>
    </el-dialog>

    <UserLayout />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Calendar, Edit, Delete } from '@element-plus/icons-vue';
import { facilityAPI, facilityCategoryAPI, reservationAPI } from '../../api';
import { normalizeUserMessage } from '../../utils/messageText';
import UserLayout from '../../layouts/UserLayout.vue';

const allFacilityList = ref([]);
const categories = ref([]);
const loading = ref(false);
const detailLoading = ref(false);
const searchKeyword = ref('');
const selectedCategory = ref('');
const selectedStatus = ref('');
const currentPage = ref(1);
const pageSize = ref(8);
const drawerVisible = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref(null);
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'));
const listSectionRef = ref(null);
const currentFacility = ref({});
const detailFacility = ref(null);
const upcomingReservations = ref([]);
const form = ref({
  facilityId: null,
  userId: null,
  startTime: '',
  endTime: '',
  purpose: ''
});

const rules = {
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  purpose: [{ required: true, message: '请填写预约用途', trigger: 'blur' }]
};

const getStatusType = (status) => {
  const map = { AVAILABLE: 'success', MAINTENANCE: 'warning', DAMAGED: 'danger' };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = { AVAILABLE: '可预约', MAINTENANCE: '维护中', DAMAGED: '已损坏' };
  return map[status] || status;
};

const filteredFacilityList = computed(() => {
  let filtered = [...allFacilityList.value];
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (keyword) {
    filtered = filtered.filter((item) => item.name && item.name.toLowerCase().includes(keyword));
  }
  if (selectedCategory.value) {
    filtered = filtered.filter((item) => item.category === selectedCategory.value);
  }
  if (selectedStatus.value) {
    filtered = filtered.filter((item) => item.status === selectedStatus.value);
  }
  return filtered;
});

const paginatedFacilityList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredFacilityList.value.slice(start, end);
});

const stats = computed(() => ({
  total: allFacilityList.value.length,
  available: allFacilityList.value.filter((item) => item.status === 'AVAILABLE').length,
  maintenance: allFacilityList.value.filter((item) => item.status === 'MAINTENANCE').length,
  damaged: allFacilityList.value.filter((item) => item.status === 'DAMAGED').length
}));

watch(
  () => [filteredFacilityList.value.length, pageSize.value],
  () => {
    const maxPage = Math.max(1, Math.ceil(filteredFacilityList.value.length / pageSize.value));
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage;
    }
  }
);

onMounted(() => {
  loadFacilityList();
  loadCategories();
});

async function loadFacilityList() {
  try {
    loading.value = true;
    const res = await facilityAPI.list();
    allFacilityList.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    ElMessage.error('加载设施列表失败');
    allFacilityList.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  try {
    const res = await facilityCategoryAPI.active();
    categories.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    // 不阻塞主流程
  }
}

function resetFilters() {
  searchKeyword.value = '';
  selectedCategory.value = '';
  selectedStatus.value = '';
  currentPage.value = 1;
}

async function openDetail(item) {
  detailLoading.value = true;
  currentFacility.value = { ...item };
  detailFacility.value = { ...item };

  try {
    const result = await facilityAPI.getDetail(item.id, 7);
    const payload = result.data || {};
    detailFacility.value = payload.facility || item;
    upcomingReservations.value = payload.reservations || [];
    detailQueryDays.value = 7;
  } catch {
    detailFacility.value = { ...item };
    ElMessage.error('加载设施详情失败');
  } finally {
    detailLoading.value = false;
    drawerVisible.value = true;
  }
}

function handleImageError(e) {
  e.target.style.display = 'none';
}

function handleReserve(item) {
  currentFacility.value = { ...item };
  form.value = {
    facilityId: item.id,
    userId: userInfo.value.id,
    startTime: '',
    endTime: '',
    purpose: ''
  };
  dialogVisible.value = true;
}

function disabledDate(time) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return time.getTime() < now.getTime();
}

function disabledHours() {
  const hours = [];
  for (let i = 0; i < 8; i++) hours.push(i);
  for (let i = 22; i < 24; i++) hours.push(i);
  return hours;
}

async function handleSubmit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const res = await reservationAPI.create(form.value);
    if (res.code === 200) {
      ElMessage.success('预约已提交');
      dialogVisible.value = false;
      if (detailFacility.value?.id) {
        openDetail(detailFacility.value);
      }
    } else {
      ElMessage.error(normalizeUserMessage(res.message) || '预约失败');
    }
  } catch (error) {
    ElMessage.error(error.message || '预约失败');
  } finally {
    submitting.value = false;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
}
</script>

<style scoped>
.facility-theme {
  --theme-main: var(--feature-primary);
  --theme-deep: var(--feature-primary-deep);
  --theme-soft: color-mix(in srgb, var(--feature-primary) 18%, #ffffff 82%);
  --theme-glow: var(--feature-glow);
  --theme-border: var(--feature-border);
  --theme-shadow: color-mix(in srgb, var(--feature-primary) 12%, transparent);
  --theme-surface: color-mix(in srgb, var(--feature-primary) 8%, #ffffff 92%);
  min-height: 100%;
  display: grid;
  gap: 20px;
  padding: 0;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--feature-primary) 20%, transparent), transparent 28%),
    radial-gradient(circle at right center, color-mix(in srgb, var(--feature-primary) 12%, #ffffff 88%), transparent 20%),
    linear-gradient(180deg, #f9fdf9 0%, #f5faf6 48%, #eef6ef 100%);
}

.page-hero,
.control-card,
.panel-card,
.detail-drawer,
.reserve-dialog {
  animation: rise-in 0.55s ease both;
}

/* Hero */
.page-hero {
  padding: 30px;
  border-radius: 30px;
  border: 1px solid var(--theme-border);
  background:
    radial-gradient(circle at top right, var(--theme-soft), transparent 24%),
    linear-gradient(145deg, color-mix(in srgb, var(--feature-primary) 12%, #ffffff 88%) 0%, #ffffff 62%);
  box-shadow: 0 20px 44px var(--theme-shadow);
}

.hero-kicker {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--theme-soft);
  color: var(--theme-deep);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 16px 0 12px;
  font-size: 36px;
  color: var(--feature-strong);
}

.hero-copy p {
  margin: 0;
  color: color-mix(in srgb, var(--feature-strong) 62%, #7f9084 38%);
  line-height: 1.8;
}

/* Summary */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--theme-border);
  background: linear-gradient(150deg, color-mix(in srgb, var(--feature-primary) 12%, #ffffff 88%) 0%, #ffffff 82%);
  box-shadow: 0 18px 38px var(--theme-shadow);
}

.summary-card strong {
  margin: 14px 0 8px;
  font-size: 32px;
  color: var(--feature-strong);
}

.summary-label,
.summary-card p {
  color: color-mix(in srgb, var(--feature-strong) 62%, #7f9084 38%);
}

/* Control Card */
.control-card {
  padding: 24px;
  border: 1px solid var(--theme-border);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.control-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 320px;
}

.search-input :deep(.el-input__wrapper) {
  min-height: 46px;
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid var(--theme-border);
  background: var(--theme-surface);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--feature-primary) 12%, transparent);
}

.filter-select {
  width: 160px;
}

.filter-select :deep(.el-select__wrapper) {
  min-height: 46px;
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid var(--theme-border);
  background: var(--theme-surface);
}

.reset-btn {
  border-radius: 14px;
  min-height: 46px;
  padding: 0 24px;
  border: 1px solid var(--theme-border);
  background: color-mix(in srgb, var(--theme-surface) 72%, #ffffff 28%);
  color: var(--feature-strong);
  transition: all 0.25s ease;
}

.reset-btn:hover {
  background: linear-gradient(135deg, var(--theme-main) 0%, var(--theme-deep) 100%);
  color: #ffffff;
  border-color: transparent;
}

/* Facility Panel */
.facility-panel {
  border: 1px solid var(--theme-border);
  border-radius: 30px;
  padding: 8px 24px 24px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}

.panel-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--theme-soft);
  color: var(--theme-deep);
  font-size: 12px;
  font-weight: 600;
}

.meta-muted {
  background: rgba(200, 200, 200, 0.14);
  color: #888;
}

/* Facility Grid */
.facility-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.facility-card {
  border-radius: 24px;
  border: 1px solid var(--theme-border);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), color-mix(in srgb, var(--feature-primary) 6%, #ffffff 94%));
  box-shadow: 0 14px 28px var(--theme-shadow);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.facility-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 44px color-mix(in srgb, var(--feature-primary) 18%, transparent);
}

.card-media {
  height: 176px;
  padding: 10px 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--feature-primary) 8%, #ffffff 92%);
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 18px;
}

.card-media-fallback {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 48px;
}

.card-body {
  padding: 18px;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.card-tags .tag-category {
  background: color-mix(in srgb, var(--feature-primary) 16%, #ffffff 84%) !important;
  border-color: transparent !important;
  color: var(--theme-deep) !important;
}

.card-title {
  margin: 0 0 8px;
  font-size: 17px;
  color: var(--feature-strong);
}

.card-desc {
  margin: 0 0 12px;
  color: color-mix(in srgb, var(--feature-strong) 62%, #7f9084 38%);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: color-mix(in srgb, var(--feature-strong) 54%, #90a090 46%);
  font-size: 12px;
}

/* Pagination */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.pagination-wrap :deep(.el-pagination) {
  --el-pagination-button-color: var(--feature-strong);
}

.pagination-wrap :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: linear-gradient(135deg, var(--theme-main) 0%, var(--theme-deep) 100%);
  border: none;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state h3 {
  color: var(--feature-strong);
}

.empty-state p {
  color: color-mix(in srgb, var(--feature-strong) 62%, #7f9084 38%);
}

/* Detail Drawer */
.detail-drawer :deep(.el-drawer) {
  border-radius: 30px 0 0 30px;
  background: linear-gradient(180deg, #f9fdf9 0%, #f4faf5 100%);
}

.detail-layout {
  padding: 28px;
  display: grid;
  gap: 24px;
}

.detail-hero {
  display: grid;
  gap: 20px;
}

.detail-image {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 24px;
}

.eyebrow {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--theme-soft);
  color: var(--theme-deep);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.detail-copy h2 {
  margin: 0;
  color: var(--feature-strong);
}

.detail-copy p {
  margin: 0;
  color: color-mix(in srgb, var(--feature-strong) 62%, #7f9084 38%);
  line-height: 1.8;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.detail-info-card,
.detail-panel {
  padding: 18px;
  border-radius: 22px;
  background: var(--theme-surface);
  border: 1px solid color-mix(in srgb, var(--feature-primary) 14%, #dce7de 86%);
}

.detail-label {
  display: block;
  font-size: 12px;
  color: color-mix(in srgb, var(--feature-strong) 54%, #90a090 46%);
  margin-bottom: 6px;
}

.detail-info-card strong {
  color: var(--feature-strong);
}

.timeline-list {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 14px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  margin-top: 9px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--theme-main), var(--theme-deep));
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--feature-primary) 12%, transparent);
}

.timeline-content {
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid color-mix(in srgb, var(--feature-primary) 14%, #dce7de 86%);
}

.timeline-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.timeline-content p {
  margin: 10px 0 6px;
  color: var(--feature-strong);
}

.timeline-content span {
  color: color-mix(in srgb, var(--feature-strong) 54%, #90a090 46%);
  font-size: 12px;
}

.drawer-actions {
  margin-top: 4px;
  display: flex;
  gap: 12px;
}

.drawer-actions .reserve-btn {
  flex: 1;
  min-height: 50px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(232, 144, 157, 0.2);
  font-size: 15px;
  font-weight: 600;
  transition: opacity 0.25s ease;
}

.drawer-actions .reserve-btn:hover {
  opacity: 0.9;
}

.drawer-actions .reserve-btn:disabled {
  background: #ddd;
  box-shadow: none;
  color: #999;
}

.drawer-close-btn {
  min-height: 50px;
  border-radius: 16px;
  border: 1px solid var(--theme-border);
  background: color-mix(in srgb, var(--theme-surface) 72%, #ffffff 28%);
  color: var(--feature-strong);
}

/* Dialog */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dialog-header h3 {
  margin: 0;
  color: var(--feature-strong);
}

.dialog-header p {
  margin: 6px 0 0;
  color: color-mix(in srgb, var(--feature-strong) 62%, #7f9084 38%);
}

.dialog-badge {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--feature-primary) 18%, #ffffff 82%);
  color: var(--theme-deep);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.submit-btn {
  border-radius: 14px;
  min-height: 44px;
  border: none;
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(232, 144, 157, 0.2);
  padding: 0 28px;
}

.facility-theme :deep(.el-input__wrapper),
.facility-theme :deep(.el-select__wrapper),
.facility-theme :deep(.el-textarea__inner),
.facility-theme :deep(.el-date-editor.el-input__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
}

.facility-theme :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.facility-theme :deep(.el-dialog__header) {
  margin: 0;
  padding: 22px 24px 6px;
}

.facility-theme :deep(.el-dialog__body) {
  padding: 14px 24px 18px;
}

.facility-theme :deep(.el-dialog__footer) {
  padding: 0 24px 24px;
}

@keyframes rise-in {
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
  .facility-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .page-hero,
  .control-card,
  .detail-hero {
    grid-template-columns: 1fr;
    display: grid;
  }

  .control-actions,
  .search-input,
  .filter-select {
    width: 100%;
  }

  .panel-head,
  .drawer-actions,
  .card-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .facility-theme {
    padding: 16px;
  }

  .summary-grid,
  .facility-grid,
  .detail-grid,
  .form-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .page-hero,
  .control-card,
  .panel-card {
    padding: 18px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }
}
</style>
