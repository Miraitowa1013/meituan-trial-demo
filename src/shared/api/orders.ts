import type { CreateOrderInput, OrderDetail, OrderListResponse, SubmitVerificationInput, VerificationResult } from './contracts'
import { apiRequest } from './http'
const headers = (sessionId: string) => ({ 'x-demo-session': sessionId })
export const createOrder = (sessionId: string, input: CreateOrderInput) => apiRequest<OrderDetail>('/orders', { method: 'POST', headers: headers(sessionId), body: JSON.stringify(input) })
export const getOrders = (sessionId: string) => apiRequest<OrderListResponse>('/orders', { headers: headers(sessionId) })
export const getOrder = (sessionId: string, orderId: string) => apiRequest<OrderDetail>(`/orders/${encodeURIComponent(orderId)}`, { headers: headers(sessionId) })
export const advanceOrder = (sessionId: string, orderId: string) => apiRequest<OrderDetail>(`/orders/${encodeURIComponent(orderId)}/advance`, { method: 'POST', headers: headers(sessionId) })
export const submitVerification = (sessionId:string,orderId:string,input:SubmitVerificationInput)=>apiRequest<VerificationResult>(`/orders/${encodeURIComponent(orderId)}/verification`,{method:'POST',headers:headers(sessionId),body:JSON.stringify(input)})
