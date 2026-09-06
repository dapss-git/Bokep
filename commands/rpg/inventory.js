import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas'
import axios from 'axios'

const BASE = 'https://raw.githubusercontent.com/Blckrose2/font2/main/'
const DEFAULT_AVATAR = 'src/avatar_contact.png'

let fontLoaded = false
async function initFonts() {
    if (fontLoaded) return
    const load = async (name, file) => {
        const res = await axios.get(BASE + encodeURIComponent(file), {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Canvas-Inventory'
            }
        })
        GlobalFonts.register(Buffer.from(res.data), name)
    }
    await Promise.all([
        load('SFBold', 'SFPRODISPLAYBOLD.OTF'),
        load('SFMed', 'SFPRODISPLAYMEDIUM.OTF'),
        load('SFReg', 'SFPRODISPLAYREGULAR.OTF'),
        load('SFLight', 'SFPRODISPLAYLIGHTITALIC.OTF'),
        load('Poppins', 'poppins-bold.ttf'),
        load('PoppinsR', 'poppins-regular.ttf'),
        load('NotoEmoji', 'NotoColorEmoji-Regular.ttf'),
    ])
    fontLoaded = true
}

async function safeImg(url) {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Canvas-Inventory'
            }
        })
        return await loadImage(Buffer.from(res.data))
    } catch {
        const c = createCanvas(100, 100)
        const x = c.getContext('2d')
        x.fillStyle = '#1e293b'
        x.beginPath();
        x.arc(50, 50, 50, 0, Math.PI * 2);
        x.fill()
        return await loadImage(c.toBuffer('image/png'))
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

const toNum = n => parseInt(n || 0).toLocaleString().replace(/,/g, '.')

function clockString(ms) {
    if (isNaN(ms) || ms <= 0) return 'Ready'
    const d = Math.floor(ms / 86400000)
    const h = Math.floor(ms / 3600000) % 24
    const m = Math.floor(ms / 60000) % 60
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

function sectionHeader(ctx, x, y, w, label, color) {
    ctx.save()

    ctx.fillStyle = color
    ctx.shadowColor = color;
    ctx.shadowBlur = 6
    ctx.fillRect(x, y, 3, 16)
    ctx.restore()
    ctx.save()
    ctx.font = 'bold 11px Poppins, NotoEmoji'
    ctx.fillStyle = color
    ctx.shadowColor = color + '88';
    ctx.shadowBlur = 4
    ctx.textAlign = 'left'
    ctx.fillText(label, x + 10, y + 13)
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = color + '33';
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x + w, y + 20);
    ctx.stroke()
    ctx.restore()
}

function drawItemPill(ctx, x, y, w, h, icon, label, value, accentColor, bg, border) {
    ctx.save()
    rr(ctx, x, y, w, h, 7)
    ctx.fillStyle = bg;
    ctx.fill()
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke()
    ctx.restore()

    ctx.font = '13px NotoEmoji'
    ctx.fillStyle = accentColor
    ctx.textAlign = 'left'
    ctx.fillText(icon, x + 7, y + h / 2 + 5)

    ctx.font = '11px SFMed, NotoEmoji'
    ctx.fillStyle = '#c8d8e8'
    ctx.textAlign = 'left'
    ctx.fillText(label, x + 28, y + h / 2 + 4)

    ctx.save()
    ctx.font = 'bold 12px SFBold, NotoEmoji'
    ctx.fillStyle = accentColor
    ctx.shadowColor = accentColor + '66';
    ctx.shadowBlur = 4
    ctx.textAlign = 'right'
    ctx.fillText(value, x + w - 8, y + h / 2 + 4)
    ctx.restore()
}

const TOOLS_NAME = {
    armor: ['❌', 'Leather', 'Iron', 'Gold', 'Diamond', 'Emerald', 'Crystal', 'Obsidian', 'Netherite', 'Wither', 'Dragon', 'Hacker'],
    sword: ['❌', 'Wooden', 'Stone', 'Iron', 'Gold', 'Copper', 'Diamond', 'Emerald', 'Obsidian', 'Netherite', 'Samurai', 'Hacker'],
    pickaxe: ['❌', 'Wooden', 'Stone', 'Iron', 'Gold', 'Copper', 'Diamond', 'Emerald', 'Crystal', 'Obsidian', 'Netherite', 'Hacker'],
    fishingrod: ['❌', 'Wooden', 'Stone', 'Iron', 'Gold', 'Copper', 'Diamond', 'Emerald', 'Crystal', 'Obsidian', 'God', 'Hacker'],
}

const ITEM_EMOJI = {
    bibitanggur: '🌱',
    bibitmangga: '🌱',
    bibitpisang: '🌱',
    bibitapel: '🌱',
    bibitjeruk: '🌱',
    anggur: '🍇',
    mangga: '🥭',
    pisang: '🍌',
    apel: '🍎',
    jeruk: '🍊',
    potion: '🧪',
    trash: '🗑️',
    wood: '🪵',
    rock: '🪨',
    string: '🧵',
    emerald: '💚',
    diamond: '💎',
    gold: '🟡',
    iron: '⚙️',
    umpan: '🪱',
    upgrader: '🔧',
    pet: '🐾',
    petfood: '🐟',
    steak: '🥩',
    ayam_goreng: '🍗',
    ribs: '🍖',
    roti: '🍞',
    udang_goreng: '🍤',
    bacon: '🥓',
    gandum: '🌾',
    minyak: '🫙',
    garam: '🧂',
    common: '⬜',
    uncommon: '🟩',
    mythic: '🟪',
    legendary: '🟨',
    armor: '🛡️',
    sword: '⚔️',
    pickaxe: '⛏️',
    fishingrod: '🎣',
    horse: '🐴',
    cat: '🐱',
    fox: '🦊',
    dog: '🐶',
    robo: '🤖',
    money: '💰',
    chip: '🎰',
    exp: '⭐',
    health: '❤️',
    bank: '🏦',
}

async function generateInventoryCard(avatarURL, data) {
    await initFonts()

    const W = 980

    const itemCount = data.items.length
    const itemRows = Math.ceil(itemCount / 3)
    const hasTools = data.tools.length > 0
    const hasPets = data.pets.length > 0
    const hasCrates = data.crates.length > 0
    const hasDura = data.dura.length > 0

    const H = Math.max(820,
        340 +
        (hasCrates ? 80 : 0) +
        (hasTools ? 80 : 0) +
        (hasDura ? 80 : 0) +
        (hasPets ? 80 : 0) +
        itemRows * 36 + 60
    )

    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const C = {
        bg: '#070c18',
        card: '#0c1424',
        panel: '#101928',
        border: '#1a2840',
        accent: '#6366f1',
        accentB: '#8b5cf6',
        gold: '#f59e0b',
        green: '#10b981',
        red: '#ef4444',
        blue: '#3b82f6',
        text: '#e2e8f0',
        sub: '#94a3b8',
        muted: '#475569',
        dim: '#131f30',
    }

    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.012)'
    ctx.lineWidth = 1
    for (let i = -H; i < W + H; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke()
    }
    ctx.restore()

    const gl1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 300)
    gl1.addColorStop(0, C.accent + '1a');
    gl1.addColorStop(1, 'transparent')
    ctx.fillStyle = gl1;
    ctx.fillRect(0, 0, W, H)
    const gl2 = ctx.createRadialGradient(W, H, 0, W, H, 280)
    gl2.addColorStop(0, C.accentB + '14');
    gl2.addColorStop(1, 'transparent')
    ctx.fillStyle = gl2;
    ctx.fillRect(0, 0, W, H)

    const PAD = 20
    ctx.save()
    rr(ctx, PAD, PAD, W - PAD * 2, H - PAD * 2, 20)
    ctx.fillStyle = C.card;
    ctx.fill()
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.stroke()
    ctx.restore()

    ctx.save()
    const sh = ctx.createLinearGradient(PAD + 60, 0, W - PAD - 60, 0)
    sh.addColorStop(0, 'transparent');
    sh.addColorStop(0.3, C.accent + 'cc')
    sh.addColorStop(0.5, C.accentB + 'ff');
    sh.addColorStop(0.7, C.accent + 'cc');
    sh.addColorStop(1, 'transparent')
    ctx.strokeStyle = sh;
    ctx.lineWidth = 2
    ctx.shadowColor = C.accentB;
    ctx.shadowBlur = 10
    ctx.beginPath();
    ctx.moveTo(PAD + 60, PAD + 1);
    ctx.lineTo(W - PAD - 60, PAD + 1);
    ctx.stroke()
    ctx.restore()

    const LP = {
        x: PAD + 10,
        y: PAD + 14,
        w: 210,
        h: H - PAD * 2 - 28
    }
    ctx.save()
    rr(ctx, LP.x, LP.y, LP.w, LP.h, 16)
    ctx.fillStyle = C.panel;
    ctx.fill()
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.stroke()
    ctx.restore()

    const avR = 60,
        avX = LP.x + LP.w / 2,
        avY = LP.y + avR + 20
    for (let i = 4; i >= 1; i--) {
        ctx.save();
        ctx.globalAlpha = 0.05 * i
        const rg = ctx.createRadialGradient(avX, avY, avR, avX, avY, avR + i * 12)
        rg.addColorStop(0, C.accent);
        rg.addColorStop(1, 'transparent')
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(avX, avY, avR + i * 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore()
    }
    const av = await safeImg(avatarURL)
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX, avY, avR, 0, Math.PI * 2);
    ctx.clip()
    ctx.drawImage(av, avX - avR, avY - avR, avR * 2, avR * 2);
    ctx.restore()
    ctx.save()
    const avbg = ctx.createLinearGradient(avX - avR, avY - avR, avX + avR, avY + avR)
    avbg.addColorStop(0, C.accent);
    avbg.addColorStop(1, C.accentB)
    ctx.strokeStyle = avbg;
    ctx.lineWidth = 3
    ctx.shadowColor = C.accent;
    ctx.shadowBlur = 14
    ctx.beginPath();
    ctx.arc(avX, avY, avR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore()

    const lvY = avY + avR + 10
    ctx.save()
    rr(ctx, avX - 30, lvY, 60, 22, 11)
    const lvg = ctx.createLinearGradient(avX - 30, lvY, avX + 30, lvY + 22)
    lvg.addColorStop(0, C.accent);
    lvg.addColorStop(1, C.accentB)
    ctx.fillStyle = lvg;
    ctx.shadowColor = C.accent + 'aa';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore()
    ctx.font = 'bold 12px Poppins';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'
    ctx.fillText(`LV ${data.level}`, avX, lvY + 15)

    ctx.save()
    ctx.font = 'bold 18px SFBold, NotoEmoji'
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center'
    let dname = data.name
    while (ctx.measureText(dname).width > LP.w - 20 && dname.length > 3) dname = dname.slice(0, -1)
    if (dname !== data.name) dname += '…'
    ctx.fillText(dname, avX, lvY + 38);
    ctx.restore()

    const premY = lvY + 46
    ctx.save()
    rr(ctx, avX - 44, premY, 88, 22, 11)
    ctx.fillStyle = data.isPrem ? C.accentB + '33' : C.muted + '22';
    ctx.fill()
    ctx.strokeStyle = data.isPrem ? C.accentB + '88' : C.muted + '55';
    ctx.lineWidth = 1;
    ctx.stroke()
    ctx.restore()
    ctx.font = 'bold 10px Poppins';
    ctx.fillStyle = data.isPrem ? C.accentB : C.muted
    ctx.textAlign = 'center';
    ctx.fillText(data.isPrem ? '★  PREMIUM' : '—  FREE', avX, premY + 15)

    const statRows = [{
            icon: '❤️',
            label: 'HEALTH',
            val: toNum(data.health),
            color: '#ef4444',
            bg: '#1a0a0a',
            border: '#3d1212'
        },
        {
            icon: '💰',
            label: 'MONEY',
            val: toNum(data.money),
            color: C.gold,
            bg: '#1a1200',
            border: '#3d2d00'
        },
        {
            icon: '🏦',
            label: 'BANK',
            val: toNum(data.bank),
            color: C.blue,
            bg: '#0a1020',
            border: '#1a2848'
        },
        {
            icon: '🎰',
            label: 'CHIP',
            val: toNum(data.chip),
            color: C.green,
            bg: '#0a1a12',
            border: '#1a3a22'
        },
        {
            icon: '⭐',
            label: 'EXP',
            val: toNum(data.exp),
            color: C.accentB,
            bg: '#100a1a',
            border: '#2d1a3d'
        },
        {
            icon: '⚡',
            label: 'LIMIT',
            val: data.isPrem ? '∞' : toNum(data.limit),
            color: '#38bdf8',
            bg: '#060e1a',
            border: '#0d2035'
        },
    ]
    let statY = premY + 32
    for (const s of statRows) {
        ctx.save()
        rr(ctx, LP.x + 10, statY, LP.w - 20, 28, 7)
        ctx.fillStyle = s.bg;
        ctx.fill()
        ctx.strokeStyle = s.border;
        ctx.lineWidth = 1;
        ctx.stroke()
        ctx.restore()

        ctx.font = '13px NotoEmoji';
        ctx.fillStyle = s.color;
        ctx.textAlign = 'left'
        ctx.fillText(s.icon, LP.x + 15, statY + 20)
        ctx.font = '10px PoppinsR';
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'left'
        ctx.fillText(s.label, LP.x + 34, statY + 11)
        ctx.save()
        ctx.font = 'bold 13px SFBold';
        ctx.fillStyle = s.color
        ctx.shadowColor = s.color + '66';
        ctx.shadowBlur = 4
        ctx.textAlign = 'right';
        ctx.fillText(s.val, LP.x + LP.w - 14, statY + 21);
        ctx.restore()
        statY += 34
    }

    const cdStartY = statY + 8
    sectionHeader(ctx, LP.x + 10, cdStartY, LP.w - 20, '⏱  COOLDOWNS', C.accent)
    let cdY = cdStartY + 28
    for (const cd of data.cooldowns) {
        const ready = cd.ready
        ctx.save()
        rr(ctx, LP.x + 10, cdY, LP.w - 20, 24, 6)
        ctx.fillStyle = ready ? '#0a1a0a' : '#1a0a0a';
        ctx.fill()
        ctx.strokeStyle = ready ? '#1a3a22' : '#3a1010';
        ctx.lineWidth = 1;
        ctx.stroke()
        ctx.restore()

        ctx.font = '12px NotoEmoji';
        ctx.textAlign = 'left'
        ctx.fillText(ready ? '✅' : '❌', LP.x + 14, cdY + 18)
        ctx.font = '11px SFMed';
        ctx.fillStyle = ready ? C.green : C.red
        ctx.textAlign = 'left';
        ctx.fillText(cd.name, LP.x + 34, cdY + 17)
        if (!ready) {
            ctx.font = '10px SFLight';
            ctx.fillStyle = '#a05050'
            ctx.textAlign = 'right';
            ctx.fillText(cd.remaining, LP.x + LP.w - 12, cdY + 17)
        }
        cdY += 30
    }

    const dmItems = [{
            label: 'Dungeon',
            ready: data.lastdungeon === 0
        },
        {
            label: 'Mining',
            ready: data.lastmining === 0
        },
    ]
    cdY += 4
    for (const d of dmItems) {
        ctx.save()
        rr(ctx, LP.x + 10, cdY, LP.w - 20, 24, 6)
        ctx.fillStyle = d.ready ? '#0a1a0a' : '#1a0a0a';
        ctx.fill()
        ctx.strokeStyle = d.ready ? '#1a3a22' : '#3a1010';
        ctx.lineWidth = 1;
        ctx.stroke()
        ctx.restore()
        ctx.font = '12px NotoEmoji';
        ctx.textAlign = 'left'
        ctx.fillText(d.ready ? '✅' : '❌', LP.x + 14, cdY + 18)
        ctx.font = '11px SFMed';
        ctx.fillStyle = d.ready ? C.green : C.red
        ctx.textAlign = 'left';
        ctx.fillText(d.label, LP.x + 34, cdY + 17)
        cdY += 30
    }

    ctx.font = '9px PoppinsR';
    ctx.fillStyle = C.muted + '88';
    ctx.textAlign = 'center'
    ctx.fillText(`© ${global.botname || 'Theresa'}`, avX, LP.y + LP.h - 10)

    const RP = {
        x: LP.x + LP.w + 12,
        y: PAD + 14,
        w: W - LP.x - LP.w - 12 - PAD - 10,
        h: H - PAD * 2 - 28
    }
    ctx.save()
    rr(ctx, RP.x, RP.y, RP.w, RP.h, 16)
    ctx.fillStyle = C.panel;
    ctx.fill()
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.stroke()
    ctx.restore()

    ctx.save()
    rr(ctx, RP.x, RP.y, RP.w, 48, 16)
    const hg = ctx.createLinearGradient(RP.x, RP.y, RP.x + RP.w, RP.y + 48)
    hg.addColorStop(0, C.accent + '22');
    hg.addColorStop(1, C.accentB + '11')
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.restore()
    ctx.save()
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(RP.x + 16, RP.y + 48);
    ctx.lineTo(RP.x + RP.w - 16, RP.y + 48);
    ctx.stroke()
    ctx.restore()
    ctx.font = 'bold 16px Poppins, NotoEmoji'
    ctx.fillStyle = C.accent;
    ctx.textAlign = 'left'
    ctx.shadowColor = C.accent + '88';
    ctx.shadowBlur = 8
    ctx.fillText('🎒  INVENTORY', RP.x + 20, RP.y + 30)
    ctx.restore()

    const ranks = [{
            icon: '🎰',
            label: `#${data.rankChip}`,
            color: C.green
        },
        {
            icon: '💰',
            label: `#${data.rankMoney}`,
            color: C.gold
        },
        {
            icon: '🏦',
            label: `#${data.rankBank}`,
            color: C.blue
        },
        {
            icon: '⭐',
            label: `#${data.rankLevel}`,
            color: C.accentB
        },
        {
            icon: '💎',
            label: `#${data.rankDiamond}`,
            color: '#38bdf8'
        },
    ]
    let rankX = RP.x + RP.w - 20
    for (const r of [...ranks].reverse()) {
        ctx.save()
        ctx.font = '11px PoppinsR, NotoEmoji'
        const rw = ctx.measureText(r.icon + ' ' + r.label).width + 16
        rankX -= rw + 6
        rr(ctx, rankX, RP.y + 14, rw, 20, 5)
        ctx.fillStyle = r.color + '1a';
        ctx.fill()
        ctx.strokeStyle = r.color + '44';
        ctx.lineWidth = 1;
        ctx.stroke()
        ctx.fillStyle = r.color;
        ctx.textAlign = 'left'
        ctx.fillText(r.icon + ' ' + r.label, rankX + 8, RP.y + 28);
        ctx.restore()
    }

    let curY = RP.y + 60
    const COLS = 3
    const PILL_H = 30
    const PILL_GAP_X = 8
    const PILL_GAP_Y = 6
    const pillW = (RP.w - 32 - PILL_GAP_X * (COLS - 1)) / COLS
    const leftX = RP.x + 16

    const drawSection = (label, color, items) => {
        if (!items.length) return
        sectionHeader(ctx, leftX, curY, RP.w - 32, label, color)
        curY += 26
        items.forEach((item, i) => {
            const col = i % COLS
            const row = Math.floor(i / COLS)
            const px = leftX + col * (pillW + PILL_GAP_X)
            const py = curY + row * (PILL_H + PILL_GAP_Y)
            drawItemPill(ctx, px, py, pillW, PILL_H,
                item.icon, item.name, item.value,
                color, C.dim, C.border
            )
        })
        curY += Math.ceil(items.length / COLS) * (PILL_H + PILL_GAP_Y) + 14
    }

    if (data.tools.length) {
        sectionHeader(ctx, leftX, curY, RP.w - 32, '🛠  EQUIPMENT', C.gold)
        curY += 26
        const tCOLS = 2
        const tPillW = (RP.w - 32 - PILL_GAP_X) / tCOLS
        data.tools.forEach((item, i) => {
            const col = i % tCOLS
            const row = Math.floor(i / tCOLS)
            const px = leftX + col * (tPillW + PILL_GAP_X)
            const py = curY + row * (PILL_H + PILL_GAP_Y)
            drawItemPill(ctx, px, py, tPillW, PILL_H,
                item.icon, item.name, item.value,
                C.gold, C.dim, C.border
            )
        })
        curY += Math.ceil(data.tools.length / tCOLS) * (PILL_H + PILL_GAP_Y) + 14
    }

    if (data.dura.length) {
        sectionHeader(ctx, leftX, curY, RP.w - 32, '🔩  DURABILITY', '#f97316')
        curY += 26
        data.dura.forEach((item, i) => {
            const col = i % COLS
            const row = Math.floor(i / COLS)
            const px = leftX + col * (pillW + PILL_GAP_X)
            const py = curY + row * (PILL_H + PILL_GAP_Y)

            ctx.save()
            rr(ctx, px, py, pillW, PILL_H, 7)
            ctx.fillStyle = C.dim;
            ctx.fill()
            ctx.strokeStyle = C.border;
            ctx.lineWidth = 1;
            ctx.stroke()
            ctx.restore()
            const pct = Math.min(item.raw / 100, 1)
            if (pct > 0) {
                const barW = (pillW - 16) * pct
                ctx.save()
                rr(ctx, px + 8, py + PILL_H - 7, barW, 4, 2)
                const durColor = pct > 0.6 ? '#10b981' : pct > 0.3 ? '#f59e0b' : '#ef4444'
                ctx.fillStyle = durColor;
                ctx.fill();
                ctx.restore()
            }
            ctx.font = '13px NotoEmoji';
            ctx.fillStyle = '#f97316';
            ctx.textAlign = 'left'
            ctx.fillText(item.icon, px + 7, py + 20)
            ctx.font = '11px SFMed';
            ctx.fillStyle = C.sub;
            ctx.textAlign = 'left'
            ctx.fillText(item.name, px + 26, py + 19)
            ctx.save()
            ctx.font = 'bold 11px SFBold';
            ctx.fillStyle = '#f97316'
            ctx.textAlign = 'right';
            ctx.fillText(item.value, px + pillW - 8, py + 19);
            ctx.restore()
        })
        curY += Math.ceil(data.dura.length / COLS) * (PILL_H + PILL_GAP_Y) + 14
    }

    drawSection('📦  CRATES', '#a855f7', data.crates)

    if (data.pets.length) {
        sectionHeader(ctx, leftX, curY, RP.w - 32, '🐾  PETS', '#ec4899')
        curY += 26
        data.pets.forEach((item, i) => {
            const col = i % COLS
            const row = Math.floor(i / COLS)
            const px = leftX + col * (pillW + PILL_GAP_X)
            const py = curY + row * (PILL_H + PILL_GAP_Y)
            const isMax = item.isMax
            drawItemPill(ctx, px, py, pillW, PILL_H,
                item.icon, item.name, isMax ? 'MAX ★' : `Lv.${item.raw}`,
                isMax ? '#f59e0b' : '#ec4899', C.dim, C.border
            )
        })
        curY += Math.ceil(data.pets.length / COLS) * (PILL_H + PILL_GAP_Y) + 14
    }

    drawSection('🎒  ITEMS', C.accent, data.items)

    return canvas.toBuffer('image/png')
}

const ITEM_LIST = {
    bibitanggur: '🌱',
    bibitmangga: '🌱',
    bibitpisang: '🌱',
    bibitapel: '🌱',
    bibitjeruk: '🌱',
    anggur: '🍇',
    mangga: '🥭',
    pisang: '🍌',
    apel: '🍎',
    jeruk: '🍊',
    potion: '🧪',
    trash: '🗑️',
    wood: '🪵',
    rock: '🪨',
    string: '🧵',
    emerald: '💚',
    diamond: '💎',
    gold: '🟡',
    iron: '⚙️',
    umpan: '🪱',
    upgrader: '🔧',
    pet: '🐾',
    petfood: '🐟',
    steak: '🥩',
    ayam_goreng: '🍗',
    ribs: '🍖',
    roti: '🍞',
    udang_goreng: '🍤',
    bacon: '🥓',
    gandum: '🌾',
    minyak: '🫙',
    garam: '🧂',
}

const CRATE_LIST = {
    common: '⬜',
    uncommon: '🟩',
    mythic: '🟪',
    legendary: '🟨'
}
const PET_LIST = {
    horse: '🐴',
    cat: '🐱',
    fox: '🦊',
    dog: '🐶',
    robo: '🤖'
}
const PET_MAX = {
    horse: 10,
    cat: 10,
    fox: 10,
    dog: 10,
    robo: 10
}
const DURA_LIST = {
    sworddurability: '⚔️',
    pickaxedurability: '⛏️',
    fishingroddurability: '🎣',
    armordurability: '🛡️',
}

const cooldownDef = {
    lastclaim: {
        name: 'Daily',
        time: 79200000
    },
    lastweekly: {
        name: 'Weekly',
        time: 604800000
    },
    lastmonthly: {
        name: 'Monthly',
        time: 2592000000
    },
    lastadventure: {
        name: 'Adventure',
        time: 300000
    },
}

let handler = async (m, {
    conn
}) => {
    const who = m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender)
    const user = global.db.data.users[who]
    if (!user) return m.reply('User tidak ditemukan di database.')

    const allUsers = global.db.data.users
    const sorted = (key) => Object.entries(allUsers).sort((a, b) => b[1][key] - a[1][key]).map(v => v[0])

    const isOwner = m.fromMe || (global.owner || [])
        .map(v => (Array.isArray(v) ? v[0] : v).replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        .includes(who)
    const isPrem = isOwner || new Date() - user.premiumTime < 0

    const cooldowns = Object.entries(cooldownDef).map(([cd, {
        name,
        time
    }]) => {
        const elapsed = new Date() - user[cd]
        const ready = elapsed >= time
        return {
            name,
            ready,
            remaining: clockString(time - elapsed)
        }
    })

    const tools = Object.keys(TOOLS_NAME)
        .filter(k => user[k] > 0)
        .map(k => ({
            icon: ITEM_EMOJI[k] || '🔧',
            name: (TOOLS_NAME[k][user[k]] || k) + ` (Lv.${user[k]})`,
            value: `${user[k + 'durability'] || 0} dur`,
        }))

    const dura = Object.entries(DURA_LIST)
        .filter(([k]) => user[k] > 0)
        .map(([k, icon]) => ({
            icon,
            raw: user[k],
            name: k.replace('durability', '').replace('fishing', 'fish'),
            value: toNum(user[k]),
        }))

    const items = Object.entries(ITEM_LIST)
        .filter(([k]) => user[k] > 0)
        .map(([k, icon]) => ({
            icon,
            name: k,
            value: toNum(user[k])
        }))

    const crates = Object.entries(CRATE_LIST)
        .filter(([k]) => user[k] > 0)
        .map(([k, icon]) => ({
            icon,
            name: k,
            value: toNum(user[k])
        }))

    const pets = Object.entries(PET_LIST)
        .filter(([k]) => user[k] > 0)
        .map(([k, icon]) => ({
            icon,
            raw: user[k],
            name: k,
            isMax: user[k] >= PET_MAX[k],
        }))

    const avatarURL = await conn.profilePictureUrl(who, 'image').catch(() => 'src/avatar_contact.png')

    const img = await generateInventoryCard(avatarURL, {
        name: user.registered ? user.name : (conn.getName(who) || 'User'),
        level: user.level || 0,
        isPrem,
        exp: user.exp || 0,
        health: user.health || 100,
        money: user.money || 0,
        bank: user.bank || 0,
        chip: user.chip || 0,
        limit: user.limit || 50,
        lastdungeon: user.lastdungeon || 0,
        lastmining: user.lastmining || 0,
        cooldowns,
        tools,
        dura,
        items,
        crates,
        pets,
        rankChip: sorted('chip').indexOf(who) + 1,
        rankMoney: sorted('money').indexOf(who) + 1,
        rankBank: sorted('bank').indexOf(who) + 1,
        rankLevel: sorted('level').indexOf(who) + 1,
        rankDiamond: sorted('diamond').indexOf(who) + 1,
    })

    await conn.sendFile(m.chat, img, 'inventory.png', '', m)
}

handler.help = ['inventory']
handler.tags = ['rpg']
handler.command = /^(inv(entory)?|bal(ance)?|money|e?xp)$/i
handler.register = true
handler.group = true
handler.rpg = true

export default handler