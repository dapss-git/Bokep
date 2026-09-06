import daily from '../rpg/daily.js'
import weekly from '../rpg/weekly.js'
import monthly from '../rpg/monthly.js'
import adventure from '../rpg/adventure.js'
import {
    createCanvas,
    loadImage,
    GlobalFonts
} from "@napi-rs/canvas"
import axios from "axios"

const BASE = "https://raw.githubusercontent.com/Blckrose2/font2/main/"

async function registerFont(name, file) {
    const res = await axios.get(BASE + encodeURIComponent(file), {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: { "User-Agent": "Canvas-My" }
    })
    GlobalFonts.register(Buffer.from(res.data), name)
}

async function safeLoadImage(url) {
    try {
        const res = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: { "User-Agent": "Canvas-My" }
        })
        return await loadImage(Buffer.from(res.data))
    } catch {
        const c = createCanvas(100, 100)
        const g = c.getContext("2d")
        g.fillStyle = '#e8d5c4'
        g.beginPath(); g.arc(50, 50, 50, 0, Math.PI * 2); g.fill()
        return await loadImage(c.toBuffer("image/png"))
    }
}

function rr(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}

const toNum = n => parseInt(n).toLocaleString().replace(/,/g, ".")

function clockString(ms) {
    if (isNaN(ms) || ms <= 0) return 'Expired'
    const d = Math.floor(ms / 86400000)
    const h = Math.floor(ms / 3600000) % 24
    const m = Math.floor(ms / 60000) % 60
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

function drawPetal(ctx, x, y, size, angle, alpha, color) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(0, -size / 2, size * 0.4, size * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
}

function drawDiamonds(ctx, cx, y, count, color, size = 4) {
    const spacing = 14
    const startX = cx - ((count - 1) * spacing) / 2
    for (let i = 0; i < count; i++) {
        const dx = startX + i * spacing
        const isCenter = i === Math.floor(count / 2)
        ctx.save()
        ctx.fillStyle = isCenter ? color : color + '99'
        ctx.translate(dx, y)
        ctx.rotate(Math.PI / 4)
        const s = isCenter ? size * 1.6 : size
        ctx.fillRect(-s / 2, -s / 2, s, s)
        ctx.restore()
    }
}

function drawStatRow(ctx, x, y, w, icon, label, value, bgColor, borderColor, valueColor) {
    ctx.save()
    rr(ctx, x, y, w, 32, 8)
    ctx.fillStyle = bgColor
    ctx.fill()
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    ctx.font = `9px SFLight, NotoEmoji`
    ctx.fillStyle = '#9a7a6a'
    ctx.textAlign = 'left'
    ctx.fillText(label, x + 30, y + 11)

    ctx.font = `14px NotoEmoji`
    ctx.fillStyle = valueColor
    ctx.fillText(icon, x + 8, y + 23)

    ctx.save()
    ctx.font = `bold 14px SFBold, NotoEmoji`
    ctx.fillStyle = valueColor
    ctx.shadowColor = valueColor + 'aa'
    ctx.shadowBlur = 6
    ctx.textAlign = 'right'
    ctx.fillText(value, x + w - 10, y + 24)
    ctx.restore()
}

const ARMOR_NAME   = ['None','Leather','Iron','Gold','Diamond','Emerald','Crystal','Obsidian','Netherite','Wither','Dragon','Hacker']
const SWORD_NAME   = ['None','Wood','Stone','Iron','Gold','Copper','Diamond','Emerald','Obsidian','Netherite','Samurai','Hacker']
const PICKAXE_NAME = ['None','Wood','Stone','Iron','Gold','Copper','Diamond','Emerald','Crystal','Obsidian','Netherite','Hacker']

async function generateMyCard(avatarURL, data) {
    await Promise.all([
        registerFont("SFBold",    "SFPRODISPLAYBOLD.OTF"),
        registerFont("SFMed",     "SFPRODISPLAYMEDIUM.OTF"),
        registerFont("SFReg",     "SFPRODISPLAYREGULAR.OTF"),
        registerFont("SFLight",   "SFPRODISPLAYLIGHTITALIC.OTF"),
        registerFont("Montserrat","Montserrat-Bold.ttf"),
        registerFont("NotoEmoji", "NotoColorEmoji-Regular.ttf"),
    ])

    const W = 900, H = 520
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext("2d")

    const isPrem = data.isPrem

    const C = {
        bg:          '#fdf0e8',
        panelBg:     '#fef5ee',
        cardBg:      '#fef4ec',
        border:      isPrem ? '#c070c0' : '#c09040',
        borderMid:   isPrem ? '#d090d0' : '#d0a850',
        borderSoft:  isPrem ? '#e0b0e0' : '#e0c070',
        borderFaint: isPrem ? '#f0d8f0' : '#f0e4c0',
        accent:      isPrem ? '#9030a0' : '#906010',
        accentMid:   isPrem ? '#b050b0' : '#b07820',
        accentSoft:  isPrem ? '#cc80cc' : '#cc9830',
        accentGlow:  isPrem ? '#c060c0cc' : '#c09030cc',
        text:        '#3c2818',
        textMed:     '#6a4030',
        textLight:   '#9a7050',
        textFaint:   '#bb9878',
        petal1:      '#f090b0',
        petal2:      '#f8b0c8',
        petal3:      '#fcd0e0',
        gold:        '#b06800',
        health:      '#c03030',
        healthBg:    '#fcdcdc',
        healthBorder:'#e06060',
        limitColor:  isPrem ? '#8020a0' : '#806010',
        limitBg:     isPrem ? '#f0d8f8' : '#f8f0d0',
        limitBorder: isPrem ? '#c060d0' : '#c0a030',
        moneyColor:  '#a06000',
        moneyBg:     '#fce8c0',
        moneyBorder: '#d09030',
        cdReady:     '#2a8a2a',
        cdReadyBg:   '#d8f0d8',
        cdReadyBorder:'#60c060',
        cdNotReady:  '#b02020',
        cdNotBg:     '#f8d8d8',
        cdNotBorder: '#e06060',
    }

    // ── BACKGROUND ──
    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, W, H)
    const vg = ctx.createRadialGradient(W*0.3, H*0.3, 0, W*0.5, H*0.5, W*0.7)
    vg.addColorStop(0, 'rgba(255,240,230,0.6)')
    vg.addColorStop(0.6, 'rgba(255,220,200,0.2)')
    vg.addColorStop(1, 'rgba(220,170,130,0.15)')
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H)

    // ── OUTER BORDER ──
    const BM = 14
    ctx.save()
    rr(ctx, BM, BM, W-BM*2, H-BM*2, 14)
    ctx.strokeStyle = C.border; ctx.lineWidth = 2.5
    ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 8; ctx.stroke()
    ctx.restore()
    ctx.save()
    rr(ctx, BM+6, BM+6, W-(BM+6)*2, H-(BM+6)*2, 10)
    ctx.strokeStyle = C.borderMid; ctx.lineWidth = 1; ctx.stroke()
    ctx.restore()
    for (const [cx, cy] of [[BM,BM],[W-BM-9,BM],[BM,H-BM-9],[W-BM-9,H-BM-9]]) {
        ctx.fillStyle = C.border;   ctx.fillRect(cx, cy, 9, 9)
        ctx.fillStyle = C.panelBg;  ctx.fillRect(cx+2, cy+2, 5, 5)
        ctx.fillStyle = C.accentMid; ctx.fillRect(cx+3, cy+3, 3, 3)
    }

    // ── PETALS ──
    const petals = [
        { x:28,  y:55,  s:14, a:0.40, r:0.4,  c:C.petal1 },
        { x:18,  y:110, s:10, a:0.35, r:1.1,  c:C.petal2 },
        { x:50,  y:165, s:12, a:0.30, r:0.8,  c:C.petal1 },
        { x:24,  y:235, s:9,  a:0.38, r:1.5,  c:C.petal3 },
        { x:44,  y:300, s:11, a:0.32, r:1.9,  c:C.petal2 },
        { x:20,  y:375, s:9,  a:0.28, r:0.3,  c:C.petal1 },
        { x:40,  y:455, s:8,  a:0.25, r:1.2,  c:C.petal3 },
        { x:870, y:48,  s:13, a:0.42, r:-0.5, c:C.petal1 },
        { x:852, y:108, s:9,  a:0.36, r:-1.2, c:C.petal2 },
        { x:872, y:170, s:11, a:0.30, r:0.3,  c:C.petal1 },
        { x:854, y:242, s:8,  a:0.35, r:-0.9, c:C.petal3 },
        { x:864, y:322, s:12, a:0.38, r:0.6,  c:C.petal2 },
        { x:848, y:405, s:9,  a:0.30, r:1.3,  c:C.petal1 },
        { x:440, y:18,  s:7,  a:0.28, r:0.7,  c:C.petal2 },
        { x:660, y:498, s:8,  a:0.26, r:0.8,  c:C.petal2 },
    ]
    for (const p of petals) drawPetal(ctx, p.x, p.y, p.s, p.r, p.a, p.c)

    // ══════════════════════
    // LEFT PANEL x=22 w=244
    // ══════════════════════
    const LP = { x: 22, y: 22, w: 244, h: H - 44 }

    ctx.save()
    rr(ctx, LP.x, LP.y, LP.w, LP.h, 14)
    const lpg = ctx.createLinearGradient(LP.x, LP.y, LP.x+LP.w, LP.y+LP.h)
    lpg.addColorStop(0, '#fef8f2'); lpg.addColorStop(1, '#fdeae0')
    ctx.fillStyle = lpg; ctx.fill()
    ctx.strokeStyle = C.border; ctx.lineWidth = 2
    ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 6; ctx.stroke()
    ctx.restore()

    // Avatar
    const avR  = 70
    const avCX = LP.x + LP.w / 2
    const avCY = LP.y + avR + 24

    for (let p = 0; p < 12; p++) {
        const angle = (p / 12) * Math.PI * 2
        ctx.save(); ctx.globalAlpha = 0.55
        ctx.fillStyle = p % 2 === 0 ? C.petal1 : C.petal2
        ctx.beginPath()
        ctx.ellipse(avCX+Math.cos(angle)*(avR+14), avCY+Math.sin(angle)*(avR+14), 5, 10, angle+Math.PI/2, 0, Math.PI*2)
        ctx.fill(); ctx.restore()
    }
    for (let i = 3; i >= 1; i--) {
        ctx.save(); ctx.globalAlpha = 0.15*i
        ctx.strokeStyle = C.accentMid; ctx.lineWidth = i*3
        ctx.beginPath(); ctx.arc(avCX, avCY, avR+i*8, 0, Math.PI*2); ctx.stroke(); ctx.restore()
    }
    ctx.save()
    ctx.strokeStyle = C.accentMid; ctx.lineWidth = 3.5
    ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 16
    ctx.beginPath(); ctx.arc(avCX, avCY, avR+2, 0, Math.PI*2); ctx.stroke(); ctx.restore()

    const av = await safeLoadImage(avatarURL)
    ctx.save()
    ctx.beginPath(); ctx.arc(avCX, avCY, avR, 0, Math.PI*2); ctx.clip()
    ctx.drawImage(av, avCX-avR, avCY-avR, avR*2, avR*2); ctx.restore()
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(avCX, avCY, avR, 0, Math.PI*2); ctx.stroke(); ctx.restore()

    // LV badge
    const lvY = avCY + avR + 8
    ctx.save()
    rr(ctx, avCX-32, lvY, 64, 22, 11)
    const lvg = ctx.createLinearGradient(avCX-32, lvY, avCX+32, lvY+22)
    lvg.addColorStop(0, C.accent); lvg.addColorStop(1, C.accentMid)
    ctx.fillStyle = lvg; ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 10; ctx.fill(); ctx.restore()
    ctx.font = `bold 12px SFBold, NotoEmoji`
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
    ctx.fillText(`LV ${data.level}`, avCX, lvY + 15)

    // Name
    ctx.font = `bold 22px Montserrat, NotoEmoji`
    ctx.fillStyle = C.text; ctx.textAlign = 'center'
    ctx.fillText(data.name, avCX, lvY + 40)

    // Role badge
    const roleY = lvY + 48
    ctx.font = `11px SFMed, NotoEmoji`
    const roleW = Math.min(ctx.measureText(data.role).width + 30, LP.w - 28)
    ctx.save()
    rr(ctx, avCX-roleW/2, roleY, roleW, 23, 12)
    ctx.fillStyle = C.borderSoft + 'cc'; ctx.fill()
    ctx.strokeStyle = C.borderMid; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
    ctx.font = `11px SFMed, NotoEmoji`
    ctx.fillStyle = C.accent; ctx.textAlign = 'center'
    ctx.fillText(data.role, avCX, roleY + 16)

    // Premium badge
    const premY = roleY + 31
    ctx.save()
    rr(ctx, avCX-56, premY, 112, 24, 12)
    const pg = ctx.createLinearGradient(avCX-56, premY, avCX+56, premY+24)
    isPrem ? (pg.addColorStop(0,'#b040b0aa'), pg.addColorStop(1,'#9020a066'))
           : (pg.addColorStop(0,'#c0800044'), pg.addColorStop(1,'#a0600033'))
    ctx.fillStyle = pg; ctx.fill()
    ctx.strokeStyle = isPrem ? C.accentMid : C.borderMid; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
    ctx.font = `bold 11px SFBold, NotoEmoji`
    ctx.fillStyle = isPrem ? '#8010a0' : '#805010'; ctx.textAlign = 'center'
    ctx.fillText(isPrem ? '≡  PREMIUM' : '≡  FREE', avCX, premY + 16)

    // EXP bar
    const expY = premY + 34
    ctx.font = `8px SFLight, NotoEmoji`
    ctx.fillStyle = C.textLight; ctx.textAlign = 'left'
    ctx.fillText('EXP', LP.x+16, expY)
    ctx.fillStyle = C.textMed; ctx.textAlign = 'right'
    ctx.fillText(toNum(data.exp), LP.x+LP.w-16, expY)

    const barX = LP.x+16, barW = LP.w-32, barH = 7
    ctx.save(); rr(ctx, barX, expY+3, barW, barH, 4)
    ctx.fillStyle = C.borderFaint; ctx.fill(); ctx.restore()
    const expPct = Math.min((data.exp % ((data.level+1)*1000)) / ((data.level+1)*1000), 1)
    if (expPct > 0) {
        ctx.save(); rr(ctx, barX, expY+3, Math.max(barW*expPct,14), barH, 4)
        const eg = ctx.createLinearGradient(barX,0,barX+barW,0)
        eg.addColorStop(0, C.accent); eg.addColorStop(1, C.accentSoft)
        ctx.fillStyle = eg; ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 8; ctx.fill(); ctx.restore()
    }

    // Stat rows
    const stX = LP.x+12, stW = LP.w-24, stY0 = expY+18
    drawStatRow(ctx, stX, stY0,      stW, '❤️', 'HEALTH', toNum(data.health), C.healthBg, C.healthBorder, C.health)
    drawStatRow(ctx, stX, stY0+40,   stW, '⚡', 'LIMIT',  isPrem?'∞':toNum(data.limit), C.limitBg, C.limitBorder, C.limitColor)
    drawStatRow(ctx, stX, stY0+80,   stW, '💰', 'MONEY',  toNum(data.money), C.moneyBg, C.moneyBorder, C.moneyColor)

    drawDiamonds(ctx, avCX, LP.y+LP.h-14, 5, C.borderMid, 3.5)

    // ══════════════════════════════
    // RIGHT PANEL x=278 w=W-300
    // ══════════════════════════════
    const RP = { x: 278, y: 22, w: W-300, h: H-44 }

    ctx.save()
    rr(ctx, RP.x, RP.y, RP.w, RP.h, 14)
    const rpg = ctx.createLinearGradient(RP.x, RP.y, RP.x+RP.w, RP.y+RP.h)
    rpg.addColorStop(0,'#fef8f0'); rpg.addColorStop(1,'#fdeee8')
    ctx.fillStyle = rpg; ctx.fill()
    ctx.strokeStyle = C.border; ctx.lineWidth = 2
    ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 6; ctx.stroke(); ctx.restore()

    // Header
    const rhH = 50
    ctx.save()
    rr(ctx, RP.x, RP.y, RP.w, rhH, 14)
    const rhg = ctx.createLinearGradient(RP.x, RP.y, RP.x, RP.y+rhH)
    rhg.addColorStop(0, C.accent+'28'); rhg.addColorStop(1, C.accentSoft+'10')
    ctx.fillStyle = rhg; ctx.fill(); ctx.restore()
    ctx.save()
    ctx.strokeStyle = C.borderMid; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(RP.x+20,RP.y+rhH); ctx.lineTo(RP.x+RP.w-20,RP.y+rhH); ctx.stroke(); ctx.restore()
    drawDiamonds(ctx, RP.x+RP.w/2, RP.y+rhH-4, 5, C.borderMid, 3.5)
    ctx.save()
    ctx.font = `bold 17px Montserrat, NotoEmoji`
    ctx.fillStyle = C.accent; ctx.textAlign = 'center'
    ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 10
    ctx.fillText('MY PROFILE', RP.x+RP.w/2, RP.y+33); ctx.restore()

    // Wallet
    const wY = RP.y+rhH+10, wH = 60
    ctx.save()
    rr(ctx, RP.x+12, wY, RP.w-24, wH, 10)
    const wg = ctx.createLinearGradient(RP.x+12,wY,RP.x+RP.w-12,wY+wH)
    wg.addColorStop(0,'#fce8c0'); wg.addColorStop(1,'#f8dda8')
    ctx.fillStyle = wg; ctx.fill()
    ctx.strokeStyle = C.moneyBorder; ctx.lineWidth = 2
    ctx.shadowColor = '#d08000'+'66'; ctx.shadowBlur = 6; ctx.stroke(); ctx.restore()
    ctx.font = `9px SFLight, NotoEmoji`; ctx.fillStyle = '#806020'; ctx.textAlign = 'left'
    ctx.fillText('💰  WALLET', RP.x+24, wY+14)
    ctx.save()
    ctx.font = `bold 28px SFBold, NotoEmoji`; ctx.fillStyle = C.gold
    ctx.shadowColor = '#d08000'+'aa'; ctx.shadowBlur = 10
    ctx.fillText(toNum(data.money), RP.x+24, wY+46); ctx.restore()
    if (data.bank > 0) {
        ctx.font = `11px SFReg, NotoEmoji`; ctx.fillStyle = C.textMed; ctx.textAlign = 'right'
        ctx.fillText(`🏦 ${toNum(data.bank)} / ${toNum(data.fullatm)}`, RP.x+RP.w-22, wY+46)
    }

    // Equipment + Crates
    const ecY = wY+wH+10, ecH = 138
    const eqW = Math.floor((RP.w-36)*0.52)
    const crW = RP.w-36-eqW-8

    // Equipment
    ctx.save(); rr(ctx, RP.x+12, ecY, eqW, ecH, 10)
    ctx.fillStyle = C.cardBg; ctx.fill()
    ctx.strokeStyle = C.borderMid; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
    ctx.font = `9px SFMed, NotoEmoji`; ctx.fillStyle = C.accent; ctx.textAlign = 'left'
    ctx.fillText('≡  EQUIPMENT', RP.x+22, ecY+14)
    ctx.save(); ctx.strokeStyle = C.borderSoft; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(RP.x+22,ecY+18); ctx.lineTo(RP.x+12+eqW-10,ecY+18); ctx.stroke(); ctx.restore()

    const eqItems = [
        { icon:'🛡️', val: ARMOR_NAME[data.armor]||'None',    lv: data.armor },
        { icon:'⚔️', val: SWORD_NAME[data.sword]||'None',     lv: data.sword },
        { icon:'⛏️', val: PICKAXE_NAME[data.pickaxe]||'None', lv: data.pickaxe },
        { icon:'🎣', val: data.fishingrod>0?`Lv.${data.fishingrod}`:'None', lv: data.fishingrod },
    ]
    eqItems.forEach((eq, i) => {
        const ey = ecY+30+i*24
        const active = eq.lv > 0
        ctx.font = `13px NotoEmoji`; ctx.fillStyle = active?C.accent:C.borderSoft; ctx.textAlign='left'
        ctx.fillText(eq.icon, RP.x+22, ey)
        ctx.font = `11px SFReg, NotoEmoji`; ctx.fillStyle = active?C.text:C.textFaint
        ctx.fillText(eq.val, RP.x+42, ey)
        if (active) {
            ctx.font = `9px SFLight, NotoEmoji`; ctx.fillStyle = C.accentSoft; ctx.textAlign = 'right'
            ctx.fillText(`Lv.${eq.lv}`, RP.x+12+eqW-10, ey)
        }
    })

    // Crates
    const crX = RP.x+12+eqW+8
    ctx.save(); rr(ctx, crX, ecY, crW, ecH, 10)
    ctx.fillStyle = C.cardBg; ctx.fill()
    ctx.strokeStyle = C.borderMid; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
    ctx.font = `9px SFMed, NotoEmoji`; ctx.fillStyle = C.accent; ctx.textAlign = 'left'
    ctx.fillText('📦  CRATES', crX+10, ecY+14)
    ctx.save(); ctx.strokeStyle = C.borderSoft; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(crX+10,ecY+18); ctx.lineTo(crX+crW-10,ecY+18); ctx.stroke(); ctx.restore()

    const crates = [
        { icon:'⬜', name:'Common',    val:data.common,    color:'#707070' },
        { icon:'🟩', name:'Uncommon',  val:data.uncommon,  color:'#2a8a2a' },
        { icon:'🟪', name:'Mythic',    val:data.mythic,    color: isPrem?'#8020a0':'#6020a0' },
        { icon:'🟨', name:'Legendary', val:data.legendary, color:'#a06000' },
        { icon:'🐾', name:'Pet',       val:data.pet,       color:'#c05010' },
    ]
    crates.forEach((cr, i) => {
        const cry = ecY+30+i*20
        const active = cr.val > 0
        ctx.font = `12px NotoEmoji`; ctx.fillStyle = active?cr.color:C.borderSoft; ctx.textAlign='left'
        ctx.fillText(cr.icon, crX+10, cry)
        ctx.font = `11px SFReg, NotoEmoji`; ctx.fillStyle = active?C.textMed:C.textFaint
        ctx.fillText(cr.name, crX+26, cry)
        ctx.save()
        ctx.font = `bold 12px SFBold, NotoEmoji`; ctx.fillStyle = active?cr.color:C.textFaint
        ctx.shadowColor = active?cr.color+'88':'transparent'; ctx.shadowBlur = active?4:0
        ctx.textAlign = 'right'; ctx.fillText(cr.val, crX+crW-10, cry); ctx.restore()
    })

    // ── COOLDOWNS ──
    // Each item is a pill with: icon + name on left, remaining on RIGHT of same pill
    // pill height = 28px, 2 columns, row gap = 10px → 2 rows × 38px = 76px + header 28 = 104px total
    const cdY  = ecY+ecH+10
    const cdH  = RP.h-(cdY-RP.y)-12

    ctx.save(); rr(ctx, RP.x+12, cdY, RP.w-24, cdH, 10)
    ctx.fillStyle = C.cardBg; ctx.fill()
    ctx.strokeStyle = C.borderMid; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

    ctx.font = `9px SFMed, NotoEmoji`; ctx.fillStyle = C.accent; ctx.textAlign = 'left'
    ctx.fillText('⏱  COOLDOWNS', RP.x+22, cdY+14)
    ctx.save(); ctx.strokeStyle = C.borderSoft; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(RP.x+22,cdY+18); ctx.lineTo(RP.x+RP.w-22,cdY+18); ctx.stroke(); ctx.restore()

    // 2 columns, pill width fills each column
    // column width = (RP.w - 24 - 12) / 2  (24=panel padding, 12=gap between cols)
    const cdGap    = 10   // gap between columns
    const cdPad    = 14   // inner padding from panel edge
    const cdTotalW = RP.w - 24 - cdPad*2   // usable width inside panel
    const cdCW     = (cdTotalW - cdGap) / 2  // each column width
    const pillH    = 28
    const pillGap  = 8    // vertical gap between rows

    data.cooldowns.forEach((cd, i) => {
        const col  = i % 2
        const row  = Math.floor(i / 2)
        const px   = RP.x + 12 + cdPad + col * (cdCW + cdGap)
        const py   = cdY + 26 + row * (pillH + pillGap)

        // Pill background
        ctx.save()
        rr(ctx, px, py, cdCW, pillH, 7)
        ctx.fillStyle = cd.ready ? C.cdReadyBg : C.cdNotBg
        ctx.fill()
        ctx.strokeStyle = cd.ready ? C.cdReadyBorder : C.cdNotBorder
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()

        // Icon (✅/❌)
        ctx.font = `13px NotoEmoji`
        ctx.fillStyle = cd.ready ? C.cdReady : C.cdNotReady
        ctx.textAlign = 'left'
        ctx.fillText(cd.ready ? '✅' : '❌', px + 6, py + pillH/2 + 5)

        // Name — left aligned after icon
        ctx.font = `bold 11px SFBold, NotoEmoji`
        ctx.fillStyle = cd.ready ? C.cdReady : C.cdNotReady
        ctx.textAlign = 'left'
        ctx.fillText(cd.name, px + 26, py + pillH/2 + 5)

        // Remaining — right aligned inside pill, no overlap possible
        if (!cd.ready) {
            ctx.font = `10px SFLight, NotoEmoji`
            ctx.fillStyle = '#a04040'
            ctx.textAlign = 'right'
            ctx.fillText(cd.remaining, px + cdCW - 8, py + pillH/2 + 5)
        }
    })

    // Footer
    ctx.font = `9px SFLight, NotoEmoji`
    ctx.fillStyle = '#bb9878'; ctx.textAlign = 'center'
    ctx.fillText(`Apocalypse  ·  ${data.footerDate}`, W/2, H-BM-8)

    return canvas.toBuffer("image/png")
}

const inventory = {
    cooldowns: {
        lastclaim:     { name: 'Daily',     time: daily.cooldown     },
        lastweekly:    { name: 'Weekly',    time: weekly.cooldown    },
        lastmonthly:   { name: 'Monthly',   time: monthly.cooldown   },
        lastadventure: { name: 'Adventure', time: adventure.cooldown },
    }
}

let handler = async (m, { conn }) => {
    const user = global.db.data.users[m.sender]

    const isOwner = m.fromMe || (global.owner || [])
        .map(v => (Array.isArray(v) ? v[0] : v).replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        .includes(m.sender)
    const isPrem = isOwner || new Date() - user.premiumTime < 0

    const cooldowns = Object.entries(inventory.cooldowns).map(([cd, { name, time }]) => {
        const elapsed = new Date() - user[cd]
        const ready   = elapsed >= time
        return { name, ready, remaining: ready ? '' : clockString(time - elapsed) }
    })

    const avatarURL = await conn.profilePictureUrl(m.sender, 'image')
        .catch(() => 'src/avatar_contact.png')

    const now = new Date()
    const mo  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const footerDate = `${now.getDate()} ${mo[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} WIB`

    const img = await generateMyCard(avatarURL, {
        name:       user.registered ? user.name : conn.getName(m.sender),
        role:       user.role       || 'Beginner',
        isPrem,
        exp:        user.exp        || 0,
        level:      user.level      || 0,
        health:     user.health     || 100,
        limit:      user.limit      || 50,
        money:      user.money      || 0,
        bank:       user.bank       || 0,
        fullatm:    user.fullatm    || 0,
        armor:      user.armor      || 0,
        sword:      user.sword      || 0,
        pickaxe:    user.pickaxe    || 0,
        fishingrod: user.fishingrod || 0,
        common:     user.common     || 0,
        uncommon:   user.uncommon   || 0,
        mythic:     user.mythic     || 0,
        legendary:  user.legendary  || 0,
        pet:        user.pet        || 0,
        cooldowns,
        footerDate,
    })

    await conn.sendFile(m.chat, img, 'my.png', '', m)
}

handler.help     = ['my']
handler.tags     = ['xp']
handler.command  = /^(my)$/i
handler.register = true

export default handler
