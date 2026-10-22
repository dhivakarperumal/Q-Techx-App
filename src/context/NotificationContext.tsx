import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { isRunningInExpoGo } from "expo";
import { Href, useRouter } from "expo-router";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../auth/AuthContext";
import api, { API_BASE_URL } from "../api";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (notification: AppNotification) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);
const PUSH_TOKEN_STORAGE_KEY = "registeredPushToken";
type NotificationsModule = typeof import("expo-notifications");

async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (isRunningInExpoGo()) return null;

  try {
    const notifications = await import("expo-notifications");
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return notifications;
  } catch (error) {
    console.warn(
      "[Notifications] Native notification module unavailable. Rebuild the development app to enable push alerts.",
      error
    );
    return null;
  }
}

function normalizeNotification(value: unknown): AppNotification | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.title !== "string") return null;

  return {
    id: item.id,
    type: typeof item.type === "string" ? item.type : "general",
    title: item.title,
    message: typeof item.message === "string" ? item.message : "",
    link: typeof item.link === "string" ? item.link : null,
    related_id: typeof item.related_id === "string" ? item.related_id : null,
    is_read: item.is_read === true || String(item.is_read) === "1",
    created_at: typeof item.created_at === "string" ? item.created_at : "",
  };
}

function getInternalLink(link: unknown): string | null {
  if (typeof link !== "string" || !link.startsWith("/") || link.startsWith("//")) return null;
  return link;
}

async function registerForPushNotifications(
  notifications: NotificationsModule
): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) return null;

  if (Platform.OS === "android") {
    await notifications.setNotificationChannelAsync("default", {
      name: "Notifications",
      importance: notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#f97316",
    });
  }

  const { status: existingStatus } = await notifications.getPermissionsAsync();
  const { status } =
    existingStatus === "granted"
      ? { status: existingStatus }
      : await notifications.requestPermissionsAsync();
  if (status !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error("Expo EAS project ID is missing from app configuration");

  const result = await notifications.getExpoPushTokenAsync({ projectId });
  return result.data;
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [notificationState, setNotificationState] = useState<{
    token: string | null;
    items: AppNotification[];
  }>({ token: null, items: [] });
  const notifications =
    token && notificationState.token === token ? notificationState.items : [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const handledResponseRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setNotificationState({ token: null, items: [] });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/notifications", { params: { limit: 100 } });
      const items = Array.isArray(response.data?.data)
        ? response.data.data.map(normalizeNotification).filter(Boolean) as AppNotification[]
        : [];
      setNotificationState({ token, items });
    } catch (requestError) {
      console.error("[Notifications] Failed to load notifications:", requestError);
      setError("Could not load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markRead = useCallback(async (notification: AppNotification) => {
    if (notification.is_read) return;
    setError(null);
    try {
      await api.patch(`/notifications/${encodeURIComponent(notification.id)}/read`);
      setNotificationState((current) => ({
        token,
        items: current.token === token
          ? current.items.map((item) =>
              item.id === notification.id ? { ...item, is_read: true } : item
            )
          : [],
      }));
    } catch (requestError) {
      console.error("[Notifications] Failed to mark notification as read:", requestError);
      setError("Could not update this notification.");
      throw requestError;
    }
  }, [token]);

  const markAllRead = useCallback(async () => {
    setError(null);
    try {
      await api.patch("/notifications/read-all");
      setNotificationState((current) => ({
        token,
        items: current.token === token
          ? current.items.map((item) => ({ ...item, is_read: true }))
          : [],
      }));
    } catch (requestError) {
      console.error("[Notifications] Failed to mark notifications as read:", requestError);
      setError("Could not update notifications.");
    }
  }, [token]);

  useEffect(() => {
    if (isLoading || !token || !user) return;
    let active = true;
    void Promise.resolve().then(() => refresh());
    let responseSubscription: { remove: () => void } | null = null;

    const socketUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    const socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
    });
    socketRef.current = socket;
    socket.on("notification", (payload: unknown) => {
      const notification = normalizeNotification(payload);
      if (!notification) return;
      setNotificationState((current) => ({
        token,
        items: [
          notification,
          ...(current.token === token ? current.items : []).filter((item) => item.id !== notification.id),
        ].slice(0, 100),
      }));
    });
    socket.on("connect_error", (socketError) => {
      console.error("[Notifications] Realtime connection failed:", socketError.message);
    });

    void (async () => {
      try {
        const notificationsModule = await loadNotificationsModule();
        if (!active || !notificationsModule) return;

        const handleResponse = (
          response: import("expo-notifications").NotificationResponse | null
        ) => {
          if (!response) return;
          const requestId = response.notification.request.identifier;
          if (handledResponseRef.current === requestId) return;
          handledResponseRef.current = requestId;
          const data = response.notification.request.content.data;
          const link = getInternalLink(data?.link);
          if (link) router.push(link as Href);
          const notificationId = data?.notificationId;
          void (async () => {
            if (typeof notificationId === "string") {
              try {
                await api.patch(`/notifications/${encodeURIComponent(notificationId)}/read`);
                setNotificationState((current) => ({
                  token,
                  items: current.token === token
                    ? current.items.map((item) =>
                        item.id === notificationId ? { ...item, is_read: true } : item
                      )
                    : [],
                }));
              } catch (requestError) {
                console.error("[Notifications] Failed to mark tapped notification as read:", requestError);
              }
            }
            await refresh();
          })();
        };

        handleResponse(notificationsModule.getLastNotificationResponse());
        responseSubscription =
          notificationsModule.addNotificationResponseReceivedListener(handleResponse);

        const pushToken = await registerForPushNotifications(notificationsModule);
        if (!active || !pushToken) return;
        await api.post("/notifications/push-token", { token: pushToken });
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);
      } catch (registrationError) {
        console.error("[Notifications] Push registration failed:", registrationError);
      }
    })();

    return () => {
      active = false;
      responseSubscription?.remove();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [isLoading, token, user, refresh, router]);

  const unreadCount = notifications.reduce((count, item) => count + (item.is_read ? 0 : 1), 0);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, error, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
}

type NotificationInboxProps = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationInbox({ visible, onClose }: NotificationInboxProps) {
  const router = useRouter();
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications();

  const openNotification = async (notification: AppNotification) => {
    try {
      await markRead(notification);
      onClose();
      const link = getInternalLink(notification.link);
      if (link) router.push(link as Href);
    } catch {
      // The error is shown in the inbox; keep it open so the user can retry.
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose}>
        <Pressable
          className="absolute right-4 top-20 w-[335px] max-h-[560px] overflow-hidden rounded-3xl bg-white shadow-xl"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
            <View>
              <Text className="text-base font-black text-slate-900">Notifications</Text>
              <Text className="mt-0.5 text-[11px] text-slate-500">
                {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {unreadCount > 0 ? (
                <TouchableOpacity onPress={() => void markAllRead()} accessibilityRole="button">
                  <Text className="text-xs font-bold text-orange-600">Read all</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => void refresh()} accessibilityLabel="Refresh notifications">
                <Text className="px-2 py-1 text-xs font-bold text-slate-500">Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close notifications">
                <Text className="px-1 py-1 text-lg text-slate-500">×</Text>
              </TouchableOpacity>
            </View>
          </View>
          {error ? <Text className="px-5 pt-3 text-xs text-red-600">{error}</Text> : null}
          {loading && notifications.length === 0 ? (
            <Text className="px-5 py-10 text-center text-sm text-slate-500">Loading notifications...</Text>
          ) : (
            <ScrollView className="max-h-[430px]">
              {notifications.length ? notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  activeOpacity={0.7}
                  onPress={() => void openNotification(notification)}
                  className={`border-b border-slate-100 px-5 py-3.5 ${notification.is_read ? "bg-white" : "bg-orange-50/70"}`}
                >
                  <View className="flex-row items-start">
                    {!notification.is_read ? <View className="mr-2 mt-1.5 h-2 w-2 rounded-full bg-orange-500" /> : null}
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900">{notification.title}</Text>
                      <Text className="mt-1 text-xs leading-5 text-slate-600">{notification.message}</Text>
                      {notification.created_at ? (
                        <Text className="mt-1.5 text-[10px] text-slate-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              )) : (
                <View className="items-center justify-center px-6 py-12">
                  <Text className="text-sm font-bold text-slate-700">You are all caught up</Text>
                  <Text className="mt-1 text-center text-xs text-slate-400">New updates will appear here.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
