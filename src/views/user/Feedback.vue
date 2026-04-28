<template>
  <div class="feedback-page">
    <section class="page-header">
      <div class="header-content">
        <div>
          <span class="page-kicker">服务沟通中心</span>
          <h1 class="page-title">意见反馈</h1>
          <p class="page-subtitle">提交建议、投诉或咨询，并在同一页面查看管理员回复。</p>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">反馈总数</span>
        <strong>{{ feedbackStats.total }}</strong>
        <p>包含历史记录和当前仍在处理中的反馈</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">待处理</span>
        <strong>{{ feedbackStats.pending }}</strong>
        <p>管理员尚未正式处理完成的内容</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已回复</span>
        <strong>{{ feedbackStats.resolved }}</strong>
        <p>已经得到明确处理结果或回复的反馈</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前页记录</span>
        <strong>{{ feedbackStats.currentPage }}</strong>
        <p>根据分页设置正在展示的记录数量</p>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel-card form-panel">
        <div class="panel-head">
          <div>
            <h2>提交反馈</h2>
            <p>尽量描述清楚背景和诉求，管理员更容易准确处理。</p>
          </div>
        </div>

        <el-form
          ref="feedbackFormRef"
          :model="feedbackForm"
          :rules="feedbackRules"
          label-position="top"
          class="feedback-form"
        >
          <el-form-item label="反馈类型" prop="type">
            <el-select v-model="feedbackForm.type" placeholder="请选择反馈类型" class="field-control">
              <el-option label="建议" value="SUGGESTION" />
              <el-option label="投诉" value="COMPLAINT" />
              <el-option label="咨询" value="QUESTION" />
            </el-select>
          </el-form-item>

          <el-form-item label="反馈标题" prop="title">
            <el-input
              v-model="feedbackForm.title"
              maxlength="200"
              show-word-limit
              placeholder="请输入反馈标题"
              class="field-control"
            />
          </el-form-item>

          <el-form-item label="反馈内容" prop="content">
            <el-input
              v-model="feedbackForm.content"
              type="textarea"
              :rows="7"
              maxlength="1000"
              show-word-limit
              placeholder="请尽量详细描述问题、建议或咨询内容"
              class="field-control"
            />
          </el-form-item>

          <div class="form-actions">
            <el-button type="primary" class="primary-btn" :loading="submitting" @click="submitFeedback">
              提交反馈
            </el-button>
            <el-button class="secondary-btn" @click="resetForm">重置内容</el-button>
          </div>
        </el-form>
      </article>

      <article class="panel-card list-panel">
        <div class="panel-head">
          <div>
            <h2>我的反馈记录</h2>
            <p>列表卡片化展示状态、时间和管理员回复，方便持续跟进。</p>
          </div>
          <el-button class="secondary-btn" @click="refreshData">刷新列表</el-button>
        </div>

        <div v-if="loading" class="status-wrap">
          <el-icon class="is-loading status-icon"><Loading /></el-icon>
          <span>正在加载反馈记录...</span>
        </div>

        <div v-else-if="feedbacks.length === 0" class="empty-state">
          <h3>暂无反馈记录</h3>
          <p>你还没有提交过反馈，欢迎告诉我们你的想法。</p>
        </div>

        <div v-else class="feedback-list">
          <article v-for="feedback in feedbacks" :key="feedback.id" class="feedback-card">
            <div class="feedback-top">
              <div class="feedback-tags">
                <el-tag :type="getFeedbackTypeTagType(feedback.type)" effect="light" round>
                  {{ getFeedbackTypeText(feedback.type) }}
                </el-tag>
                <el-tag :type="getStatusType(feedback.status)" effect="light" round>
                  {{ getStatusText(feedback.status) }}
                </el-tag>
              </div>
              <span class="feedback-time">{{ formatDateTime(feedback.createTime) }}</span>
            </div>

            <h3 class="feedback-title">{{ feedback.title }}</h3>
            <p class="feedback-content">{{ feedback.content }}</p>

            <div class="meta-list">
              <span>提交时间：{{ formatDateTime(feedback.createTime) }}</span>
              <span v-if="feedback.updateTime">更新时间：{{ formatDateTime(feedback.updateTime) }}</span>
            </div>

            <div v-if="feedback.reply && feedback.reply.trim()" class="reply-box">
              <div class="reply-head">
                <strong>管理员回复</strong>
                <span v-if="feedback.replyTime">{{ formatDateTime(feedback.replyTime) }}</span>
              </div>
              <p>{{ feedback.reply }}</p>
              <span v-if="feedback.replyByName" class="reply-user">回复人：{{ feedback.replyByName }}</span>
            </div>
          </article>
        </div>

        <div v-if="feedbacks.length > 0" class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { userClientAPI } from '@/api';
import { formatDateTime } from '@/utils/date';

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
const userId = userInfo.id;

const feedbackFormRef = ref();
const feedbacks = ref([]);
const loading = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const feedbackForm = reactive({
  type: 'SUGGESTION',
  title: '',
  content: ''
});

const feedbackRules = {
  type: [{ required: true, message: '请选择反馈类型', trigger: 'change' }],
  title: [
    { required: true, message: '请输入反馈标题', trigger: 'blur' },
    { min: 5, max: 200, message: '标题长度应在 5 到 200 个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度应在 10 到 1000 个字符之间', trigger: 'blur' }
  ]
};

const feedbackStats = computed(() => ({
  total: total.value,
  pending: feedbacks.value.filter((item) => item.status === 'PENDING').length,
  resolved: feedbacks.value.filter((item) => ['RESOLVED', 'PROCESSED'].includes(item.status)).length,
  currentPage: feedbacks.value.length
}));

const loadFeedbacks = async () => {
  if (!userId) {
    ElMessage.error('用户信息获取失败');
    return;
  }

  loading.value = true;
  try {
    const response = await userClientAPI.getMyFeedbacks(userId, currentPage.value - 1, pageSize.value);
    if (response.code === 200) {
      feedbacks.value = response.data.feedbacks || [];
      total.value = response.data.total || 0;
      return;
    }
    ElMessage.error(response.message || '获取反馈列表失败');
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const submitFeedback = async () => {
  if (!feedbackFormRef.value) return;

  try {
    await feedbackFormRef.value.validate();

    if (!userId) {
      ElMessage.error('用户信息获取失败');
      return;
    }

    submitting.value = true;
    const response = await userClientAPI.submitFeedback({
      ...feedbackForm,
      userId
    });

    if (response.code === 200) {
      ElMessage.success('反馈提交成功');
      resetForm();
      loadFeedbacks();
      return;
    }
    ElMessage.error(response.message || '反馈提交失败');
  } catch (error) {
    console.error('提交反馈失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  feedbackFormRef.value?.resetFields();
  feedbackForm.type = 'SUGGESTION';
};

const refreshData = () => {
  currentPage.value = 1;
  loadFeedbacks();
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadFeedbacks();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadFeedbacks();
};

const getFeedbackTypeText = (type) => {
  const map = {
    SUGGESTION: '建议',
    COMPLAINT: '投诉',
    QUESTION: '咨询'
  };
  return map[type] || '建议';
};

const getFeedbackTypeTagType = (type) => {
  const map = {
    SUGGESTION: 'primary',
    COMPLAINT: 'danger',
    QUESTION: 'warning'
  };
  return map[type] || 'info';
};

const getStatusType = (status) => {
  const map = {
    PENDING: 'warning',
    RESOLVED: 'success',
    PROCESSED: 'success',
    REJECTED: 'danger'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    PENDING: '待处理',
    RESOLVED: '已解决',
    PROCESSED: '已回复',
    REJECTED: '未通过'
  };
  return map[status] || status;
};

onMounted(() => {
  loadFeedbacks();
});
</script>

<style scoped>
.feedback-page {
  --page-primary: #f5b7c0;
  --page-secondary: #fce4e8;
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(252, 228, 232, 0.3), transparent 28%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.page-header,
.summary-card,
.panel-card {
  border-radius: 30px;
  border: 1px solid rgba(245, 183, 192, 0.14);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 40px rgba(94, 52, 62, 0.05);
}

.header-content {
  padding: 30px;
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.26), transparent 24%),
    linear-gradient(145deg, rgba(252, 228, 232, 0.16) 0%, #ffffff 64%);
}

.page-kicker {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(245, 183, 192, 0.14);
  color: #c4677a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.page-title {
  margin: 16px 0 10px;
  font-size: 34px;
  color: #7a4052;
}

.page-subtitle {
  margin: 0;
  color: #8e717b;
  line-height: 1.8;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px 20px;
  background: linear-gradient(145deg, rgba(252, 228, 232, 0.18), #ffffff 82%);
}

.summary-label {
  display: block;
  color: #8e717b;
  font-size: 13px;
}

.summary-card strong {
  display: block;
  margin: 12px 0 8px;
  font-size: 32px;
  line-height: 1;
  color: #7a4052;
}

.summary-card p {
  margin: 0;
  color: #8e717b;
  line-height: 1.6;
}

.content-grid {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 20px;
}

.panel-card {
  padding: 24px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  color: #7a4052;
}

.panel-head p {
  margin: 8px 0 0;
  color: #8e717b;
  line-height: 1.7;
}

.feedback-form {
  display: grid;
  gap: 6px;
}

.field-control {
  width: 100%;
}

.feedback-page :deep(.el-input__wrapper),
.feedback-page :deep(.el-select__wrapper),
.feedback-page :deep(.el-textarea__inner) {
  border-radius: 16px;
  box-shadow: none;
  background: #fffafb;
  border: 1px solid rgba(245, 183, 192, 0.18);
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn {
  min-height: 44px;
  border-radius: 14px;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  box-shadow: 0 14px 28px rgba(232, 144, 157, 0.18);
}

.secondary-btn {
  border: 1px solid rgba(245, 183, 192, 0.18);
  background: #ffffff;
  color: #c4677a;
}

.status-wrap,
.empty-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #8e717b;
}

.status-icon {
  font-size: 24px;
  margin-right: 8px;
}

.feedback-list {
  display: grid;
  gap: 16px;
}

.feedback-card {
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(245, 183, 192, 0.12);
  background: linear-gradient(145deg, #ffffff 0%, #fffafb 100%);
}

.feedback-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.feedback-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feedback-time {
  color: #8e717b;
  font-size: 12px;
}

.feedback-title {
  margin: 16px 0 10px;
  color: #7a4052;
  font-size: 18px;
}

.feedback-content {
  margin: 0;
  color: #755e59;
  line-height: 1.8;
}

.meta-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  margin-top: 14px;
  color: #8e717b;
  font-size: 12px;
}

.reply-box {
  margin-top: 16px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(252, 228, 232, 0.72);
  border-left: 4px solid #f5b7c0;
}

.reply-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.reply-head strong {
  color: #7a4052;
}

.reply-head span,
.reply-user {
  color: #8e717b;
  font-size: 12px;
}

.reply-box p {
  margin: 0;
  color: #755d57;
  line-height: 1.8;
}

.reply-user {
  display: inline-block;
  margin-top: 10px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .header-content,
  .panel-card {
    padding: 18px;
  }

  .page-title {
    font-size: 28px;
  }

  .panel-head,
  .feedback-top,
  .reply-head,
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-wrap {
    justify-content: center;
  }
}
</style>
<style scoped>
.feedback-page {
  --theme-deep: #e8909d;
  --theme-border: rgba(245, 183, 192, 0.16);
  --theme-shadow: rgba(94, 52, 62, 0.08);
  background:
    radial-gradient(circle at top left, rgba(252, 228, 232, 0.38), transparent 28%),
    radial-gradient(circle at right center, rgba(254, 248, 249, 0.95), transparent 24%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.page-header,
.summary-card,
.panel-card,
.feedback-card {
  animation: feedback-rise 0.55s ease both;
  border-color: var(--theme-border);
  box-shadow: 0 20px 46px var(--theme-shadow);
}

.header-content {
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.32), transparent 24%),
    linear-gradient(145deg, rgba(254, 248, 249, 0.96) 0%, #ffffff 64%);
}

.summary-card {
  background: linear-gradient(150deg, rgba(254, 248, 249, 0.96), #ffffff 82%);
}

.panel-card {
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.panel-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 50px rgba(94, 52, 62, 0.1);
}

.feedback-page :deep(.el-input__wrapper),
.feedback-page :deep(.el-select__wrapper),
.feedback-page :deep(.el-textarea__inner) {
  border-color: rgba(245, 183, 192, 0.2);
}

.feedback-card {
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.feedback-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 42px rgba(94, 52, 62, 0.08);
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
</style>
