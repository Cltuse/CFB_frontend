<template>
  <div class="page-shell profile-theme">
    <section class="page-hero">
      <div class="hero-main">
        <div class="avatar-card">
          <div class="hero-avatar">
            <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar-image" alt="用户头像" />
            <div v-else class="avatar-placeholder">{{ displayInitial }}</div>
          </div>
          <el-button type="primary" plain class="avatar-trigger" @click="handleAvatarUpload">
            更换头像
          </el-button>
        </div>

        <div class="hero-copy">
          <span class="eyebrow">管理员资料</span>
          <h1>个人中心</h1>
          <p>查看和管理个人资料、安全设置和头像信息。</p>

          <div class="hero-meta">
            <article class="meta-card">
              <span>当前身份</span>
              <strong>设施管理员</strong>
              <small>用于设施维护、预约审核与现场核销</small>
            </article>
            <article class="meta-card">
              <span>资料完成度</span>
              <strong>{{ profileCompletion }}%</strong>
              <small>{{ completionDescription }}</small>
            </article>
          </div>
        </div>
      </div>

      <div class="hero-actions">
        <el-button type="primary" size="large" class="action-button" @click="handleEditProfile">编辑资料</el-button>
        <el-button type="primary" size="large" class="action-button action-warning" @click="handleChangePassword">修改密码</el-button>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">用户名</span>
        <strong>{{ userInfo.username || '-' }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">真实姓名</span>
        <strong>{{ userInfo.realName || '未填写' }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">联系方式</span>
        <strong>{{ userInfo.phone || '未填写' }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">账号状态</span>
        <strong>{{ userStatusText }}</strong>
      </article>
    </section>

    <section class="notice-card">
      <div class="notice-copy">
        <h2>资料完整性说明</h2>
        <p>完善度按真实姓名、手机号、邮箱、头像 4 项基础资料计算，每项占 25%。</p>
      </div>
      <div class="notice-status">
        <strong v-if="missingProfileFields.length">缺少：{{ missingProfileFields.join('、') }}</strong>
        <strong v-else>当前资料已完整</strong>
      </div>
    </section>

    <section class="panel-grid">
      <article class="panel-card">
        <div class="panel-header">
          <div>
            <h2>基础资料</h2>
            <p>维护当前账号的姓名、邮箱、电话和头像等基础信息。</p>
          </div>
          <el-button type="primary" @click="handleEditProfile">编辑资料</el-button>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">用户名</span>
            <strong>{{ userInfo.username || '-' }}</strong>
          </div>
          <div class="info-item">
            <span class="info-label">真实姓名</span>
            <strong>{{ userInfo.realName || '未填写' }}</strong>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <strong>{{ userInfo.phone || '未填写' }}</strong>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <strong>{{ userInfo.email || '未填写' }}</strong>
          </div>
          <div class="info-item">
            <span class="info-label">角色</span>
            <strong>设施管理员</strong>
          </div>
          <div class="info-item">
            <span class="info-label">账号状态</span>
            <strong>{{ userStatusText }}</strong>
          </div>
        </div>
      </article>

      <article class="panel-card security-card">
        <div class="panel-header">
          <div>
            <h2>安全设置</h2>
            <p>定期修改密码，避免维护账号被误用或泄露。</p>
          </div>
          <el-button type="primary" class="security-action-btn" @click="handleChangePassword">修改密码</el-button>
        </div>

        <div class="security-list">
          <article class="security-item">
            <span>密码安全</span>
            <strong>建议 6 到 20 位并包含字母和数字</strong>
          </article>
          <article class="security-item">
            <span>登录提醒</span>
            <strong>完成改密后将重新登录以保证会话安全</strong>
          </article>
          <article class="security-item">
            <span>资料同步</span>
            <strong>资料更新后会同步刷新本地登录信息</strong>
          </article>
        </div>
      </article>
    </section>

    <el-dialog
      v-model="profileDialogVisible"
      width="560px"
      class="profile-dialog"
      :show-close="false"
    >
      <div class="dialog-header">
        <div class="dialog-title-icon">资</div>
        <span class="dialog-title-text">编辑个人信息</span>
      </div>

      <div class="dialog-body">
        <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="80px" class="profile-form">
          <el-form-item label="头像" class="avatar-form-item">
            <div class="avatar-upload-section">
              <div class="current-avatar">
                <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar-preview" alt="当前头像" />
                <div v-else class="avatar-preview-placeholder">{{ profileForm.realName ? profileForm.realName.charAt(0) : 'U' }}</div>
              </div>
              <div class="upload-actions">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :on-change="handleAvatarChange"
                  accept="image/*"
                  :auto-upload="false"
                >
                  <el-button type="primary" :icon="Upload">选择图片</el-button>
                </el-upload>
                <p class="upload-tip">支持 JPG、PNG 格式，大小不超过 2MB</p>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
          </el-form-item>
          <el-form-item label="电话" prop="phone">
            <el-input v-model="profileForm.phone" placeholder="请输入电话号码" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button size="large" @click="profileDialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" size="large" @click="handleProfileSubmit" class="submit-btn">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="passwordDialogVisible"
      width="560px"
      class="profile-dialog"
      :show-close="false"
    >
      <div class="dialog-header warning-header">
        <div class="dialog-title-icon warning-icon">密</div>
        <span class="dialog-title-text">修改密码</span>
      </div>

      <div class="dialog-body">
        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" class="password-form">
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="请输入当前密码"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
              clearable
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button size="large" @click="passwordDialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" size="large" @click="handlePasswordSubmit" class="submit-btn">修改密码</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { userAPI, fileAPI } from '../../api'
import { clearAuth, getUserInfo, updateStoredUserInfo } from '../../utils/auth'
import { buildFeatureVars, getRoleTheme } from '../../utils/featureTheme'
const localUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const theme = getRoleTheme(localUserInfo.role || 'maintainer')
const featureVars = buildFeatureVars(theme)

const userInfo = ref({})
const profileDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const profileFormRef = ref(null)
const passwordFormRef = ref(null)

const profileForm = ref({
  realName: '',
  phone: '',
  email: '',
  avatar: ''
})

const avatarFile = ref(null)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
}

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
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const displayInitial = computed(() => {
  const name = userInfo.value.realName || userInfo.value.username || 'U'
  return name.charAt(0)
})

const profileCompletion = computed(() => {
  const fields = [userInfo.value.realName, userInfo.value.phone, userInfo.value.email, userInfo.value.avatar]
  const filledCount = fields.filter((item) => Boolean(item)).length
  return Math.round((filledCount / fields.length) * 100)
})

const missingProfileFields = computed(() => {
  const fields = [
    { label: '真实姓名', value: userInfo.value.realName },
    { label: '手机号', value: userInfo.value.phone },
    { label: '邮箱', value: userInfo.value.email },
    { label: '头像', value: userInfo.value.avatar }
  ]
  return fields.filter((item) => !item.value).map((item) => item.label)
})

const completionDescription = computed(() =>
  missingProfileFields.value.length
    ? `缺少 ${missingProfileFields.value.join('、')}`
    : '真实姓名、手机号、邮箱、头像均已完善'
)

const userStatusText = computed(() =>
  userInfo.value.status === 'ACTIVE' ? '正常' : (userInfo.value.status || '未知')
)

onMounted(() => {
  loadUserInfo()
})

const loadUserInfo = () => {
  const info = getUserInfo()
  if (info) {
    userInfo.value = info
    profileForm.value = {
      realName: userInfo.value.realName || '',
      phone: userInfo.value.phone || '',
      email: userInfo.value.email || '',
      avatar: userInfo.value.avatar || ''
    }
  }
}

const handleEditProfile = () => {
  profileDialogVisible.value = true
}

const handleChangePassword = () => {
  passwordDialogVisible.value = true
}

const handleAvatarUpload = () => {
  profileDialogVisible.value = true
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const handleAvatarChange = (file) => {
  if (beforeAvatarUpload(file.raw)) {
    avatarFile.value = file.raw
    const reader = new FileReader()
    reader.onload = (e) => {
      profileForm.value.avatar = e.target.result
    }
    reader.readAsDataURL(file.raw)
  }
}

const handleProfileSubmit = async () => {
  try {
    await profileFormRef.value.validate()

    if (avatarFile.value) {
      try {
        const uploadResult = await fileAPI.uploadAvatar(avatarFile.value)
        if (uploadResult.code === 200) {
          profileForm.value.avatar = uploadResult.data
        }
      } catch (error) {
        console.error('头像上传失败:', error)
        ElMessage.error('头像上传失败，请重试')
        return
      }
    }

    const updatedUser = {
      realName: profileForm.value.realName,
      phone: profileForm.value.phone,
      email: profileForm.value.email,
      avatar: profileForm.value.avatar
    }

    const res = await userAPI.updateProfile(updatedUser)
    const nextUser = { ...userInfo.value, ...res.data }

    updateStoredUserInfo(nextUser)
    userInfo.value = nextUser

    profileDialogVisible.value = false
    ElMessage.success('个人信息更新成功')
    avatarFile.value = null
  } catch (error) {
    console.error('更新个人信息失败:', error)
  }
}

const handlePasswordSubmit = async () => {
  try {
    await passwordFormRef.value.validate()

    const passwordData = {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    }

    await userAPI.changePassword(userInfo.value.id, passwordData)

    passwordDialogVisible.value = false
    ElMessage.success('密码修改成功，请重新登录')

    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    setTimeout(() => {
      clearAuth()
      window.location.href = '/login'
    }, 2000)
  } catch (error) {
    console.error('修改密码失败:', error)
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('修改密码失败，请重试')
    }
  }
}
</script>

<style scoped>
.profile-theme {
  padding: 24px;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, var(--feature-soft), transparent 28%),
    linear-gradient(180deg, var(--layout-shell-top) 0%, var(--layout-shell-bottom) 100%);
}

.page-hero,
.panel-card {
  animation: rise-in 0.55s ease both;
}

.page-hero {
  display: grid;
  grid-template-columns: 1.6fr 280px;
  gap: 20px;
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid var(--feature-soft);
  box-shadow: 0 24px 60px var(--feature-glow);
}

.hero-main {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
}

.avatar-card {
  display: grid;
  gap: 14px;
  justify-items: center;
}

.hero-avatar {
  width: 120px;
  height: 120px;
  border-radius: 32px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--feature-surface) 0%, var(--feature-soft) 100%);
  box-shadow: 0 14px 34px var(--feature-glow);
}

.avatar-image,
.avatar-placeholder {
  width: 100%;
  height: 100%;
}

.avatar-image {
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--feature-primary);
  font-size: 42px;
  font-weight: 700;
}

.avatar-trigger {
  width: 120px;
}

.eyebrow {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--feature-soft);
  color: var(--feature-primary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 14px 0 10px;
  font-size: 32px;
  color: #0f172a;
}

.hero-copy p {
  margin: 0;
  color: #52606d;
  line-height: 1.7;
  max-width: 760px;
}

.hero-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.meta-card,
.summary-card,
.security-item {
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid var(--feature-soft);
  background: linear-gradient(135deg, var(--feature-surface) 0%, #ffffff 100%);
}

.meta-card span,
.summary-label,
.security-item span,
.info-label {
  display: block;
  color: #6b7280;
  font-size: 13px;
}

.meta-card small {
  display: block;
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.6;
}

.meta-card strong,
.summary-card strong,
.security-item strong {
  display: block;
  margin-top: 10px;
  color: #102a27;
  font-size: 22px;
  line-height: 1.5;
}

.hero-actions {
  display: grid;
  gap: 14px;
  align-content: center;
}

.action-button {
  width: 100%;
  min-height: 48px;
  border-radius: 18px;
}

.action-warning {
  background: var(--feature-primary) !important;
  opacity: 0.85;
}

.action-warning:hover {
  opacity: 1;
}

.hero-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.summary-card {
  box-shadow: 0 18px 40px rgba(17, 24, 39, 0.06);
  background: rgba(255, 255, 255, 0.96);
}

.summary-card strong {
  font-size: 24px;
}

.notice-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
  padding: 20px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.08);
}

.notice-copy h2 {
  margin: 0;
  font-size: 18px;
  color: #102a27;
}

.notice-copy p {
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
}

.notice-status strong {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--feature-soft);
  color: var(--feature-primary);
  font-size: 13px;
}

.panel-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.panel-card {
  padding: 22px 24px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.08);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  color: #102a27;
}

.panel-header p {
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.info-item {
  padding: 18px;
  border-radius: 18px;
  background: var(--feature-surface);
  border: 1px solid var(--feature-soft);
}

.info-item strong {
  display: block;
  margin-top: 10px;
  color: #102a27;
  line-height: 1.6;
  word-break: break-all;
}

.security-list {
  display: grid;
  gap: 14px;
}

.security-action-btn {
  background: var(--feature-primary) !important;
  border-color: var(--feature-primary) !important;
}

.profile-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.profile-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.profile-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}

.profile-dialog :deep(.el-dialog__body),
.profile-dialog :deep(.el-dialog__footer) {
  padding: 0;
  margin: 0;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 32px;
  background: linear-gradient(135deg, var(--feature-surface) 0%, var(--feature-soft) 100%);
  border-bottom: 1px solid var(--feature-soft);
}

.warning-header {
  background: linear-gradient(135deg, #fff2e8 0%, #fff8f1 100%);
}

.dialog-title-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--feature-soft);
  color: var(--feature-primary);
  font-weight: 700;
}

.warning-icon {
  background: rgba(249, 115, 22, 0.12);
  color: #ea580c;
}

.dialog-title-text {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.dialog-body {
  padding: 28px 32px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px 28px;
}

.cancel-btn {
  border-radius: 10px;
}

.submit-btn {
  border-radius: 10px;
}

.profile-form :deep(.el-form-item__label),
.password-form :deep(.el-form-item__label) {
  color: #1f2937;
  font-weight: 600;
}

.avatar-form-item :deep(.el-form-item__content) {
  flex-direction: column;
  align-items: flex-start;
}

.avatar-upload-section {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.current-avatar {
  width: 100px;
  height: 100px;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--feature-surface) 0%, var(--feature-soft) 100%);
  box-shadow: 0 10px 24px var(--feature-glow);
  flex-shrink: 0;
}

.avatar-preview,
.avatar-preview-placeholder {
  width: 100%;
  height: 100%;
}

.avatar-preview {
  object-fit: cover;
}

.avatar-preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--feature-primary);
  font-size: 38px;
  font-weight: 700;
}

.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-tip {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page-hero {
    grid-template-columns: 1fr;
  }

  .hero-main {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .hero-actions {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .profile-theme {
    padding: 16px;
  }

  .summary-grid,
  .info-grid,
  .hero-meta {
    grid-template-columns: 1fr;
  }

  .notice-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .avatar-upload-section {
    flex-direction: column;
  }
}
</style>