import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { aiRoutes } from "./routes/ai.routes"

const app = new Hono().basePath("/ai")

app.use("*", logger())
app.use("*", cors({
  origin: [
    "https://fshsmart.com",
    "https://admin.fshsmart.com",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
}))

// Internal service key auth (from API service)
app.use("*", async (c, next) => {
  const key = c.req.header("X-Internal-Key")
  if (key !== process.env.INTERNAL_SERVICE_KEY) {
    return c.json({ error: "Unauthorized" }, 401)
  }
  await next()
})

app.get("/health", (c) => c.json({ status: "ok", service: "tello-ai" }))
app.route("/", aiRoutes)

app.onError((err, c) => {
  console.error("[AI Service Error]", err)
  return c.json({ error: "Internal error" }, 500)
})

const port = Number(process.env.AI_PORT) || 4001
console.log(`🤖 Tello AI Service running on http://localhost:${port}`)

export default { port, fetch: app.fetch }
