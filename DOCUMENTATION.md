# Documentación del Proyecto BINGO PaO

## Índice
1. [Visión General](#visión-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Componentes Disponibles](#componentes-disponibles)
4. [Utilidades y Funciones](#utilidades-y-funciones)
5. [Patrones de Diseño](#patrones-de-diseño)
6. [Guía para Crear Nuevas Vistas](#guía-para-crear-nuevas-vistas)
7. [Estilos y Temas](#estilos-y-temas)
8. [Tipos y Interfaces](#tipos-y-interfaces)

---

## Visión General

BINGO PaO es una aplicación web de bingo con las siguientes características:
- **Tema**: Oscuro con acentos dorados (`#e3bf70`)
- **Fuente**: Montserrat (toda la aplicación)
- **Estilo**: Lujoso y minimalista con efectos glassmorphism
- **Idioma**: Español (todos los textos de usuario)

---

## Estructura del Proyecto

```
src/
├── Pages/              # Páginas principales de la aplicación
│   ├── Home.tsx       # Página principal con balance y juegos activos
│   ├── Rooms.tsx      # Lista de salas disponibles
│   ├── RoomDetail.tsx # Detalle de sala y selección de cartones
│   └── GameInProgress.tsx # Vista del juego en progreso
├── Componets/          # Componentes reutilizables
│   ├── BingoLogo.tsx  # Logo principal de la aplicación
│   ├── TabBar.tsx     # Barra de navegación inferior
│   ├── RoomCard.tsx   # Tarjeta de sala
│   ├── SelectableCard.tsx # Cartón de bingo seleccionable
│   ├── GameHeader.tsx # Header del juego con premio y modo
│   ├── GameStatusCard.tsx # Tarjeta de estado del juego
│   ├── CurrentNumberDisplay.tsx # Display del número actual
│   ├── CardList.tsx   # Lista de cartones con scroll
│   ├── CardBadge.tsx  # Badge de BINGO o contador
│   ├── CardPreviewModal.tsx # Modal de previsualización
│   ├── BingoValidationModal.tsx # Modal de validación de BINGO
│   ├── WinningCardDisplay.tsx # Display del cartón ganador
│   ├── CalledNumbersTable.tsx # Tabla de números llamados
│   ├── BackgroundStars.tsx # Fondo con estrellas
│   ├── SparkleAnimation.tsx # Animación de chispas
│   └── ConfettiFireworks.tsx # Confeti y fuegos artificiales
├── utils/              # Funciones de utilidad
│   ├── bingo.ts       # Generación de cartones de bingo
│   ├── bingoUtils.ts  # Utilidades de formato y cálculos
│   ├── bingoLogic.ts  # Lógica de detección de BINGO
│   └── gameInitialization.ts # Inicialización del juego
├── theme.ts            # Configuración del tema Material-UI
└── index.css           # Estilos globales

```

---

## Componentes Disponibles

### Componentes de UI Base

#### `BingoLogo`
**Ubicación**: `src/Componets/BingoLogo.tsx`
**Descripción**: Logo principal con diseño lujoso, grid de bingo y letras "PO" doradas con animación de chispas.
**Props**:
- `size?: number` - Tamaño del logo (default: 150)

**Cuándo usar**: En headers de páginas principales, modales importantes.

**Ejemplo**:
```tsx
import BingoLogo from "../Componets/BingoLogo";

<BingoLogo size={100} />
```

---

#### `TabBar`
**Ubicación**: `src/Componets/TabBar.tsx`
**Descripción**: Barra de navegación inferior fija con tabs y botón central "Unirse".
**Props**: Ninguna (usa React Router para navegación)

**Cuándo usar**: En todas las páginas principales (ya está en App.tsx).

---

#### `BackgroundStars`
**Ubicación**: `src/Componets/BackgroundStars.tsx`
**Descripción**: Fondo decorativo con estrellas doradas.
**Props**: Ninguna

**Cuándo usar**: En páginas que necesiten el fondo decorativo (GameInProgress, Home, etc.).

**Ejemplo**:
```tsx
<Box sx={{ position: "relative" }}>
  <BackgroundStars />
  {/* Contenido */}
</Box>
```

---

### Componentes de Cartones

#### `SelectableCard`
**Ubicación**: `src/Componets/SelectableCard.tsx`
**Descripción**: Cartón de bingo 5x5 con capacidad de selección y visualización de estado.
**Props**:
- `grid: number[][]` - Matriz 5x5 del cartón (0 = FREE)
- `cardId: number` - ID del cartón
- `selected?: boolean` - Si está seleccionado (muestra checkmark dorado)
- `onClick?: () => void` - Callback al hacer click
- `status?: "free" | "occupied"` - Estado del cartón
- `calledNumbers?: Set<string>` - Números llamados (formato "B-7", "I-28", etc.)
- `markedNumbers?: Set<string>` - Números marcados por el usuario
- `hasBingo?: boolean` - Si tiene BINGO completo (muestra dorado y chispas)

**Cuándo usar**: 
- En `RoomDetail` para selección de cartones
- En `GameInProgress` para mostrar cartones del jugador
- En cualquier vista que necesite mostrar cartones de bingo

**Ejemplo**:
```tsx
<SelectableCard
  grid={card}
  cardId={1}
  selected={isSelected}
  onClick={() => handleSelect(1)}
  calledNumbers={calledNumbers}
  markedNumbers={markedNumbers}
  hasBingo={hasBingo}
/>
```

---

#### `CardBadge`
**Ubicación**: `src/Componets/CardBadge.tsx`
**Descripción**: Badge que muestra "BINGO" (dorado) o contador de números marcados (verde).
**Props**:
- `hasBingo: boolean` - Si tiene BINGO
- `markedCount?: number` - Número de marcados (solo si no hay BINGO)

**Cuándo usar**: Sobre `SelectableCard` para indicar estado.

**Ejemplo**:
```tsx
<Box sx={{ position: "relative" }}>
  <SelectableCard {...props} />
  <CardBadge hasBingo={hasBingo} markedCount={markedCount} />
</Box>
```

---

#### `CardList`
**Ubicación**: `src/Componets/CardList.tsx`
**Descripción**: Lista horizontal scrollable de cartones con badges.
**Props**:
- `cards: BingoGrid[]` - Array de cartones
- `calledNumbers: Set<string>` - Números llamados
- `markedNumbers: Map<number, Set<string>>` - Números marcados por cartón
- `hasBingo: (index: number) => boolean` - Función para verificar BINGO
- `onCardClick: (index: number) => void` - Callback al hacer click

**Cuándo usar**: Para mostrar múltiples cartones en una lista scrollable.

**Ejemplo**:
```tsx
<CardList
  cards={playerCards}
  calledNumbers={calledNumbers}
  markedNumbers={markedNumbers}
  hasBingo={checkBingo}
  onCardClick={handleCardClick}
/>
```

---

### Componentes de Modales

#### `CardPreviewModal`
**Ubicación**: `src/Componets/CardPreviewModal.tsx`
**Descripción**: Modal para previsualizar y marcar números en un cartón.
**Props**:
- `open: boolean` - Si está abierto
- `onClose: () => void` - Callback para cerrar
- `onBingo: () => void` - Callback al hacer BINGO
- `card: BingoGrid` - Cartón a mostrar
- `cardId: number` - ID del cartón
- `hasBingo: boolean` - Si tiene BINGO
- `isNumberCalled: (num: number) => boolean` - Verificar si número fue llamado
- `isNumberMarked: (num: number) => boolean` - Verificar si número está marcado
- `onNumberClick: (num: number) => void` - Callback al hacer click en número

**Cuándo usar**: Para permitir al usuario ver y marcar números en un cartón durante el juego.

---

#### `BingoValidationModal`
**Ubicación**: `src/Componets/BingoValidationModal.tsx`
**Descripción**: Modal de validación que muestra el cartón ganador y tabla de números llamados.
**Props**:
- `open: boolean`
- `onClose: () => void`
- `winningCard: BingoGrid` - Cartón ganador
- `winningCardId: number`
- `markedNumbers: Set<string>` - Números marcados del cartón ganador
- `calledNumbers: Set<string>` - Todos los números llamados

**Cuándo usar**: Cuando un jugador hace BINGO, para validación pública.

---

### Componentes de Juego

#### `GameHeader`
**Ubicación**: `src/Componets/GameHeader.tsx`
**Descripción**: Header con título, premio de ronda y modo de BINGO.
**Props**:
- `currentRound: number`
- `currentRoundPrize: number`
- `currentBingoType: BingoType`

**Cuándo usar**: En la vista de juego en progreso.

---

#### `GameStatusCard`
**Ubicación**: `src/Componets/GameStatusCard.tsx`
**Descripción**: Tarjeta con estado del juego (ronda, últimos números, número actual).
**Props**:
- `currentRound: number`
- `totalRounds: number`
- `lastNumbers: string[]`
- `currentNumber: string`

**Cuándo usar**: En la vista de juego para mostrar información del estado actual.

---

#### `CurrentNumberDisplay`
**Ubicación**: `src/Componets/CurrentNumberDisplay.tsx`
**Descripción**: Círculo dorado con el número actual llamado.
**Props**:
- `currentNumber: string` - Número en formato "B-7"

**Cuándo usar**: Dentro de `GameStatusCard` o independientemente.

---

### Componentes de Visualización

#### `WinningCardDisplay`
**Ubicación**: `src/Componets/WinningCardDisplay.tsx`
**Descripción**: Display del cartón ganador con números marcados en dorado.
**Props**:
- `card: BingoGrid`
- `cardId: number`
- `markedNumbers: Set<string>`

**Cuándo usar**: En el modal de validación de BINGO.

---

#### `CalledNumbersTable`
**Ubicación**: `src/Componets/CalledNumbersTable.tsx`
**Descripción**: Tabla con los 75 números del bingo, mostrando llamados (verde) y marcados (dorado).
**Props**:
- `calledNumbers: Set<string>` - Todos los números llamados
- `markedNumbers: Set<string>` - Números marcados del cartón ganador

**Cuándo usar**: En el modal de validación para verificar el BINGO.

---

### Componentes de Animación

#### `SparkleAnimation`
**Ubicación**: `src/Componets/SparkleAnimation.tsx`
**Descripción**: Animación de chispas doradas alrededor de un elemento.
**Props**:
- `count?: number` - Número de chispas (default: 30)
- `size?: { min: number; max: number }` - Tamaño de chispas

**Cuándo usar**: Alrededor de elementos con BINGO o elementos destacados.

**Ejemplo**:
```tsx
<Box sx={{ position: "relative" }}>
  <SparkleAnimation count={20} />
  {/* Elemento con chispas */}
</Box>
```

---

#### `ConfettiFireworks`
**Ubicación**: `src/Componets/ConfettiFireworks.tsx`
**Descripción**: Confeti y fuegos artificiales en toda la pantalla.
**Props**:
- `active: boolean` - Activar/desactivar animación

**Cuándo usar**: Cuando un jugador hace BINGO.

---

### Componentes de Salas

#### `RoomCard`
**Ubicación**: `src/Componets/RoomCard.tsx`
**Descripción**: Tarjeta de sala con información (precio, premio, estado).
**Props**:
- `title: string`
- `price: number`
- `estimatedPrize?: number`
- `rounds: number`
- `jackpot: number`
- `status: "waiting" | "preparing" | "inProgress"`
- `playersCount?: number`
- `onClick?: () => void`

**Cuándo usar**: En la página de salas (`Rooms.tsx`).

---

## Utilidades y Funciones

### `src/utils/bingo.ts`

#### `generateCard(): BingoGrid`
Genera un cartón válido de bingo 5x5.
- Retorna: `BingoGrid` (matriz 5x5, 0 = FREE en el centro)
- Columnas: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)

**Cuándo usar**: Para generar cartones nuevos.

---

#### `generateCards(count: number): BingoGrid[]`
Genera múltiples cartones.
- Parámetros: `count` - Número de cartones a generar
- Retorna: Array de `BingoGrid`

**Cuándo usar**: Para generar múltiples cartones a la vez.

---

### `src/utils/bingoUtils.ts`

#### `numberToBingoFormat(num: number): string`
Convierte un número a formato BINGO.
- Parámetros: `num` - Número (0-75, 0 = FREE)
- Retorna: `"B-7"`, `"I-28"`, `"FREE"`, etc.

**Cuándo usar**: Para convertir números a formato de string para comparaciones.

**Ejemplo**:
```tsx
numberToBingoFormat(7) // "B-7"
numberToBingoFormat(28) // "I-28"
numberToBingoFormat(0) // "FREE"
```

---

#### `getBingoTypeName(type: BingoType): string`
Obtiene el nombre en español del tipo de BINGO.
- Parámetros: `type` - Tipo de BINGO
- Retorna: Nombre en español

**Cuándo usar**: Para mostrar el modo de BINGO al usuario.

---

#### `calculateRoundPrizes(totalPot: number, totalRounds: number): number[]`
Calcula los premios por ronda según porcentajes (20%, 30%, 60%).
- Parámetros: 
  - `totalPot` - Pote total
  - `totalRounds` - Número de rondas
- Retorna: Array de premios por ronda

**Cuándo usar**: Para calcular premios en la vista de juego.

---

### `src/utils/bingoLogic.ts`

#### `hasBingo(card: BingoGrid, markedNumbers: Set<string>, bingoType: BingoType): boolean`
Verifica si un cartón tiene BINGO según el tipo especificado.
- Parámetros:
  - `card` - Cartón a verificar
  - `markedNumbers` - Números marcados (formato "B-7", etc.)
  - `bingoType` - Tipo de BINGO a verificar
- Retorna: `true` si tiene BINGO

**Tipos de BINGO**:
- `"horizontal"` - Línea horizontal completa
- `"vertical"` - Línea vertical completa
- `"fourCorners"` - 4 esquinas del cartón
- `"smallCross"` - Cruz pequeña (arriba, abajo, izquierda, derecha del FREE)
- `"fullCard"` - Cartón completo

**Cuándo usar**: Para verificar si un cartón tiene BINGO en cualquier vista.

**Ejemplo**:
```tsx
const hasBingoResult = hasBingo(
  card,
  markedNumbers,
  "horizontal"
);
```

---

### `src/utils/gameInitialization.ts`

#### `initializeGameData(playerCards: BingoGrid[], currentRound: number, roundBingoTypes: BingoType[])`
Inicializa los números llamados y marcados para pruebas.
- Parámetros:
  - `playerCards` - Cartones del jugador
  - `currentRound` - Ronda actual
  - `roundBingoTypes` - Tipos de BINGO por ronda
- Retorna: `{ calledNumbers: Set<string>, markedNumbers: Map<number, Set<string>> }`

**Cuándo usar**: Para inicializar datos de prueba en desarrollo.

---

## Patrones de Diseño

### Glassmorphism
Todos los cards y contenedores usan glassmorphism:
```tsx
sx={{
  background: "rgba(31, 34, 51, 0.5)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
}}
```

### Colores Dorados
- Base: `#e3bf70`
- Claro: `#f5d99a`
- Oscuro: `#c9a85a`
- Gradientes: `linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)`

### Scroll Horizontal
Para listas horizontales:
```tsx
sx={{
  overflowX: "auto",
  scrollSnapType: "x proximity",
  "& > *": {
    minWidth: "calc((100vw - 96px) / 3.5)",
    flexShrink: 0,
    scrollSnapAlign: "start",
  },
}}
```

---

## Guía para Crear Nuevas Vistas

### Paso 1: Estructura Base
```tsx
import { Box, Container } from "@mui/material";
import BackgroundStars from "../Componets/BackgroundStars";

export default function NuevaVista() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1d2e",
        color: "#ffffff",
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackgroundStars />
      <Container maxWidth="sm" sx={{ py: 3, position: "relative", zIndex: 1 }}>
        {/* Contenido */}
      </Container>
    </Box>
  );
}
```

### Paso 2: Reutilizar Componentes Existentes
- ¿Necesitas mostrar cartones? → Usa `SelectableCard` o `CardList`
- ¿Necesitas mostrar información de juego? → Usa `GameHeader` o `GameStatusCard`
- ¿Necesitas un modal? → Usa `CardPreviewModal` o crea uno similar
- ¿Necesitas animaciones? → Usa `SparkleAnimation` o `ConfettiFireworks`

### Paso 3: Usar Utilidades
- ¿Necesitas generar cartones? → `generateCards(count)`
- ¿Necesitas verificar BINGO? → `hasBingo(card, markedNumbers, bingoType)`
- ¿Necesitas formatear números? → `numberToBingoFormat(num)`

### Paso 4: Aplicar Estilos
- Usa glassmorphism para cards
- Usa colores dorados para elementos destacados
- Usa Montserrat para todas las fuentes
- Mantén el fondo `#1a1d2e`

---

## Estilos y Temas

### Colores Principales
- **Fondo principal**: `#1a1d2e`
- **Fondo secundario**: `#1f2233`
- **Dorado base**: `#e3bf70`
- **Dorado claro**: `#f5d99a`
- **Dorado oscuro**: `#c9a85a`

### Fuentes
- **Principal**: `'Montserrat', sans-serif`
- **Pesos disponibles**: 300, 400, 500, 600, 700, 900
- **Logo**: Montserrat Black (900)

### Efectos Glassmorphism
```tsx
{
  background: "rgba(31, 34, 51, 0.5)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
}
```

### Botones Dorados
```tsx
{
  background: "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)",
  color: "#0f0f1e",
  border: "1px solid rgba(227, 191, 112, 0.3)",
  fontWeight: 700,
  boxShadow: "0 4px 12px rgba(227, 191, 112, 0.3)",
}
```

---

## Tipos y Interfaces

### `BingoGrid`
```typescript
type BingoGrid = number[][]; // 5x5, 0 = FREE en el centro
```

### `BingoType`
```typescript
type BingoType = 
  | "horizontal"    // Línea horizontal
  | "vertical"     // Línea vertical
  | "fourCorners"  // 4 esquinas
  | "smallCross"   // Cruz pequeña
  | "fullCard";    // Cartón completo
```

---

## Ejemplos de Uso

### Crear una Vista de Historial de Juegos

```tsx
import { Box, Container, Typography } from "@mui/material";
import BackgroundStars from "../Componets/BackgroundStars";
import RoomCard from "../Componets/RoomCard";

export default function GameHistory() {
  const pastGames = [/* datos */];
  
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#1a1d2e", paddingBottom: "80px", position: "relative" }}>
      <BackgroundStars />
      <Container maxWidth="sm" sx={{ py: 3, position: "relative", zIndex: 1 }}>
        <Typography variant="h4" sx={{ color: "#ffffff", mb: 3, fontFamily: "'Montserrat', sans-serif" }}>
          Historial de Juegos
        </Typography>
        {/* Usar RoomCard o crear componente similar */}
      </Container>
    </Box>
  );
}
```

### Crear una Vista de Estadísticas

```tsx
import { Box, Container } from "@mui/material";
import BackgroundStars from "../Componets/BackgroundStars";
import { generateCards } from "../utils/bingo";
import CardList from "../Componets/CardList";

export default function Statistics() {
  const cards = generateCards(10);
  // Usar CardList para mostrar cartones
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#1a1d2e", paddingBottom: "80px" }}>
      <BackgroundStars />
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <CardList cards={cards} /* props */ />
      </Container>
    </Box>
  );
}
```

---

## Checklist para Nuevas Vistas

- [ ] Usar `BackgroundStars` para el fondo
- [ ] Usar `Container` con `maxWidth="sm"`
- [ ] Aplicar `backgroundColor: "#1a1d2e"`
- [ ] Usar `paddingBottom: "80px"` para el TabBar
- [ ] Reutilizar componentes existentes cuando sea posible
- [ ] Usar funciones de utilidad en lugar de crear nuevas
- [ ] Aplicar estilos glassmorphism a cards
- [ ] Usar colores dorados para elementos destacados
- [ ] Traducir todos los textos a español
- [ ] Usar fuente Montserrat

---

## Notas Importantes

1. **NO crear componentes duplicados**: Siempre revisar si existe un componente similar antes de crear uno nuevo.
2. **NO crear funciones duplicadas**: Usar las utilidades existentes.
3. **Mantener consistencia**: Seguir los patrones de diseño establecidos.
4. **Idioma**: Todos los textos de usuario deben estar en español.
5. **Responsive**: Usar breakpoints de Material-UI (`xs`, `sm`, `md`, etc.).

---

## Contacto y Soporte

Para cualquier duda sobre la estructura o componentes, consultar este documento primero antes de crear nuevos elementos.

