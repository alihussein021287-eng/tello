import React, { useState } from "react"
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { Search, X, SlidersHorizontal } from "lucide-react-native"
import { FlashList } from "@shopify/flash-list"
import { productsApi } from "@/lib/api"
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"
import { t } from "@/lib/i18n"

export default function ProductsScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState((params.q as string) || "")
  const [page, setPage] = useState(1)

  const queryParams: Record<string, string> = {
    page: String(page), limit: "20",
    ...(search && { search }),
    ...(params.category && { category: params.category as string }),
  }

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => productsApi.list(queryParams),
  })

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Search size={14} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setPage(1)}
            placeholder={t("common.search_placeholder")}
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <SlidersHorizontal size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Results info */}
      {data && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {data.total} {search ? `نتيجة لـ "${search}"` : "منتج"}
          </Text>
        </View>
      )}

      {/* Grid */}
      {isLoading ? (
        <View style={styles.grid}>
          {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlashList
          data={data?.data || []}
          numColumns={2}
          estimatedItemSize={280}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          contentContainerStyle={{ padding: Spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🔍</Text>
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptyText}>جرّب كلمة بحث مختلفة</Text>
            </View>
          }
          ListFooterComponent={
            data?.hasMore ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => setPage((p) => p + 1)}
              >
                <Text style={styles.loadMoreText}>تحميل المزيد</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { padding: 4 },
  backText:   { fontSize: FontSize.xl, color: Colors.text },
  searchBar:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.bgSoft, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  searchInput:{ flex: 1, fontSize: FontSize.sm, color: Colors.text, padding: 0 },
  filterBtn:  { padding: 8 },
  resultsInfo:{ paddingHorizontal: Spacing.lg, paddingVertical: 6, backgroundColor: Colors.bgSoft, borderBottomWidth: 1, borderBottomColor: Colors.border },
  resultsText:{ fontSize: FontSize.xs, color: Colors.textMuted },
  grid:       { flexDirection: "row", flexWrap: "wrap", padding: Spacing.lg, gap: Spacing.sm },
  empty:      { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 4 },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textMuted },
  loadMore:   { margin: Spacing.lg, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: "center" },
  loadMoreText: { color: Colors.white, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
})
