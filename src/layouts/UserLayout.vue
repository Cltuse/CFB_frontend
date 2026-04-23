<template>
  <div class="user-layout" :style="themeVars">
    <Header />
    <div class="main-container">
      <!-- 侧边栏菜单 -->
      <div class="sidebar-container">
        <el-menu
          :default-active="activeMenu"
          class="side-menu"
          @select="handleMenuSelect"
          :collapse="false"
          unique-opened
        >
          <el-menu-item index="/user/welcome" class="menu-item">
            <el-icon class="menu-icon-item"><Star /></el-icon>
            <template #title>
              <span class="menu-text">欢迎页</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/user/facility" class="menu-item">
            <el-icon class="menu-icon-item"><Box /></el-icon>
            <template #title>
              <span class="menu-text">设施浏览</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/user/my-reservation" class="menu-item">
            <el-icon class="menu-icon-item"><Calendar /></el-icon>
            <template #title>
              <span class="menu-text">我的预约</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/user/violation-records" class="menu-item">
            <el-icon class="menu-icon-item"><Warning /></el-icon>
            <template #title>
              <span class="menu-text">违规记录</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/user/feedback" class="menu-item">
            <el-icon class="menu-icon-item"><ChatDotRound /></el-icon>
            <template #title>
              <span class="menu-text">意见反馈</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/user/notice" class="menu-item">
            <el-icon class="menu-icon-item"><Bell /></el-icon>
            <template #title>
              <span class="menu-text">系统通知</span>
            </template>
          </el-menu-item>

          <el-menu-item index="/user/profile" class="menu-item">
            <el-icon class="menu-icon-item"><User /></el-icon>
            <template #title>
              <span class="menu-text">个人中心</span>
            </template>
          </el-menu-item>
        </el-menu>

        <!-- 侧边栏底部装饰 -->
        <div class="sidebar-footer">
          <div class="footer-decoration"></div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="content-area">
        <section class="route-hero">
          <div class="hero-copy">
            <span class="hero-kicker">{{ currentTheme.kicker }}</span>
            <h1>{{ currentTheme.title }}</h1>
            <p>{{ currentTheme.description }}</p>
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
import { Star, Box, Calendar, Bell, User, Warning, ChatDotRound } from '@element-plus/icons-vue';
import Header from '../components/Header.vue';
import '../assets/maintainer-surface-theme.css';
import { buildFeatureVars, resolveFeatureTheme } from '../utils/featureTheme';

const router = useRouter();
const route = useRoute();
const activeMenu = ref(route.path);

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath;
});

const handleMenuSelect = (index) => {
  router.push(index);
};

const currentTheme = computed(() => resolveFeatureTheme(route.path));
const themeVars = computed(() => buildFeatureVars(currentTheme.value));
</script>

<style scoped>
.user-layout {
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

/* 侧边栏容器 */
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

/* 侧边栏菜单 */
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

.side-menu :deep(.el-menu-item):before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.side-menu :deep(.el-menu-item:hover):before {
  opacity: 1;
}

.side-menu :deep(.el-menu-item.is-active) {
  color: #ffffff;
  background: linear-gradient(135deg, var(--feature-primary, #4f9b96) 0%, var(--feature-secondary, #89cbc2) 100%);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--feature-glow, rgba(79, 155, 150, 0.15)) 55%, transparent);
  font-weight: 600;
}

.side-menu :deep(.el-menu-item.is-active):before {
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

/* 侧边栏底部装饰 */
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

/* 主内容区域 */
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
  grid-template-columns: 1.6fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
  padding: 26px 28px;
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--feature-primary, #0f766e) 14%, #ffffff);
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--feature-soft, rgba(20, 184, 166, 0.15)) 62%, #ffffff) 0%, #ffffff 58%),
    #ffffff;
  box-shadow: 0 16px 34px color-mix(in srgb, var(--feature-glow, rgba(15, 118, 110, 0.28)) 24%, transparent);
}

.hero-copy {
  position: relative;
  z-index: 2;
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

.route-content-shell {
  min-height: calc(100% - 190px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-container {
    width: 160px;
  }

  .sidebar-header {
    padding: 16px 16px;
  }

  .menu-title {
    font-size: 16px;
  }

  .menu-icon {
    width: 32px;
    height: 32px;
  }

  .menu-icon svg {
    width: 16px;
    height: 16px;
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
}
</style>
