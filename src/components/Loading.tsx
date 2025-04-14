import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

interface LoadingProps {
    isFullscreen?: boolean;
    isCentered?: boolean;
    width?: string;
}

export default function Loading({ isFullscreen = true, isCentered = true, width = '100%' }: LoadingProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isCentered ? 'center' : 'flex-start',
                alignItems: isCentered ? 'center' : 'flex-start',
                height: isFullscreen ? '100vh' : '100%',
            }}
        >
            <LinearProgress sx={{ width: width }} />
        </Box>
    );
}