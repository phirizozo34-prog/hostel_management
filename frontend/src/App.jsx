import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Rooms       from './pages/Rooms';
import Bookings    from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Students    from './pages/Students';
import Profile     from './pages/Profile';

// Layout wrapper that includes the sidebar
function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes with sidebar layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/rooms"       element={<Rooms />} />
            <Route path="/bookings"    element={<Bookings />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/profile"     element={<Profile />} />
            <Route
              path="/students"
              element={
                <ProtectedRoute adminOnly>
                  <Students />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
