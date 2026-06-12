import React, { useState, useRef } from "react"
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Bot, Send, Sparkles } from "lucide-react-native"
import * as Haptics from "expo-haptics"
import { aiApi } from "@/lib/api"
import { useAuthStore } from "@/store"
import { Colors, Spacing, Radius, FontSize, FontWeight } from "@/lib/theme"
import { t } from "@/lib/i18n"

interface Msg {
  role: "user" | "assistant"
  content: string
  streaming?: boolean
}

const QUICK_PROMPTS = [
  "أريد موبايل مو غالي 📱",
  "شو عندكم من العروض؟ 🎯",
  "ساعدني ألكي هدية 🎁",
  "أفضل اللابتوبات حالياً 💻",
]

export default function AIScreen() {
  const user = useAuthStore((s) => s.user)
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content: `${t("ai.title")} 🏺\n${t("ai.subtitle")}`,
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const sendMsg = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setInput("")
    setMsgs((p) => [...p, { role: "user", content: msg }])
    setLoading(true)
    setMsgs((p) => [...p, { role: "assistant", content: "", streaming: true }])

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const history = msgs
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }))
      history.push({ role: "user", content: msg })

      const res = await aiApi.chat(history, user?.id)
      if (!res.body) throw new Error()

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const { text } = JSON.parse(data)
            if (text) {
              full += text
              setMsgs((p) => [
                ...p.slice(0, -1),
                { role: "assistant", content: full, streaming: true },
              ])
            }
          } catch {}
        }
      }
      setMsgs((p) => [...p.slice(0, -1), { role: "assistant", content: full }])
    } catch {
      setMsgs((p) => [
        ...p.slice(0, -1),
        { role: "assistant", content: "عذراً، حدث خطأ. حاول مجدداً." },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Bot size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t("ai.title")}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Claude AI</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.msgs}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        >
          {msgs.map((msg, i) => (
            <View key={i} style={[styles.msgRow, msg.role === "user" && styles.msgRowUser]}>
              {msg.role === "assistant" && (
                <View style={styles.avatar}>
                  <Text style={{ fontSize: 12 }}>🤖</Text>
                </View>
              )}
              <View style={[
                styles.bubble,
                msg.role === "user" ? styles.bubbleUser : styles.bubbleAI,
              ]}>
                <Text style={[
                  styles.bubbleText,
                  msg.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAI,
                ]}>
                  {msg.content}
                  {msg.streaming && (
                    <Text style={{ color: Colors.primary }}>▌</Text>
                  )}
                </Text>
              </View>
            </View>
          ))}

          {loading && msgs[msgs.length - 1]?.content === "" && (
            <View style={styles.msgRow}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 12 }}>🤖</Text>
              </View>
              <View style={styles.bubbleAI}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick prompts */}
        {msgs.length === 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickRow}
          >
            {QUICK_PROMPTS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickBtn}
                onPress={() => sendMsg(q)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t("ai.placeholder")}
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            maxLength={500}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={() => sendMsg()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMsg()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Send size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bg },
  headerIcon:  { width: 40, height: 40, backgroundColor: Colors.primary, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  onlineRow:   { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  onlineDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  onlineText:  { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium },
  msgs:        { flex: 1, backgroundColor: Colors.bgSoft },
  msgRow:      { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowUser:  { justifyContent: "flex-end" },
  avatar:      { width: 30, height: 30, backgroundColor: Colors.bg, borderRadius: 15, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  bubble:      { maxWidth: "78%", paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.lg },
  bubbleUser:  { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleAI:    { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText:  { fontSize: FontSize.sm, lineHeight: 20 },
  bubbleTextUser: { color: Colors.white },
  bubbleTextAI:   { color: Colors.text },
  quickRow:    { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  quickBtn:    { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8, marginRight: 8 },
  quickText:   { fontSize: FontSize.xs, color: Colors.text },
  inputRow:    { flexDirection: "row", gap: Spacing.sm, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg },
  input:       { flex: 1, backgroundColor: Colors.bgSoft, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.text, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn:     { width: 44, height: 44, backgroundColor: Colors.primary, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  sendBtnDisabled: { backgroundColor: Colors.border },
})
