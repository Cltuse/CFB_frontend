import request from '../utils/request'

export const violationAPI = {
  reportViolation: (data) => request.post('/violation/record', data),

  getMaintainerViolations: (params) => request.get('/violation/maintainer', { params }),

  getUserViolations: (userId, params) => request.get(`/violation/user/${userId}`, { params }),

  getViolationDetail: (id) => request.get(`/violation/${id}`),

  approveViolation: (id, remark) =>
    request.post(`/violation/${id}/approve`, null, {
      params: { remark }
    }),

  rejectViolation: (id, remark) =>
    request.post(`/violation/${id}/reject`, null, {
      params: { remark }
    }),

  revokeViolation: (id, remark) =>
    request.post(`/violation/${id}/revoke`, null, {
      params: { remark }
    }),

  updateViolationStatus: (id, status) =>
    request.put(`/violation/${id}/status`, null, {
      params: { status }
    }),

  deleteViolation: (id) => request.delete(`/violation/${id}`)
}

export default violationAPI
