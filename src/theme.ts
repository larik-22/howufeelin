import { createTheme, ThemeOptions } from '@mui/material/styles';
import { isRizel } from '@/utils/specialUsers';

const getPrimaryColor = (email: string | null | undefined) => {
  if (isRizel(email)) {
    return {
      main: '#FFB5C5', // Pastel pink
      light: '#FFD1DB', // Lighter pink
      dark: '#FF8BA7', // Darker pink
      contrastText: '#2C3E50', // Dark blue-gray for contrast
    };
  }
  return {
    main: '#8FC5A3', // Green
    light: '#A8D5BC', // Lighter green
    dark: '#76B58A', // Darker green
    contrastText: '#2C3E50', // Dark blue-gray for contrast
  };
};

export const createAppTheme = (email: string | null | undefined) => {
  const primaryColor = getPrimaryColor(email);

  const themeOptions: ThemeOptions = {
    palette: {
      primary: primaryColor,
      secondary: {
        main: '#B5C5FF', // Soft periwinkle blue (complements both pink and green)
        light: '#D1DBFF', // Lighter periwinkle
        dark: '#8BA7FF', // Darker periwinkle
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
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          },
          contained: {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
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
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};
