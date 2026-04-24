<template>
  <div class="notice-page">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-decoration"></div>
      <div class="header-content">
        <h1 class="page-title">
          <div class="title-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.5 2.5A3.5 3.5 0 0 1 13 6a1 1 0 0 0 0 2 3.5 3.5 0 0 1-3.5 3.5H7a4 4 0 0 1-4-4 1 1 0 0 0-2 0 6 6 0 0 0 6 6h2.5A5.5 5.5 0 0 0 15 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          系统通知
        </h1>
        <p class="page-subtitle">查看系统公告和重要通知</p>
      </div>
    </div>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">通知总数</span>
        <strong>{{ noticeStats.total }}</strong>
        <p>当前可查看的全部系统通知</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">本页展示</span>
        <strong>{{ noticeStats.currentPage }}</strong>
        <p>按当前分页设置加载的通知数量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">近期更新</span>
        <strong>{{ noticeStats.recent }}</strong>
        <p>近 3 天内发布的通知条数</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">分页页码</span>
        <strong>{{ currentPage }}</strong>
        <p>方便快速定位当前浏览位置</p>
      </article>
    </section>

    <!-- 通知列表 -->
    <div class="notices-container" v-if="paginatedNoticeList.length > 0">
      <div
        class="notice-item"
        v-for="item in paginatedNoticeList"
        :key="item.id"
        @click="handleNoticeClick(item)"
      >
        <div class="notice-header">
          <div class="notice-left">
            <div class="notice-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 17H2L12 2L22 17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="20" x2="12.01" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="notice-title-section">
              <h3 class="notice-title">{{ item.title }}</h3>
              <p class="notice-meta">
                <span class="publisher">
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ item.publisherName }}
                </span>
                <span class="time">
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ formatTime(item.publishTime) }}
                </span>
              </p>
            </div>
          </div>
          <div class="notice-badge">
            <div class="new-badge" v-if="isNewNotice(item.publishTime)">新</div>
          </div>
        </div>

        <div class="notice-content">
          <div class="content-text">{{ item.content }}</div>
        </div>

        <div class="notice-actions">
          <div class="action-buttons">
            <el-button
              size="small"
              class="action-btn detail-btn"
              @click.stop="handleViewDetail(item)"
            >
              <el-icon><Document /></el-icon>
              查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="empty-title">暂无通知</h3>
      <p class="empty-description">当前没有任何系统通知</p>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-container" v-if="noticeList.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="noticeList.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 通知详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      width="600px"
      class="notice-detail-dialog"
      :show-close="false"
    >
      <div class="dialog-header">
        <div class="dialog-title-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M22 17H2L12 2L22 17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="20" x2="12.01" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="dialog-title-text">{{ currentNotice.title }}</span>
      </div>

      <div class="dialog-body">
        <div class="notice-info">
          <div class="info-row">
            <div class="info-item">
              <div class="info-label">发布人</div>
              <div class="info-value">{{ currentNotice.publisherName }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">发布时间</div>
              <div class="info-value">{{ formatTime(currentNotice.publishTime) }}</div>
            </div>
          </div>
        </div>

        <div class="notice-detail-content">
          <h4 class="content-title">通知内容</h4>
          <div class="content-text-full">{{ currentNotice.content }}</div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button size="large" @click="detailDialogVisible = false" class="close-btn">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import { noticeAPI } from '../../api';
const noticeList = ref([]);
const detailDialogVisible = ref(false);
const currentNotice = ref({});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

onMounted(() => {
  loadNotices();
});

// 分页后的通知列表
const paginatedNoticeList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return noticeList.value.slice(start, end);
});

const noticeStats = computed(() => ({
  total: noticeList.value.length,
  currentPage: paginatedNoticeList.value.length,
  recent: noticeList.value.filter((item) => isNewNotice(item.publishTime)).length
}));

const loadNotices = async () => {
  try {
    const res = await noticeAPI.published();
    noticeList.value = res.data;
  } catch (error) {
    console.error('加载通知失败:', error);
  }
};

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  } catch (error) {
    return timeStr;
  }
};

// 判断是否为新通知（3天内）
const isNewNotice = (timeStr) => {
  if (!timeStr) return false;
  try {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days <= 3;
  } catch (error) {
    return false;
  }
};

// 处理通知点击
const handleNoticeClick = (notice) => {
  handleViewDetail(notice);
};

// 查看详情
const handleViewDetail = (notice) => {
  currentNotice.value = notice;
  detailDialogVisible.value = true;
};

</script>

<style scoped>
/* 页面背景 */
.notice-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 25%, #e6f7ff 50%, #f8fafc 100%);
  padding: 24px;
  position: relative;
}

/* 页面标题区域 */
.page-header {
  position: relative;
  margin-bottom: 32px;
  overflow: hidden;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 50%, #409eff 100%);
  background-size: 200% 100%;
  animation: gradient-shimmer 3s ease-in-out infinite;
}

.header-content {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.header-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  line-height: 1.3;
}

.title-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transition: all 0.3s ease;
}

.title-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.25);
}

.title-icon svg {
  width: 24px;
  height: 24px;
  color: #409eff;
}

.page-subtitle {
  margin: 0;
  color: #718096;
  font-size: 14px;
  font-weight: 400;
  opacity: 0.8;
}

/* 通知容器 */
.notices-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 通知项 */
.notice-item {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.notice-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 50%, #409eff 100%);
  background-size: 200% 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.notice-item:hover::before {
  opacity: 1;
  animation: gradient-shimmer 3s ease-in-out infinite;
}

.notice-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: #bae7ff;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.notice-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.notice-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.notice-icon svg {
  width: 20px;
  height: 20px;
  color: #409eff;
}

.notice-title-section {
  flex: 1;
  min-width: 0;
}

.notice-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
  font-size: 12px;
  color: #718096;
}

.publisher, .time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.publisher svg, .time svg {
  color: #409eff;
  opacity: 0.7;
}

.notice-badge {
  flex-shrink: 0;
}

.new-badge {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(245, 101, 101, 0.3);
  animation: pulse-badge 2s infinite;
}

/* 通知内容 */
.notice-content {
  margin-bottom: 16px;
}

.content-text {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 通知操作 */
.notice-actions {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-btn {
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  padding: 8px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}


.detail-btn {
  color: #38a169;
  border-color: #38a169;
  background: rgba(72, 187, 120, 0.05);
}

.detail-btn:hover {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  color: #ffffff;
  border-color: #38a169;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f7fafc 0%, #e6f7ff 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.1);
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: #409eff;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

/* 通知详情对话框 */
.notice-detail-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.notice-detail-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.notice-detail-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: none;
}

.notice-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.notice-detail-dialog :deep(.el-dialog__footer) {
  padding: 0;
  margin: 0;
  border-top: none;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 32px;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border-bottom: 1px solid #e4e7ed;
}

.dialog-title-icon {
  width: 48px;
  height: 48px;
  background: rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.dialog-title-icon svg {
  width: 24px;
  height: 24px;
  color: #409eff;
}

.dialog-title-text {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
}

.dialog-body {
  padding: 32px;
}

.notice-info {
  margin-bottom: 24px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  gap: 32px;
}

.info-item {
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: #2d3748;
  font-weight: 600;
}

.notice-detail-content {
  margin-top: 24px;
}

.content-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 16px 0;
}

.content-text-full {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.8;
  white-space: pre-wrap;
  background: #f7fafc;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #bae7ff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px;
  background: #f8fafc;
  border-top: 1px solid #e4e7ed;
}

.close-btn {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  color: #718096;
  background: #ffffff;
  transition: all 0.3s ease;
}

.close-btn:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
  transform: translateY(-1px);
}

/* 动画效果 */
@keyframes gradient-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notice-page {
    padding: 16px;
  }

  .header-content {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .notice-item {
    padding: 20px;
  }

  .notice-left {
    gap: 12px;
  }

  .notice-icon {
    width: 36px;
    height: 36px;
  }

  .notice-title {
    font-size: 15px;
  }

  .notice-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .info-row {
    flex-direction: column;
    gap: 16px;
  }

  .dialog-body {
    padding: 20px;
  }

  .empty-state {
    padding: 60px 16px;
  }

  .empty-icon {
    width: 60px;
    height: 60px;
  }

  .empty-icon svg {
    width: 30px;
    height: 30px;
  }

  .empty-title {
    font-size: 18px;
  }
}

.notice-page {
  --page-primary: #f2a94f;
  --page-secondary: #ffd78b;
  --page-soft: rgba(255, 215, 139, 0.24);
  min-height: auto;
  padding: 0;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 215, 139, 0.18), transparent 24%),
    linear-gradient(180deg, #fffdf8 0%, #fffafd 100%);
}

.notice-page .page-header,
.notice-page .empty-state,
.notice-page .pagination-container {
  margin: 0;
  border: 1px solid rgba(242, 169, 79, 0.14);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 34px rgba(36, 25, 16, 0.05);
}

.notice-page .header-decoration {
  height: 0;
}

.notice-page .header-content {
  border: none;
  box-shadow: none;
  background:
    radial-gradient(circle at top right, var(--page-soft), transparent 28%),
    linear-gradient(145deg, color-mix(in srgb, var(--page-soft) 76%, #ffffff) 0%, #ffffff 62%);
}

.notice-page .title-icon {
  background: linear-gradient(135deg, rgba(255, 215, 139, 0.28), rgba(255, 255, 255, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.notice-page .title-icon svg {
  color: var(--page-primary);
}

.notice-page .summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.notice-page .summary-card {
  padding: 22px 20px;
  border-radius: 22px;
  border: 1px solid rgba(242, 169, 79, 0.12);
  background: linear-gradient(145deg, rgba(255, 215, 139, 0.18), #ffffff 82%);
  box-shadow: 0 12px 24px rgba(68, 46, 16, 0.05);
}

.notice-page .summary-label {
  display: block;
  margin-bottom: 10px;
  color: #907655;
  font-size: 13px;
}

.notice-page .summary-card strong {
  display: block;
  font-size: 34px;
  line-height: 1;
  color: #63431f;
}

.notice-page .summary-card p {
  margin: 10px 0 0;
  color: #9a8467;
  line-height: 1.6;
}

.notice-page .notice-item {
  border-radius: 24px;
  border-color: rgba(242, 169, 79, 0.14);
  box-shadow: 0 14px 28px rgba(55, 36, 12, 0.06);
}

.notice-page .notice-item::before {
  background: linear-gradient(90deg, #f2a94f 0%, #ffd78b 50%, #f2a94f 100%);
}

.notice-page .notice-item:hover {
  border-color: rgba(242, 169, 79, 0.24);
}

.notice-page .notice-icon {
  background: linear-gradient(135deg, rgba(255, 215, 139, 0.28), rgba(255, 255, 255, 0.98));
}

.notice-page .notice-icon svg,
.notice-page .publisher svg,
.notice-page .time svg {
  color: var(--page-primary);
}

.notice-page .detail-btn {
  color: #8d6a32;
  border-color: rgba(242, 169, 79, 0.24);
  background: rgba(255, 248, 230, 0.96);
}

.notice-page .detail-btn:hover {
  background: linear-gradient(135deg, #f2a94f 0%, #efb55f 100%);
  border-color: transparent;
}
</style>
<style scoped>
.notice-page {
  --theme-main: #f2b15b;
  --theme-deep: #cf8a2a;
  --theme-soft: rgba(255, 220, 164, 0.28);
  --theme-border: rgba(242, 177, 91, 0.18);
  --theme-shadow: rgba(92, 63, 25, 0.08);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 232, 189, 0.76), transparent 24%),
    radial-gradient(circle at left center, rgba(255, 245, 226, 0.96), transparent 24%),
    linear-gradient(180deg, #fffdf8 0%, #fffaf3 48%, #fff7ef 100%);
}

.page-header,
.summary-card,
.notice-item,
.empty-state,
.pagination-container {
  animation: notice-rise 0.55s ease both;
}

.page-header,
.empty-state,
.pagination-container {
  margin: 0;
  border: 1px solid var(--theme-border);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 52px var(--theme-shadow);
}

.page-header {
  overflow: hidden;
}

.header-decoration {
  top: 0;
  left: 0;
  right: auto;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, #f2b15b 0%, #ffdca4 100%);
  animation: none;
}

.header-content {
  border: none;
  box-shadow: none;
  padding: 30px 34px;
  background:
    radial-gradient(circle at top right, var(--theme-soft), transparent 28%),
    linear-gradient(145deg, rgba(255, 248, 228, 0.96) 0%, #ffffff 64%);
}

.page-title {
  gap: 14px;
  font-size: 32px;
  color: #69441b;
}

.title-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 220, 164, 0.42), rgba(255, 255, 255, 0.98));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.title-icon svg {
  color: var(--theme-deep);
}

.page-subtitle {
  margin-top: 10px;
  color: #947758;
  line-height: 1.8;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(242, 177, 91, 0.14);
  background: linear-gradient(150deg, rgba(255, 248, 228, 0.96) 0%, #ffffff 82%);
  box-shadow: 0 18px 40px rgba(73, 48, 18, 0.05);
}

.summary-card strong {
  font-size: 32px;
  color: #6a451d;
}

.summary-label,
.summary-card p {
  color: #9d7f5d;
}

.notices-container {
  display: grid;
  gap: 16px;
}

.notice-item {
  position: relative;
  overflow: hidden;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid var(--theme-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 252, 246, 0.98) 100%);
  box-shadow: 0 18px 42px rgba(73, 48, 18, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.notice-item::before {
  inset: 0 auto 0 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #f2b15b 0%, #ffd79d 100%);
  opacity: 1;
  animation: none;
}

.notice-item:hover {
  transform: translateY(-4px);
  border-color: rgba(242, 177, 91, 0.28);
  box-shadow: 0 24px 50px rgba(73, 48, 18, 0.1);
}

.notice-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(255, 220, 164, 0.38), rgba(255, 255, 255, 0.98));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.notice-icon svg,
.publisher svg,
.time svg {
  color: var(--theme-deep);
}

.notice-title {
  font-size: 18px;
  color: #62411b;
}

.notice-meta {
  color: #9b7f60;
}

.new-badge {
  padding: 5px 10px;
  border-radius: 999px;
  box-shadow: 0 10px 20px rgba(240, 107, 107, 0.2);
  animation: notice-badge 2s ease-in-out infinite;
}

.content-text {
  color: #6e5b45;
  line-height: 1.8;
}

.notice-actions {
  border-top-color: rgba(242, 177, 91, 0.1);
}

.detail-btn {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  color: #8d672d;
  border-color: rgba(242, 177, 91, 0.2);
  background: rgba(255, 249, 235, 0.96);
}

.detail-btn:hover {
  background: linear-gradient(135deg, #f2b15b 0%, #de972f 100%);
  border-color: transparent;
  box-shadow: 0 12px 24px rgba(222, 151, 47, 0.2);
}

.empty-state {
  padding: 72px 24px;
}

.empty-icon {
  width: 82px;
  height: 82px;
  border-radius: 26px;
  background: linear-gradient(145deg, rgba(255, 220, 164, 0.34), rgba(255, 255, 255, 0.98));
}

.empty-icon svg {
  color: var(--theme-deep);
  opacity: 0.82;
}

.empty-title {
  color: #66431c;
}

.empty-description {
  color: #9a805f;
}

.pagination-container {
  padding: 18px 24px;
}

.pagination-container :deep(.el-pagination .btn-next),
.pagination-container :deep(.el-pagination .btn-prev),
.pagination-container :deep(.el-pagination .el-pager li) {
  border-radius: 12px;
}

.pagination-container :deep(.el-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #f2b15b 0%, #de972f 100%);
  color: #ffffff;
}

.notice-detail-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.dialog-header {
  padding: 26px 30px 18px;
  background:
    radial-gradient(circle at top right, rgba(255, 220, 164, 0.34), transparent 26%),
    linear-gradient(145deg, rgba(255, 248, 228, 0.96) 0%, #ffffff 62%);
}

.dialog-title-icon {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  background: rgba(255, 220, 164, 0.38);
}

.dialog-title-icon svg {
  color: var(--theme-deep);
}

.dialog-title-text {
  font-size: 22px;
  color: #66441c;
}

.dialog-body {
  padding: 0 30px 18px;
}

.notice-info {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 249, 235, 0.72);
  border: 1px solid rgba(242, 177, 91, 0.14);
}

.info-label {
  color: #9c7e5d;
}

.info-value {
  color: #6a471f;
}

.content-text-full {
  border-radius: 22px;
  border: 1px solid rgba(242, 177, 91, 0.14);
  background: #fffdf9;
  border-left: 1px solid rgba(242, 177, 91, 0.14);
}

.dialog-footer {
  padding: 0 30px 30px;
  background: transparent;
  border-top: none;
}

.close-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid rgba(242, 177, 91, 0.18);
  color: #8d7355;
}

@keyframes notice-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes notice-badge {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .header-content,
  .notice-item,
  .empty-state,
  .pagination-container {
    padding: 18px;
  }

  .page-title {
    font-size: 28px;
  }

  .notice-meta,
  .info-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
