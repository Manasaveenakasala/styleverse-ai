
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getSavedDesigns,
  deleteDesign,
  updateDesignFavorite,
  type SavedDesign,
} from "../services/api";

import { exportDesignPDF } from "../utils/exportDesignPDF";

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

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

async function copyDesignText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to selecting a temporary textarea.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();

    if (!document.execCommand("copy")) {
      throw new Error("Clipboard copy failed.");
    }
  } finally {
    textarea.remove();
  }
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof Error
    ? error.message
    : fallback;
}

export default function SavedDesigns({
  refreshKey,
  onLoadDesign,
}: SavedDesignsProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [updatingFavoriteId, setUpdatingFavoriteId] =
    useState<number | null>(null);

  const [filter, setFilter] =
    useState<DesignFilter>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [garmentFilter, setGarmentFilter] =
    useState<GarmentFilter>("all");

  const [sortOption, setSortOption] =
    useState<SortOption>("newest");

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const [loadError, setLoadError] = useState("");

  const [shareDesign, setShareDesign] =
    useState<SavedDesign | null>(null);

  const [shareText, setShareText] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const feedbackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const showSuccess = useCallback((message: string) => {
    setFeedback({ type: "success", message });
  }, []);

  const showError = useCallback((message: string) => {
    setFeedback({ type: "error", message });
  }, []);

  // ==========================================
  // LOAD SAVED DESIGNS
  // ==========================================

  useEffect(() => {
    let active = true;

    async function loadDesigns() {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await getSavedDesigns();

        if (!active) return;

        setDesigns(result);
      } catch (error) {
        if (!active) return;

        setLoadError(
          getErrorMessage(
            error,
            "Unable to load saved designs."
          )
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
  }, [refreshKey, retryKey]);

  // ==========================================
  // SHARE DIALOG KEYBOARD HANDLING
  // ==========================================

  useEffect(() => {
    if (!shareDesign) return;

    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShareDesign(null);
        return;
      }

      if (event.key !== "Tab") return;

      const buttons = dialogRef.current?.querySelectorAll<
        HTMLButtonElement
      >('button:not(:disabled)');

      if (!buttons?.length) return;

      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [shareDesign]);

  const favoriteCount = designs.filter(
    (design) => Boolean(design.is_favorite)
  ).length;

  const filteredDesigns = designs
    .filter(
      (design) =>
        filter === "all" ||
        Boolean(design.is_favorite)
    )
    .filter(
      (design) =>
        garmentFilter === "all" ||
        design.garment === garmentFilter
    )
    .filter((design) => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) return true;

      return [
        design.garment,
        design.fabric,
        design.color,
        design.description,
      ].some((value) =>
        value.toLowerCase().includes(query)
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

  const isUpdating =
    deletingId !== null ||
    updatingFavoriteId !== null;

  // ==========================================
  // FAVORITE
  // ==========================================

  async function handleToggleFavorite(design: SavedDesign) {
    if (isUpdating) return;

    setUpdatingFavoriteId(design.id);
    setFeedback(null);

    try {
      const nextFavorite = !Boolean(design.is_favorite);

      const response = await updateDesignFavorite(
        design.id,
        nextFavorite
      );

      setDesigns((previous) =>
        previous.map((item) =>
          item.id === design.id
            ? response.design
            : item
        )
      );

      showSuccess(
        nextFavorite
          ? "Design added to favorites."
          : "Design removed from favorites."
      );
    } catch (error) {
      showError(
        getErrorMessage(
          error,
          "Unable to update favorite."
        )
      );
    } finally {
      setUpdatingFavoriteId(null);
    }
  }

  // ==========================================
  // DELETE
  // ==========================================

  async function handleDeleteDesign(designId: number) {
    if (isUpdating) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this design?"
      )
    ) {
      return;
    }

    setDeletingId(designId);
    setFeedback(null);

    try {
      await deleteDesign(designId);

      setDesigns((previous) =>
        previous.filter(
          (design) => design.id !== designId
        )
      );

      showSuccess("Design deleted successfully.");
    } catch (error) {
      showError(
        getErrorMessage(
          error,
          "Unable to delete design."
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // LOAD INTO STUDIO
  // ==========================================

  function handleLoadDesign(design: SavedDesign) {
    onLoadDesign(design);

    showSuccess(
      "Design loaded into the studio. Scroll up to customize it."
    );
  }

  // ==========================================
  // JSON EXPORT
  // ==========================================

  function handleDownloadJSON(design: SavedDesign) {
    try {
      const exportData = {
        id: design.id,
        garment: design.garment,
        color: design.color,
        fabric: design.fabric,
        description: design.description,
        created_at: design.created_at,
        is_favorite: Boolean(design.is_favorite),
      };

      const blob = new Blob(
        [JSON.stringify(exportData, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        `styleverse-${design.garment.toLowerCase()}-${design.id}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Give the browser time to start the download.
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      showSuccess("JSON download started.");
    } catch (error) {
      showError(
        getErrorMessage(
          error,
          "Unable to export JSON."
        )
      );
    }
  }

  // ==========================================
  // PDF EXPORT
  // ==========================================

  function handleDownloadPDF(design: SavedDesign) {
    try {
      exportDesignPDF(design);
      showSuccess("PDF download started.");
    } catch (error) {
      showError(
        getErrorMessage(
          error,
          "Unable to export PDF."
        )
      );
    }
  }

  // ==========================================
  // SHARE
  // ==========================================

  function handleShareDesign(design: SavedDesign) {
    const text = [
      `StyleVerse AI - ${design.garment} #${design.id}`,
      `Garment: ${design.garment}`,
      `Fabric: ${design.fabric}`,
      `Color: ${design.color.toUpperCase()}`,
      `Description: ${design.description}`,
      `Created: ${design.created_at}`,
    ].join("\n");

    setShareDesign(design);
    setShareText(text);
    setFeedback(null);
  }

  async function handleNativeShare() {
    if (
      !shareDesign ||
      typeof navigator.share !== "function" ||
      isSharing
    ) {
      return;
    }

    setIsSharing(true);

    try {
      await navigator.share({
        title: `StyleVerse AI - ${shareDesign.garment}`,
        text: shareText,
      });

      setShareDesign(null);
      showSuccess("Design shared successfully.");
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      showError(
        "Native sharing failed. Try Copy Details instead."
      );
    } finally {
      setIsSharing(false);
    }
  }

  async function handleCopyShareText() {
    if (isCopying) return;

    setIsCopying(true);

    try {
      await copyDesignText(shareText);

      setShareDesign(null);
      showSuccess(
        "Design details copied to your clipboard."
      );
    } catch {
      showError(
        "Copy failed. Select the text in the dialog and copy it manually."
      );
    } finally {
      setIsCopying(false);
    }
  }

  function handleClearFilters() {
    setFilter("all");
    setSearchQuery("");
    setGarmentFilter("all");
    setSortOption("newest");
  }

  return (
    <section className="saved-designs">
      <div className="saved-designs-header">
        <span className="eyebrow">
          YOUR FASHION COLLECTION
        </span>

        <h2>My Saved Designs</h2>

        <p>
          Explore, organize, customize, export,
          and share your creations.
        </p>
      </div>

      {/* FILTERS */}

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
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All Designs ({designs.length})
        </button>

        <button
          type="button"
          className={`filter-button ${
            filter === "favorites" ? "active" : ""
          }`}
          aria-pressed={filter === "favorites"}
          onClick={() => setFilter("favorites")}
        >
          ♥ Favorites ({favoriteCount})
        </button>
      </div>

      {/* SEARCH */}

      <div className="design-search-controls">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(event.target.value)
          }
          placeholder="Search designs..."
          aria-label="Search saved designs"
        />

        <select
          value={garmentFilter}
          onChange={(event) =>
            setGarmentFilter(
              event.target.value as GarmentFilter
            )
          }
          aria-label="Filter by garment"
        >
          <option value="all">All Garments</option>
          <option value="Dress">Dresses</option>
          <option value="Jacket">Jackets</option>
          <option value="Shirt">Shirts</option>
          <option value="Skirt">Skirts</option>
          <option value="Pants">Pants</option>
        </select>

        <select
          value={sortOption}
          onChange={(event) =>
            setSortOption(
              event.target.value as SortOption
            )
          }
          aria-label="Sort saved designs"
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

      {/* FEEDBACK */}

      <div ref={feedbackRef} aria-live="polite">
        {feedback && (
          <div
            className={`saved-feedback saved-feedback-${feedback.type}`}
            role={
              feedback.type === "error"
                ? "alert"
                : "status"
            }
          >
            <span>{feedback.message}</span>

            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* LOADING */}

      {isLoading && (
        <div
          className="saved-design-loading"
          role="status"
        >
          <span
            className="studio-spinner"
            aria-hidden="true"
          />
          <span>Loading your fashion collection...</span>
        </div>
      )}

      {/* LOAD ERROR */}

      {!isLoading && loadError && (
        <div className="saved-design-error" role="alert">
          <p>{loadError}</p>

          <button
            type="button"
            className="filter-button"
            onClick={() =>
              setRetryKey((previous) => previous + 1)
            }
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* RESULTS */}

      {!isLoading && !loadError && (
        <p className="saved-design-results">
          Showing {filteredDesigns.length} of{" "}
          {designs.length} saved designs
        </p>
      )}

      {/* EMPTY STATES */}

      {!isLoading &&
        !loadError &&
        designs.length === 0 && (
          <div className="saved-designs-empty">
            <h3>No saved designs yet</h3>
            <p>
              Create your first fashion design
              in the studio above.
            </p>
          </div>
        )}

      {!isLoading &&
        !loadError &&
        designs.length > 0 &&
        filteredDesigns.length === 0 && (
          <div className="saved-designs-empty">
            <h3>No matching designs</h3>
            <p>Try changing your search or filters.</p>

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

      {!isLoading &&
        !loadError &&
        filteredDesigns.length > 0 && (
          <div className="saved-designs-grid">
            {filteredDesigns.map((design) => {
              const isFavorite =
                Boolean(design.is_favorite);

              const isFavoriteUpdating =
                updatingFavoriteId === design.id;

              const isDeleting =
                deletingId === design.id;

              return (
                <article
                  key={design.id}
                  className="saved-design-card"
                  aria-busy={
                    isFavoriteUpdating || isDeleting
                  }
                >
                  <div
                    className="saved-design-color"
                    style={{
                      backgroundColor: design.color,
                    }}
                    aria-label={`Design color ${design.color}`}
                    role="img"
                  />

                  <div className="saved-design-info">
                    <h3>
                      {design.garment} #{design.id}
                    </h3>

                    <p>
                      <strong>Fabric:</strong>{" "}
                      {design.fabric}
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
                      aria-pressed={isFavorite}
                      disabled={isUpdating}
                      onClick={() =>
                        void handleToggleFavorite(design)
                      }
                    >
                      {isFavoriteUpdating
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
                        handleDownloadJSON(design)
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
                      onClick={() =>
                        handleShareDesign(design)
                      }
                    >
                      ↗ Share Design
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      disabled={isUpdating}
                      onClick={() =>
                        void handleDeleteDesign(design.id)
                      }
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete Design"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      {/* SHARE DIALOG */}

      {shareDesign && (
        <div
          className="share-dialog-backdrop"
          onClick={() => {
            if (!isSharing && !isCopying) {
              setShareDesign(null);
            }
          }}
        >
          <div
            ref={dialogRef}
            className="share-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Share ${shareDesign.garment} design`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="share-dialog-header">
              <h3>
                Share {shareDesign.garment} #
                {shareDesign.id}
              </h3>

              <button
                ref={closeButtonRef}
                type="button"
                className="share-dialog-close"
                disabled={isSharing || isCopying}
                onClick={() =>
                  setShareDesign(null)
                }
                aria-label="Close share dialog"
              >
                ×
              </button>
            </div>

            <p>
              Share your creation or copy its details.
            </p>

            <textarea
              className="share-dialog-text"
              value={shareText}
              readOnly
              rows={7}
              aria-label="Design details to share"
              onFocus={(event) =>
                event.target.select()
              }
            />

            <div className="share-dialog-actions">
              {typeof navigator.share === "function" && (
                <button
                  type="button"
                  className="primary-button"
                  disabled={isSharing || isCopying}
                  onClick={() =>
                    void handleNativeShare()
                  }
                >
                  {isSharing
                    ? "Sharing..."
                    : "↗ Share"}
                </button>
              )}

              <button
                type="button"
                className="download-button"
                disabled={isSharing || isCopying}
                onClick={() =>
                  void handleCopyShareText()
                }
              >
                {isCopying
                  ? "Copying..."
                  : "Copy Details"}
              </button>

              <button
                type="button"
                className="filter-button"
                disabled={isSharing || isCopying}
                onClick={() =>
                  setShareDesign(null)
                }
              >
                Close
              </button>
            </div>

            {feedback?.type === "error" && (
              <p className="design-error" role="alert">
                {feedback.message}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}