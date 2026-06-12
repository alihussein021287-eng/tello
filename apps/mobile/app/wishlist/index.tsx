import React from "react"
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Image } from "expo-image"
import { Heart, ShoppingCart, Trash2 } from "lucide-react-native"
import * as Haptics from "expo-haptics"
import { api } from "@/lib/api"
import { useCartStore, useAuthStore } from "@/store"
import { Colors, Spacing, Radius, FontSize, FontWeight, SCREEN_W } from "@/lib/theme"

export default function WishlistScreen() {
  const router    = useRouter()
  const { isLoggedIn } = useAuthStore()
  const addItem   = useCartStore(s => s.addItem)
  const qc        = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn:  () => api.get("/api/wishlist").then(r => r.data),
    enabled:  isLoggedIn(),
  })

  const removeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/wishlist/${id}`).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  })

  const products = data?.data || []
  const CARD_W   = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2

  if (!isLoggedIn()) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>❤️</Text>
          <Text style={styles.emptyTitle}>سجّل دخولك أولاً</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push("/auth/login" as any)}>
            <Text style={styles.btnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heart size={20} color="#ef4444" fill="#ef4444" />
        <Text style={styles.title}>المفضلة</Text>
        {products.length > 0 && (
          <Text style={styles.count}>({products.length})</Text>
        )}
      </View>

      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: Spacing.lg }}
        columnWrapperStyle={{ gap: Spacing.sm }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={[styles.card, { width: CARD_W }]}
            onPress={() => router.push(`/product/${item.id}` as any)}
            activeOpacity={0.9}
          >
            <View style={styles.imageWrap}>
              <Image
                source={item.images?.[0] || require("@/assets/placeholder.png")}
                style={styles.image}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  removeMut.mutate(item.id)
                }}
              >
                <Trash2 size={14} color={Colors.error} />
              </TouchableOpacity>
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.nameAr}</Text>
              <View style={styles.footer}>
                <Text style={styles.price}>{item.price.toLocaleString()} <Text style={styles.curr}>د.ع</Text></Text>
                <TouchableOpacity
                  style={styles.cartBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    addItem(item)
                  }}
                >
                  <ShoppingCart size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.centered}>
              <Text style={{ fontSize: 50, marginBottom: 12 }}>💔</Text>
              <Text style={styles.emptyTitle}>المفضلة فارغة</Text>
              <TouchableOpacity style={styles.btn} onPress={() => router.push("/products" as any)}>
                <Text style={styles.btnText}>تصفح المنتجات</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bgSoft },
  header:    { flexDirection: "row", alignItems: "center", gap: 8, padding: Spacing.lg, backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:     { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  count:     { fontSize: FontSize.sm, color: Colors.textMuted },
  card:      { backgroundColor: Colors.bg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  imageWrap: { position: "relative", aspectRatio: 1, backgroundColor: Colors.bgSoft },
  image:     { width: "100%", height: "100%" },
  removeBtn: { position: "absolute", top: 6, end: 6, backgroundColor: Colors.white, borderRadius: Radius.full, padding: 6, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  info:      { padding: Spacing.sm },
  name:      { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.text, marginBottom: 4, lineHeight: 16, minHeight: 32 },
  footer:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  curr:      { fontSize: FontSize.xs, fontWeight: FontWeight.regular, color: Colors.textMuted },
  cartBtn:   { width: 28, height: 28, backgroundColor: Colors.primary, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  centered:  { alignItems: "center", paddingTop: 60 },
  emptyTitle:{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textMuted, marginBottom: Spacing.lg },
  btn:       { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg },
  btnText:   { color: Colors.white, fontWeight: FontWeight.bold },
})
