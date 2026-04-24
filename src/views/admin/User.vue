<template>
  <div class="admin-user-page">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">账号协同中心</span>
        <h1>用户管理</h1>
        <p>把用户列表、角色筛选、状态查看和新增入口整合为统一的卡片式工作区，方便管理员快速完成账号维护与权限核对。</p>
        <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="handleAdd">新增用户</el-button>
          <el-button class="secondary-btn" @click="loadUserList">刷新列表</el-button>
        </div>
      </div>

      <div class="hero-side">
        <article class="hero-note">
          <span>当前页加载</span>
          <strong>{{ userList.length }}</strong>
          <small>本页接口返回的用户数量</small>
        </article>
        <article class="hero-note">
          <span>管理角色</span>
          <strong>{{ userStats.management }}</strong>
          <small>管理员与设施管理员合计数量</small>
        </article>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">用户总数</span>
        <strong>{{ total }}</strong>
        <p>接口返回的全部用户记录总量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前筛选结果</span>
        <strong>{{ filteredUserList.length }}</strong>
        <p>当前页中符合筛选条件的账号数量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">激活账号</span>
        <strong>{{ activeUsers }}</strong>
        <p>状态正常、可继续使用的账号数量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">禁用账号</span>
        <strong>{{ inactiveUsers }}</strong>
        <p>当前页中已被限制登录的账号数量</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>筛选与定位</h2>
        <p>支持按用户名、真实姓名、联系方式、角色和状态筛选，便于在账号量增加后快速定位目标用户。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名、姓名、手机号或邮箱"
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="roleFilter" clearable placeholder="角色筛选" class="filter-select">
          <el-option
            v-for="option in roleOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select v-model="statusFilter" clearable placeholder="状态筛选" class="filter-select">
          <el-option label="激活" value="ACTIVE" />
          <el-option label="禁用" value="INACTIVE" />
        </el-select>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div class="section-copy">
          <h2>用户列表</h2>
          <p>列表补充角色、联系方式和状态信息，点击任意记录即可直接进入编辑，不再出现只有表格没有内容层次的问题。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ total }} 条</span>
          <span class="meta-chip muted-chip">筛选后 {{ filteredUserList.length }} 条</span>
        </div>
      </div>

      <el-table
        :data="filteredUserList"
        class="user-table"
        v-loading="loading"
        @row-click="handleRowClick"
      >
        <el-table-column prop="username" label="用户信息" min-width="190">
          <template #default="{ row }">
            <div class="title-cell">
              <strong>{{ row.username }}</strong>
              <span>{{ row.realName || '未填写姓名' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="role" label="角色" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" effect="light" round>
              {{ formatRoleDisplayName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="phone" label="手机号" min-width="150" align="center">
          <template #default="{ row }">
            <span>{{ row.phone || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="邮箱" min-width="220" align="center">
          <template #default="{ row }">
            <span class="email-text">{{ row.email || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" effect="light" round>
              {{ row.status === 'ACTIVE' ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
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

      <el-empty v-if="!loading && !filteredUserList.length" description="当前没有符合条件的用户记录" />

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
      width="720px"
      class="user-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="user-form">
        <div class="form-grid">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item v-if="!isEdit" label="登录密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入登录密码" />
          </el-form-item>

          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="form.realName" placeholder="请输入真实姓名" />
          </el-form-item>

          <el-form-item label="角色" prop="role">
            <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
              <el-option
                v-for="option in roleOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>

          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="激活" value="ACTIVE" />
              <el-option label="禁用" value="INACTIVE" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '创建用户' }}
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
import { userAPI } from '../../api';
import { getRoleDisplayName, getRoleOptions } from '../../utils/roleMapping';

const loading = ref(false);
const userList = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增用户');
const formRef = ref(null);
const isEdit = ref(false);
const total = ref(0);
const roleOptions = ref(getRoleOptions());
const searchKeyword = ref('');
const roleFilter = ref('');
const statusFilter = ref('');

const pagination = reactive({
  page: 1,
  size: 10
});

const form = ref({
  id: null,
  username: '',
  password: '',
  realName: '',
  role: 'USER',
  phone: '',
  email: '',
  status: 'ACTIVE'
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    {
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入登录密码'));
          return;
        }
        if (value && (value.length < 6 || value.length > 20)) {
          callback(new Error('密码长度需要在 6 到 20 个字符之间'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
};

const filteredUserList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return userList.value.filter((user) => {
    const matchKeyword =
      !keyword ||
      [user.username, user.realName, user.phone, user.email]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword));
    const matchRole = !roleFilter.value || user.role === roleFilter.value;
    const matchStatus = !statusFilter.value || user.status === statusFilter.value;
    return matchKeyword && matchRole && matchStatus;
  });
});

const userStats = computed(() => ({
  management: userList.value.filter((item) => ['ADMIN', 'MAINTAINER'].includes(item.role)).length
}));

const activeUsers = computed(() => filteredUserList.value.filter((item) => item.status === 'ACTIVE').length);
const inactiveUsers = computed(() => filteredUserList.value.filter((item) => item.status !== 'ACTIVE').length);

onMounted(() => {
  loadUserList();
});

async function loadUserList() {
  try {
    loading.value = true;
    const res = await userAPI.list({
      page: pagination.page - 1,
      size: pagination.size
    });
    userList.value = res.data?.content || res.data || [];
    total.value = res.data?.totalElements || res.data?.length || 0;
  } catch (error) {
    console.error('加载用户列表失败:', error);
    ElMessage.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSizeChange(size) {
  pagination.size = size;
  pagination.page = 1;
  loadUserList();
}

function handleCurrentChange(page) {
  pagination.page = page;
  loadUserList();
}

function handleAdd() {
  isEdit.value = false;
  dialogTitle.value = '新增用户';
  form.value = {
    id: null,
    username: '',
    password: '',
    realName: '',
    role: 'USER',
    phone: '',
    email: '',
    status: 'ACTIVE'
  };
  dialogVisible.value = true;
}

function handleEdit(row) {
  isEdit.value = true;
  dialogTitle.value = '编辑用户';
  form.value = {
    ...row,
    password: ''
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
      await userAPI.update(form.value.id, form.value);
      ElMessage.success('用户更新成功');
    } else {
      await userAPI.create(form.value);
      ElMessage.success('用户创建成功');
    }
    dialogVisible.value = false;
    loadUserList();
  } catch (error) {
    console.error('提交用户信息失败:', error);
    ElMessage.error('提交用户信息失败');
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除用户“${row.username}”吗？`, '删除确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await userAPI.delete(row.id);
      ElMessage.success('用户删除成功');
      loadUserList();
    })
    .catch(() => {});
}

function formatRoleDisplayName(role) {
  return getRoleDisplayName(role);
}

function getRoleTagType(role) {
  return (
    {
      ADMIN: 'danger',
      MAINTAINER: 'warning',
      TEACHER: 'success',
      STUDENT: 'primary',
      USER: 'info'
    }[role] || 'info'
  );
}
</script>

<style scoped>
.admin-user-page {
  --theme-main: #69b4e7;
  --theme-deep: #3e8fc6;
  --theme-soft: rgba(188, 228, 248, 0.28);
  --theme-border: rgba(105, 180, 231, 0.16);
  --theme-shadow: rgba(36, 80, 110, 0.08);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(214, 239, 250, 0.74), transparent 26%),
    radial-gradient(circle at right center, rgba(239, 249, 253, 0.92), transparent 24%),
    linear-gradient(180deg, #f8fcfe 0%, #f4fafd 48%, #f1f8fb 100%);
}

.page-hero,
.summary-card,
.control-card,
.panel-card {
  animation: user-rise 0.55s ease both;
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
    linear-gradient(145deg, rgba(240, 250, 253, 0.96) 0%, #ffffff 62%);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(188, 228, 248, 0.24);
  color: #4f8ab8;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2 {
  margin: 14px 0 10px;
  color: #214d65;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p {
  margin: 0;
  color: #748d98;
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
  background: linear-gradient(135deg, #69b4e7 0%, #3e8fc6 100%);
  box-shadow: 0 14px 28px rgba(62, 143, 198, 0.22);
}

.secondary-btn {
  border: 1px solid rgba(105, 180, 231, 0.22);
  background: rgba(255, 255, 255, 0.9);
  color: #728894;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-note {
  min-height: 132px;
  padding: 22px;
  background: linear-gradient(180deg, #f8fcfe 0%, #ffffff 100%);
}

.hero-note span,
.hero-note small,
.summary-label,
.summary-card p {
  color: #768a95;
}

.hero-note strong,
.summary-card strong {
  color: #214f68;
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
  border: 1px solid rgba(105, 180, 231, 0.14);
  background: linear-gradient(150deg, rgba(240, 250, 253, 0.96) 0%, #ffffff 84%);
  box-shadow: 0 18px 40px rgba(36, 80, 110, 0.06);
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
  width: 170px;
}

.search-input :deep(.el-input__wrapper),
.filter-select :deep(.el-select__wrapper) {
  min-height: 46px;
  border-radius: 16px;
  box-shadow: none;
  border: 1px solid rgba(105, 180, 231, 0.2);
  background: #f9fcfe;
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
  background: rgba(188, 228, 248, 0.24);
  color: #4b89b7;
  font-size: 12px;
  font-weight: 600;
}

.muted-chip {
  background: rgba(243, 249, 252, 0.96);
  color: #778c97;
}

.user-table :deep(.el-table) {
  --el-table-border-color: rgba(105, 180, 231, 0.12);
  --el-table-row-hover-bg-color: rgba(243, 249, 252, 0.95);
  border-radius: 20px;
}

.user-table :deep(.el-table::before),
.user-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.user-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f6fbfd 0%, #eef7fa 100%) !important;
  color: #214f68;
}

.title-cell {
  display: grid;
  gap: 6px;
}

.title-cell strong {
  color: #214f68;
  font-size: 15px;
}

.title-cell span,
.email-text {
  color: #778b96;
  line-height: 1.6;
}

.action-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
}

.edit-btn {
  color: #4a8ab6;
  border-color: rgba(105, 180, 231, 0.24);
  background: rgba(242, 249, 253, 0.96);
}

.delete-btn {
  color: #d36b74;
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

.user-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.user-dialog :deep(.el-input__wrapper),
.user-dialog :deep(.el-select__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid rgba(105, 180, 231, 0.2);
  background: #f9fcfe;
}

.dialog-footer {
  justify-content: flex-end;
}

@keyframes user-rise {
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

  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
