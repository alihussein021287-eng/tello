import { Dimensions } from "react-native"

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")

export const Colors = {
  primary:     "#1B4FD8",
  primaryLight:"#4d7bff",
  primaryDark: "#103394",
  gold:        "#D4A853",

  // Light
  bg:          "#ffffff",
  bgSoft:      "#F7F7F8",
  border:      "#E5E7EB",
  text:        "#111318",
  textMuted:   "#6B7280",

  // Dark
  bgDark:      "#0F0F10",
  bgSoftDark:  "#1A1A1D",
  borderDark:  "#2A2A2F",
  textDark:    "#F4F4F6",
  textMutedDark:"#9CA3AF",

  // Status
  success:     "#10b981",
  warning:     "#f59e0b",
  error:       "#ef4444",
  white:       "#ffffff",
  black:       "#000000",
}

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
}

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  full:9999,
}

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  30,
}

export const FontWeight = {
  regular: "400" as const,
  medium:  "500" as const,
  semibold:"600" as const,
  bold:    "700" as const,
}
