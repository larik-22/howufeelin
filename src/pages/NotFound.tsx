import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router';
import { Box, Typography, Button, Container, Paper, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function NotFound() {
  const navigate = useNavigate();
  const theme = useTheme();
  const error = useRouteError();

  // Determine if this is a 404 error or another type of error
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  // Get appropriate error message based on error type
  const getErrorMessage = () => {
    if (is404) {
      return "The page you are looking for doesn't exist or has been moved.";
    }

    if (isRouteErrorResponse(error)) {
      return `Error ${error.status}: ${error.statusText}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred.';
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 5,
            borderRadius: theme.shape.borderRadius * 2,
            maxWidth: 600,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <ErrorOutlineIcon
            sx={{
              fontSize: 80,
              color: theme.palette.primary.main,
              mb: 2,
            }}
          />

          <Typography variant="h1" component="h1" gutterBottom>
            {is404 ? '404' : 'Error'}
          </Typography>

          <Typography variant="h4" component="h2" gutterBottom>
            {is404 ? 'Page Not Found' : 'Something Went Wrong'}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {getErrorMessage()}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              size="large"
            >
              Go Back
            </Button>

            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              size="large"
            >
              Go Home
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
