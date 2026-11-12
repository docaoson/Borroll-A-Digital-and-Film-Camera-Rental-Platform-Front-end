import { useCallback, useMemo, useState } from "react";
import { RentalSelectionContext } from "./rental-selection-context";

export function RentalSelectionProvider({ children }) {
  const [branchSlug, setBranchSlug] = useState("tay-ho");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [items, setItems] = useState([]);
  const [addons, setAddons] = useState([]);

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

