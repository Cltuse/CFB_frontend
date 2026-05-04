<template>
  <div class="facility-detail-page">
    <section class="hero-card">
      <div class="hero-top">
        <el-button class="back-btn" @click="goBack">返回设施列表</el-button>
        <el-tag v-if="facility" :type="getStatusType(facility.status)" effect="light" round class="status-tag">
          {{ getStatusText(facility.status) }}
        </el-tag>
      </div>

      <div v-if="facility" class="hero-content">
        <div class="hero-copy">
          <span class="hero-kicker">设施预约详情</span>
          <h1>{{ facility.name }}</h1>
          <p>{{ facility.description || '这里展示设施的详细信息、近几天的预约占用情况，以及预约操作入口。' }}</p>
          <div class="hero-actions">
            <el-button type="primary" class="primary-btn" :disabled="facility.status !== 'AVAILABLE'" @click="handleReserve">
              立即预约
            </el-button>
            <el-button class="secondary-btn" @click="scrollToTimeline">查看预约时间轴</el-button>
          </div>
        </div>

        <div class="hero-media">
          <img v-if="facility.imageUrl" :src="facility.imageUrl" :alt="facility.name" class="hero-image" />
          <div v-else class="hero-fallback">设施</div>
        </div>
      </div>

      <div v-else class="hero-empty">
        <h1>设施详情</h1>
        <p>正在获取设施信息...</p>
      </div>
    </section>

    <section v-if="loading" class="loading-card">
      <el-icon class="is-loading loading-icon"><Loading /></el-icon>
      <p>正在加载设施详情和预约占用情况...</p>
    </section>

    <template v-else-if="facility">
      <section class="summary-grid">
        <article class="summary-card">
          <span class="summary-label">设施类别</span>
          <strong>{{ facility.category || '未分类' }}</strong>
          <p>当前设施所属类别</p>
        </article>
        <article class="summary-card">
          <span class="summary-label">未来 {{ queryDays }} 天预约数</span>
          <strong>{{ reservations.length }}</strong>
          <p>统计接口返回的近期预约记录</p>
        </article>
        <article class="summary-card">
          <span class="summary-label">可预约状态</span>
          <strong>{{ facility.status === 'AVAILABLE' ? '可预约' : '暂不可约' }}</strong>
          <p>维护中或损坏时会禁用提交按钮</p>
        </article>
        <article class="summary-card">
          <span class="summary-label">型号信息</span>
          <strong>{{ facility.model || '未填写' }}</strong>
          <p>用于快速识别具体设施型号</p>
        </article>
      </section>

      <section class="content-grid">
        <article class="info-card">
          <div class="section-head">
            <h2>基础信息</h2>
            <p>用更清晰的资料卡展示设施参数与说明。</p>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>设施名称</label>
              <strong>{{ facility.name }}</strong>
            </div>
            <div class="info-item">
              <label>设施型号</label>
              <strong>{{ facility.model || '未填写' }}</strong>
            </div>
            <div class="info-item">
              <label>设施类别</label>
              <strong>{{ facility.category || '未分类' }}</strong>
            </div>
            <div class="info-item">
              <label>存放位置</label>
              <strong>{{ facility.location || '未填写' }}</strong>
            </div>
            <div class="info-item">
              <label>购买日期</label>
              <strong>{{ facility.purchaseDate || '未填写' }}</strong>
            </div>
            <div class="info-item">
              <label>参考价格</label>
              <strong>{{ formatPrice(facility.price) }}</strong>
            </div>
          </div>

          <div class="description-box">
            <h3>详细描述</h3>
            <p>{{ facility.description || '暂无设施详细说明。' }}</p>
          </div>

          <div class="rule-section">
            <div class="section-head compact-head">
              <h2>棰勭害瑙勫垯</h2>
              <p>鍦ㄦ彁浜ら绾﹀墠锛屽厛鐪嬫竻鏃堕棿銆佹椂闀垮拰瀹℃壒瑕佹眰锛屽彲浠ュ噺灏戞棤鏁堢敵璇枫€?</p>
            </div>

            <div v-if="ruleConfigLoading" class="rule-loading">姝ｅ湪鍔犺浇璁炬柦瑙勫垯...</div>
            <div v-else-if="currentRuleConfig" class="rule-grid">
              <article class="rule-item">
                <span>閫傜敤瑙勫垯</span>
                <strong>{{ currentRuleConfig.categoryName || facility.category || '鍏ㄥ眬榛樿' }}</strong>
              </article>
              <article class="rule-item">
                <span>寮€鏀炬椂娈?</span>
                <strong>{{ formatRuleTime(currentRuleConfig.openTime) }} - {{ formatRuleTime(currentRuleConfig.closeTime) }}</strong>
              </article>
              <article class="rule-item">
                <span>鍙绾︽椂闀?</span>
                <strong>{{ formatMinutes(currentRuleConfig.minDurationMinutes) }} - {{ formatMinutes(currentRuleConfig.maxDurationMinutes) }}</strong>
              </article>
              <article class="rule-item">
                <span>鏃堕棿绮掑害</span>
                <strong>{{ formatMinutes(currentRuleConfig.timeSlotMinutes) }}</strong>
              </article>
              <article class="rule-item">
                <span>鎻愬墠棰勭害</span>
                <strong>鏈€澶?{{ currentRuleConfig.advanceDaysMax }} 澶?</strong>
              </article>
              <article class="rule-item">
                <span>鍙栨秷鎴</span>
                <strong>寮€濮嬪墠 {{ formatMinutes(currentRuleConfig.cancelDeadlineMinutes) }}</strong>
              </article>
              <article class="rule-item">
                <span>褰撳ぉ棰勭害</span>
                <strong>{{ currentRuleConfig.allowSameDayBooking ? '鍏佽' : '涓嶅厑璁?' }}</strong>
              </article>
              <article class="rule-item">
                <span>瀹℃壒瑕佹眰</span>
                <strong>{{ currentRuleConfig.needApproval ? '闇€瑕佺鐞嗗憳瀹℃壒' : '鏃犻渶棰濆瀹℃壒' }}</strong>
              </article>
            </div>
            <p v-else class="rule-empty">褰撳墠鏆傛湭閰嶇疆鐗规畩棰勭害瑙勫垯锛屽彲鎸夌郴缁熼粯璁よ姹傚畨鎺掗绾︺€?</p>
          </div>
        </article>

        <article ref="timelineSection" class="timeline-card">
          <div class="section-head">
            <h2>未来 {{ queryDays }} 天占用时间轴</h2>
            <p>灰色表示已被预约，绿色表示空闲，方便快速判断可选时间段。</p>
          </div>

          <div class="timeline-container">
            <div v-for="day in timelineDays" :key="day.date" class="timeline-day">
              <div class="day-head">
                <strong>{{ day.dateStr }}</strong>
                <span>{{ day.weekDay }}</span>
              </div>

              <div class="slot-list">
                <div
                  v-for="slot in day.slots"
                  :key="slot.time"
                  class="time-slot"
                  :class="slot.occupied ? 'slot-occupied' : 'slot-available'"
                >
                  <span class="slot-time">{{ slot.time }}</span>
                  <div class="slot-state">
                    <span>{{ slot.occupied ? '已预约' : '空闲' }}</span>
                    <el-tooltip
                      v-if="slot.reservation"
                      :content="`${slot.reservation.startTime} - ${slot.reservation.endTime} | 预约人：${slot.reservation.userName || '未知'} | 用途：${slot.reservation.purpose || '未填写'}`"
                      placement="top"
                    >
                      <span class="slot-detail">详情</span>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </template>

    <section v-else class="empty-card">
      <h2>未找到设施</h2>
      <p>你访问的设施不存在，或已经被删除。</p>
      <el-button type="primary" class="primary-btn" @click="goBack">返回设施列表</el-button>
    </section>

    <el-dialog v-model="dialogVisible" width="620px" class="reserve-dialog" :show-close="false">
      <div class="dialog-header">
        <span class="dialog-kicker">提交预约</span>
        <h3>{{ facility?.name || '设施预约' }}</h3>
      </div>

      <div class="dialog-body">
        <div class="dialog-facility-card">
          <strong>{{ facility?.name }}</strong>
          <span>{{ facility?.model || '未填写型号' }} · {{ facility?.location || '未填写位置' }}</span>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <div class="form-grid">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="选择开始日期时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm"
                :disabled-date="disabledStartDate"
                @change="checkAvailability"
              />
            </el-form-item>
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择结束日期时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm"
                :disabled-date="disabledEndDate"
                @change="checkAvailability"
              />
            </el-form-item>
          </div>

          <el-form-item label="使用目的" prop="purpose">
            <el-input
              v-model="form.purpose"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              placeholder="请简要描述使用目的和活动内容"
            />
          </el-form-item>

          <div v-if="form.startTime && form.endTime" class="availability-bar" :class="isTimeAvailable ? 'available' : 'unavailable'">
            <span v-if="checkingAvailability">正在检查时间可用性...</span>
            <span v-else>{{ availabilityMessage || '请继续填写预约信息' }}</span>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" :disabled="!isTimeAvailable || checkingAvailability" @click="handleSubmit">
            提交预约
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { facilityAPI, reservationAPI, userClientAPI } from '../../api';
import { normalizeUserMessage } from '../../utils/messageText';
import { findApplicableRuleConfig, formatMinutes, formatRuleTime } from '../../utils/facilityRules';

const route = useRoute();
const router = useRouter();

const facility = ref(null);
const reservations = ref([]);
const ruleConfigs = ref([]);
const queryDays = ref(7);
const loading = ref(true);
const ruleConfigLoading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const timelineSection = ref(null);
const userInfo = ref({});
const checkingAvailability = ref(false);
const isTimeAvailable = ref(true);
const availabilityMessage = ref('');
const currentRuleConfig = computed(() => findApplicableRuleConfig(ruleConfigs.value, facility.value?.category));

const form = ref({
  facilityId: null,
  userId: null,
  startTime: '',
  endTime: '',
  purpose: ''
});

const checkAvailability = async () => {
  if (!form.value.startTime || !form.value.endTime || !form.value.facilityId) {
    isTimeAvailable.value = true;
    availabilityMessage.value = '';
    return;
  }

  try {
    checkingAvailability.value = true;
    const response = await reservationAPI.checkAvailability(
      form.value.facilityId,
      form.value.startTime,
      form.value.endTime
    );
    if (response.data) {
      isTimeAvailable.value = response.data.available;
      availabilityMessage.value = normalizeUserMessage(
        response.data.message,
        response.data.available ? '当前时间段可以预约。' : '当前时间段已被占用，请重新选择。'
      );
    }
  } catch (error) {
    console.error('检查可用性失败:', error);
    isTimeAvailable.value = true;
    availabilityMessage.value = '';
  } finally {
    checkingAvailability.value = false;
  }
};

function validateStartTime(rule, value, callback) {
  if (!value) {
    callback(new Error('请选择开始时间'));
    return;
  }
  const startDate = new Date(value);
  if (startDate < new Date()) {
    callback(new Error('开始时间不能早于当前时间'));
    return;
  }
  callback();
}

function validateEndTime(rule, value, callback) {
  if (!value) {
    callback(new Error('请选择结束时间'));
    return;
  }
  const endDate = new Date(value);
  const startDate = new Date(form.value.startTime);
  if (form.value.startTime && endDate <= startDate) {
    callback(new Error('结束时间必须晚于开始时间'));
    return;
  }
  callback();
}

const rules = {
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' },
    { validator: validateStartTime, trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    { validator: validateEndTime, trigger: 'change' }
  ],
  purpose: [{ required: true, message: '请输入使用目的', trigger: 'blur' }]
};

const disabledStartDate = (time) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
};

const disabledEndDate = (time) => {
  if (!form.value.startTime) return false;
  const startDate = new Date(form.value.startTime);
  startDate.setHours(0, 0, 0, 0);
  return time.getTime() < startDate.getTime();
};

const timelineDays = computed(() => {
  const days = [];
  const now = new Date();
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  for (let i = 0; i < queryDays.value; i += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    const slots = hours.map((hour) => {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      const reservation = reservations.value.find((item) => {
        const reservationStart = new Date(item.startTime);
        const reservationEnd = new Date(item.endTime);
        return reservationStart < slotEnd && reservationEnd > slotStart;
      });

      return {
        time: `${hour}:00`,
        occupied: Boolean(reservation),
        reservation
      };
    });

    days.push({
      date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      dateStr: `${date.getMonth() + 1}-${date.getDate()}`,
      weekDay: weekDays[date.getDay()],
      slots
    });
  }

  return days;
});

const loadRuleConfigs = async () => {
  try {
    ruleConfigLoading.value = true;
    const res = await userClientAPI.getAllRuleConfigs();
    ruleConfigs.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    ruleConfigs.value = [];
  } finally {
    ruleConfigLoading.value = false;
  }
};

const loadFacilityDetail = async () => {
  try {
    loading.value = true;
    const res = await facilityAPI.getDetail(route.params.id, queryDays.value);
    if (res.code === 200) {
      facility.value = res.data.facility;
      reservations.value = res.data.reservations || [];
      return;
    }
    ElMessage.error(normalizeUserMessage(res.message, '设施详情加载失败，请稍后重试。'));
  } catch (error) {
    console.error('加载设施详情失败:', error);
    ElMessage.error('设施详情加载失败，请稍后重试。');
  } finally {
    loading.value = false;
  }
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return '鏈～鍐?';
  }

  return `￥${value}`;
};

const getStatusType = (status) => {
  const map = {
    AVAILABLE: 'success',
    MAINTENANCE: 'warning',
    DAMAGED: 'danger'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    AVAILABLE: '可用',
    MAINTENANCE: '维护中',
    DAMAGED: '已损坏'
  };
  return map[status] || status;
};

const goBack = () => {
  router.push('/user/facility');
};

const scrollToTimeline = () => {
  timelineSection.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
};

const handleReserve = async () => {
  if (!facility.value) return;

  form.value = {
    facilityId: facility.value.id,
    userId: userInfo.value.id,
    startTime: '',
    endTime: '',
    purpose: ''
  };
  isTimeAvailable.value = true;
  availabilityMessage.value = '';
  dialogVisible.value = true;
  await nextTick();
  formRef.value?.clearValidate();
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    const response = await reservationAPI.create(form.value);
    ElMessage.success(normalizeUserMessage(response.message, '预约提交成功。'));
    dialogVisible.value = false;
    loadFacilityDetail();
  } catch (error) {
    console.error('预约失败:', error);
    ElMessage.error(
      normalizeUserMessage(error.response?.data?.message, '预约提交失败，请稍后重试。')
    );
  }
};

onMounted(() => {
  const info = localStorage.getItem('userInfo');
  if (info) {
    userInfo.value = JSON.parse(info);
  }
  loadFacilityDetail();
  loadRuleConfigs();
});
</script>

<style scoped>
.facility-detail-page {
  --page-primary: #f5b7c0;
  min-height: 100%;
  display: grid;
  gap: 20px;
  background:
    radial-gradient(circle at top left, rgba(245, 183, 192, 0.34), transparent 28%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.hero-card,
.summary-card,
.info-card,
.timeline-card,
.loading-card,
.empty-card {
  border-radius: 30px;
  border: 1px solid rgba(245, 183, 192, 0.14);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 42px rgba(94, 52, 62, 0.05);
}

.hero-card {
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(245, 183, 192, 0.3), transparent 24%),
    linear-gradient(145deg, rgba(245, 183, 192, 0.16) 0%, #ffffff 64%);
}

.hero-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn,
.primary-btn,
.secondary-btn {
  min-height: 44px;
  border-radius: 14px;
}

.back-btn,
.secondary-btn {
  border: 1px solid rgba(245, 183, 192, 0.18);
  background: #ffffff;
  color: #c4677a;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #f5b7c0 0%, #e8909d 100%);
  box-shadow: 0 14px 28px rgba(232, 144, 157, 0.18);
}

.hero-content {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 340px;
  gap: 22px;
  align-items: center;
}

.hero-kicker,
.dialog-kicker {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(245, 183, 192, 0.14);
  color: #c4677a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 16px 0 10px;
  font-size: 36px;
  color: #7a4052;
}

.hero-copy p,
.hero-empty p {
  margin: 0;
  color: #8a6a76;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.hero-media {
  min-height: 260px;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(145deg, #fef8f9 0%, #fef0f2 100%);
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #c4677a;
  font-size: 36px;
  font-weight: 700;
}

.hero-empty {
  padding: 18px 6px 6px;
}

.hero-empty h1 {
  margin: 0 0 10px;
  color: #223b6a;
}

.loading-card,
.empty-card {
  min-height: 260px;
  padding: 24px;
  display: grid;
  place-items: center;
  text-align: center;
}

.loading-icon {
  font-size: 32px;
  color: #e8909d;
  margin-bottom: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 22px 20px;
  background: linear-gradient(145deg, rgba(245, 183, 192, 0.16), #ffffff 82%);
}

.summary-label {
  display: block;
  color: #8e717b;
  font-size: 13px;
}

.summary-card strong {
  display: block;
  margin: 12px 0 8px;
  color: #7a4052;
  font-size: 30px;
  line-height: 1.1;
}

.summary-card p {
  margin: 0;
  color: #8e717b;
  line-height: 1.6;
}

.content-grid {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 20px;
}

.info-card,
.timeline-card {
  padding: 24px;
}

.section-head {
  margin-bottom: 18px;
}

.section-head h2 {
  margin: 0;
  color: #233d69;
}

.section-head p {
  margin: 8px 0 0;
  color: #7284a1;
  line-height: 1.7;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  padding: 16px 18px;
  border-radius: 20px;
  background: #f8fbff;
  border: 1px solid rgba(126, 167, 255, 0.12);
}

.info-item label {
  display: block;
  color: #7c8ca9;
  font-size: 12px;
}

.info-item strong {
  display: block;
  margin-top: 8px;
  color: #24406d;
  line-height: 1.6;
}

.description-box {
  margin-top: 16px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(240, 245, 255, 0.8);
}

.description-box h3 {
  margin: 0 0 10px;
  color: #24406d;
}

.description-box p {
  margin: 0;
  color: #6e809f;
  line-height: 1.8;
}

.compact-head {
  margin-bottom: 14px;
}

.rule-section {
  margin-top: 16px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(248, 251, 255, 0.94);
  border: 1px solid rgba(126, 167, 255, 0.12);
}

.rule-loading,
.rule-empty {
  margin: 0;
  color: #6e809f;
  line-height: 1.8;
}

.rule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.rule-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(126, 167, 255, 0.12);
}

.rule-item span {
  display: block;
  color: #7c8ca9;
  font-size: 12px;
}

.rule-item strong {
  display: block;
  margin-top: 8px;
  color: #24406d;
  line-height: 1.6;
}

.timeline-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.timeline-day {
  min-width: 180px;
  border-radius: 22px;
  overflow: hidden;
  background: #f8fbff;
  border: 1px solid rgba(126, 167, 255, 0.12);
}

.day-head {
  padding: 14px 16px;
  background: rgba(196, 215, 255, 0.24);
  display: grid;
  gap: 4px;
}

.day-head strong {
  color: #25426f;
}

.day-head span {
  color: #6f82a0;
  font-size: 13px;
}

.slot-list {
  display: grid;
  gap: 8px;
  padding: 12px;
}

.time-slot {
  padding: 10px 12px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.slot-available {
  background: linear-gradient(135deg, #eefcf5 0%, #dcf7e8 100%);
  border: 1px solid #b7e8cb;
}

.slot-occupied {
  background: linear-gradient(135deg, #f2f4f8 0%, #e6ebf3 100%);
  border: 1px solid #d5dce8;
}

.slot-time {
  color: #28426d;
  font-weight: 600;
}

.slot-state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #7082a2;
}

.slot-detail {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(126, 167, 255, 0.12);
  color: #5572b1;
  cursor: pointer;
}

.facility-detail-page :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.facility-detail-page :deep(.el-dialog__header) {
  display: none;
}

.dialog-header {
  padding: 26px 28px 12px;
  background:
    radial-gradient(circle at top right, rgba(196, 215, 255, 0.28), transparent 24%),
    linear-gradient(145deg, rgba(196, 215, 255, 0.16) 0%, #ffffff 64%);
}

.dialog-header h3 {
  margin: 14px 0 0;
  color: #233d69;
  font-size: 26px;
}

.dialog-body {
  padding: 20px 28px 8px;
}

.dialog-facility-card {
  padding: 18px;
  margin-bottom: 18px;
  border-radius: 22px;
  background: #f8fbff;
  display: grid;
  gap: 6px;
}

.dialog-facility-card strong {
  color: #24406c;
}

.dialog-facility-card span {
  color: #7689a8;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.facility-detail-page :deep(.el-input__wrapper),
.facility-detail-page :deep(.el-textarea__inner),
.facility-detail-page :deep(.el-date-editor.el-input__wrapper) {
  border-radius: 16px;
  box-shadow: none;
  background: #fbfdff;
  border: 1px solid rgba(126, 167, 255, 0.18);
}

.availability-bar {
  padding: 14px 16px;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 500;
}

.availability-bar.available {
  background: rgba(214, 244, 228, 0.74);
  color: #2d7e58;
}

.availability-bar.unavailable {
  background: rgba(255, 232, 228, 0.74);
  color: #b35345;
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

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero-content,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .rule-grid {
    grid-template-columns: 1fr;
  }

  .hero-card,
  .info-card,
  .timeline-card,
  .loading-card,
  .empty-card,
  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .hero-top,
  .hero-actions,
  .dialog-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-copy h1 {
    font-size: 28px;
  }
}
</style>
<style scoped>
.facility-detail-page {
  --theme-deep: #e8909d;
  --theme-border: rgba(245, 183, 192, 0.16);
  --theme-shadow: rgba(94, 52, 62, 0.08);
  background:
    radial-gradient(circle at top left, rgba(245, 183, 192, 0.4), transparent 28%),
    radial-gradient(circle at right center, rgba(252, 228, 232, 0.96), transparent 24%),
    linear-gradient(180deg, #fffafb 0%, #fffdfd 100%);
}

.hero-card,
.summary-card,
.info-card,
.timeline-card,
.loading-card,
.empty-card {
  animation: detail-rise 0.55s ease both;
  border-color: var(--theme-border);
  box-shadow: 0 20px 46px var(--theme-shadow);
}

.hero-card {
  background:
    radial-gradient(circle at top right, rgba(245, 183, 192, 0.34), transparent 24%),
    linear-gradient(145deg, rgba(254, 248, 249, 0.96) 0%, #ffffff 64%);
}

.summary-card {
  background: linear-gradient(150deg, rgba(254, 248, 249, 0.96), #ffffff 82%);
}

.info-card,
.timeline-card {
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.info-card:hover,
.timeline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 52px rgba(94, 52, 62, 0.1);
}

.hero-media {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.timeline-day {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.timeline-day:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(232, 144, 157, 0.12);
}

.time-slot {
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.time-slot:hover {
  transform: translateX(2px);
}

.facility-detail-page :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

@keyframes detail-rise {
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
