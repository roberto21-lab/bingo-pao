// src/BoxesGrid.tsx
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
// import { db } from "./firebase";

type BoxData = {
  id: string;
  isRed: boolean;
};

const BOXES_COLLECTION = "boxes";

export const BoxesGrid: React.FC = () => {
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const colRef = collection(db, BOXES_COLLECTION);

    const init = async () => {
      // 1) Ver si ya existen docs
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        // Si no hay nada, creamos 10 cajas iniciales
        const promises: Promise<void>[] = [];
        for (let i = 0; i < 10; i++) {
          const boxDocRef = doc(db, BOXES_COLLECTION, `box_${i}`);
          promises.push(
            setDoc(boxDocRef, {
              isRed: false,
            })
          );
        }
        await Promise.all(promises);
      }

      // 2) Suscripción en tiempo real
      onSnapshot(colRef, (snap) => {
        const data: BoxData[] = [];
        snap.forEach((d) => {
          data.push({
            id: d.id,
            isRed: d.data().isRed,
          });
        });

        // ordenar por id para que salgan siempre igual
        data.sort((a, b) => a.id.localeCompare(b.id));
        setBoxes(data);
        setLoading(false);
      });
    };

    init().catch((err) => {
      console.error("Error iniciando boxes:", err);
      setLoading(false);
    });
  }, []);

  const handleToggleBox = async (box: BoxData) => {
    try {
      const boxDocRef = doc(db, BOXES_COLLECTION, box.id);
      await updateDoc(boxDocRef, { isRed: !box.isRed });
      // No tocamos el state: onSnapshot se encarga de actualizarlo
    } catch (error) {
      console.error("Error actualizando box:", error);
    }
  };

  if (loading) {
    return <div style={{ color: "#fff" }}>Cargando cuadritos...</div>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 80px)", // 5 columnas
        gap: "12px",
      }}
    >
      {boxes.map((box) => (
        <div
          key={box.id}
          onClick={() => handleToggleBox(box)}
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: box.isRed ? "#e53935" : "#b0bec5", // rojo / gris
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            userSelect: "none",
          }}
        >
          {box.id}
        </div>
      ))}
    </div>
  );
};
