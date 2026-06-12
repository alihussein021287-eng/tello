import React, { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { vendorApi } from "@/lib/api"

const C = { primary:"#1B4FD8", text:"#111318", muted:"#6b7280", bg:"#ffffff", soft:"#f7f7f8", border:"#e5e7eb" }

const STATUS_AR: Record<string,string>    = { PENDING:"انتظار",CONFIRMED:"مؤكد",PREPARING:"تحضير",SHIPPING:"شحن",DELIVERED:"مُسلَّم",CANCELLED:"ملغي" }
const STATUS_COLOR: Record<string,string> = { PENDING:"#f59e0b",CONFIRMED:"#3b82f6",PREPARING:"#8b5cf6",SHIPPING:"#6366f1",DELIVERED:"#10b981",CANCELLED:"#ef4444" }

export default function VendorOrdersScreen() {
  const [filter, setFilter] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", filter],
    queryFn:  () => vendorApi.orders.list(filter ? { status: filter } : undefined),
  })

  const orders   = data?.data || []
  const statuses = ["","PENDING","CONFIRMED","PREPARING","SHIPPING","DELIVERED"]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.soft }} edges={["top"]}>
      <View style={{ padding: 16, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 10 }}>الطلبات الواردة</Text>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={s => s}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 6, borderWidth: 1 },
                filter === item
                  ? { backgroundColor: C.primary, borderColor: C.primary }
                  : { backgroundColor: C.soft, borderColor: C.border }
              ]}
              onPress={() => setFilter(item)}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: filter === item ? "#fff" : C.muted }}>
                {item ? STATUS_AR[item] : "الكل"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o: any) => o.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item: o }: { item: any }) => (
          <View style={{ backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontWeight: "700", color: C.text, fontFamily: "monospace" }}>#{o.id.slice(-6).toUpperCase()}</Text>
              <View style={{ backgroundColor: `${STATUS_COLOR[o.status]}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: STATUS_COLOR[o.status] }}>{STATUS_AR[o.status]}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>👤 {o.user?.name}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: C.muted }}>
                {o.items?.map((i: any) => i.product?.nameAr).join("، ")}
              </Text>
              <Text style={{ fontWeight: "700", color: C.primary }}>
                {o.items?.reduce((s: number, i: any) => s + i.price * i.quantity, 0).toLocaleString()} د.ع
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={!isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🛍️</Text>
            <Text style={{ color: C.muted }}>لا توجد طلبات</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  )
}
