
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
  size: GarmentSize
  sleeve_length: SleeveLength
  fit: GarmentFit
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

export type UpdateDesignResponse = {
  message: string
  design: SavedDesign
  version_number?: number
}

export type SavedDesignsResponse = {
  designs: SavedDesign[]
}

// ==========================================
// DESIGN VERSION HISTORY TYPES
// SPRINT 9 — TASK 2
// ==========================================

export type DesignVersion = DesignPayload & {
  id: number
  design_id: number
  version_number: number
  created_at: string
}

export type DesignVersionsResponse = {
  design_id: number
  total_versions: number
  versions: DesignVersion[]
}

export type DesignVersionResponse = {
  design_id: number
  version: DesignVersion
}

export type RestoreDesignVersionResponse = {
  message: string
  design: SavedDesign
  restored_from_version: number
  version_number: number
}

// ==========================================
// API ERROR HANDLING
// ==========================================

async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  if (response.status === 404) {
    return 'Design or design version not found.'
  }

  if (response.status === 422) {
    return 'Invalid request. Please check the design details.'
  }

  try {
    const data = (await response.json()) as {
      detail?: string
    }

    if (typeof data.detail === 'string') {
      return data.detail
    }
  } catch {
    // Use the fallback message when no JSON
    // error response is available.
  }

  return `${fallbackMessage}: ${response.status}`
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
      await getApiErrorMessage(
        response,
        'Failed to create design'
      )
    )
  }

  return response.json() as Promise<CreateDesignResponse>
}

// ==========================================
// UPDATE EXISTING DESIGN
// PUT /designs/{designId}
// ==========================================

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
    throw new Error(
      await getApiErrorMessage(
        response,
        'Failed to update design'
      )
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
      await getApiErrorMessage(
        response,
        'Failed to load saved designs'
      )
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
      await getApiErrorMessage(
        response,
        'Failed to delete design'
      )
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
      await getApiErrorMessage(
        response,
        'Failed to update favorite'
      )
    )
  }

  return response.json() as Promise<FavoriteUpdateResponse>
}

// ==========================================
// GET DESIGN VERSION HISTORY
// GET /designs/{designId}/versions
// ==========================================

export async function getDesignVersions(
  designId: number
): Promise<DesignVersionsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/designs/${designId}/versions`
  )

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        'Failed to load design version history'
      )
    )
  }

  return response.json() as Promise<DesignVersionsResponse>
}

// ==========================================
// GET A SPECIFIC DESIGN VERSION
// GET /designs/{designId}/versions/{versionNumber}
// ==========================================

export async function getDesignVersion(
  designId: number,
  versionNumber: number
): Promise<DesignVersionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/designs/${designId}/versions/${versionNumber}`
  )

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        'Failed to load design version'
      )
    )
  }

  return response.json() as Promise<DesignVersionResponse>
}

// ==========================================
// RESTORE AN EARLIER DESIGN VERSION
// POST /designs/{designId}/restore/{versionNumber}
// ==========================================

export async function restoreDesignVersion(
  designId: number,
  versionNumber: number
): Promise<RestoreDesignVersionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/designs/${designId}/restore/${versionNumber}`,
    {
      method: 'POST',
    }
  )

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        'Failed to restore design version'
      )
    )
  }

  return response.json() as Promise<RestoreDesignVersionResponse>
}

// ==========================================
// FREE FASHION SUGGESTION GENERATOR
// POST /ai/suggest-design
// ==========================================

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
      await getApiErrorMessage(
        response,
        'Failed to generate suggestion'
      )
    )
  }

  return response.json() as Promise<AIDesignResponse>
}