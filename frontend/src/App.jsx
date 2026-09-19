import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import ContractLibraryPage from "./pages/ContractLibraryPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import RenewalPage from "./pages/RenewalPage";
import UploadPage from "./pages/UploadPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/contracts" element={
              <ProtectedRoute allowedRoles={["admin", "procurement", "legal"]}>
                <ContractLibraryPage />
              </ProtectedRoute>
            } />

            <Route path="/contracts/:id" element={
              <ProtectedRoute allowedRoles={["admin", "procurement", "legal"]}>
                <ContractDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={["admin", "procurement", "legal"]}>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/chat" element={
              <ProtectedRoute allowedRoles={["admin", "procurement", "legal"]}>
                <ChatPage />
              </ProtectedRoute>
            } />

            <Route path="/renewals" element={
              <ProtectedRoute allowedRoles={["admin", "procurement", "legal"]}>
                <RenewalPage />
              </ProtectedRoute>
            } />

            <Route path="/upload" element={
              <ProtectedRoute allowedRoles={["admin", "procurement"]}>
                <UploadPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;