import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import Constants from "expo-constants"
import { Platform } from "react-native"
import { api } from "./api"

// إعداد كيف تظهر الإشعارات
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
})

// طلب إذن الإشعارات وتسجيل الـ token
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device")
    return null
  }

  // تحقق من الإذن الحالي
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== "granted") {
    return null
  }

  // الحصول على الـ Expo Push Token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) {
    console.error("EAS projectId not found in app.config.ts")
    return null
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data

  // تسجيل Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("tello", {
      name:       "Tello",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1B4FD8",
      sound:      "default",
    })
  }

  return token
}

// إرسال الـ token للـ backend
export async function savePushToken(token: string) {
  try {
    await api.post("/api/users/push-token", { token, platform: Platform.OS })
  } catch (err) {
    console.error("Failed to save push token:", err)
  }
}

// الاستماع للإشعارات
export function setupNotificationListeners(
  onReceive?: (notif: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void,
) {
  const receiveSub = Notifications.addNotificationReceivedListener(notif => {
    onReceive?.(notif)
  })

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    onResponse?.(response)
  })

  return () => {
    receiveSub.remove()
    responseSub.remove()
  }
}

// أنواع الإشعارات
export const NOTIF_TYPES = {
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_SHIPPED:   "ORDER_SHIPPED",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  NEW_OFFER:       "NEW_OFFER",
  VENDOR_ORDER:    "VENDOR_ORDER",
  LOW_STOCK:       "LOW_STOCK",
} as const
