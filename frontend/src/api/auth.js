// ─────────────────────────────────────────────────────────────────────────────
// src/api/auth.js
// ─────────────────────────────────────────────────────────────────────────────
import client from './client'

export const registerUser    = (data)      => client.post('/auth/register/',         data).then(r=>r.data)
export const loginUser       = (data)      => client.post('/auth/login/',             data).then(r=>r.data)
export const logoutUser      = (refresh)   => client.post('/auth/logout/',           {refresh}).then(r=>r.data)
export const getProfile      = ()          => client.get ('/auth/profile/').then(r=>r.data)
export const updateProfile   = (data)      => client.patch('/auth/profile/',         data, {
  headers: data instanceof FormData ? {'Content-Type':'multipart/form-data'} : {},
}).then(r=>r.data)
export const changePassword  = (data)      => client.put ('/auth/change-password/',  data).then(r=>r.data)
export const getAddresses    = ()          => client.get ('/auth/addresses/').then(r=>r.data)
export const createAddress   = (data)      => client.post('/auth/addresses/',         data).then(r=>r.data)
export const updateAddress   = (id, data)  => client.patch(`/auth/addresses/${id}/`, data).then(r=>r.data)
export const deleteAddress   = (id)        => client.delete(`/auth/addresses/${id}/`).then(r=>r.data)