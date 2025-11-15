import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

type CalledNumbersTableProps = {
  calledNumbers: Set<string>;
  markedNumbers: Set<string>;
};

export default function CalledNumbersTable({
  calledNumbers,
  markedNumbers,
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

    return table;
  };

  const tableData = getTableData();

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
                  const isMarked = col.markedNumbers.includes(num);

                  let backgroundColor = "transparent";
                  let borderColor = "rgba(255, 255, 255, 0.1)";
                  let fontWeight = 400;

                  if (isMarked) {
                    backgroundColor = "rgba(227, 191, 112, 0.4)";
                    borderColor = "rgba(227, 191, 112, 0.6)";
                    fontWeight = 900;
                  } else if (isCalled) {
                    backgroundColor = "rgba(76, 175, 80, 0.3)";
                    borderColor = "rgba(76, 175, 80, 0.5)";
                    fontWeight = 700;
                  }

                  return (
                    <TableCell
                      key={colIndex}
                      sx={{
                        color: isMarked || isCalled ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
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

