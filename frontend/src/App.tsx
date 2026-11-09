import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppShell } from './components/AppShell';
import { LoadingState } from './components/Feedback';
import { AdminPage } from './pages/AdminPage';
import { ClassifyPage } from './pages/ClassifyPage';
import { GuidancePage } from './pages/GuidancePage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MapPage } from './pages/MapPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReportPage } from './pages/ReportPage';

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Checking your account…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  if (!user.is_staff) return <Navigate to="/" replace />;
  return <AdminPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="classify" element={<ClassifyPage />} />
        <Route path="guidance" element={<GuidancePage />} />
        <Route path="guidance/:slug" element={<GuidancePage />} />
        <Route path="reports/new" element={<ReportPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="admin" element={<AdminRoute />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;