
const API_BASE_URL = 'http://127.0.0.1:8000'

// ==========================================
// HEALTH CHECK
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

export type GarmentSize =
  | 'XS'
  | 'S'
  | 'M'
  | 'L'
  | 'XL'
  | 'XXL'

export type SleeveLength =
  | 'Sleeveless'
  | 'Short'
  | 'Three-Quarter'
  | 'Long'

export type GarmentFit =
  | 'Slim'
  | 'Regular'
  | 'Relaxed'
  | 'Oversized'

// Sprint 8 — Fabric pattern customization
export type FabricPattern =
  | 'Solid'
  | 'Stripes'
  | 'Floral'
  | 'Plaid'
  | 'Polka Dots'

export type DesignPayload = {
  garment: string
  color: string
  fabric: string
  description: string

  // Advanced garment customizations
  size: GarmentSize
  sleeve_length: SleeveLength
  fit: GarmentFit

  // Fabric pattern saved to SQLite
  pattern: FabricPattern
}

export type SavedDesign = DesignPayload & {
  id: number
  created_at: string
  is_favorite: number
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
// POST /designs
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
// UPDATE EXISTING DESIGN
// PUT /designs/{designId}
// SPRINT 9 — TASK 1
// ==========================================

export type UpdateDesignResponse = {
  message: string
  design: SavedDesign
}

export async function updateDesign(
  designId: number,
  design: DesignPayload
): Promise<UpdateDesignResponse> {
  const response = await fetch(
    `${API_BASE_URL}/designs/${designId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(design),
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'Design not found. It may have been deleted.'
      )
    }

    if (response.status === 422) {
      throw new Error(
        'Invalid design details. Please check your selections.'
      )
    }

    throw new Error(
      `Failed to update design: ${response.status}`
    )
  }

  return response.json() as Promise<UpdateDesignResponse>
}

// ==========================================
// GET SAVED DESIGNS
// GET /designs
// ==========================================

export async function getSavedDesigns(): Promise<SavedDesign[]> {
  const response = await fetch(`${API_BASE_URL}/designs`)

  if (!response.ok) {
    throw new Error(
      `Failed to load saved designs: ${response.status}`
    )
  }

  const data =
    (await response.json()) as SavedDesignsResponse

  return data.designs
}

// ==========================================
// DELETE DESIGN
// DELETE /designs/{designId}
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
// UPDATE FAVORITE STATUS
// PATCH /designs/{designId}/favorite
// ==========================================

export type FavoriteUpdateResponse = {
  message: string
  design: SavedDesign
}

export async function updateDesignFavorite(
  designId: number,
  isFavorite: boolean
): Promise<FavoriteUpdateResponse> {
  const response = await fetch(
    `${API_BASE_URL}/designs/${designId}/favorite`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_favorite: isFavorite,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to update favorite: ${response.status}`
    )
  }

  return response.json() as Promise<FavoriteUpdateResponse>
}

// ==========================================
// FREE FASHION SUGGESTION GENERATOR
// POST /ai/suggest-design
// ==========================================

// AI suggestions return only the basic design fields.
// Size, sleeve length, fit, and fabric pattern
// are selected in the Design Studio.

export type AIDesignSuggestion = Pick<
  DesignPayload,
  'garment' | 'color' | 'fabric' | 'description'
>

export type AIDesignResponse = {
  message: string
  design: AIDesignSuggestion
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
      body: JSON.stringify({
        description,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to generate suggestion: ${response.status}`
    )
  }

  return response.json() as Promise<AIDesignResponse>
}