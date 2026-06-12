import React from "react"
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Image } from "expo-image"
import * as Haptics from "expo-haptics"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react-native"
import { useCartStore } from "@/store"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"
import { t } from "@/lib/i18n"

export default function CartScreen() {
  const { items, removeItem, updateQty, total, clearCart } = useCartStore()
  const router = useRouter()

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("cart.title")}</Text>
        </View>
        <View style={styles.empty}>
          <Text style={{ fontSize: 56, marginBottom: 12 }}>🛒</Text>
          <Text style={styles.emptyTitle}>{t("cart.empty")}</Text>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.push("/products")}
          >
            <Text style={styles.continueBtnText}>{t("cart.continue")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("cart.title")}</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>مسح الكل</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <View key={item.productId} style={styles.item}>
            <View style={styles.itemImage}>
              <Image
                source={item.product.images?.[0] || require("@/assets/placeholder.png")}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>

            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product.nameAr || item.product.name}
              </Text>
              <Text style={styles.itemPrice}>
                {(item.product.price * item.quantity).toLocaleString()} {t("common.iqd")}
              </Text>

              <View style={styles.itemActions}>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      updateQty(item.productId, item.quantity - 1)
                    }}
                  >
                    <Minus size={14} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      updateQty(item.productId, item.quantity + 1)
                    }}
                  >
                    <Plus size={14} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                    removeItem(item.productId)
                  }}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Summary + Checkout */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("cart.total")}</Text>
          <Text style={styles.summaryValue}>
            {total().toLocaleString()} {t("common.iqd")}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push("/checkout")}
          activeOpacity={0.9}
        >
          <ShoppingBag size={20} color={Colors.white} />
          <Text style={styles.checkoutText}>{t("cart.checkout")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:       { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  clearText:   { fontSize: FontSize.sm, color: Colors.error },
  scroll:      { flex: 1 },
  empty:       { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textMuted, marginBottom: Spacing.xl },
  continueBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: Radius.lg },
  continueBtnText: { color: Colors.white, fontWeight: FontWeight.semibold },
  item:        { flexDirection: "row", gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemImage:   { width: 80, height: 80, borderRadius: Radius.md, overflow: "hidden", backgroundColor: Colors.bgSoft },
  itemInfo:    { flex: 1 },
  itemName:    { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text, lineHeight: 18, marginBottom: 4 },
  itemPrice:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing.sm },
  itemActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyRow:      { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, overflow: "hidden" },
  qtyBtn:      { padding: 7, backgroundColor: Colors.bgSoft },
  qtyText:     { paddingHorizontal: Spacing.md, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  deleteBtn:   { padding: 6 },
  summary:     { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  summaryRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel:{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  summaryValue:{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  checkoutBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  checkoutText:{ color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
})
