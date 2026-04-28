<template>
  <div class="welcome-page">
    <section class="welcome-hero">
      <div class="hero-copy">
        <span class="hero-kicker">校园设施服务台</span>
        <h1>欢迎回来，{{ displayName }}</h1>
        <p>
          今天也适合高效安排课程、实验和活动。这里保留用户端的轻量操作流，让你可以更快进入设施浏览、预约管理和反馈处理。
        </p>
        <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="goTo('/user/facility')">
            浏览设施
          </el-button>
          <el-button class="secondary-btn" @click="goTo('/user/my-reservation')">
            查看预约
          </el-button>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <article class="feature-card weather-card">
        <div class="card-head">
          <div>
            <h2>今日心情与天气</h2>
            <p>把环境信息和一句轻松提示放在一起，首页会更自然，也更实用。</p>
          </div>
          <el-button class="refresh-btn" :loading="loading" @click="fetchWeather">刷新天气</el-button>
        </div>

        <div class="weather-layout">
          <div class="weather-visual">
            <img
              v-if="isRenderableWeatherImage"
              :src="resolvedWeatherIcon"
              :alt="weatherInfo.weatherType || '天气图标'"
              class="weather-icon"
              @error="handleWeatherIconError"
            />
            <span v-else class="weather-emoji">{{ weatherEmoji }}</span>
            <strong>{{ weatherInfo.temperature || '--' }}</strong>
            <span class="weather-type">{{ weatherInfo.weatherType || '晴' }}</span>
          </div>

          <div class="weather-content">
            <div class="weather-row">
              <label>城市</label>
              <span>{{ weatherInfo.city || '校园附近' }}</span>
            </div>
            <div class="weather-row">
              <label>更新时间</label>
              <span>{{ weatherInfo.updateTime || '刚刚' }}</span>
            </div>
            <p class="weather-quote">
              {{ weatherInfo.moodQuote || '愿你今天的学习和预约都顺顺利利。' }}
            </p>
          </div>
        </div>
      </article>

      <article class="feature-card action-card">
        <div class="card-head">
          <div>
            <h2>快捷功能</h2>
            <p>每个入口都做成独立卡片，用户一眼就能找到要去的页面。</p>
          </div>
        </div>

        <div class="action-grid">
          <button
            v-for="item in quickActions"
            :key="item.path"
            type="button"
            class="quick-action"
            @click="goTo(item.path)"
          >
            <span class="quick-action-badge" :class="item.tone">{{ item.short }}</span>
            <div class="quick-action-copy">
              <strong>{{ item.title }}</strong>
              <p>{{ item.desc }}</p>
            </div>
            <span class="quick-action-arrow">→</span>
          </button>
        </div>
      </article>
    </section>

    <section v-if="currentUser?.id" class="recommend-shell">
      <div class="recommend-head">
        <div>
          <h2>个性化推荐</h2>
          <p>沿用当前清新的卡片风格，但内容更偏向用户实际使用场景。</p>
        </div>
      </div>
      <RecommendWidget :userId="currentUser.id" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { weatherAPI } from '../../api/weather';
import RecommendWidget from '../../components/RecommendWidget.vue';

const router = useRouter();
const currentUser = ref(null);
const loading = ref(false);
const weatherIconBroken = ref(false);

const weatherInfo = ref({
  weatherType: '晴',
  temperature: '25℃',
  weatherIcon: '☀',
  moodQuote: '愿你今天的学习、实验和预约安排都顺顺利利。',
  city: '北京',
  updateTime: ''
});

const quickActions = [
  {
    path: '/user/facility',
    title: '设施浏览',
    desc: '查看当前可预约设施与详细信息',
    short: '设',
    tone: 'mint'
  },
  {
    path: '/user/my-reservation',
    title: '我的预约',
    desc: '快速查看审批、签到和历史预约记录',
    short: '约',
    tone: 'sky'
  },
  {
    path: '/user/violation-records',
    title: '违规记录',
    desc: '了解信用扣分和历史违规处理情况',
    short: '规',
    tone: 'peach'
  },
  {
    path: '/user/feedback',
    title: '意见反馈',
    desc: '提交建议、投诉或咨询并查看回复',
    short: '反',
    tone: 'gold'
  }
];

const displayName = computed(() => currentUser.value?.realName || currentUser.value?.username || '同学');

const normalizeWeatherIcon = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().replace(/\\/g, '/');
  if (!normalized) {
    return '';
  }

  if (/^(https?:|data:image)/i.test(normalized)) {
    return normalized;
  }

  const filesIndex = normalized.indexOf('/files/');
  if (filesIndex >= 0) {
    return normalized.slice(filesIndex);
  }

  if (normalized.startsWith('files/')) {
    return `/${normalized}`;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  return '';
};

const resolvedWeatherIcon = computed(() => normalizeWeatherIcon(weatherInfo.value.weatherIcon));

const isRenderableWeatherImage = computed(() => {
  if (weatherIconBroken.value) {
    return false;
  }
  return /\.(png|jpe?g|gif|svg|webp|bmp|ico)(\?.*)?$/i.test(resolvedWeatherIcon.value);
});

const weatherEmoji = computed(() => {
  if (typeof weatherInfo.value.weatherIcon === 'string' && !resolvedWeatherIcon.value) {
    return weatherInfo.value.weatherIcon || '☀';
  }
  return '☀';
});

const initUserInfo = () => {
  currentUser.value = JSON.parse(localStorage.getItem('userInfo') || '{}');
};

const goTo = (path) => {
  router.push(path);
};

const applyWeatherData = (data) => {
  weatherIconBroken.value = false;
  weatherInfo.value = {
    weatherType: data?.weatherType || '晴',
    temperature: data?.temperature || '25℃',
    weatherIcon: data?.weatherIcon || '☀',
    moodQuote: data?.moodQuote || '愿你今天的学习和预约都顺顺利利。',
    city: data?.city || '北京',
    updateTime: data?.updateTime || new Date().toLocaleString('zh-CN', { hour12: false })
  };
};

const fetchWeather = async () => {
  loading.value = true;
  try {
    const autoResponse = await weatherAPI.getAutoWeather();
    if (autoResponse.data?.data) {
      applyWeatherData(autoResponse.data.data);
      return;
    }
  } catch (error) {
    console.error('自动定位获取天气失败:', error);
  }

  try {
    const fallbackResponse = await weatherAPI.getWeather('北京');
    if (fallbackResponse.data?.data) {
      applyWeatherData(fallbackResponse.data.data);
      return;
    }
  } catch (error) {
    console.error('默认城市天气获取失败:', error);
  } finally {
    loading.value = false;
  }

  applyWeatherData({
    weatherType: '晴',
    temperature: '25℃',
    weatherIcon: '☀',
    moodQuote: '天气数据暂时未刷新成功，但愿你今天依然有明亮心情。',
    city: '北京',
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false })
  });
  loading.value = false;
};

const handleWeatherIconError = () => {
  weatherIconBroken.value = true;
};

onMounted(() => {
  initUserInfo();
  fetchWeather();
});
</script>

<style scoped>
.welcome-page {
  --page-primary: #f5b7c0;
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(245, 183, 192, 0.32), transparent 28%),
    radial-gradient(circle at right center, rgba(252, 228, 232, 0.48), transparent 20%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.welcome-hero,
.feature-card,
.recommend-shell {
  border-radius: 30px;
  border: 1px solid rgba(245, 183, 192, 0.14);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20px 44px rgba(94, 52, 62, 0.06);
}

.welcome-hero {
  padding: 30px;
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.48), transparent 24%),
    linear-gradient(145deg, rgba(245, 183, 192, 0.18) 0%, #ffffff 62%);
}

.hero-kicker {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(245, 183, 192, 0.14);
  color: #c4677a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 16px 0 12px;
  font-size: 36px;
  color: #7a4052;
}

.hero-copy p {
  margin: 0;
  color: #8a6a76;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.primary-btn,
.secondary-btn,
.refresh-btn {
  min-height: 44px;
  border-radius: 14px;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  box-shadow: 0 14px 28px rgba(232, 144, 157, 0.2);
}

.secondary-btn,
.refresh-btn {
  border: 1px solid rgba(245, 183, 192, 0.18);
  background: rgba(255, 255, 255, 0.86);
  color: #c4677a;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
  gap: 20px;
}

.feature-card,
.recommend-shell {
  padding: 24px;
}

.card-head,
.recommend-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.card-head h2,
.recommend-head h2 {
  margin: 0;
  color: #7a4052;
}

.card-head p,
.recommend-head p {
  margin: 8px 0 0;
  color: #8e717b;
  line-height: 1.7;
}

.weather-card {
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.48), transparent 22%),
    linear-gradient(155deg, rgba(245, 183, 192, 0.14) 0%, #ffffff 64%);
}

.weather-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
}

.weather-visual {
  padding: 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(245, 183, 192, 0.16);
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 240px;
  align-content: center;
}

.weather-icon {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.weather-emoji {
  font-size: 56px;
  line-height: 1;
}

.weather-visual strong {
  font-size: 30px;
  color: #7a4052;
}

.weather-type {
  color: #8e717b;
}

.weather-content {
  display: grid;
  gap: 12px;
}

.weather-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #fef8f9;
}

.weather-row label {
  color: #8e717b;
}

.weather-row span {
  color: #c4677a;
  font-weight: 600;
}

.weather-quote {
  margin: 0;
  padding: 18px;
  border-radius: 20px;
  background: rgba(245, 183, 192, 0.12);
  color: #8a6a76;
  line-height: 1.8;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.quick-action {
  appearance: none;
  width: 100%;
  padding: 18px;
  border: 1px solid rgba(245, 183, 192, 0.14);
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(254, 248, 249, 0.98));
  display: flex;
  gap: 14px;
  align-items: center;
  text-align: left;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  font: inherit;
  color: inherit;
}

.quick-action:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 28px rgba(94, 52, 62, 0.08);
}

.quick-action-badge {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 17px;
  font-weight: 700;
  flex-shrink: 0;
}

.quick-action-badge.mint {
  background: rgba(245, 183, 192, 0.38);
  color: #c4677a;
}

.quick-action-badge.sky {
  background: rgba(245, 183, 192, 0.24);
  color: #c4677a;
}

.quick-action-badge.peach {
  background: rgba(245, 183, 192, 0.34);
  color: #d4768a;
}

.quick-action-badge.gold {
  background: rgba(245, 183, 192, 0.28);
  color: #c4677a;
}

.quick-action-copy {
  flex: 1;
  min-width: 0;
}

.quick-action-copy strong {
  display: block;
  color: #7a4052;
  font-size: 16px;
}

.quick-action-copy p {
  margin: 6px 0 0;
  color: #8e717b;
  line-height: 1.6;
}

.quick-action-arrow {
  color: #c4677a;
  font-size: 18px;
  font-weight: 700;
}

@media (max-width: 1200px) {
  .action-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .content-grid,
  .weather-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-hero,
  .feature-card,
  .recommend-shell {
    padding: 18px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .card-head,
  .recommend-head,
  .hero-actions {
    flex-direction: column;
  }
}
</style>
<style scoped>
.welcome-page {
  --theme-deep: #e8909d;
  --theme-border: rgba(245, 183, 192, 0.16);
  --theme-shadow: rgba(94, 52, 62, 0.08);
  background:
    radial-gradient(circle at top left, rgba(245, 183, 192, 0.38), transparent 28%),
    radial-gradient(circle at right center, rgba(252, 228, 232, 0.48), transparent 20%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.welcome-hero,
.feature-card,
.recommend-shell,
.quick-action {
  animation: welcome-rise 0.55s ease both;
  border-color: var(--theme-border);
  box-shadow: 0 20px 46px var(--theme-shadow);
}

.welcome-hero {
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.48), transparent 24%),
    linear-gradient(145deg, rgba(254, 248, 249, 0.96) 0%, #ffffff 62%);
}

.weather-card {
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.48), transparent 22%),
    linear-gradient(155deg, rgba(254, 248, 249, 0.96) 0%, #ffffff 64%);
}

.quick-action {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.quick-action:hover {
  box-shadow: 0 18px 30px rgba(94, 52, 62, 0.1);
}

@keyframes welcome-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
