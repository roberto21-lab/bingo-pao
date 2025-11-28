// src/components/RealtimeButtons.tsx
import React, { useEffect, useState } from "react";
import { Button, Stack } from "@mui/material";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase"; // ajusta el path según tu estructura

type BtnDoc = {
  id: string;
  active: boolean;
};

const COLLECTION = "buttons";

export const RealtimeButtons: React.FC = () => {
  const [buttons, setButtons] = useState<BtnDoc[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const colRef = collection(db, COLLECTION);

    const init = async () => {
      const snap = await getDocs(colRef);

      if (snap.empty) {
        const promises: Promise<void>[] = [];
        for (let i = 0; i < 10; i++) {
          const btnRef = doc(db, COLLECTION, `btn_${i}`);
          promises.push(setDoc(btnRef, { active: false }));
        }
        await Promise.all(promises);
      }

      onSnapshot(colRef, (snapshot) => {
        const docs: BtnDoc[] = [];
        snapshot.forEach((d) => {
          docs.push({
            id: d.id,
            active: !!d.data().active,
          });
        });

        docs.sort((a, b) => a.id.localeCompare(b.id));
        setButtons(docs);
        setLoadingInit(false);
      });
    };

    init().catch((err) => {
      console.error("Error iniciando buttons:", err);
      setLoadingInit(false);
    });
  }, []);

  const handleToggle = async (btn: BtnDoc) => {
    try {
      setUpdatingId(btn.id);
      const ref = doc(db, COLLECTION, btn.id);
      await updateDoc(ref, { active: !btn.active });
    } catch (e) {
      console.error("Error actualizando botón:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loadingInit) {
    return <div style={{ color: "#fff" }}>Cargando botones...</div>;
  }

  // estilos base del botón dorado
  const GOLD_BG = `
    repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .12) 3.75%),
    repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .04) 2.25%),
    repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .18) 1.2%),
    linear-gradient(180deg, #d4af37 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #f4d03f 53%, #ffd700 75%, #d4af37 100%)
  `;

  const GOLD_BG_HOVER = `
    repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .15) 3.75%),
    repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .05) 2.25%),
    repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .2) 1.2%),
    linear-gradient(180deg, #f4d03f 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #ffed4e 53%, #ffd700 75%, #f4d03f 100%)
  `;

  // versión azul cuando está activo
  const BLUE_BG = `
    linear-gradient(180deg, #1976d2 0%, #1e88e5 25%, #42a5f5 50%, #1e88e5 75%, #0d47a1 100%)
  `;

  const BLUE_BG_HOVER = `
    linear-gradient(180deg, #1e88e5 0%, #42a5f5 30%, #64b5f6 50%, #1e88e5 80%, #0d47a1 100%)
  `;

  return (
    <Stack spacing={2} width="100%">
      {buttons.map((btn, index) => {
        const isActive = btn.active;
        const isLoading = updatingId === btn.id;

        return (
          <Button
            key={btn.id}
            fullWidth
            disabled={isLoading}
            onClick={() => handleToggle(btn)}
            sx={{
              backfaceVisibility: "hidden",
              position: "relative",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "inline-block",
              whiteSpace: "nowrap",
              color: "#fff",
              fontWeight: 900,
              fontSize: "14px",
              py: 1.5,
              borderRadius: "8px",
              textTransform: "none",
              textShadow:
                "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 215, 0, 0.3)",
              border: isActive ? "1px solid #42a5f5" : "1px solid #d4af37",
              backgroundImage: isActive ? BLUE_BG : GOLD_BG,
              boxShadow: `
                inset 0px 1px 0px rgba(255,255,255,0.9),
                inset 0px -1px 0px rgba(0,0,0,0.2),
                0px 1px 3px rgba(0,0,0,0.4),
                0px 4px 12px rgba(0,0,0, 0.4),
                0px 0px 20px rgba(255, 215, 0, 0.2)
              `,
              transition: "all 0.2s ease",
              opacity: isLoading ? 0.6 : 1,
              "&:hover": {
                backgroundImage: isActive ? BLUE_BG_HOVER : GOLD_BG_HOVER,
                transform: isLoading ? "none" : "translateY(-1px)",
              },
              "&:active": {
                transform: isLoading ? "none" : "translateY(2px)",
              },
            }}
          >
            {`Botón ${index + 1} - ${isActive ? "AZUL (ON)" : "DORADO (OFF)"}`}
          </Button>
        );
      })}
    </Stack>
  );
};
