import React, { useState } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Pressable, I18nManager,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { Search, Bell, Zap, Shield, Truck } from "lucide-react-native"
import { FlashList } from "@shopify/flash-list"
import { productsApi, categoriesApi } from "@/lib/api"
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"
import { t } from "@/lib/i18n"

const CATEGORY_EMOJI: Record<string, string> = {
  default: "🏺", electronics: "📱", fashion: "👗",
  home: "🏠", food: "🍎", beauty: "✨", sports: "⚽",
}

export default function HomeScreen() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const { data: products, isLoading: prodLoading } = useQuery({
    queryKey: ["products", "home"],
    queryFn: () => productsApi.list({ limit: "10" }),
  })

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  })

  const handleSearch = () => {
    if (search.trim()) router.push(`/products?q=${encodeURIComponent(search)}`)
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>أهلاً 👋</Text>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>T</Text>
              </View>
              <Text style={styles.logoName}>Tello</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Bell size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push("/products")}
          activeOpacity={0.8}
        >
          <Search size={16} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>{t("common.search_placeholder")}</Text>
        </TouchableOpacity>

        {/* Hero Banner */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t("home.hero")}</Text>
            <Text style={styles.heroSub}>{t("home.hero_sub")}</Text>
            <TouchableOpacity
              style={styles.heroCTA}
              onPress={() => router.push("/products")}
              activeOpacity={0.9}
            >
              <Text style={styles.heroCTAText}>تسوّق الآن</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroEmoji}>🏺</Text>
        </View>

        {/* Trust badges */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trustRow}>
          {[
            { icon: <Truck size={14} color={Colors.primary} />, label: "توصيل سريع" },
            { icon: <Shield size={14} color={Colors.primary} />, label: "دفع آمن" },
            { icon: <Zap size={14} color={Colors.gold} />, label: "آلاف المنتجات" },
          ].map(({ icon, label }) => (
            <View key={label} style={styles.trustBadge}>
              {icon}
              <Text style={styles.trustLabel}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Categories */}
        {categories?.data?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("home.categories")}</Text>
              <TouchableOpacity onPress={() => router.push("/products")}>
                <Text style={styles.seeAll}>{t("home.see_all")}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesRow}>
                {categories.data.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryItem}
                    onPress={() => router.push(`/products?category=${cat.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.categoryIcon}>
                      <Text style={{ fontSize: 22 }}>
                        {CATEGORY_EMOJI[cat.name?.toLowerCase()] || CATEGORY_EMOJI.default}
                      </Text>
                    </View>
                    <Text style={styles.categoryName} numberOfLines={2}>
                      {cat.nameAr || cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.featured")}</Text>
            <TouchableOpacity onPress={() => router.push("/products")}>
              <Text style={styles.seeAll}>{t("home.see_all")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {prodLoading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products?.data?.map((p: any) => <ProductCard key={p.id} product={p} />)
            }
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bgSoft },
  scroll:  { flex: 1 },
  header:  {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    backgroundColor: Colors.bg,
  },
  greeting:    { fontSize: FontSize.xs, color: Colors.textMuted },
  logoRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  logoBox:     { width: 26, height: 26, backgroundColor: Colors.primary, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  logoText:    { color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13 },
  logoName:    { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  notifBtn:    { padding: 8, backgroundColor: Colors.bgSoft, borderRadius: Radius.md },
  searchBar:   {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.bg, marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchPlaceholder: { color: Colors.textMuted, fontSize: FontSize.sm, flex: 1 },
  hero: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.xl, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    overflow: "hidden",
  },
  heroContent: { flex: 1 },
  heroTitle:   { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white, lineHeight: 24, marginBottom: 4 },
  heroSub:     { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginBottom: Spacing.md, lineHeight: 18 },
  heroCTA:     { backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.md, alignSelf: "flex-start" },
  heroCTAText: { color: Colors.primary, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  heroEmoji:   { fontSize: 50, marginLeft: Spacing.sm },
  trustRow:    { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  trustBadge:  { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  trustLabel:  { fontSize: FontSize.xs, color: Colors.textMuted },
  section:     { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  sectionTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  seeAll:      { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  categoriesRow: { flexDirection: "row", gap: Spacing.sm },
  categoryItem:  { alignItems: "center", width: 70 },
  categoryIcon:  { width: 56, height: 56, backgroundColor: Colors.bg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  categoryName:  { fontSize: FontSize.xs, color: Colors.text, textAlign: "center", lineHeight: 14 },
  productsGrid:  { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
})
