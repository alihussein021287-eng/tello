import { useEffect } from "react"
import { Tabs } from "expo-router"
import { View, Text, StyleSheet, Platform } from "react-native"
import { Home, Search, ShoppingCart, User, Bell } from "lucide-react-native"
import { Colors, FontSize } from "@/lib/theme"
import { useCartStore } from "@/store"
import { t } from "@/lib/i18n"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useFonts, IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_700Bold } from "@expo-google-fonts/ibm-plex-sans-arabic"
import Toast from "react-native-toast-message"
import { GestureHandlerRootView } from "react-native-gesture-handler"

// معالج أخطاء عام — يعرض أي خطأ غير ممسوك
if (typeof ErrorUtils !== "undefined") {
  const prevHandler = ErrorUtils.getGlobalHandler?.()
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error("GLOBAL ERROR:", error?.message, error?.stack)
    prevHandler?.(error, isFatal)
  })
}

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })

function TabIcon({ icon: Icon, label, focused }: { icon: any; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Icon size={22} color={focused ? Colors.primary : Colors.textMuted} strokeWidth={focused ? 2.5 : 1.8} />
      <Text style={[styles.tabLabel, { color: focused ? Colors.primary : Colors.textMuted }]}>{label}</Text>
    </View>
  )
}

function CartIcon({ focused }: { focused: boolean }) {
  const count = useCartStore(s => s.count())
  return (
    <View style={styles.tabIcon}>
      <View>
        <ShoppingCart size={22} color={focused ? Colors.primary : Colors.textMuted} strokeWidth={focused ? 2.5 : 1.8} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, { color: focused ? Colors.primary : Colors.textMuted }]}>{t("nav.cart")}</Text>
    </View>
  )
}

export default function RootLayout() {
  // نحمّل الخطوط بالخلفية بدون توقيف الواجهة
  useFonts({ IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_700Bold })

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={qc}>
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
          <Tabs.Screen name="index"               options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home}   label={t("nav.home")}    focused={focused} /> }} />
          <Tabs.Screen name="search/index"        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Search} label="بحث"             focused={focused} /> }} />
          <Tabs.Screen name="cart/index"          options={{ tabBarIcon: ({ focused }) => <CartIcon focused={focused} /> }} />
          <Tabs.Screen name="notifications/index" options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Bell}   label="إشعارات"         focused={focused} /> }} />
          <Tabs.Screen name="account/index"       options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User}   label={t("nav.account")} focused={focused} /> }} />
          {/* Hidden */}
          <Tabs.Screen name="product/[id]"        options={{ href: null }} />
          <Tabs.Screen name="products/index"      options={{ href: null }} />
          <Tabs.Screen name="orders/index"        options={{ href: null }} />
          <Tabs.Screen name="orders/[id]"         options={{ href: null }} />
          <Tabs.Screen name="wishlist/index"      options={{ href: null }} />
          <Tabs.Screen name="ai/index"            options={{ href: null }} />
        </Tabs>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  tabBar:    { height: Platform.OS === "ios" ? 80 : 64, backgroundColor: Colors.bg, borderTopColor: Colors.border, borderTopWidth: 1, paddingTop: 4, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  tabIcon:   { alignItems: "center", gap: 3 },
  tabLabel:  { fontSize: FontSize.xs, fontFamily: "IBMPlexSansArabic_400Regular" },
  badge:     { position: "absolute", top: -4, right: -6, backgroundColor: Colors.primary, borderRadius: 99, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: "700" },
})
