import React from "react"
import {
  TouchableOpacity, View, Text, StyleSheet, Dimensions,
} from "react-native"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"
import { useCartStore } from "@/store"
import { t } from "@/lib/i18n"

const CARD_W = (Dimensions.get("window").width - Spacing.lg * 2 - Spacing.sm) / 2

interface ProductCardProps {
  product: any
  onPress?: () => void
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    addItem(product)
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.92}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={product.images?.[0] || require("@/assets/placeholder.png")}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {discount && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{discount}%</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.vendor} numberOfLines={1}>
          {product.vendor?.storeName}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.nameAr || product.name}
        </Text>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>
              {product.price.toLocaleString()} <Text style={styles.currency}>{t("common.iqd")}</Text>
            </Text>
            {product.comparePrice && (
              <Text style={styles.comparePrice}>
                {product.comparePrice.toLocaleString()}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.cartBtn, product.stock === 0 && styles.cartBtnDisabled]}
            onPress={handleAddToCart}
            disabled={product.stock === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.cartBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// Skeleton
export function ProductCardSkeleton() {
  return (
    <View style={[styles.card, { opacity: 0.6 }]}>
      <View style={[styles.imageContainer, { backgroundColor: Colors.border }]} />
      <View style={styles.info}>
        <View style={{ height: 10, backgroundColor: Colors.border, borderRadius: 5, width: "60%", marginBottom: 6 }} />
        <View style={{ height: 12, backgroundColor: Colors.border, borderRadius: 5, width: "90%", marginBottom: 4 }} />
        <View style={{ height: 12, backgroundColor: Colors.border, borderRadius: 5, width: "70%", marginBottom: 8 }} />
        <View style={{ height: 16, backgroundColor: Colors.border, borderRadius: 5, width: "50%" }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: Colors.bg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.bgSoft,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  info: {
    padding: Spacing.sm,
  },
  vendor: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: Spacing.sm,
    minHeight: 36,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  currency: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
  },
  comparePrice: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  cartBtn: {
    width: 30,
    height: 30,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtnDisabled: {
    backgroundColor: Colors.border,
  },
  cartBtnText: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: FontWeight.bold,
  },
})
