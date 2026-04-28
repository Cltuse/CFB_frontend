<template>
  <div class="facility-category-page" :style="themeVars">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Facility Category</span>
        <h1>设施分类</h1>
        <p>展示系统内所有设施的分类信息，包括名称、描述、排序等。</p>       
      </div>
        <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="handleAdd">新建分类</el-button>
          <el-button class="secondary-btn" @click="fetchCategories">刷新列表</el-button>
        </div>
    </section>    

    <section class="control-card">
      <div class="section-copy">
        <h2>筛选与维护</h2>
        <p>可按分类名称和描述搜索，并继续维护排序与启停状态。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索分类名称或描述"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClearSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" class="primary-btn" @click="handleSearch">搜索</el-button>
        <el-button class="secondary-btn" @click="handleClearSearch">清空</el-button>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>分类列表</h2>
          <p>点击行可直接编辑，名称、描述、排序和状态信息集中展示。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ total }} 条</span>
          <span class="meta-chip muted-chip">第 {{ pagination.page }} 页</span>
        </div>
      </div>

      <el-table
        :data="categoryList"
        class="category-table"
        @row-click="handleRowClick"
        v-loading="loading"
      >
        <el-table-column label="分类名称" min-width="180">
          <template #default="{ row }">
            <div class="category-cell">
              <div class="category-icon">{{ row.categoryName?.slice(0, 1) || '类' }}</div>
              <div class="category-copy">
                <strong>{{ row.categoryName }}</strong>
                <small>{{ row.description || '暂无分类说明' }}</small>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="描述" min-width="240">
          <template #default="{ row }">
            <span class="description-text">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="排序" width="100" align="center">
          <template #default="{ row }">
            <span class="order-chip">{{ row.sortOrder || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" effect="light" class="status-tag">
              {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" min-width="170" align="center">
          <template #default="{ row }">
            <span class="muted-text">{{ formatDateTime(row.createdTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" min-width="170" align="center">
          <template #default="{ row }">
            <span class="muted-text">{{ formatDateTime(row.updatedTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click.stop="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" @click.stop="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !categoryList.length" description="当前没有符合条件的分类记录" />

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
      :title="isEdit ? '编辑设施分类' : '新建设施分类'"
      width="640px"
      class="editor-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        class="editor-form"
        label-position="top"
      >
        <div class="form-grid">
          <el-form-item label="分类名称" prop="categoryName">
            <el-input v-model="formData.categoryName" placeholder="请输入分类名称" clearable />
          </el-form-item>

          <el-form-item label="排序值" prop="sortOrder">
            <el-input-number
              v-model="formData.sortOrder"
              :min="0"
              :max="9999"
              style="width: 100%"
              placeholder="请输入排序值"
            />
          </el-form-item>
        </div>

        <el-form-item label="描述信息" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入分类适用范围或补充说明"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" :loading="submitLoading" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '创建分类' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { facilityCategoryAPI } from '../../api';
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme';

const themeVars = computed(() => ({
  ...buildFeatureVars(getRoleTheme('admin'))
}));

const loading = ref(false);
const dialogVisible = ref(false);
const submitLoading = ref(false);
const isEdit = ref(false);
const total = ref(0);
const categoryList = ref([]);
const searchKeyword = ref('');
const isSearchMode = ref(false);
const formRef = ref(null);

const pagination = reactive({
  page: 1,
  size: 10,
  sortBy: 'sortOrder',
  sortDir: 'asc'
});

const formData = reactive({
  id: null,
  categoryName: '',
  description: '',
  sortOrder: 0,
  status: 'ACTIVE'
});

const rules = {
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '分类名称长度需在 2 到 50 个字符之间', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const categoryStats = computed(() => ({
  total: total.value,
  currentPage: categoryList.value.length,
  active: categoryList.value.filter((item) => item.status === 'ACTIVE').length,
  inactive: categoryList.value.filter((item) => item.status === 'INACTIVE').length
}));

onMounted(() => {
  fetchCategories();
});

function formatDateTime(dateTime) {
  if (!dateTime) {
    return '-';
  }
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function fetchCategories() {
  try {
    loading.value = true;
    const params = {
      page: pagination.page - 1,
      size: pagination.size,
      sortBy: pagination.sortBy,
      sortDir: pagination.sortDir
    };

    const result = isSearchMode.value && searchKeyword.value.trim()
      ? await facilityCategoryAPI.searchPage(searchKeyword.value.trim(), params)
      : await facilityCategoryAPI.listPage(params);

    if (result?.code !== 200) {
      ElMessage.error(result?.message || '获取设施分类失败');
      categoryList.value = [];
      total.value = 0;
      return;
    }

    categoryList.value = Array.isArray(result.data?.content) ? result.data.content : [];
    total.value = result.data?.totalElements || 0;
  } catch (error) {
    console.error('获取设施分类失败:', error);
    ElMessage.error('获取设施分类失败，请稍后重试');
    categoryList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  isSearchMode.value = Boolean(searchKeyword.value.trim());
  fetchCategories();
}

function handleClearSearch() {
  searchKeyword.value = '';
  isSearchMode.value = false;
  pagination.page = 1;
  fetchCategories();
}

function handleSizeChange(size) {
  pagination.size = size;
  pagination.page = 1;
  fetchCategories();
}

function handleCurrentChange(page) {
  pagination.page = page;
  fetchCategories();
}

function resetForm() {
  Object.assign(formData, {
    id: null,
    categoryName: '',
    description: '',
    sortOrder: 0,
    status: 'ACTIVE'
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
  Object.assign(formData, {
    id: row.id,
    categoryName: row.categoryName,
    description: row.description || '',
    sortOrder: row.sortOrder || 0,
    status: row.status || 'ACTIVE'
  });
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function handleRowClick(row) {
  handleEdit(row);
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除分类“${row.categoryName}”吗？该操作不可恢复。`, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const result = await facilityCategoryAPI.delete(row.id);
      if (result?.code !== 200) {
        ElMessage.error(result?.message || '删除分类失败');
        return;
      }
      ElMessage.success('分类已删除');
      await fetchCategories();
    })
    .catch(() => {});
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    submitLoading.value = true;

    const result = isEdit.value
      ? await facilityCategoryAPI.update(formData.id, formData)
      : await facilityCategoryAPI.create(formData);

    if (result?.code !== 200) {
      ElMessage.error(result?.message || (isEdit.value ? '更新分类失败' : '创建分类失败'));
      return;
    }

    ElMessage.success(isEdit.value ? '分类已更新' : '分类已创建');
    dialogVisible.value = false;
    await fetchCategories();
  } catch (error) {
    console.error('提交分类失败:', error);
    ElMessage.error('提交分类失败，请稍后重试');
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style scoped>
.facility-category-page {
  --theme-main: var(--feature-primary);
  --theme-deep: var(--feature-strong);
  --theme-soft: var(--feature-soft);
  --theme-border: var(--feature-border);
  --theme-shadow: var(--feature-glow);
  min-height: 100%;
  display: grid;
  gap: 20px;
  color: #3c6a74;
  background:
    radial-gradient(circle at 90% 10%, var(--feature-soft) 0%, transparent 22%),
    linear-gradient(180deg, #f2fafc 0%, #eef8fa 48%, #eaf6f8 100%);
}

.page-hero,
.summary-card,
.control-card,
.panel-card,
.hero-note {
  border-radius: 28px;
  border: 1px solid var(--theme-border);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 50px var(--theme-shadow);
}

.page-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 320px;
  gap: 20px;
  padding: 28px;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(232, 247, 250, 0.98) 0%, #ffffff 68%);
}

.page-hero::before {
  content: '';
  position: absolute;
  top: -86px;
  right: -48px;
  width: 240px;
  height: 240px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(179, 219, 225, 0.3) 0%, rgba(179, 219, 225, 0.08) 44%, transparent 72%);
  pointer-events: none;
}

.hero-copy,
.hero-side {
  position: relative;
  z-index: 1;
}

.hero-eyebrow,
.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--feature-soft);
  color: #4f7a82;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2 {
  margin: 14px 0 10px;
  color: #29555f;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p,
.summary-card p,
.hero-note span,
.hero-note small,
.summary-label,
.description-text,
.muted-text,
.category-copy small {
  margin: 0;
  color: #587e86;
  line-height: 1.8;
}

.hero-actions,
.control-actions,
.panel-meta,
.row-actions,
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
  background: rgba(255, 255, 255, 0.88);
  color: #4f737a;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-note {
  min-height: 128px;
  padding: 22px;
  background: linear-gradient(180deg, #f2fafc 0%, #ffffff 100%);
}

.hero-note strong,
.summary-card strong,
.category-copy strong,
.order-chip {
  color: #26515b;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 44px rgba(36, 88, 96, 0.1);
}

.summary-card strong {
  display: block;
  margin: 12px 0 8px;
  font-size: 28px;
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

.control-actions {
  justify-content: flex-end;
}

.search-input {
  width: 320px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.muted-chip {
  background: rgba(237, 247, 250, 0.94);
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.category-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d4ecf2 0%, #c3e3ea 100%);
  color: #3f9aa8;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.category-copy {
  display: grid;
  gap: 4px;
}

.order-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(179, 219, 225, 0.18);
  font-weight: 700;
}

.status-tag {
  border: none;
}

.row-actions {
  justify-content: center;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.editor-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.facility-category-page :deep(.el-input__wrapper),
.facility-category-page :deep(.el-select__wrapper),
.facility-category-page :deep(.el-textarea__inner),
.facility-category-page :deep(.el-input-number .el-input__wrapper) {
  border-radius: 14px;
  background: #fbfdfb;
  box-shadow: none;
  border: 1px solid var(--feature-border);
}

.facility-category-page :deep(.el-table) {
  --el-table-border-color: var(--feature-border);
  --el-table-header-bg-color: #f0f8fa;
  --el-table-row-hover-bg-color: #f4fafc;
  border-radius: 20px;
  overflow: hidden;
}

.facility-category-page :deep(.el-table::before),
.facility-category-page :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.facility-category-page :deep(.el-dialog) {
  border-radius: 30px;
  overflow: hidden;
}

.facility-category-page :deep(.el-dialog__header) {
  margin: 0;
  padding: 22px 24px 10px;
  background: linear-gradient(145deg, #eef6f9 0%, #ffffff 100%);
}

.facility-category-page :deep(.el-dialog__body) {
  padding: 16px 24px 18px;
  background: #fbfefd;
}

.facility-category-page :deep(.el-dialog__footer) {
  padding: 0 24px 24px;
  background: #fdfffd;
}

@media (max-width: 1180px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero,
  .control-card {
    grid-template-columns: 1fr;
    display: grid;
  }
}

@media (max-width: 820px) {
  .facility-category-page {
    gap: 16px;
  }

  .summary-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-hero,
  .control-card,
  .panel-card {
    padding: 18px;
  }

  .panel-head {
    flex-direction: column;
  }

  .search-input,
  .control-actions,
  .control-actions > * {
    width: 100%;
  }

  .hero-copy h1 {
    font-size: 28px;
  }
}
</style>
