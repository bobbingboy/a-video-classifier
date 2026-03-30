import { createTheme } from "@mui/material/styles";

// 全域 CSS keyframes
const spinKeyframes = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
const styleEl = document.createElement("style");
styleEl.textContent = spinKeyframes;
document.head.appendChild(styleEl);

const theme = createTheme({
  shape: {
    borderRadius: 12,
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#4f46e5",
    },
    background: {
      default: "#111111",
      paper: "#1a1a1a",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: {
          lineHeight: 1,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#111111",
          borderBottom: "1px solid #222222",
          boxShadow: "none",
        },
      },
    },
  },
});

export default theme;
