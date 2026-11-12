import { useCallback, useEffect, useMemo, useState } from "react";
import { RentalSelectionContext } from "./rental-selection-context";

const STORAGE_KEY = "borroll_rental_selection";

function getInitialState() {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return {
      branchSlug: "tay-ho",
      startDate: "",
      endDate: "",
      items: [],
      addons: [],
    };
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        branchSlug: "tay-ho",
        startDate: "",
        endDate: "",
        items: [],
        addons: [],
      };
    }

    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      return {
        branchSlug: "tay-ho",
        startDate: "",
        endDate: "",
        items: [],
        addons: [],
      };
    }

    return {
      branchSlug:
        typeof data.branchSlug === "string" && data.branchSlug.trim() !== ""
          ? data.branchSlug
          : "tay-ho",
      startDate:
        typeof data.startDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(data.startDate)
          ? data.startDate
          : "",
      endDate:
        typeof data.endDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(data.endDate)
          ? data.endDate
          : "",
      items: Array.isArray(data.items)
        ? data.items.filter(
            (it) =>
              it &&
              typeof it === "object" &&
              typeof it.modelId === "string" &&
              it.modelId.trim() !== "",
          )
        : [],
      addons: Array.isArray(data.addons)
        ? data.addons.filter(
            (a) =>
              a &&
              typeof a === "object" &&
              typeof a.filmProductId === "string" &&
              Number(a.quantity) > 0,
          )
        : [],
    };
  } catch {
    return {
      branchSlug: "tay-ho",
      startDate: "",
      endDate: "",
      items: [],
      addons: [],
    };
  }
}

export function RentalSelectionProvider({ children }) {
  const [initial] = useState(getInitialState);
  const [branchSlug, setBranchSlug] = useState(initial.branchSlug);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [items, setItems] = useState(initial.items);
  const [addons, setAddons] = useState(initial.addons);

  // Sync state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            branchSlug,
            startDate,
            endDate,
            items,
            addons,
          }),
        );
      }
    } catch {
      // Ignore quota errors safely
    }
  }, [branchSlug, startDate, endDate, items, addons]);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      if (prev.some((existing) => existing.modelId === item.modelId)) {
        return prev;
      }
      return [
        ...prev,
        {
          modelId: item.modelId,
          slug: item.slug,
          name: item.name,
          kind: item.kind || "CAMERA",
          mount: item.mount ?? null,
          thumbnailUrl: item.thumbnailUrl ?? null,
          pricePerDay: item.pricePerDay ?? 0,
          deposit: item.deposit ?? 0,
          brandName: item.brandName ?? null,
          categoryName: item.categoryName ?? null,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((modelId) => {
    setItems((prev) => prev.filter((item) => item.modelId !== modelId));
  }, []);

  const setAddonQuantity = useCallback((filmProductId, quantity) => {
    const safeQty = Math.max(0, Number(quantity) || 0);
    setAddons((prev) => {
      const rest = prev.filter((a) => a.filmProductId !== filmProductId);
      if (safeQty === 0) return rest;
      return [...rest, { filmProductId, quantity: safeQty }];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setItems([]);
    setAddons([]);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      branchSlug,
      startDate,
      endDate,
      items,
      addons,
      setBranchSlug,
      setStartDate,
      setEndDate,
      addItem,
      removeItem,
      setAddonQuantity,
      clearSelection,
    }),
    [
      branchSlug,
      startDate,
      endDate,
      items,
      addons,
      addItem,
      removeItem,
      setAddonQuantity,
      clearSelection,
    ],
  );

  return (
    <RentalSelectionContext.Provider value={value}>
      {children}
    </RentalSelectionContext.Provider>
  );
}
