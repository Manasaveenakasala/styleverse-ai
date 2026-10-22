const API_BASE_URL = "http://127.0.0.1:8000";

export type HealthResponse = {
  status: string;
  app: string;
};

export type DesignPayload = {
  garment: string;
  color: string;
  fabric: string;
  description: string;
};

export type CreateDesignResponse = {
  message: string;
  design: DesignPayload;
};

// Check whether FastAPI is running
export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Backend health check failed: ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}

// Send a fashion design to FastAPI
export async function createDesign(
  design: DesignPayload,
): Promise<CreateDesignResponse> {
  const response = await fetch(`${API_BASE_URL}/designs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(design),
  });

  if (!response.ok) {
    throw new Error(`Failed to create design: ${response.status}`);
  }

  return response.json() as Promise<CreateDesignResponse>;
}


export type SavedDesign = DesignPayload & {
  id: number
  created_at: string
}

export type SavedDesignsResponse = {
  designs: SavedDesign[]
}

// Retrieve all saved fashion designs from FastAPI
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

