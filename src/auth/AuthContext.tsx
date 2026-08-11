import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react";
import { clearTokenCache } from "../api";

export type AuthUser = {
  id?: string | number;
  role?: string;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.multiGet(["userToken", "authUser"])
      .then(([storedToken, storedUser]) => {
        if (storedToken[1]) {
          setToken(storedToken[1]);
        }

        if (storedUser[1]) {
          try {
            setUser(JSON.parse(storedUser[1]));
          } catch {
            AsyncStorage.removeItem("authUser");
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (nextUser: AuthUser, nextToken: string) => {
    clearTokenCache();
    setUser(nextUser);
    setToken(nextToken);
    await AsyncStorage.multiSet([
      ["userToken", nextToken],
      ["authUser", JSON.stringify(nextUser)],
    ]);
  };

  const logout = async () => {
    clearTokenCache();
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(["userToken", "authUser"]);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
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
