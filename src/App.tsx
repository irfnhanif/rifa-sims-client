import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
import RegisterPage from "./pages/auth/RegisterPage";
import ProfilePage from "./pages/users/ProfilePage";
import EditProfilePage from "./pages/users/EditProfilePage";
import UserListPage from "./pages/users/UserListPage";
import NotFoundPage from "./pages/NotFoundPage";

import { AuthProvider } from "./helper/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { UserRole } from "./types/user-role";

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
            <Route path="/auth">
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            <Route path="/" element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />

              <Route path="items">
                <Route index element={<ItemListPage />} />
                <Route
                  path="add"
                  element={
                    <RoleProtectedRoute allowedRoles={[UserRole.OWNER]}>
                      <AddItemPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path=":id/edit"
                  element={
                    <RoleProtectedRoute allowedRoles={[UserRole.OWNER]}>
                      <EditItemPage />
                    </RoleProtectedRoute>
                  }
                />
              </Route>

              <Route path="stocks">
                <Route index element={<AllStocksPage />} />
                <Route
                  path=":id/edit"
                  element={
                    <RoleProtectedRoute allowedRoles={[UserRole.OWNER]}>
                      <EditStockPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route path=":id/detail" element={<ItemDetailPage />} />
              </Route>

              <Route
                path="near-empty-stocks"
                element={
                  <RoleProtectedRoute allowedRoles={[UserRole.OWNER]}>
                    <NearEmptyStocksPage />
                  </RoleProtectedRoute>
                }
              />

              <Route path="scan">
                <Route index element={<ScanBarcodePage />} />
                <Route path="choose-item" element={<ChooseItemPage />} />
                <Route path=":id/input" element={<InputDataPage />} />
                <Route path="history" element={<ScanHistoryPage />} />
              </Route>

              <Route
                path="stock-change-history"
                element={
                  <RoleProtectedRoute allowedRoles={[UserRole.OWNER]}>
                    <StockChangeHistoryPage />
                  </RoleProtectedRoute>
                }
              />

              <Route path="users">
                <Route
                  index
                  element={
                    <RoleProtectedRoute allowedRoles={[UserRole.OWNER]}>
                      <UserListPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route path="profile">
                  <Route index element={<ProfilePage />} />
                  <Route path="edit" element={<EditProfilePage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
