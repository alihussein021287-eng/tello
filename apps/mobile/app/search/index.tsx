import React, { useState, useRef } from "react"
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, FlatList, ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { Image } from "expo-image"
import { Search, X, Sparkles } from "lucide-react-native"
import { productsApi, aiApi } from "@/lib/api"
import { useCartStore } from "@/store"
import { Colors, Spacing, Radius, FontSize, FontWeight, SCREEN_W } from "@/lib/theme"
import * as Haptics from "expo-haptics"
import Toast from "react-native-toast-message"

export default function SearchScreen() {
  const router      = useRouter()
  const addItem     = useCartStore(s => s.addItem)
  const inputRef    = useRef<TextInput>(null)
  const [query, setQuery]       = useState("")
  const [submitted, setSubmitted] = useState("")
  const [aiMode, setAiMode]     = useState(false)

  // Regular search
  const { data, isLoading } = useQuery({
    queryKey: ["search", submitted],
    queryFn:  () => productsApi.list({ search: submitted, limit: "30" }),
    enabled:  submitted.length >= 2 && !aiMode,
  })

  // AI search
  const { data: aiData, isLoading: aiLoading } = useQuery({
    queryKey: ["ai-search", submitted],
    queryFn:  () => aiApi.smartSearch(submitted),
    enabled:  submitted.length >= 2 && aiMode,
  })

  const results = aiMode ? (aiData?.data || []) : (data?.data || [])
  const loading  = aiMode ? aiLoading : isLoading

  const handleSubmit = () => {
    if (query.trim().length >= 2) {
      setSubmitted(query.trim())
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const clear = () => { setQuery(""); setSubmitted("") }

  const CARD_W = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>

      {/* Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Search size={15} color={Colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            placeholder="ابحث عن أي منتج..."
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clear}>
              <X size={15} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* AI Toggle */}
        <TouchableOpacity
          style={[styles.aiBtn, aiMode && styles.aiBtnActive]}
          onPress={() => { setAiMode(!aiMode); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
        >
          <Sparkles size={16} color={aiMode ? Colors.white : Colors.gold} />
        </TouchableOpacity>
      </View>

      {/* AI Mode Banner */}
      {aiMode && (
        <View style={styles.aiBanner}>
          <Sparkles size={12} color={Colors.gold} />
          <Text style={styles.aiBannerText}>بحث ذكي — يفهم اللهجة العراقية</Text>
        </View>
      )}

      {/* Results */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {!loading && submitted && (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: Spacing.lg }}
          columnWrapperStyle={{ gap: Spacing.sm }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {results.length} نتيجة لـ "{submitted}"
            </Text>
          }
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              style={[styles.card, { width: CARD_W }]}
              onPress={() => router.push(`/product/${item.id}` as any)}
              activeOpacity={0.9}
            >
              <View style={styles.imageWrap}>
                {item.images?.[0]
                  ? <Image source={item.images[0]} style={{ width:"100%", height:"100%" }} contentFit="cover" />
                  : <View style={styles.imagePlaceholder}><Text style={{ fontSize: 28 }}>📦</Text></View>
                }
              </View>
              <View style={{ padding: Spacing.sm }}>
                <Text style={styles.productName} numberOfLines={2}>{item.nameAr || item.name}</Text>
                <View style={styles.productFooter}>
                  <Text style={styles.price}>{item.price?.toLocaleString()} <Text style={styles.curr}>د.ع</Text></Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => { addItem(item); Toast.show({ type:"success", text1:"أضيف للسلة", visibilityTime:1500 }) }}
                  >
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
              <Text style={styles.emptyText}>لا توجد نتائج</Text>
              {aiMode && <Text style={styles.emptySubText}>جرب البحث بكلمات مختلفة</Text>}
            </View>
          }
        />
      )}

      {/* Empty state */}
      {!submitted && (
        <View style={styles.centered}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
          <Text style={styles.emptyText}>ابحث عن أي شيء</Text>
          <Text style={styles.emptySubText}>جرب: "موبايل مو غالي" أو "ملابس رياضية"</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { fontSize: FontSize.xl, color: Colors.text, paddingEnd: 4 },
  searchBar:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.bgSoft, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  input:       { flex: 1, fontSize: FontSize.sm, color: Colors.text, padding: 0 },
  aiBtn:       { width: 36, height: 36, padding: 8, backgroundColor: Colors.bgSoft, borderRadius: Radius.md, borderWidth: 1, borderColor: `${Colors.gold}60` },
  aiBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  aiBanner:    { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: 6, backgroundColor: `${Colors.gold}15`, borderBottomWidth: 1, borderBottomColor: `${Colors.gold}30` },
  aiBannerText:{ fontSize: FontSize.xs, color: Colors.gold, fontWeight: FontWeight.medium },
  centered:    { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 40 },
  resultCount: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  card:        { backgroundColor: Colors.bg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  imageWrap:   { aspectRatio: 1, backgroundColor: Colors.bgSoft },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.text, marginBottom: 4, minHeight: 32, lineHeight: 16 },
  productFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  curr:        { fontSize: FontSize.xs, fontWeight: FontWeight.regular, color: Colors.textMuted },
  addBtn:      { width: 26, height: 26, backgroundColor: Colors.primary, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center" },
  addBtnText:  { color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, lineHeight: 18 },
  emptyText:   { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 6 },
  emptySubText:{ fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
})
