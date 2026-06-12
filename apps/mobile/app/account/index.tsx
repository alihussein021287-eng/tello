"use client"
import { useState } from "react"
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"
import {
  User, Package, Heart, Bell, Settings,
  LogOut, ChevronLeft,
} from "lucide-react-native"
import { authApi } from "@/lib/api"
import { useAuthStore } from "@/store"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"
import { t } from "@/lib/i18n"
import Toast from "react-native-toast-message"

export default function AccountScreen() {
  const { user, setAuth, clearAuth, isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [mode, setMode]     = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const [form, setForm]     = useState({ name: "", email: "", phone: "", password: "" })

  const handleLogin = async () => {
    if (!form.email || !form.password) return
    setLoading(true)
    try {
      const res = await authApi.login({ email: form.email, password: form.password })
      setAuth(res.data.user, res.data.token)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({ type: "success", text1: `أهلاً ${res.data.user.name}!` })
    } catch {
      Toast.show({ type: "error", text1: "بيانات غير صحيحة" })
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setAuth(res.data.user, res.data.token)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({ type: "success", text1: "تم إنشاء الحساب!" })
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "حدث خطأ" })
    } finally { setLoading(false) }
  }

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: () => {
        clearAuth()
        Toast.show({ type: "success", text1: "تم تسجيل الخروج" })
      }},
    ])
  }

  // ── Logged in ──────────────────────────────────────────
  if (isLoggedIn() && user) {
    const MENU = [
      { icon: <Package size={18} color={Colors.primary} />,  label: "طلباتي",       route: "/orders" },
      { icon: <Heart size={18} color="#ef4444" />,            label: "المفضلة",       route: "/wishlist" },
      { icon: <Bell size={18} color={Colors.primary} />,      label: "الإشعارات",    route: "/notifications" },
      { icon: <Settings size={18} color={Colors.textMuted} />,label: "إعدادات الحساب",route: "/account/settings" },
    ]

    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            {user.role === "VENDOR" && (
              <View style={styles.vendorBadge}>
                <Text style={styles.vendorBadgeText}>🏪 بائع موثق</Text>
              </View>
            )}
          </View>

          {/* Menu */}
          <View style={styles.menuGroup}>
            {MENU.map(({ icon, label, route }) => (
              <TouchableOpacity
                key={route}
                style={styles.menuItem}
                onPress={() => router.push(route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>{icon}</View>
                <Text style={styles.menuLabel}>{label}</Text>
                <ChevronLeft size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}

            {/* Vendor Dashboard */}
            {(user.role === "VENDOR" || user.role === "ADMIN") && (
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: `${Colors.primary}10` }]}
                onPress={() => router.push("/vendor/dashboard" as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${Colors.primary}20` }]}>
                  <User size={18} color={Colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: Colors.primary }]}>داشبورد البائع</Text>
                <ChevronLeft size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.logoutText}>{t("auth.logout")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── Auth Form ──────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.authLogo}>
          <View style={styles.logoBox}>
            <Text style={styles.logoBoxText}>T</Text>
          </View>
          <Text style={styles.logoName}>Tello</Text>
        </View>

        <View style={styles.toggle}>
          {(["login", "register"] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === "login" ? t("auth.login") : t("auth.register")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          {mode === "register" && (
            <TextInput value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder={t("auth.name")} placeholderTextColor={Colors.textMuted} style={styles.input} />
          )}
          <TextInput value={form.email} onChangeText={v => setForm({...form, email: v})} placeholder={t("auth.email")} placeholderTextColor={Colors.textMuted} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
          {mode === "register" && (
            <TextInput value={form.phone} onChangeText={v => setForm({...form, phone: v})} placeholder={t("auth.phone")} placeholderTextColor={Colors.textMuted} style={styles.input} keyboardType="phone-pad" />
          )}
          <TextInput value={form.password} onChangeText={v => setForm({...form, password: v})} placeholder={t("auth.password")} placeholderTextColor={Colors.textMuted} style={styles.input} secureTextEntry />

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={mode === "login" ? handleLogin : handleRegister}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.submitText}>
              {loading ? "جاري..." : mode === "login" ? t("auth.login_btn") : t("auth.register_btn")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  profileHeader: { alignItems: "center", padding: Spacing.xl, paddingTop: Spacing.xxl, backgroundColor: Colors.primary },
  avatar:        { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: Spacing.md },
  avatarText:    { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white },
  profileName:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white, marginBottom: 4 },
  profileEmail:  { fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)" },
  vendorBadge:   { marginTop: 8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  vendorBadgeText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  menuGroup:     { margin: Spacing.lg, backgroundColor: Colors.bg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  menuItem:      { flexDirection: "row", alignItems: "center", padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon:      { width: 36, height: 36, backgroundColor: `${Colors.primary}15`, borderRadius: Radius.sm, alignItems: "center", justifyContent: "center", marginRight: Spacing.md },
  menuLabel:     { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  logoutBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: Spacing.lg, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.error },
  logoutText:    { fontSize: FontSize.md, color: Colors.error, fontWeight: FontWeight.semibold },
  authContainer: { flexGrow: 1, padding: Spacing.xl, justifyContent: "center" },
  authLogo:      { alignItems: "center", marginBottom: Spacing.xxl, gap: 8 },
  logoBox:       { width: 56, height: 56, backgroundColor: Colors.primary, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center" },
  logoBoxText:   { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  logoName:      { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  toggle:        { flexDirection: "row", backgroundColor: Colors.bgSoft, borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.xl },
  toggleBtn:     { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: "center" },
  toggleBtnActive: { backgroundColor: Colors.bg, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  toggleText:    { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  toggleTextActive: { color: Colors.text, fontWeight: FontWeight.semibold },
  form:          { gap: Spacing.md },
  input:         { backgroundColor: Colors.bgSoft, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  submitBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: "center", marginTop: Spacing.sm },
  submitText:    { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
})
