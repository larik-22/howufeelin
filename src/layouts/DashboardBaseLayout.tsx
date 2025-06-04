import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router';
import Navbar from '@/components/layout/Navbar';

interface DashboardBaseLayoutProps {
  children?: ReactNode;
}

export default function DashboardBaseLayout({ children }: DashboardBaseLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 0, sm: 2 } }}>
        {children || <Outlet />}
      </Container>
    </Box>
  );
}
