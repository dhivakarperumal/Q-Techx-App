import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";
import { useAuth } from "../auth/AuthContext";
import { getRoleHome } from "../auth/roleUtils";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const isAttemptingRef = useRef<string | false>(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    const trimmedUsername = username.trim();

    if (
      !trimmedUsername ||
      !password ||
      password.length < 6 ||
      isAttemptingRef.current
    ) {
      return;
    }

    // Prevent checking the exact same credentials repeatedly
    const credentialsKey = `${trimmedUsername}|${password}`;

    if (isAttemptingRef.current === credentialsKey) {
      return;
    }

    const timer = setTimeout(async () => {
      // Check again before making request
      if (isAttemptingRef.current) return;

      isAttemptingRef.current = credentialsKey;
      setIsSubmitting(true);
      setServerError("");
      setFieldError("");

      try {
        const { data } = await api.post("/users/login", {
          identifier: trimmedUsername,
          password,
        });

        const roleHome = getRoleHome(data.user?.role);

        if (!roleHome || !data.user || !data.token) {
          throw new Error(
            "Your account has no supported admin or employee role"
          );
        }

        await login(data.user, data.token);

        // ✅ Correct credentials → automatically enter app
        router.replace(roleHome);

      } catch (error: any) {
        // ❌ Wrong credentials
        setServerError(
          "Invalid credentials. Please check your email and password."
        );
      } finally {
        setIsSubmitting(false);

        // Keep the attempted credentials stored.
        // It will only try again when the user changes them.
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [
    username,
    password,
    login,
    router,
  ]);

  const handleSubmit = async () => {
    if (!username.trim()) {
      setFieldError("Email address is required");
      return;
    }

    if (!password) {
      setFieldError("Password is required");
      return;
    }

    if (password.length < 6) {
      setFieldError("Password must be at least 6 characters");
      return;
    }

    setFieldError("");
    setServerError("");
    setIsSubmitting(true);

    try {
      const { data } = await api.post("/users/login", {
        identifier: username.trim(),
        password,
      });

      const roleHome = getRoleHome(data.user?.role);

      if (!roleHome || !data.user || !data.token) {
        throw new Error(
          "Your account has no supported admin or employee role",
        );
      }

      await login(data.user, data.token);
      router.replace(roleHome);
    } catch (error: any) {
      const message =
        error?.message ||
        (error instanceof Error ? error.message : "Login failed");

      const isNetworkError =
        error instanceof TypeError ||
        message.toLowerCase().includes("network") ||
        message.toLowerCase().includes("failed to fetch") ||
        message.toLowerCase().includes("unable to connect");

      setServerError(
        isNetworkError
          ? "Network error. Check that the API server is running and your phone is on the same Wi-Fi network."
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 180,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          bounces={true}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Top Brand */}
          <View className="mb-8 items-center">
            <View
              className="h-16 w-16 items-center justify-center rounded-2xl bg-black"
              style={{
                shadowColor: "#f97316",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.18,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <Ionicons
                name="shield-checkmark"
                size={30}
                color="#f97316"
              />
            </View>

            <Text className="mt-4 text-2xl font-black text-black">
              Q-Techx
            </Text>

            <Text className="mt-1 text-sm text-gray-500">
              Admin & Employee Portal
            </Text>
          </View>

          {/* Login Card */}
          <View
            className="overflow-hidden rounded-[28px] border border-orange-100 bg-white"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 14,
              elevation: 4,
            }}
          >
            {/* Orange Top Accent */}
            <View className="h-1 w-full bg-orange-500" />

            <View className="p-6">
              {/* Header */}
              <View className="mb-7">
                <Text className="text-3xl font-black text-black">
                  Sign In
                </Text>

                <Text className="mt-2 text-sm leading-5 text-gray-500">
                  Enter your credentials to access your account.
                </Text>
              </View>

              {/* Email */}
              <Text className="mb-2 text-sm font-bold text-black">
                Email Address
              </Text>

              <View className="mb-5 flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-4">
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#f97316"
                />

                <TextInput
                  className="ml-3 flex-1 py-4 text-base text-black"
                  value={username}
                  onChangeText={(value) => {
                    setUsername(value);
                    setFieldError("");
                    setServerError("");
                  }}
                  placeholder="admin@company.com"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isSubmitting}
                />
              </View>

              {/* Password */}
              <Text className="mb-2 text-sm font-bold text-black">
                Password
              </Text>

              <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-4">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#f97316"
                />

                <TextInput
                  className="ml-3 flex-1 py-4 text-base text-black"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setFieldError("");
                    setServerError("");
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  editable={!isSubmitting}
                />

                <Pressable
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onPress={() =>
                    setShowPassword((visible) => !visible)
                  }
                  hitSlop={10}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={21}
                    color="#6b7280"
                  />
                </Pressable>
              </View>

              {/* Field Error */}
              {fieldError ? (
                <Text className="mt-2 text-xs font-medium text-red-500">
                  {fieldError}
                </Text>
              ) : null}

              {/* Server Error */}
              {serverError ? (
                <View className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                  <View className="flex-row items-start">
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#ef4444"
                    />

                    <Text className="ml-2 flex-1 text-xs leading-5 text-red-600">
                      {serverError}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Remember + Forgot */}
              <View className="mt-5 flex-row items-center justify-between">
                <Pressable
                  className="flex-row items-center"
                  onPress={() =>
                    setRememberMe((value) => !value)
                  }
                >
                  <View
                    className={
                      rememberMe
                        ? "h-5 w-5 items-center justify-center rounded-md bg-orange-500"
                        : "h-5 w-5 rounded-md border border-gray-300 bg-white"
                    }
                  >
                    {rememberMe ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="white"
                      />
                    ) : null}
                  </View>

                  <Text className="ml-2 text-sm text-gray-500">
                    Remember me
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    Alert.alert(
                      "Forgot password",
                      "Please contact your administrator.",
                    )
                  }
                >
                  <Text className="text-sm font-semibold text-orange-500">
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>

              {/* Sign In Button */}
              <Pressable
                className="mt-7 flex-row items-center justify-center rounded-xl bg-orange-500 py-4 active:bg-orange-600"
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{
                  shadowColor: "#f97316",
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-base font-black text-white">
                      Sign In
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="white"
                      style={{ marginLeft: 8 }}
                    />
                  </>
                )}
              </Pressable>

              {/* Divider */}
              <View className="my-6 flex-row items-center">
                <View className="h-px flex-1 bg-gray-200" />

                <Text className="mx-3 text-xs text-gray-400">
                  Need help?
                </Text>

                <View className="h-px flex-1 bg-gray-200" />
              </View>

              {/* Contact Administrator */}
              <Pressable
                className="items-center rounded-xl border border-orange-100 bg-orange-50 py-3"
                onPress={() =>
                  Linking.openURL("tel:+91 96591 33504")
                }
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="call-outline"
                    size={17}
                    color="#f97316"
                  />

                  <Text className="ml-2 text-sm font-semibold text-orange-600">
                    Contact Administrator
                  </Text>
                </View>
              </Pressable>

            </View>
          </View>

          {/* Bottom Branding */}
          <View className="mt-7 items-center">
            <View className="flex-row items-center">
              <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <Text className="mx-2 text-xs text-gray-400">
                Secure access
              </Text>
              <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}