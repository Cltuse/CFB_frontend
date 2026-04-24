<template>
  <div class="facility-page">
    <section class="page-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">资源配置中枢</span>
        <h1>设施管理</h1>
        <p>集中维护设施资料、负责人和图片状态，让管理员能更顺畅地完成新增、编辑、筛查和图片维护。</p>
        <div class="hero-actions">
          <el-button type="primary" class="primary-btn" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新建设施
          </el-button>
          <el-button class="secondary-btn" @click="loadFacilityList">重新加载</el-button>
        </div>
      </div>

      <div class="hero-side">
        <article class="hero-note">
          <span>设施总数</span>
          <strong>{{ facilityStats.total }}</strong>
          <small>按当前分页接口返回的数据总量统计</small>
        </article>
        <article class="hero-note">
          <span>当前页记录</span>
          <strong>{{ facilityList.length }}</strong>
          <small>便于对照筛选结果和分页切换</small>
        </article>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">可用设施</span>
        <strong>{{ facilityStats.available }}</strong>
        <p>当前页中可直接开放预约的设施数量</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">维护中</span>
        <strong>{{ facilityStats.maintenance }}</strong>
        <p>需要同步关注维护进度和开放状态</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">损坏停用</span>
        <strong>{{ facilityStats.damaged }}</strong>
        <p>建议优先排查修复或替换的异常设施</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已分配负责人</span>
        <strong>{{ assignedCount }}</strong>
        <p>当前页中已绑定设施管理员的资源数量</p>
      </article>
    </section>

    <section class="control-card">
      <div class="section-copy">
        <h2>筛选与录入</h2>
        <p>支持按设施名称、型号和分类快速搜索，同时保留负责人、图片和状态编辑入口。</p>
      </div>

      <div class="control-actions">
        <el-input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索设施名称、型号或分类"
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
          <h2>设施列表</h2>
          <p>点击整行可以直接进入编辑，也可以单独维护图片或删除记录。</p>
        </div>
        <div class="panel-meta">
          <span class="meta-chip">共 {{ total }} 条</span>
          <span class="meta-chip muted-chip">第 {{ pagination.page }} 页</span>
        </div>
      </div>

      <el-table
        :data="facilityList"
        class="facility-table"
        @row-click="handleRowClick"
        v-loading="loading"
      >
        <el-table-column label="设施信息" min-width="320">
          <template #default="{ row }">
            <div class="facility-cell">
              <div class="facility-image">
                <img
                  v-if="row.imageUrl && isValidImageUrl(row.imageUrl)"
                  :src="row.imageUrl"
                  :alt="row.name"
                  class="facility-thumb"
                  @error="handleImageError"
                />
                <div v-else class="no-image">
                  <el-icon><Picture /></el-icon>
                </div>
              </div>
              <div class="facility-copy">
                <strong>{{ row.name || '未命名设施' }}</strong>
                <span>{{ row.model ? `型号：${row.model}` : '型号信息未填写' }}</span>
                <small>{{ row.location || '位置暂未填写' }}</small>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag effect="light" class="soft-tag">
              {{ row.category || '未分类' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="负责人" min-width="170">
          <template #default="{ row }">
            <div class="info-stack">
              <strong>{{ row.maintainerName || '未分配' }}</strong>
              <small>{{ row.maintainerName ? '已绑定设施管理员' : '可在编辑弹窗中补充分配关系' }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" class="status-tag">
              <el-icon>
                <CircleCheck v-if="row.status === 'AVAILABLE'" />
                <CircleClose v-else-if="row.status === 'DAMAGED'" />
                <Tools v-else-if="row.status === 'MAINTENANCE'" />
                <Timer v-else />
              </el-icon>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="价格" width="140" align="center">
          <template #default="{ row }">
            <span class="price-text">{{ formatCurrency(row.price) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="购置日期" min-width="150" align="center">
          <template #default="{ row }">
            <span class="muted-text">{{ row.purchaseDate || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click.stop="handleEdit(row)">编辑</el-button>
              <el-button link type="warning" @click.stop="handleImageUpload(row)">图片</el-button>
              <el-button link type="danger" @click.stop="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !facilityList.length" description="当前没有符合条件的设施记录" />

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
      :title="dialogTitle"
      v-model="dialogVisible"
      width="760px"
      class="editor-dialog"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="editor-form"
        label-position="top"
      >
        <div class="form-grid">
          <el-form-item label="设施名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入设施名称" clearable />
          </el-form-item>

          <el-form-item label="设施型号" prop="model">
            <el-input v-model="form.model" placeholder="请输入设施型号" clearable />
          </el-form-item>

          <el-form-item label="设施分类" prop="category">
            <el-select v-model="form.category" placeholder="请选择设施分类">
              <el-option
                v-for="item in categoryOptions"
                :key="item.categoryName"
                :label="item.categoryName"
                :value="item.categoryName"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="存放位置" prop="location">
            <el-input v-model="form.location" placeholder="请输入设施位置" clearable />
          </el-form-item>

          <el-form-item label="设施负责人" prop="maintainerId">
            <el-select
              v-model="form.maintainerId"
              placeholder="请选择设施负责人"
              clearable
              filterable
            >
              <el-option
                v-for="item in maintainerOptions"
                :key="item.id"
                :label="item.realName ? `${item.realName} (${item.username})` : item.username"
                :value="item.id"
              />
            </el-select>
            <div class="form-tip">可选字段，不绑定则该设施暂未分配给设施管理员。</div>
          </el-form-item>

          <el-form-item label="设施状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态">
              <el-option label="可用" value="AVAILABLE" />
              <el-option label="维护中" value="MAINTENANCE" />
              <el-option label="损坏" value="DAMAGED" />
            </el-select>
          </el-form-item>

          <el-form-item label="购置日期" prop="purchaseDate">
            <el-date-picker
              v-model="form.purchaseDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择购买日期"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="价格" prop="price">
            <el-input-number
              v-model="form.price"
              :min="0"
              :precision="2"
              style="width: 100%"
              placeholder="请输入价格"
            />
          </el-form-item>
        </div>

        <el-form-item label="设施描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入设施用途、规格或补充说明"
          />
        </el-form-item>

        <el-form-item label="设施图片" prop="imageUrl">
          <div class="image-upload-section">
            <div v-if="form.imageUrl" class="current-image-preview">
              <img :src="form.imageUrl" :alt="form.name" class="facility-preview-image" />
              <div class="image-actions">
                <el-button size="small" type="danger" @click="removeImage" :icon="Delete">移除图片</el-button>
                <el-button size="small" type="primary" @click="triggerFileSelect" :icon="Upload">更换图片</el-button>
              </div>
            </div>

            <div v-else class="no-image-upload">
              <el-upload
                ref="dialogUploadRef"
                class="dialog-image-uploader"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :before-upload="beforeDialogImageUpload"
                :on-change="handleDialogImageSelect"
                accept="image/*"
                drag
              >
                <el-icon class="upload-icon"><Upload /></el-icon>
                <div class="upload-text">
                  <div class="upload-title">点击或拖拽上传设施图片</div>
                  <div class="upload-hint">支持 JPG、PNG、GIF，大小不超过 10MB</div>
                </div>
              </el-upload>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileInputChange"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '创建设施' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      title="设施图片管理"
      v-model="imageDialogVisible"
      width="560px"
      class="image-dialog"
      :close-on-click-modal="false"
      @close="handleImageDialogClose"
    >
      <div class="image-upload-container">
        <div class="image-dialog-head">
          <div>
            <span class="dialog-eyebrow">图片维护</span>
            <h3>{{ currentFacility?.name || '设施图片' }}</h3>
          </div>
          <span class="image-status">{{ currentFacility?.category || '未分类' }}</span>
        </div>

        <div v-if="currentFacility?.imageUrl" class="current-image">
          <img :src="currentFacility.imageUrl" :alt="currentFacility.name" class="preview-image" />
        </div>
        <div v-else class="no-image-placeholder">
          <el-icon><Picture /></el-icon>
          <p>当前没有设施图片</p>
        </div>

        <el-upload
          ref="uploadRef"
          class="image-uploader"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :before-upload="beforeImageUpload"
          :on-change="handleImageChange"
          accept="image/*"
        >
          <template #trigger>
            <el-button type="primary" class="primary-btn">
              <el-icon><Upload /></el-icon>
              选择图片
            </el-button>
          </template>
        </el-upload>

        <div v-if="selectedImage" class="selected-image-info">
          <p>已选择：{{ selectedImage.name }}</p>
          <p>文件大小：{{ formatFileSize(selectedImage.size) }}</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="imageDialogVisible = false">关闭</el-button>
          <el-button v-if="currentFacility?.imageUrl" type="danger" plain @click="handleDeleteImage">
            删除图片
          </el-button>
          <el-button
            type="primary"
            class="primary-btn"
            @click="handleUploadImage"
            :disabled="!selectedImage"
            :loading="uploading"
          >
            上传图片
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  CircleCheck,
  CircleClose,
  Delete,
  Picture,
  Plus,
  Search,
  Timer,
  Tools,
  Upload
} from '@element-plus/icons-vue';
import { facilityAPI, facilityCategoryAPI, fileAPI, userAPI } from '../../api';

const loading = ref(false);
const dialogVisible = ref(false);
const imageDialogVisible = ref(false);
const uploading = ref(false);
const isEdit = ref(false);
const total = ref(0);
const facilityList = ref([]);
const categoryOptions = ref([]);
const maintainerOptions = ref([]);
const searchKeyword = ref('');
const isSearchMode = ref(false);
const selectedImage = ref(null);
const currentFacility = ref(null);
const formRef = ref(null);
const uploadRef = ref(null);
const dialogUploadRef = ref(null);
const fileInputRef = ref(null);
const dialogTitle = ref('新增设施');

const pagination = reactive({
  page: 1,
  size: 10,
  sortBy: 'id',
  sortDir: 'desc'
});

const form = ref(createEmptyForm());

const rules = {
  name: [{ required: true, message: '请输入设施名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择设施分类', trigger: 'change' }],
  status: [{ required: true, message: '请选择设施状态', trigger: 'change' }]
};

const facilityStats = computed(() => ({
  total: total.value,
  available: facilityList.value.filter((item) => item.status === 'AVAILABLE').length,
  maintenance: facilityList.value.filter((item) => item.status === 'MAINTENANCE').length,
  damaged: facilityList.value.filter((item) => item.status === 'DAMAGED').length
}));

const assignedCount = computed(() => facilityList.value.filter((item) => item.maintainerName).length);

onMounted(() => {
  loadFacilityList();
  loadCategoryOptions();
  loadMaintainerOptions();
});

function createEmptyForm() {
  return {
    id: null,
    name: '',
    model: '',
    category: '',
    location: '',
    maintainerId: null,
    status: 'AVAILABLE',
    description: '',
    purchaseDate: '',
    price: 0,
    imageUrl: null,
    _imageFile: null
  };
}

async function loadFacilityList() {
  try {
    loading.value = true;
    const params = {
      page: pagination.page - 1,
      size: pagination.size,
      sortBy: pagination.sortBy,
      sortDir: pagination.sortDir
    };

    const result = isSearchMode.value && searchKeyword.value.trim()
      ? await facilityAPI.searchPage(searchKeyword.value.trim(), params)
      : await facilityAPI.listPage(params);

    if (result?.code !== 200) {
      ElMessage.error(result?.message || '获取设施列表失败');
      facilityList.value = [];
      total.value = 0;
      return;
    }

    const rows = Array.isArray(result.data?.content) ? result.data.content : [];
    facilityList.value = rows.map((item) => ({
      ...item,
      imageUrl: item.imageUrl && item.imageUrl.startsWith('blob:') ? null : item.imageUrl
    }));
    total.value = result.data?.totalElements || 0;
  } catch (error) {
    console.error('加载设施列表失败:', error);
    ElMessage.error('加载设施列表失败，请稍后重试');
    facilityList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadCategoryOptions() {
  try {
    const res = await facilityCategoryAPI.active();
    categoryOptions.value = Array.isArray(res?.data) ? res.data : [];
  } catch (error) {
    console.error('加载设施分类失败:', error);
    categoryOptions.value = [];
  }
}

async function loadMaintainerOptions() {
  try {
    const res = await userAPI.listMaintainers();
    maintainerOptions.value = Array.isArray(res?.data) ? res.data : res?.data?.content || [];
  } catch (error) {
    console.error('加载设施负责人列表失败:', error);
    maintainerOptions.value = [];
  }
}

function handleSearch() {
  pagination.page = 1;
  isSearchMode.value = Boolean(searchKeyword.value.trim());
  loadFacilityList();
}

function handleClearSearch() {
  searchKeyword.value = '';
  isSearchMode.value = false;
  pagination.page = 1;
  loadFacilityList();
}

function handleSizeChange(size) {
  pagination.size = size;
  pagination.page = 1;
  loadFacilityList();
}

function handleCurrentChange(page) {
  pagination.page = page;
  loadFacilityList();
}

function handleRowClick(row) {
  handleEdit(row);
}

function handleAdd() {
  isEdit.value = false;
  dialogTitle.value = '新增设施';
  releasePreviewUrl(form.value.imageUrl);
  form.value = createEmptyForm();
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function handleEdit(row) {
  isEdit.value = true;
  dialogTitle.value = '编辑设施';
  releasePreviewUrl(form.value.imageUrl);
  form.value = {
    ...createEmptyForm(),
    ...row,
    maintainerId: row.maintainerId ?? null,
    imageUrl: row.imageUrl && row.imageUrl.startsWith('blob:') ? null : row.imageUrl,
    _imageFile: null
  };
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除设施“${row.name || '未命名设施'}”吗？该操作不可恢复。`, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await facilityAPI.delete(row.id);
      ElMessage.success('设施已删除');
      await loadFacilityList();
    })
    .catch(() => {});
}

function handleImageUpload(row) {
  if (currentFacility.value?.imageUrl?.startsWith?.('blob:')) {
    URL.revokeObjectURL(currentFacility.value.imageUrl);
  }
  currentFacility.value = { ...row };
  selectedImage.value = null;
  imageDialogVisible.value = true;
}

function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/');
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB');
    return false;
  }
  return true;
}

function handleImageChange(uploadFile) {
  if (!uploadFile?.raw) {
    return;
  }
  const file = uploadFile.raw;
  if (!beforeImageUpload(file)) {
    return;
  }

  if (currentFacility.value?.imageUrl?.startsWith?.('blob:')) {
    URL.revokeObjectURL(currentFacility.value.imageUrl);
  }

  selectedImage.value = file;
  currentFacility.value = {
    ...currentFacility.value,
    imageUrl: URL.createObjectURL(file)
  };
}

async function handleUploadImage() {
  if (!selectedImage.value || !currentFacility.value?.id) {
    ElMessage.warning('请先选择图片');
    return;
  }

  try {
    uploading.value = true;
    const result = await fileAPI.uploadFacilityImage(currentFacility.value.id, selectedImage.value);
    if (result?.code !== 200) {
      ElMessage.error(result?.message || '图片上传失败');
      return;
    }
    ElMessage.success('图片上传成功');
    imageDialogVisible.value = false;
    selectedImage.value = null;
    await loadFacilityList();
  } catch (error) {
    console.error('图片上传失败:', error);
    ElMessage.error('图片上传失败');
  } finally {
    uploading.value = false;
  }
}

function handleDeleteImage() {
  if (!currentFacility.value?.id) {
    return;
  }

  ElMessageBox.confirm(`确定删除“${currentFacility.value.name || '该设施'}”的图片吗？`, '删除图片', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const result = await facilityAPI.deleteImage(currentFacility.value.id);
      if (result?.code !== 200) {
        ElMessage.error(result?.message || '图片删除失败');
        return;
      }
      ElMessage.success('图片已删除');
      imageDialogVisible.value = false;
      await loadFacilityList();
    })
    .catch(() => {});
}

function handleImageError(event) {
  if (!event?.target) {
    return;
  }
  event.target.style.display = 'none';
  const parent = event.target.parentElement;
  const fallback = parent?.querySelector('.no-image');
  if (fallback) {
    fallback.style.display = 'flex';
  }
}

function isValidImageUrl(url) {
  return Boolean(url) && !url.startsWith('blob:');
}

function triggerFileSelect() {
  fileInputRef.value?.click();
}

function handleFileInputChange(event) {
  const file = event.target?.files?.[0];
  if (file) {
    handleDialogImageSelect({ raw: file });
  }
}

function beforeDialogImageUpload(file) {
  return beforeImageUpload(file);
}

function handleDialogImageSelect(uploadFile) {
  if (!uploadFile?.raw) {
    return;
  }
  const file = uploadFile.raw;
  if (!beforeDialogImageUpload(file)) {
    return;
  }

  releasePreviewUrl(form.value.imageUrl);
  form.value.imageUrl = URL.createObjectURL(file);
  form.value._imageFile = file;
}

function removeImage() {
  releasePreviewUrl(form.value.imageUrl);
  form.value.imageUrl = null;
  form.value._imageFile = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function handleDialogClose() {
  releasePreviewUrl(form.value.imageUrl);
  if (dialogUploadRef.value) {
    dialogUploadRef.value.clearFiles();
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  selectedImage.value = null;
  form.value._imageFile = null;
}

function handleImageDialogClose() {
  releasePreviewUrl(currentFacility.value?.imageUrl);
  selectedImage.value = null;
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const payload = { ...form.value };
    const imageFile = payload._imageFile;
    delete payload._imageFile;

    if (payload.imageUrl?.startsWith?.('blob:')) {
      const oldRow = facilityList.value.find((item) => item.id === payload.id);
      payload.imageUrl = isEdit.value ? oldRow?.imageUrl || null : null;
    }

    let facilityId = payload.id;
    if (isEdit.value) {
      const result = await facilityAPI.update(payload.id, payload);
      if (result?.code && result.code !== 200) {
        ElMessage.error(result.message || '更新设施失败');
        return;
      }
      ElMessage.success('设施已更新');
    } else {
      const result = await facilityAPI.create(payload);
      if (result?.code && result.code !== 200) {
        ElMessage.error(result.message || '创建设施失败');
        return;
      }
      facilityId = result?.data?.id;
      ElMessage.success('设施已创建');
    }

    if (imageFile instanceof File && facilityId) {
      const uploadResponse = await facilityAPI.uploadImage(facilityId, imageFile);
      if (uploadResponse?.code !== 200) {
        ElMessage.warning(uploadResponse?.message || '设施已保存，但图片上传失败');
      }
    }

    dialogVisible.value = false;
    await loadFacilityList();
  } catch (error) {
    console.error('提交设施失败:', error);
    if (error?.response?.data?.message) {
      ElMessage.error(error.response.data.message);
      return;
    }
    ElMessage.error('提交设施失败，请稍后重试');
  }
}

function getStatusType(status) {
  const map = {
    AVAILABLE: 'success',
    MAINTENANCE: 'warning',
    DAMAGED: 'danger'
  };
  return map[status] || 'info';
}

function getStatusText(status) {
  const map = {
    AVAILABLE: '可用',
    MAINTENANCE: '维护中',
    DAMAGED: '损坏'
  };
  return map[status] || status || '未知状态';
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '￥-';
  }
  return `￥${amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
}

function formatFileSize(bytes) {
  if (!bytes) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 2)} ${units[index]}`;
}

function releasePreviewUrl(url) {
  if (url?.startsWith?.('blob:')) {
    URL.revokeObjectURL(url);
  }
}
</script>

<style scoped>
.facility-page {
  --theme-main: #69b6c4;
  --theme-deep: #3f8692;
  --theme-soft: rgba(186, 231, 238, 0.34);
  --theme-border: rgba(105, 182, 196, 0.16);
  --theme-shadow: rgba(32, 80, 88, 0.08);
  min-height: 100%;
  display: grid;
  gap: 20px;
  color: #234047;
  background:
    radial-gradient(circle at 92% 10%, rgba(218, 243, 247, 0.78), transparent 22%),
    linear-gradient(180deg, #f8fcfd 0%, #f3fafb 48%, #f0f8fa 100%);
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
  background: linear-gradient(145deg, rgba(243, 252, 253, 0.98) 0%, #ffffff 68%);
}

.page-hero::before {
  content: '';
  position: absolute;
  top: -88px;
  right: -52px;
  width: 250px;
  height: 250px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(174, 224, 232, 0.3) 0%, rgba(174, 224, 232, 0.08) 44%, transparent 72%);
  pointer-events: none;
}

.hero-copy,
.hero-side {
  position: relative;
  z-index: 1;
}

.hero-eyebrow,
.dialog-eyebrow,
.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(174, 224, 232, 0.22);
  color: #4d7f88;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-copy h2 {
  margin: 14px 0 10px;
  color: #153940;
}

.hero-copy h1 {
  font-size: 34px;
}

.hero-copy p,
.section-copy p,
.info-stack small,
.facility-copy span,
.facility-copy small,
.summary-card p,
.hero-note span,
.hero-note small,
.summary-label,
.muted-text {
  margin: 0;
  color: #6c858a;
  line-height: 1.8;
}

.hero-actions,
.control-actions,
.panel-meta,
.row-actions,
.image-actions,
.dialog-footer,
.image-dialog-head {
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
  background: linear-gradient(135deg, #69b6c4 0%, #3f8692 100%);
  box-shadow: 0 14px 28px rgba(63, 134, 146, 0.22);
}

.secondary-btn {
  border: 1px solid rgba(105, 182, 196, 0.2);
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
  background: linear-gradient(180deg, #f7fcfd 0%, #ffffff 100%);
}

.hero-note strong,
.summary-card strong,
.facility-copy strong,
.info-stack strong,
.price-text,
.upload-title,
.image-dialog-head h3 {
  color: #173d44;
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
  box-shadow: 0 24px 44px rgba(32, 80, 88, 0.1);
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
  background: rgba(240, 247, 249, 0.94);
}

.facility-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.facility-image {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e5f6f8 0%, #d9f0f4 100%);
  border: 1px solid rgba(105, 182, 196, 0.16);
  flex-shrink: 0;
}

.facility-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6ca0aa;
  font-size: 24px;
}

.facility-copy,
.info-stack {
  display: grid;
  gap: 4px;
}

.soft-tag {
  border: none;
  background: rgba(174, 224, 232, 0.24);
  color: #4a8088;
}

.status-tag {
  border: none;
  gap: 6px;
}

.price-text {
  font-weight: 700;
}

.row-actions {
  justify-content: center;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.editor-form,
.image-upload-container {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-tip {
  margin-top: 6px;
  color: #6d858a;
  font-size: 12px;
  line-height: 1.6;
}

.image-upload-section {
  width: 100%;
}

.current-image-preview {
  padding: 20px;
  text-align: center;
  border-radius: 22px;
  background: #f7fcfd;
  border: 1px dashed rgba(105, 182, 196, 0.26);
}

.facility-preview-image {
  max-width: 100%;
  max-height: 220px;
  border-radius: 16px;
  object-fit: contain;
  box-shadow: 0 12px 26px rgba(32, 80, 88, 0.12);
}

.image-actions {
  justify-content: center;
  margin-top: 16px;
}

.dialog-image-uploader {
  width: 100%;
}

.dialog-image-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  border-radius: 22px;
  border: 1px dashed rgba(105, 182, 196, 0.28);
  background: #f8fcfd;
}

.upload-icon {
  font-size: 46px;
  color: #6ca0aa;
  margin-bottom: 12px;
}

.upload-text {
  color: #5b757b;
}

.upload-hint,
.selected-image-info p,
.image-status {
  color: #72878d;
}

.image-dialog-head {
  justify-content: space-between;
}

.image-dialog-head h3 {
  margin: 10px 0 0;
  font-size: 24px;
}

.image-status {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(174, 224, 232, 0.18);
  font-size: 12px;
  font-weight: 600;
}

.current-image,
.no-image-placeholder {
  min-height: 260px;
  border-radius: 24px;
  background: #f7fcfd;
  border: 1px solid rgba(105, 182, 196, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 320px;
  border-radius: 20px;
  box-shadow: 0 16px 30px rgba(32, 80, 88, 0.12);
}

.no-image-placeholder {
  flex-direction: column;
  gap: 12px;
  color: #6ca0aa;
}

.no-image-placeholder .el-icon {
  font-size: 44px;
}

.selected-image-info {
  padding: 16px 18px;
  border-radius: 18px;
  background: #f8fcfd;
}

.selected-image-info p {
  margin: 0;
}

.facility-page :deep(.el-input__wrapper),
.facility-page :deep(.el-select__wrapper),
.facility-page :deep(.el-textarea__inner),
.facility-page :deep(.el-date-editor.el-input__wrapper),
.facility-page :deep(.el-input-number .el-input__wrapper) {
  border-radius: 14px;
  background: #f9fcfd;
  box-shadow: none;
  border: 1px solid rgba(105, 182, 196, 0.18);
}

.facility-page :deep(.el-table) {
  --el-table-border-color: rgba(105, 182, 196, 0.12);
  --el-table-header-bg-color: #f5fbfc;
  --el-table-row-hover-bg-color: #f6fbfc;
  border-radius: 20px;
  overflow: hidden;
}

.facility-page :deep(.el-table::before),
.facility-page :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.facility-page :deep(.el-dialog) {
  border-radius: 30px;
  overflow: hidden;
}

.facility-page :deep(.el-dialog__header) {
  margin: 0;
  padding: 22px 24px 10px;
  background: linear-gradient(145deg, #f4fbfc 0%, #ffffff 100%);
}

.facility-page :deep(.el-dialog__body) {
  padding: 16px 24px 18px;
  background: #fcfeff;
}

.facility-page :deep(.el-dialog__footer) {
  padding: 0 24px 24px;
  background: #fcfeff;
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
  .facility-page {
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

  .panel-head,
  .image-dialog-head {
    flex-direction: column;
    align-items: flex-start;
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
