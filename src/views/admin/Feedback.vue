<template>
  <div class="admin-feedback-page">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Feedback Management</span>
        <h1>意见反馈管理</h1>
        <p>展示系统内所有用户提交的反馈记录，包括标题、正文、提交用户、状态、创建时间等信息。</p>
      </div>
      <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="refreshData">刷新反馈</el-button>
          <el-button class="secondary-btn" @click="handleClearSearch">清空筛选</el-button>
        </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">反馈总数</span>
        <strong>{{ total }}</strong>
        <p>接口返回的全部反馈记录总量</p>
      </article>
      <article class="summary-card">
          <span class="summary-label">待处理</span>
          <strong>{{ pendingFeedbacks }}</strong>
          <p>建议优先查看尚未回复的反馈</p>
        </article>
      <article class="summary-card">
        <span class="summary-label">已处理</span>
        <strong>{{ processedFeedbacks }}</strong>
        <p>已经完成回复或处理动作的反馈</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已关闭</span>
        <strong>{{ closedFeedbacks }}</strong>
        <p>当前页中已关闭流转的反馈记录</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>快速筛选</h2>
        <p>支持按标题、正文、用户、状态和反馈类型快速锁定目标记录，适合管理员集中处理某一类问题。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索标题、正文或提交用户"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClearSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="filterStatus" clearable placeholder="状态筛选" class="filter-select">
          <el-option label="待处理" value="PENDING" />
          <el-option label="已处理" value="PROCESSED" />
          <el-option label="已关闭" value="CLOSED" />
        </el-select>

        <el-select v-model="filterType" clearable placeholder="类型筛选" class="filter-select">
          <el-option label="建议" value="SUGGESTION" />
          <el-option label="投诉" value="COMPLAINT" />
          <el-option label="咨询" value="QUESTION" />
        </el-select>

        <el-button type="primary" class="primary-btn small-btn" @click="handleSearch">搜索</el-button>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>反馈列表</h2>
          <p>列表中补充了类型、用户、摘要和时间信息，点击任意记录即可展开详情并在弹层中直接回复。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ total }} 条</span>
          <span class="meta-chip muted-chip">筛选后 {{ filteredFeedbackList.length }} 条</span>
        </div>
      </div>

      <el-table
        :data="filteredFeedbackList"
        class="feedback-table"
        v-loading="loading"
        @row-click="handleRowClick"
      >
        <el-table-column prop="title" label="反馈标题" min-width="220">
          <template #default="{ row }">
            <div class="title-cell">
              <strong>{{ row.title }}</strong>
              <span>{{ getContentPreview(row.content) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="userName" label="提交用户" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="30" :src="row.userAvatar">
                {{ (row.userName || 'U').charAt(0) }}
              </el-avatar>
              <span>{{ row.userName || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="反馈类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getFeedbackTypeTag(row.type)" effect="light" round>
              {{ getFeedbackTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="提交时间" min-width="170" align="center">
          <template #default="{ row }">
            <span>{{ formatTime(row.createdAt || row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" round>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button class="action-btn view-btn" @click.stop="showFeedbackDetail(row)">
                查看
              </el-button>
              <el-button
                v-if="row.status === 'PENDING'"
                class="action-btn reply-btn"
                @click.stop="showFeedbackDetail(row)"
              >
                回复
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !filteredFeedbackList.length" description="当前没有符合条件的反馈记录" />

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="detailDialogVisible"
      width="760px"
      class="feedback-dialog"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-badge">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div>
            <h3>反馈详情</h3>
            <p>{{ currentFeedback.title || '反馈记录' }}</p>
          </div>
        </div>
      </template>

      <div class="detail-layout" v-if="currentFeedback.id">
        <section class="detail-summary-grid">
          <article class="detail-summary-card">
            <span>提交用户</span>
            <strong>{{ currentFeedback.userName || '未知用户' }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>反馈类型</span>
            <strong>{{ getFeedbackTypeText(currentFeedback.type) }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>状态</span>
            <strong>{{ getStatusText(currentFeedback.status) }}</strong>
          </article>
          <article class="detail-summary-card">
            <span>提交时间</span>
            <strong>{{ formatTime(currentFeedback.createdAt || currentFeedback.created_at) || '-' }}</strong>
          </article>
        </section>

        <section class="detail-panel">
          <div class="section-title">
            <h4>反馈内容</h4>
            <span>完整展示用户原始反馈</span>
          </div>
          <div class="detail-content">{{ currentFeedback.content || '暂无反馈内容' }}</div>
        </section>

        <section class="detail-panel" v-if="currentFeedback.adminReply">
          <div class="section-title">
            <h4>管理员回复</h4>
            <span>已保存的处理结果</span>
          </div>
          <div class="detail-content reply-content">{{ currentFeedback.adminReply }}</div>
        </section>

        <section class="detail-panel" v-if="currentFeedback.status === 'PENDING'">
          <div class="section-title">
            <h4>处理并回复</h4>
            <span>回复后会刷新当前列表状态</span>
          </div>
          <el-form ref="replyFormRef" :model="replyForm" :rules="replyRules" label-position="top">
            <el-form-item label="回复内容" prop="replyContent">
              <el-input
                v-model="replyForm.replyContent"
                type="textarea"
                :rows="5"
                maxlength="500"
                show-word-limit
                placeholder="请输入管理员回复内容"
              />
            </el-form-item>
          </el-form>
        </section>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="detailDialogVisible = false">关闭</el-button>
          <el-button
            v-if="currentFeedback.status === 'PENDING'"
            type="primary"
            class="primary-btn"
            :loading="replying"
            @click="handleReply"
          >
            提交回复
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { ChatDotRound, Search } from '@element-plus/icons-vue';
import { feedbackAPI } from '../../api';

const feedbacks = ref([]);
const loading = ref(false);
const searchKeyword = ref('');
const filterStatus = ref('');
const filterType = ref('');
const detailDialogVisible = ref(false);
const currentFeedback = ref({});
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const replying = ref(false);
const replyFormRef = ref(null);

const replyForm = ref({
  replyContent: ''
});

const replyRules = {
  replyContent: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 5, message: '回复内容至少需要 5 个字符', trigger: 'blur' }
  ]
};

const filteredFeedbackList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return feedbacks.value.filter((feedback) => {
    const matchKeyword =
      !keyword ||
      [feedback.title, feedback.content, feedback.userName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword));

    const matchStatus = !filterStatus.value || feedback.status === filterStatus.value;
    const matchType = !filterType.value || feedback.type === filterType.value;

    return matchKeyword && matchStatus && matchType;
  });
});

const pendingFeedbacks = computed(() => filteredFeedbackList.value.filter((item) => item.status === 'PENDING').length);
const processedFeedbacks = computed(() => filteredFeedbackList.value.filter((item) => item.status === 'PROCESSED').length);
const closedFeedbacks = computed(() => filteredFeedbackList.value.filter((item) => item.status === 'CLOSED').length);

onMounted(() => {
  refreshData();
});

async function refreshData() {
  try {
    loading.value = true;
    const response = await feedbackAPI.getFeedbacks(currentPage.value - 1, pageSize.value);
    if (response.data) {
      feedbacks.value = response.data.content || [];
      total.value = response.data.totalElements || 0;
    } else {
      feedbacks.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    feedbacks.value = [];
    total.value = 0;
    ElMessage.error('获取反馈列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  return true;
}

function handleClearSearch() {
  searchKeyword.value = '';
  filterStatus.value = '';
  filterType.value = '';
}

function handleSizeChange(size) {
  pageSize.value = size;
  currentPage.value = 1;
  refreshData();
}

function handleCurrentChange(page) {
  currentPage.value = page;
  refreshData();
}

function handleRowClick(row) {
  showFeedbackDetail(row);
}

function showFeedbackDetail(feedback) {
  currentFeedback.value = { ...feedback };
  replyForm.value.replyContent = feedback.adminReply || '';
  detailDialogVisible.value = true;
}

async function handleReply() {
  try {
    await replyFormRef.value.validate();
    replying.value = true;
    await feedbackAPI.replyFeedback(currentFeedback.value.id, {
      replyContent: replyForm.value.replyContent
    });
    ElMessage.success('反馈回复成功');
    detailDialogVisible.value = false;
    refreshData();
  } catch (error) {
    console.error('回复反馈失败:', error);
    ElMessage.error('回复反馈失败');
  } finally {
    replying.value = false;
  }
}

function getFeedbackTypeText(type) {
  return (
    {
      SUGGESTION: '建议',
      COMPLAINT: '投诉',
      QUESTION: '咨询'
    }[type] || '未知'
  );
}

function getFeedbackTypeTag(type) {
  return (
    {
      SUGGESTION: 'success',
      COMPLAINT: 'danger',
      QUESTION: 'info'
    }[type] || 'info'
  );
}

function getStatusType(status) {
  return (
    {
      PENDING: 'warning',
      PROCESSED: 'success',
      CLOSED: 'info'
    }[status] || 'info'
  );
}

function getStatusText(status) {
  return (
    {
      PENDING: '待处理',
      PROCESSED: '已处理',
      CLOSED: '已关闭'
    }[status] || '待处理'
  );
}

function getContentPreview(content) {
  if (!content) {
    return '暂无反馈内容摘要';
  }
  return content.length > 56 ? `${content.slice(0, 56)}...` : content;
}

function formatTime(time) {
  if (!time) {
    return '';
  }
  try {
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return time;
  }
}
</script>

<style scoped>
.admin-feedback-page {
  --theme-main: #f5a08a;
  --theme-deep: #d7745d;
  --theme-soft: rgba(255, 218, 208, 0.28);
  --theme-border: rgba(245, 160, 138, 0.16);
  --theme-shadow: rgba(96, 48, 38, 0.08);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(255, 232, 225, 0.76), transparent 26%),
    radial-gradient(circle at right center, rgba(255, 247, 244, 0.92), transparent 24%),
    linear-gradient(180deg, #fffaf8 0%, #fff7f4 48%, #fff4f1 100%);
}

.page-hero,
.summary-card,
.control-card,
.panel-card {
  animation: feedback-rise 0.55s ease both;
}

.page-hero,
.control-card,
.panel-card,
.hero-note,
.detail-summary-card,
.detail-panel {
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
    linear-gradient(145deg, rgba(255, 247, 244, 0.96) 0%, #ffffff 62%);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 218, 208, 0.24);
  color: #b7604c;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2,
.dialog-header h3,
.section-title h4 {
  margin: 14px 0 10px;
  color: #5d362e;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p,
.dialog-header p,
.section-title span {
  margin: 0;
  color: #8f776f;
  line-height: 1.8;
}

.hero-actions,
.control-actions,
.panel-meta,
.row-actions,
.dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-actions {
  margin-top: 24px;
}

.primary-btn,
.secondary-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #f5a08a 0%, #d7745d 100%);
  box-shadow: 0 14px 28px rgba(215, 116, 93, 0.22);
}

.secondary-btn {
  border: 1px solid rgba(245, 160, 138, 0.22);
  background: rgba(255, 255, 255, 0.9);
  color: #927871;
}

.small-btn {
  min-height: 46px;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-note {
  min-height: 132px;
  padding: 22px;
  background: linear-gradient(180deg, #fff9f7 0%, #ffffff 100%);
}

.hero-note span,
.hero-note small,
.summary-label,
.summary-card p,
.detail-summary-card span {
  color: #927972;
}

.hero-note strong,
.summary-card strong,
.detail-summary-card strong {
  color: #613a31;
}

.hero-note strong,
.summary-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(245, 160, 138, 0.14);
  background: linear-gradient(150deg, rgba(255, 247, 244, 0.96) 0%, #ffffff 84%);
  box-shadow: 0 18px 40px rgba(96, 48, 38, 0.06);
}

.summary-card p {
  margin: 0;
  line-height: 1.7;
}

.control-card,
.panel-card {
  padding: 24px;
}

.control-actions {
  justify-content: flex-end;
  margin-top: 18px;
}

.search-input {
  width: 320px;
}

.filter-select {
  width: 160px;
}

.search-input :deep(.el-input__wrapper),
.filter-select :deep(.el-select__wrapper) {
  min-height: 46px;
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid rgba(245, 160, 138, 0.2);
  background: #fffaf9;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.meta-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 218, 208, 0.24);
  color: #b6604d;
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(248, 242, 240, 0.96);
  color: #8f7972;
}

.feedback-table :deep(.el-table) {
  --el-table-border-color: rgba(245, 160, 138, 0.12);
  --el-table-row-hover-bg-color: rgba(255, 248, 246, 0.95);
  border-radius: 20px;
}

.feedback-table :deep(.el-table::before),
.feedback-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.feedback-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #fff9f7 0%, #fff1ed 100%) !important;
  color: #603931;
}

.title-cell {
  display: grid;
  gap: 6px;
}

.title-cell strong {
  color: #5f382f;
  font-size: 15px;
}

.title-cell span {
  color: #8c7771;
  line-height: 1.6;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6c5550;
}

.action-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
}

.view-btn {
  color: #c16c57;
  border-color: rgba(245, 160, 138, 0.24);
  background: rgba(255, 247, 244, 0.96);
}

.reply-btn {
  color: #4b9d84;
  border-color: rgba(117, 212, 184, 0.24);
  background: rgba(242, 252, 249, 0.96);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.feedback-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dialog-badge {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(255, 218, 208, 0.24);
  color: var(--theme-deep);
}

.detail-layout {
  display: grid;
  gap: 18px;
}

.detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.detail-summary-card {
  padding: 18px;
  box-shadow: none;
  background: linear-gradient(150deg, rgba(255, 247, 244, 0.96) 0%, #ffffff 84%);
}

.detail-summary-card strong {
  display: block;
  margin-top: 10px;
  font-size: 18px;
}

.detail-panel {
  padding: 18px;
  background: rgba(255, 255, 255, 0.98);
}

.detail-content {
  margin-top: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #fffaf8;
  color: #5f4944;
  line-height: 1.9;
}

.reply-content {
  background: #fff6f3;
}

.feedback-dialog :deep(.el-textarea__inner) {
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid rgba(245, 160, 138, 0.2);
  background: #fffaf9;
}

.dialog-footer {
  justify-content: flex-end;
}

@keyframes feedback-rise {
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
  .summary-grid,
  .detail-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid,
  .detail-summary-grid {
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

  .panel-head,
  .row-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
