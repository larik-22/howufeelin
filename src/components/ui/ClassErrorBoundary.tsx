import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ClassErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="200px"
          p={3}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ mt: 2 }}
          >
            Try again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ClassErrorBoundary;
