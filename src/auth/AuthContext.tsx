import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react";
import { clearTokenCache, setUnauthorizedHandler } from "../api";

export type AuthUser = {
  id?: string | number;
  role?: string;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setToken(null);
      router.replace("/login");
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (nextUser: AuthUser, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    await AsyncStorage.setItem("userToken", nextToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    clearTokenCache();
    await AsyncStorage.removeItem("userToken");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
