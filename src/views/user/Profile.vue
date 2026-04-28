<template>
  <div class="profile-page">
    <section class="page-header">
      <div class="header-content">
        <div>
          <span class="page-kicker">账户设置中心</span>
          <h1 class="page-title">个人中心</h1>
          <p class="page-subtitle">把个人资料和账户安全拆成清晰的功能卡片，便于用户逐项维护。</p>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">身份角色</span>
        <strong>{{ getRoleDisplayName(userInfo.role) || '普通用户' }}</strong>
        <p>根据账户角色展示对应的功能入口</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">资料完整度</span>
        <strong>{{ profileStats.completed }}/4</strong>
        <p>姓名、电话、邮箱、头像四项资料统计</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">联系方式</span>
        <strong>{{ profileStats.contactStatus }}</strong>
        <p>电话和邮箱至少完整一项更方便沟通</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">头像状态</span>
        <strong>{{ profileStats.avatarStatus }}</strong>
        <p>支持在资料弹窗中直接预览并更换头像</p>
      </article>
    </section>

    <section class="cards-grid">
      <article class="feature-card">
        <div class="card-head">
          <div class="avatar-shell">
            <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar-image" alt="用户头像" />
            <div v-else class="avatar-placeholder">{{ userInitial }}</div>
            <button type="button" class="avatar-action" @click.stop="handleAvatarUpload">更换头像</button>
          </div>

          <div class="card-copy">
            <h2>个人资料</h2>
            <p>集中查看学号或工号、姓名、联系方式等基础信息。</p>
          </div>
        </div>

        <div class="info-list">
          <div class="info-row">
            <label>学号 / 工号</label>
            <strong>{{ userInfo.username || '未设置' }}</strong>
          </div>
          <div class="info-row">
            <label>姓名</label>
            <strong>{{ userInfo.realName || '未设置' }}</strong>
          </div>
          <div class="info-row">
            <label>角色</label>
            <strong>{{ getRoleDisplayName(userInfo.role) || '未设置' }}</strong>
          </div>
          <div class="info-row">
            <label>电话</label>
            <strong>{{ userInfo.phone || '未设置' }}</strong>
          </div>
          <div class="info-row">
            <label>邮箱</label>
            <strong>{{ userInfo.email || '未设置' }}</strong>
          </div>
        </div>

        <div class="card-actions">
          <el-button type="primary" class="primary-btn" @click="handleEditProfile">编辑资料</el-button>
        </div>
      </article>

      <article class="feature-card security-card">
        <div class="card-head">
          <div class="security-badge">安</div>
          <div class="card-copy">
            <h2>账户安全</h2>
            <p>通过更轻的安全提示卡片，让修改密码这件事更容易被用户理解和执行。</p>
          </div>
        </div>

        <div class="security-list">
          <div class="security-item">
            <strong>建议定期更新密码</strong>
            <p>密码长度建议不少于 6 位，避免与其他平台重复使用。</p>
          </div>
          <div class="security-item">
            <strong>保护联系方式</strong>
            <p>联系方式填写完整后，系统沟通和预约通知会更加及时。</p>
          </div>
        </div>

        <div class="card-actions">
          <el-button class="warning-btn" @click="handleChangePassword">修改密码</el-button>
        </div>
      </article>
    </section>

    <el-dialog v-model="profileDialogVisible" width="560px" class="profile-dialog" :show-close="false">
      <div class="dialog-header">
        <span class="dialog-kicker">资料编辑</span>
        <h3>编辑个人信息</h3>
      </div>

      <div class="dialog-body">
        <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-position="top" class="profile-form">
          <el-form-item label="头像" class="avatar-form-item">
            <div class="upload-shell">
              <div class="current-avatar">
                <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar-preview" alt="头像预览" />
                <div v-else class="avatar-preview placeholder">{{ profileForm.realName ? profileForm.realName.charAt(0) : 'U' }}</div>
              </div>
              <div class="upload-copy">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :on-change="handleAvatarChange"
                  accept="image/*"
                  :auto-upload="false"
                >
                  <el-button type="primary" class="primary-btn">选择图片</el-button>
                </el-upload>
                <p>支持 JPG、PNG 格式，大小不超过 2MB。</p>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
          </el-form-item>
          <el-form-item label="电话" prop="phone">
            <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="profileDialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="handleProfileSubmit">保存资料</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" width="560px" class="profile-dialog" :show-close="false">
      <div class="dialog-header">
        <span class="dialog-kicker">安全设置</span>
        <h3>修改密码</h3>
      </div>

      <div class="dialog-body">
        <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top" class="password-form">
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input v-model="passwordForm.currentPassword" type="password" show-password clearable placeholder="请输入当前密码" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwordForm.newPassword" type="password" show-password clearable placeholder="请输入新密码" />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password clearable placeholder="请再次输入新密码" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="handlePasswordSubmit">确认修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { userAPI, fileAPI } from '../../api';
import { getRoleDisplayName } from '../../utils/roleMapping';
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

const profileRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
};

const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在 6 到 20 个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的新密码不一致'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
};

const userInitial = computed(() => (userInfo.value.realName || userInfo.value.username || 'U').charAt(0).toUpperCase());

const profileStats = computed(() => {
  const completed = [
    Boolean(userInfo.value.realName),
    Boolean(userInfo.value.phone),
    Boolean(userInfo.value.email),
    Boolean(userInfo.value.avatar)
  ].filter(Boolean).length;

  return {
    completed,
    contactStatus: userInfo.value.phone || userInfo.value.email ? '已完善' : '待补充',
    avatarStatus: userInfo.value.avatar ? '已上传' : '默认'
  };
});

const loadUserInfo = () => {
  const info = getUserInfo();
  if (!info) return;

  userInfo.value = info;
  profileForm.value = {
    realName: userInfo.value.realName || '',
    phone: userInfo.value.phone || '',
    email: userInfo.value.email || '',
    avatar: userInfo.value.avatar || ''
  };
};

const handleEditProfile = () => {
  profileDialogVisible.value = true;
};

const handleChangePassword = () => {
  passwordDialogVisible.value = true;
};

const handleAvatarUpload = () => {
  profileDialogVisible.value = true;
};

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB');
    return false;
  }
  return true;
};

const handleAvatarChange = (file) => {
  if (!beforeAvatarUpload(file.raw)) return;

  avatarFile.value = file.raw;
  const reader = new FileReader();
  reader.onload = (event) => {
    profileForm.value.avatar = event.target.result;
  };
  reader.readAsDataURL(file.raw);
};

const handleProfileSubmit = async () => {
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

    profileDialogVisible.value = false;
    avatarFile.value = null;
    ElMessage.success('个人信息更新成功');
  } catch (error) {
    console.error('更新个人信息失败:', error);
    ElMessage.error('更新个人信息失败，请稍后重试');
  }
};

const handlePasswordSubmit = async () => {
  try {
    await passwordFormRef.value.validate();
    await userAPI.changePassword(userInfo.value.id, {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });

    passwordDialogVisible.value = false;
    ElMessage.success('密码修改成功，请重新登录');

    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    setTimeout(() => {
      clearAuth();
      window.location.href = '/login';
    }, 2000);
  } catch (error) {
    console.error('修改密码失败:', error);
    ElMessage.error(error.response?.data?.message || '修改密码失败，请稍后重试');
  }
};

onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped>
.profile-page {
  --page-primary: #f5b7c0;
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(252, 228, 232, 0.34), transparent 30%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.page-header,
.summary-card,
.feature-card {
  border-radius: 30px;
  border: 1px solid rgba(245, 183, 192, 0.14);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 42px rgba(94, 52, 62, 0.05);
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
  font-size: 30px;
  color: #7a4052;
  line-height: 1.1;
}

.summary-card p {
  margin: 0;
  color: #8e717b;
  line-height: 1.6;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 24px;
}

.card-head {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 22px;
}

.avatar-shell {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}

.avatar-image,
.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 28px;
  object-fit: cover;
}

.avatar-placeholder {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  color: #ffffff;
  font-size: 36px;
  font-weight: 700;
}

.avatar-action {
  position: absolute;
  left: 50%;
  bottom: -8px;
  transform: translateX(-50%);
  padding: 6px 12px;
  border: 1px solid rgba(245, 183, 192, 0.2);
  border-radius: 999px;
  background: #ffffff;
  color: #c4677a;
  font-size: 12px;
  cursor: pointer;
}

.card-copy h2 {
  margin: 0;
  color: #7a4052;
}

.card-copy p {
  margin: 8px 0 0;
  color: #8e717b;
  line-height: 1.7;
}

.info-list,
.security-list {
  display: grid;
  gap: 12px;
}

.info-row,
.security-item {
  padding: 16px 18px;
  border-radius: 20px;
  background: #fffafb;
  border: 1px solid rgba(245, 183, 192, 0.12);
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.info-row label {
  color: #8e717b;
}

.info-row strong,
.security-item strong {
  color: #7a4052;
}

.security-badge {
  width: 72px;
  height: 72px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #ffe8b2 0%, #ffd06a 100%);
  color: #8f6721;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
}

.security-item p {
  margin: 8px 0 0;
  color: #8e717b;
  line-height: 1.7;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.primary-btn,
.secondary-btn,
.warning-btn {
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

.warning-btn {
  border: none;
  background: linear-gradient(135deg, #ffc861 0%, #f3a83a 100%);
  color: #5f4210;
  box-shadow: 0 14px 28px rgba(243, 168, 58, 0.18);
}

.profile-page :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.profile-page :deep(.el-dialog__header) {
  display: none;
}

.dialog-header {
  padding: 26px 28px 12px;
  background:
    radial-gradient(circle at top right, rgba(252, 228, 232, 0.28), transparent 24%),
    linear-gradient(145deg, rgba(252, 228, 232, 0.18) 0%, #ffffff 64%);
}

.dialog-kicker {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(245, 183, 192, 0.14);
  color: #c4677a;
  font-size: 12px;
  font-weight: 600;
}

.dialog-header h3 {
  margin: 14px 0 0;
  color: #7a4052;
  font-size: 26px;
}

.dialog-body {
  padding: 20px 28px 8px;
}

.upload-shell {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 18px;
  border-radius: 22px;
  background: #fffafb;
}

.avatar-preview {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  object-fit: cover;
}

.avatar-preview.placeholder {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  color: #ffffff;
  font-size: 34px;
  font-weight: 700;
}

.upload-copy p {
  margin: 10px 0 0;
  color: #8e717b;
}

.profile-page :deep(.el-input__wrapper) {
  border-radius: 16px;
  box-shadow: none;
  background: #fffafb;
  border: 1px solid rgba(245, 183, 192, 0.18);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 28px 28px;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .header-content,
  .feature-card,
  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .page-title {
    font-size: 28px;
  }

  .card-head,
  .info-row,
  .upload-shell {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-actions,
  .dialog-footer {
    flex-direction: column;
  }
}
</style>
<style scoped>
.profile-page {
  --theme-deep: #e8909d;
  --theme-border: rgba(245, 183, 192, 0.16);
  --theme-shadow: rgba(94, 52, 62, 0.08);
  background:
    radial-gradient(circle at top left, rgba(252, 228, 232, 0.4), transparent 30%),
    radial-gradient(circle at right center, rgba(254, 248, 249, 0.96), transparent 24%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.page-header,
.summary-card,
.feature-card {
  animation: profile-rise 0.55s ease both;
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

.feature-card {
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 52px rgba(94, 52, 62, 0.1);
}

.avatar-action:hover {
  transform: translateX(-50%) translateY(-1px);
  box-shadow: 0 10px 20px rgba(232, 144, 157, 0.16);
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
</style>
