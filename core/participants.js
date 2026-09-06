import axios from 'axios'
import { jidNormalizedUser } from 'baileys'
import { parsePhoneNumber } from 'awesome-phonenumber'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'

const BASE = 'https://raw.githubusercontent.com/Blckrose2/font2/main/'
const _fc  = new Set()

async function lf(file, alias) {
  if (_fc.has(alias)) return
  const r = await axios.get(BASE + encodeURIComponent(file), {
    responseType: 'arraybuffer', timeout: 30000,
    headers: { 'User-Agent': 'Canvas-Participants' }
  })
  GlobalFonts.register(Buffer.from(r.data), alias)
  _fc.add(alias)
}

let _fontsReady = false
async function loadFonts() {
  if (_fontsReady) return
  await Promise.all([
    lf('SFPRODISPLAYBOLD.OTF',        'SFBold'),
    lf('SFPRODISPLAYMEDIUM.OTF',      'SFMedium'),
    lf('SFPRODISPLAYREGULAR.OTF',     'SFRegular'),
    lf('Montserrat-Bold.ttf',         'Montserrat'),
    lf('NotoColorEmoji-Regular.ttf',  'Emoji'),
  ])
  _fontsReady = true
}

async function safeImg(url) {
  try {
    const r = await axios.get(url, {
      responseType: 'arraybuffer', timeout: 12000,
      headers: { 'User-Agent': 'Canvas-Participants' }
    })
    return await loadImage(Buffer.from(r.data))
  } catch {
    const c = createCanvas(200, 200)
    const g = c.getContext('2d')
    g.fillStyle = '#e8d5c4'
    g.beginPath(); g.arc(100, 100, 100, 0, Math.PI * 2); g.fill()
    return await loadImage(c.toBuffer('image/png'))
  }
}

function rrp(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function petal(ctx, cx, cy, r, angle, color, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(cx, cy); ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-r * 0.5, -r * 0.8, -r * 0.3, -r * 1.5, 0, -r * 1.6)
  ctx.bezierCurveTo(r * 0.3, -r * 1.5, r * 0.5, -r * 0.8, 0, 0)
  ctx.fillStyle = color; ctx.fill()
  ctx.restore()
}

function sakura(ctx, cx, cy, r, color, alpha = 1) {
  for (let i = 0; i < 5; i++)
    petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha)
  ctx.save(); ctx.globalAlpha = alpha
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = '#fff8f0'; ctx.fill()
  ctx.restore()
}

function cornerFlourish(ctx, x, y, w, h, size, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.5
  ;[
    [x,     y,     1,  1],
    [x + w, y,    -1,  1],
    [x,     y + h, 1, -1],
    [x + w, y + h,-1, -1],
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(cx + dx * size, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + dy * size)
    ctx.stroke()
  })
}

function diamondRow(ctx, cx, y, count, spacing, size, color) {
  const startX = cx - (count - 1) * spacing / 2
  for (let i = 0; i < count; i++) {
    const dx = startX + i * spacing
    ctx.save()
    ctx.translate(dx, y); ctx.rotate(Math.PI / 4)
    rrp(ctx, -size / 2, -size / 2, size, size, 1)
    if (i === Math.floor(count / 2)) { ctx.fillStyle = color; ctx.fill() }
    else { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke() }
    ctx.restore()
  }
}

function clampText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  while (ctx.measureText(text + '…').width > maxW && text.length > 0)
    text = text.slice(0, -1)
  return text + '…'
}

const THEMES = {
  welcome: {
    gold:        '#c9956e',
    goldMid:     '#d4936b',
    goldDeep:    '#7a3e1a',
    goldText:    '#4a1e0a',
    goldFaint:   'rgba(201,149,110,0.35)',
    goldBg:      'rgba(201,149,110,0.10)',
    goldBorder:  'rgba(201,149,110,0.5)',
    sakuraPink:  '#f8a4c0',
    sakuraLight: '#fcc8d8',
    sakuraDark:  '#e87098',
    label:       '✦ SELAMAT DATANG ✦',
    sub:         'bergabung ke grup',
    actionIcon:  '🌸',
  },
  bye: {
    gold:        '#7a9ab5',
    goldMid:     '#6080a0',
    goldDeep:    '#1e3a5a',
    goldText:    '#0d2440',
    goldFaint:   'rgba(100,140,180,0.35)',
    goldBg:      'rgba(100,140,180,0.10)',
    goldBorder:  'rgba(100,140,180,0.5)',
    sakuraPink:  '#a0c0e0',
    sakuraLight: '#c0d8f0',
    sakuraDark:  '#7098c0',
    label:       '✦ SELAMAT TINGGAL ✦',
    sub:         'meninggalkan grup',
    actionIcon:  '👋',
  },
  promote: {
    gold:        '#c9a030',
    goldMid:     '#d4b040',
    goldDeep:    '#7a5a10',
    goldText:    '#4a3000',
    goldFaint:   'rgba(200,160,50,0.35)',
    goldBg:      'rgba(200,160,50,0.10)',
    goldBorder:  'rgba(200,160,50,0.5)',
    sakuraPink:  '#f8d080',
    sakuraLight: '#fce8a0',
    sakuraDark:  '#e8a820',
    label:       '✦ NAIK JABATAN ✦',
    sub:         'dipromosikan menjadi Admin',
    actionIcon:  '👑',
  },
  demote: {
    gold:        '#b05050',
    goldMid:     '#c06060',
    goldDeep:    '#6a1a1a',
    goldText:    '#400808',
    goldFaint:   'rgba(180,80,80,0.35)',
    goldBg:      'rgba(180,80,80,0.10)',
    goldBorder:  'rgba(180,80,80,0.5)',
    sakuraPink:  '#f0a0a0',
    sakuraLight: '#f8c0c0',
    sakuraDark:  '#d06060',
    label:       '✦ DICOPOT JABATAN ✦',
    sub:         'diturunkan dari Admin',
    actionIcon:  '🚫',
  },
}

async function generateCard({ type, avatarURL, bgURL, username, groupName, memberCount, actorName }) {
  await loadFonts()

  const T      = THEMES[type] || THEMES.welcome
  const W      = 900
  const H      = 460
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  // ── BACKGROUND ────────────────────────────────────────────────
  if (bgURL) {
    try {
      const bg = await safeImg(bgURL)
      ctx.drawImage(bg, 0, 0, W, H)
      // warm cream overlay supaya nuansa ceksn tetap muncul
      ctx.fillStyle = 'rgba(253,248,240,0.72)'
      ctx.fillRect(0, 0, W, H)
    } catch {
      const bgG = ctx.createLinearGradient(0, 0, W, H)
      bgG.addColorStop(0, '#fdf8f0'); bgG.addColorStop(0.4, '#fef9f2'); bgG.addColorStop(1, '#faf3e8')
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)
    }
  } else {
    const bgG = ctx.createLinearGradient(0, 0, W, H)
    bgG.addColorStop(0, '#fdf8f0'); bgG.addColorStop(0.4, '#fef9f2'); bgG.addColorStop(1, '#faf3e8')
    ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)
  }

  // ── PAPER GRAIN ───────────────────────────────────────────────
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(180,140,100,${Math.random() * 0.035 + 0.008})`
    ctx.beginPath()
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── VIGNETTE ──────────────────────────────────────────────────
  const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75)
  vign.addColorStop(0, 'transparent')
  vign.addColorStop(1, `rgba(160,110,60,0.14)`)
  ctx.fillStyle = vign; ctx.fillRect(0, 0, W, H)

  // ── DOUBLE BORDER ─────────────────────────────────────────────
  const M = 18
  rrp(ctx, M, M, W - M * 2, H - M * 2, 12)
  ctx.strokeStyle = T.gold; ctx.lineWidth = 1.8; ctx.stroke()
  rrp(ctx, M + 5, M + 5, W - M * 2 - 10, H - M * 2 - 10, 9)
  ctx.strokeStyle = T.goldFaint; ctx.lineWidth = 1; ctx.stroke()
  cornerFlourish(ctx, M + 3, M + 3, W - M * 2 - 6, H - M * 2 - 6, 22, T.gold)

  // ── SAKURA DECORATIONS ────────────────────────────────────────
  const sp = T.sakuraPink, sl = T.sakuraLight, sd = T.sakuraDark
  sakura(ctx, 46,     48,     26, sl, 0.18)
  sakura(ctx, W - 50, 38,     20, sp, 0.14)
  sakura(ctx, 36,     H - 46, 22, sp, 0.16)
  sakura(ctx, W - 44, H - 50, 24, sl, 0.14)
  sakura(ctx, 118,    H - 28, 13, sp, 0.12)
  sakura(ctx, W - 118,28,     14, sd, 0.10)

  ;[
    [W * 0.78, H * 0.10,  8, 0.3,  sp],
    [W * 0.13, H * 0.22,  6, 0.8,  sl],
    [W * 0.88, H * 0.55,  9, 1.1,  sp],
    [W * 0.10, H * 0.70,  7, 0.2,  sd],
    [W * 0.72, H * 0.90,  8, 1.5,  sl],
    [W * 0.35, H * 0.94,  6, 0.6,  sp],
    [W * 0.92, H * 0.26,  7, 1.8,  sd],
    [W * 0.55, H * 0.06,  5, 0.9,  sp],
  ].forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55))

  // ── AVATAR ────────────────────────────────────────────────────
  const CX  = W / 2
  const AR  = 68
  const AY  = 148

  // dashed outer ring
  ctx.save()
  ctx.strokeStyle = T.goldMid; ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.beginPath(); ctx.arc(CX, AY, AR + 16, 0, Math.PI * 2); ctx.stroke()
  ctx.setLineDash([]); ctx.restore()

  // solid inner ring
  ctx.save()
  ctx.strokeStyle = T.gold; ctx.lineWidth = 2.5
  ctx.shadowColor = T.gold + '88'; ctx.shadowBlur = 10
  ctx.beginPath(); ctx.arc(CX, AY, AR + 7, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()

  // avatar image
  const av = await safeImg(avatarURL)
  ctx.save()
  ctx.beginPath(); ctx.arc(CX, AY, AR, 0, Math.PI * 2); ctx.clip()
  ctx.drawImage(av, CX - AR, AY - AR, AR * 2, AR * 2)
  ctx.restore()

  // white inner ring
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(CX, AY, AR, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()

  // sakura flowers at cardinal diagonal of avatar ring
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i + Math.PI / 4
    sakura(ctx, CX + (AR + 7) * Math.cos(angle), AY + (AR + 7) * Math.sin(angle), 7, sp, 0.9)
  }

  // ── HEADER LABEL ──────────────────────────────────────────────
  const labelY = AY + AR + 22
  diamondRow(ctx, CX, labelY, 9, 22, 4.5, T.gold)

  ctx.font      = `bold 13px SFBold, Emoji`
  ctx.fillStyle = T.goldDeep; ctx.textAlign = 'center'
  ctx.fillText(T.label, CX, labelY + 20)

  ctx.save()
  ctx.strokeStyle = T.goldBorder; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(CX - 180, labelY + 28); ctx.lineTo(CX + 180, labelY + 28)
  ctx.stroke(); ctx.restore()

  // ── USERNAME ──────────────────────────────────────────────────
  const nameY = labelY + 58
  ctx.save()
  ctx.font        = `bold 44px Montserrat, Emoji`
  ctx.fillStyle   = T.goldText; ctx.textAlign = 'center'
  ctx.shadowColor = T.gold + '55'; ctx.shadowBlur = 10
  ctx.fillText(clampText(ctx, username, W - 120), CX, nameY)
  ctx.restore()

  // ── SUB TEXT ──────────────────────────────────────────────────
  const subY = nameY + 26
  ctx.font      = `13px SFMedium, Emoji`
  ctx.fillStyle = T.goldDeep + 'cc'; ctx.textAlign = 'center'
  ctx.fillText(`${T.actionIcon}  ${T.sub}  ·  ${clampText(ctx, groupName, 360)}`, CX, subY)

  diamondRow(ctx, CX, subY + 14, 5, 18, 3.5, T.gold)

  // ── INFO PILLS ────────────────────────────────────────────────
  const pillY    = subY + 36
  const memberStr = `👥  ${memberCount} Anggota`
  const actorStr  = actorName
    ? (type === 'promote' ? `👑  oleh ${actorName}`
     : type === 'demote'  ? `🚫  oleh ${actorName}`
     : type === 'bye'     ? `🚪  oleh ${actorName}`
     :                      `➕  oleh ${actorName}`)
    : null

  ctx.save()
  ctx.font = `11px SFMedium, Emoji`
  const mw   = ctx.measureText(memberStr).width + 28
  const aw   = actorStr ? ctx.measureText(actorStr).width + 28 : 0
  const gap  = 10
  const totW = actorStr ? mw + gap + aw : mw
  let sx = CX - totW / 2

  // member badge
  rrp(ctx, sx, pillY - 14, mw, 24, 12)
  ctx.fillStyle = T.goldBg; ctx.fill()
  ctx.strokeStyle = T.gold; ctx.lineWidth = 1; ctx.stroke()
  ctx.fillStyle = T.goldDeep; ctx.textAlign = 'left'
  ctx.fillText(memberStr, sx + 14, pillY + 3)

  // actor badge
  if (actorStr) {
    rrp(ctx, sx + mw + gap, pillY - 14, aw, 24, 12)
    ctx.fillStyle = T.goldBg; ctx.fill()
    ctx.strokeStyle = T.gold; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = T.goldDeep; ctx.textAlign = 'left'
    ctx.fillText(actorStr, sx + mw + gap + 14, pillY + 3)
  }
  ctx.restore()

  // ── FOOTER ────────────────────────────────────────────────────
  ctx.save()
  ctx.strokeStyle = T.goldBorder; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(M + 24, H - 36); ctx.lineTo(W - M - 24, H - 36)
  ctx.stroke(); ctx.restore()

  const now = new Date()
  const mo  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const ts  = `${now.getDate()} ${mo[now.getMonth()]} ${now.getFullYear()}  ·  ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} WIB`

  ctx.font      = `9px SFRegular, Emoji`
  ctx.fillStyle = `rgba(154,100,60,0.60)`; ctx.textAlign = 'center'
  ctx.fillText(`Apocalypse  ·  ${ts}`, CX, H - 22)
  ctx.fillText(`Data tersimpan aman  ·  Patuhi peraturan grup`, CX, H - 10)

  return canvas.toBuffer('image/jpeg', { quality: 95 })
}

// ─────────────────────────────────────────────────────────────
//  GROUP PARTICIPANT HANDLER
// ─────────────────────────────────────────────────────────────
async function getUpdatedMetadata(conn, id) {
  await new Promise(r => setTimeout(r, 250))
  return conn.groupMetadata(id)
}

const DEFAULT_AVATAR = 'src/avatar_contact.png'

export default async function handleGroupParticipants(data, conn, db) {
  const { id, participants, action, actor } = data
  if (!id?.endsWith('@g.us')) return

  const group     = db.data.chats[id] || {}
  const isWelcome = group.welcome === true
  const isDetect  = group.detect  === true
  if (!isWelcome && !isDetect) return

  let metadata
  try {
    metadata = await conn.groupMetadata(id)
    if (action === 'add' || action === 'remove')
      metadata = await getUpdatedMetadata(conn, id)
  } catch (e) {
    console.error('[GROUP METADATA ERROR]', e.message)
    return
  }

  const memberCount = metadata.participants.length
  const groupName   = metadata.subject || 'Grup Ini'
  const groupDesc   = metadata.desc    || ''
  const bgURL       = group.background || null

  const resolveJid  = (u) => {
    if (typeof u === 'string') return conn.decodeJid(u)
    if (u?.phoneNumber) return jidNormalizedUser(u.phoneNumber)
    if (u?.id) return conn.decodeJid(u.id)
    return ''
  }

  const resolveName = (jid) => {
    return conn.getName(jid)
  }

  const actorJid = actor ? conn.decodeJid(actor) : null

  const parseText = (text, jid) =>
    text
      .replace(/@user/g,  '@' + jid.split('@')[0])
      .replace(/@actor/g, actorJid ? '@' + actorJid.split('@')[0] : '')
      .replace(/@group/g, groupName)
      .replace(/@desc/g,  groupDesc)
      .replace(/@count/g, memberCount)

  for (const user of participants) {
    const jid       = resolveJid(user)
    if (!jid) continue

    const username  = resolveName(jid)
    const mentions  = [jid, actorJid].filter(Boolean)
    const actorName = actorJid ? resolveName(actorJid) : null

    let caption    = null
    let canvasType = null

    switch (action) {
      case 'add':
        if (!isWelcome) break
        caption = group.sWelcome?.trim()
          ? parseText(group.sWelcome, jid)
          : actorJid && actorJid !== jid
            ? `🌸 @${jid.split('@')[0]} ditambahkan oleh ${actorName}!`
            : `🌸 Selamat datang @${jid.split('@')[0]}!`
        canvasType = 'welcome'
        break

      case 'remove':
        if (!isWelcome) break
        caption = group.sBye?.trim()
          ? parseText(group.sBye, jid)
          : actorJid === jid
            ? `👋 @${jid.split('@')[0]} telah keluar dari grup.`
            : actorJid
              ? `🚪 @${jid.split('@')[0]} dikeluarkan dari grup.`
              : `👋 @${jid.split('@')[0]} telah meninggalkan grup.`
        canvasType = 'bye'
        break

      case 'promote':
        if (!isDetect) break
        caption = group.sPromote?.trim()
          ? parseText(group.sPromote, jid)
          : `👑 @${jid.split('@')[0]} sekarang menjadi Admin!`
        canvasType = 'promote'
        break

      case 'demote':
        if (!isDetect) break
        caption = group.sDemote?.trim()
          ? parseText(group.sDemote, jid)
          : `🚫 @${jid.split('@')[0]} dicopot dari jabatan Admin.`
        canvasType = 'demote'
        break
    }

    if (!caption || !canvasType) continue

    const ppuser = await conn
      .profilePictureUrl(jid, 'image')
      .catch(async () => {
        const lid = typeof user === 'object' ? user?.id : null
        if (lid && lid !== jid)
          return conn.profilePictureUrl(lid, 'image').catch(() => 'src/avatar_contact.png')
        return 'src/avatar_contact.png'
      })

    let imgBuffer = null
    try {
      imgBuffer = await generateCard({
        type: canvasType, avatarURL: ppuser, bgURL,
        username, groupName, memberCount, actorName,
      })
    } catch (err) {
      console.error('[CANVAS ERROR]', canvasType, err.message)
    }

    if (imgBuffer) {
      await conn.sendMessage(id, { image: imgBuffer, caption, mentions })
    } else {
      await conn.sendMessage(id, { text: caption, mentions })
    }
  }
}
