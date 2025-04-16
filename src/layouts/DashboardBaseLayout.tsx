import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import Navbar from '@/components/Navbar';

interface DashboardBaseLayoutProps {
  children: ReactNode;
}

export default function DashboardBaseLayout({ children }: DashboardBaseLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
