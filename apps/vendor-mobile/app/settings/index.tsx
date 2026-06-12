import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery, useMutation } from "@tanstack/react-query"
import { vendorApi } from "@/lib/api"
import * as SecureStore from "expo-secure-store"
import Toast from "react-native-toast-message"
import { useRouter } from "expo-router"
import { Save, LogOut, Store } from "lucide-react-native"

const C = { primary:"#1B4FD8", text:"#111318", muted:"#6b7280", bg:"#ffffff", soft:"#f7f7f8", border:"#e5e7eb", error:"#ef4444" }

export default function VendorSettingsScreen() {
  const router = useRouter()
  const [form, setForm] = useState({ storeName: "", storeNameAr: "", description: "" })

  const { data } = useQuery({
    queryKey: ["vendor-me"],
    queryFn:  () => vendorApi.me(),
  })

  useEffect(() => {
    if (data?.data) {
      setForm({ storeName: data.data.storeName || "", storeNameAr: data.data.storeNameAr || "", description: data.data.description || "" })
    }
  }, [data])

  const updateMut = useMutation({
    mutationFn: () => vendorApi.update(form),
    onSuccess: () => Toast.show({ type: "success", text1: "تم حفظ الإعدادات" }),
    onError: () => Toast.show({ type: "error", text1: "حدث خطأ" }),
  })

  const logout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد الخروج؟", [
      { text: "إلغاء" },
      { text: "خروج", style: "destructive", onPress: async () => {
        await SecureStore.deleteItemAsync("vendor_token")
        router.replace("/login" as any)
      }},
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.soft }} edges={["top"]}>
      <View style={{ padding: 16, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>إعدادات المتجر</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={{ backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Store size={16} color={C.primary} />
            <Text style={{ fontWeight: "700", color: C.text }}>معلومات المتجر</Text>
          </View>

          {[
            { key: "storeNameAr", label: "اسم المتجر بالعربي", placeholder: "متجر النور" },
            { key: "storeName",   label: "Store Name (EN)",    placeholder: "Al-Noor Store" },
            { key: "description", label: "وصف المتجر",         placeholder: "نبيع أفضل المنتجات..." },
          ].map(({ key, label, placeholder }) => (
            <View key={key}>
              <Text style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</Text>
              <TextInput
                value={(form as any)[key]}
                onChangeText={v => setForm(f => ({...f, [key]: v}))}
                placeholder={placeholder}
                placeholderTextColor={C.muted}
                style={{ backgroundColor: C.soft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border }}
                multiline={key === "description"}
                numberOfLines={key === "description" ? 3 : 1}
              />
            </View>
          ))}

          <TouchableOpacity
            style={{ backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
            onPress={() => updateMut.mutate()}
            disabled={updateMut.isPending}
            activeOpacity={0.9}
          >
            <Save size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              {updateMut.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: "#fee2e2", borderRadius: 14, borderWidth: 1, borderColor: "#fca5a5", paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
          onPress={logout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={C.error} />
          <Text style={{ color: C.error, fontWeight: "700", fontSize: 15 }}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
