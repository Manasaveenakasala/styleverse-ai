
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createDesign,
  getSavedDesigns,
  deleteDesign,
  updateDesignFavorite,
  getDesignVersions,
  restoreDesignVersion,
  type SavedDesign,
  type DesignPayload,
  type DesignVersion,
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

const VERSION_FIELDS: {
  key: keyof DesignPayload;
  label: string;
}[] = [
  { key: "garment", label: "Garment" },
  { key: "color", label: "Color" },
  { key: "fabric", label: "Fabric" },
  { key: "pattern", label: "Pattern" },
  { key: "size", label: "Size" },
  { key: "sleeve_length", label: "Sleeves" },
  { key: "fit", label: "Fit" },
  { key: "description", label: "Description" },
];

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

async function copyDesignText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Use fallback.
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

export default function SavedDesigns({
  refreshKey,
  onLoadDesign,
}: SavedDesignsProps) {
  // ==========================================
  // SAVED DESIGNS STATE
  // ==========================================

  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [loadError, setLoadError] = useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [updatingFavoriteId, setUpdatingFavoriteId] =
    useState<number | null>(null);

  const [duplicatingId, setDuplicatingId] =
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

  // ==========================================
  // VERSION HISTORY STATE
  // ==========================================

  const [historyDesignId, setHistoryDesignId] =
    useState<number | null>(null);

  const [historyVersions, setHistoryVersions] =
    useState<DesignVersion[]>([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");

  const [restoringVersion, setRestoringVersion] =
    useState<number | null>(null);

  const historyRequestId = useRef(0);

  // ==========================================
  // VERSION COMPARISON STATE
  // Sprint 9 - Task 3
  // ==========================================

  const [showComparison, setShowComparison] =
    useState(false);

  const [firstVersionNumber, setFirstVersionNumber] =
    useState<number | null>(null);

  const [secondVersionNumber, setSecondVersionNumber] =
    useState<number | null>(null);

  const [showOnlyChanges, setShowOnlyChanges] =
    useState(false);

  // ==========================================
  // SHARE STATE
  // ==========================================

  const [shareDesign, setShareDesign] =
    useState<SavedDesign | null>(null);

  const [shareText, setShareText] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const showSuccess = useCallback((message: string) => {
    setFeedback({ type: "success", message });
  }, []);

  const showError = useCallback((message: string) => {
    setFeedback({ type: "error", message });
  }, []);

  const isUpdating =
    deletingId !== null ||
    updatingFavoriteId !== null ||
    duplicatingId !== null ||
    restoringVersion !== null;

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

        if (active) {
          setDesigns(result);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            getErrorMessage(
              error,
              "Unable to load saved designs."
            )
          );
        }
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
  // RESET VERSION COMPARISON
  // ==========================================

  function resetComparison() {
    setShowComparison(false);
    setFirstVersionNumber(null);
    setSecondVersionNumber(null);
    setShowOnlyChanges(false);
  }

  // ==========================================
  // VERSION HISTORY
  // ==========================================

  async function handleViewHistory(designId: number) {
    if (isUpdating) return;

    const requestId = ++historyRequestId.current;

    resetComparison();

    if (historyDesignId === designId) {
      setHistoryDesignId(null);
      setHistoryVersions([]);
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    setHistoryDesignId(designId);
    setHistoryVersions([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const result = await getDesignVersions(designId);

      if (requestId === historyRequestId.current) {
        setHistoryVersions(result.versions);
      }
    } catch (error) {
      if (requestId === historyRequestId.current) {
        setHistoryError(
          getErrorMessage(
            error,
            "Unable to load version history."
          )
        );
      }
    } finally {
      if (requestId === historyRequestId.current) {
        setHistoryLoading(false);
      }
    }
  }

  // ==========================================
  // COMPARE DESIGN VERSIONS
  // ==========================================

  function handleCompareVersions() {
    if (historyVersions.length < 2) {
      showError(
        "At least two saved versions are required to compare."
      );
      return;
    }

    if (showComparison) {
      resetComparison();
      return;
    }

    setFirstVersionNumber(
      historyVersions[1].version_number
    );

    setSecondVersionNumber(
      historyVersions[0].version_number
    );

    setShowOnlyChanges(false);
    setShowComparison(true);
  }

  const firstVersion = historyVersions.find(
    (version) =>
      version.version_number === firstVersionNumber
  );

  const secondVersion = historyVersions.find(
    (version) =>
      version.version_number === secondVersionNumber
  );

  const changedFields =
    firstVersion && secondVersion
      ? VERSION_FIELDS.filter(
          (field) =>
            firstVersion[field.key] !==
            secondVersion[field.key]
        )
      : [];

  const unchangedCount =
    VERSION_FIELDS.length - changedFields.length;

  function handleSwapVersions() {
    setFirstVersionNumber(secondVersionNumber);
    setSecondVersionNumber(firstVersionNumber);
  }

  // ==========================================
  // RESTORE VERSION
  // ==========================================

  async function handleRestoreVersion(
    designId: number,
    versionNumber: number
  ) {
    if (isUpdating) return;

    const confirmed = window.confirm(
      `Restore Design #${designId} to Version ${versionNumber}?\n\n` +
        "The current design will be updated, and its history will be preserved."
    );

    if (!confirmed) return;

    setRestoringVersion(versionNumber);
    setHistoryError("");
    setFeedback(null);

    try {
      const result = await restoreDesignVersion(
        designId,
        versionNumber
      );

      setDesigns((previous) =>
        previous.map((design) =>
          design.id === designId
            ? result.design
            : design
        )
      );

      showSuccess(
        `Design #${designId} restored from Version ${versionNumber}.`
      );

      try {
        const updatedHistory =
          await getDesignVersions(designId);

        setHistoryVersions(updatedHistory.versions);
      } catch (error) {
        setHistoryError(
          getErrorMessage(
            error,
            "Design restored, but version history could not be refreshed."
          )
        );
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to restore design."
      );

      setHistoryError(message);
      showError(message);
    } finally {
      setRestoringVersion(null);
    }
  }

  // ==========================================
  // DUPLICATE DESIGN
  // ==========================================

  async function handleDuplicateDesign(
    design: SavedDesign
  ) {
    if (isUpdating) return;

    setDuplicatingId(design.id);
    setFeedback(null);

    try {
      const payload: DesignPayload = {
        garment: design.garment,
        color: design.color,
        fabric: design.fabric,
        description: design.description,
        size: design.size ?? "M",
        sleeve_length: design.sleeve_length ?? "Short",
        fit: design.fit ?? "Regular",
        pattern: design.pattern ?? "Solid",
      };

      const response = await createDesign(payload);

      setDesigns((previous) => [
        response.design,
        ...previous,
      ]);

      setFilter("all");
      setSearchQuery("");
      setGarmentFilter("all");
      setSortOption("newest");

      showSuccess(
        `Design #${design.id} duplicated as Design #${response.design.id}.`
      );
    } catch (error) {
      showError(
        getErrorMessage(
          error,
          "Unable to duplicate design."
        )
      );
    } finally {
      setDuplicatingId(null);
    }
  }

  // ==========================================
  // FAVORITE
  // ==========================================

  async function handleToggleFavorite(
    design: SavedDesign
  ) {
    if (isUpdating) return;

    setUpdatingFavoriteId(design.id);
    setFeedback(null);

    try {
      const response = await updateDesignFavorite(
        design.id,
        !design.is_favorite
      );

      setDesigns((previous) =>
        previous.map((item) =>
          item.id === design.id
            ? response.design
            : item
        )
      );

      showSuccess(
        response.design.is_favorite
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
  // DELETE DESIGN
  // ==========================================

  async function handleDeleteDesign(
    designId: number
  ) {
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

      if (historyDesignId === designId) {
        historyRequestId.current += 1;

        setHistoryDesignId(null);
        setHistoryVersions([]);
        setHistoryLoading(false);
        setHistoryError("");

        resetComparison();
      }

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
  // LOAD DESIGN INTO STUDIO
  // ==========================================

  function handleLoadDesign(design: SavedDesign) {
    historyRequestId.current += 1;

    setHistoryDesignId(null);
    setHistoryVersions([]);
    setHistoryLoading(false);
    setHistoryError("");

    resetComparison();

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
      const blob = new Blob(
        [JSON.stringify(design, null, 2)],
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
  // SHARE DESIGN
  // ==========================================

  function handleShareDesign(design: SavedDesign) {
    const text = [
      `StyleVerse AI - ${design.garment} #${design.id}`,
      `Garment: ${design.garment}`,
      `Fabric: ${design.fabric}`,
      `Pattern: ${design.pattern}`,
      `Color: ${design.color}`,
      `Size: ${design.size}`,
      `Sleeve Length: ${design.sleeve_length}`,
      `Fit: ${design.fit}`,
      `Description: ${design.description}`,
      `Created: ${design.created_at}`,
    ].join("\n");

    setShareDesign(design);
    setShareText(text);
    setFeedback(null);
  }

  async function handleNativeShare() {
    if (!shareDesign || !navigator.share || isSharing) {
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

      showError("Sharing failed. Try Copy Details.");
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

      showSuccess("Design details copied.");
    } catch {
      showError("Unable to copy design details.");
    } finally {
      setIsCopying(false);
    }
  }

  // ==========================================
  // FILTERING AND SORTING
  // ==========================================

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
        design.pattern,
        design.size,
        design.sleeve_length,
        design.fit,
        design.color,
        design.description,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
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

  function handleClearFilters() {
    setFilter("all");
    setSearchQuery("");
    setGarmentFilter("all");
    setSortOption("newest");
  }

  // ==========================================
  // VERSION COMPARISON RENDER HELPER
  // ==========================================

  function renderVersionComparison() {
    if (
      !showComparison ||
      !firstVersion ||
      !secondVersion
    ) {
      return null;
    }

    const comparisonFields = showOnlyChanges
      ? changedFields
      : VERSION_FIELDS;

    return (
      <div
        className="version-comparison-panel"
        style={{
          marginTop: "16px",
          marginBottom: "20px",
          padding: "16px",
          border: "1px solid #d8b4fe",
          borderRadius: "12px",
          minWidth: 0,
        }}
      >
        <h4
          style={{
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          Compare Design Versions
        </h4>

        <p>
          Select two versions to see what has changed.
        </p>

        {/* VERSION SELECTORS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label
              htmlFor={`first-version-${historyDesignId}`}
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              First Version
            </label>

            <select
              id={`first-version-${historyDesignId}`}
              value={firstVersionNumber ?? ""}
              disabled={isUpdating}
              onChange={(event) =>
                setFirstVersionNumber(
                  Number(event.target.value)
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            >
              {historyVersions.map((version) => (
                <option
                  key={version.id}
                  value={version.version_number}
                  disabled={
                    version.version_number ===
                    secondVersionNumber
                  }
                >
                  Version {version.version_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`second-version-${historyDesignId}`}
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              Second Version
            </label>

            <select
              id={`second-version-${historyDesignId}`}
              value={secondVersionNumber ?? ""}
              disabled={isUpdating}
              onChange={(event) =>
                setSecondVersionNumber(
                  Number(event.target.value)
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            >
              {historyVersions.map((version) => (
                <option
                  key={version.id}
                  value={version.version_number}
                  disabled={
                    version.version_number ===
                    firstVersionNumber
                  }
                >
                  Version {version.version_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SWAP VERSIONS */}

        <button
          type="button"
          className="filter-button"
          disabled={isUpdating}
          onClick={handleSwapVersions}
          style={{
            marginBottom: "16px",
          }}
        >
          ⇄ Swap Versions
        </button>

        {/* SIDE-BY-SIDE COLOR PREVIEWS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {[firstVersion, secondVersion].map(
            (version) => (
              <div
                key={version.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: 0,
                }}
              >
                <h5
                  style={{
                    marginTop: 0,
                    marginBottom: "10px",
                  }}
                >
                  Version {version.version_number}
                </h5>

                <div
                  role="img"
                  aria-label={`Version ${version.version_number} color ${version.color}`}
                  style={{
                    width: "100%",
                    height: "90px",
                    backgroundColor: version.color,
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />

                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  {version.garment}
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {version.color.toUpperCase()}
                </p>

                <p
                  style={{
                    fontSize: "12px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {version.created_at}
                </p>
              </div>
            )
          )}
        </div>

        {/* COMPARISON SUMMARY */}

        <div
          aria-live="polite"
          style={{
            padding: "12px",
            border: "1px solid #d8b4fe",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <strong>
            {changedFields.length} of{" "}
            {VERSION_FIELDS.length} properties changed
          </strong>

          <p
            style={{
              marginBottom: 0,
              fontSize: "13px",
            }}
          >
            {unchangedCount} unchanged properties
          </p>

          {changedFields.length === 0 && (
            <p>
              Both versions have identical design
              properties.
            </p>
          )}
        </div>

        {/* SHOW ONLY CHANGES */}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={showOnlyChanges}
            onChange={(event) =>
              setShowOnlyChanges(event.target.checked)
            }
          />

          Show only changed properties
        </label>

        {/* COMPARISON TABLE */}

        {comparisonFields.length === 0 ? (
          <p>No differences between these versions.</p>
        ) : (
          <div
            style={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <table
              aria-label="Design version comparison"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr>
                  <th
                    scope="col"
                    style={{
                      textAlign: "left",
                      padding: "10px 6px",
                      borderBottom: "2px solid #ddd",
                    }}
                  >
                    Property
                  </th>

                  <th
                    scope="col"
                    style={{
                      textAlign: "left",
                      padding: "10px 6px",
                      borderBottom: "2px solid #ddd",
                    }}
                  >
                    V{firstVersion.version_number}
                  </th>

                  <th
                    scope="col"
                    style={{
                      textAlign: "left",
                      padding: "10px 6px",
                      borderBottom: "2px solid #ddd",
                    }}
                  >
                    V{secondVersion.version_number}
                  </th>
                </tr>
              </thead>

              <tbody>
                {comparisonFields.map((field) => {
                  const firstValue =
                    firstVersion[field.key];

                  const secondValue =
                    secondVersion[field.key];

                  const changed =
                    firstValue !== secondValue;

                  return (
                    <tr
                      key={field.key}
                      style={{
                        backgroundColor: changed
                          ? "rgba(168, 85, 247, 0.12)"
                          : "transparent",
                      }}
                    >
                      <th
                        scope="row"
                        style={{
                          padding: "10px 6px",
                          textAlign: "left",
                          verticalAlign: "top",
                          borderBottom: "1px solid #ddd",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {field.label}

                        {changed && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "11px",
                              fontWeight: 700,
                              marginTop: "4px",
                            }}
                          >
                            Changed
                          </span>
                        )}
                      </th>

                      <td
                        style={{
                          padding: "10px 6px",
                          verticalAlign: "top",
                          borderBottom: "1px solid #ddd",
                          overflowWrap: "anywhere",
                          fontWeight: changed ? 600 : 400,
                        }}
                      >
                        {field.key === "color" && (
                          <div
                            aria-hidden="true"
                            style={{
                              width: "22px",
                              height: "22px",
                              backgroundColor: firstValue,
                              border: "1px solid #ccc",
                              borderRadius: "5px",
                              marginBottom: "5px",
                            }}
                          />
                        )}

                        {firstValue}
                      </td>

                      <td
                        style={{
                          padding: "10px 6px",
                          verticalAlign: "top",
                          borderBottom: "1px solid #ddd",
                          overflowWrap: "anywhere",
                          fontWeight: changed ? 600 : 400,
                        }}
                      >
                        {field.key === "color" && (
                          <div
                            aria-hidden="true"
                            style={{
                              width: "22px",
                              height: "22px",
                              backgroundColor: secondValue,
                              border: "1px solid #ccc",
                              borderRadius: "5px",
                              marginBottom: "5px",
                            }}
                          />
                        )}

                        {secondValue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          className="filter-button"
          onClick={resetComparison}
          style={{
            marginTop: "16px",
          }}
        >
          Close Comparison
        </button>
      </div>
    );
  }

  // ==========================================
  // VERSION HISTORY RENDER HELPER
  // ==========================================

  function renderVersionHistory(design: SavedDesign) {
    if (historyDesignId !== design.id) {
      return null;
    }

    return (
      <div
        className="design-version-history"
        style={{
          marginTop: "16px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "12px",
          minWidth: 0,
        }}
      >
        <h4>Version History</h4>

        <p>
          {historyVersions.length} saved version(s)
        </p>

        {historyLoading && (
          <p role="status">Loading version history...</p>
        )}

        {historyError && (
          <p className="design-error" role="alert">
            {historyError}
          </p>
        )}

        {!historyLoading &&
          !historyError &&
          historyVersions.length === 0 && (
            <p>No versions available.</p>
          )}

        {/* COMPARE VERSIONS BUTTON */}

        {!historyLoading &&
          !historyError &&
          historyVersions.length >= 2 && (
            <button
              type="button"
              className="primary-button"
              disabled={isUpdating}
              aria-expanded={showComparison}
              onClick={handleCompareVersions}
              style={{
                marginBottom: "16px",
                width: "100%",
              }}
            >
              {showComparison
                ? "Hide Comparison"
                : "⇄ Compare Versions"}
            </button>
          )}

        {!historyLoading &&
          !historyError &&
          historyVersions.length === 1 && (
            <p
              style={{
                fontSize: "13px",
                opacity: 0.8,
              }}
            >
              Save another version of this design to
              enable version comparison.
            </p>
          )}

        {/* VERSION COMPARISON PANEL */}

        {!historyLoading &&
          !historyError &&
          renderVersionComparison()}

        {/* VERSION HISTORY CARDS */}

        {!historyLoading &&
          historyVersions.map((version, index) => {
            const previousVersion =
              historyVersions[index + 1];

            const isLatest = index === 0;

            return (
              <div
                key={version.id}
                className="design-version-card"
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "12px",
                }}
              >
                <h5>
                  Version {version.version_number}
                  {isLatest ? " (Latest)" : ""}
                </h5>

                <p>
                  <strong>Saved:</strong>{" "}
                  {version.created_at}
                </p>

                <div
                  style={{
                    width: "45px",
                    height: "45px",
                    backgroundColor: version.color,
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                  role="img"
                  aria-label={`Version color ${version.color}`}
                />

                {VERSION_FIELDS.map((field) => {
                  const value = version[field.key];

                  const changed =
                    previousVersion !== undefined &&
                    value !== previousVersion[field.key];

                  return (
                    <p key={field.key}>
                      <strong>{field.label}:</strong>{" "}
                      {value}

                      {changed && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontWeight: "bold",
                          }}
                        >
                          (Changed from{" "}
                          {previousVersion[field.key]})
                        </span>
                      )}
                    </p>
                  );
                })}

                <button
                  type="button"
                  className="primary-button"
                  disabled={isUpdating}
                  onClick={() =>
                    void handleRestoreVersion(
                      design.id,
                      version.version_number
                    )
                  }
                >
                  {restoringVersion ===
                  version.version_number
                    ? "Restoring..."
                    : `Restore Version ${version.version_number}`}
                </button>
              </div>
            );
          })}
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <section className="saved-designs">
      <div className="saved-designs-header">
        <span className="eyebrow">
          YOUR FASHION COLLECTION
        </span>

        <h2>My Saved Designs</h2>

        <p>
          Explore, duplicate, customize, compare,
          restore, export, and share your creations.
        </p>
      </div>

      {/* FILTER BUTTONS */}

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

      {/* SEARCH AND SORT */}

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
          <option value="name">
            Garment Name (A-Z)
          </option>
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

          Loading your fashion collection...
        </div>
      )}

      {/* LOAD ERROR */}

      {!isLoading && loadError && (
        <div
          className="saved-design-error"
          role="alert"
        >
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
              Create your first fashion design in
              the studio above.
            </p>
          </div>
        )}

      {!isLoading &&
        !loadError &&
        designs.length > 0 &&
        filteredDesigns.length === 0 && (
          <div className="saved-designs-empty">
            <h3>No matching designs</h3>

            <p>
              Try changing your search or filters.
            </p>

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
              const isFavorite = Boolean(
                design.is_favorite
              );

              return (
                <article
                  key={design.id}
                  className="saved-design-card"
                >
                  <div
                    className="saved-design-color"
                    style={{
                      backgroundColor: design.color,
                    }}
                    role="img"
                    aria-label={`Design color ${design.color}`}
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
                      <strong>Pattern:</strong>{" "}
                      {design.pattern}
                    </p>

                    <p>
                      <strong>Color:</strong>{" "}
                      {design.color.toUpperCase()}
                    </p>

                    <p>
                      <strong>Size:</strong>{" "}
                      {design.size}
                    </p>

                    <p>
                      <strong>Fit:</strong>{" "}
                      {design.fit}
                    </p>

                    {["Dress", "Shirt", "Jacket"].includes(
                      design.garment
                    ) && (
                      <p>
                        <strong>Sleeves:</strong>{" "}
                        {design.sleeve_length}
                      </p>
                    )}

                    <p>
                      <strong>Description:</strong>{" "}
                      {design.description}
                    </p>

                    <p>
                      <strong>Created:</strong>{" "}
                      {design.created_at}
                    </p>
                  </div>

                  {/* ACTION BUTTONS */}

                  <div className="saved-design-actions">
                    <button
                      type="button"
                      className={`favorite-button ${
                        isFavorite
                          ? "is-favorite"
                          : ""
                      }`}
                      aria-pressed={isFavorite}
                      disabled={isUpdating}
                      onClick={() =>
                        void handleToggleFavorite(
                          design
                        )
                      }
                    >
                      {updatingFavoriteId === design.id
                        ? "Updating..."
                        : isFavorite
                          ? "♥ Favorited"
                          : "♡ Favorite"}
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      disabled={isUpdating}
                      onClick={() =>
                        handleLoadDesign(design)
                      }
                    >
                      Load in Studio
                    </button>

                    <button
                      type="button"
                      className="download-button"
                      disabled={isUpdating}
                      onClick={() =>
                        void handleDuplicateDesign(
                          design
                        )
                      }
                    >
                      {duplicatingId === design.id
                        ? "Duplicating..."
                        : "⧉ Duplicate Design"}
                    </button>

                    {/* VERSION HISTORY BUTTON */}

                    <button
                      type="button"
                      className="download-button"
                      disabled={isUpdating}
                      aria-expanded={
                        historyDesignId === design.id
                      }
                      onClick={() =>
                        void handleViewHistory(
                          design.id
                        )
                      }
                    >
                      {historyDesignId === design.id
                        ? "Hide Version History"
                        : "View Version History"}
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
                        void handleDeleteDesign(
                          design.id
                        )
                      }
                    >
                      {deletingId === design.id
                        ? "Deleting..."
                        : "Delete Design"}
                    </button>
                  </div>

                  {/* VERSION HISTORY PANEL */}

                  {renderVersionHistory(design)}
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
              rows={10}
              aria-label="Design details to share"
              onFocus={(event) =>
                event.target.select()
              }
            />

            <div className="share-dialog-actions">
              {typeof navigator.share ===
                "function" && (
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
          </div>
        </div>
      )}
    </section>
  );
}
