import { createTheme } from "@mui/material/styles";

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
