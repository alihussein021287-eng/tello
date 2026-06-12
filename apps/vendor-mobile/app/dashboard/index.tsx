import React from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { DollarSign, ShoppingCart, Package, TrendingUp, Bell } from "lucide-react-native"
import { useRouter } from "expo-router"
import { vendorApi } from "@/lib/api"

const C = { primary:"#1B4FD8", gold:"#D4A853", emerald:"#10b981", text:"#111318", muted:"#6b7280", bg:"#ffffff", soft:"#f7f7f8", border:"#e5e7eb", white:"#ffffff" }

export default function VendorDashboard() {
  const router = useRouter()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn:  () => vendorApi.stats(),
  })

  const stats = data?.data

  const CARDS = [
    { label: "إجمالي المبيعات", value: stats?.totalRevenue || 0, suffix: " د.ع", color: C.emerald, icon: DollarSign },
    { label: "أرباحي الصافية",  value: stats?.myEarnings   || 0, suffix: " د.ع", color: C.gold,    icon: TrendingUp },
    { label: "الطلبات الكلية",  value: stats?.totalOrders  || 0, suffix: "",      color: C.primary, icon: ShoppingCart },
    { label: "المنتجات النشطة", value: stats?.totalProducts || 0, suffix: "",      color: "#8b5cf6", icon: Package },
  ]

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>مرحباً بك 👋</Text>
          <Text style={s.title}>داشبورد المتجر</Text>
        </View>
        <TouchableOpacity style={s.notifBtn}>
          <Bell size={20} color={C.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.primary} />}
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        {/* Stats Grid */}
        <View style={s.grid}>
          {CARDS.map(({ label, value, suffix, color, icon: Icon }) => (
            <View key={label} style={s.card}>
              <View style={[s.cardIcon, { backgroundColor: `${color}18` }]}>
                <Icon size={18} color={color} />
              </View>
              <Text style={[s.cardValue, { color }]}>{value.toLocaleString()}{suffix}</Text>
              <Text style={s.cardLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>إجراءات سريعة</Text>
          <View style={s.actionsGrid}>
            {[
              { label: "منتج جديد", emoji: "📦", route: "/products/new" },
              { label: "الطلبات",   emoji: "🛍️", route: "/orders" },
              { label: "الرسائل",   emoji: "💬", route: "/chat" },
              { label: "التقارير",  emoji: "📊", route: "/reports" },
            ].map(({ label, emoji, route }) => (
              <TouchableOpacity
                key={label}
                style={s.actionBtn}
                onPress={() => router.push(route as any)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</Text>
                <Text style={s.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Commission Info */}
        <View style={[s.section, { backgroundColor: `${C.primary}10`, borderWidth: 1, borderColor: `${C.primary}30` }]}>
          <Text style={[s.sectionTitle, { color: C.primary }]}>معلومات العمولة</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>نسبة عمولة Tello</Text>
            <Text style={{ color: C.primary, fontWeight: "700", fontSize: 16 }}>10%</Text>
          </View>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
            تُحسب تلقائياً عند كل عملية بيع مدفوعة
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.soft },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  greeting:    { fontSize: 12, color: C.muted },
  title:       { fontSize: 18, fontWeight: "700", color: C.text },
  notifBtn:    { padding: 8, backgroundColor: C.soft, borderRadius: 12 },
  grid:        { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card:        { flex: 1, minWidth: "45%", backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  cardIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cardValue:   { fontSize: 20, fontWeight: "800", marginBottom: 3 },
  cardLabel:   { fontSize: 11, color: C.muted },
  section:     { backgroundColor: C.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  sectionTitle:{ fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 10 },
  actionsGrid: { flexDirection: "row", gap: 10 },
  actionBtn:   { flex: 1, backgroundColor: C.soft, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.border },
  actionLabel: { fontSize: 11, fontWeight: "600", color: C.text },
})
