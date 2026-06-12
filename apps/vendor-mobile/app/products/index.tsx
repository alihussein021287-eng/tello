// =============================================
// Vendor Mobile — Products Screen
// =============================================
import React, { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Image } from "expo-image"
import { Plus, Search, Edit, Trash2, Package } from "lucide-react-native"
import { useRouter } from "expo-router"
import { vendorApi } from "@/lib/api"
import Toast from "react-native-toast-message"

const C = { primary:"#1B4FD8", text:"#111318", muted:"#6b7280", bg:"#ffffff", soft:"#f7f7f8", border:"#e5e7eb", error:"#ef4444" }

export default function VendorProductsScreen() {
  const router = useRouter()
  const qc     = useQueryClient()
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products", search],
    queryFn:  () => vendorApi.products.list({ search }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => vendorApi.products.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] })
      Toast.show({ type: "success", text1: "تم حذف المنتج" })
    },
  })

  const products = data?.data || []

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.soft }} edges={["top"]}>
      <View style={[s.header, { justifyContent: "space-between" }]}>
        <Text style={s.title}>منتجاتي ({products.length})</Text>
        <TouchableOpacity
          style={{ backgroundColor: C.primary, borderRadius: 10, padding: 8 }}
          onPress={() => router.push("/products/new" as any)}
        >
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={s.searchBar}>
          <Search size={14} color={C.muted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="بحث..." placeholderTextColor={C.muted} style={s.searchInput} />
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }: { item: any }) => (
          <View style={s.productCard}>
            <View style={s.productImg}>
              {item.images?.[0]
                ? <Image source={item.images[0]} style={{ width:"100%", height:"100%" }} contentFit="cover" />
                : <Package size={20} color={C.muted} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.productName} numberOfLines={1}>{item.nameAr}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.primary }}>{item.price.toLocaleString()} د.ع</Text>
              <Text style={{ fontSize: 11, color: item.stock < 5 ? C.error : C.muted }}>{item.stock} قطعة</Text>
            </View>
            <View style={{ gap: 6 }}>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push(`/products/${item.id}` as any)}>
                <Edit size={14} color={C.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.iconBtn, { backgroundColor: "#fee2e2" }]}
                onPress={() => Alert.alert("حذف", "تأكيد الحذف؟", [
                  { text: "إلغاء" },
                  { text: "حذف", style: "destructive", onPress: () => deleteMut.mutate(item.id) }
                ])}
              >
                <Trash2 size={14} color={C.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={!isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
            <Text style={{ color: C.muted }}>لا توجد منتجات</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  header:      { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  title:       { fontSize: 17, fontWeight: "700", color: C.text },
  searchBar:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 13, color: C.text, padding: 0 },
  productCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12 },
  productImg:  { width: 52, height: 52, backgroundColor: C.soft, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 2 },
  iconBtn:     { width: 30, height: 30, backgroundColor: `${C.primary}15`, borderRadius: 8, alignItems: "center", justifyContent: "center" },
})
