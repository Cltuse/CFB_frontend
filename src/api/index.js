import request from '../utils/request';

// 用户相关API
export const userAPI = {
    login: (data) => request.post('/user/login', data),
    register: (data) => request.post('/user/register', data),
    updateProfile: (data) => request.put('/user/me', data),
    list: (params) => request.get('/user/list', { params }),
    getReportableUsers: () => request.get('/user/reportable-list'),
    getById: (id) => request.get(`/user/${id}`),
    create: (data) => request.post('/user', data),
    update: (id, data) => request.put(`/user/${id}`, data),
    changePassword: (id, data) => request.post(`/user/${id}/change-password`, data),
    delete: (id) => request.delete(`/user/${id}`),
    searchUsers: (keyword) => request.get('/user/search', { params: { keyword } }),
    listMaintainers: () => request.get('/user/maintainers')
};

// 反馈相关API
export const feedbackAPI = {
    // 获取反馈列表
    getFeedbacks: (page = 0, size = 10) => 
        request.get('/feedback/list', { 
            params: { page, size } 
        }),
    
    // 获取反馈详情
    getFeedbackDetail: (id) => 
        request.get(`/feedback/${id}`),
    
    // 回复反馈
    replyFeedback: (id, data) => request.post(`/feedback/${id}/reply`, null, {
        params: {
            reply: data.replyContent
        }
    }),
    updateFeedbackStatus: (id, status) =>
        request.put(`/feedback/${id}/status`, null, { params: { status } }),
    
    // 删除反馈
    deleteFeedback: (id) => 
        request.delete(`/feedback/${id}`)
};

// 设施相关API
export const facilityAPI = {
    list: () => request.get('/facility/list'),
    available: () => request.get('/facility/available'),
    getById: (id) => request.get(`/facility/${id}`),
    getDetail: (id, days = 7) => request.get(`/facility/${id}/detail`, { params: { days } }),
    search: (keyword) => request.get('/facility/search', { params: { keyword } }),
    // 分页查询设施列表
    listPage: (params) => request.get('/facility/listPage', { params }),
    searchPage: (keyword, params) => request.get('/facility/searchPage', {
        params: { keyword, ...params }
    }),
    create: (data) => request.post('/facility', data),
    createWithImage: (data, imageFile) => {
        const formData = new FormData();
        formData.append('facility', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        if (imageFile) {
            formData.append('image', imageFile);
        }
        return request.post('/facility', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    update: (id, data) => request.put(`/facility/${id}`, data),
    updateStatus: (id, status) => request.put(`/facility/${id}/status`, { status }),
    delete: (id) => request.delete(`/facility/${id}`),
    // 上传设施图片
    uploadImage: (idOrFile, file) => {
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            return request.post(`/facility/${idOrFile}/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } else {
            const formData = new FormData();
            formData.append('file', idOrFile);
            return request.post('/file/upload/facility', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        }
    },
    deleteImage: (id) => request.delete(`/facility/${id}/image`)
};

// 预约相关API
export const reservationAPI = {
    list: () => request.get('/reservation/list'),
    search: (keyword) => request.get('/reservation/search', { params: { keyword } }),
    searchPage: (keyword, params) => request.get('/reservation/search/page', {
        params: { keyword, ...params }
    }),
    getByUserId: (userId) => request.get(`/reservation/user/${userId}`),
    getPending: () => request.get('/reservation/pending'),
    getById: (id) => request.get(`/reservation/${id}`),
    create: (data) => request.post('/reservation', data),
    update: (id, data) => request.put(`/reservation/${id}`, data),
    approve: (id, data) => request.put(`/reservation/${id}/approve`, data),
    reject: (id, data) => request.put(`/reservation/${id}/reject`, data),
    cancel: (id) => request.put(`/reservation/${id}/cancel`),
    complete: (id) => request.put(`/reservation/${id}/complete`),
    delete: (id) => request.delete(`/reservation/${id}`),
    getStatsByTimeRange: (range) => request.get('/reservation/stats/time-range', { params: { range } }),
    getCategoryStats: (range) => request.get('/reservation/stats/category', { params: { range } }),
    // 检查入
    checkin: (id) => request.put(`/reservation/${id}/checkin`),
    checkout: (id) => request.put(`/reservation/${id}/checkout`),
    verify: (id, verificationCode) => request.put(`/reservation/${id}/verify`, null, { params: { verificationCode } }),
    getVerificationCode: (id) => request.get(`/reservation/${id}/verification-code`),
    checkAvailability: (facilityId, startTime, endTime) => request.get('/reservation/availability', {
        params: { facilityId, startTime, endTime }
    })
};

// 维护相关API
export const maintenanceAPI = {
    list: () => request.get('/maintenance/list'),
    getByfacilityId: (facilityId) => request.get(`/maintenance/facility/${facilityId}`),
    getByMaintainerId: (maintainerId) => request.get(`/maintenance/maintainer/${maintainerId}`),
    getById: (id) => request.get(`/maintenance/${id}`),
    create: (data) => request.post('/maintenance', data),
    update: (id, data) => request.put(`/maintenance/${id}`, data),
    complete: (id, data) => request.put(`/maintenance/${id}/complete`, data),
    delete: (id) => request.delete(`/maintenance/${id}`),
    getStatsByTimeRange: (range) => request.get('/maintenance/stats/time-range', { params: { range } }),
    getTypeDistribution: (range) => request.get('/maintenance/stats/type-distribution', { params: { range } }),
    getDurationStats: (range) => request.get('/maintenance/stats/duration', { params: { range } }),
    getFacilityFaultStats: (range) => request.get('/maintenance/stats/facility-faults', { params: { range } }),
    getSummaryStats: () => request.get('/maintenance/stats/summary')
};

// 通知相关API
export const noticeAPI = {
    list: (params) => request.get('/notice/list', { params }),
    published: () => request.get('/notice/published'),
    getById: (id) => request.get(`/notice/${id}`),
    create: (data) => request.post('/notice', data),
    update: (id, data) => request.put(`/notice/${id}`, data),
    delete: (id) => request.delete(`/notice/${id}`)
};

// 设施分类相关API
export const facilityCategoryAPI = {
    list: () => request.get('/facility-category/list'),
    active: () => request.get('/facility-category/active'),
    getById: (id) => request.get(`/facility-category/${id}`),
    create: (data) => request.post('/facility-category', data),
    update: (id, data) => request.put(`/facility-category/${id}`, data),
    delete: (id) => request.delete(`/facility-category/${id}`),
    toggleStatus: (id) => request.put(`/facility-category/${id}/toggle-status`),
    // 分页查询设施分类列表
    search: (keyword) => request.get('/facility-category/search', { params: { keyword } }),
    searchByName: (keyword) => request.get('/facility-category/search/name', { params: { keyword } }),
    // 分页查询设施分类列表
    listPage: (params) => request.get('/facility-category/page', { params }),
    searchPage: (keyword, params) => request.get('/facility-category/search/page', {
        params: { keyword, ...params }
    }),
    searchByNamePage: (keyword, params) => request.get('/facility-category/search/name/page', {
        params: { keyword, ...params }
    }),
    listByStatusPage: (status, params) => request.get('/facility-category/status/page', {
        params: { status, ...params }
    })
};

// 文件上传下载API
export const fileAPI = {
    uploadFacilityImage: (facilityId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request.post(`/facility/${facilityId}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    uploadAvatar: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request.post('/file/upload/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    deleteFile: (fileUrl) => request.delete('/file/delete', { params: { fileUrl } })
};

// 管理员相关API
export const adminAPI = {
    // 获取预约规则配置
    getRuleConfigs: () => request.get('/admin/rule-configs'),
    getRuleConfigHistory: (categoryId) => request.get('/admin/rule-configs/history', { params: { categoryId } }),
    createRuleConfig: (data) => request.post('/admin/rule-configs', data),
    getRuleConfigById: (id) => request.get(`/admin/rule-configs/${id}`),
    
    // 获取黑名单列表
    getBlacklist: (params) => request.get('/admin/blacklist', { params }),
    getBlacklistStats: () => request.get('/admin/blacklist/stats'),
    addToBlacklist: (data) => request.post('/admin/blacklist', data),
    removeFromBlacklist: (id) => request.put(`/admin/blacklist/${id}/remove`),
    autoExpireBlacklist: () => request.put('/admin/blacklist/auto-expire'),
    
    // 获取操作日志列表
    getOperationLogs: (params) => request.get('/admin/operation-logs', { params }),
    getOperationLogById: (id) => request.get(`/admin/operation-logs/${id}`),
    getOperationTypes: () => request.get('/admin/operation-logs/types'),
    
    // 分页查询用户列表
    searchUsers: (keyword) => request.get('/user/search', { params: { keyword } }),
    
    // 分页查询违规记录列表
    getAllViolations: (page = 0, size = 10, userName = '', violationType = '', status = '') => 
        request.get('/violation/all', { params: { page, size, userName, violationType, status } }),
    recordViolation: (data) => request.post('/violation/record', data),
    approveViolation: (id, remark) => request.post(`/violation/${id}/approve`, null, {
        params: { remark }
    }),
    rejectViolation: (id, remark) => request.post(`/violation/${id}/reject`, null, {
        params: { remark }
    }),
    revokeViolation: (id, remark) => request.post(`/violation/${id}/revoke`, null, {
        params: { remark }
    }),
    updateViolationStatus: (id, status) => request.put(`/violation/${id}/status`, null, {
        params: { status }
    }),
    
    // 获取统计信息
    getDashboardStats: () => request.get('/admin/stats/dashboard'),
    getUserStats: () => request.get('/admin/stats/users'),
    getReservationStats: () => request.get('/admin/reservation-stats'),
    getReservationTrends: () => request.get('/admin/reservation-trends'),
    getFacilityStats: () => request.get('/admin/stats/facilities')
};

// 违规记录相关API
export const violationAPI = {
    getAllViolations: (page = 0, size = 10, userName = '', violationType = '', status = '') => 
        request.get('/violation/all', { params: { page, size, userName, violationType, status } }),
    recordViolation: (data) => request.post('/violation/record', data),
    approveViolation: (id, remark) => request.post(`/violation/${id}/approve`, null, {
        params: { remark }
    }),
    rejectViolation: (id, remark) => request.post(`/violation/${id}/reject`, null, {
        params: { remark }
    }),
    revokeViolation: (id, remark) => request.post(`/violation/${id}/revoke`, null, {
        params: { remark }
    }),
    updateViolationStatus: (id, status) => request.put(`/violation/${id}/status`, null, {
        params: { status }
    }),
    getUserCurrentCreditScore: (userId) => request.get(`/violation/user/${userId}/credit-score`),
    getUserViolationCount: (userId) => request.get(`/violation/user/${userId}/violation-count`),
    getViolationStats: () => request.get('/violation/stats')
};

// 用户客户端相关API
export const userClientAPI = {
    // 获取我的违规记录
    getMyViolationRecords: (userId, page = 0, size = 10) => 
        request.get(`/user-client/violation-records/${userId}`, { 
            params: { page, size } 
        }),
    
    getViolationRecordDetail: (id, userId) => 
        request.get(`/user-client/violation-records/${id}/detail`, { 
            params: { userId } 
        }),

    // 获取我的反馈
    getMyFeedbacks: (userId, page = 0, size = 10) => 
        request.get(`/user-client/feedbacks/${userId}`, { 
            params: { page, size } 
        }),
    
    submitFeedback: (data) => request.post('/user-client/feedbacks', data),
    
    getFeedbackDetail: (id, userId) => 
        request.get(`/user-client/feedbacks/${id}/detail`, { 
            params: { userId } 
        }),

    // 获取所有规则配置项
    getAllRuleConfigs: () => request.get('/user-client/rule-configs'),
    
    getRuleConfigByCategory: (categoryId) => 
        request.get(`/user-client/rule-configs/category/${categoryId}`),
    
    getRuleDescription: (categoryId) => 
        request.get(`/user-client/rule-configs/${categoryId}/description`)
};



