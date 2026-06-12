import React, { useState, useRef } from "react"
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { vendorApi } from "@/lib/api"
import { Send, MessageCircle } from "lucide-react-native"
import { useRouter, useLocalSearchParams } from "expo-router"

const C = { primary:"#1B4FD8", text:"#111318", muted:"#6b7280", bg:"#ffffff", soft:"#f7f7f8", border:"#e5e7eb" }

export default function VendorChatScreen() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-conversations"],
    queryFn:  () => vendorApi.chat.conversations(),
    refetchInterval: 10_000,
  })

  const convs = data?.data || []

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.soft }} edges={["top"]}>
      <View style={{ padding: 16, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>رسائل العملاء</Text>
      </View>

      <FlatList
        data={convs}
        keyExtractor={(c: any) => c.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item: conv }: { item: any }) => {
          const last = conv.messages?.[0]
          return (
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 }}
              onPress={() => router.push(`/chat/${conv.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={{ width: 44, height: 44, backgroundColor: `${C.primary}20`, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: C.primary, fontWeight: "700", fontSize: 16 }}>
                  {conv.user?.name?.[0]?.toUpperCase() || "؟"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: C.text, fontSize: 14 }}>{conv.user?.name}</Text>
                {last && <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }} numberOfLines={1}>{last.content}</Text>}
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={!isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
            <Text style={{ color: C.muted }}>لا توجد محادثات بعد</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  )
}
