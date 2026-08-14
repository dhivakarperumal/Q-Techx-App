import { Ionicons } from "@expo/vector-icons";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Alert, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type AlertButton = {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: "default" | "cancel" | "destructive";
};

type CustomAlertContextType = {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(undefined);

export const useCustomAlert = () => {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error("useCustomAlert must be used within a CustomAlertProvider");
  }
  return context;
};

export const CustomAlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<AlertButton[]>([]);

  const showAlert = useCallback((alertTitle: string, alertMessage?: string, alertButtons?: AlertButton[]) => {
    setTitle(alertTitle);
    setMessage(alertMessage || "");
    
    if (alertButtons && alertButtons.length > 0) {
      setButtons(alertButtons);
    } else {
      setButtons([{ text: "OK" }]);
    }
    
    setVisible(true);
  }, []);

  useEffect(() => {
    // Store the original Alert.alert function to prevent issues
    const originalAlert = Alert.alert;
    
    // Safely override React Native's Alert.alert to use our custom popup
    const newAlert = (alertTitle: string, alertMessage?: string, alertButtons?: AlertButton[]) => {
      try {
        showAlert(alertTitle, alertMessage, alertButtons);
      } catch (error) {
        // Fallback to original alert if custom alert fails
        originalAlert(alertTitle, alertMessage);
      }
    };
    
    // Type assertion needed due to Alert API differences
    (Alert as any).alert = newAlert;
    
    // Cleanup: restore original Alert.alert
    return () => {
      (Alert as any).alert = originalAlert;
    };
  }, [showAlert]);

  const handleClose = () => {
    setVisible(false);
  };

  const handleButtonPress = (onPress?: () => void | Promise<void>) => {
    handleClose();
    if (onPress) {
      setTimeout(onPress, 100); // Give the modal a tiny bit of time to start dismissing
    }
  };

  return (
    <CustomAlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={styles.alertBox}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={32} color="#f97316" />
            </View>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <View style={styles.buttonContainer}>
              {buttons.map((btn, index) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive";
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    style={[
                      styles.button,
                      buttons.length === 2 && index === 0 && { marginRight: 8 },
                      isCancel ? styles.buttonCancel : styles.buttonDefault
                    ]}
                    onPress={() => handleButtonPress(btn.onPress)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel ? styles.textCancel : isDestructive ? styles.textDestructive : styles.textDefault
                      ]}
                    >
                      {btn.text?.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </CustomAlertContext.Provider>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  alertBox: {
    width: width - 48,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff7ed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDefault: {
    backgroundColor: "#f97316",
  },
  buttonCancel: {
    backgroundColor: "#f1f5f9",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  textDefault: {
    color: "#ffffff",
  },
  textDestructive: {
    color: "#ffffff",
  },
  textCancel: {
    color: "#64748b",
  },
});
