import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  type: 'validator' | 'client';
  name?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, type: 'validator' | 'client') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for existing session on load
  useEffect(() => {
    const storedUser = localStorage.getItem('deepfry-user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('deepfry-user');
      }
    }
  }, []);

  const login = async (email: string, _password: string, type: 'validator' | 'client') => {
    // In a real app, you would call your API here
    // This is just a demo, so we'll simulate a successful login
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create user object
    const user = { email, type };
    
    // Update state
    setUser(user);
    setIsAuthenticated(true);
    
    // Store in localStorage for persistence
    localStorage.setItem('deepfry-user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('deepfry-user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};