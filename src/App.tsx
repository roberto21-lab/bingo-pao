// src/App.tsx
import * as React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./Pages/Home";
import Header from "./Pages/Header";
import RoomDetail from "./Pages/RoomDetail";
import PurchasedCartons from "./Pages/PurchasedCartons";
import Profile from "./Pages/Profile";
// import Header from "./components/Header"; // asegúrate de la ruta real

// Componente 404 simple (puedes moverlo a src/Pages/NotFound.tsx luego)
function NotFound() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>404 — Página no encontrada</h2>
      <p>La ruta que intentas abrir no existe.</p>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="Bingo Pao"
        links={[{ label: "Inicio", to: "/" }, { label: "Perfil", to: "/profile" }, { label: "Mis cartones", to: "/purchased-cartons" }]}
        onNavigate={(to) => navigate(to)}
        actionLabel="Crear sala"
        // onActionClick={() => alert("Crear sala")}
        roomCount={2}
        userName="Roberto"
        balance={30000}
        currency="Bs"
      // onWalletClick={() => alert("Ir a billetera")}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<RoomDetail />} /> {/* ⬅️ nueva */}
        <Route path="/purchased-cartons" element={<PurchasedCartons />} /> {/* ⬅️ nueva */}
        <Route path="/profile" element={<Profile />} /> {/* ⬅️ nueva */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}
