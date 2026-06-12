import React from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle, Clock, Package, Truck, MapPin, ChevronLeft } from "lucide-react-native"
import { ordersApi } from "@/lib/api"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"

const STEPS = [
  { key: "PENDING",   label: "تم استلام الطلب",   icon: Clock },
  { key: "CONFIRMED", label: "تم تأكيد الطلب",    icon: CheckCircle },
  { key: "PREPARING", label: "جاري التحضير",       icon: Package },
  { key: "SHIPPING",  label: "في الطريق إليك",     icon: Truck },
  { key: "DELIVERED", label: "تم التسليم",          icon: MapPin },
]
const STATUS_ORDER = ["PENDING","CONFIRMED","PREPARING","SHIPPING","DELIVERED"]

export default function OrderDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>()
  const router   = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn:  () => ordersApi.get(id),
    refetchInterval: 30_000,
  })

  const order = data?.data
  const currentStep = order ? STATUS_ORDER.indexOf(order.status) : -1

  if (isLoading) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={{ padding: Spacing.lg }}>
        {Array.from({length: 4}).map((_,i) => (
          <View key={i} style={[styles.skeleton, { marginBottom: 12 }]} />
        ))}
      </View>
    </SafeAreaView>
  )

  if (!order) return null

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>تتبع الطلب</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        {/* Order ID */}
        <View style={styles.orderIdCard}>
          <Text style={styles.orderIdLabel}>رقم الطلب</Text>
          <Text style={styles.orderId}>#{id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString("ar-IQ", { year:"numeric", month:"long", day:"numeric" })}</Text>
          <Text style={[styles.orderTotal, { color: Colors.primary }]}>{order.total?.toLocaleString()} د.ع</Text>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>حالة الطلب</Text>
          {STEPS.map((step, i) => {
            const Icon    = step.icon
            const isDone  = i <= currentStep
            const isActive= i === currentStep
            const isLast  = i === STEPS.length - 1
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepIcon, isDone && styles.stepIconDone, isActive && styles.stepIconActive]}>
                    <Icon size={14} color={isDone ? Colors.white : Colors.textMuted} />
                  </View>
                  {!isLast && <View style={[styles.stepLine, i < currentStep && styles.stepLineDone]} />}
                </View>
                <View style={[styles.stepContent, !isLast && { paddingBottom: 20 }]}>
                  <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>
                    {step.label}
                  </Text>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>الحالة الحالية</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>المنتجات ({order.items?.length})</Text>
          {order.items?.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemImagePlaceholder}>
                <Text>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product?.nameAr}</Text>
                <Text style={styles.itemQty}>×{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()} د.ع</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bgSoft },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.lg, backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:           { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  orderIdCard:     { backgroundColor: Colors.bg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md },
  orderIdLabel:    { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  orderId:         { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary, fontFamily: "monospace" },
  orderDate:       { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  orderTotal:      { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginTop: 8 },
  card:            { backgroundColor: Colors.bg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  stepRow:         { flexDirection: "row", gap: Spacing.md },
  stepLeft:        { alignItems: "center" },
  stepIcon:        { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgSoft, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  stepIconDone:    { backgroundColor: Colors.success, borderColor: Colors.success },
  stepIconActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 6 },
  stepLine:        { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 3 },
  stepLineDone:    { backgroundColor: Colors.success },
  stepContent:     { flex: 1, paddingTop: 5 },
  stepLabel:       { fontSize: FontSize.sm, color: Colors.textMuted },
  stepLabelDone:   { color: Colors.text, fontWeight: FontWeight.medium },
  activeBadge:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  activeBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  itemRow:         { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.sm },
  itemImagePlaceholder: { width: 40, height: 40, backgroundColor: Colors.bgSoft, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  itemName:        { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  itemQty:         { fontSize: FontSize.xs, color: Colors.textMuted },
  itemPrice:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  skeleton:        { height: 80, backgroundColor: Colors.bgSoft, borderRadius: Radius.lg },
})
