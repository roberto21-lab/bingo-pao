import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

type CalledNumbersTableProps = {
  calledNumbers: Set<string>;
  markedNumbers: Set<string>;
  bingoPatternNumbers?: Set<string>; // Números que forman el patrón de bingo ganador
};

export default function CalledNumbersTable({
  calledNumbers,
  markedNumbers,
  bingoPatternNumbers = new Set<string>(),
}: CalledNumbersTableProps) {
  const getTableData = () => {
    const table = [
      { letter: "B", allNumbers: Array.from({ length: 15 }, (_, i) => i + 1), calledNumbers: [] as number[], markedNumbers: [] as number[] },
      { letter: "I", allNumbers: Array.from({ length: 15 }, (_, i) => i + 16), calledNumbers: [] as number[], markedNumbers: [] as number[] },
      { letter: "N", allNumbers: Array.from({ length: 15 }, (_, i) => i + 31), calledNumbers: [] as number[], markedNumbers: [] as number[] },
      { letter: "G", allNumbers: Array.from({ length: 15 }, (_, i) => i + 46), calledNumbers: [] as number[], markedNumbers: [] as number[] },
      { letter: "O", allNumbers: Array.from({ length: 15 }, (_, i) => i + 61), calledNumbers: [] as number[], markedNumbers: [] as number[] },
    ];

    calledNumbers.forEach((numStr) => {
      if (numStr === "FREE") return;
      const [letter, num] = numStr.split("-");
      const numValue = parseInt(num);
      const index = ["B", "I", "N", "G", "O"].indexOf(letter);
      if (index !== -1 && !isNaN(numValue) && !table[index].calledNumbers.includes(numValue)) {
        table[index].calledNumbers.push(numValue);
      }
    });

    markedNumbers.forEach((numStr) => {
      if (numStr === "FREE") return;
      const [letter, num] = numStr.split("-");
      const numValue = parseInt(num);
      const index = ["B", "I", "N", "G", "O"].indexOf(letter);
      if (index !== -1 && !isNaN(numValue) && !table[index].markedNumbers.includes(numValue)) {
        table[index].markedNumbers.push(numValue);
      }
    });

    // Agregar números del patrón de bingo
    const bingoNumbers: number[] = [];
    bingoPatternNumbers.forEach((numStr) => {
      if (numStr === "FREE") return;
      const [letter, num] = numStr.split("-");
      const numValue = parseInt(num);
      const index = ["B", "I", "N", "G", "O"].indexOf(letter);
      if (index !== -1 && !isNaN(numValue) && !bingoNumbers.includes(numValue)) {
        bingoNumbers.push(numValue);
        // También agregar a la columna correspondiente
        if (!table[index].markedNumbers.includes(numValue)) {
          table[index].markedNumbers.push(numValue);
        }
      }
    });

    return { table, bingoNumbers };
  };

  const { table: tableData, bingoNumbers } = getTableData();

  return (
    <>
      <Typography
        variant="h6"
        sx={{
          color: "#ffffff",
          fontWeight: 700,
          mb: 2,
          textAlign: "center",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Números Llamados
      </Typography>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "rgba(31, 34, 51, 0.8)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          border: "1px solid rgba(227, 191, 112, 0.3)",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {tableData.map((col) => (
                <TableCell
                  key={col.letter}
                  sx={{
                    backgroundColor: "#e3bf70",
                    color: "#0f0f1e",
                    fontWeight: 900,
                    textAlign: "center",
                    border: "1px solid rgba(227, 191, 112, 0.5)",
                  }}
                >
                  {col.letter}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 15 }, (_, rowIndex) => (
              <TableRow key={rowIndex}>
                {tableData.map((col, colIndex) => {
                  const num = col.allNumbers[rowIndex];
                  const isCalled = col.calledNumbers.includes(num);
                  const isBingoNumber = bingoNumbers.includes(num);

                  let backgroundColor = "rgba(50, 50, 50, 0.5)"; // Gris oscuro para números no llamados
                  let borderColor = "rgba(255, 255, 255, 0.1)";
                  let fontWeight = 400;
                  let textColor = "rgba(255, 255, 255, 0.3)"; // Gris claro para números no llamados

                  if (isBingoNumber && isCalled) {
                    // Números que coinciden con el bingo - DORADO
                    backgroundColor = "rgba(227, 191, 112, 0.6)";
                    borderColor = "rgba(227, 191, 112, 0.9)";
                    fontWeight = 900;
                    textColor = "#ffffff";
                  } else if (isCalled && !isBingoNumber) {
                    // Números que salieron pero no coinciden con el bingo - VERDE
                    backgroundColor = "rgba(76, 175, 80, 0.4)";
                    borderColor = "rgba(76, 175, 80, 0.7)";
                    fontWeight = 700;
                    textColor = "#ffffff";
                  } else if (isCalled) {
                    // Números llamados (fallback)
                    backgroundColor = "rgba(76, 175, 80, 0.3)";
                    borderColor = "rgba(76, 175, 80, 0.5)";
                    fontWeight = 700;
                    textColor = "#ffffff";
                  }

                  return (
                    <TableCell
                      key={colIndex}
                      sx={{
                        color: textColor,
                        textAlign: "center",
                        border: `1px solid ${borderColor}`,
                        backgroundColor: backgroundColor,
                        fontWeight: fontWeight,
                      }}
                    >
                      {num}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography
        variant="body2"
        sx={{
          color: "#e3bf70",
          fontSize: "12px",
          textAlign: "center",
          mt: 2,
          opacity: 0.8,
        }}
      >
        Total de números llamados: {calledNumbers.size}
      </Typography>
    </>
  );
}

