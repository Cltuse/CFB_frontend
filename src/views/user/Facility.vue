<template>
  <div class="page-shell facility-theme">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="eyebrow">场地预约中心</span>
        <h1>设施浏览与预约</h1>
        <p>
          保持与设施管理员页面同一套浅色卡片语言和层级结构，
          但把主内容改成更适合用户端的预约卡片流，方便快速筛选、查看详情和直接预约。
        </p>
        <div class="hero-actions">
          <el-button type="primary" class="hero-primary-btn" @click="scrollToList">
            <el-icon><ArrowRight /></el-icon>
            浏览可预约设施
          </el-button>
          <el-button class="hero-secondary-btn" @click="clearAllFilters">
            <el-icon><RefreshRight /></el-icon>
            重置筛选
          </el-button>
        </div>
      </div>

      <div class="hero-aside">
        <article class="mini-card">
          <span>当前可预约</span>
          <strong>{{ stats.available }}</strong>
          <small>状态为“可用”的设施</small>
        </article>
        <article class="mini-card">
          <span>筛选结果</span>
          <strong>{{ filteredFacilityList.length }}</strong>
          <small>会随着条件实时变化</small>
        </article>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">设施总数</span>
        <strong>{{ stats.total }}</strong>
        <p>当前系统内可浏览设施</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">可预约</span>
        <strong>{{ stats.available }}</strong>
        <p>可以直接发起预约</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">维护中</span>
        <strong>{{ stats.maintenance }}</strong>
        <p>暂不开放预约</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已损坏</span>
        <strong>{{ stats.damaged }}</strong>
        <p>等待维修或下线</p>
      </article>
    </section>

    <section class="control-card">
      <div class="control-copy">
        <h2>筛选条件</h2>
        <p>用设施管理员同风格的控制面板重做用户端查询区域，并保持中文文案与浅色低冲突配色。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设施名称、型号、位置或描述"
          clearable
          class="search-input"
          @input="handleFilterChange"
          @clear="handleFilterChange"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="selectedCategory"
          clearable
          class="filter-select"
          placeholder="设施类别"
          @change="handleFilterChange"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.categoryName"
            :value="category.categoryName"
          />
        </el-select>

        <el-select
          v-model="selectedStatus"
          clearable
          class="filter-select"
          placeholder="设施状态"
          @change="handleFilterChange"
        >
          <el-option label="可用" value="AVAILABLE" />
          <el-option label="维护中" value="MAINTENANCE" />
          <el-option label="已损坏" value="DAMAGED" />
        </el-select>

        <el-select
          v-model="sortBy"
          class="filter-select"
          placeholder="排序方式"
          @change="handleFilterChange"
        >
          <el-option label="默认排序" value="" />
          <el-option label="名称升序" value="nameAsc" />
          <el-option label="名称降序" value="nameDesc" />
          <el-option label="状态优先" value="status" />
        </el-select>
      </div>
    </section>

    <section class="panel-card facility-panel" ref="listSectionRef">
      <div class="panel-head">
        <div>
          <h3>设施列表</h3>
          <p>卡片结构和抽屉详情与设施管理员端保持统一语言，但保留用户端的预约入口和时间选择流程。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ filteredFacilityList.length }} 条结果</span>
          <span class="meta-chip meta-muted" v-if="selectedCategory || selectedStatus || searchKeyword">
            已启用筛选
          </span>
        </div>
      </div>

      <div v-if="loading" class="loading-wrap">
        <el-icon class="loading-icon is-loading"><Loading /></el-icon>
        <p>正在加载设施信息...</p>
      </div>

      <template v-else>
        <div v-if="paginatedFacilityList.length" class="facility-grid">
          <article
            v-for="item in paginatedFacilityList"
            :key="item.id"
            class="facility-card"
            @click="openDetail(item)"
          >
            <div class="card-media">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.name"
                @error="handleImageError"
              />
              <div v-else class="media-fallback">
                <el-icon><Picture /></el-icon>
              </div>
              <el-tag :type="getStatusType(item.status)" effect="light" class="status-pill">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>

            <div class="card-body">
              <div class="card-head">
                <h4>{{ item.name }}</h4>
                <span>{{ item.model || '未填写型号' }}</span>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <label>类别</label>
                  <strong>{{ item.category || '未分类' }}</strong>
                </div>
                <div class="info-item">
                  <label>位置</label>
                  <strong>{{ item.location || '未填写位置' }}</strong>
                </div>
              </div>

              <p class="card-desc">
                {{ item.description || '暂无设施说明，可进入详情查看预约安排。' }}
              </p>
            </div>

            <div class="card-actions">
              <el-button class="ghost-btn" @click.stop="openDetail(item)">
                <el-icon><InfoFilled /></el-icon>
                查看详情
              </el-button>
              <el-button
                type="primary"
                class="reserve-btn"
                :disabled="item.status !== 'AVAILABLE'"
                @click.stop="handleReserve(item)"
              >
                <el-icon><Calendar /></el-icon>
                立即预约
              </el-button>
            </div>
          </article>
        </div>

        <el-empty v-else description="没有符合条件的设施" />

        <div class="pagination-wrap" v-if="filteredFacilityList.length">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[8, 12, 20, 40]"
            :total="filteredFacilityList.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </template>
    </section>

    <el-drawer
      v-model="detailDrawerVisible"
      :with-header="false"
      size="760px"
      class="detail-drawer"
    >
      <div v-loading="detailLoading" class="detail-layout" v-if="detailFacility">
        <section class="detail-hero">
          <div class="detail-cover">
            <img
              v-if="detailFacility.imageUrl"
              :src="detailFacility.imageUrl"
              :alt="detailFacility.name"
              @error="handleImageError"
            />
            <div v-else class="media-fallback detail-fallback">
              <el-icon><Picture /></el-icon>
            </div>
          </div>

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
            <span class="detail-label">近 {{ detailQueryDays }} 天预约</span>
            <strong>{{ upcomingReservations.length }}</strong>
          </article>
          <article class="detail-info-card">
            <span class="detail-label">预约状态</span>
            <strong>{{ detailFacility.status === 'AVAILABLE' ? '可直接预约' : '暂不可预约' }}</strong>
          </article>
        </section>

        <section class="detail-panel">
          <div class="section-title">
            <h3>近期预约安排</h3>
            <span>展示最近 {{ detailQueryDays }} 天内的预约时间段</span>
          </div>

          <div v-if="upcomingReservations.length" class="timeline-list">
            <article v-for="item in upcomingReservations" :key="item.id" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-top">
                  <strong>{{ formatDateTime(item.startTime) }}</strong>
                  <el-tag :type="getReservationStatusType(item.status)" size="small" effect="light">
                    {{ getReservationStatusText(item.status) }}
                  </el-tag>
                </div>
                <p>{{ item.userName || '未知用户' }} · {{ item.purpose || '未填写使用目的' }}</p>
                <span>结束时间：{{ formatDateTime(item.endTime) }}</span>
              </div>
            </article>
          </div>
          <el-empty v-else description="最近几天暂无预约安排" />
        </section>

        <div class="drawer-actions">
          <el-button class="ghost-btn" @click="detailDrawerVisible = false">关闭</el-button>
          <el-button
            type="primary"
            class="reserve-btn"
            :disabled="detailFacility.status !== 'AVAILABLE'"
            @click="handleReserve(detailFacility)"
          >
            <el-icon><Calendar /></el-icon>
            预约此设施
          </el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="dialogVisible"
      width="620px"
      class="reservation-dialog"
      destroy-on-close
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-badge">
            <el-icon><Calendar /></el-icon>
          </div>
          <div>
            <h3>提交预约</h3>
            <p>{{ currentFacility.name || '请选择设施' }}</p>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="reservation-form">
        <div class="form-grid">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="form.startTime"
              type="datetime"
              style="width: 100%"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm"
              placeholder="请选择开始时间"
              :disabled-date="disabledStartDate"
            />
          </el-form-item>

          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="form.endTime"
              type="datetime"
              style="width: 100%"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm"
              placeholder="请选择结束时间"
              :disabled-date="disabledEndDate"
            />
          </el-form-item>
        </div>

        <el-form-item label="使用目的" prop="purpose">
          <el-input
            v-model="form.purpose"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请简要填写用途、活动内容或实验说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="ghost-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="reserve-btn" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            提交预约
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  ArrowRight,
  Calendar,
  Check,
  CircleCheck,
  CircleClose,
  InfoFilled,
  Loading,
  Picture,
  RefreshRight,
  Search,
  Tools
} from '@element-plus/icons-vue';
import { facilityAPI, facilityCategoryAPI, reservationAPI } from '../../api';

const allFacilityList = ref([]);
const categories = ref([]);
const searchKeyword = ref('');
const selectedCategory = ref('');
const selectedStatus = ref('');
const sortBy = ref('');
const currentPage = ref(1);
const pageSize = ref(8);
const dialogVisible = ref(false);
const detailDrawerVisible = ref(false);
const detailLoading = ref(false);
const loading = ref(true);
const formRef = ref(null);
const listSectionRef = ref(null);
const currentFacility = ref({});
const detailFacility = ref(null);
const upcomingReservations = ref([]);
const detailQueryDays = ref(7);
const userInfo = ref({});

const form = ref({
  facilityId: null,
  userId: null,
  startTime: '',
  endTime: '',
  purpose: ''
});

const rules = {
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' },
    { validator: validateStartTime, trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    { validator: validateEndTime, trigger: 'change' }
  ],
  purpose: [{ required: true, message: '请填写使用目的', trigger: 'blur' }]
};

const filteredFacilityList = computed(() => {
  let filtered = [...allFacilityList.value];
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (keyword) {
    filtered = filtered.filter((item) =>
      [item.name, item.model, item.category, item.location, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword))
    );
  }

  if (selectedCategory.value) {
    filtered = filtered.filter((item) => item.category === selectedCategory.value);
  }

  if (selectedStatus.value) {
    filtered = filtered.filter((item) => item.status === selectedStatus.value);
  }

  if (sortBy.value) {
    filtered.sort((a, b) => {
      if (sortBy.value === 'nameAsc') {
        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
      }
      if (sortBy.value === 'nameDesc') {
        return String(b.name || '').localeCompare(String(a.name || ''), 'zh-CN');
      }
      if (sortBy.value === 'status') {
        const order = { AVAILABLE: 1, MAINTENANCE: 2, DAMAGED: 3 };
        return (order[a.status] || 9) - (order[b.status] || 9);
      }
      return 0;
    });
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
  const info = localStorage.getItem('userInfo');
  if (info) {
    userInfo.value = JSON.parse(info);
  }
  loadFacilityList();
  loadCategories();
});

async function loadFacilityList() {
  try {
    loading.value = true;
    const res = await facilityAPI.list();
    allFacilityList.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('加载设施列表失败:', error);
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
  } catch (error) {
    console.error('加载设施分类失败:', error);
    categories.value = [];
  }
}

function handleFilterChange() {
  currentPage.value = 1;
}

function clearAllFilters() {
  searchKeyword.value = '';
  selectedCategory.value = '';
  selectedStatus.value = '';
  sortBy.value = '';
  currentPage.value = 1;
}

function handleCurrentChange(page) {
  currentPage.value = page;
}

function handleSizeChange(size) {
  pageSize.value = size;
  currentPage.value = 1;
}

function scrollToList() {
  listSectionRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
}

async function openDetail(item) {
  detailDrawerVisible.value = true;
  detailLoading.value = true;
  currentFacility.value = { ...item };
  detailFacility.value = { ...item };

  try {
    const result = await facilityAPI.getDetail(item.id, 7);
    const payload = result.data || {};
    detailFacility.value = payload.facility || item;
    upcomingReservations.value = payload.reservations || [];
    detailQueryDays.value = payload.queryDays || 7;
  } catch (error) {
    console.error('加载设施详情失败:', error);
    upcomingReservations.value = [];
    detailQueryDays.value = 7;
    detailFacility.value = { ...item };
    ElMessage.error('加载设施详情失败');
  } finally {
    detailLoading.value = false;
  }
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
  nextTick(() => formRef.value?.clearValidate());
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    const response = await reservationAPI.create(form.value);
    ElMessage.success(response.message || '预约提交成功');
    dialogVisible.value = false;

    if (detailFacility.value?.id) {
      openDetail(detailFacility.value);
    }
  } catch (error) {
    console.error('提交预约失败:', error);
  }
}

function disabledStartDate(time) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
}

function disabledEndDate(time) {
  if (!form.value.startTime) {
    return false;
  }
  const startDate = new Date(form.value.startTime);
  startDate.setHours(0, 0, 0, 0);
  return time.getTime() < startDate.getTime();
}

function validateStartTime(rule, value, callback) {
  if (!value) {
    callback(new Error('请选择开始时间'));
    return;
  }
  const startDate = new Date(value);
  if (Number.isNaN(startDate.getTime())) {
    callback(new Error('开始时间格式不正确'));
    return;
  }
  if (startDate < new Date()) {
    callback(new Error('开始时间不能早于当前时间'));
    return;
  }
  callback();
}

function validateEndTime(rule, value, callback) {
  if (!value) {
    callback(new Error('请选择结束时间'));
    return;
  }
  const endDate = new Date(value);
  const startDate = new Date(form.value.startTime);
  if (Number.isNaN(endDate.getTime())) {
    callback(new Error('结束时间格式不正确'));
    return;
  }
  if (form.value.startTime && endDate <= startDate) {
    callback(new Error('结束时间必须晚于开始时间'));
    return;
  }
  callback();
}

function getStatusType(status) {
  const map = {
    AVAILABLE: 'success',
    MAINTENANCE: 'warning',
    DAMAGED: 'danger'
  };
  return map[status] || 'info';
}

function getStatusText(status) {
  const map = {
    AVAILABLE: '可用',
    MAINTENANCE: '维护中',
    DAMAGED: '已损坏'
  };
  return map[status] || '未知状态';
}

function getReservationStatusType(status) {
  const map = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    COMPLETED: 'info',
    CANCELLED: 'info'
  };
  return map[status] || 'info';
}

function getReservationStatusText(status) {
  const map = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  };
  return map[status] || '未知状态';
}

function formatDateTime(value) {
  if (!value) {
    return '未设置';
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function handleImageError(event) {
  event.target.style.display = 'none';
}
</script>

<style scoped>
.facility-theme {
  --theme-main: #5aa499;
  --theme-deep: #3b8078;
  --theme-soft: rgba(143, 210, 199, 0.24);
  --theme-border: rgba(127, 194, 184, 0.22);
  --theme-shadow: rgba(90, 164, 153, 0.16);
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(204, 238, 231, 0.7), transparent 24%),
    radial-gradient(circle at right center, rgba(224, 245, 240, 0.9), transparent 22%),
    linear-gradient(180deg, #f8fcfb 0%, #f4faf8 45%, #eef7f4 100%);
}

.page-hero,
.summary-card,
.control-card,
.panel-card,
.facility-card {
  animation: rise-in 0.55s ease both;
}

.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 320px;
  gap: 20px;
  padding: 30px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--theme-border);
  box-shadow: 0 24px 60px var(--theme-shadow);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
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
  font-size: 34px;
  color: #143730;
}

.hero-copy p {
  margin: 0;
  color: #617872;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.hero-primary-btn,
.hero-secondary-btn,
.ghost-btn,
.reserve-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
}

.hero-primary-btn,
.reserve-btn {
  border: none;
  background: linear-gradient(135deg, #5aa499 0%, #3b8078 100%);
  box-shadow: 0 14px 28px rgba(59, 128, 120, 0.22);
}

.hero-secondary-btn,
.ghost-btn {
  border: 1px solid rgba(116, 177, 168, 0.24);
  background: rgba(255, 255, 255, 0.86);
  color: #447971;
}

.hero-aside {
  display: grid;
  gap: 14px;
}

.mini-card {
  min-height: 132px;
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, #f7fdfb 0%, #ffffff 100%);
  border: 1px solid var(--theme-border);
}

.mini-card span,
.mini-card small {
  color: #70827d;
}

.mini-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 32px;
  color: #153c35;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.summary-card {
  padding: 20px 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(127, 194, 184, 0.14);
  box-shadow: 0 18px 40px rgba(31, 41, 55, 0.06);
}

.summary-label,
.summary-card p {
  color: #728680;
}

.summary-card strong {
  display: block;
  margin: 12px 0 8px;
  font-size: 30px;
  color: #173e38;
}

.summary-card p {
  margin: 0;
  font-size: 13px;
}

.control-card,
.panel-card {
  margin-top: 20px;
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(127, 194, 184, 0.16);
  box-shadow: 0 20px 44px rgba(31, 41, 55, 0.07);
}

.control-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.control-copy h2,
.panel-head h3,
.section-title h3 {
  margin: 0;
  color: #173d37;
}

.control-copy p,
.panel-head p,
.section-title span {
  margin: 8px 0 0;
  color: #6d817c;
  line-height: 1.7;
}

.control-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 150px;
}

.facility-panel {
  scroll-margin-top: 24px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(143, 210, 199, 0.2);
  color: #3e746e;
  font-size: 12px;
  font-weight: 600;
}

.meta-muted {
  background: rgba(239, 248, 246, 0.95);
  color: #6f817d;
}

.loading-wrap {
  display: grid;
  place-items: center;
  min-height: 260px;
  color: #6c817c;
}

.loading-icon {
  font-size: 34px;
  margin-bottom: 12px;
  color: var(--theme-deep);
}

.facility-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.facility-card {
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(127, 194, 184, 0.16);
  background: linear-gradient(180deg, #ffffff 0%, #fbfefd 100%);
  box-shadow: 0 18px 40px rgba(31, 41, 55, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}

.facility-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 46px rgba(31, 41, 55, 0.1);
}

.card-media {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #edf8f5 0%, #dff0eb 100%);
}

.card-media img,
.detail-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #74a29b;
  font-size: 36px;
}

.status-pill {
  position: absolute;
  top: 14px;
  right: 14px;
  border: none;
}

.card-body {
  padding: 18px 18px 12px;
}

.card-head h4 {
  margin: 0;
  color: #183d37;
  font-size: 20px;
}

.card-head span {
  display: inline-block;
  margin-top: 6px;
  color: #728681;
  font-size: 13px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.info-item {
  padding: 12px;
  border-radius: 16px;
  background: #f6fbf9;
}

.info-item label,
.detail-label {
  display: block;
  color: #748782;
  font-size: 12px;
}

.info-item strong,
.detail-info-card strong {
  display: block;
  margin-top: 8px;
  color: #193f39;
  line-height: 1.6;
}

.card-desc {
  margin: 16px 0 0;
  color: #667a75;
  line-height: 1.8;
  min-height: 56px;
}

.card-actions,
.drawer-actions,
.dialog-footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
}

.card-actions {
  padding: 0 18px 18px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 22px;
}

.detail-layout {
  display: grid;
  gap: 20px;
  padding: 8px 4px 20px;
}

.detail-hero {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 18px;
  padding: 22px;
  border-radius: 28px;
  background: linear-gradient(135deg, #f7fdfb 0%, #eef8f4 100%);
}

.detail-cover {
  overflow: hidden;
  border-radius: 22px;
  min-height: 220px;
  background: linear-gradient(135deg, #edf8f5 0%, #dff0eb 100%);
}

.detail-fallback {
  min-height: 220px;
}

.detail-copy h2 {
  margin: 14px 0 10px;
  color: #163c36;
}

.detail-copy p {
  margin: 0;
  color: #667a75;
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
  background: #fbfefd;
  border: 1px solid rgba(127, 194, 184, 0.14);
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
  background: linear-gradient(135deg, #5aa499, #3b8078);
  box-shadow: 0 0 0 6px rgba(90, 164, 153, 0.14);
}

.timeline-content {
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(127, 194, 184, 0.14);
}

.timeline-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.timeline-content p {
  margin: 10px 0 6px;
  color: #2c443f;
}

.timeline-content span {
  color: #728682;
  font-size: 12px;
}

.drawer-actions {
  margin-top: 4px;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dialog-header h3 {
  margin: 0;
  color: #163d37;
}

.dialog-header p {
  margin: 6px 0 0;
  color: #6e827d;
}

.dialog-badge {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(143, 210, 199, 0.24);
  color: var(--theme-deep);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.facility-theme :deep(.el-input__wrapper),
.facility-theme :deep(.el-select__wrapper),
.facility-theme :deep(.el-textarea__inner),
.facility-theme :deep(.el-date-editor.el-input__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  background: #f9fcfb;
  border: 1px solid rgba(127, 194, 184, 0.2);
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
