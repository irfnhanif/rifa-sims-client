import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import HomePage from "./pages/Homepage";
import ItemListPage from "./pages/items/ItemListPage";
import AddItemPage from "./pages/items/AddItemPage";
import EditItemPage from "./pages/items/EditItemPage";
import StockListPage from "./pages/stocks/StockListPage";
import EditStockPage from "./pages/stocks/EditStockPage";
import ItemDetailPage from "./pages/stocks/ItemDetailPage";
import ScanBarcodePage from "./pages/barcode/ScanBarcodePage";
import InputDataPage from "./pages/barcode/InputDataPage";
import ChooseItemPage from "./pages/barcode/ChooseItemPage";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/items">
            <Route index element={<ItemListPage />} />
            <Route path="add" element={<AddItemPage />} />
            <Route path=":id/edit" element={<EditItemPage />} />
          </Route>
          <Route path="/stocks">
            <Route index element={<StockListPage />}/>
            <Route path=":id/edit" element={<EditStockPage />} />
            <Route path=":id/detail" element={<ItemDetailPage />} />
          </Route>
          <Route path="/scan">
            <Route index element={<ScanBarcodePage />} />
            <Route path="choose-item" element={<ChooseItemPage />} />
            <Route path=":id/input" element={<InputDataPage />} />
          </Route>
        </Routes>
      </Router>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
