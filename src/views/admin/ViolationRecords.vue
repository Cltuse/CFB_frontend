<template>
  <div class="violation-records-page">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">风控与处罚</span>
        <h1>违规记录管理</h1>
        <p>集中处理用户违规、处罚分和关联预约，减少页面跳转，让查看、处理和撤销都保持同一套操作体验。</p>
        <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增违规
          </el-button>
          <el-button class="secondary-btn" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>

      <div class="hero-side">
        <article class="hero-note">
          <span>待处理违规</span>
          <strong>{{ pendingViolations }}</strong>
          <small>建议优先处理仍在待审的记录</small>
        </article>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon soft-warning">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="stat-copy">
          <span>总违规记录</span>
          <strong>{{ totalViolations }}</strong>
          <p>系统内全部违规条目</p>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon soft-danger">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-copy">
          <span>待处理</span>
          <strong>{{ pendingViolations }}</strong>
          <p>仍需管理员确认结果</p>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon soft-info">
          <el-icon><InfoFilled /></el-icon>
        </div>
        <div class="stat-copy">
          <span>累计处罚分</span>
          <strong>{{ totalPenaltyPoints }}</strong>
          <p>当前统计口径下的总处罚分</p>
        </div>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>筛选与操作</h2>
        <p>按用户、违规类型和处理状态快速筛选记录。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchUser"
          placeholder="搜索用户姓名"
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="searchViolationType"
          placeholder="违规类型"
          class="filter-select"
          clearable
          @change="handleSearch"
        >
          <el-option label="爽约" value="NO_SHOW" />
          <el-option label="超时占用" value="OVERDUE" />
          <el-option label="频繁取消" value="CANCEL_FREQ" />
          <el-option label="损坏公物" value="DAMAGE" />
          <el-option label="其他违规" value="OTHER" />
        </el-select>

        <el-select
          v-model="searchStatus"
          placeholder="处理状态"
          class="filter-select"
          clearable
          @change="handleSearch"
        >
          <el-option label="待处理" value="PENDING" />
          <el-option label="已处理" value="PROCESSED" />
          <el-option label="已取消生效" value="REVOKED" />
          <el-option label="已驳回" value="REJECTED" />
        </el-select>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>违规记录列表</h2>
          <p>点击任意行查看详情，也可以直接在列表中完成处理或撤销。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ totalItems }} 条</span>
          <span class="meta-chip muted-chip">当前第 {{ currentPage }} 页</span>
        </div>
      </div>

      <el-table
        :data="filteredViolationList"
        v-loading="loading"
        class="violation-table"
        @row-click="handleRowClick"
      >
        <el-table-column prop="userName" label="用户" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-avatar">
                <el-icon><User /></el-icon>
              </div>
              <div class="user-copy">
                <strong>{{ row.userName || '未知用户' }}</strong>
                <small>{{ row.reporterName ? `上报人：${row.reporterName}` : '系统记录' }}</small>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="violationType" label="违规类型" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getViolationTypeTagType(row.violationType)" effect="light" class="soft-tag">
              {{ getViolationTypeText(row.violationType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="违规描述" min-width="320">
          <template #default="{ row }">
            <div class="description-cell">{{ row.description || '暂无描述' }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="reportedTime" label="上报时间" width="220" align="center">
          <template #default="{ row }">
            <div class="info-stack">
              <strong>{{ formatDateTime(row.reportedTime) }}</strong>
              <small>{{ row.reservationId ? `关联预约 #${row.reservationId}` : '无关联预约' }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="penaltyPoints" label="处罚分" width="100" align="center">
          <template #default="{ row }">
            <span class="penalty-text">{{ row.penaltyPoints || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" class="status-tag">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" align="center" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button class="action-btn" @click.stop="showViolationDetail(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button
                v-if="row.status === 'PENDING'"
                class="action-btn success-btn"
                @click.stop="processViolation(row)"
              >
                <el-icon><CircleCheck /></el-icon>
                处理
              </el-button>
              <el-button
                v-if="row.status === 'PROCESSED'"
                class="action-btn warning-btn"
                @click.stop="revokeViolation(row)"
              >
                <el-icon><Close /></el-icon>
                撤销
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !filteredViolationList.length" description="当前没有符合条件的违规记录" />

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>
  </div>

  <el-dialog
    v-model="detailDialogVisible"
    width="760px"
    class="detail-dialog"
    :show-close="false"
    destroy-on-close
  >
    <template #header>
      <div class="dialog-hero" v-if="currentViolation">
        <div class="dialog-hero-copy">
          <span class="hero-eyebrow">违规详情</span>
          <h2>{{ currentViolation.userName || '未知用户' }}</h2>
          <p>{{ currentViolation.description || '暂无违规描述。' }}</p>
          <div class="detail-tags">
            <el-tag :type="getViolationTypeTagType(currentViolation.violationType)" effect="light" class="soft-tag">
              {{ getViolationTypeText(currentViolation.violationType) }}
            </el-tag>
            <el-tag :type="getStatusType(currentViolation.status)" effect="light" class="status-tag">
              {{ getStatusText(currentViolation.status) }}
            </el-tag>
            <el-tag effect="light" class="soft-tag">
              处罚分 {{ currentViolation.penaltyPoints || 0 }}
            </el-tag>
          </div>
        </div>

        <div class="detail-actions">
          <el-button
            v-if="currentViolation.status === 'PENDING'"
            type="success"
            class="success-solid-btn"
            @click="processViolation(currentViolation)"
          >
            标记已处理
          </el-button>
          <el-button
            v-if="currentViolation.status === 'PROCESSED'"
            class="warning-solid-btn"
            @click="revokeViolation(currentViolation)"
          >
            取消生效
          </el-button>
          <el-button class="secondary-btn" @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </div>
    </template>

    <div v-if="currentViolation" class="detail-layout">
      <section class="detail-grid">
        <article class="detail-card">
          <span>上报时间</span>
          <strong>{{ formatDateTime(currentViolation.reportedTime) }}</strong>
        </article>
        <article class="detail-card">
          <span>上报人</span>
          <strong>{{ currentViolation.reporterName || '系统记录' }}</strong>
        </article>
        <article class="detail-card">
          <span>当前状态</span>
          <strong>{{ getStatusText(currentViolation.status) }}</strong>
        </article>
        <article class="detail-card">
          <span>处罚分</span>
          <strong>{{ currentViolation.penaltyPoints || 0 }}</strong>
        </article>
      </section>

      <section class="detail-panel">
        <div class="section-copy">
          <h2>违规描述</h2>
          <p>用于复核违规原因和处罚依据。</p>
        </div>
        <div class="detail-content">{{ currentViolation.description || '暂无违规描述。' }}</div>
      </section>

      <section class="detail-panel">
        <div class="section-copy">
          <h2>关联信息</h2>
          <p>查看违规与预约、用户记录之间的联系。</p>
        </div>
        <div class="link-grid">
          <article class="link-card">
            <span>关联预约</span>
            <strong>{{ currentViolation.reservationId ? `#${currentViolation.reservationId}` : '无' }}</strong>
          </article>
          <article class="link-card">
            <span>记录编号</span>
            <strong>#{{ currentViolation.id }}</strong>
          </article>
        </div>
      </section>
    </div>
  </el-dialog>

  <el-dialog
    v-model="addDialogVisible"
    title="新增违规记录"
    width="640px"
    class="editor-dialog"
    destroy-on-close
  >
    <el-form
      ref="addFormRef"
      :model="addForm"
      :rules="addFormRules"
      label-position="top"
      class="editor-form"
    >
      <div class="form-grid">
        <el-form-item label="违规用户" prop="userId">
          <el-select
            v-model="addForm.userId"
            filterable
            remote
            reserve-keyword
            placeholder="搜索并选择用户"
            :remote-method="searchUsers"
            :loading="userLoading"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.realName} (${user.username})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="违规类型" prop="violationType">
          <el-select v-model="addForm.violationType" placeholder="请选择违规类型">
            <el-option label="爽约" value="NO_SHOW" />
            <el-option label="超时占用" value="OVERDUE" />
            <el-option label="频繁取消" value="CANCEL_FREQ" />
            <el-option label="损坏公物" value="DAMAGE" />
            <el-option label="其他违规" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="关联预约" prop="reservationId">
          <el-input v-model="addForm.reservationId" placeholder="可选，填写预约 ID" />
        </el-form-item>

        <el-form-item label="处罚分" prop="penaltyPoints">
          <el-input-number v-model="addForm.penaltyPoints" :min="0" :max="100" :step="5" style="width: 100%" />
        </el-form-item>
      </div>

      <el-form-item label="详细描述" prop="description">
        <el-input
          v-model="addForm.description"
          type="textarea"
          :rows="5"
          maxlength="300"
          show-word-limit
          placeholder="请输入违规经过、依据和处理说明"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="secondary-btn" @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" class="primary-btn" @click="submitAddViolation">提交</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  CircleCheck,
  Clock,
  Close,
  InfoFilled,
  Plus,
  Refresh,
  Search,
  User,
  View,
  WarningFilled
} from '@element-plus/icons-vue';
import { formatDateTime } from '@/utils/date';
import { userAPI, violationAPI } from '../../api';

const violationList = ref([]);
const currentViolation = ref(null);
const detailDialogVisible = ref(false);
const addDialogVisible = ref(false);
const addFormRef = ref(null);
const loading = ref(false);

const searchUser = ref('');
const searchViolationType = ref('');
const searchStatus = ref('');

const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

const addForm = ref({
  userId: null,
  violationType: '',
  reservationId: '',
  penaltyPoints: 10,
  description: ''
});

const addFormRules = {
  userId: [{ required: true, message: '请选择违规用户', trigger: 'change' }],
  violationType: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  penaltyPoints: [{ required: true, message: '请输入处罚分', trigger: 'blur' }],
  description: [{ required: true, message: '请输入详细描述', trigger: 'blur' }]
};

const userOptions = ref([]);
const userLoading = ref(false);

const stats = ref({
  totalViolations: 0,
  pendingViolations: 0,
  totalPenaltyPoints: 0
});

onMounted(() => {
  loadViolationList();
  loadViolationStats();
});

const filteredViolationList = computed(() => violationList.value);
const totalViolations = computed(() => stats.value.totalViolations);
const pendingViolations = computed(() => stats.value.pendingViolations);
const totalPenaltyPoints = computed(() => stats.value.totalPenaltyPoints);

async function loadViolationStats() {
  try {
    const res = await violationAPI.getViolationStats();
    if (isRequestSuccess(res) && res.data) {
      stats.value = {
        totalViolations: res.data.totalViolations || 0,
        pendingViolations: res.data.pendingViolations || 0,
        totalPenaltyPoints: res.data.totalPenaltyPoints || 0
      };
    }
  } catch (error) {
    console.error('加载违规统计失败:', error);
  }
}

async function loadViolationList() {
  try {
    loading.value = true;
    const page = currentPage.value - 1;
    const res = await violationAPI.getAllViolations(
      page,
      pageSize.value,
      searchUser.value,
      searchViolationType.value,
      searchStatus.value
    );

    if (isRequestSuccess(res) && res.data) {
      violationList.value = res.data.content || [];
      totalItems.value = res.data.totalElements || 0;
      return;
    }

    violationList.value = [];
    totalItems.value = 0;
    ElMessage.error(res?.message || '获取违规记录失败');
  } catch (error) {
    console.error('加载违规记录失败:', error);
    ElMessage.error('加载违规记录失败');
    violationList.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
}

async function searchUsers(query) {
  if (!query) {
    userOptions.value = [];
    return;
  }

  userLoading.value = true;
  try {
    const res = await userAPI.searchUsers(query);
    userOptions.value = res.data || [];
  } catch (error) {
    console.error('搜索用户失败:', error);
  } finally {
    userLoading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  loadViolationList();
}

function handleCurrentChange(page) {
  currentPage.value = page;
  loadViolationList();
}

function handleSizeChange(size) {
  pageSize.value = size;
  currentPage.value = 1;
  loadViolationList();
}

function refreshData() {
  currentPage.value = 1;
  loadViolationList();
  loadViolationStats();
}

function showAddDialog() {
  addForm.value = {
    userId: null,
    violationType: '',
    reservationId: '',
    penaltyPoints: 10,
    description: ''
  };
  userOptions.value = [];
  addDialogVisible.value = true;
}

async function submitAddViolation() {
  try {
    await addFormRef.value.validate();

    const adminInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const payload = {
      ...addForm.value,
      reservationId: addForm.value.reservationId ? Number(addForm.value.reservationId) : null,
      reportedBy: adminInfo.id,
      reportedTime: new Date()
    };

    const res = await violationAPI.recordViolation(payload);
    if (isRequestSuccess(res)) {
      ElMessage.success('违规记录添加成功');
      addDialogVisible.value = false;
      refreshData();
    } else {
      ElMessage.error(res?.message || '新增违规记录失败');
    }
  } catch (error) {
    console.error('添加违规记录失败:', error);
  }
}

function showViolationDetail(row) {
  currentViolation.value = row;
  detailDialogVisible.value = true;
}

async function processViolation(row) {
  try {
    await ElMessageBox.confirm(
      '确认将此违规记录标记为已处理吗？',
      '处理确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const res = await violationAPI.approveViolation(row.id);
    if (isRequestSuccess(res)) {
      ElMessage.success('违规记录已标记为已处理');
      detailDialogVisible.value = false;
      refreshData();
    } else {
      ElMessage.error(res?.message || '处理违规记录失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('处理违规记录失败:', error);
    }
  }
}

async function revokeViolation(row) {
  try {
    await ElMessageBox.confirm(
      '确认取消这条已生效的违规记录吗？这会重新计算用户信誉分和违约次数。',
      '取消生效确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const res = await violationAPI.revokeViolation(row.id);
    if (isRequestSuccess(res)) {
      ElMessage.success('违规记录已取消生效');
      detailDialogVisible.value = false;
      refreshData();
    } else {
      ElMessage.error(res?.message || '取消生效失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消生效失败:', error);
    }
  }
}

function handleRowClick(row) {
  showViolationDetail(row);
}

function isRequestSuccess(response) {
  return response?.success || response?.code === 200;
}

function getViolationTypeTagType(type) {
  const map = {
    NO_SHOW: 'danger',
    OVERDUE: 'warning',
    CANCEL_FREQ: 'info',
    DAMAGE: 'danger',
    OTHER: 'info'
  };
  return map[type] || 'info';
}

function getViolationTypeText(type) {
  const map = {
    NO_SHOW: '爽约',
    OVERDUE: '超时占用',
    CANCEL_FREQ: '频繁取消',
    DAMAGE: '损坏公物',
    OTHER: '其他违规'
  };
  return map[type] || '未知类型';
}

function getStatusType(status) {
  const map = {
    PENDING: 'warning',
    PROCESSED: 'success',
    REVOKED: 'info',
    REJECTED: 'danger'
  };
  return map[status] || 'info';
}

function getStatusText(status) {
  const map = {
    PENDING: '待处理',
    PROCESSED: '已处理',
    REVOKED: '已取消生效',
    REJECTED: '已驳回'
  };
  return map[status] || status;
}
</script>

<style scoped>
.violation-records-page {
  display: grid;
  gap: 20px;
  color: #22364b;
}

.page-hero,
.stat-card,
.control-card,
.panel-card,
.detail-card,
.detail-panel,
.link-card {
  border-radius: 28px;
  border: 1px solid rgba(122, 157, 198, 0.18);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(30, 41, 59, 0.06);
}

.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) 260px;
  gap: 18px;
  padding: 28px;
  background:
    radial-gradient(circle at top right, rgba(255, 214, 170, 0.28), transparent 28%),
    linear-gradient(145deg, #fffaf6 0%, #ffffff 62%);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(251, 191, 114, 0.16);
  color: #c6751a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2,
.dialog-hero-copy h2 {
  margin: 14px 0 10px;
  color: #19324d;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p,
.dialog-hero-copy p {
  margin: 0;
  color: #6a7b92;
  line-height: 1.8;
}

.hero-actions,
.control-actions,
.panel-meta,
.row-actions,
.detail-tags,
.detail-actions,
.dialog-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.hero-actions {
  margin-top: 24px;
}

.primary-btn,
.secondary-btn,
.success-solid-btn,
.warning-solid-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #6c93be 0%, #5278a5 100%);
  box-shadow: 0 12px 24px rgba(82, 120, 165, 0.18);
}

.secondary-btn {
  border: 1px solid rgba(132, 165, 205, 0.22);
  background: rgba(255, 255, 255, 0.86);
  color: #4d6788;
}

.success-solid-btn {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #4db47e 0%, #2f9864 100%);
}

.warning-solid-btn {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #e6a850 0%, #d8892f 100%);
}

.hero-side {
  display: grid;
  align-items: stretch;
}

.hero-note {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(132, 165, 205, 0.14);
  background: linear-gradient(180deg, #fff9f2 0%, #ffffff 100%);
}

.hero-note span,
.hero-note small,
.stat-copy span,
.stat-copy p,
.meta-chip,
.detail-card span,
.link-card span {
  color: #74839a;
}

.hero-note strong,
.stat-copy strong,
.detail-card strong,
.link-card strong,
.penalty-text,
.user-copy strong {
  color: #18314d;
}

.hero-note strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 22px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  font-size: 24px;
  flex-shrink: 0;
}

.soft-warning {
  background: linear-gradient(135deg, rgba(252, 214, 145, 0.38), rgba(255, 243, 220, 0.9));
  color: #d08a24;
}

.soft-danger {
  background: linear-gradient(135deg, rgba(255, 192, 173, 0.38), rgba(255, 236, 230, 0.9));
  color: #d96942;
}

.soft-info {
  background: linear-gradient(135deg, rgba(176, 202, 234, 0.38), rgba(236, 244, 255, 0.92));
  color: #5c82ac;
}

.stat-copy strong {
  display: block;
  margin: 8px 0 6px;
  font-size: 30px;
}

.stat-copy p {
  margin: 0;
  font-size: 13px;
}

.control-card,
.panel-card {
  padding: 24px;
}

.control-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 150px;
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
  background: rgba(174, 198, 227, 0.22);
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(240, 245, 251, 0.94);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 18px;
  background: linear-gradient(135deg, #e9f1fb 0%, #dbe7f8 100%);
  color: #5a7ea9;
  flex-shrink: 0;
}

.user-copy,
.info-stack {
  display: grid;
  gap: 6px;
}

.user-copy small,
.info-stack small,
.description-cell {
  color: #71829a;
  font-size: 13px;
  line-height: 1.6;
}

.description-cell {
  word-break: break-word;
}

.soft-tag {
  border: none;
  background: rgba(174, 198, 227, 0.24);
  color: #557aa4;
}

.status-tag {
  border: none;
}

.penalty-text {
  font-size: 18px;
  font-weight: 700;
}

.action-btn {
  min-height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(132, 165, 205, 0.22);
  background: rgba(255, 255, 255, 0.88);
  color: #587aa4;
}

.success-btn {
  border-color: rgba(90, 178, 125, 0.28);
  color: #319a67;
}

.warning-btn {
  border-color: rgba(224, 164, 84, 0.3);
  color: #cc8430;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.detail-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
  background: #fcfdff;
}

.detail-dialog :deep(.el-dialog__header) {
  margin: 0;
  padding: 0;
}

.detail-dialog :deep(.el-dialog__body) {
  padding: 0 24px 24px;
}

.dialog-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(255, 214, 170, 0.3), transparent 28%),
    linear-gradient(145deg, #fff9f4 0%, #ffffff 100%);
  border-bottom: 1px solid rgba(132, 165, 205, 0.14);
}

.detail-layout {
  display: grid;
  gap: 18px;
  padding-top: 20px;
}

.detail-grid,
.link-grid,
.form-grid {
  display: grid;
  gap: 14px;
}

.detail-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.link-grid,
.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-card,
.link-card,
.detail-panel {
  padding: 20px;
}

.detail-card span,
.link-card span {
  display: block;
  font-size: 12px;
}

.detail-card strong,
.link-card strong {
  display: block;
  margin-top: 10px;
  font-size: 18px;
}

.detail-content {
  margin-top: 16px;
  padding: 18px;
  border-radius: 20px;
  background: #f8fbff;
  color: #21354d;
  line-height: 1.8;
}

.editor-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.editor-dialog :deep(.el-dialog__header) {
  margin: 0;
  padding: 22px 24px 10px;
}

.editor-dialog :deep(.el-dialog__body) {
  padding: 12px 24px 18px;
}

.editor-dialog :deep(.el-dialog__footer) {
  padding: 0 24px 24px;
}

.violation-records-page :deep(.el-input__wrapper),
.violation-records-page :deep(.el-select__wrapper),
.violation-records-page :deep(.el-textarea__inner),
.violation-records-page :deep(.el-input-number .el-input__wrapper),
.editor-dialog :deep(.el-input__wrapper),
.editor-dialog :deep(.el-select__wrapper),
.editor-dialog :deep(.el-textarea__inner),
.editor-dialog :deep(.el-input-number .el-input__wrapper) {
  border-radius: 14px;
  background: #f9fbff;
  box-shadow: none;
  border: 1px solid rgba(132, 165, 205, 0.2);
}

.violation-records-page :deep(.el-table) {
  --el-table-border-color: rgba(132, 165, 205, 0.14);
  --el-table-header-bg-color: #f7fbff;
  --el-table-row-hover-bg-color: #f7fbff;
  border-radius: 20px;
  overflow: hidden;
}

.violation-table :deep(.el-table__row) {
  cursor: pointer;
}

@media (max-width: 1180px) {
  .stats-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .page-hero,
  .control-card {
    grid-template-columns: 1fr;
    display: grid;
  }

  .link-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .violation-records-page {
    gap: 16px;
  }

  .page-hero,
  .control-card,
  .panel-card,
  .dialog-hero {
    padding: 18px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .panel-head,
  .dialog-hero {
    flex-direction: column;
  }

  .search-input,
  .filter-select,
  .control-actions,
  .detail-actions {
    width: 100%;
  }

  .control-actions > * {
    width: 100%;
  }

  .row-actions {
    justify-content: center;
  }
}
</style>
