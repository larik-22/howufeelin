import { createContext } from 'react';
import { AuthContextType } from '@/types/MyAuth';

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
