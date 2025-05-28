import "./App.css";
import HomePage from "./pages/Homepage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ItemListPage from "./pages/ItemListPage";
function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />}></Route>
          <Route path="/items" element={<ItemListPage />}></Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
