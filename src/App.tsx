// src/App.tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Routes, Route, Navigate } from "react-router-dom";
import theme from "./theme";
import Home from "./Pages/Home";
import Rooms from "./Pages/Rooms";
import RoomDetail from "./Pages/RoomDetail";
import GameInProgress from "./Pages/GameInProgress";
import PurchasedCartons from "./Pages/PurchasedCartons";
import Profile from "./Pages/Profile";
import TabBar from "./Componets/TabBar";

function NotFound() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>404 — Página no encontrada</h2>
      <p>La ruta que intentas abrir no existe.</p>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room/:roomId" element={<RoomDetail />} />
        <Route path="/game/:roomId" element={<GameInProgress />} />
        <Route path="/purchased-cartons" element={<PurchasedCartons />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <TabBar />
    </ThemeProvider>
  );
}
