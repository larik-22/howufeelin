import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router';

interface BaseLayoutProps {
    children?: React.ReactNode;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
            }}
        >
            <Container
                maxWidth="lg"
                sx={{
                    py: 4,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {children || <Outlet />}
            </Container>
        </Box>
    );
} 