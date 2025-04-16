import { useContext, useState } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import DashboardBaseLayout from '@/layouts/DashboardBaseLayout';
import { Typography, Tabs, Tab, Box } from '@mui/material';
import Test from './Test';
import Groups from './Groups';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);

  if (!auth || !auth.firebaseUser) return null;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <DashboardBaseLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome, {auth.myUser?.displayName}
      </Typography>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab label="Groups" id="dashboard-tab-0" aria-controls="dashboard-tabpanel-0" />
            <Tab label="Test" id="dashboard-tab-1" aria-controls="dashboard-tabpanel-1" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <Groups />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Test />
        </TabPanel>
      </Box>
    </DashboardBaseLayout>
  );
}
