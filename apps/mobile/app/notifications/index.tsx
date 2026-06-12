import React, { useEffect } from "react"
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, CheckCheck } from "lucide-react-native"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store"
import {
  registerForPushNotifications,
  savePushToken,
  setupNotificationListeners,
} from "@/lib/notifications"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"

export default function NotificationsScreen() {
  const { isLoggedIn } = useAuthStore()
  const qc = useQueryClient()

  // طلب إذن الإشعارات وتسجيل الـ token
  useEffect(() => {
    if (!isLoggedIn()) return
    registerForPushNotifications().then(token => {
      if (token) savePushToken(token)
    })

    const cleanup = setupNotificationListeners(
      () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    )
    return cleanup
  }, [isLoggedIn()])

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn:  () => api.get("/api/notifications").then(r => r.data),
    enabled:  isLoggedIn(),
    refetchInterval: 60_000,
  })

  const notifs  = data?.data  || []
  const unread  = data?.unread || 0

  const markAllRead = () => {
    api.patch("/api/notifications/read-all")
      .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))
  }

  const NOTIF_EMOJI: Record<string, string> = {
    ORDER_PLACED:    "🛒", ORDER_CONFIRMED: "✅",
    ORDER_SHIPPED:   "🚚", ORDER_DELIVERED: "📦",
    ORDER_CANCELLED: "❌", NEW_VENDOR_ORDER:"🏪",
    LOW_STOCK:       "⚠️", VENDOR_APPROVED: "🎉",
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={20} color={Colors.primary} />
          <Text style={styles.title}>الإشعارات</Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <CheckCheck size={14} color={Colors.primary} />
            <Text style={styles.markAllText}>تعليم الكل كمقروء</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {isLoading && Array.from({length: 5}).map((_, i) => (
          <View key={i} style={[styles.skeleton, { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm }]} />
        ))}

        {notifs.map((n: any) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.notifCard, !n.read && styles.notifUnread]}
            onPress={() => {
              api.patch(`/api/notifications/${n.id}/read`)
              qc.invalidateQueries({ queryKey: ["notifications"] })
            }}
            activeOpacity={0.7}
          >
            <View style={styles.notifIcon}>
              <Text style={{ fontSize: 22 }}>{NOTIF_EMOJI[n.type] || "🔔"}</Text>
            </View>
            <View style={styles.notifContent}>
              <Text style={[styles.notifTitle, !n.read && styles.notifTitleUnread]}>
                {n.title}
              </Text>
              <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
              <Text style={styles.notifTime}>
                {new Date(n.createdAt).toLocaleDateString("ar-IQ", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </Text>
            </View>
            {!n.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}

        {!isLoading && notifs.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 50, marginBottom: 12 }}>🔔</Text>
            <Text style={styles.emptyText}>لا توجد إشعارات</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bgSoft },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.lg, backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title:      { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  badge:      { backgroundColor: Colors.error, borderRadius: 99, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText:  { color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  markAllText:{ fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },
  notifCard:  { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md, backgroundColor: Colors.bg, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  notifUnread:{ backgroundColor: `${Colors.primary}08` },
  notifIcon:  { width: 44, height: 44, backgroundColor: Colors.bgSoft, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifContent:{ flex: 1 },
  notifTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text, lineHeight: 20 },
  notifTitleUnread: { fontWeight: FontWeight.bold },
  notifBody:  { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  notifTime:  { fontSize: FontSize.xs - 1, color: Colors.textMuted, marginTop: 4 },
  unreadDot:  { width: 8, height: 8, backgroundColor: Colors.primary, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  skeleton:   { height: 72, backgroundColor: Colors.bgSoft, borderRadius: Radius.lg },
  empty:      { alignItems: "center", paddingTop: 80 },
  emptyText:  { fontSize: FontSize.md, color: Colors.textMuted },
})
