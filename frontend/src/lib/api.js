const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082'

export const getApiBase = () => API_BASE

export const apiFetch = async (path, options = {}) => {
  const hasBody = options.body !== undefined
  const isFormData = hasBody && options.body instanceof FormData
  const headers = {
    ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  }

  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers
  })
}
