import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";
import { useAuth } from "../auth/AuthContext";
import { getRoleHome } from "../auth/roleUtils";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldError, setFieldError] = useState("");

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
      // Send login request to the real API
      const { data } = await api.post("/users/login", {
        identifier: username.trim(),
        password,
      });
      const roleHome = getRoleHome(data.user?.role);

      if (!roleHome || !data.user || !data.token) {
        throw new Error("Your account has no supported admin or employee role");
      }

      await login(data.user, data.token);
      router.replace(roleHome);
    } catch (error) {
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
          ? `Network error. Check that the API server is running and your phone is on the same Wi-Fi network.`
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#111317]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-5 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="rounded-[28px] border border-gray-800 bg-[#181a1f] p-6">
            <Text className="text-3xl font-bold text-white">Sign In</Text>
            <Text className="mt-2 text-sm leading-5 text-gray-400">
              Enter your credentials to access your account.
            </Text>
            <View className="mb-7 mt-5 h-1 w-10 rounded-full bg-orange-500" />

            <Text className="mb-2 text-sm font-medium text-white">
              Email Address
            </Text>
            <View className="mb-5 flex-row items-center rounded-xl border border-gray-700 bg-[#101215] px-4">
              <Ionicons name="mail-outline" size={20} color="#f97316" />
              <TextInput
                className="ml-3 flex-1 py-4 text-base text-white"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  setFieldError("");
                  setServerError("");
                }}
                placeholder="admin@company.com"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isSubmitting}
              />
            </View>

            <Text className="mb-2 text-sm font-medium text-white">
              Password
            </Text>
            <View className="flex-row items-center rounded-xl border border-gray-700 bg-[#101215] px-4">
              <Ionicons name="lock-closed-outline" size={20} color="#f97316" />
              <TextInput
                className="ml-3 flex-1 py-4 text-base text-white"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setFieldError("");
                  setServerError("");
                }}
                placeholder="Enter your password"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showPassword}
                editable={!isSubmitting}
              />
              <Pressable
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
                onPress={() => setShowPassword((visible) => !visible)}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </Pressable>
            </View>

            {fieldError ? (
              <Text className="mt-2 text-xs text-red-400">{fieldError}</Text>
            ) : null}
            {serverError ? (
              <Text className="mt-3 text-center text-sm text-red-400">
                {serverError}
              </Text>
            ) : null}

            <View className="mt-5 flex-row items-center justify-between">
              <Pressable
                className="flex-row items-center"
                onPress={() => setRememberMe((value) => !value)}
              >
                <View
                  className={
                    rememberMe
                      ? "h-5 w-5 items-center justify-center rounded border border-orange-500 bg-orange-500"
                      : "h-5 w-5 rounded border border-gray-600 bg-[#101215]"
                  }
                >
                  {rememberMe ? (
                    <Ionicons name="checkmark" size={14} color="white" />
                  ) : null}
                </View>
                <Text className="ml-2 text-sm text-gray-400">Remember me</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Forgot password",
                    "Please contact your administrator.",
                  )
                }
              >
                <Text className="text-sm text-orange-500">
                  Forgot Password?
                </Text>
              </Pressable>
            </View>

            <Pressable
              className="mt-7 flex-row items-center justify-center rounded-xl bg-orange-500 py-4 active:bg-orange-600"
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-bold text-white">Sign In</Text>
              )}
              {!isSubmitting ? (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="white"
                  style={{ marginLeft: 8 }}
                />
              ) : null}
            </Pressable>

            <Pressable
              className="mt-6 items-center"
              onPress={() => Linking.openURL("tel:+1234567890")}
            >
              <Text className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Text className="text-orange-500">Contact Administrator</Text>
              </Text>
            </Pressable>

            <Pressable
              className="mt-5 flex-row items-center justify-center"
              onPress={() => router.replace("/login")}
            >
              <Ionicons name="arrow-back" size={16} color="#9ca3af" />
              <Text className="ml-1 text-sm text-gray-400">Back Home</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
