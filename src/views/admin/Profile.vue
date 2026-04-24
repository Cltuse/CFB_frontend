<template>
  <div class="admin-profile-page">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">Profile</span>
        <h1>个人中心</h1>
        <p>展示管理员个人信息、头像、安全设置和密码修改流程。</p>
        
      </div>

      <div class="hero-side">
        <article class="hero-profile-card">
          <div class="hero-avatar">
            <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="头像" />
            <span v-else>{{ displayInitial }}</span>
          </div>
          <div class="hero-profile-copy">
            <strong>{{ userInfo.realName || '系统管理员' }}</strong>
            <span>{{ userInfo.username || '-' }}</span>
            <small>管理员角色与基础资料展示</small>
          </div>
        </article>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">账号名称</span>
        <strong>{{ userInfo.username || '-' }}</strong>
        <p>当前登录管理员账号</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">真实姓名</span>
        <strong>{{ userInfo.realName || '未填写' }}</strong>
        <p>对外展示与日志关联使用的姓名</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">联系方式</span>
        <strong>{{ userInfo.phone || '未填写' }}</strong>
        <p>用于管理员资料联络与身份核对</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">邮箱地址</span>
        <strong>{{ userInfo.email || '未填写' }}</strong>
        <p>建议完善，用于后续账户安全通知</p>
      </article>
    </section>

    <section class="profile-grid">
      <article class="feature-card">
        <div class="feature-head">
          <div class="feature-icon profile-icon">
            <el-icon><User /></el-icon>
          </div>
          <div>
            <h2>个人资料</h2>
            <p>管理员个人信息、头像、安全设置和密码修改流程。</p>
          </div>
        </div>

        <div class="feature-body">
          <div class="profile-row">
            <span>头像状态</span>
            <strong>{{ userInfo.avatar ? '已上传头像' : '使用默认头像' }}</strong>
          </div>
          <div class="profile-row">
            <span>真实姓名</span>
            <strong>{{ userInfo.realName || '未填写' }}</strong>
          </div>
          <div class="profile-row">
            <span>手机号</span>
            <strong>{{ userInfo.phone || '未填写' }}</strong>
          </div>
          <div class="profile-row">
            <span>邮箱</span>
            <strong>{{ userInfo.email || '未填写' }}</strong>
          </div>
        </div>

        <div class="feature-actions">
          <el-button type="primary" class="primary-btn" @click="handleEditProfile">编辑资料</el-button>
        </div>
      </article>

      <article class="feature-card security-card">
        <div class="feature-head">
          <div class="feature-icon security-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <div>
            <h2>账号安全</h2>
            <p>管理员账号安全设置，包括密码修改、角色管理等。</p>
          </div>
        </div>

        <div class="feature-body">
          <div class="profile-row">
            <span>当前角色</span>
            <strong>系统管理员</strong>
          </div>
          <div class="profile-row">
            <span>建议操作</span>
            <strong>定期更新密码并完善联系信息</strong>
          </div>
          <div class="security-hint">
            修改密码成功后会自动重新登录，确保新凭证立即生效。
          </div>
        </div>

        <div class="feature-actions">
          <el-button class="warning-btn" @click="handleChangePassword">修改密码</el-button>
        </div>
      </article>
    </section>

    <el-dialog
      v-model="profileDialogVisible"
      width="760px"
      class="profile-dialog"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-badge">
            <el-icon><Edit /></el-icon>
          </div>
          <div>
            <h3>编辑个人资料</h3>
            <p>修改管理员头像和基本联系信息</p>
          </div>
        </div>
      </template>

      <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-position="top" class="profile-form">
        <div class="avatar-edit-panel">
          <div class="avatar-preview-wrap">
            <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar-preview" alt="头像预览" />
            <div v-else class="avatar-preview placeholder">{{ displayInitial }}</div>
          </div>

          <div class="avatar-actions">
            <el-upload
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :on-change="handleAvatarChange"
              accept="image/*"
              :auto-upload="false"
            >
              <el-button type="primary" class="primary-btn small-btn">
                <el-icon><Upload /></el-icon>
                选择头像
              </el-button>
            </el-upload>
            <p>支持 JPG、PNG 格式，文件大小不超过 2MB。</p>
          </div>
        </div>

        <div class="form-grid">
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="profileDialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="handleProfileSubmit">保存资料</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="passwordDialogVisible"
      width="700px"
      class="profile-dialog"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-badge security-badge">
            <el-icon><Lock /></el-icon>
          </div>
          <div>
            <h3>修改密码</h3>
            <p>成功后将自动退出当前登录并要求重新认证</p>
          </div>
        </div>
      </template>

      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top" class="password-form">
        <div class="form-grid">
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input v-model="passwordForm.currentPassword" type="password" show-password placeholder="请输入当前密码" />
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="passwordDialogVisible = false">取消</el-button>
          <el-button class="warning-btn" @click="handlePasswordSubmit">确认修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Edit, Lock, Upload, User } from '@element-plus/icons-vue';
import { fileAPI, userAPI } from '../../api';
import { clearAuth, getUserInfo, updateStoredUserInfo } from '../../utils/auth';

const userInfo = ref({});
const profileDialogVisible = ref(false);
const passwordDialogVisible = ref(false);
const profileFormRef = ref(null);
const passwordFormRef = ref(null);
const avatarFile = ref(null);

const profileForm = ref({
  realName: '',
  phone: '',
  email: '',
  avatar: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const displayInitial = computed(() => (userInfo.value.realName || userInfo.value.username || 'A').charAt(0).toUpperCase());

const profileRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
};

const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需要在 6 到 20 个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
};

onMounted(() => {
  loadUserInfo();
});

function loadUserInfo() {
  const info = getUserInfo();
  if (!info) {
    return;
  }
  userInfo.value = info;
  profileForm.value = {
    realName: info.realName || '',
    phone: info.phone || '',
    email: info.email || '',
    avatar: info.avatar || ''
  };
}

function handleEditProfile() {
  profileDialogVisible.value = true;
}

function handleChangePassword() {
  passwordDialogVisible.value = true;
}

function beforeAvatarUpload(file) {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB');
    return false;
  }
  return true;
}

function handleAvatarChange(file) {
  if (!beforeAvatarUpload(file.raw)) {
    return;
  }

  avatarFile.value = file.raw;
  const reader = new FileReader();
  reader.onload = (event) => {
    profileForm.value.avatar = event.target.result;
  };
  reader.readAsDataURL(file.raw);
}

async function handleProfileSubmit() {
  try {
    await profileFormRef.value.validate();

    if (avatarFile.value) {
      const uploadResult = await fileAPI.uploadAvatar(avatarFile.value);
      if (uploadResult.code === 200) {
        profileForm.value.avatar = uploadResult.data;
      }
    }

    const updatedUser = {
      realName: profileForm.value.realName,
      phone: profileForm.value.phone,
      email: profileForm.value.email,
      avatar: profileForm.value.avatar
    };

    const res = await userAPI.updateProfile(updatedUser);
    const nextUser = { ...userInfo.value, ...res.data };
    updateStoredUserInfo(nextUser);
    userInfo.value = nextUser;
    avatarFile.value = null;
    profileDialogVisible.value = false;
    ElMessage.success('个人资料更新成功');
  } catch (error) {
    console.error('更新个人资料失败:', error);
    ElMessage.error('更新个人资料失败');
  }
}

async function handlePasswordSubmit() {
  try {
    await passwordFormRef.value.validate();
    await userAPI.changePassword(userInfo.value.id, {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });

    passwordDialogVisible.value = false;
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    ElMessage.success('密码修改成功，即将重新登录');

    setTimeout(() => {
      clearAuth();
      window.location.href = '/login';
    }, 2000);
  } catch (error) {
    console.error('修改密码失败:', error);
    ElMessage.error(error.response?.data?.message || '修改密码失败');
  }
}
</script>

<style scoped>
.admin-profile-page {
  --theme-main: #7cc8ad;
  --theme-deep: #4e9c82;
  --theme-soft: rgba(198, 239, 223, 0.28);
  --theme-border: rgba(124, 200, 173, 0.16);
  --theme-shadow: rgba(31, 78, 63, 0.08);
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(221, 247, 237, 0.76), transparent 26%),
    radial-gradient(circle at right center, rgba(242, 252, 248, 0.92), transparent 24%),
    linear-gradient(180deg, #f8fdfa 0%, #f4fbf8 48%, #f1f9f5 100%);
}

.page-hero,
.summary-card,
.feature-card {
  animation: profile-rise 0.55s ease both;
}

.page-hero,
.hero-profile-card,
.summary-card,
.feature-card {
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
    linear-gradient(145deg, rgba(242, 252, 248, 0.96) 0%, #ffffff 62%);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(198, 239, 223, 0.24);
  color: #4f977f;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.feature-head h2,
.dialog-header h3 {
  margin: 14px 0 10px;
  color: #224e40;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.feature-head p,
.dialog-header p {
  margin: 0;
  color: #738d84;
  line-height: 1.8;
}

.hero-actions,
.feature-actions,
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
.secondary-btn,
.warning-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #7cc8ad 0%, #4e9c82 100%);
  box-shadow: 0 14px 28px rgba(78, 156, 130, 0.22);
}

.secondary-btn {
  border: 1px solid rgba(124, 200, 173, 0.22);
  background: rgba(255, 255, 255, 0.9);
  color: #718b82;
}

.warning-btn {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #f0b36f 0%, #cb8840 100%);
  box-shadow: 0 14px 28px rgba(203, 136, 64, 0.22);
}

.small-btn {
  min-height: 40px;
}

.hero-profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
  background: linear-gradient(180deg, #f9fdfb 0%, #ffffff 100%);
}

.hero-avatar,
.avatar-preview,
.avatar-preview.placeholder {
  width: 84px;
  height: 84px;
  border-radius: 24px;
}

.hero-avatar {
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(198, 239, 223, 0.42), rgba(255, 255, 255, 0.98));
  color: #4e9c82;
  font-size: 32px;
  font-weight: 700;
}

.hero-avatar img,
.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-profile-copy {
  display: grid;
  gap: 6px;
}

.hero-profile-copy strong {
  color: #214c3e;
  font-size: 20px;
}

.hero-profile-copy span,
.hero-profile-copy small,
.summary-label,
.summary-card p {
  color: #748d84;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px;
  background: linear-gradient(150deg, rgba(242, 252, 248, 0.96) 0%, #ffffff 84%);
}

.summary-card strong {
  display: block;
  margin: 14px 0 8px;
  color: #224e40;
  font-size: 26px;
}

.summary-card p {
  margin: 0;
  line-height: 1.7;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 24px;
}

.feature-head {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.feature-icon {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  font-size: 30px;
}

.profile-icon {
  background: linear-gradient(135deg, rgba(198, 239, 223, 0.42), rgba(255, 255, 255, 0.98));
  color: #4e9c82;
}

.security-icon {
  background: linear-gradient(135deg, rgba(255, 228, 191, 0.42), rgba(255, 255, 255, 0.98));
  color: #cb8840;
}

.feature-body {
  margin-top: 22px;
  display: grid;
  gap: 14px;
}

.profile-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f9fcfb;
}

.profile-row span,
.security-hint {
  color: #769087;
}

.profile-row strong {
  color: #234e41;
  text-align: right;
}

.security-card .profile-row strong {
  color: #825522;
}

.security-hint {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 245, 231, 0.92);
  line-height: 1.8;
}

.feature-actions {
  justify-content: flex-end;
  margin-top: 22px;
}

.profile-dialog :deep(.el-dialog) {
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
  background: rgba(198, 239, 223, 0.24);
  color: var(--theme-deep);
}

.security-badge {
  background: rgba(255, 228, 191, 0.28);
  color: #cb8840;
}

.avatar-edit-panel {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 20px;
  margin-bottom: 22px;
  padding: 20px;
  border-radius: 22px;
  background: #f9fcfb;
}

.avatar-preview-wrap {
  display: grid;
  place-items: center;
}

.avatar-preview.placeholder {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(198, 239, 223, 0.42), rgba(255, 255, 255, 0.98));
  color: #4e9c82;
  font-size: 34px;
  font-weight: 700;
}

.avatar-actions {
  display: grid;
  align-content: center;
  gap: 10px;
}

.avatar-actions p {
  margin: 0;
  color: #738d84;
  line-height: 1.7;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.profile-dialog :deep(.el-input__wrapper) {
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid rgba(124, 200, 173, 0.2);
  background: #f9fcfb;
}

.dialog-footer {
  justify-content: flex-end;
}

@keyframes profile-rise {
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
  .profile-grid,
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid,
  .profile-grid,
  .form-grid,
  .avatar-edit-panel {
    grid-template-columns: 1fr;
  }

  .page-hero,
  .feature-card {
    padding: 18px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .feature-head {
    grid-template-columns: 1fr;
  }

  .profile-row,
  .feature-actions,
  .dialog-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .profile-row strong {
    text-align: left;
  }
}
</style>
