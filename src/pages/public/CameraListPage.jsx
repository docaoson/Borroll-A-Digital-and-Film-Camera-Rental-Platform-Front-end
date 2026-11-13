import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { catalogService } from "../../services/catalogService";

const sanitizeNumericInput = (value) => value.replace(/[^0-9]/g, "");

const PAGE_SIZE = 9;

function formatCameraType(type) {
  switch (type) {
    case "FILM":
      return "Máy ảnh Film";
    case "DIGITAL":
      return "Máy ảnh Digital";
    case "INSTANT":
      return "Máy chụp lấy liền";
    default:
      return type || "Thiết bị";
  }
}

function FavoriteToggle({ modelId, isFavorite, onToggle }) {
  const [pending, setPending] = useState(false);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (pending || !modelId) return;
    setPending(true);
    try {
      await onToggle(modelId, !isFavorite);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className={`favorite-toggle ${isFavorite ? "active" : ""}`}
      onClick={handleClick}
      aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      disabled={pending}
      title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
    >
      {pending ? "…" : isFavorite ? "♥" : "♡"}
    </button>
  );
}

function CameraCardSkeleton() {
  return (
    <div className="camera-card camera-card-skeleton" aria-hidden="true">
      <div className="skeleton-image" />
      <div className="camera-body">
        <div className="skeleton-line skeleton-meta" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-desc" />
        <div className="skeleton-line skeleton-footer" />
      </div>
    </div>
  );
}

function CameraListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL query parameters
  const initialQ = searchParams.get("q") || "";
  const initialCategories = searchParams.get("category")
    ? searchParams
        .get("category")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const initialBrands = searchParams.get("brand")
    ? searchParams
        .get("brand")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialSort = searchParams.get("sort") || "default";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);
  const [selectedCategories, setSelectedCategories] =
    useState(initialCategories);
  const [selectedBrands, setSelectedBrands] = useState(initialBrands);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(initialMinPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(
    Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1,
  );

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  const categoryParam = selectedCategories.join(",");
  const brandParam = selectedBrands.join(",");

  const queryKey = `${debouncedSearch}|${categoryParam}|${brandParam}|${debouncedMinPrice}|${debouncedMaxPrice}|${sortBy}|${currentPage}|${reloadKey}`;

  const [resultState, setResultState] = useState({
    key: null,
    items: [],
    total: 0,
    error: "",
  });

  const isLoading = resultState.key !== queryKey;
  const modelsResult = {
    items: resultState.items,
    total: resultState.total,
  };
  const loadError = resultState.error;

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounce price filter inputs (400ms) to avoid spamming network requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 400);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);

  // Validate price range (from <= to)
  const minNum = debouncedMinPrice ? Number(debouncedMinPrice) : null;
  const maxNum = debouncedMaxPrice ? Number(debouncedMaxPrice) : null;
  const isPriceRangeInvalid = Boolean(
    minNum !== null && maxNum !== null && minNum > maxNum,
  );
  const priceErrorMessage = isPriceRangeInvalid
    ? "Giá từ không được lớn hơn giá đến"
    : null;

  const handleMinPriceChange = (val) => {
    const clean = sanitizeNumericInput(val);
    if (clean.length > 9) return;
    if (clean && Number(clean) > 100_000_000) return;
    setMinPrice(clean);
    setCurrentPage(1);
  };

  const handleMaxPriceChange = (val) => {
    const clean = sanitizeNumericInput(val);
    if (clean.length > 9) return;
    if (clean && Number(clean) > 100_000_000) return;
    setMaxPrice(clean);
    setCurrentPage(1);
  };

  // Load categories and brands on mount
  useEffect(() => {
    let active = true;
    Promise.all([catalogService.getCategories(), catalogService.getBrands()])
      .then(([catRes, brandRes]) => {
        if (!active) return;
        setCategories(catRes?.items || []);
        setBrands(brandRes?.items || []);
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
        setBrands([]);
      });

    return () => {
      active = false;
    };
  }, []);

  // Synchronize state changes to URL search params (debounced)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedCategories.length > 0)
      params.set("category", selectedCategories.join(","));
    if (selectedBrands.length > 0) params.set("brand", selectedBrands.join(","));
    if (debouncedMinPrice) params.set("minPrice", debouncedMinPrice);
    if (debouncedMaxPrice) params.set("maxPrice", debouncedMaxPrice);
    if (sortBy && sortBy !== "default") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", String(currentPage));

    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    selectedCategories,
    selectedBrands,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy,
    currentPage,
    setSearchParams,
  ]);

  // Fetch catalog items when filters change
  useEffect(() => {
    // If user enters invalid price range (from > to), don't trigger search
    if (isPriceRangeInvalid) {
      setResultState({
        key: queryKey,
        items: [],
        total: 0,
        error: "Khoảng giá lọc không hợp lệ: Giá từ không được lớn hơn giá đến.",
      });
      return;
    }

    let active = true;

    catalogService
      .getModels({
        q: debouncedSearch || undefined,
        category: categoryParam || undefined,
        brand: brandParam || undefined,
        minPrice: debouncedMinPrice || undefined,
        maxPrice: debouncedMaxPrice || undefined,
        sort: sortBy,
        page: currentPage,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (!active) return;
        setResultState({
          key: queryKey,
          items: res.items || [],
          total: res.total ?? (res.items?.length || 0),
          error: "",
        });
      })
      .catch(() => {
        if (!active) return;
        setResultState({
          key: queryKey,
          items: [],
          total: 0,
          error: "Không thể tải danh sách thiết bị. Vui lòng thử lại.",
        });
      });

    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    categoryParam,
    brandParam,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy,
    currentPage,
    reloadKey,
    queryKey,
    isPriceRangeInvalid,
  ]);

  const handleToggleFavorite = async (modelId, shouldFavorite) => {
    if (!modelId) return;
    try {
      await catalogService.toggleFavorite(modelId, shouldFavorite);
      setResultState((current) => ({
        ...current,
        items: current.items.map((camera) =>
          camera.id === modelId
            ? { ...camera, isFavorite: shouldFavorite }
            : camera,
        ),
      }));
    } catch {
      // Toggle favorite rollback
    }
  };

  const toggleCategorySlug = (slug) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
    setCurrentPage(1);
  };

  const toggleBrandSlug = (slug) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(modelsResult.total / PAGE_SIZE));

  const flatCategories = useMemo(() => {
    const list = [];
    for (const root of categories) {
      list.push(root);
      if (Array.isArray(root.children)) {
        for (const child of root.children) {
          list.push(child);
        }
      }
    }
    return list;
  }, [categories]);

  return (
    <div className="collection-page">
      <div className="container collection-shell">
        <div className="collection-layout">
          {/* CỘT TRÁI: BỘ LỌC (Cấu trúc theo ảnh 2) */}
          <aside className="filters-sidebar" aria-label="Bộ lọc tìm kiếm">
            {/* Phân loại / Danh mục */}
            <div className="sidebar-filter-group">
              <h3>Phân loại</h3>
              <div className="filter-check-list">
                {flatCategories.length === 0 ? (
                  <p className="hint-text">Đang tải phân loại...</p>
                ) : (
                  flatCategories.map((cat) => {
                    const checked = selectedCategories.includes(cat.slug);
                    return (
                      <label
                        key={cat.slug}
                        className={`filter-check-item ${checked ? "active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategorySlug(cat.slug)}
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Thương hiệu */}
            <div className="sidebar-filter-group">
              <h3>Thương hiệu</h3>
              <div className="filter-check-list">
                {brands.length === 0 ? (
                  <p className="hint-text">Đang tải thương hiệu...</p>
                ) : (
                  brands.map((brand) => {
                    const checked = selectedBrands.includes(brand.slug);
                    return (
                      <label
                        key={brand.slug}
                        className={`filter-check-item ${checked ? "active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBrandSlug(brand.slug)}
                        />
                        <span>{brand.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Khoảng giá */}
            <div className="sidebar-filter-group">
              <h3>Khoảng giá (VNĐ)</h3>
              <div className="price-range-inputs">
                <div>
                  <label htmlFor="min-price">Từ (₫)</label>
                  <input
                    id="min-price"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={9}
                    className={isPriceRangeInvalid ? "price-input-error" : ""}
                    value={minPrice}
                    placeholder="0"
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="max-price">Đến (₫)</label>
                  <input
                    id="max-price"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={9}
                    className={isPriceRangeInvalid ? "price-input-error" : ""}
                    value={maxPrice}
                    placeholder="2.000.000"
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                  />
                </div>
              </div>
              {priceErrorMessage && (
                <p className="price-error-hint" role="alert">
                  ⚠️ {priceErrorMessage}
                </p>
              )}
            </div>

            <button
              type="button"
              className="button secondary-button full-width"
              onClick={resetAllFilters}
            >
              Đặt lại bộ lọc
            </button>
          </aside>

          {/* CỘT PHẢI: TOOLBAR + DANH SÁCH SẢN PHẨM (Cấu trúc theo ảnh 2) */}
          <div className="collection-main">
            <header className="collection-toolbar">
              <div className="collection-toolbar-title">
                <h1>Thiết bị</h1>
                <p className="collection-result-count">
                  {isLoading
                    ? "Đang tìm kiếm..."
                    : `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                        currentPage * PAGE_SIZE,
                        modelsResult.total,
                      )} trong số ${modelsResult.total} thiết bị`}
                </p>
              </div>

              <div className="collection-toolbar-controls">
                <div className="toolbar-search">
                  <input
                    id="camera-search"
                    type="text"
                    value={searchInput}
                    placeholder="Tìm theo tên máy hoặc hãng..."
                    aria-label="Tìm kiếm máy ảnh"
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="toolbar-sort">
                  <label htmlFor="sort-by">Sắp xếp</label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="default">Mặc định</option>
                    <option value="price_asc">Giá thấp đến cao</option>
                    <option value="price_desc">Giá cao đến thấp</option>
                    <option value="newest">Mới nhất</option>
                  </select>
                </div>
              </div>
            </header>

            {/* NỘI DUNG DANH SÁCH */}
            {isLoading ? (
              <section
                className="camera-grid"
                aria-label="Đang tải danh sách thiết bị"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <CameraCardSkeleton key={i} />
                ))}
              </section>
            ) : loadError ? (
              <div className="empty-state error-state">
                <h2>Không thể tải dữ liệu</h2>
                <p>{loadError}</p>
                <button
                  type="button"
                  className="button primary-button"
                  onClick={() => setReloadKey((k) => k + 1)}
                >
                  Thử lại
                </button>
              </div>
            ) : modelsResult.items.length === 0 ? (
              <div className="empty-state">
                <h2>Không tìm thấy thiết bị phù hợp</h2>
                <p>
                  Hãy thử thay đổi từ khóa tìm kiếm, chọn lại phân loại hoặc điều
                  chỉnh khoảng giá.
                </p>
                <button
                  type="button"
                  className="button primary-button"
                  onClick={resetAllFilters}
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <section
                  className="camera-grid"
                  aria-label="Danh sách thiết bị máy ảnh"
                >
                  {modelsResult.items.map((camera, index) => {
                    const hasBranches =
                      Array.isArray(camera.availableAtBranches) &&
                      camera.availableAtBranches.length > 0;

                    return (
                      <article
                        key={camera.id}
                        className="camera-card collection-card clickable-card"
                        onClick={() => navigate(`/cameras/${camera.slug}`)}
                      >
                        {/* THUMBNAIL */}
                        <div className="camera-card-media">
                          {camera.thumbnailUrl ? (
                            <img
                              src={camera.thumbnailUrl}
                              alt={camera.name}
                              className="camera-card-image"
                              loading={index < 4 ? "eager" : "lazy"}
                              fetchPriority={index < 4 ? "high" : "low"}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback =
                                  e.currentTarget.parentElement?.querySelector(
                                    ".camera-image-fallback",
                                  );
                                if (fallback) fallback.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <div
                            className={`camera-image-fallback ${
                              camera.thumbnailUrl ? "hidden" : ""
                            }`}
                          >
                            <span className="fallback-category">
                              {camera.category?.name || "Máy ảnh"}
                            </span>
                          </div>
                        </div>

                        {/* CARD BODY */}
                        <div className="camera-body">
                          <div className="camera-card-header">
                            <span className="camera-category">
                              {camera.category?.name || "Máy ảnh"}
                            </span>
                            <FavoriteToggle
                              modelId={camera.id}
                              isFavorite={Boolean(camera.isFavorite)}
                              onToggle={handleToggleFavorite}
                            />
                          </div>

                          <h3 className="camera-card-title">{camera.name}</h3>

                          <div className="camera-meta-tags">
                            <span className="camera-brand-tag">
                              {camera.brand?.name || "Máy ảnh"}
                            </span>
                            <span className="meta-separator">·</span>
                            <span className="camera-type-tag">
                              {formatCameraType(camera.cameraType)}
                            </span>
                          </div>

                          <div className="camera-availability-row">
                            {hasBranches ? (
                              <span className="status-badge success">
                                ● Sẵn sàng thuê (
                                {camera.availableAtBranches.length} chi nhánh)
                              </span>
                            ) : (
                              <span className="status-badge neutral">
                                ○ Đang cập nhật kho
                              </span>
                            )}
                          </div>

                          <div className="camera-footer">
                            <div className="camera-price-block">
                              <span className="price-label">Giá thuê theo ngày</span>
                              <strong className="camera-price">
                                {camera.pricePerDay.toLocaleString("vi-VN")} ₫
                                <small>/ngày</small>
                              </strong>
                              {camera.deposit ? (
                                <span className="camera-deposit-hint">
                                  Cọc: {camera.deposit.toLocaleString("vi-VN")} ₫
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <nav
                    className="pagination-nav"
                    aria-label="Phân trang danh mục"
                  >
                    <button
                      type="button"
                      className="pagination-btn prev-btn"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 200, behavior: "smooth" });
                      }}
                      aria-label="Trang trước"
                    >
                      ← Trước
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            className={`pagination-num-btn ${
                              pageNum === currentPage ? "active" : ""
                            }`}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 200, behavior: "smooth" });
                            }}
                            aria-label={`Trang ${pageNum}`}
                            aria-current={
                              pageNum === currentPage ? "page" : undefined
                            }
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="pagination-btn next-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 200, behavior: "smooth" });
                      }}
                      aria-label="Trang tiếp theo"
                    >
                      Sau →
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraListPage;
