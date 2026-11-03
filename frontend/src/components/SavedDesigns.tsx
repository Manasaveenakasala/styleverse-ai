
import { useEffect, useState } from "react";

import {
  getSavedDesigns,
  deleteDesign,
  updateDesignFavorite,
  type SavedDesign,
} from "../services/api";

import { exportDesignPDF } from "../utils/exportDesignPDF";

// ==========================================
// TYPES
// ==========================================

type SavedDesignsProps = {
  refreshKey: number;
  onLoadDesign: (design: SavedDesign) => void;
};

type DesignFilter = "all" | "favorites";
type SortOption = "newest" | "oldest" | "name";

type GarmentFilter =
  | "all"
  | "Dress"
  | "Jacket"
  | "Shirt"
  | "Skirt"
  | "Pants";

// ==========================================
// CLIPBOARD HELPER
// ==========================================

async function copyDesignText(text: string): Promise<void> {
  // Modern clipboard API
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Try legacy fallback below
    }
  }

  // Fallback for browsers without Clipboard API
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "0";
  textarea.style.top = "0";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();

    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Clipboard copy failed.");
    }
  } finally {
    textarea.remove();
  }
}

// ==========================================
// SAVED DESIGNS COMPONENT
// ==========================================

export default function SavedDesigns({
  refreshKey,
  onLoadDesign,
}: SavedDesignsProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingFavoriteId, setUpdatingFavoriteId] =
    useState<number | null>(null);

  const [filter, setFilter] = useState<DesignFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [garmentFilter, setGarmentFilter] =
    useState<GarmentFilter>("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("newest");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Share dialog state
  const [shareDesign, setShareDesign] = useState<SavedDesign | null>(null);
  const [shareText, setShareText] = useState("");

  // ========================================
  // LOAD SAVED DESIGNS
  // ========================================

  useEffect(() => {
    let active = true;

    async function loadDesigns() {
      setIsLoading(true);

      try {
        const savedDesigns = await getSavedDesigns();

        if (!active) return;

        setDesigns(savedDesigns);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load saved designs."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDesigns();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // ========================================
  // FAVORITES
  // ========================================

  const favoriteCount = designs.filter(
    (design) => design.is_favorite === 1
  ).length;

  // ========================================
  // SEARCH, FILTER AND SORT
  // ========================================

  const filteredDesigns = designs
    .filter((design) =>
      filter === "favorites"
        ? design.is_favorite === 1
        : true
    )
    .filter((design) =>
      garmentFilter === "all"
        ? true
        : design.garment === garmentFilter
    )
    .filter((design) => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) return true;

      return (
        design.garment.toLowerCase().includes(query) ||
        design.fabric.toLowerCase().includes(query) ||
        design.description.toLowerCase().includes(query) ||
        design.color.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortOption === "oldest") {
        return a.id - b.id;
      }

      if (sortOption === "name") {
        return (
          a.garment.localeCompare(b.garment) ||
          b.id - a.id
        );
      }

      return b.id - a.id;
    });

  // ========================================
  // TOGGLE FAVORITE
  // ========================================

  async function handleToggleFavorite(design: SavedDesign) {
    if (updatingFavoriteId !== null || deletingId !== null) {
      return;
    }

    setUpdatingFavoriteId(design.id);
    setError("");
    setSuccessMessage("");

    const nextFavoriteStatus = design.is_favorite !== 1;

    try {
      const response = await updateDesignFavorite(
        design.id,
        nextFavoriteStatus
      );

      setDesigns((previous) =>
        previous.map((item) =>
          item.id === design.id ? response.design : item
        )
      );

      setSuccessMessage(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update favorite status."
      );
    } finally {
      setUpdatingFavoriteId(null);
    }
  }

  // ========================================
  // DELETE DESIGN
  // ========================================

  async function handleDeleteDesign(designId: number) {
    if (deletingId !== null || updatingFavoriteId !== null) {
      return;
    }

    const shouldDelete = window.confirm(
      "Are you sure you want to delete this design?"
    );

    if (!shouldDelete) return;

    setDeletingId(designId);
    setError("");
    setSuccessMessage("");

    try {
      await deleteDesign(designId);

      setDesigns((previous) =>
        previous.filter((design) => design.id !== designId)
      );

      setSuccessMessage("Design deleted successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete design."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ========================================
  // LOAD DESIGN INTO STUDIO
  // ========================================

  function handleLoadDesign(design: SavedDesign) {
    onLoadDesign(design);

    setSuccessMessage(
      "Design loaded into the studio! Scroll up to customize it."
    );
    setError("");
  }

  // ========================================
  // DOWNLOAD DESIGN AS JSON
  // ========================================

  function handleDownloadDesign(design: SavedDesign) {
    try {
      const exportData = {
        id: design.id,
        garment: design.garment,
        color: design.color,
        fabric: design.fabric,
        description: design.description,
        created_at: design.created_at,
        is_favorite: design.is_favorite === 1,
      };

      const json = JSON.stringify(exportData, null, 2);

      const blob = new Blob([json], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      try {
        const link = document.createElement("a");

        link.href = url;
        link.download =
          `styleverse-${design.garment.toLowerCase()}-${design.id}.json`;

        document.body.appendChild(link);

        try {
          link.click();
        } finally {
          link.remove();
        }
      } finally {
        URL.revokeObjectURL(url);
      }

      setSuccessMessage("JSON download started!");
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download design."
      );
      setSuccessMessage("");
    }
  }

  // ========================================
  // DOWNLOAD DESIGN AS PDF
  // ========================================

  function handleDownloadPDF(design: SavedDesign) {
    try {
      exportDesignPDF(design);

      setSuccessMessage("PDF download started!");
      setError("");
    } catch (err) {
      console.error("PDF export failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to export design as PDF."
      );
      setSuccessMessage("");
    }
  }

  // ========================================
  // SHARE DESIGN
  // ========================================

  function handleShareDesign(design: SavedDesign) {
    const text = [
      `StyleVerse AI - ${design.garment} #${design.id}`,
      `Garment: ${design.garment}`,
      `Fabric: ${design.fabric}`,
      `Color: ${design.color.toUpperCase()}`,
      `Description: ${design.description}`,
      `Created: ${design.created_at}`,
    ].join("\n");

    // Always show an in-app dialog so clicking
    // Share Design produces a visible result.
    setShareDesign(design);
    setShareText(text);
    setError("");
    setSuccessMessage("");
  }

  async function handleNativeShare() {
    if (!shareDesign) return;

    if (typeof navigator.share !== "function") {
      setError(
        "Native sharing is unavailable in this browser. Use Copy Details instead."
      );
      return;
    }

    try {
      await navigator.share({
        title: `StyleVerse AI - ${shareDesign.garment}`,
        text: shareText,
      });

      setShareDesign(null);
      setSuccessMessage("Design shared successfully!");
      setError("");
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }

      console.error("Native sharing failed:", err);
      setError(
        "Native sharing failed. You can still copy the design details."
      );
    }
  }

  async function handleCopyShareText() {
    try {
      await copyDesignText(shareText);

      setShareDesign(null);
      setSuccessMessage(
        "Design details copied! Paste them into WhatsApp, email, or Messages."
      );
      setError("");
    } catch (err) {
      console.error("Clipboard copy failed:", err);

      setError(
        "Automatic copying failed. Select the text below and copy it manually."
      );
    }
  }

  // ========================================
  // CLEAR FILTERS
  // ========================================

  function handleClearFilters() {
    setSearchQuery("");
    setGarmentFilter("all");
    setSortOption("newest");
    setFilter("all");
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <section className="saved-designs">
      <div className="saved-designs-header">
        <h2>My Saved Designs</h2>

        <p>
          Search, organize, customize, export and share
          your saved fashion designs.
        </p>
      </div>

      {/* ALL / FAVORITES */}

      <div
        className="saved-design-filters"
        role="group"
        aria-label="Filter saved designs"
      >
        <button
          type="button"
          className={`filter-button ${
            filter === "all" ? "active" : ""
          }`}
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
        >
          All Designs ({designs.length})
        </button>

        <button
          type="button"
          className={`filter-button ${
            filter === "favorites" ? "active" : ""
          }`}
          onClick={() => setFilter("favorites")}
          aria-pressed={filter === "favorites"}
        >
          ♥ Favorites ({favoriteCount})
        </button>
      </div>

      {/* SEARCH / FILTER / SORT */}

      <div className="design-search-controls">
        <input
          type="search"
          placeholder="Search by garment, fabric or description..."
          aria-label="Search saved designs"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(event.target.value)
          }
        />

        <select
          aria-label="Filter by garment"
          value={garmentFilter}
          onChange={(event) =>
            setGarmentFilter(
              event.target.value as GarmentFilter
            )
          }
        >
          <option value="all">All Garments</option>
          <option value="Dress">Dresses</option>
          <option value="Jacket">Jackets</option>
          <option value="Shirt">Shirts</option>
          <option value="Skirt">Skirts</option>
          <option value="Pants">Pants</option>
        </select>

        <select
          aria-label="Sort saved designs"
          value={sortOption}
          onChange={(event) =>
            setSortOption(
              event.target.value as SortOption
            )
          }
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Garment Name (A-Z)</option>
        </select>

        <button
          type="button"
          className="filter-button"
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
      </div>

      {!isLoading && !error && (
        <p role="status">
          Showing {filteredDesigns.length} of{" "}
          {designs.length} saved designs
        </p>
      )}

      {isLoading && (
        <p role="status">Loading saved designs...</p>
      )}

      {error && (
        <p className="design-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="suggestion-success" role="status">
          {successMessage}
        </p>
      )}

      {/* EMPTY STATES */}

      {!isLoading && !error && designs.length === 0 && (
        <div className="saved-designs-empty">
          <p>No saved designs yet.</p>
          <p>Create your first fashion design in the studio!</p>
        </div>
      )}

      {!isLoading &&
        !error &&
        designs.length > 0 &&
        filteredDesigns.length === 0 && (
          <div className="saved-designs-empty">
            <p>No designs match your filters.</p>
            <button
              type="button"
              className="filter-button"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        )}

      {/* DESIGN CARDS */}

      {!isLoading && filteredDesigns.length > 0 && (
        <div className="saved-designs-grid">
          {filteredDesigns.map((design) => {
            const isFavorite = design.is_favorite === 1;
            const isUpdating =
              updatingFavoriteId === design.id;

            return (
              <div
                key={design.id}
                className="saved-design-card"
              >
                <div
                  className="saved-design-color"
                  style={{
                    backgroundColor: design.color,
                  }}
                />

                <div className="saved-design-info">
                  <h3>
                    {design.garment} #{design.id}
                  </h3>

                  <p>
                    <strong>Fabric:</strong> {design.fabric}
                  </p>

                  <p>
                    <strong>Color:</strong>{" "}
                    {design.color.toUpperCase()}
                  </p>

                  <p>
                    <strong>Description:</strong>{" "}
                    {design.description}
                  </p>

                  <p>
                    <strong>Created:</strong>{" "}
                    {design.created_at}
                  </p>
                </div>

                <div className="saved-design-actions">
                  <button
                    type="button"
                    className={`favorite-button ${
                      isFavorite ? "is-favorite" : ""
                    }`}
                    onClick={() =>
                      void handleToggleFavorite(design)
                    }
                    disabled={
                      updatingFavoriteId !== null ||
                      deletingId !== null
                    }
                    aria-pressed={isFavorite}
                  >
                    {isUpdating
                      ? "Updating..."
                      : isFavorite
                        ? "♥ Favorited"
                        : "♡ Favorite"}
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      handleLoadDesign(design)
                    }
                  >
                    Load in Studio
                  </button>

                  <button
                    type="button"
                    className="download-button"
                    onClick={() =>
                      handleDownloadDesign(design)
                    }
                  >
                    ↓ Download JSON
                  </button>

                  <button
                    type="button"
                    className="download-button"
                    onClick={() =>
                      handleDownloadPDF(design)
                    }
                  >
                    📄 Download PDF
                  </button>

                  <button
                    type="button"
                    className="download-button"
                    onClick={() => handleShareDesign(design)}
                  >
                    ↗ Share Design
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      void handleDeleteDesign(design.id)
                    }
                    disabled={
                      deletingId !== null ||
                      updatingFavoriteId !== null
                    }
                  >
                    {deletingId === design.id
                      ? "Deleting..."
                      : "Delete Design"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================
          SHARE DESIGN DIALOG
         ===================================== */}

      {shareDesign && (
        <div
          className="share-dialog-backdrop"
          onClick={() => setShareDesign(null)}
        >
          <div
            className="share-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Share ${shareDesign.garment} design`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="share-dialog-header">
              <h3>
                Share {shareDesign.garment} #{shareDesign.id}
              </h3>

              <button
                type="button"
                className="share-dialog-close"
                onClick={() => setShareDesign(null)}
                aria-label="Close share dialog"
              >
                ×
              </button>
            </div>

            <p>
              Share your fashion design or copy
              the details below.
            </p>

            <textarea
              className="share-dialog-text"
              value={shareText}
              readOnly
              rows={7}
              aria-label="Design details to share"
              onFocus={(event) => event.target.select()}
            />

            <div className="share-dialog-actions">
              {typeof navigator.share === "function" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void handleNativeShare()}
                >
                  ↗ Share
                </button>
              )}

              <button
                type="button"
                className="download-button"
                onClick={() => void handleCopyShareText()}
              >
                Copy Details
              </button>

              <button
                type="button"
                className="filter-button"
                onClick={() => setShareDesign(null)}
              >
                Close
              </button>
            </div>

            {error && (
              <p className="design-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}