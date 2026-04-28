<template>
  <div class="admin-dashboard-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Data Statistics</span>
        <h1>数据统计</h1>        
        <p>展示平台当前的设施、预约、用户等数据统计信息，帮助管理员快速了解系统运行状态。</p>
      </div>

      <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="loadDashboard">刷新概览</el-button>
          <el-select v-model="timeRange" class="range-select" @change="handleTimeRangeChange">
            <el-option label="近 7 天" value="7d" />
            <el-option label="近 30 天" value="30d" />
            <el-option label="近半年" value="180d" />
            <el-option label="近一年" value="365d" />
          </el-select>
        </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">设施总数</span>
        <strong>{{ overview.totalFacility }}</strong>
        <p>平台当前收录的全部设施数量</p>
      </article>
      <article class="stat-card success-card">
        <span class="stat-label">可用设施</span>
        <strong>{{ overview.availableFacility }}</strong>
        <p>状态正常并可继续接受预约的设施</p>
      </article>
      <article class="stat-card warning-card">
        <span class="stat-label">预约总数</span>
        <strong>{{ reservationSummary.totalReservations }}</strong>
        <p>全部历史预约记录累计数量</p>
      </article>
      <article class="stat-card info-card">
        <span class="stat-label">用户总数</span>
        <strong>{{ overview.totalUser }}</strong>
        <p>系统中的全部用户账号数量</p>
      </article>
    </section>

    <section class="panel-card visual-grid">
      <article class="chart-card">
        <div class="chart-head">
          <div>
            <h2>设施分类分布</h2>
            <p>展示不同设施分类的数量占比，便于查看资源结构。</p>
          </div>
          <span class="meta-chip">分类 {{ facilityCategoryData.length }} 项</span>
        </div>
        <div ref="categoryChartRef" class="chart-body"></div>
      </article>

      <article class="chart-card">
        <div class="chart-head">
          <div>
            <h2>设施状态概览</h2>
            <p>快速查看可用、维护中与损坏设施的当前分布。</p>
          </div>
          <span class="meta-chip muted-chip">实时同步设施状态</span>
        </div>
        <div ref="statusChartRef" class="chart-body"></div>
      </article>

      <article class="chart-card">
        <div class="chart-head">
          <div>
            <h2>预约趋势变化</h2>
            <p>根据所选时间范围展示预约新增趋势，便于判断近期活跃度。</p>
          </div>
          <span class="meta-chip">{{ timeRangeLabel }}</span>
        </div>
        <div ref="reservationTrendChartRef" class="chart-body"></div>
      </article>

      <article class="chart-card">
        <div class="chart-head">
          <div>
            <h2>预约分类分布</h2>
            <p>查看当前时间范围内各类设施预约的热度差异。</p>
          </div>
          <span class="meta-chip">{{ reservationCategoryData.length }} 类</span>
        </div>
        <div ref="reservationCategoryChartRef" class="chart-body"></div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import * as echarts from 'echarts';
import { adminAPI, facilityAPI, reservationAPI, userAPI } from '../../api';
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme';

const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

const overview = ref({
  totalFacility: 0,
  availableFacility: 0,
  totalUser: 0
});

const reservationSummary = ref({
  totalReservations: 0,
  pendingReservations: 0,
  approvedReservations: 0,
  completedReservations: 0,
  rejectedReservations: 0,
  cancelledReservations: 0,
  checkedInReservations: 0,
  checkedOutReservations: 0,
  missedReservations: 0,
  todayTotal: 0,
  todayPending: 0,
  todayApproved: 0
});

const facilityList = ref([]);
const facilityCategoryData = ref([]);
const facilityStatusData = ref([]);
const reservationTrendData = ref([]);
const reservationCategoryData = ref([]);
const timeRange = ref('7d');

const categoryChartRef = ref(null);
const statusChartRef = ref(null);
const reservationTrendChartRef = ref(null);
const reservationCategoryChartRef = ref(null);

let categoryChart = null;
let statusChart = null;
let reservationTrendChart = null;
let reservationCategoryChart = null;

const timeRangeLabel = computed(
  () =>
    ({
      '7d': '近 7 天',
      '30d': '近 30 天',
      '180d': '近半年',
      '365d': '近一年'
    })[timeRange.value] || '近 7 天'
);

onMounted(async () => {
  await loadDashboard();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  disposeCharts();
});

async function loadDashboard() {
  await Promise.all([loadOverview(), loadReservationSummary(), loadReservationVisuals()]);
  buildFacilityCharts();
  await nextTick();
  renderCharts();
}

async function loadOverview() {
  try {
    const [facilityRes, availableRes, userRes] = await Promise.all([
      facilityAPI.list(),
      facilityAPI.available(),
      userAPI.list()
    ]);

    facilityList.value = Array.isArray(facilityRes.data) ? facilityRes.data : facilityRes.data?.content || [];
    overview.value = {
      totalFacility: resolveCount(facilityRes.data),
      availableFacility: resolveCount(availableRes.data),
      totalUser: resolveCount(userRes.data)
    };
  } catch (error) {
    console.error('加载概览数据失败:', error);
  }
}

async function loadReservationSummary() {
  try {
    const res = await adminAPI.getReservationStats();
    reservationSummary.value = {
      ...reservationSummary.value,
      ...(res.data || {})
    };
  } catch (error) {
    console.error('加载预约统计失败:', error);
  }
}

async function loadReservationVisuals() {
  try {
    const [trendRes, categoryRes] = await Promise.all([
      reservationAPI.getStatsByTimeRange(timeRange.value),
      reservationAPI.getCategoryStats(timeRange.value)
    ]);

    const trendSource =
      trendRes.data?.reservations ||
      trendRes.data?.data?.reservations ||
      trendRes.data?.data ||
      trendRes.data ||
      [];

    const categorySource =
      categoryRes.data?.categoryData ||
      categoryRes.data?.data?.categoryData ||
      categoryRes.data?.data ||
      categoryRes.data ||
      [];

    reservationTrendData.value = normalizeReservationTrend(trendSource);
    reservationCategoryData.value = normalizeReservationCategory(categorySource);
  } catch (error) {
    console.error('加载预约图表数据失败:', error);
    reservationTrendData.value = [];
    reservationCategoryData.value = [];
  }
}

function buildFacilityCharts() {
  const categoryCount = {};
  const statusCount = {
    AVAILABLE: 0,
    MAINTENANCE: 0,
    DAMAGED: 0,
    DISABLED: 0
  };

  facilityList.value.forEach((facility) => {
    const category = facility.category || '未分类';
    categoryCount[category] = (categoryCount[category] || 0) + 1;

    if (statusCount[facility.status] !== undefined) {
      statusCount[facility.status] += 1;
    }
  });

  facilityCategoryData.value = Object.entries(categoryCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  facilityStatusData.value = [
    { name: '可用', value: statusCount.AVAILABLE, itemStyle: { color: '#5ebd84' } },
    { name: '维护中', value: statusCount.MAINTENANCE, itemStyle: { color: '#f0b36f' } },
    { name: '损坏', value: statusCount.DAMAGED, itemStyle: { color: '#ef8a96' } },
    { name: '停用', value: statusCount.DISABLED, itemStyle: { color: '#9ba9c2' } }
  ].filter((item) => item.value > 0);
}

async function handleTimeRangeChange() {
  await loadReservationVisuals();
  await nextTick();
  renderCharts();
}

function resolveCount(payload) {
  if (Array.isArray(payload)) {
    return payload.length;
  }
  if (typeof payload?.totalElements === 'number') {
    return payload.totalElements;
  }
  if (Array.isArray(payload?.content)) {
    return payload.content.length;
  }
  return 0;
}

function normalizeReservationTrend(source) {
  const grouped = {};
  const list = Array.isArray(source) ? source : [];

  list.forEach((item) => {
    if (typeof item?.date === 'string' && typeof item?.count === 'number') {
      grouped[item.date] = item.count;
      return;
    }

    if (typeof item?.date === 'string' && typeof item?.total === 'number') {
      grouped[item.date] = item.total;
      return;
    }

    const rawDate = item?.createdAt || item?.date || item?.startTime;
    if (!rawDate) {
      return;
    }

    const date = String(rawDate).replace('T', ' ').slice(0, 10);
    grouped[date] = (grouped[date] || 0) + (item?.count || 1);
  });

  return Object.keys(grouped)
    .sort()
    .map((date) => ({
      date,
      value: grouped[date]
    }));
}

function normalizeReservationCategory(source) {
  const list = Array.isArray(source) ? source : [];
  return list
    .map((item) => ({
      name: item.name || item.category || item.categoryName || '未分类',
      value: item.value ?? item.count ?? 0
    }))
    .filter((item) => item.value > 0);
}

function disposeCharts() {
  categoryChart?.dispose();
  statusChart?.dispose();
  reservationTrendChart?.dispose();
  reservationCategoryChart?.dispose();
  categoryChart = null;
  statusChart = null;
  reservationTrendChart = null;
  reservationCategoryChart = null;
}

function renderCharts() {
  disposeCharts();

  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value);
    categoryChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: facilityCategoryData.value.map((item) => item.name),
        axisLabel: {
          color: '#70839f',
          interval: 0,
          rotate: facilityCategoryData.value.length > 6 ? 26 : 0
        },
        axisLine: { lineStyle: { color: '#dbe5f4' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#70839f' },
        splitLine: { lineStyle: { color: '#edf2fa' } }
      },
      series: [
        {
          type: 'bar',
          data: facilityCategoryData.value.map((item) => item.value),
          barWidth: '48%',
          itemStyle: {
            borderRadius: [10, 10, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7cb5ff' },
              { offset: 1, color: '#4f84df' }
            ])
          }
        }
      ]
    });
  }

  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value);
    statusChart.setOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['42%', '72%'],
          center: ['50%', '52%'],
          itemStyle: {
            borderRadius: 12,
            borderColor: '#fff',
            borderWidth: 3
          },
          label: { color: '#647893' },
          data: facilityStatusData.value
        }
      ]
    });
  }

  if (reservationTrendChartRef.value) {
    reservationTrendChart = echarts.init(reservationTrendChartRef.value);
    reservationTrendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: reservationTrendData.value.map((item) => item.date),
        axisLabel: { color: '#70839f', rotate: reservationTrendData.value.length > 7 ? 24 : 0 },
        axisLine: { lineStyle: { color: '#dbe5f4' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#70839f' },
        splitLine: { lineStyle: { color: '#edf2fa' } }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: reservationTrendData.value.map((item) => item.value),
          symbolSize: 8,
          itemStyle: { color: '#f0b36f' },
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#f0b36f' },
              { offset: 1, color: '#ef8a96' }
            ])
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(240, 179, 111, 0.32)' },
              { offset: 1, color: 'rgba(240, 179, 111, 0.04)' }
            ])
          }
        }
      ]
    });
  }

  if (reservationCategoryChartRef.value) {
    reservationCategoryChart = echarts.init(reservationCategoryChartRef.value);
    reservationCategoryChart.setOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['38%', '68%'],
          center: ['50%', '52%'],
          itemStyle: {
            borderRadius: 12,
            borderColor: '#fff',
            borderWidth: 3
          },
          label: { color: '#647893' },
          data: reservationCategoryData.value
        }
      ],
      color: ['#78adff', '#5ebd84', '#f0b36f', '#ef8a96', '#9ba9c2', '#7cc8ad']
    });
  }
}

function handleResize() {
  categoryChart?.resize();
  statusChart?.resize();
  reservationTrendChart?.resize();
  reservationCategoryChart?.resize();
}
</script>

<style scoped>
.admin-dashboard-page {
  --theme-main: var(--feature-primary);
  --theme-deep: var(--feature-strong);
  --theme-soft: var(--feature-soft);
  --theme-border: var(--feature-border);
  --theme-shadow: var(--feature-glow);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(198, 240, 236, 0.74), transparent 26%),
    radial-gradient(circle at right center, rgba(236, 250, 248, 0.92), transparent 24%),
    linear-gradient(180deg, #f8fdfc 0%, #f5fbfa 48%, #f2faf7 100%);
}

.page-hero,
.stat-card,
.summary-card,
.panel-card,
.hero-note,
.chart-card {
  animation: dashboard-rise 0.55s ease both;
}

.page-hero,
.stat-card,
.summary-card,
.panel-card,
.hero-note,
.chart-card {
  border-radius: 28px;
  border: 1px solid var(--theme-border);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 320px;
  gap: 20px;
  padding: 30px;
  background:
    radial-gradient(circle at top right, var(--theme-soft), transparent 30%),
    linear-gradient(145deg, rgba(239, 252, 250, 0.96) 0%, #ffffff 62%);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(163, 228, 222, 0.24);
  color: #458a84;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.chart-head h2 {
  margin: 14px 0 10px;
  color: #1b4a45;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.chart-head p,
.stat-card p,
.summary-card p {
  margin: 0;
  color: #718d88;
  line-height: 1.8;
}

.hero-actions,
.panel-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-actions {
  margin-top: 24px;
}

.primary-btn {
  min-height: 44px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #5bb7b0 0%, #338b84 100%);
  box-shadow: 0 14px 28px rgba(51, 139, 132, 0.22);
}

.range-select {
  width: 160px;
}

.range-select :deep(.el-select__wrapper) {
  min-height: 44px;
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid rgba(91, 183, 176, 0.2);
  background: #f9fcfc;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-note {
  min-height: 132px;
  padding: 22px;
  background: linear-gradient(180deg, #f8fcfc 0%, #ffffff 100%);
}

.hero-note span,
.hero-note small,
.stat-label,
.summary-label {
  color: #788f8b;
}

.hero-note strong,
.stat-card strong,
.summary-card strong {
  color: #1d4a45;
}

.hero-note strong,
.stat-card strong,
.summary-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
}

.stats-grid,
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card,
.summary-card {
  padding: 22px;
  background: linear-gradient(150deg, rgba(239, 252, 250, 0.96) 0%, #ffffff 84%);
}

.success-card {
  background: linear-gradient(150deg, rgba(240, 252, 245, 0.96) 0%, #ffffff 84%);
}

.warning-card {
  background: linear-gradient(150deg, rgba(255, 248, 238, 0.96) 0%, #ffffff 84%);
}

.info-card {
  background: linear-gradient(150deg, rgba(244, 247, 251, 0.96) 0%, #ffffff 84%);
}

.visual-grid {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.chart-card {
  padding: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfefd 100%);
}

.chart-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.meta-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(163, 228, 222, 0.24);
  color: #498881;
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(244, 248, 247, 0.96);
  color: #7f928e;
}

.chart-body {
  height: 320px;
}

@keyframes dashboard-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1180px) {
  .page-hero,
  .visual-grid,
  .stats-grid,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid,
  .summary-grid,
  .visual-grid {
    grid-template-columns: 1fr;
  }

  .page-hero,
  .panel-card {
    padding: 18px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .chart-head {
    flex-direction: column;
  }

  .range-select {
    width: 100%;
  }
}
</style>
