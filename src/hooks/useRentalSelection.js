import { useContext } from "react";
import { RentalSelectionContext } from "../contexts/rental-selection-context";

export function useRentalSelection() {
  const context = useContext(RentalSelectionContext);
  if (!context) {
    throw new Error(
      "useRentalSelection phải được sử dụng bên trong RentalSelectionProvider.",
    );
  }
  return context;
}

