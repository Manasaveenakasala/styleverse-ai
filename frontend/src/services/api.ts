
const API_BASE_URL = 'http://127.0.0.1:8000'

export type HealthResponse = {
  status: string
  app: string
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error(
      `Backend health check failed: ${response.status}`
    )
  }

  return response.json() as Promise<HealthResponse>
}
