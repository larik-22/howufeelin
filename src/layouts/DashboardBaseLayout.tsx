import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import Navbar from '@/components/Navbar';
import { Outlet } from 'react-router';

interface DashboardBaseLayoutProps {
  children?: ReactNode;
}

export default function DashboardBaseLayout({ children }: DashboardBaseLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children || <Outlet />}
      </Container>
    </Box>
  );
}
