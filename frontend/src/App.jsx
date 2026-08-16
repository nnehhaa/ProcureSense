import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./components/Layout";

import Landing from "./pages/Landing";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import RenewalPage from "./pages/RenewalPage";
import AboutPage from "./pages/AboutPage";
import UploadPage from "./pages/UploadPage";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/chat"
            element={<ChatPage />}
          />

          <Route
            path="/renewals"
            element={<RenewalPage />}
          />

          <Route
            path="/about"
            element={<AboutPage />}
          />
          <Route
            path="/upload"
            element={<UploadPage />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;