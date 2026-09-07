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
import AboutPage from "./pages/AboutPage";
import UploadPage from "./pages/UploadPage";
import EvaluationPage from "./pages/EvaluationPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route path="/contracts" element={
              <ProtectedRoute><ContractLibraryPage /></ProtectedRoute>
            } />
            <Route path="/contracts/:id" element={
              <ProtectedRoute><ContractDetailPage /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute><ChatPage /></ProtectedRoute>
            } />
            <Route path="/renewals" element={
              <ProtectedRoute><RenewalPage /></ProtectedRoute>
            } />
            <Route path="/evaluate" element={
              <ProtectedRoute><EvaluationPage /></ProtectedRoute>
            } />
            
            {/* Upload is restricted to admin or procurement roles, not legal */}
            <Route path="/upload" element={
              <ProtectedRoute><UploadPage /></ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;