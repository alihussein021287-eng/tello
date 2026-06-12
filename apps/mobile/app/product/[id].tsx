import React, { useState } from "react"
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { Image } from "expo-image"
import * as Haptics from "expo-haptics"
import { ChevronLeft, Minus, Plus, ShoppingCart, Star } from "lucide-react-native"
import { productsApi } from "@/lib/api"
import { useCartStore } from "@/store"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"
import { t } from "@/lib/i18n"
import Toast from "react-native-toast-message"

const { width: W } = Dimensions.get("window")

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id),
  })
  const product = data?.data

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    addItem(product, qty)
    Toast.show({ type: "success", text1: t("product.add_cart"), visibilityTime: 2000 })
  }

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.imageSkeleton, { margin: Spacing.lg }]} />
        <View style={{ padding: Spacing.lg }}>
          {[90, 60, 40, 100].map((w, i) => (
            <View key={i} style={[styles.lineSkeleton, { width: `${w}%`, marginBottom: 10 }]} />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  const avg = product.reviews?.length
    ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
    : null

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>

        {/* Images */}
        <View style={styles.imageWrapper}>
          <Image
            source={product.images?.[activeImg] || require("@/assets/placeholder.png")}
            style={styles.mainImage}
            contentFit="contain"
            transition={150}
          />
        </View>

        {/* Thumbnails */}
        {product.images?.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {product.images.map((img: string, i: number) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveImg(i)}
                style={[styles.thumb, i === activeImg && styles.thumbActive]}
              >
                <Image source={img} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.vendor}>{product.vendor?.storeName}</Text>
          <Text style={styles.name}>{product.nameAr || product.name}</Text>

          {/* Rating */}
          {avg && (
            <View style={styles.ratingRow}>
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  color={s <= Math.round(avg) ? Colors.gold : Colors.border}
                  fill={s <= Math.round(avg) ? Colors.gold : "transparent"}
                />
              ))}
              <Text style={styles.reviewCount}>({product.reviews.length})</Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price.toLocaleString()}</Text>
            <Text style={styles.currency}> {t("common.iqd")}</Text>
            {product.comparePrice && (
              <Text style={styles.comparePrice}>{product.comparePrice.toLocaleString()}</Text>
            )}
          </View>

          {/* Description */}
          <Text style={styles.desc}>{product.descriptionAr || product.description}</Text>

          {/* Quantity */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>{t("product.qty")}</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(Math.min(product.stock, qty + 1))}
              >
                <Plus size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.stockText}>{product.stock} متوفر</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.addBtn, product.stock === 0 && styles.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
          activeOpacity={0.9}
        >
          <ShoppingCart size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>
            {product.stock === 0 ? t("product.out_of_stock") : t("product.add_cart")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  back:        { position: "absolute", top: 12, left: 12, zIndex: 10, backgroundColor: Colors.bg, borderRadius: Radius.full, padding: 8, borderWidth: 1, borderColor: Colors.border },
  imageWrapper:{ width: W, height: W * 0.85, backgroundColor: Colors.bgSoft },
  mainImage:   { width: "100%", height: "100%" },
  thumbRow:    { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  thumb:       { width: 56, height: 56, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, overflow: "hidden", marginRight: 8 },
  thumbActive: { borderColor: Colors.primary },
  info:        { padding: Spacing.lg },
  vendor:      { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  name:        { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, lineHeight: 28, marginBottom: Spacing.sm },
  ratingRow:   { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: Spacing.md },
  reviewCount: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: 4 },
  priceRow:    { flexDirection: "row", alignItems: "baseline", marginBottom: Spacing.md },
  price:       { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primary },
  currency:    { fontSize: FontSize.sm, color: Colors.textMuted },
  comparePrice:{ fontSize: FontSize.md, color: Colors.textMuted, textDecorationLine: "line-through", marginLeft: 8 },
  desc:        { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.lg },
  qtyRow:      { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  qtyLabel:    { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  qtyControl:  { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: "hidden" },
  qtyBtn:      { padding: 10, backgroundColor: Colors.bgSoft },
  qtyValue:    { paddingHorizontal: Spacing.lg, fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  stockText:   { fontSize: FontSize.xs, color: Colors.textMuted },
  ctaBar:      { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.lg, paddingBottom: Spacing.xl },
  addBtn:      { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnText:  { color: Colors.white, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  imageSkeleton: { height: W * 0.85, backgroundColor: Colors.bgSoft, borderRadius: Radius.lg },
  lineSkeleton:  { height: 14, backgroundColor: Colors.bgSoft, borderRadius: 7 },
})
