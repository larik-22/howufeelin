import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#FFB5C5', // Pastel pink
      light: '#FFD1DB', // Lighter pink
      dark: '#FF8BA7', // Darker pink
      contrastText: '#2C3E50', // Dark blue-gray for contrast
    },
    secondary: {
      main: '#8FC5A3', // Soft mint green (swapped with primary)
      light: '#D1E9D6', // Lighter mint
      dark: '#7ABF8E', // Darker mint
      contrastText: '#2C3E50',
    },
    background: {
      default: '#F9F7F7', // Very light gray
      paper: '#FFFFFF', // White
    },
    text: {
      primary: '#2C3E50', // Dark blue-gray
      secondary: '#6C7A89', // Medium gray
    },
    error: {
      main: '#FF9AA2', // Soft red
      light: '#FFB7BD', // Lighter red
      dark: '#FF7D88', // Darker red
    },
    warning: {
      main: '#FFDAC1', // Soft orange
      light: '#FFE4D1', // Lighter orange
      dark: '#FFC7A1', // Darker orange
    },
    info: {
      main: '#B5EAD7', // Soft teal
      light: '#D1F0E5', // Lighter teal
      dark: '#8ED8C1', // Darker teal
    },
    success: {
      main: '#C7CEEA', // Soft purple
      light: '#D9DFF0', // Lighter purple
      dark: '#A5B0E0', // Darker purple
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});
