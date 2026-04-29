<template>
  <div class="admin-layout" :style="layoutVars">
    <Header />
    <div class="main-container">
      <aside class="sidebar-container">
        <el-menu
          :default-active="activeMenu"
          class="side-menu"
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
      </aside>

      <main class="content-area">
        <div :key="route.path" class="route-content-shell">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from '../components/Header.vue';
import { buildFeatureVars, getRoleTheme } from '../utils/featureTheme';
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

const router = useRouter();
const route = useRoute();
const activeMenu = ref(route.path);
const layoutVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
  }
);

const handleMenuSelect = (index) => {
  router.push(index);
};
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--layout-shell-bg);
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar-container {
  width: 200px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(252, 253, 255, 0.96) 100%);
  border-right: 1px solid var(--layout-sidebar-border);
  box-shadow: var(--layout-sidebar-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.side-menu {
  flex: 1;
  border: none;
  background: transparent;
  padding: 20px 0;
}

.side-menu :deep(.el-menu-item) {
  margin: 0 12px 8px;
  border-radius: 16px;
  padding: 0 16px;
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  transition: all 0.3s ease;
}

.side-menu :deep(.el-menu-item:hover) {
  color: var(--feature-strong);
  transform: translateX(4px);
  background: linear-gradient(135deg, var(--feature-soft) 0%, #ffffff 100%);
  box-shadow: 0 10px 22px var(--feature-glow);
}

.side-menu :deep(.el-menu-item.is-active) {
  color: #ffffff;
  background: linear-gradient(135deg, var(--feature-primary) 0%, var(--feature-secondary) 100%);
  box-shadow: 0 12px 28px var(--feature-glow);
  font-weight: 600;
}

.side-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
}

.side-menu :deep(.el-menu-item:hover .el-icon) {
  color: var(--feature-primary);
  transform: scale(1.08);
}

.side-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #ffffff;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.sidebar-footer {
  padding: 20px 0;
}

.footer-decoration {
  height: 3px;
  margin: 0 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--feature-primary) 0%, var(--feature-secondary) 50%, var(--feature-primary) 100%);
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--content-area-bg);
}

.route-content-shell {
  min-height: 100%;
  animation: route-shell-enter 0.35s ease;
}

@keyframes route-shell-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .sidebar-container {
    width: 160px;
  }

  .side-menu :deep(.el-menu-item) {
    margin: 0 8px 6px;
    padding: 0 12px;
    height: 44px;
    line-height: 44px;
    font-size: 13px;
  }

  .content-area {
    padding: 16px;
  }
}
</style>
