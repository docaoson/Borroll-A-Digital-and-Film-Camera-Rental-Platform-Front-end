import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RentalSelectionProvider } from "./contexts/RentalSelectionContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RentalSelectionProvider>
          <AppRoutes />
        </RentalSelectionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
