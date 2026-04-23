<template>
  <div class="admin-layout" :style="themeVars">
    <Header />
    <div class="main-container">
      <div class="sidebar-container">
        <el-menu
          :default-active="activeMenu"
          class="side-menu"
          :collapse="false"
          unique-opened
          @select="handleMenuSelect"
        >
          <el-menu-item index="/admin/dashboard" class="menu-item">
            <el-icon class="menu-icon-item"><DataAnalysis /></el-icon>
            <template #title>
              <span class="menu-text">数据统计</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/facility" class="menu-item">
            <el-icon class="menu-icon-item"><Box /></el-icon>
            <template #title>
              <span class="menu-text">设施管理</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/facility-category" class="menu-item">
            <el-icon class="menu-icon-item"><Collection /></el-icon>
            <template #title>
              <span class="menu-text">设施类别</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/reservation" class="menu-item">
            <el-icon class="menu-icon-item"><Calendar /></el-icon>
            <template #title>
              <span class="menu-text">预约管理</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/maintenance" class="menu-item">
            <el-icon class="menu-icon-item"><Tools /></el-icon>
            <template #title>
              <span class="menu-text">维护管理</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/user" class="menu-item">
            <el-icon class="menu-icon-item"><User /></el-icon>
            <template #title>
              <span class="menu-text">用户管理</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/violation-records" class="menu-item">
            <el-icon class="menu-icon-item"><Warning /></el-icon>
            <template #title>
              <span class="menu-text">违规记录</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/notice" class="menu-item">
            <el-icon class="menu-icon-item"><Bell /></el-icon>
            <template #title>
              <span class="menu-text">通知管理</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/rule-config" class="menu-item">
            <el-icon class="menu-icon-item"><Setting /></el-icon>
            <template #title>
              <span class="menu-text">规则配置</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/blacklist" class="menu-item">
            <el-icon class="menu-icon-item"><Warning /></el-icon>
            <template #title>
              <span class="menu-text">黑名单管理</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/feedback" class="menu-item">
            <el-icon class="menu-icon-item"><ChatDotSquare /></el-icon>
            <template #title>
              <span class="menu-text">意见反馈</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/operation-log" class="menu-item">
            <el-icon class="menu-icon-item"><Document /></el-icon>
            <template #title>
              <span class="menu-text">操作日志</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/admin/profile" class="menu-item">
            <el-icon class="menu-icon-item"><Setting /></el-icon>
            <template #title>
              <span class="menu-text">个人中心</span>
            </template>
          </el-menu-item>
        </el-menu>

        <div class="sidebar-footer">
          <div class="footer-decoration"></div>
        </div>
      </div>

      <div class="content-area">
        <section class="route-hero">
          <div class="hero-copy">
            <span class="hero-kicker">{{ currentTheme.kicker }}</span>
            <h1>{{ currentTheme.title }}</h1>
            <p>{{ currentTheme.description }}</p>
          </div>

          <div class="hero-visual" aria-hidden="true">
            <div class="hero-glass hero-glass-strong"></div>
            <div class="hero-glass"></div>
          </div>
        </section>

        <div :key="route.path" class="route-content-shell">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from '../components/Header.vue';
import {
  Setting,
  Warning,
  Document,
  User,
  Bell,
  ChatDotSquare,
  DataAnalysis,
  Box,
  Collection,
  Calendar,
  Tools
} from '@element-plus/icons-vue';
import '../assets/maintainer-surface-theme.css';
import { buildFeatureVars, resolveFeatureTheme } from '../utils/featureTheme';

const router = useRouter();
const route = useRoute();
const activeMenu = ref(route.path);

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
  }
);

const handleMenuSelect = (index) => {
  router.push(index);
};

const currentTheme = computed(() => resolveFeatureTheme(route.path));
const adminSurfaceTheme = computed(() => ({
  ...currentTheme.value,
  primary: '#5da8a1',
  secondary: '#91d2c7',
  soft: 'rgba(145, 210, 199, 0.18)',
  glow: 'rgba(93, 168, 161, 0.18)'
}));
const themeVars = computed(() => buildFeatureVars(adminSurfaceTheme.value));
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ecfffb 0%, #f8fdfa 46%, #f3fffb 100%);
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar-container {
  width: 200px;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.side-menu {
  flex: 1;
  border: none;
  background: #ffffff;
  padding: 20px 0;
}

.side-menu :deep(.el-menu-item) {
  margin: 0 12px 8px 12px;
  border-radius: 12px;
  padding: 0 16px;
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.side-menu :deep(.el-menu-item)::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--feature-primary, #4f9b96) 8%, #ffffff) 0%,
    color-mix(in srgb, var(--feature-secondary, #89cbc2) 14%, #ffffff) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
  z-index: -1;
}

.side-menu :deep(.el-menu-item:hover) {
  color: #252b47;
  transform: translateX(4px);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--feature-soft, rgba(137, 203, 194, 0.16)) 42%, #ffffff) 0%,
    #ffffff 100%
  );
  box-shadow: 0 8px 18px color-mix(in srgb, var(--feature-glow, rgba(79, 155, 150, 0.15)) 35%, transparent);
}

.side-menu :deep(.el-menu-item:hover)::before {
  opacity: 1;
}

.side-menu :deep(.el-menu-item.is-active) {
  color: #ffffff;
  background: linear-gradient(135deg, var(--feature-primary, #4f9b96) 0%, var(--feature-secondary, #89cbc2) 100%);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--feature-glow, rgba(79, 155, 150, 0.15)) 55%, transparent);
  font-weight: 600;
}

.side-menu :deep(.el-menu-item.is-active)::before {
  opacity: 1;
  background: transparent;
}

.side-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  transition: all 0.3s ease;
}

.side-menu :deep(.el-menu-item:hover .el-icon) {
  transform: scale(1.1);
  color: var(--feature-primary, #4f9b96);
}

.side-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #ffffff;
  transform: scale(1.1);
}

.menu-icon-item {
  font-size: 18px;
  margin-right: 12px;
  transition: all 0.3s ease;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.sidebar-footer {
  padding: 20px 0;
  position: relative;
}

.footer-decoration {
  height: 3px;
  background: linear-gradient(90deg, var(--feature-primary, #0f766e) 0%, var(--feature-secondary, #14b8a6) 50%, var(--feature-primary, #0f766e) 100%);
  margin: 0 16px;
  border-radius: 2px;
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: linear-gradient(180deg, #ecfffb 0%, #f8fdfa 46%, #f3fffb 100%);
  position: relative;
}

.route-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) 340px;
  align-items: stretch;
  gap: 20px;
  margin-bottom: 18px;
  padding: 28px 30px;
  min-height: 192px;
  border-radius: 30px;
  border: 1px solid color-mix(in srgb, var(--feature-primary, #0f766e) 14%, #ffffff);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--feature-soft, rgba(20, 184, 166, 0.15)) 92%, transparent), transparent 34%),
    linear-gradient(145deg, color-mix(in srgb, var(--feature-soft, rgba(20, 184, 166, 0.15)) 62%, #ffffff) 0%, #ffffff 58%),
    #ffffff;
  box-shadow: 0 16px 34px color-mix(in srgb, var(--feature-glow, rgba(15, 118, 110, 0.28)) 24%, transparent);
}

.hero-copy {
  position: relative;
  z-index: 2;
  align-self: center;
}

.hero-kicker {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--feature-primary, #0f766e);
  background: color-mix(in srgb, var(--feature-soft, rgba(137, 203, 194, 0.16)) 68%, #ffffff);
}

.hero-copy h1 {
  margin: 14px 0 10px;
  font-size: 34px;
  line-height: 1.15;
  color: #0f172a;
}

.hero-copy p {
  margin: 0;
  max-width: 72ch;
  color: #556370;
  line-height: 1.72;
}

.hero-visual {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 12px;
  align-content: center;
}

.hero-glass {
  min-height: 74px;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--feature-primary, #0f766e) 12%, #ffffff);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--feature-soft, rgba(137, 203, 194, 0.16)) 78%, #ffffff) 0%, rgba(255, 255, 255, 0.9) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.hero-glass-strong {
  min-height: 92px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--feature-soft, rgba(137, 203, 194, 0.16)) 96%, #ffffff) 0%, rgba(255, 255, 255, 0.94) 100%);
}

.route-content-shell {
  min-height: calc(100% - 190px);
}

@media (max-width: 768px) {
  .sidebar-container {
    width: 160px;
  }

  .side-menu :deep(.el-menu-item) {
    margin: 0 8px 6px 8px;
    padding: 0 12px;
    height: 44px;
    line-height: 44px;
    font-size: 13px;
  }

  .side-menu :deep(.el-menu-item .el-icon) {
    font-size: 16px;
    margin-right: 10px;
  }

  .menu-icon-item {
    font-size: 16px;
    margin-right: 10px;
  }

  .content-area {
    padding: 16px;
  }

  .route-hero {
    grid-template-columns: 1fr;
    padding: 20px;
    border-radius: 22px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .hero-visual {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
