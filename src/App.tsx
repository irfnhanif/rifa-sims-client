import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider, } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import HomePage from "./pages/Homepage";
import ItemListPage from "./pages/ItemListPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: parseInt(import.meta.env.REACT_QUERY_STALE_TIME),
      gcTime: parseInt(import.meta.env.REACT_QUERY_CACHE_TIME),
      retry: parseInt(import.meta.env.REACT_QUERY_RETRY_ATTEMPTS),
      refetchOnWindowFocus: import.meta.env.REACT_QUERY_REFETCH_ON_WINDOW_FOCUS,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />}></Route>
          <Route path="/items" element={<ItemListPage />}></Route>
        </Routes>
      </Router>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false}/>}
    </QueryClientProvider>
  );
}

export default App;
