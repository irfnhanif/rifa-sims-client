import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import HomePage from "./pages/Homepage";
import ItemListPage from "./pages/items/ItemListPage";
import AddItemPage from "./pages/items/AddItemPage";
import EditItemPage from "./pages/items/EditItemPage";
import EditStockPage from "./pages/stocks/EditStockPage";
import ItemDetailPage from "./pages/stocks/ItemDetailPage";
import ScanBarcodePage from "./pages/barcode/ScanBarcodePage";
import InputDataPage from "./pages/barcode/InputDataPage";
import ChooseItemPage from "./pages/barcode/ChooseItemPage";
import ScanHistoryPage from "./pages/barcode/ScanHistoryPage";
import StockChangeHistoryPage from "./pages/audit-logs/StockChangeHistoryPage";
import AllStocksPage from "./pages/stocks/AllStocksPage";
import NearEmptyStocksPage from "./pages/stocks/NearEmptyStocksPage";
import LoginPage from "./pages/auth/LoginPage";
import { AuthProvider } from "./helper/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: parseInt(import.meta.env.VITE_REACT_QUERY_STALE_TIME),
      gcTime: parseInt(import.meta.env.VITE_REACT_QUERY_CACHE_TIME),
      retry: parseInt(import.meta.env.VITE_REACT_QUERY_RETRY_ATTEMPTS),
      refetchOnWindowFocus: import.meta.env
        .VITE_REACT_QUERY_REFETCH_ON_WINDOW_FOCUS,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute />}>
              {/* Homepage */}
              <Route index element={<HomePage />} />

              {/* Items Routes */}
              <Route path="items">
                <Route index element={<ItemListPage />} />
                <Route path="add" element={<AddItemPage />} />
                <Route path=":id/edit" element={<EditItemPage />} />
              </Route>

              {/* Stocks Routes */}
              <Route path="stocks">
                <Route index element={<AllStocksPage />} />
                <Route path=":id/edit" element={<EditStockPage />} />
                <Route path=":id/detail" element={<ItemDetailPage />} />
              </Route>

              {/* Other Protected Routes */}
              <Route
                path="near-empty-stocks"
                element={<NearEmptyStocksPage />}
              />

              {/* Scan Routes */}
              <Route path="scan">
                <Route index element={<ScanBarcodePage />} />
                <Route path="choose-item" element={<ChooseItemPage />} />
                <Route path=":id/input" element={<InputDataPage />} />
                <Route path="history" element={<ScanHistoryPage />} />
              </Route>

              <Route
                path="stock-change-history"
                element={<StockChangeHistoryPage />}
              />
            </Route>
          </Routes>
        </Router>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
