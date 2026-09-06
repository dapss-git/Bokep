import {
    canLevelUp,
    xpRange
} from '../../library/levelling.js'
import moment from 'moment-timezone'
import fs from "fs"
import axios from "axios"
import {
    createCanvas,
    loadImage,
    GlobalFonts
} from "@napi-rs/canvas"

const BASE = "https://raw.githubusercontent.com/Blckrose2/font2/main/"
const defaultAvatar = 'src/avatar_contact.png'

async function registerFont(name, file) {
    const res = await axios.get(BASE + encodeURIComponent(file), {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
            "User-Agent": "Canvas-LevelUp"
        }
    })
    GlobalFonts.register(Buffer.from(res.data), name)
}

async function safeLoadImage(url) {
    try {
        if (Buffer.isBuffer(url)) return await loadImage(url)
        const res = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
                "User-Agent": "Canvas-LevelUp"
            }
        })
        return await loadImage(Buffer.from(res.data))
    } catch {
        const c = createCanvas(100, 100)
        const x = c.getContext("2d")
        const g = x.createRadialGradient(50, 50, 0, 50, 50, 50)
        g.addColorStop(0, '#1e293b');
        g.addColorStop(1, '#0f172a')
        x.fillStyle = g;
        x.beginPath();
        x.arc(50, 50, 50, 0, Math.PI * 2);
        x.fill()
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

const THEMES = [{
        a: '#6366f1',
        b: '#8b5cf6',
        c: '#a5b4fc',
        bg1: '#0a0716',
        bg2: '#0f0a1e',
        bg3: '#07041a'
    },
    {
        a: '#0ea5e9',
        b: '#6366f1',
        c: '#38bdf8',
        bg1: '#04111e',
        bg2: '#060d1a',
        bg3: '#020910'
    },
    {
        a: '#10b981',
        b: '#06b6d4',
        c: '#34d399',
        bg1: '#041410',
        bg2: '#061a14',
        bg3: '#030d0a'
    },
    {
        a: '#f59e0b',
        b: '#ef4444',
        c: '#fbbf24',
        bg1: '#190d04',
        bg2: '#1a1004',
        bg3: '#100802'
    },
    {
        a: '#ec4899',
        b: '#8b5cf6',
        c: '#f472b6',
        bg1: '#180412',
        bg2: '#1a0516',
        bg3: '#10030d'
    },
]

async function generateLevelUpImage(avatarURL, fromLevel, toLevel, name) {
    await Promise.all([
        registerFont("RobotoBlack", "Roboto-Black.ttf"),
        registerFont("Roboto", "Roboto-Regular.ttf"),
        registerFont("Montserrat", "Montserrat-Bold.ttf"),
    ])

    const W = 680,
        H = 200
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext("2d")
    const T = THEMES[Math.floor(Math.random() * THEMES.length)]

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, T.bg1);
    bg.addColorStop(0.5, T.bg2);
    bg.addColorStop(1, T.bg3)
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H)

    // Blobs
    for (const b of [{
            x: 0,
            y: 0,
            r: 220,
            c: T.a + '1a'
        }, {
            x: W,
            y: H,
            r: 200,
            c: T.b + '14'
        }, {
            x: W / 2,
            y: H / 2,
            r: 150,
            c: T.c + '0d'
        }]) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0, b.c);
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H)
    }

    // Stars
    ctx.save()
    for (let i = 0; i < 50; i++) {
        ctx.globalAlpha = Math.random() * 0.5 + 0.1
        ctx.fillStyle = '#fff'
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fill()
    }
    ctx.restore()

    // Glass card
    const M = 10
    ctx.save()
    rr(ctx, M, M, W - M * 2, H - M * 2, 24)
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke()
    ctx.restore()

    // Top shimmer
    ctx.save()
    const sh = ctx.createLinearGradient(M + 60, M, W - M - 60, M)
    sh.addColorStop(0, 'transparent');
    sh.addColorStop(0.3, T.a + 'cc')
    sh.addColorStop(0.5, T.c + 'ff');
    sh.addColorStop(0.7, T.b + 'cc');
    sh.addColorStop(1, 'transparent')
    ctx.strokeStyle = sh;
    ctx.lineWidth = 2;
    ctx.shadowColor = T.c;
    ctx.shadowBlur = 8
    ctx.beginPath();
    ctx.moveTo(M + 60, M + 1);
    ctx.lineTo(W - M - 60, M + 1);
    ctx.stroke()
    ctx.restore()

    // Avatar
    const avR = 72,
        avCX = M + 20 + avR,
        avCY = H / 2
    for (let ring = 3; ring >= 1; ring--) {
        ctx.save();
        ctx.globalAlpha = 0.07 * (4 - ring)
        const rg = ctx.createRadialGradient(avCX, avCY, avR, avCX, avCY, avR + ring * 8)
        rg.addColorStop(0, T.a);
        rg.addColorStop(1, 'transparent')
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(avCX, avCY, avR + ring * 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore()
    }

    const av = await safeLoadImage(avatarURL)
    ctx.save();
    ctx.beginPath();
    ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
    ctx.clip()
    ctx.drawImage(av, avCX - avR, avCY - avR, avR * 2, avR * 2);
    ctx.restore()

    ctx.save();
    ctx.shadowColor = T.a;
    ctx.shadowBlur = 14
    const avb = ctx.createLinearGradient(avCX - avR, avCY - avR, avCX + avR, avCY + avR)
    avb.addColorStop(0, T.a);
    avb.addColorStop(0.5, T.c);
    avb.addColorStop(1, T.b)
    ctx.strokeStyle = avb;
    ctx.lineWidth = 3
    ctx.beginPath();
    ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore()

    // Name
    const nameX = avCX + avR + 22
    ctx.save();
    ctx.font = 'bold 26px RobotoBlack';
    ctx.fillStyle = '#f8fafc'
    ctx.shadowColor = T.a;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'left'
    ctx.fillText(name, nameX, H / 2 - 14);
    ctx.restore()
    ctx.font = '12px Roboto';
    ctx.fillStyle = T.c;
    ctx.textAlign = 'left'
    ctx.fillText('✦  LEVEL UP!', nameX, H / 2 + 8)

    // Level circles
    const cR = 36,
        rightPad = M + 24
    const c2X = W - rightPad - cR,
        c1X = c2X - cR * 3 - 24,
        cY = H / 2

    const drawLevelCircle = (cx, cy, lvl, isNew) => {
        ctx.save();
        ctx.shadowColor = isNew ? T.a : 'rgba(255,255,255,0.2)';
        ctx.shadowBlur = isNew ? 18 : 6
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cR)
        cg.addColorStop(0, isNew ? T.a + '44' : 'rgba(255,255,255,0.08)');
        cg.addColorStop(1, 'transparent')
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, cR + 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore()

        ctx.save();
        rr(ctx, cx - cR, cy - cR, cR * 2, cR * 2, cR)
        const bg2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, cR)
        if (isNew) {
            bg2.addColorStop(0, T.a + '55');
            bg2.addColorStop(1, T.b + '22')
        } else {
            bg2.addColorStop(0, 'rgba(255,255,255,0.1)');
            bg2.addColorStop(1, 'rgba(255,255,255,0.03)')
        }
        ctx.fillStyle = bg2;
        ctx.fill()
        const cb = ctx.createLinearGradient(cx - cR, cy - cR, cx + cR, cy + cR)
        cb.addColorStop(0, isNew ? T.a : 'rgba(255,255,255,0.2)');
        cb.addColorStop(1, isNew ? T.b : 'rgba(255,255,255,0.08)')
        ctx.strokeStyle = cb;
        ctx.lineWidth = isNew ? 2.5 : 1.5;
        ctx.stroke();
        ctx.restore()

        ctx.save();
        ctx.shadowColor = isNew ? T.c : 'transparent';
        ctx.shadowBlur = isNew ? 10 : 0
        ctx.font = `bold ${isNew ? 26 : 22}px RobotoBlack`
        ctx.fillStyle = isNew ? '#ffffff' : '#94a3b8';
        ctx.textAlign = 'center'
        ctx.fillText(lvl, cx, cy + (isNew ? 9 : 8));
        ctx.restore()
        ctx.font = '9px Roboto';
        ctx.fillStyle = isNew ? T.c : '#475569'
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL', cx, cy + cR + 14)
    }

    drawLevelCircle(c1X, cY, fromLevel, false)
    drawLevelCircle(c2X, cY, toLevel, true)

    // Arrow
    const arrowMidX = (c1X + c2X) / 2
    ctx.save();
    ctx.shadowColor = T.a;
    ctx.shadowBlur = 8
    const ag = ctx.createLinearGradient(arrowMidX - 14, cY, arrowMidX + 14, cY)
    ag.addColorStop(0, T.a + 'aa');
    ag.addColorStop(1, T.c)
    ctx.fillStyle = ag;
    ctx.beginPath()
    ctx.moveTo(arrowMidX - 12, cY - 7);
    ctx.lineTo(arrowMidX + 14, cY);
    ctx.lineTo(arrowMidX - 12, cY + 7)
    ctx.closePath();
    ctx.fill();
    ctx.restore()

    // Corner brackets
    ctx.save();
    ctx.strokeStyle = T.a + '55';
    ctx.lineWidth = 2
    for (const [cx, cy, dx, dy] of [
            [M + 10, M + 10, 1, 1],
            [W - M - 10, M + 10, -1, 1],
            [M + 10, H - M - 10, 1, -1],
            [W - M - 10, H - M - 10, -1, -1]
        ]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx * 14, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * 14);
        ctx.stroke()
    }
    ctx.restore()

    return canvas.toBuffer("image/png")
}

async function before(m, {
    conn
}) {
    let user = global.db.data.users
    let chat = global.db.data.chats[m.chat]
    let setting = global.db.data.settings[conn.user?.jid] || {}
    if (m.isBaileys || m.fromMe) return
    if (!chat || !user[m.sender]) return
    if (chat.mute || chat.isBanned || user[m.sender].banned) return
    const txt = m.text || ''
    if (txt.startsWith('=>') || txt.startsWith('>') || txt.startsWith('.') || txt.startsWith('#') || txt.startsWith('!') || txt.startsWith('/') || txt.startsWith('\/')) return
    if (chat.autolevelup || user[m.sender].autolevelup) {
        if (canLevelUp(user[m.sender].level, user[m.sender].exp, 38)) {
            if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat).catch(() => {})
            if (setting.autoread) await conn.readMessages([m.key]).catch(() => {})

            let before = user[m.sender].level * 1
            while (canLevelUp(user[m.sender].level, user[m.sender].exp, 38)) user[m.sender].level++

            if (before !== user[m.sender].level) {
                let str = `
*🎉 C O N G R A T S 🎉*
*${before}* ➔ *${user[m.sender].level}* [ *${user[m.sender].role}* ]

*Note:* _Semakin sering berinteraksi dengan bot Semakin Tinggi level kamu_
`.trim()
                const pp = await conn.profilePictureUrl(m.sender, 'image').catch(_ => 'src/avatar_contact.png')
                const name = user[m.sender].registered ? user[m.sender].name : conn.getName(m.sender)
                try {
                    const img = await generateLevelUpImage(pp, before, user[m.sender].level, name)
                    await conn.sendFile(m.chat, img, 'levelup.png', str, m)
                } catch (e) {
                    await conn.sendMessage(m.chat, {
                        text: str
                    }, {
                        quoted: m
                    })
                }
            }
        }
        return !0
    }
    return !0
}

const handler = {}
handler.before = before

export default handler