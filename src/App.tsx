// src/App.tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import theme from "./theme";
import Home from "./Pages/Home";
import Rooms from "./Pages/Rooms";
import RoomDetail from "./Pages/RoomDetail";
import GameInProgress from "./Pages/GameInProgress";
import PurchasedCartons from "./Pages/PurchasedCartons";
import Profile from "./Pages/Profile";
import TabBar from "./Components/TabBar";
import Header from "./Components/Header";
import Register from "./Pages/Register";
import WalletPage from "./Pages/WalletPage";
import Login from "./Pages/Login";
import ProtectedRoute from "./Components/ProtectedRoute";
import { GameProvider } from "./contexts/GameContext";
import RecoverPassword from "./Pages/RecoverPassword";
import RecoverPasswordContact from "./Pages/RecoverPasswordContact";

function NotFound() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>404 — Página no encontrada</h2>
      <p>La ruta que intentas abrir no existe.</p>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const hideTabBar = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/contact-us";

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><RoomDetail /></ProtectedRoute>} />
        <Route path="/game/:roomId" element={<ProtectedRoute><GameInProgress /></ProtectedRoute>} />
        <Route path="/purchased-cartons" element={<ProtectedRoute><PurchasedCartons /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact-us" element={<RecoverPasswordContact />} />
        <Route path="/recover-password" element={<RecoverPassword />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      {!hideTabBar && <TabBar />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GameProvider>
        <AppContent />
      </GameProvider>
    </ThemeProvider>
  );
}
