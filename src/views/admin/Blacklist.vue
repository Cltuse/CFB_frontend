<template>
  <div class="blacklist-page">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Blacklist Management</span>
        <h1>黑名单管理</h1>
        <p>展示系统内所有被限制的用户记录，包括生效状态、有效期、拉黑原因等信息。</p>
        
      </div>
      <div class="hero-actions">
          <el-button type="danger" class="danger-btn" @click="handleAddBlacklist">新增黑名单</el-button>
          <el-button class="secondary-btn" @click="loadBlacklist">刷新列表</el-button>
        </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">生效中</span>
        <strong>{{ stats.activeCount }}</strong>
        <p>当前仍有效的限制记录</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已过期</span>
        <strong>{{ stats.expiredCount }}</strong>
        <p>已到达限制截止时间的记录</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">手动移除</span>
        <strong>{{ stats.removedCount }}</strong>
        <p>管理员手动解除限制的记录</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">总记录数</span>
        <strong>{{ stats.totalCount }}</strong>
        <p>系统内全部黑名单历史记录</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>筛选与检索</h2>
        <p>可按生效状态和用户姓名快速定位目标记录，便于复核和移除。</p>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="生效中" value="ACTIVE" />
            <el-option label="已过期" value="EXPIRED" />
            <el-option label="手动移除" value="REMOVED" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户姓名">
          <el-input v-model="searchForm.userName" placeholder="输入用户姓名" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>黑名单记录列表</h2>
          <p>支持查看详细信息，并在生效期间直接执行移出操作。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ pagination.total }} 条</span>
          <span class="meta-chip muted-chip">当前页 {{ blacklistData.length }} 条</span>
        </div>
      </div>

      <el-table :data="blacklistData" class="blacklist-table" v-loading="loading">
        <el-table-column prop="userRealName" label="用户姓名" width="120" />
        <el-table-column prop="userName" label="学号/工号" width="140" />
        <el-table-column prop="reason" label="拉黑原因" min-width="220" show-overflow-tooltip />
        <el-table-column prop="startTime" label="开始时间" width="180" align="center">
          <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="180" align="center">
          <template #default="{ row }">
            <span v-if="row.endTime">{{ formatDateTime(row.endTime) }}</span>
            <el-tag v-else type="danger" size="small" round>永久</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" round>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作员" width="120" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button
                v-if="row.status === 'ACTIVE'"
                class="danger-action-btn"
                @click="handleRemove(row)"
                :icon="CircleCheck"
              >
                移出
              </el-button>
              <el-button class="neutral-action-btn" @click="handleView(row)" :icon="View">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !blacklistData.length" description="当前没有符合条件的黑名单记录" />

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="addDialogVisible"
      title="新增黑名单"
      width="520px"
      :close-on-click-modal="false"
      class="blacklist-dialog"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="用户" prop="userId">
          <el-select
            v-model="addForm.userId"
            placeholder="选择用户"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.realName} (${user.username})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="拉黑原因" prop="reason">
          <el-input
            v-model="addForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拉黑原因"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="拉黑期限">
          <el-radio-group v-model="addForm.durationType">
            <el-radio label="permanent">永久</el-radio>
            <el-radio label="custom">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="addForm.durationType === 'custom'" label="结束时间" prop="endTime">
          <el-date-picker
            v-model="addForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleAddSubmit" :loading="addLoading">确认添加</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="黑名单详情" width="640px" class="detail-dialog">
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="用户姓名">{{ currentDetail.userRealName }}</el-descriptions-item>
        <el-descriptions-item label="学号/工号">{{ currentDetail.userName }}</el-descriptions-item>
        <el-descriptions-item label="拉黑原因" :span="2">{{ currentDetail.reason }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatDateTime(currentDetail.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">
          <span v-if="currentDetail.endTime">{{ formatDateTime(currentDetail.endTime) }}</span>
          <el-tag v-else type="danger" size="small" round>永久</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDetail.status)" effect="light" round>
            {{ getStatusText(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作员">{{ currentDetail.operatorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(currentDetail.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, CircleCheck, View } from '@element-plus/icons-vue';
import { adminAPI, userAPI } from '../../api';

const loading = ref(false);
const userLoading = ref(false);
const addLoading = ref(false);

const blacklistData = ref([]);
const userOptions = ref([]);
const currentDetail = ref(null);

const searchForm = reactive({
  status: '',
  userName: ''
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const stats = reactive({
  activeCount: 0,
  expiredCount: 0,
  removedCount: 0,
  totalCount: 0
});

const addDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const addFormRef = ref(null);

const addForm = reactive({
  userId: '',
  reason: '',
  durationType: 'permanent',
  endTime: ''
});

const addRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  reason: [
    { required: true, message: '请输入拉黑原因', trigger: 'blur' },
    { min: 5, max: 255, message: '原因长度应在 5-255 个字符之间', trigger: 'blur' }
  ],
  endTime: [
    {
      validator: (rule, value, callback) => {
        if (addForm.durationType === 'custom' && !value) {
          callback(new Error('请选择结束时间'));
          return;
        }
        callback();
      },
      trigger: 'change'
    }
  ]
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  return new Date(dateTime).toLocaleString('zh-CN');
};

const getStatusType = (status) =>
  ({
    ACTIVE: 'danger',
    EXPIRED: 'info',
    REMOVED: 'success'
  })[status] || 'info';

const getStatusText = (status) =>
  ({
    ACTIVE: '生效中',
    EXPIRED: '已过期',
    REMOVED: '手动移除'
  })[status] || status;

const loadBlacklist = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage - 1,
      size: pagination.pageSize,
      status: searchForm.status,
      userName: searchForm.userName
    };

    const response = await adminAPI.getBlacklist(params);
    const data = response.data || {};

    blacklistData.value = data.content || [];
    pagination.total = data.totalElements || 0;

    await loadStats();
  } catch (error) {
    ElMessage.error('加载黑名单失败');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await adminAPI.getBlacklistStats();
    const data = response.data || {};

    stats.activeCount = data.activeCount || 0;
    stats.expiredCount = data.expiredCount || 0;
    stats.removedCount = data.removedCount || 0;
    stats.totalCount = data.totalCount || 0;
  } catch (error) {
    console.error('加载统计信息失败:', error);
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadBlacklist();
};

const resetSearch = () => {
  searchForm.status = '';
  searchForm.userName = '';
  handleSearch();
};

const handleSizeChange = (val) => {
  pagination.pageSize = val;
  loadBlacklist();
};

const handleCurrentChange = (val) => {
  pagination.currentPage = val;
  loadBlacklist();
};

const handleAddBlacklist = () => {
  addForm.userId = '';
  addForm.reason = '';
  addForm.durationType = 'permanent';
  addForm.endTime = '';
  userOptions.value = [];
  addDialogVisible.value = true;
};

const searchUsers = async (query) => {
  if (!query || query.length < 2) {
    userOptions.value = [];
    return;
  }

  userLoading.value = true;
  try {
    const response = await userAPI.searchUsers(query);
    userOptions.value = response.data || [];
  } catch (error) {
    ElMessage.error('搜索用户失败');
  } finally {
    userLoading.value = false;
  }
};

const handleAddSubmit = async () => {
  try {
    await addFormRef.value.validate();
    addLoading.value = true;

    const formData = {
      userId: addForm.userId,
      reason: addForm.reason
    };

    if (addForm.durationType === 'custom' && addForm.endTime) {
      formData.endTime = addForm.endTime;
    }

    await adminAPI.addToBlacklist(formData);
    ElMessage.success('添加黑名单成功');
    addDialogVisible.value = false;
    loadBlacklist();
  } catch (error) {
    if (error !== false) {
      ElMessage.error('添加黑名单失败');
    }
  } finally {
    addLoading.value = false;
  }
};

const handleRemove = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要将 ${row.userRealName} 移出黑名单吗？`, '确认移出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await adminAPI.removeFromBlacklist(row.id);
    ElMessage.success('移出黑名单成功');
    loadBlacklist();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移出黑名单失败');
    }
  }
};

const handleView = (row) => {
  currentDetail.value = row;
  detailDialogVisible.value = true;
};

onMounted(() => {
  loadBlacklist();
});
</script>

<style scoped>
.blacklist-page {
  --theme-main: #f08b95;
  --theme-deep: #cf6670;
  --theme-soft: rgba(255, 214, 219, 0.28);
  --theme-border: rgba(240, 139, 149, 0.16);
  --theme-shadow: rgba(96, 43, 55, 0.08);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(255, 230, 233, 0.76), transparent 26%),
    radial-gradient(circle at right center, rgba(255, 246, 247, 0.92), transparent 24%),
    linear-gradient(180deg, #fffafb 0%, #fff6f7 48%, #fff3f4 100%);
}

.page-hero,
.summary-card,
.control-card,
.panel-card {
  animation: blacklist-rise 0.55s ease both;
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
    linear-gradient(145deg, rgba(255, 246, 247, 0.96) 0%, #ffffff 62%);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 214, 219, 0.24);
  color: #b45963;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2 {
  margin: 14px 0 10px;
  color: #5a2f37;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p {
  margin: 0;
  color: #8e7075;
  line-height: 1.8;
}

.hero-actions,
.search-form,
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

.danger-btn,
.secondary-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
}

.danger-btn {
  border: none;
  background: linear-gradient(135deg, #f08b95 0%, #cf6670 100%);
  box-shadow: 0 14px 28px rgba(207, 102, 112, 0.22);
}

.secondary-btn {
  border: 1px solid rgba(240, 139, 149, 0.22);
  background: rgba(255, 255, 255, 0.9);
  color: #8a6a70;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-note {
  min-height: 132px;
  padding: 22px;
  background: linear-gradient(180deg, #fff9fa 0%, #ffffff 100%);
}

.hero-note span,
.hero-note small,
.summary-label,
.summary-card p {
  color: #98797f;
}

.hero-note strong,
.summary-card strong {
  color: #64353d;
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
  border: 1px solid rgba(240, 139, 149, 0.14);
  background: linear-gradient(150deg, rgba(255, 246, 247, 0.96) 0%, #ffffff 84%);
  box-shadow: 0 18px 40px rgba(96, 43, 55, 0.06);
}

.summary-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
}

.control-card,
.panel-card {
  padding: 24px;
}

.search-form {
  margin-top: 18px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-input__wrapper),
.search-form :deep(.el-select__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid rgba(240, 139, 149, 0.2);
  background: #fffafb;
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
  background: rgba(255, 214, 219, 0.24);
  color: #b45963;
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(249, 242, 244, 0.96);
  color: #93767b;
}

.blacklist-table :deep(.el-table) {
  --el-table-border-color: rgba(240, 139, 149, 0.12);
  --el-table-row-hover-bg-color: rgba(255, 248, 249, 0.95);
  border-radius: 20px;
}

.blacklist-table :deep(.el-table::before),
.blacklist-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.blacklist-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #fff9fa 0%, #fff1f3 100%) !important;
  color: #64353d;
}

.danger-action-btn,
.neutral-action-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
}

.danger-action-btn {
  color: #cb6670;
  border-color: rgba(240, 139, 149, 0.22);
  background: rgba(255, 245, 246, 0.96);
}

.neutral-action-btn {
  color: #6f7d94;
  border-color: rgba(189, 198, 214, 0.24);
  background: rgba(247, 249, 252, 0.96);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.blacklist-dialog :deep(.el-dialog),
.detail-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.blacklist-dialog :deep(.el-input__wrapper),
.blacklist-dialog :deep(.el-select__wrapper),
.blacklist-dialog :deep(.el-textarea__inner),
.blacklist-dialog :deep(.el-date-editor.el-input__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid rgba(240, 139, 149, 0.2);
  background: #fffafb;
}

.dialog-footer {
  justify-content: flex-end;
}

@keyframes blacklist-rise {
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
  .summary-grid {
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
  .search-form,
  .row-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
