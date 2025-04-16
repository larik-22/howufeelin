import { createContext } from 'react';
import { AuthContextType } from '@/types/Auth';

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
