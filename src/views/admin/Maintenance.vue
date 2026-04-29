<template>
  <div class="maintenance-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Maintenance Management</span>
        <h1>维护管理</h1>
        <p>展示系统内所有设施的维护记录，包括设施名称、负责人、时间安排、处理结果等信息。</p>
        
      </div>
        <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新建维护记录
          </el-button>
          <el-button class="secondary-btn" @click="loadMaintenanceList">
            <el-icon><RefreshRight /></el-icon>
            刷新数据
          </el-button>
        </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">维护总数</span>
        <strong>{{ stats.total }}</strong>
        <p>全部维护记录</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">待处理</span>
        <strong>{{ stats.pending }}</strong>
        <p>等待确认或派发</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已完成</span>
        <strong>{{ stats.completed }}</strong>
        <p>已关闭的维护任务</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">累计费用</span>
        <strong>{{ formatCurrency(stats.totalCost) }}</strong>
        <p>已录入的维护成本</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>筛选与操作</h2>
        <p>根据设施、负责人、状态和类型筛选维护记录。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索设施、负责人或描述"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClearFilters"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="statusFilter"
          class="filter-select"
          clearable
          placeholder="任务状态"
          @change="handleSearch"
        >
          <el-option label="待处理" value="PENDING" />
          <el-option label="进行中" value="IN_PROGRESS" />
          <el-option label="已完成" value="COMPLETED" />
          <el-option label="已取消" value="CANCELLED" />
        </el-select>

        <el-select
          v-model="typeFilter"
          class="filter-select"
          clearable
          placeholder="维护类型"
          @change="handleSearch"
        >
          <el-option label="常规维护" value="ROUTINE" />
          <el-option label="故障维修" value="REPAIR" />
          <el-option label="设备升级" value="UPGRADE" />
          <el-option label="其他" value="OTHER" />
        </el-select>

        <el-button class="secondary-btn" @click="handleClearFilters">清空筛选</el-button>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>维护记录列表</h2>
          <p>点击行可查看详情，也可以直接编辑或删除当前任务。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ filteredMaintenanceList.length }} 条</span>
          <span class="meta-chip muted-chip">第 {{ pagination.page }} 页</span>
        </div>
      </div>

      <el-table
        :data="pagedMaintenanceList"
        v-loading="loading"
        class="maintenance-table"
        @row-click="openDetail"
      >
        <el-table-column label="设施信息" min-width="280">
          <template #default="{ row }">
            <div class="facility-cell">
              <div class="facility-icon">
                <el-icon><Tools /></el-icon>
              </div>
              <div class="facility-copy">
                <strong>{{ row.facilityName || getFacilityName(row.facilityId) || '未命名设施' }}</strong>
                <span>{{ row.description || '暂无维护描述' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="维护类型" width="130" align="center">
          <template #default="{ row }">
            <el-tag effect="light" class="soft-tag">
              {{ getMaintenanceTypeText(row.maintenanceType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="负责人" min-width="140">
          <template #default="{ row }">
            <div class="info-stack">
              <strong>{{ row.maintainer || '未分配' }}</strong>
              <small>{{ row.maintainerId ? `ID: ${row.maintainerId}` : '待指派' }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="计划时间" min-width="220">
          <template #default="{ row }">
            <div class="info-stack">
              <strong>{{ formatDateTime(row.startTime) }}</strong>
              <small>{{ row.endTime ? `结束：${formatDateTime(row.endTime)}` : '结束时间待定' }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" class="status-tag">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="费用" width="120" align="center">
          <template #default="{ row }">
            <span class="cost-text">{{ formatCurrency(row.cost) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button class="action-btn view-btn" @click.stop="openDetail(row)">详情</el-button>
              <el-button class="action-btn edit-btn" @click.stop="handleEdit(row)">编辑</el-button>
              <el-button class="action-btn delete-btn" @click.stop="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !filteredMaintenanceList.length" description="当前没有符合条件的维护记录" />

      <div v-if="filteredMaintenanceList.length" class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[8, 12, 20, 50]"
          :total="filteredMaintenanceList.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-drawer
      v-model="detailDrawerVisible"
      :with-header="false"
      size="720px"
      class="detail-drawer"
    >
      <div v-if="currentRow" v-loading="detailLoading" class="detail-layout">
        <section class="detail-hero">
          <div class="detail-heading">
            <span class="hero-eyebrow">维护详情</span>
            <h2>{{ currentRow.facilityName || getFacilityName(currentRow.facilityId) || '维护任务' }}</h2>
            <p>{{ currentRow.description || '暂无维护描述，建议补充任务背景和处理目标。' }}</p>
            <div class="detail-tags">
              <el-tag class="soft-tag" effect="light">{{ getMaintenanceTypeText(currentRow.maintenanceType) }}</el-tag>
              <el-tag :type="getStatusType(currentRow.status)" effect="light" class="status-tag">
                {{ getStatusText(currentRow.status) }}
              </el-tag>
              <el-tag effect="light" class="soft-tag">{{ currentRow.maintainer || '未分配负责人' }}</el-tag>
            </div>
          </div>

          <div class="detail-actions">
            <el-button type="primary" class="primary-btn" @click="handleEdit(currentRow)">编辑任务</el-button>
            <el-button class="secondary-btn" @click="detailDrawerVisible = false">关闭</el-button>
          </div>
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <span>开始时间</span>
            <strong>{{ formatDateTime(currentRow.startTime) }}</strong>
          </article>
          <article class="detail-card">
            <span>结束时间</span>
            <strong>{{ formatDateTime(currentRow.endTime) }}</strong>
          </article>
          <article class="detail-card">
            <span>维护费用</span>
            <strong>{{ formatCurrency(currentRow.cost) }}</strong>
          </article>
          <article class="detail-card">
            <span>记录编号</span>
            <strong>#{{ currentRow.id }}</strong>
          </article>
        </section>

        <section class="detail-panel">
          <div class="section-copy">
            <h2>处理结果</h2>
            <p>如需补充处理过程或结论，可直接在编辑弹窗中维护。</p>
          </div>
          <div class="detail-content">
            {{ currentRow.result || '当前还没有填写处理结果。' }}
          </div>
        </section>
      </div>
    </el-drawer>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="680px"
      class="editor-dialog"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="editor-form">
        <div class="form-grid">
          <el-form-item label="设施" prop="facilityId">
            <el-select v-model="form.facilityId" filterable placeholder="请选择设施">
              <el-option
                v-for="item in facilityOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="维护类型" prop="maintenanceType">
            <el-select v-model="form.maintenanceType" placeholder="请选择维护类型">
              <el-option label="常规维护" value="ROUTINE" />
              <el-option label="故障维修" value="REPAIR" />
              <el-option label="设备升级" value="UPGRADE" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>

          <el-form-item label="负责人" prop="maintainerId">
            <el-select
              v-model="form.maintainerId"
              filterable
              placeholder="请选择负责人"
              @change="handleMaintainerChange"
            >
              <el-option
                v-for="item in maintainerOptions"
                :key="item.id"
                :label="item.realName || item.username"
                :value="item.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="任务状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态">
              <el-option label="待处理" value="PENDING" />
              <el-option label="进行中" value="IN_PROGRESS" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="已取消" value="CANCELLED" />
            </el-select>
          </el-form-item>

          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="form.startTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择开始时间"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="form.endTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择结束时间"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="维护费用" prop="cost">
            <el-input-number v-model="form.cost" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>

          <el-form-item label="负责人姓名">
            <el-input :model-value="form.maintainer || '将随负责人自动带出'" disabled />
          </el-form-item>
        </div>

        <el-form-item label="维护描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="请输入维护背景、故障现象或计划安排"
          />
        </el-form-item>

        <el-form-item label="处理结果" prop="result">
          <el-input
            v-model="form.result"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="请输入维护结果或后续建议"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '创建记录' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, RefreshRight, Search, Tools } from '@element-plus/icons-vue';
import { facilityAPI, maintenanceAPI, userAPI } from '../../api';
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme';

const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

const loading = ref(false);
const detailLoading = ref(false);
const allMaintenanceList = ref([]);
const facilityOptions = ref([]);
const maintainerOptions = ref([]);
const searchKeyword = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const dialogVisible = ref(false);
const detailDrawerVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);
const currentRow = ref(null);

const pagination = reactive({
  page: 1,
  size: 8
});

const form = reactive({
  id: null,
  facilityId: null,
  maintenanceType: 'ROUTINE',
  maintainerId: null,
  maintainer: '',
  cost: 0,
  startTime: '',
  endTime: '',
  status: 'PENDING',
  description: '',
  result: ''
});

const rules = {
  facilityId: [{ required: true, message: '请选择设施', trigger: 'change' }],
  maintenanceType: [{ required: true, message: '请选择维护类型', trigger: 'change' }],
  maintainerId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
  description: [{ required: true, message: '请输入维护描述', trigger: 'blur' }]
};

const dialogTitle = computed(() => (isEdit.value ? '编辑维护记录' : '新建维护记录'));

const filteredMaintenanceList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return allMaintenanceList.value.filter((item) => {
    const matchKeyword =
      !keyword ||
      [item.facilityName, item.maintainer, item.description, item.result]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword));

    const matchStatus = !statusFilter.value || item.status === statusFilter.value;
    const matchType = !typeFilter.value || normalizeMaintenanceType(item.maintenanceType) === typeFilter.value;

    return matchKeyword && matchStatus && matchType;
  });
});

const pagedMaintenanceList = computed(() => {
  const start = (pagination.page - 1) * pagination.size;
  const end = start + pagination.size;
  return filteredMaintenanceList.value.slice(start, end);
});

const stats = computed(() => ({
  total: allMaintenanceList.value.length,
  pending: allMaintenanceList.value.filter((item) => item.status === 'PENDING').length,
  inProgress: allMaintenanceList.value.filter((item) => item.status === 'IN_PROGRESS').length,
  completed: allMaintenanceList.value.filter((item) => item.status === 'COMPLETED').length,
  totalCost: allMaintenanceList.value.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
}));

watch(
  () => [filteredMaintenanceList.value.length, pagination.size],
  () => {
    const maxPage = Math.max(1, Math.ceil(filteredMaintenanceList.value.length / pagination.size));
    if (pagination.page > maxPage) {
      pagination.page = maxPage;
    }
  }
);

onMounted(() => {
  loadMaintenanceList();
  loadFacilityOptions();
  loadMaintainerOptions();
});

async function loadMaintenanceList() {
  try {
    loading.value = true;
    const result = await maintenanceAPI.list();
    allMaintenanceList.value = Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error('加载维护记录失败:', error);
    ElMessage.error('加载维护记录失败');
    allMaintenanceList.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadFacilityOptions() {
  try {
    const res = await facilityAPI.list();
    facilityOptions.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('加载设施选项失败:', error);
    facilityOptions.value = [];
  }
}

async function loadMaintainerOptions() {
  try {
    const res = await userAPI.listMaintainers();
    const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
    maintainerOptions.value = data;
  } catch (error) {
    try {
      const fallback = await userAPI.list({ page: 0, size: 1000 });
      maintainerOptions.value = Array.isArray(fallback.data)
        ? fallback.data
        : fallback.data?.content || [];
    } catch (innerError) {
      console.error('加载负责人选项失败:', innerError);
      maintainerOptions.value = [];
    }
  }
}

function handleSearch() {
  pagination.page = 1;
}

function handleClearFilters() {
  searchKeyword.value = '';
  statusFilter.value = '';
  typeFilter.value = '';
  pagination.page = 1;
}

function handleSizeChange(size) {
  pagination.size = size;
  pagination.page = 1;
}

function handleCurrentChange(page) {
  pagination.page = page;
}

function handleMaintainerChange(maintainerId) {
  const target = maintainerOptions.value.find((item) => item.id === maintainerId);
  form.maintainer = target ? target.realName || target.username || '' : '';
}

function resetForm() {
  Object.assign(form, {
    id: null,
    facilityId: null,
    maintenanceType: 'ROUTINE',
    maintainerId: null,
    maintainer: '',
    cost: 0,
    startTime: '',
    endTime: '',
    status: 'PENDING',
    description: '',
    result: ''
  });
}

function handleAdd() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function handleEdit(row) {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    facilityId: row.facilityId ?? findFacilityIdByName(row.facilityName),
    maintenanceType: normalizeMaintenanceType(row.maintenanceType),
    maintainerId: row.maintainerId ?? findMaintainerIdByName(row.maintainer),
    maintainer: row.maintainer || '',
    cost: Number(row.cost) || 0,
    startTime: row.startTime || '',
    endTime: row.endTime || '',
    status: row.status || 'PENDING',
    description: row.description || '',
    result: row.result || ''
  });
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

async function openDetail(row) {
  detailDrawerVisible.value = true;
  detailLoading.value = true;
  currentRow.value = row;

  try {
    const result = await maintenanceAPI.getById(row.id);
    currentRow.value = result.data || row;
  } catch (error) {
    console.error('加载维护详情失败:', error);
    currentRow.value = row;
  } finally {
    detailLoading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    const payload = { ...form };
    const editedId = payload.id;

    const response = isEdit.value
      ? await maintenanceAPI.update(form.id, payload)
      : await maintenanceAPI.create(payload);

    if (response?.code && response.code !== 200) {
      ElMessage.error(response.message || '保存维护记录失败');
      return;
    }

    ElMessage.success(isEdit.value ? '维护记录已更新' : '维护记录已创建');
    dialogVisible.value = false;
    await loadMaintenanceList();

    if (detailDrawerVisible.value && currentRow.value?.id === editedId) {
      await openDetail({ ...currentRow.value, id: editedId });
    }
  } catch (error) {
    console.error('提交维护记录失败:', error);
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确认删除“${row.facilityName || '该维护记录'}”吗？`,
    '删除确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      await maintenanceAPI.delete(row.id);
      ElMessage.success('维护记录已删除');
      if (currentRow.value?.id === row.id) {
        detailDrawerVisible.value = false;
      }
      await loadMaintenanceList();
    })
    .catch(() => {});
}

function normalizeMaintenanceType(type) {
  const map = {
    常规维护: 'ROUTINE',
    ROUTINE: 'ROUTINE',
    故障维修: 'REPAIR',
    REPAIR: 'REPAIR',
    设备升级: 'UPGRADE',
    UPGRADE: 'UPGRADE',
    其他: 'OTHER',
    OTHER: 'OTHER'
  };
  return map[type] || 'OTHER';
}

function getMaintenanceTypeText(type) {
  const map = {
    ROUTINE: '常规维护',
    REPAIR: '故障维修',
    UPGRADE: '设备升级',
    OTHER: '其他'
  };
  return map[normalizeMaintenanceType(type)] || '其他';
}

function getStatusType(status) {
  const map = {
    PENDING: 'info',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
}

function getStatusText(status) {
  const map = {
    PENDING: '待处理',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  };
  return map[status] || '未知状态';
}

function getFacilityName(facilityId) {
  return facilityOptions.value.find((item) => item.id === facilityId)?.name || '';
}

function findFacilityIdByName(name) {
  return facilityOptions.value.find((item) => item.name === name)?.id ?? null;
}

function findMaintainerIdByName(name) {
  return maintainerOptions.value.find((item) => (item.realName || item.username) === name)?.id ?? null;
}

function formatDateTime(value) {
  if (!value) {
    return '未设置';
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '未录入';
  }
  return `¥${amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
}
</script>

<style scoped>
.maintenance-page {
  display: grid;
  gap: 20px;
  color: #24374a;
}

.page-hero,
.control-card,
.panel-card,
.detail-hero,
.detail-panel,
.detail-card {
  border-radius: 28px;
  border: 1px solid rgba(132, 165, 205, 0.18);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(30, 41, 59, 0.06);
}

.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 320px;
  gap: 20px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #f8fbff 0%, #ffffff 68%);
}

.page-hero::before {
  content: '';
  position: absolute;
  top: -86px;
  right: -50px;
  width: 240px;
  height: 240px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(173, 197, 228, 0.26) 0%, rgba(173, 197, 228, 0.08) 44%, transparent 72%);
  pointer-events: none;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(167, 193, 226, 0.22);
  color: #5579a4;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2,
.detail-heading h2 {
  margin: 14px 0 10px;
  color: #17314d;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p,
.detail-heading p {
  margin: 0;
  color: #67778f;
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

.hero-copy,
.hero-side,
.detail-heading,
.detail-actions {
  position: relative;
  z-index: 1;
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
  background: linear-gradient(135deg, #6d93be 0%, #5178a6 100%);
  box-shadow: 0 12px 24px rgba(81, 120, 166, 0.2);
}

.secondary-btn {
  border: 1px solid rgba(132, 165, 205, 0.24);
  background: rgba(255, 255, 255, 0.86);
  color: #4b6788;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-note {
  min-height: 128px;
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid rgba(132, 165, 205, 0.16);
}

.hero-note span,
.hero-note small,
.summary-label,
.summary-card p,
.meta-chip,
.detail-card span {
  color: #72839b;
}

.hero-note strong,
.summary-card strong,
.detail-card strong,
.cost-text,
.facility-copy strong,
.info-stack strong {
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
  padding: 20px 22px;
  border-radius: 24px;
  border: 1px solid rgba(132, 165, 205, 0.14);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 30px rgba(30, 41, 59, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(30, 41, 59, 0.08);
}

.summary-card strong {
  display: block;
  margin: 12px 0 8px;
  font-size: 28px;
}

.summary-card p {
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

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.meta-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(172, 197, 228, 0.22);
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(240, 245, 251, 0.94);
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 150px;
}

.facility-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.facility-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, #e7f0fb 0%, #dce8f8 100%);
  color: #587ba5;
  flex-shrink: 0;
}

.facility-copy,
.info-stack {
  display: grid;
  gap: 6px;
}

.facility-copy span,
.info-stack small {
  color: #73839a;
  font-size: 13px;
  line-height: 1.6;
}

.soft-tag {
  border: none;
  background: rgba(174, 198, 227, 0.26);
  color: #557aa5;
}

.status-tag {
  border: none;
}

.cost-text {
  font-weight: 700;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.detail-layout {
  display: grid;
  gap: 18px;
  padding: 8px 4px 20px;
}

.detail-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #f8fbff 0%, #ffffff 100%);
}

.detail-hero::before {
  content: '';
  position: absolute;
  top: -72px;
  right: -34px;
  width: 200px;
  height: 200px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(173, 197, 228, 0.22) 0%, rgba(173, 197, 228, 0.08) 48%, transparent 72%);
  pointer-events: none;
}

.detail-tags {
  margin-top: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.detail-card {
  padding: 18px;
}

.detail-card span {
  display: block;
  font-size: 12px;
}

.detail-card strong {
  display: block;
  margin-top: 10px;
  font-size: 18px;
}

.detail-panel {
  padding: 22px;
}

.detail-content {
  margin-top: 16px;
  padding: 18px;
  border-radius: 20px;
  background: #f8fbff;
  color: #20344c;
  line-height: 1.8;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.maintenance-table :deep(.el-table__row) {
  cursor: pointer;
}

.maintenance-page :deep(.el-input__wrapper),
.maintenance-page :deep(.el-select__wrapper),
.maintenance-page :deep(.el-textarea__inner),
.maintenance-page :deep(.el-date-editor.el-input__wrapper),
.maintenance-page :deep(.el-input-number .el-input__wrapper) {
  border-radius: 14px;
  background: #f9fbff;
  box-shadow: none;
  border: 1px solid rgba(132, 165, 205, 0.2);
}

.maintenance-page :deep(.el-table) {
  --el-table-border-color: rgba(132, 165, 205, 0.14);
  --el-table-header-bg-color: #f7fbff;
  --el-table-row-hover-bg-color: #f7fbff;
  border-radius: 20px;
  overflow: hidden;
}

.maintenance-page :deep(.el-dialog),
.maintenance-page :deep(.el-drawer__body) {
  background: #fcfdff;
}

.maintenance-page :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.maintenance-page :deep(.el-dialog__header) {
  margin: 0;
  padding: 22px 24px 10px;
}

.maintenance-page :deep(.el-dialog__body) {
  padding: 12px 24px 18px;
}

.maintenance-page :deep(.el-dialog__footer) {
  padding: 0 24px 24px;
}

@media (max-width: 1180px) {
  .summary-grid,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero,
  .control-card {
    grid-template-columns: 1fr;
    display: grid;
  }
}

@media (max-width: 820px) {
  .maintenance-page {
    gap: 16px;
  }

  .summary-grid,
  .detail-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-hero,
  .control-card,
  .panel-card,
  .detail-hero {
    padding: 18px;
  }

  .panel-head,
  .detail-hero {
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

  .hero-copy h1 {
    font-size: 28px;
  }
}
</style>
<style scoped>
.maintenance-page {
  --theme-main: var(--feature-primary);
  --theme-deep: var(--feature-strong);
  --theme-soft: var(--feature-soft);
  --theme-border: var(--feature-border);
  --theme-shadow: var(--feature-glow);
  min-height: 100%;
  background:
    radial-gradient(circle at 92% 12%, rgba(226, 236, 249, 0.72), transparent 22%),
    linear-gradient(180deg, #f9fbff 0%, #f5f8fd 48%, #f3f7fc 100%);
}

.page-hero,
.summary-card,
.control-card,
.panel-card {
  animation: admin-maintenance-rise 0.55s ease both;
  border-color: var(--theme-border);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.page-hero {
  background: linear-gradient(145deg, rgba(240, 249, 252, 0.98) 0%, #ffffff 68%);
}

.hero-note,
.summary-card,
.detail-panel,
.detail-card {
  border-color: var(--feature-border);
}

.primary-btn {
  background: linear-gradient(135deg, var(--feature-primary) 0%, var(--feature-strong) 100%);
  box-shadow: 0 14px 28px rgba(63, 134, 146, 0.22);
}

.secondary-btn {
  border-color: var(--feature-border);
}

@keyframes admin-maintenance-rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
