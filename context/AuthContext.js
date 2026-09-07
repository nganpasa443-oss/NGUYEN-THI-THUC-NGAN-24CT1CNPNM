import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // load session khi mở app
  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("token");
      const userInfo = await AsyncStorage.getItem("user");

      if (token && userInfo) {
        setUser(JSON.parse(userInfo));
      }
    };
    loadUser();
  }, []);

  // hàm login
  const login = async (userData, token) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // hàm logout
  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
