import { Alert } from '@mui/material';

export default function BirthdayBanner() {
  return (
    <Alert
      icon={false}
      severity="success"
      sx={{
        justifyContent: 'center',
        fontWeight: 600,
        borderRadius: 0,
      }}
    >
      🎂 Happy Birthday, Rizel!
    </Alert>
  );
}
