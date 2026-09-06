import moment from 'moment-timezone'
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
        headers: {
            "User-Agent": "Canvas-TikTok"
        }
    })
    GlobalFonts.register(Buffer.from(res.data), name)
}

async function safeLoadImage(url) {
    try {
        const res = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
                "User-Agent": "Canvas-TikTok"
            }
        })
        return await loadImage(Buffer.from(res.data))
    } catch {
        const c = createCanvas(100, 100)
        const g = c.getContext("2d")
        const grad = g.createRadialGradient(50, 50, 0, 50, 50, 50)
        grad.addColorStop(0, '#2d2d2d');
        grad.addColorStop(1, '#111111')
        g.fillStyle = grad
        g.beginPath();
        g.arc(50, 50, 50, 0, Math.PI * 2);
        g.fill()
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

function formatNum(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K'
    return n.toString()
}

function formatRupiah(n) {
    return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

async function generateCreatedCard(avatarURL, data) {
    await Promise.all([
        registerFont("RobotoBlack", "Roboto-Black.ttf"),
        registerFont("RobotoBold", "Roboto-Bold.ttf"),
        registerFont("Roboto", "Roboto-Regular.ttf"),
        registerFont("RobotoLight", "Roboto-Light.ttf"),
        registerFont("Montserrat", "Montserrat-Bold.ttf"),
    ])

    const W = 720,
        H = 420
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext("2d")

    const TT_RED = '#ff0050'
    const TT_CYAN = '#00f2ea'

    // Background
    ctx.fillStyle = '#010101'
    ctx.fillRect(0, 0, W, H)

    const blobs = [{
            x: 0,
            y: 0,
            r: 300,
            c: '#ff005018'
        },
        {
            x: W,
            y: 0,
            r: 280,
            c: '#00f2ea14'
        },
        {
            x: W / 2,
            y: H,
            r: 260,
            c: '#ff005010'
        },
        {
            x: W * 0.8,
            y: H * 0.3,
            r: 200,
            c: '#00f2ea0d'
        },
    ]
    for (const b of blobs) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0, b.c);
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H)
    }

    ctx.save()
    for (let i = 0; i < 55; i++) {
        ctx.globalAlpha = Math.random() * 0.4 + 0.1
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.1, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.restore()

    // Outer card
    const M = 16
    ctx.save()
    rr(ctx, M, M, W - M * 2, H - M * 2, 28)
    ctx.fillStyle = 'rgba(255,255,255,0.025)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1;
    ctx.stroke()
    ctx.restore()

    // Top shimmer
    ctx.save()
    const sh = ctx.createLinearGradient(M + 60, M, W - M - 60, M)
    sh.addColorStop(0, 'transparent');
    sh.addColorStop(0.2, TT_RED + 'cc')
    sh.addColorStop(0.5, '#ffffff88');
    sh.addColorStop(0.8, TT_CYAN + 'cc')
    sh.addColorStop(1, 'transparent')
    ctx.strokeStyle = sh;
    ctx.lineWidth = 2
    ctx.shadowColor = TT_RED;
    ctx.shadowBlur = 10
    ctx.beginPath();
    ctx.moveTo(M + 60, M + 1);
    ctx.lineTo(W - M - 60, M + 1);
    ctx.stroke()
    ctx.restore()

    // Header
    const hH = 56
    ctx.save()
    rr(ctx, M, M, W - M * 2, hH, 28)
    const hg = ctx.createLinearGradient(M, M, W - M, M + hH)
    hg.addColorStop(0, '#ff005020');
    hg.addColorStop(1, '#00f2ea10')
    ctx.fillStyle = hg;
    ctx.fill()
    ctx.restore()

    // Header title with TikTok chromatic effect
    ctx.save()
    ctx.shadowColor = TT_RED;
    ctx.shadowBlur = 14
    ctx.font = 'bold 20px Montserrat'
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'
    ctx.fillText('TikTok  PROFILE CREATED ✓', W / 2, M + 36)
    ctx.restore()

    // Success badge
    const badgeW = 180,
        badgeH = 28
    const badgeX = W / 2 - badgeW / 2,
        badgeY = M + hH + 8
    ctx.save()
    rr(ctx, badgeX, badgeY, badgeW, badgeH, 14)
    ctx.fillStyle = '#00f2ea22';
    ctx.fill()
    ctx.strokeStyle = TT_CYAN + '88';
    ctx.lineWidth = 1;
    ctx.stroke()
    ctx.restore()
    ctx.font = 'bold 12px RobotoBold'
    ctx.fillStyle = TT_CYAN;
    ctx.textAlign = 'center'
    ctx.fillText('✦  Profil Berhasil Dibuat  ✦', W / 2, badgeY + 18)

    // Avatar
    const avR = 60
    const avCX = M + 32 + avR
    const avCY = M + hH + badgeH + 28 + avR + 10

    for (const [offX, offY, col] of [
            [2, 2, TT_RED],
            [-2, -2, TT_CYAN]
        ]) {
        ctx.save()
        ctx.globalAlpha = 0.5
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5
        ctx.shadowColor = col;
        ctx.shadowBlur = 12
        ctx.beginPath();
        ctx.arc(avCX + offX, avCY + offY, avR + 2, 0, Math.PI * 2);
        ctx.stroke()
        ctx.restore()
    }

    for (let ring = 3; ring >= 1; ring--) {
        ctx.save()
        ctx.globalAlpha = 0.06 * (4 - ring)
        const rg = ctx.createRadialGradient(avCX, avCY, avR, avCX, avCY, avR + ring * 8)
        rg.addColorStop(0, TT_RED);
        rg.addColorStop(1, 'transparent')
        ctx.fillStyle = rg
        ctx.beginPath();
        ctx.arc(avCX, avCY, avR + ring * 8, 0, Math.PI * 2);
        ctx.fill()
        ctx.restore()
    }

    const av = await safeLoadImage(avatarURL)
    ctx.save()
    ctx.beginPath();
    ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
    ctx.clip()
    ctx.drawImage(av, avCX - avR, avCY - avR, avR * 2, avR * 2)
    ctx.restore()
    ctx.save()
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5
    ctx.beginPath();
    ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
    ctx.stroke()
    ctx.restore()

    // User info
    const iX = avCX + avR + 20
    const iY = avCY - avR - 10

    ctx.save()
    ctx.font = 'bold 28px RobotoBlack'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffffff33';
    ctx.shadowBlur = 6
    ctx.textAlign = 'left'
    ctx.fillText('@' + data.username, iX, iY + 36)
    ctx.restore()

    ctx.font = '13px Roboto'
    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'left'
    ctx.fillText('🎂  ' + data.birthdate, iX, iY + 60)

    ctx.font = '12px RobotoLight'
    ctx.fillStyle = '#475569'
    ctx.fillText('Akun TikTok siap digunakan!', iX, iY + 80)

    // Stats
    const stats = [{
            label: 'Followers',
            value: formatNum(data.follower),
            color: TT_RED
        },
        {
            label: 'Konten',
            value: formatNum(data.konten),
            color: TT_CYAN
        },
        {
            label: 'Penghasilan',
            value: formatRupiah(data.money),
            color: '#fbbf24'
        },
    ]

    const sY = iY + 98
    const sW = (W - iX - M - 16) / 3
    stats.forEach((s, i) => {
        const sx = iX + i * (sW + 8)
        ctx.save()
        rr(ctx, sx, sY, sW, 64, 14)
        const sg = ctx.createLinearGradient(sx, sY, sx + sW, sY + 64)
        sg.addColorStop(0, s.color + '18');
        sg.addColorStop(1, s.color + '08')
        ctx.fillStyle = sg;
        ctx.fill()
        ctx.strokeStyle = s.color + '44';
        ctx.lineWidth = 1;
        ctx.stroke()
        ctx.restore()

        ctx.save()
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8
        ctx.font = 'bold 18px RobotoBlack'
        ctx.fillStyle = s.color;
        ctx.textAlign = 'center'
        ctx.fillText(s.value, sx + sW / 2, sY + 28)
        ctx.restore()

        ctx.font = '11px RobotoLight'
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center'
        ctx.fillText(s.label.toUpperCase(), sx + sW / 2, sY + 48)
    })

    // Vertical divider
    const vdX = avCX + avR + 14
    ctx.save()
    const vdg = ctx.createLinearGradient(vdX, M + hH + 10, vdX, H - M - 10)
    vdg.addColorStop(0, 'transparent')
    vdg.addColorStop(0.3, TT_RED + '44');
    vdg.addColorStop(0.7, TT_CYAN + '44')
    vdg.addColorStop(1, 'transparent')
    ctx.strokeStyle = vdg;
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(vdX, M + hH + 10);
    ctx.lineTo(vdX, H - M - 10);
    ctx.stroke()
    ctx.restore()

    // Left bottom hint
    const motY = avCY + avR + 18
    ctx.font = '11px RobotoLight'
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center'
    ctx.fillText('Ketik .profiletiktok', avCX, motY + 14)
    ctx.fillText('untuk lihat profil', avCX, motY + 28)

    // Bottom bar
    const bbY = H - M - 32
    ctx.save()
    rr(ctx, M, bbY, W - M * 2, 32, 28)
    const bbg = ctx.createLinearGradient(M, bbY, W - M, bbY + 32)
    bbg.addColorStop(0, '#ff005010');
    bbg.addColorStop(1, '#00f2ea08')
    ctx.fillStyle = bbg;
    ctx.fill()
    ctx.restore()
    ctx.font = '11px RobotoLight'
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center'
    ctx.fillText('TikTok RPG  ·  Keep Creating', W / 2, bbY + 20)

    // Corner brackets
    const corners = [
        [M + 10, M + 10, 1, 1],
        [W - M - 10, M + 10, -1, 1],
        [M + 10, H - M - 10, 1, -1],
        [W - M - 10, H - M - 10, -1, -1]
    ]
    ctx.save()
    ctx.strokeStyle = TT_RED + '44';
    ctx.lineWidth = 2
    for (const [cx, cy, dx, dy] of corners) {
        ctx.beginPath()
        ctx.moveTo(cx + dx * 14, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * 14)
        ctx.stroke()
    }
    ctx.restore()

    return canvas.toBuffer("image/png")
}

async function awaitReply(conn, jid, sender, timeout = 120000) {
    const normJid = j => (j || '').replace(/:[0-9]+@/, '@').split('@')[0]
    const senderNum = normJid(sender)

    return new Promise((resolve, reject) => {
        const listener = async ({
            messages
        }) => {
            const msg = messages[0]
            if (!msg || msg.key.remoteJid !== jid) return
            const from = msg.key.participant || msg.key.remoteJid
            if (normJid(from) === senderNum && !msg.key.fromMe) {
                conn.ev.off('messages.upsert', listener)
                resolve(msg)
            }
        }
        conn.ev.on('messages.upsert', listener)
        setTimeout(() => {
            conn.ev.off('messages.upsert', listener)
            reject(new Error('⏱️ Waktu input habis! Ketik *.createtiktok* lagi untuk mencoba ulang.'))
        }, timeout)
    })
}

let handler = async (m, {
    conn
}) => {
    const user = global.db.data.users[m.sender]
    const who = m.sender

    if (user.tiktok?.username) return m.reply('Kamu sudah memiliki profil TikTok!\nCek dengan perintah *.profiletiktok*')
    if (!user.tiktok) user.tiktok = {}

    const defaultName = user.registered ? user.name : conn.getName(who)

    await m.reply(`📱 Membuat profil TikTok...\n👤 Username: *${defaultName}*\n\n📅 Balas dengan tanggal lahir *(DD/MM/YYYY)*\nContoh: 01/01/2000\n\n⏳ Timeout: 2 menit`)

    try {
        const birthdateMsg = await awaitReply(conn, m.chat, who, 120000)
        const text = birthdateMsg?.message?.conversation ||
            birthdateMsg?.message?.extendedTextMessage?.text || ''

        if (!moment(text, 'DD/MM/YYYY', true).isValid())
            return m.reply('❌ Format tanggal salah! Gunakan format *DD/MM/YYYY*')

        user.tiktok = {
            username: defaultName,
            birthdate: text,
            konten: user.konten || 0,
            follower: user.follower || 0,
            lastupload: user.lasttiktokkonten || 0
        }

        global.db.save()

        const avatarURL = await conn.profilePictureUrl(who, 'image')
            .catch(() => 'src/avatar_contact.png')

        const img = await generateCreatedCard(avatarURL, {
            username: user.tiktok.username,
            birthdate: user.tiktok.birthdate,
            follower: user.follower || 0,
            konten: user.konten || 0,
            money: user.money || 0,
        })

        await conn.sendFile(m.chat, img, 'createtiktok.png',
            '✅ Profil TikTok berhasil dibuat!\n📌 Gunakan *.uploadtiktok* untuk membuat konten', m)

    } catch (err) {
        console.error('❌ Error createTikTok:', err)
        await m.reply(`❌ ${err.message}`)
    }
}

handler.command = /^createtiktok$/i
handler.help = ['createtiktok']
handler.tags = ['rpg']
handler.register = true
handler.group = true
handler.rpg = true

export default handler