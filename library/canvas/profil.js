import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas"
import { join } from "path"

GlobalFonts.registerFromPath(
  join(process.cwd(), "library", "Cobbler-SemiBold.ttf"),
  "Cobbler"
)

// ── Helpers ──────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r = 16) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y,     x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x,     y + h, r)
  ctx.arcTo(x,     y + h, x,     y,     r)
  ctx.arcTo(x,     y,     x + w, y,     r)
  ctx.closePath()
}

function circ(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.closePath()
}

function clampText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  while (ctx.measureText(text + "…").width > maxW && text.length > 0)
    text = text.slice(0, -1)
  return text + "…"
}

// ── Palette ──────────────────────────────────────────────────────────────────

const ROLE = {
  Owner:   ["#FF6B35", "#FF3D71"],
  Premium: ["#B44FFF", "#6C63FF"],
  User:    ["#00D4FF", "#0091FF"],
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function profileCanvas(data = {}) {
  const W = 1000, H = 560
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext("2d")

  // ── 1. Background ──────────────────────────────────────────────
  ctx.fillStyle = "#050A14"
  ctx.fillRect(0, 0, W, H)

  // Subtle grid
  ctx.save()
  ctx.strokeStyle = "rgba(255,255,255,0.025)"
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
  for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }
  ctx.restore()

  // Ambient blobs
  const paintBlob = (bx, by, br, color) => {
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    g.addColorStop(0, color)
    g.addColorStop(1, "transparent")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }
  paintBlob(120,  280, 300, "rgba(0,180,255,0.09)")
  paintBlob(880,  200, 260, "rgba(160,80,255,0.09)")
  paintBlob(500,  530, 180, "rgba(0,210,180,0.06)")

  // ── 2. Outer card ──────────────────────────────────────────────
  roundRect(ctx, 20, 20, W-40, H-40, 32)
  ctx.fillStyle = "rgba(8,14,26,0.92)"
  ctx.fill()

  // Gradient border
  const border = ctx.createLinearGradient(20, 20, W-20, H-20)
  border.addColorStop(0,    "rgba(0,212,255,0.55)")
  border.addColorStop(0.45, "rgba(120,60,255,0.35)")
  border.addColorStop(1,    "rgba(0,212,255,0.20)")
  roundRect(ctx, 20, 20, W-40, H-40, 32)
  ctx.strokeStyle = border
  ctx.lineWidth   = 1.5
  ctx.stroke()

  // ── 3. Left accent bar ─────────────────────────────────────────
  const barGrad = ctx.createLinearGradient(44, 40, 44, H-40)
  barGrad.addColorStop(0,   "rgba(0,212,255,0)")
  barGrad.addColorStop(0.3, "rgba(0,212,255,0.8)")
  barGrad.addColorStop(0.7, "rgba(120,60,255,0.8)")
  barGrad.addColorStop(1,   "rgba(120,60,255,0)")
  ctx.fillStyle = barGrad
  roundRect(ctx, 44, 40, 3, H-80, 2)
  ctx.fill()

  // ── 4. Avatar section ──────────────────────────────────────────
  const AX = 172, AY = H/2, AR = 82

  // Outer pulse ring
  circ(ctx, AX, AY, AR+16)
  ctx.strokeStyle = "rgba(0,212,255,0.12)"
  ctx.lineWidth   = 1
  ctx.stroke()

  // Glow
  const aGlow = ctx.createRadialGradient(AX, AY, AR*0.4, AX, AY, AR*2)
  aGlow.addColorStop(0, "rgba(0,212,255,0.18)")
  aGlow.addColorStop(1, "transparent")
  ctx.fillStyle = aGlow
  ctx.beginPath(); ctx.arc(AX, AY, AR*2, 0, Math.PI*2); ctx.fill()

  // Gradient ring
  const ring = ctx.createConicalGradient
    ? ctx.createConicalGradient(0, AX, AY)
    : (() => { const g = ctx.createLinearGradient(AX-AR,AY-AR,AX+AR,AY+AR); g.addColorStop(0,"#00D4FF"); g.addColorStop(1,"#7840FF"); return g })()
  circ(ctx, AX, AY, AR+5)
  ctx.strokeStyle = ring
  ctx.lineWidth   = 4
  ctx.stroke()

  // Avatar image
  try {
    const img = await loadImage(data.avatar)
    ctx.save()
    circ(ctx, AX, AY, AR)
    ctx.clip()
    ctx.drawImage(img, AX-AR, AY-AR, AR*2, AR*2)
    ctx.restore()
  } catch {
    circ(ctx, AX, AY, AR)
    ctx.fillStyle = "#111827"
    ctx.fill()
  }

  // Online dot
  circ(ctx, AX+AR*0.68, AY+AR*0.68, 13)
  ctx.fillStyle = "#050A14"
  ctx.fill()
  circ(ctx, AX+AR*0.68, AY+AR*0.68, 9)
  ctx.fillStyle = "#22C55E"
  ctx.fill()

  // ── 5. Role badge ──────────────────────────────────────────────
  const role       = data.role || "User"
  const [rc1, rc2] = ROLE[role] || ROLE.User
  const BW = 160, BH = 38, BX = AX - BW/2, BY = AY + AR + 16

  roundRect(ctx, BX, BY, BW, BH, 19)
  const bg = ctx.createLinearGradient(BX, BY, BX+BW, BY)
  bg.addColorStop(0, rc1); bg.addColorStop(1, rc2)
  ctx.fillStyle = bg
  ctx.fill()

  // Shine
  roundRect(ctx, BX+2, BY+2, BW-4, BH/2-2, 17)
  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.fill()

  ctx.fillStyle   = "#fff"
  ctx.font        = "bold 16px Cobbler"
  ctx.textAlign   = "center"
  ctx.shadowColor = "rgba(0,0,0,0.4)"
  ctx.shadowBlur  = 4
  ctx.fillText(role.toUpperCase(), AX, BY+25)
  ctx.shadowBlur  = 0
  ctx.textAlign   = "left"

  // Name under badge
  ctx.font      = "bold 24px Cobbler"
  ctx.fillStyle = "#F1F5F9"
  ctx.textAlign = "center"
  ctx.fillText(clampText(ctx, data.name || "-", 200), AX, BY+70)

  ctx.font      = "14px Cobbler"
  ctx.fillStyle = "rgba(148,163,184,0.65)"
  ctx.fillText(data.number || "-", AX, BY+94)
  ctx.textAlign = "left"

  // ── 6. Vertical divider ────────────────────────────────────────
  const DVX = 296
  const dv = ctx.createLinearGradient(DVX, 50, DVX, H-50)
  dv.addColorStop(0,    "rgba(0,212,255,0)")
  dv.addColorStop(0.25, "rgba(0,212,255,0.35)")
  dv.addColorStop(0.75, "rgba(120,60,255,0.35)")
  dv.addColorStop(1,    "rgba(120,60,255,0)")
  ctx.fillStyle = dv
  ctx.fillRect(DVX, 50, 1, H-100)

  // ── 7. Right panel ─────────────────────────────────────────────
  const RX = DVX + 40

  // Title
  ctx.font        = "bold 40px Cobbler"
  ctx.fillStyle   = "#F8FAFC"
  ctx.shadowColor = "rgba(0,212,255,0.3)"
  ctx.shadowBlur  = 18
  ctx.fillText("USER PROFILE", RX, 100)
  ctx.shadowBlur  = 0

  // Underline
  const ul = ctx.createLinearGradient(RX, 0, RX+340, 0)
  ul.addColorStop(0, "#00D4FF"); ul.addColorStop(1, "#7840FF")
  ctx.fillStyle = ul
  roundRect(ctx, RX, 110, 340, 3, 2)
  ctx.fill()

  ctx.font      = "15px Cobbler"
  ctx.fillStyle = "rgba(148,163,184,0.55)"
  ctx.fillText("WhatsApp Account Overview", RX, 134)

  // ── 8. Stat cards ──────────────────────────────────────────────
  const stats = [
    { label: "LIMIT",   value: String(data.limit ?? 0),    grad: ["#00D4FF","#0091FF"] },
    { label: "PREMIUM", value: data.premium || "Inactive",  grad: ["#B44FFF","#6C63FF"] },
    { label: "JOINED",  value: data.registered || "-",      grad: ["#00E5A0","#00BFFF"] },
  ]
  const SW = (W - DVX - 80 - 40) / 3 - 10
  const SH = 82, SY = 156

  stats.forEach(({ label, value, grad }, i) => {
    const sx = RX + i * (SW + 15)

    // Card
    roundRect(ctx, sx, SY, SW, SH, 18)
    ctx.fillStyle = "rgba(15,25,45,0.95)"
    ctx.fill()
    roundRect(ctx, sx, SY, SW, SH, 18)
    ctx.strokeStyle = "rgba(255,255,255,0.06)"
    ctx.lineWidth = 1; ctx.stroke()

    // Top bar
    const tb = ctx.createLinearGradient(sx, SY, sx+SW, SY)
    tb.addColorStop(0, grad[0]); tb.addColorStop(1, grad[1])
    roundRect(ctx, sx+1, SY+1, SW-2, 4, 2)
    ctx.fillStyle = tb; ctx.fill()

    // Label
    ctx.font      = "12px Cobbler"
    ctx.fillStyle = "rgba(148,163,184,0.55)"
    ctx.fillText(label, sx+14, SY+26)

    // Value
    ctx.font      = "bold 19px Cobbler"
    ctx.fillStyle = "#E2E8F0"
    ctx.fillText(clampText(ctx, value, SW-28), sx+14, SY+58)
  })

  // ── 9. Info rows ───────────────────────────────────────────────
  const rows = [
    { label: "Name",       value: data.name       || "-" },
    { label: "Number",     value: data.number      || "-" },
    { label: "Registered", value: data.registered  || "-" },
  ]
  const ROW_H = 52, ROW_Y0 = SY + SH + 24

  rows.forEach(({ label, value }, i) => {
    const ry = ROW_Y0 + i * ROW_H

    // Row bg
    roundRect(ctx, RX, ry, W - DVX - 80, ROW_H - 6, 12)
    ctx.fillStyle = i % 2 === 0
      ? "rgba(15,25,45,0.7)"
      : "rgba(8,14,26,0.5)"
    ctx.fill()

    // Left accent dot
    const dot = ctx.createLinearGradient(RX+10, ry, RX+10, ry+ROW_H-6)
    dot.addColorStop(0, "#00D4FF"); dot.addColorStop(1, "#7840FF")
    roundRect(ctx, RX+10, ry+8, 3, ROW_H-22, 2)
    ctx.fillStyle = dot; ctx.fill()

    // Label
    ctx.font      = "14px Cobbler"
    ctx.fillStyle = "rgba(148,163,184,0.65)"
    ctx.fillText(label, RX+22, ry+ROW_H/2+4)

    // Value
    ctx.font      = "bold 17px Cobbler"
    ctx.fillStyle = "#E2E8F0"
    ctx.textAlign = "right"
    const maxW = W - DVX - 80 - 120
    ctx.fillText(clampText(ctx, value, maxW), W - 56, ry+ROW_H/2+4)
    ctx.textAlign = "left"
  })

  // ── 10. Footer ─────────────────────────────────────────────────
  ctx.font      = "13px Cobbler"
  ctx.fillStyle = "rgba(100,116,139,0.45)"
  ctx.textAlign = "center"
  ctx.fillText(`⬡  Powered by ${global.botname || "Bot"}`, W/2, H-32)
  ctx.textAlign = "left"

  return canvas.toBuffer("image/png")
}
