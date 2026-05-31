import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import AnimalsPage from "./pages/AnimalsPage";
import ProceduresPage from "./pages/ProceduresPage";
import HistoryPage from "./pages/HistoryPage";

function ProtectedRoute({ children }) {
  const { hasAnimals } = useAppContext();
  return hasAnimals ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="animals" element={<ProtectedRoute><AnimalsPage /></ProtectedRoute>} />
        <Route path="procedures" element={<ProtectedRoute><ProceduresPage /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}