<template>
  <div class="user-layout">
    <Header />
    <div class="main-container">
      <aside class="sidebar-container">
        <el-menu
          :default-active="activeMenu"
          class="side-menu"
          unique-opened
          @select="handleMenuSelect"
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
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Star, Box, Calendar, Bell, User, Warning, ChatDotRound } from '@element-plus/icons-vue';
import Header from '../components/Header.vue';

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
</script>

<style scoped>
.user-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fbfdff 0%, #f5f8fc 52%, #f8fbff 100%);
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar-container {
  width: 200px;
  background: #ffffff;
  border-right: 1px solid rgba(211, 219, 231, 0.72);
  box-shadow: 10px 0 28px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.side-menu {
  flex: 1;
  border: none;
  background: #ffffff;
  padding: 20px 0;
}

.side-menu :deep(.el-menu-item) {
  margin: 0 12px 8px;
  border-radius: 14px;
  padding: 0 16px;
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  transition: all 0.3s ease;
}

.side-menu :deep(.el-menu-item:hover) {
  color: #252b47;
  transform: translateX(4px);
  background: linear-gradient(135deg, #f5f8ff 0%, #ffffff 100%);
  box-shadow: 0 10px 18px rgba(144, 166, 204, 0.14);
}

.side-menu :deep(.el-menu-item.is-active) {
  color: #ffffff;
  background: linear-gradient(135deg, #8fb7ff 0%, #6ba5ff 100%);
  box-shadow: 0 12px 24px rgba(107, 165, 255, 0.26);
  font-weight: 600;
}

.side-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  transition: all 0.3s ease;
}

.side-menu :deep(.el-menu-item:hover .el-icon) {
  transform: scale(1.1);
  color: #6ba5ff;
}

.side-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #ffffff;
  transform: scale(1.1);
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
  background: linear-gradient(90deg, #b8d2ff 0%, #8fb7ff 50%, #b8d2ff 100%);
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: linear-gradient(135deg, #fbfdff 0%, #f7faff 48%, #fdfcff 100%);
}

.route-content-shell {
  min-height: 100%;
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
