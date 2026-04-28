<template>
  <div class="admin-notice-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Notice Management</span>
        <h1>通知管理</h1>
        <p>展示系统内所有通知记录，包括通知内容、发布时间、状态等信息。</p>
        
      </div>
      <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="handleAdd">发布通知</el-button>
          <el-button class="secondary-btn" @click="loadNoticeList">刷新列表</el-button>
        </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">通知总数</span>
        <strong>{{ total }}</strong>
        <p>接口返回的全部公告记录总量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前页已发布</span>
        <strong>{{ noticeStats.published }}</strong>
        <p>已经正式对外展示的公告数量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前页待发布</span>
        <strong>{{ noticeStats.scheduled }}</strong>
        <p>处于定时发布或待生效状态的公告</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">草稿数量</span>
        <strong>{{ noticeStats.draft }}</strong>
        <p>仍可继续补充内容再发布的记录</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>搜索与发布节奏</h2>
        <p>根据通知标题或内容搜索，快速定位到相关记录。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索通知标题或内容"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClearSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>通知列表</h2>
          <p>展示系统内所有通知记录，包括通知内容、发布时间、状态等信息。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ total }} 条</span>
          <span class="meta-chip muted-chip">筛选后 {{ filteredNoticeList.length }} 条</span>
        </div>
      </div>

      <el-table
        :data="filteredNoticeList"
        class="notice-table"
        v-loading="loading"
        @row-click="handleRowClick"
      >
        <el-table-column prop="title" label="通知标题" min-width="220">
          <template #default="{ row }">
            <div class="title-cell">
              <strong>{{ row.title }}</strong>
              <span>{{ getContentPreview(row.content) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="publisherName" label="发布人" min-width="130" />

        <el-table-column prop="publishTime" label="发布时间" min-width="180" align="center">
          <template #default="{ row }">
            <span>{{ formatTime(row.publishTime) || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="scheduledTime" label="定时发布" min-width="180" align="center">
          <template #default="{ row }">
            <span>{{ formatTime(row.scheduledTime) || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" round>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button class="action-btn edit-btn" @click.stop="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button class="action-btn delete-btn" @click.stop="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !filteredNoticeList.length" description="当前没有符合条件的通知记录" />

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="760px"
      class="notice-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="notice-form">
        <div class="form-grid single-column">
          <el-form-item label="通知标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入通知标题" clearable />
          </el-form-item>

          <el-form-item label="通知内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="8"
              maxlength="1000"
              show-word-limit
              placeholder="请输入通知内容"
            />
          </el-form-item>
        </div>

        <div class="form-grid">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="草稿" value="DRAFT" />
              <el-option label="定时发布" value="SCHEDULED" />
              <el-option label="已发布" value="PUBLISHED" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="form.status === 'SCHEDULED'" label="定时发布时间" prop="scheduledTime">
            <el-date-picker
              v-model="form.scheduledTime"
              type="datetime"
              placeholder="选择定时发布时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
              :disabled-date="disabledDate"
            />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '立即发布' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit, Search } from '@element-plus/icons-vue';
import { noticeAPI } from '../../api';
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme';

const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

const loading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const isEdit = ref(false);
const dialogTitle = ref('发布通知');
const noticeList = ref([]);
const userInfo = ref({});
const total = ref(0);
const searchKeyword = ref('');

const pagination = reactive({
  page: 1,
  size: 10
});

const form = ref({
  id: null,
  title: '',
  content: '',
  publisherId: null,
  publisherName: '',
  status: 'PUBLISHED',
  scheduledTime: null
});

const rules = {
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }]
};

const filteredNoticeList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return noticeList.value;
  }
  return noticeList.value.filter((notice) =>
    [notice.title, notice.content]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keyword))
  );
});

const noticeStats = computed(() => ({
  published: noticeList.value.filter((item) => item.status === 'PUBLISHED').length,
  scheduled: noticeList.value.filter((item) => item.status === 'SCHEDULED').length,
  draft: noticeList.value.filter((item) => item.status === 'DRAFT').length
}));

onMounted(() => {
  const info = localStorage.getItem('userInfo');
  if (info) {
    userInfo.value = JSON.parse(info);
  }
  loadNoticeList();
});

async function loadNoticeList() {
  try {
    loading.value = true;
    const res = await noticeAPI.list({
      page: pagination.page - 1,
      size: pagination.size
    });
    noticeList.value = res.data?.content || res.data || [];
    total.value = res.data?.totalElements || res.data?.length || 0;
  } catch (error) {
    console.error('加载通知列表失败:', error);
    ElMessage.error('加载通知列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
}

function handleClearSearch() {
  searchKeyword.value = '';
}

function handleSizeChange(size) {
  pagination.size = size;
  pagination.page = 1;
  loadNoticeList();
}

function handleCurrentChange(page) {
  pagination.page = page;
  loadNoticeList();
}

function handleAdd() {
  isEdit.value = false;
  dialogTitle.value = '发布通知';
  form.value = {
    id: null,
    title: '',
    content: '',
    publisherId: userInfo.value.id,
    publisherName: userInfo.value.realName,
    status: 'PUBLISHED',
    scheduledTime: null
  };
  dialogVisible.value = true;
}

function handleEdit(row) {
  isEdit.value = true;
  dialogTitle.value = '编辑通知';
  form.value = {
    id: row.id,
    title: row.title,
    content: row.content,
    publisherId: row.publisherId,
    publisherName: row.publisherName,
    status: row.status,
    scheduledTime: row.scheduledTime || null
  };
  dialogVisible.value = true;
}

function handleRowClick(row) {
  handleEdit(row);
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    if (isEdit.value) {
      await noticeAPI.update(form.value.id, form.value);
      ElMessage.success('通知更新成功');
    } else {
      await noticeAPI.create(form.value);
      ElMessage.success('通知发布成功');
    }
    dialogVisible.value = false;
    loadNoticeList();
  } catch (error) {
    console.error('提交通知失败:', error);
    ElMessage.error('提交通知失败');
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除通知“${row.title}”吗？`, '删除确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await noticeAPI.delete(row.id);
      ElMessage.success('通知删除成功');
      loadNoticeList();
    })
    .catch(() => {});
}

function getStatusType(status) {
  return (
    {
      PUBLISHED: 'success',
      DRAFT: 'info',
      SCHEDULED: 'warning'
    }[status] || 'info'
  );
}

function getStatusText(status) {
  return (
    {
      PUBLISHED: '已发布',
      DRAFT: '草稿',
      SCHEDULED: '待发布'
    }[status] || status
  );
}

function getContentPreview(content) {
  if (!content) {
    return '暂无正文摘要';
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

function disabledDate(time) {
  return time.getTime() < Date.now() - 8.64e7;
}
</script>

<style scoped>
.admin-notice-page {
  --theme-main: var(--feature-primary);
  --theme-deep: var(--feature-strong);
  --theme-soft: var(--feature-soft);
  --theme-border: var(--feature-border);
  --theme-shadow: var(--feature-glow);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(226, 236, 249, 0.72), transparent 26%),
    radial-gradient(circle at right center, rgba(240, 249, 252, 0.92), transparent 24%),
    linear-gradient(180deg, #f9fbff 0%, #f5f8fd 48%, #f3f7fc 100%);
}

.page-hero,
.summary-card,
.control-card,
.panel-card {
  animation: notice-rise 0.55s ease both;
}

.page-hero,
.control-card,
.panel-card,
.hero-note {
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
    linear-gradient(145deg, rgba(240, 249, 252, 0.98) 0%, #ffffff 62%);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(200, 216, 240, 0.24);
  color: #4b6f99;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2 {
  margin: 14px 0 10px;
  color: #17314d;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p {
  margin: 0;
  color: #67778f;
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
  background: linear-gradient(135deg, var(--feature-primary) 0%, var(--feature-strong) 100%);
  box-shadow: 0 14px 28px rgba(63, 134, 146, 0.22);
}

.secondary-btn {
  border: 1px solid var(--feature-border);
  background: rgba(255, 255, 255, 0.9);
  color: #5b7a96;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-note {
  min-height: 132px;
  padding: 22px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.hero-note span,
.hero-note small,
.summary-label,
.summary-card p {
  color: #72839b;
}

.hero-note strong,
.summary-card strong {
  color: #19324e;
}

.hero-note strong {
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
  border: 1px solid var(--feature-border);
  background: linear-gradient(150deg, rgba(240, 249, 252, 0.96) 0%, #ffffff 84%);
  box-shadow: 0 18px 40px rgba(30, 41, 59, 0.06);
}

.summary-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
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
  width: 420px;
}

.search-input :deep(.el-input__wrapper) {
  min-height: 46px;
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid var(--feature-border);
  background: #f9fbff;
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
  background: rgba(200, 216, 240, 0.24);
  color: #5579a4;
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(244, 249, 252, 0.96);
  color: #72839b;
}

.notice-table :deep(.el-table) {
  --el-table-border-color: rgba(132, 165, 205, 0.12);
  --el-table-row-hover-bg-color: rgba(243, 250, 252, 0.95);
  border-radius: 20px;
}

.notice-table :deep(.el-table::before),
.notice-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.notice-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f6fbfe 0%, #eef5fc 100%) !important;
  color: #225368;
}

.title-cell {
  display: grid;
  gap: 6px;
}

.title-cell strong {
  color: #17314d;
  font-size: 15px;
}

.title-cell span {
  color: #72839b;
  line-height: 1.6;
}

.action-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
}

.edit-btn {
  color: #5579a4;
  border-color: rgba(132, 165, 205, 0.24);
  background: rgba(242, 250, 255, 0.96);
}

.delete-btn {
  color: #d46a74;
  border-color: rgba(241, 154, 164, 0.24);
  background: rgba(255, 245, 246, 0.96);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.single-column {
  grid-template-columns: 1fr;
}

.notice-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.notice-dialog :deep(.el-input__wrapper),
.notice-dialog :deep(.el-select__wrapper),
.notice-dialog :deep(.el-textarea__inner),
.notice-dialog :deep(.el-date-editor.el-input__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid var(--feature-border);
  background: #f9fbff;
}

.dialog-footer {
  justify-content: flex-end;
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

@media (max-width: 1180px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid,
  .form-grid {
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

  .search-input {
    width: 100%;
  }
}
</style>