<template>
  <div class="dashboard-shell">
    <section class="dashboard-hero">
      <div class="hero-copy">
        <span class="eyebrow">Maintenance Dashboard</span>
        <h1>数据统计</h1>
        <p>展示本人负责场地的维护任务、设施热度、预约高峰和热门区域，方便你快速判断开放策略和处理优先级。</p>
      </div>

      <div class="hero-tools">
        <el-select v-model="timeRange" class="range-select" @change="reloadDashboard">
          <el-option label="近 1 天" value="1d" />
          <el-option label="近 7 天" value="7d" />
          <el-option label="近 30 天" value="30d" />
          <el-option label="近 180 天" value="180d" />
          <el-option label="近 365 天" value="365d" />
        </el-select>

        <div class="quick-links">
          <button type="button" @click="goTo('/maintainer/facility')">查看场地</button>
          <button type="button" @click="goTo('/maintainer/maintenance')">维护登记</button>
          <button type="button" @click="goTo('/maintainer/reservation')">预约处理</button>
          <button type="button" @click="goTo('/maintainer/violation-report')">违规上报</button>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card" @click="goTo('/maintainer/facility')">
        <span class="stat-label">负责场地</span>
        <strong>{{ stats.totalFacilities }}</strong>
      </article>
      <article class="stat-card" @click="goTo('/maintainer/maintenance', { status: 'PENDING' })">
        <span class="stat-label">待处理维护</span>
        <strong>{{ stats.pendingMaintenance }}</strong>
      </article>
      <article class="stat-card" @click="goTo('/maintainer/maintenance', { status: 'IN_PROGRESS' })">
        <span class="stat-label">进行中维护</span>
        <strong>{{ stats.inProgressMaintenance }}</strong>
      </article>
      <article class="stat-card" @click="goTo('/maintainer/maintenance', { status: 'COMPLETED' })">
        <span class="stat-label">已完成维护</span>
        <strong>{{ stats.completedMaintenance }}</strong>
      </article>
    </section>

    <section class="chart-grid major-grid">
      <el-card class="chart-card wide-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>维护任务趋势</h2>
              <p>按时间观察维护任务新增、处理中和完成情况。</p>
            </div>
          </div>
        </template>
        <div ref="trendChartRef" class="chart-body tall-chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>维护类型分布</h2>
              <p>了解当前维护工作重心。</p>
            </div>
          </div>
        </template>
        <div ref="pieChartRef" class="chart-body tall-chart"></div>
      </el-card>
    </section>

    <section class="chart-grid secondary-grid">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>平均维护时长</h2>
              <p>不同维护类型的平均处理时长对比。</p>
            </div>
          </div>
        </template>
        <div ref="durationChartRef" class="chart-body medium-chart"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <div>
              <h2>故障高发场地</h2>
              <p>场地故障频次越高，越需要重新审视维护节奏。</p>
            </div>
          </div>
        </template>
        <div ref="faultChartRef" class="chart-body medium-chart"></div>
      </el-card>
    </section>

    <section class="chart-grid heatmap-grid">
      <div class="heatmap-column">
        <el-card class="chart-card wide-card">
          <template #header>
            <div class="card-header">
              <div>
                <h2>设施热力图</h2>
                <p>横轴为小时段，纵轴为设施，颜色越深表示该时段预约越密集。</p>
              </div>
            </div>
          </template>
          <div ref="heatmapChartRef" class="chart-body heatmap-chart"></div>
        </el-card>

        <el-card class="chart-card fill-card">
          <template #header>
            <div class="card-header">
              <div>
                <h2>设施使用率排行</h2>
                <p>帮助快速识别过热和闲置资源。</p>
              </div>
            </div>
          </template>
          <div class="list-panel tall-list-panel">
            <article v-for="item in topFacilities" :key="item.facilityId" class="list-row">
              <div>
                <strong>{{ item.facilityName }}</strong>
                <span>{{ item.location || '未标注区域' }}</span>
              </div>
              <div class="list-metric">
                <strong>{{ item.utilizationRate }}%</strong>
                <span>{{ item.reservationCount }} 次预约</span>
              </div>
            </article>
            <el-empty v-if="!topFacilities.length" description="暂无设施使用率数据" />
          </div>
        </el-card>
      </div>

      <div class="stack-panel heatmap-side-panel">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <div>
                <h2>预约高峰时段</h2>
                <p>帮助判断开放时段和现场值守压力。</p>
              </div>
            </div>
          </template>
          <div ref="peakChartRef" class="chart-body medium-chart"></div>
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <div>
                <h2>热门区域</h2>
                <p>按区域聚合预约热度和使用率。</p>
              </div>
            </div>
          </template>
          <div class="list-panel">
            <article v-for="item in hotRegions" :key="item.location" class="list-row">
              <div>
                <strong>{{ item.location }}</strong>
                <span>{{ item.facilityCount }} 个场地</span>
              </div>
              <div class="list-metric">
                <strong>{{ item.bookingCount }}</strong>
                <span>{{ item.utilizationRate }}%</span>
              </div>
            </article>
            <el-empty v-if="!hotRegions.length" description="暂无区域热度数据" />
          </div>
        </el-card>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { maintenanceAPI, reservationAPI } from '../../api'

const router = useRouter()

const trendChartRef = ref(null)
const pieChartRef = ref(null)
const durationChartRef = ref(null)
const faultChartRef = ref(null)
const heatmapChartRef = ref(null)
const peakChartRef = ref(null)

const timeRange = ref('30d')
const stats = ref({
  totalFacilities: 0,
  totalMaintenance: 0,
  pendingMaintenance: 0,
  inProgressMaintenance: 0,
  completedMaintenance: 0
})

const trendSeries = ref({
  labels: [],
  total: [],
  completed: [],
  pending: [],
  inProgress: []
})
const typeDistribution = ref([])
const durationStats = ref([])
const faultRanking = ref([])
const heatmapStats = ref({
  facilities: [],
  timeSlots: [],
  heatmapData: [],
  peakHours: [],
  hotRegions: [],
  facilityUsage: []
})

let trendChart
let pieChart
let durationChart
let faultChart
let heatmapChart
let peakChart

const hotRegions = computed(() => heatmapStats.value.hotRegions || [])
const topFacilities = computed(() => (heatmapStats.value.facilityUsage || []).slice(0, 8))

onMounted(async () => {
  await reloadDashboard()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  disposeCharts()
})

const reloadDashboard = async () => {
  await Promise.all([loadSummary(), loadMaintenanceCharts(), loadHeatmapAnalytics()])
  await nextTick()
  renderCharts()
}

const loadSummary = async () => {
  try {
    const response = await maintenanceAPI.getSummaryStats()
    if (response.data) {
      stats.value = {
        totalFacilities: response.data.totalFacilities || 0,
        totalMaintenance: response.data.totalMaintenance || 0,
        pendingMaintenance: response.data.pendingMaintenance || 0,
        inProgressMaintenance: response.data.inProgressMaintenance || 0,
        completedMaintenance: response.data.completedMaintenance || 0
      }
    }
  } catch (error) {
    console.error('加载维护汇总失败:', error)
  }
}

const loadMaintenanceCharts = async () => {
  try {
    const [trendResponse, typeResponse, durationResponse, faultResponse] = await Promise.all([
      maintenanceAPI.getStatsByTimeRange(timeRange.value),
      maintenanceAPI.getTypeDistribution(timeRange.value),
      maintenanceAPI.getDurationStats(timeRange.value),
      maintenanceAPI.getFacilityFaultStats(timeRange.value)
    ])

    trendSeries.value = buildTrendSeries(trendResponse.data?.maintenances || [])
    typeDistribution.value = typeResponse.data?.typeDistribution || []
    durationStats.value = durationResponse.data?.durationData || []
    faultRanking.value = faultResponse.data?.faultRanking || []
  } catch (error) {
    console.error('加载维护图表失败:', error)
  }
}

const loadHeatmapAnalytics = async () => {
  try {
    const response = await reservationAPI.getHeatmapStats(timeRange.value)
    heatmapStats.value = response.data || {
      facilities: [],
      timeSlots: [],
      heatmapData: [],
      peakHours: [],
      hotRegions: [],
      facilityUsage: []
    }
  } catch (error) {
    console.error('加载热力统计失败:', error)
  }
}

const buildTrendSeries = (maintenances) => {
  const buckets = new Map()

  maintenances.forEach((item) => {
    const rawDate = item.createdAt || item.startTime
    if (!rawDate) {
      return
    }

    const date = new Date(rawDate)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (!buckets.has(key)) {
      buckets.set(key, {
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0
      })
    }

    const bucket = buckets.get(key)
    bucket.total += 1
    if (item.status === 'COMPLETED') {
      bucket.completed += 1
    } else if (item.status === 'PENDING') {
      bucket.pending += 1
    } else if (item.status === 'IN_PROGRESS') {
      bucket.inProgress += 1
    }
  })

  const labels = [...buckets.keys()].sort()
  return {
    labels,
    total: labels.map((label) => buckets.get(label).total),
    completed: labels.map((label) => buckets.get(label).completed),
    pending: labels.map((label) => buckets.get(label).pending),
    inProgress: labels.map((label) => buckets.get(label).inProgress)
  }
}

const renderCharts = () => {
  renderTrendChart()
  renderPieChart()
  renderDurationChart()
  renderFaultChart()
  renderHeatmapChart()
  renderPeakChart()
}

const renderTrendChart = () => {
  trendChart = reuseChart(trendChart, trendChartRef.value)
  if (!trendChart) return

  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 36, right: 18, bottom: 32, top: 42, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendSeries.value.labels
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } }
    },
    series: [
      {
        name: '总量',
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(143, 198, 234, 0.14)' },
        lineStyle: { color: '#8fc6ea', width: 3 },
        data: trendSeries.value.total
      },
      {
        name: '待处理',
        type: 'line',
        smooth: true,
        lineStyle: { color: '#f59e0b', width: 2 },
        data: trendSeries.value.pending
      },
      {
        name: '进行中',
        type: 'line',
        smooth: true,
        lineStyle: { color: '#ef4444', width: 2 },
        data: trendSeries.value.inProgress
      },
      {
        name: '已完成',
        type: 'line',
        smooth: true,
        lineStyle: { color: '#10b981', width: 2 },
        data: trendSeries.value.completed
      }
    ]
  })
}

const renderPieChart = () => {
  pieChart = reuseChart(pieChart, pieChartRef.value)
  if (!pieChart) return

  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['50%', '45%'],
        label: { formatter: '{b}\n{d}%' },
        data: typeDistribution.value
      }
    ]
  })
}

const renderDurationChart = () => {
  durationChart = reuseChart(durationChart, durationChartRef.value)
  if (!durationChart) return

  durationChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 18, bottom: 32, top: 24, containLabel: true },
    xAxis: {
      type: 'category',
      data: durationStats.value.map((item) => item.type)
    },
    yAxis: {
      type: 'value',
      name: '小时'
    },
    series: [
      {
        type: 'bar',
        barWidth: 36,
        itemStyle: {
          borderRadius: [12, 12, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#8fc6ea' },
            { offset: 1, color: '#6daed6' }
          ])
        },
        data: durationStats.value.map((item) => item.avgDuration)
      }
    ]
  })
}

const renderFaultChart = () => {
  faultChart = reuseChart(faultChart, faultChartRef.value)
  if (!faultChart) return

  faultChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 110, right: 18, bottom: 24, top: 16, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: faultRanking.value.map((item) => item.facilityName).reverse()
    },
    series: [
      {
        type: 'bar',
        data: faultRanking.value.map((item) => item.faultCount).reverse(),
        barWidth: 20,
        itemStyle: {
          borderRadius: [0, 10, 10, 0],
          color: '#f97316'
        }
      }
    ]
  })
}

const renderHeatmapChart = () => {
  heatmapChart = reuseChart(heatmapChart, heatmapChartRef.value)
  if (!heatmapChart) return

  heatmapChart.setOption({
    tooltip: {
      formatter: (params) => {
        const [hourIndex, facilityIndex, value] = params.value
        const facility = heatmapStats.value.facilities?.[facilityIndex] || '未知场地'
        const slot = heatmapStats.value.timeSlots?.[hourIndex] || '-'
        return `${facility}<br/>${slot}<br/>预约热度：${value}`
      }
    },
    grid: { left: 110, right: 24, bottom: 76, top: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: heatmapStats.value.timeSlots || [],
      splitArea: { show: true },
      axisLabel: {
        margin: 14,
        color: '#64748b'
      }
    },
    yAxis: {
      type: 'category',
      data: heatmapStats.value.facilities || [],
      splitArea: { show: true },
      axisLabel: {
        color: '#64748b'
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...((heatmapStats.value.heatmapData || []).map((item) => item[2])), 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 6,
      text: ['高热度', '低热度'],
      textGap: 12,
      textStyle: {
        color: '#64748b'
      },
      inRange: {
        color: ['#f0f9ff', '#b3ddf2', '#8fc6ea', '#5a9ecb']
      }
    },
    series: [
      {
        type: 'heatmap',
        data: heatmapStats.value.heatmapData || [],
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(15, 23, 42, 0.18)'
          }
        }
      }
    ]
  })
}

const renderPeakChart = () => {
  peakChart = reuseChart(peakChart, peakChartRef.value)
  if (!peakChart) return

  peakChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 16, bottom: 26, top: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: (heatmapStats.value.peakHours || []).map((item) => item.hour)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        type: 'bar',
        barWidth: 26,
        data: (heatmapStats.value.peakHours || []).map((item) => item.bookingCount),
        itemStyle: {
          borderRadius: [10, 10, 0, 0],
          color: '#8fc6ea'
        }
      }
    ]
  })
}

const reuseChart = (instance, dom) => {
  if (!dom) {
    return null
  }
  if (!instance) {
    return echarts.init(dom)
  }
  if (instance.getDom() !== dom) {
    instance.dispose()
    return echarts.init(dom)
  }
  return instance
}

const handleResize = () => {
  trendChart?.resize()
  pieChart?.resize()
  durationChart?.resize()
  faultChart?.resize()
  heatmapChart?.resize()
  peakChart?.resize()
}

const disposeCharts = () => {
  trendChart?.dispose()
  pieChart?.dispose()
  durationChart?.dispose()
  faultChart?.dispose()
  heatmapChart?.dispose()
  peakChart?.dispose()
}

const goTo = (path, query) => {
  router.push({ path, query })
}
</script>

<style scoped>
.dashboard-shell {
  padding: 24px;
  min-height: 100%;
  background:
    radial-gradient(circle at top right, var(--feature-soft), transparent 24%),
    linear-gradient(180deg, var(--layout-shell-top) 0%, var(--layout-shell-bottom) 100%);
}

.dashboard-hero,
.chart-card,
.stat-card {
  animation: rise-in 0.55s ease both;
}

.dashboard-hero {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  padding: 28px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 60px var(--feature-glow);
  border: 1px solid var(--feature-soft);
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
  color: #0f172a;
  font-size: 34px;
}

.hero-copy p {
  margin: 0;
  color: #52606d;
  line-height: 1.7;
}

.hero-tools {
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
}

.range-select {
  width: 220px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quick-links button {
  padding: 14px 16px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--feature-primary) 0%, var(--feature-secondary) 100%);
  color: #2c3e50;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.quick-links button:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 28px var(--feature-glow);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.stat-card {
  padding: 20px 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 26px 44px rgba(15, 23, 42, 0.12);
}

.stat-label {
  color: #6b7280;
  font-size: 13px;
}

.stat-card strong {
  display: block;
  margin-top: 12px;
  font-size: 30px;
  color: #0f172a;
}

.chart-grid {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.major-grid {
  grid-template-columns: 1.6fr 1fr;
}

.secondary-grid,
.heatmap-grid {
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
}

.heatmap-grid {
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 1fr);
}

.heatmap-column,
.stack-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 20px;
  min-width: 0;
}

.wide-card {
  min-width: 0;
}

.fill-card {
  height: 100%;
}

.chart-card {
  border: none;
  border-radius: 26px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
}

.card-header p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.chart-body {
  width: 100%;
}

.tall-chart {
  height: 360px;
}

.medium-chart {
  height: 280px;
}

.heatmap-chart {
  height: 460px;
}

.list-panel {
  display: grid;
  gap: 12px;
}

.tall-list-panel {
  height: 100%;
  align-content: start;
}

.list-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--feature-surface) 0%, #ffffff 100%);
  border: 1px solid var(--feature-soft);
}

.list-row strong {
  display: block;
  color: #0f172a;
}

.list-row span {
  display: block;
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.list-metric {
  text-align: right;
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
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .major-grid,
  .secondary-grid,
  .heatmap-grid {
    grid-template-columns: 1fr;
  }

  .heatmap-column,
  .stack-panel {
    grid-template-rows: auto;
  }
}

@media (max-width: 900px) {
  .dashboard-hero {
    grid-template-columns: 1fr;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-shell {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>