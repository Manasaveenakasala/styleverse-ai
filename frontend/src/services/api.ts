
const API_BASE_URL = 'http://127.0.0.1:8000'

// ==========================================
// BACKEND HEALTH CHECK
// ==========================================

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

// ==========================================
// DESIGN TYPES
// ==========================================

export type DesignPayload = {
  garment: string
  color: string
  fabric: string
  description: string
}

export type SavedDesign = DesignPayload & {
  id: number
  created_at: string
}

export type CreateDesignResponse = {
  message: string
  design: SavedDesign
}

export type SavedDesignsResponse = {
  designs: SavedDesign[]
}

// ==========================================
// CREATE DESIGN
// ==========================================

export async function createDesign(
  design: DesignPayload
): Promise<CreateDesignResponse> {
  const response = await fetch(`${API_BASE_URL}/designs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(design),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to create design: ${response.status}`
    )
  }

  return response.json() as Promise<CreateDesignResponse>
}

// ==========================================
// GET SAVED DESIGNS
// ==========================================

export async function getSavedDesigns(): Promise<SavedDesign[]> {
  const response = await fetch(`${API_BASE_URL}/designs`)

  if (!response.ok) {
    throw new Error(
      `Failed to load saved designs: ${response.status}`
    )
  }

  const data = (await response.json()) as SavedDesignsResponse

  return data.designs
}

// ==========================================
// DELETE SAVED DESIGN
// ==========================================

export async function deleteDesign(
  designId: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/designs/${designId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to delete design: ${response.status}`
    )
  }
}

// ==========================================
// GENERATE FREE FASHION SUGGESTION
// ==========================================

export type AIDesignResponse = {
  message: string
  design: DesignPayload
}

export async function generateDesignSuggestion(
  description: string
): Promise<AIDesignResponse> {
  const response = await fetch(
    `${API_BASE_URL}/ai/suggest-design`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to generate suggestion: ${response.status}`
    )
  }

  return response.json() as Promise<AIDesignResponse>
}