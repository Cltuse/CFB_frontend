<template>
  <div class="blacklist-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Blacklist Management</span>
        <h1>黑名单管理</h1>
        <p>展示系统内所有被限制的用户记录，包括生效状态、有效期、拉黑原因等信息。</p>
        
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
          <el-button type="danger" class="danger-btn" @click="handleAddBlacklist">新增黑名单</el-button>
          <el-button class="secondary-btn" @click="refreshAll">刷新列表</el-button>
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

      <div class="table-wrap">
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
      </div>

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
import { onMounted, reactive, ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, CircleCheck, View } from '@element-plus/icons-vue';
import { adminAPI, userAPI } from '../../api';
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme';

const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

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
    REMOVED: '已移除'
  })[status] || '未知';

const loadBlacklist = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage - 1,
      size: pagination.pageSize,
      ...(searchForm.status && { status: searchForm.status }),
      ...(searchForm.userName && { userName: searchForm.userName })
    };
    const res = await adminAPI.getBlacklist(params);
    blacklistData.value = res.data.content || [];
    pagination.total = res.data.totalElements || 0;
  } catch (err) {
    ElMessage.error(err.message || '获取黑名单列表失败');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const res = await adminAPI.getBlacklistStats();
    Object.assign(stats, res.data || {});
  } catch (err) {
    console.error('获取统计数据失败', err);
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadBlacklist();
};

const resetSearch = () => {
  searchForm.status = '';
  searchForm.userName = '';
  pagination.currentPage = 1;
  loadBlacklist();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadBlacklist();
};

const handleCurrentChange = (page) => {
  pagination.currentPage = page;
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
  if (!query) {
    userOptions.value = [];
    return;
  }
  userLoading.value = true;
  try {
    const res = await userAPI.searchUsers(query);
    userOptions.value = res.data || [];
  } catch (err) {
    console.error('搜索用户失败', err);
  } finally {
    userLoading.value = false;
  }
};

const handleAddSubmit = async () => {
  if (!addFormRef.value) return;
  const valid = await addFormRef.value.validate().catch(() => false);
  if (!valid) return;
  addLoading.value = true;
  try {
    const params = {
      userId: addForm.userId,
      reason: addForm.reason,
      durationType: addForm.durationType,
      ...(addForm.durationType === 'custom' && { endTime: addForm.endTime })
    };
    await adminAPI.addToBlacklist(params);
    ElMessage.success('添加成功');
    addDialogVisible.value = false;
    refreshAll();
  } catch (err) {
    ElMessage.error(err.message || '添加失败');
  } finally {
    addLoading.value = false;
  }
};

const handleRemove = async (row) => {
  try {
    await ElMessageBox.confirm('确定移出该黑名单记录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await adminAPI.removeFromBlacklist(row.id);
    ElMessage.success('移出成功');
    refreshAll();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '操作失败');
    }
  }
};

const handleView = (row) => {
  currentDetail.value = row;
  detailDialogVisible.value = true;
};

const refreshAll = () => {
  loadBlacklist();
  loadStats();
};

onMounted(() => {
  refreshAll();
});
</script>

<style scoped>
.blacklist-page {
  --theme-main: var(--feature-primary);
  --theme-deep: var(--feature-strong);
  --theme-soft: var(--feature-soft);
  --theme-border: var(--feature-border);
  --theme-shadow: var(--feature-glow);
  min-height: 100%;
  display: grid;
  gap: 20px;
  animation: blacklist-rise 0.55s ease both;
}

.page-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 30px;
  margin-bottom: 0;
  border-radius: 28px;
  border: 1px solid var(--theme-border);
  background:
    radial-gradient(circle at top right, var(--theme-soft) 0%, transparent 35%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, #ffffff 62%);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.hero-copy .hero-eyebrow {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  background: var(--theme-soft);
  color: var(--theme-deep);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.hero-copy h1 {
  font-size: 36px;
  font-weight: 800;
  color: #2d3748;
  margin: 0 0 12px;
  letter-spacing: -0.3px;
}

.hero-copy p {
  margin: 0;
  color: #718096;
  line-height: 1.8;
  font-size: 14px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.hero-actions .danger-btn,
.hero-actions .secondary-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
}

.hero-actions .danger-btn {
  border: none;
  background: linear-gradient(135deg, var(--theme-main) 0%, var(--theme-deep) 100%);
  box-shadow: 0 14px 28px var(--theme-shadow);
}

.hero-actions .secondary-btn {
  border: 1px solid var(--theme-border);
  background: rgba(255, 255, 255, 0.9);
  color: #718096;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 0;
}

.summary-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--theme-border);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.96) 0%, #ffffff 84%);
  box-shadow: 0 18px 40px var(--theme-shadow);
}

.summary-card .summary-label {
  color: #718096;
  font-size: 14px;
  font-weight: 500;
}

.summary-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
  color: #2d3748;
}

.summary-card p {
  margin: 0;
  color: #718096;
  font-size: 13px;
}

.control-card {
  padding: 24px;
  margin-bottom: 0;
  border-radius: 24px;
  border: 1px solid var(--theme-border);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.section-copy h2 {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px;
}

.section-copy p {
  margin: 0;
  color: #718096;
  line-height: 1.8;
  font-size: 14px;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-input__wrapper),
.search-form :deep(.el-select__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid var(--theme-border);
  background: #f7fafc;
}

.panel-card {
  padding: 24px;
  border-radius: 24px;
  border: 1px solid var(--theme-border);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 50px var(--theme-shadow);
  overflow: hidden;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--theme-soft);
  color: var(--theme-deep);
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(226, 232, 240, 0.6);
  color: #718096;
}

.table-wrap {
  overflow-x: auto;
}

.blacklist-table {
  width: 100%;
  min-width: 1100px;
}

.blacklist-table :deep(.el-table) {
  --el-table-border-color: var(--theme-border);
  --el-table-row-hover-bg-color: rgba(247, 250, 252, 0.95);
  border-radius: 20px;
}

.blacklist-table :deep(.el-table::before),
.blacklist-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.blacklist-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%) !important;
  color: #2d3748;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
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
  border: 1px solid var(--theme-border);
  background: #f7fafc;
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

  .blacklist-table {
    min-width: 920px;
  }
}
</style>
