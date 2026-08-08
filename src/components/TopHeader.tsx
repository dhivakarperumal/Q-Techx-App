import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";

export function TopHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  // Derive display name
  const rawName =
    (user?.name as string) ||
    (user?.full_name as string) ||
    (user?.first_name as string) ||
    (user?.username as string) ||
    (user?.employee_name as string) ||
    (user?.displayName as string) ||
    "";

  const userEmail = (user?.email as string) || "";
  const emailUsername = userEmail.includes("@")
    ? userEmail.split("@")[0]
    : userEmail;

  const capitalise = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const displayName = rawName
    ? capitalise(rawName)
    : emailUsername
      ? capitalise(emailUsername)
      : "User";

  const avatarLetter = displayName.charAt(0).toUpperCase();
  const userRole =
    (user?.role as string)?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Admin";

  const openDropdown = () => {
    setDropdownVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -8,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => setDropdownVisible(false));
  };

  const handleLogout = () => {
    closeDropdown();
    setTimeout(() => {
      Alert.alert("Log out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
          },
        },
      ]);
    }, 200);
  };

  const dropdownItems = [
    {
      icon: "person-circle-outline" as const,
      label: "My Profile",
      onPress: () => {
        closeDropdown();
        Alert.alert("Profile", "Profile page coming soon.");
      },
    },
    {
      icon: "settings-outline" as const,
      label: "Settings",
      onPress: () => {
        closeDropdown();
        Alert.alert("Settings", "Settings page coming soon.");
      },
    },
    {
      icon: "log-out-outline" as const,
      label: "Log Out",
      color: "#ef4444",
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="flex-row items-center justify-between px-5 py-4">
        {/* Left — Hamburger Menu */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Alert.alert("Menu", "Drawer menu coming soon.")}
          className="p-1 -ml-1"
        >
          <Ionicons name="menu-outline" size={32} color="#1e293b" />
        </TouchableOpacity>

        {/* Right — Notification + Avatar */}
        <View className="flex-row items-center gap-5">
          {/* Notification Bell */}
          <TouchableOpacity activeOpacity={0.7} className="relative">
            <Ionicons name="notifications-outline" size={26} color="#1e293b" />
            {/* Badge */}
            <View className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-orange-500 border border-white">
              <Text className="text-[9px] font-bold text-white">3</Text>
            </View>
          </TouchableOpacity>

          {/* Avatar button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openDropdown}
            accessibilityLabel="Open profile menu"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-800 shadow-sm overflow-hidden"
          >
            {/* Can easily replace with Image later */}
            <Text className="text-base font-bold text-white">{avatarLetter}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown modal */}
      <Modal
        transparent
        visible={dropdownVisible}
        animationType="none"
        onRequestClose={closeDropdown}
        statusBarTranslucent
      >
        <Pressable className="flex-1" onPress={closeDropdown}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              position: "absolute",
              top: 90,
              right: 16,
              minWidth: 220,
              borderRadius: 16,
              backgroundColor: "#ffffff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            {/* User info header */}
            <View className="border-b border-slate-100 px-4 py-4">
              <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                <Text className="text-xl font-bold text-white">{avatarLetter}</Text>
              </View>
              <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                {displayName}
              </Text>
              {userEmail ? (
                <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
                  {userEmail}
                </Text>
              ) : null}
              <View className="mt-2 self-start rounded-full bg-orange-50 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-orange-600">{userRole}</Text>
              </View>
            </View>

            {/* Menu items */}
            <View className="py-2">
              {dropdownItems.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderTopWidth: index === dropdownItems.length - 1 ? 1 : 0,
                    borderTopColor: index === dropdownItems.length - 1 ? "#f1f5f9" : "transparent",
                    marginTop: index === dropdownItems.length - 1 ? 4 : 0,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor:
                        item.color === "#ef4444" ? "#fef2f2" : "#f8fafc",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.color ?? "#475569"}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: item.color ?? "#1e293b",
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}