import React from "react";
import { Box, Button, Container, Paper, Typography, Snackbar, Alert } from "@mui/material";
import { spinRoulette } from "../Services/RouletteService"; // ajusta el path
import { getWalletByUser } from "../Services/wallets.service";
import { useAuth } from "../hooks/useAuth";
import { getUserId } from "../Services/auth.service";


type SpinResult = "win" | "lose";

const BINGO_GOLD = "#d4af37";
const BINGO_BG_1 = "#0a0703";
const BINGO_BG_2 = "#1b1106";
const CARD_BG = "rgba(20, 14, 8, 0.70)";

const segments = [
  { label: "pierde", type: "lose" as const, color: "#1ea34a" },
  { label: "pierde", type: "lose" as const, color: "#f3c33b" },
  { label: "pierde", type: "lose" as const, color: "#e03a3a" },
  { label: "gana", type: "win" as const, color: "#2f6fed" },
  { label: "pierde", type: "lose" as const, color: "#1ea34a" },
  { label: "pierde", type: "lose" as const, color: "#f3c33b" },
  { label: "pierde", type: "lose" as const, color: "#e03a3a" },
  { label: "gana", type: "win" as const, color: "#2f6fed" },
];

function normalizeAngle(deg: number) {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function makeClientSpinId() {
  // en navegadores modernos
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


// function decideResultFrontOnly(): SpinResult {
//   return Math.random() < 0.25 ? "win" : "lose";
// }

function pickIndexByResult(result: SpinResult) {
  const candidates = segments
    .map((s, idx) => ({ s, idx }))
    .filter((x) => x.s.type === result)
    .map((x) => x.idx);

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function RouletteWheelSVG({
  size = 360,
  rotationDeg = 0,
}: {
  size?: number;
  rotationDeg: number;
}) {
  const r = size / 2;
  const cx = r;
  const cy = r;

  const total = segments.length;
  const anglePer = (2 * Math.PI) / total;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        position: "relative",
        borderRadius: "50%",
        filter: "drop-shadow(0 18px 30px rgba(0,0,0,.55))",
      }}
    >
      {/* Puntero (arriba) */}
      <Box
        sx={{
          position: "absolute",
          top: -6, // un poco más pegado a la ruleta
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: `22px solid ${BINGO_GOLD}`, // 👈 flecha hacia abajo
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,.55))",
          zIndex: 5,
        }}
      />


      {/* Rueda */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid rgba(212,175,55,.65)`,
          boxShadow: "0 0 0 6px rgba(212,175,55,.12)",
          transform: `rotate(${rotationDeg}deg)`,
          transition: "transform 4.2s cubic-bezier(.12,.78,.16,1)",
          background: "rgba(0,0,0,.2)",
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Segmentos */}
          {segments.map((seg, i) => {
            const start = i * anglePer;
            const end = (i + 1) * anglePer;

            const x1 = cx + r * Math.cos(start);
            const y1 = cy + r * Math.sin(start);
            const x2 = cx + r * Math.cos(end);
            const y2 = cy + r * Math.sin(end);

            const largeArc = end - start > Math.PI ? 1 : 0;
            const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            // ✅ Texto radial (del centro hacia afuera)
            const mid = (start + end) / 2;

            // ajusta esto si lo quieres más hacia el centro o más hacia el borde
            const labelRadius = r * 0.58;

            const tx = cx + labelRadius * Math.cos(mid);
            const ty = cy + labelRadius * Math.sin(mid);

            let textRotate = (mid * 180) / Math.PI; // radial

            // ✅ Para que no quede “boca abajo” en la parte de abajo
            const degNorm = normalizeAngle(textRotate);
            if (degNorm > 90 && degNorm < 270) textRotate += 180;

            return (
              <g key={i}>
                <path d={path} fill={seg.color} opacity={0.95} />
                <text
                  x={tx}
                  y={ty}
                  fill="#fff"
                  fontSize={24}
                  fontWeight={900}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotate} ${tx} ${ty})`}
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    paintOrder: "stroke",
                    stroke: "rgba(0,0,0,.35)",
                    strokeWidth: 3,
                  }}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          {/* Centro */}
          <circle cx={cx} cy={cy} r={r * 0.18} fill="rgba(255,255,255,.92)" />
          <circle cx={cx} cy={cy} r={r * 0.12} fill="rgba(212,175,55,.85)" />
        </svg>
      </Box>
    </Box>
  );
}

const POINTER_ANGLE = 270; // 12 en punto (0° en SVG es a las 3 en punto)

function getLandedIndex(rotationDeg: number) {
  const total = segments.length;
  const anglePer = 360 / total;

  // ángulo del "mundo" bajo el puntero
  const a0 = normalizeAngle(POINTER_ANGLE - normalizeAngle(rotationDeg));

  // ✅ clave: restar un epsilon para no caer "en el borde" y que siempre tome el segmento anterior
  const EPS = 1e-4;
  const a = normalizeAngle(a0 - EPS);

  const idx = Math.floor(a / anglePer);
  return Math.min(total - 1, Math.max(0, idx));
}


export default function Roulette() {
  const [spinning, setSpinning] = React.useState(false);
  const [rotation, setRotation] = React.useState(0);
  const [availableBalance, setAvailableBalance] = React.useState(0);
  // const [frozenBalance, setFrozenBalance] = React.useState(0);
  // const [walletLoading, setWalletLoading] = React.useState(true);
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const userId = user?.id || getUserId() || null;
  const [toast, setToast] = React.useState<{ open: boolean; msg: string; type: "success" | "error" }>(
    { open: false, msg: "", type: "success" }
  );

  const [balance, setBalance] = React.useState(10);

  const costPerSpin = 1;
  // const winAmount = 3;

const SPIN_MS = 4200;

  React.useEffect(() => {
    const fetchWallet = async () => {
      if (!userId || !isAuthenticated) {
        setAvailableBalance(0);
        // setFrozenBalance(0);
        return;
      }

      try {
        // setWalletLoading(true);
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        // setFrozenBalance(wallet.frozen_balance || 0);
      } catch {
        setAvailableBalance(0);
        // setFrozenBalance(0);
      } finally {
        // setWalletLoading(false);
      }
    };

    if (!authLoading) {
      fetchWallet();
    }
  }, [userId, isAuthenticated, authLoading]);



  const handleSpin = async () => {
  if (spinning) return;

  if (availableBalance < costPerSpin) {
    setToast({ open: true, msg: "Saldo insuficiente para girar.", type: "error" });
    return;
  }

  setSpinning(true);

  // ✅ Descuento optimista (instantáneo)
  setBalance((b) => Math.max(0, b - costPerSpin));

  const clientSpinId = makeClientSpinId();

  let spinData = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      spinData = await spinRoulette(clientSpinId);
      break;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const code = e?.code || e?.message;

      if (code === "RETRY") continue;

      // rollback del descuento optimista (solo si lo aplicaste)
      setBalance((b) => b + costPerSpin);

      setSpinning(false);

      if (code === "INSUFFICIENT_BALANCE") {
        setToast({ open: true, msg: "Saldo insuficiente para girar.", type: "error" });
      } else if (code === "UNAUTHORIZED") {
        setToast({ open: true, msg: "Sesión expirada. Vuelve a iniciar sesión.", type: "error" });
      } else {
        setToast({ open: true, msg: "Error al girar. Intenta de nuevo.", type: "error" });
      }
      return;
    }
  }

  if (!spinData) {
    // rollback
    setBalance((b) => b + costPerSpin);
    setSpinning(false);
    setToast({ open: true, msg: "Mucho tráfico. Intenta de nuevo.", type: "error" });
    return;
  }

  const outcome: SpinResult = spinData.outcome;
  const idx = pickIndexByResult(outcome);

  const total = segments.length;
  const anglePer = 360 / total;
  const centerOfIdx = idx * anglePer + anglePer / 2;
  const turns = 5 * 360;
  const delta = normalizeAngle(POINTER_ANGLE - centerOfIdx);

  let finalRotation = 0;
  setRotation((prev) => {
    finalRotation = prev + turns + delta;
    return finalRotation;
  });

  setTimeout(async () => {
    setSpinning(false);

    // ✅ aplica la verdad del servidor
    // balance_after es BALANCE TOTAL, no available (available = balance - frozen)
    setBalance(Number(spinData.balance_after) || 0);

    // opcional: sincroniza frozen/balance real por si cambió por otra cosa
    // (admin aprobó algo, etc.)
    await refreshWallet();

    const landedIdx = getLandedIndex(finalRotation);
    const landedType = segments[landedIdx].type;

    if (landedType === "win") {
      setToast({ open: true, msg: `¡Ganaste! +${spinData.payout} Bs`, type: "success" });
    } else {
      setToast({ open: true, msg: "Perdiste 😅", type: "error" });
    }
  }, SPIN_MS);
};



const refreshWallet = async () => {
    if (!userId || !isAuthenticated) {
        setAvailableBalance(0);
        return;
    }

    try {
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
    } catch {
        setAvailableBalance(0);
    }
}


  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 600px at 50% 0%, ${BINGO_BG_2} 0%, ${BINGO_BG_1} 60%, #000 100%)`,
        color: "#fff",
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: "1px",
              color: BINGO_GOLD,
              textShadow: "0 6px 22px rgba(212,175,55,.25)",
            }}
          >
            Ruleta Bingo PAO
          </Typography>
          <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
            Gira por 100 Bs — Premio: 300 Bs
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 4,
            background: CARD_BG,
            border: "1px solid rgba(212,175,55,.18)",
            boxShadow: "0 18px 40px rgba(0,0,0,.45)",
            backdropFilter: "blur(6px)",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
            <Box>
              <Typography sx={{ opacity: 0.75, fontWeight: 700 }}>Mi saldo</Typography>
              <Typography sx={{ fontSize: 44, fontWeight: 900, textShadow: "0 10px 30px rgba(0,0,0,.55)" }}>
                {availableBalance.toFixed(2)} Bs
              </Typography>
            </Box>

            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 999,
                background: "rgba(40,160,70,.18)",
                border: "1px solid rgba(40,160,70,.35)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#7CFF9B",
              }}
            >
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: "#7CFF9B", boxShadow: "0 0 16px rgba(124,255,155,.7)" }} />
              <Typography sx={{ fontWeight: 800 }}>En línea</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <RouletteWheelSVG size={420} rotationDeg={rotation} />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 1 }}>
            <Button
              onClick={handleSpin}
              disabled={spinning || balance < costPerSpin}
              sx={{
                width: "100%",
                py: 1.4,
                borderRadius: 2.5,
                fontWeight: 900,
                fontSize: 18,
                color: "#201407",
                background: `linear-gradient(180deg, rgba(255,232,170,1) 0%, rgba(212,175,55,1) 55%, rgba(166,123,28,1) 100%)`,
                boxShadow: "0 10px 26px rgba(212,175,55,.25)",
                "&:hover": {
                  background: `linear-gradient(180deg, rgba(255,240,190,1) 0%, rgba(220,185,70,1) 55%, rgba(175,135,35,1) 100%)`,
                },
                "&.Mui-disabled": {
                  opacity: 0.55,
                  color: "#201407",
                },
              }}
            >
              {spinning ? "Girando..." : "GIRAR"}
            </Button>
          </Box>

        
        </Paper>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.type}
          variant="filled"
          sx={{ fontWeight: 800 }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
