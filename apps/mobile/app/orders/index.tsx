import React from "react"
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { ShoppingBag, ChevronLeft, Package } from "lucide-react-native"
import { ordersApi } from "@/lib/api"
import { useAuthStore } from "@/store"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"
import { t } from "@/lib/i18n"

const STATUS_AR: Record<string, string> = {
  PENDING:   "انتظار", CONFIRMED: "مؤكد",
  PREPARING: "جاري التحضير", SHIPPING: "في الطريق",
  DELIVERED: "مُسلَّم", CANCELLED: "ملغي",
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b", CONFIRMED: "#3b82f6", PREPARING: "#8b5cf6",
  SHIPPING: "#6366f1", DELIVERED: "#10b981", CANCELLED: "#ef4444",
}

export default function OrdersScreen() {
  const router   = useRouter()
  const { isLoggedIn } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn:  () => ordersApi.list(),
    enabled:  isLoggedIn(),
  })

  if (!isLoggedIn()) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔐</Text>
          <Text style={styles.emptyTitle}>سجّل دخولك أولاً</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/auth/login" as any)}>
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <ShoppingBag size={20} color={Colors.primary} />
        <Text style={styles.title}>{t("nav.orders" as any) || "طلباتي"}</Text>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
          {Array.from({length: 4}).map((_, i) => (
            <View key={i} style={[styles.skeleton, { marginBottom: Spacing.sm }]} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
          {data?.data?.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push(`/orders/${order.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.orderLeft}>
                <View style={styles.orderIcon}>
                  <Package size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.orderMeta}>
                    {order.items?.length} منتج • {new Date(order.createdAt).toLocaleDateString("ar-IQ")}
                  </Text>
                </View>
              </View>

              <View style={styles.orderRight}>
                <Text style={styles.orderPrice}>{order.total?.toLocaleString()} د.ع</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[order.status]}20` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[order.status] }]}>
                    {STATUS_AR[order.status]}
                  </Text>
                </View>
              </View>

              <ChevronLeft size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          {!isLoading && !data?.data?.length && (
            <View style={styles.centered}>
              <Text style={{ fontSize: 50, marginBottom: 12 }}>🛍️</Text>
              <Text style={styles.emptyTitle}>ما عندك طلبات بعد</Text>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.push("/products" as any)}
              >
                <Text style={styles.loginBtnText}>تسوق الآن</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  header:    { flexDirection: "row", alignItems: "center", gap: 8, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:     { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  orderCard: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.bg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  orderLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md, flex: 1 },
  orderIcon: { width: 40, height: 40, backgroundColor: `${Colors.primary}15`, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  orderId:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, fontFamily: "monospace" },
  orderMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  orderRight:{ alignItems: "flex-end", marginEnd: 4 },
  orderPrice:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: 3 },
  statusBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  skeleton:  { height: 70, backgroundColor: Colors.bgSoft, borderRadius: Radius.lg },
  centered:  { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyTitle:{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textMuted, marginBottom: Spacing.lg },
  loginBtn:  { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg },
  loginBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
})
