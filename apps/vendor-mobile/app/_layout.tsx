import { Tabs } from "expo-router"
import { View, Text, StyleSheet, Platform } from "react-native"
import { LayoutDashboard, Package, ShoppingCart, MessageCircle, Settings } from "lucide-react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Toast from "react-native-toast-message"
import { useFonts, IBMPlexSansArabic_400Regular, IBMPlexSansArabic_700Bold } from "@expo-google-fonts/ibm-plex-sans-arabic"

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

const C = { primary: "#1B4FD8", muted: "#9ca3af", bg: "#ffffff", border: "#e5e7eb", text: "#111318" }

function TabIcon({ icon: Icon, label, focused }: any) {
  return (
    <View style={{ alignItems: "center", gap: 3 }}>
      <Icon size={22} color={focused ? C.primary : C.muted} strokeWidth={focused ? 2.5 : 1.8} />
      <Text style={{ fontSize: 10, color: focused ? C.primary : C.muted, fontFamily: "IBMPlexSansArabic_400Regular" }}>
        {label}
      </Text>
    </View>
  )
}

export default function VendorLayout() {
  const [fontsLoaded] = useFonts({ IBMPlexSansArabic_400Regular, IBMPlexSansArabic_700Bold })
  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={qc}>
        <Tabs screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: Platform.OS === "ios" ? 80 : 64,
            backgroundColor: C.bg,
            borderTopColor: C.border,
            borderTopWidth: 1,
            paddingTop: 4,
          },
          tabBarShowLabel: false,
        }}>
          <Tabs.Screen name="dashboard/index"  options={{ tabBarIcon: ({ focused }) => <TabIcon icon={LayoutDashboard} label="الرئيسية" focused={focused} /> }} />
          <Tabs.Screen name="products/index"   options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Package}         label="منتجاتي"  focused={focused} /> }} />
          <Tabs.Screen name="orders/index"     options={{ tabBarIcon: ({ focused }) => <TabIcon icon={ShoppingCart}    label="الطلبات"  focused={focused} /> }} />
          <Tabs.Screen name="chat/index"       options={{ tabBarIcon: ({ focused }) => <TabIcon icon={MessageCircle}   label="الرسائل"  focused={focused} /> }} />
          <Tabs.Screen name="settings/index"   options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Settings}        label="الإعدادات" focused={focused} /> }} />
        </Tabs>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
