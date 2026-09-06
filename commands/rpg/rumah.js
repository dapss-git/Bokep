import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas'
import moment from 'moment-timezone'

const _fc = new Set()
const _fb = 'https://raw.githubusercontent.com/Blckrose2/font2/main/'
async function lf(file, alias) {
    if (_fc.has(alias)) return
    const r = await fetch(_fb + encodeURIComponent(file))
    if (!r.ok) throw new Error('Font: ' + file)
    GlobalFonts.register(Buffer.from(await r.arrayBuffer()), alias)
    _fc.add(alias)
}

async function safeLoadImage(url) {
    try {
        const r = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        })
        if (!r.ok) throw new Error('img')
        return await loadImage(Buffer.from(await r.arrayBuffer()))
    } catch {
        const c = createCanvas(100, 100)
        const g = c.getContext('2d')
        g.fillStyle = '#e8d5c4'
        g.beginPath();
        g.arc(50, 50, 50, 0, Math.PI * 2);
        g.fill()
        return await loadImage(c.toBuffer('image/png'))
    }
}

function getRumahImage(item, imgW, imgH) {
    const kondisi = item.kondisi || 'Baru'
    const kamar = item.jumlahKamar || 2
    const harga = item.harga || 0

    // Warna tema berdasarkan kondisi & harga
    const palettes = kondisi === 'Baru' ?
        [{
                sky: ['#87CEEB', '#B0E0E6'],
                wall: '#F5F0E8',
                roof: '#8B4513',
                trim: '#D2691E'
            },
            {
                sky: ['#98D8C8', '#B5EAD7'],
                wall: '#FFF8F0',
                roof: '#556B2F',
                trim: '#6B8E23'
            },
            {
                sky: ['#DDA0DD', '#E6C3E6'],
                wall: '#F8F0FF',
                roof: '#6A0DAD',
                trim: '#9370DB'
            },
        ] :
        [{
                sky: ['#F4A460', '#DEB887'],
                wall: '#E8DCC8',
                roof: '#5C3317',
                trim: '#8B6914'
            },
            {
                sky: ['#B0C4DE', '#C8D8E8'],
                wall: '#EDE8DC',
                roof: '#4A4A4A',
                trim: '#696969'
            },
        ]
    const seed = item.id ? item.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0
    const pal = palettes[seed % palettes.length]

    const c = createCanvas(imgW, imgH)
    const g = c.getContext('2d')

    // Sky gradient
    const skyG = g.createLinearGradient(0, 0, 0, imgH * 0.55)
    skyG.addColorStop(0, pal.sky[0]);
    skyG.addColorStop(1, pal.sky[1])
    g.fillStyle = skyG;
    g.fillRect(0, 0, imgW, imgH)

    // Ground
    const groundG = g.createLinearGradient(0, imgH * 0.72, 0, imgH)
    groundG.addColorStop(0, '#7CBA6D');
    groundG.addColorStop(1, '#5A9E4A')
    g.fillStyle = groundG;
    g.fillRect(0, imgH * 0.72, imgW, imgH * 0.28)

    // Clouds
    g.fillStyle = 'rgba(255,255,255,0.75)'
    const cx1 = 20 + (seed % 40);
    [
        [cx1, 18, 22],
        [cx1 + 28, 14, 16],
        [cx1 + 14, 12, 18],
        [imgW - 60 + (seed % 20), 22, 18],
        [imgW - 42 + (seed % 10), 16, 14]
    ].forEach(([x, y, r]) => {
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill()
    })

    // House body
    const hx = imgW * 0.15,
        hy = imgH * 0.32
    const hw = imgW * 0.55,
        hh = imgH * 0.40
    g.fillStyle = pal.wall
    g.shadowColor = 'rgba(0,0,0,0.2)';
    g.shadowBlur = 8;
    g.shadowOffsetX = 4
    g.fillRect(hx, hy, hw, hh)
    g.shadowBlur = 0;
    g.shadowOffsetX = 0

    // Roof (triangle)
    g.fillStyle = pal.roof
    g.beginPath()
    g.moveTo(hx - 12, hy)
    g.lineTo(hx + hw / 2, hy - imgH * 0.18)
    g.lineTo(hx + hw + 12, hy)
    g.closePath();
    g.fill()

    // Roof trim
    g.fillStyle = pal.trim
    g.fillRect(hx - 12, hy - 5, hw + 24, 7)

    // Door
    const dx = hx + hw / 2 - 12,
        dy = hy + hh * 0.5
    const dw = 24,
        dh = hh * 0.50
    g.fillStyle = pal.trim
    g.fillRect(dx, dy, dw, dh)
    g.beginPath();
    g.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0);
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.3)'
    g.fillRect(dx + 4, dy + 6, 6, 8);
    g.fillRect(dx + 14, dy + 6, 6, 8)

    // Windows (jumlah sesuai kamar)
    const winCount = Math.min(kamar, 3)
    const winSpacing = hw / (winCount + 1)
    for (let i = 0; i < winCount; i++) {
        const wx = hx + winSpacing * (i + 1) - 14
        const wy = hy + hh * 0.15
        g.fillStyle = '#87CEEB'
        g.fillRect(wx, wy, 28, 22)
        g.strokeStyle = pal.trim;
        g.lineWidth = 2
        g.strokeRect(wx, wy, 28, 22)
        g.strokeStyle = 'rgba(255,255,255,0.6)';
        g.lineWidth = 1
        g.beginPath();
        g.moveTo(wx + 14, wy);
        g.lineTo(wx + 14, wy + 22);
        g.stroke()
        g.beginPath();
        g.moveTo(wx, wy + 11);
        g.lineTo(wx + 28, wy + 11);
        g.stroke()
    }

    // Tree (kanan)
    const tx = hx + hw + 22,
        ty = imgH * 0.45
    g.fillStyle = '#5C3317';
    g.fillRect(tx + 6, ty, 8, imgH * 0.27)
    g.fillStyle = '#228B22';
    [
        [tx + 10, ty - 8, 20],
        [tx + 10, ty + 4, 17],
        [tx + 10, ty + 14, 14]
    ].forEach(([x, y, r]) => {
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill()
    })

    // Path
    g.fillStyle = '#C8B89A'
    g.beginPath()
    g.moveTo(dx + 4, hy + hh);
    g.lineTo(dx + 20, hy + hh)
    g.lineTo(dx + 26, imgH);
    g.lineTo(dx - 2, imgH)
    g.closePath();
    g.fill()

    // Badge kondisi
    g.fillStyle = kondisi === 'Baru' ? 'rgba(34,139,34,0.85)' : 'rgba(139,90,43,0.85)'
    const bw = kondisi === 'Baru' ? 44 : 52
    g.beginPath();
    g.moveTo(10, 6);
    g.lineTo(6 + bw - 4, 6);
    g.quadraticCurveTo(6 + bw, 6, 6 + bw, 10);
    g.lineTo(6 + bw, 20);
    g.quadraticCurveTo(6 + bw, 24, 6 + bw - 4, 24);
    g.lineTo(10, 24);
    g.quadraticCurveTo(6, 24, 6, 20);
    g.lineTo(6, 10);
    g.quadraticCurveTo(6, 6, 10, 6);
    g.closePath();
    g.fill()
    g.fillStyle = '#fff';
    g.font = 'bold 9px sans-serif';
    g.textAlign = 'left'
    g.fillText(kondisi, 10, 18)

    return loadImage(c.toBuffer('image/png'))
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
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(-r * 0.5, -r * 0.8, -r * 0.3, -r * 1.5, 0, -r * 1.6)
    ctx.bezierCurveTo(r * 0.3, -r * 1.5, r * 0.5, -r * 0.8, 0, 0)
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
}

function sakura(ctx, cx, cy, r, color, alpha = 1) {
    for (let i = 0; i < 5; i++)
        petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = '#fff8f0';
    ctx.fill()
    ctx.restore()
}

function cornerFlourish(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1]
    ].forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath()
        ctx.moveTo(cx + dx * size, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * size)
        ctx.stroke()
    })
}

function diamondRow(ctx, cx, y, count, spacing, size, color) {
    const startX = cx - (count - 1) * spacing / 2
    for (let i = 0; i < count; i++) {
        const dx = startX + i * spacing
        ctx.save();
        ctx.translate(dx, y);
        ctx.rotate(Math.PI / 4)
        rrp(ctx, -size / 2, -size / 2, size, size, 1)
        if (i === Math.floor(count / 2)) {
            ctx.fillStyle = color;
            ctx.fill()
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke()
        }
        ctx.restore()
    }
}

function clamp(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text
    while (ctx.measureText(text + '…').width > maxW && text.length > 0) text = text.slice(0, -1)
    return text + '…'
}

async function generateRumahCanvas({
    avatarURL,
    name,
    userRumah = [],
    botRumah = [],
    isSelf = true
}) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold')
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium')
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular')
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji')

    const COLS = 1
    const M = 18
    const GAP = 10
    const ROWS = Math.ceil(userRumah.length / COLS)
    const CW = 620
    const CH = 130
    const IMG_W = 200
    const W = M * 2 + COLS * CW + (COLS - 1) * GAP + 20
    const HDR = 140
    const FTR = 38
    const H = M * 2 + HDR + ROWS * CH + Math.max(0, ROWS - 1) * GAP + FTR + 16

    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const bgG = ctx.createLinearGradient(0, 0, W, H)
    bgG.addColorStop(0, '#fdf8f0')
    bgG.addColorStop(0.45, '#fef9f2')
    bgG.addColorStop(1, '#faf3e8')
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < 700; i++) {
        ctx.fillStyle = `rgba(180,140,100,${Math.random() * 0.04 + 0.01})`
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fill()
    }

    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75)
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(160,110,60,0.12)')
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H)

    rrp(ctx, M, M, W - M * 2, H - M * 2, 12)
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 1.5;
    ctx.stroke()
    rrp(ctx, M + 5, M + 5, W - M * 2 - 10, H - M * 2 - 10, 9)
    ctx.strokeStyle = 'rgba(201,149,110,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke()
    cornerFlourish(ctx, M + 3, M + 3, W - M * 2 - 6, H - M * 2 - 6, 20, '#c9956e')

    const sp = '#f8a4c0',
        sl = '#fcc8d8',
        sd = '#e87098'
    sakura(ctx, 44, 44, 26, sl, 0.18)
    sakura(ctx, W - 46, 38, 20, sp, 0.14)
    sakura(ctx, 36, H - 44, 22, sp, 0.16)
    sakura(ctx, W - 44, H - 46, 24, sl, 0.14);
    [
        [W * 0.76, H * 0.10, 7, 0.3, sp],
        [W * 0.12, H * 0.22, 5, 0.8, sl],
        [W * 0.88, H * 0.52, 8, 1.1, sp],
        [W * 0.09, H * 0.70, 6, 0.2, sd],
        [W * 0.70, H * 0.90, 7, 1.5, sl],
        [W * 0.92, H * 0.28, 6, 1.8, sd],
    ].forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55))

    diamondRow(ctx, W / 2, M + 20, 11, 24, 5, '#c9956e')

    ctx.font = 'bold 13px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center'
    ctx.fillText(`✦ RUMAH ${isSelf ? 'KAMU' : name.toUpperCase()} ✦`, W / 2, M + 42)

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(M + 24, M + 50);
    ctx.lineTo(W - M - 24, M + 50);
    ctx.stroke()

    const AX = M + 24 + 56,
        AY = M + 50 + 46,
        AR = 36
    ctx.save();
    ctx.strokeStyle = '#d4936b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3])
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 10, 0, Math.PI * 2);
    ctx.stroke()
    ctx.setLineDash([]);
    ctx.restore()
    ctx.save();
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 2
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore()

    const av = await safeLoadImage(avatarURL)
    ctx.save();
    ctx.beginPath();
    ctx.arc(AX, AY, AR, 0, Math.PI * 2);
    ctx.clip()
    ctx.drawImage(av, AX - AR, AY - AR, AR * 2, AR * 2);
    ctx.restore()
    for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i + Math.PI / 4
        sakura(ctx, AX + (AR + 4) * Math.cos(a), AY + (AR + 4) * Math.sin(a), 6, sp, 0.9)
    }

    const IX = AX + AR + 20,
        IY = M + 58
    ctx.font = 'bold 20px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 6
    ctx.fillText(clamp(ctx, name, W - IX - M - 20), IX, IY + 22)
    ctx.shadowBlur = 0
    ctx.font = '11px SFRegular';
    ctx.fillStyle = '#9b6a43'
    ctx.fillText(`🏠 ${userRumah.length} unit properti`, IX, IY + 42)
    ctx.fillText(`${moment.tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm')} WIB`, IX, IY + 58)

    diamondRow(ctx, W / 2, M + HDR - 14, 7, 20, 4, '#c9956e')

    const startY = M + HDR
    for (let idx = 0; idx < userRumah.length; idx++) {
        const v = userRumah[idx]
        const item = botRumah.find(x => x.id == v.id)
        if (!item) continue
        const col = idx % COLS
        const row = Math.floor(idx / COLS)
        const cx = M + 10 + col * (CW + GAP)
        const cy = startY + row * (CH + GAP)

        rrp(ctx, cx, cy, CW, CH, 10)
        const cg = ctx.createLinearGradient(cx, cy, cx + CW, cy + CH)
        cg.addColorStop(0, 'rgba(201,149,110,0.12)');
        cg.addColorStop(1, 'rgba(201,149,110,0.04)')
        ctx.fillStyle = cg;
        ctx.fill()
        rrp(ctx, cx, cy, CW, CH, 10)
        ctx.strokeStyle = '#c9956e';
        ctx.lineWidth = 1;
        ctx.stroke()

        // Gambar rumah AI (kiri)
        const houseImg = await getRumahImage(item, IMG_W - 4, CH - 8)
        if (houseImg) {
            ctx.save()
            rrp(ctx, cx + 4, cy + 4, IMG_W - 4, CH - 8, 8)
            ctx.clip()
            ctx.drawImage(houseImg, cx + 4, cy + 4, IMG_W - 4, CH - 8)
            ctx.restore()
            // overlay gradient biar menyatu
            const imgOverlay = ctx.createLinearGradient(cx + IMG_W - 30, cy, cx + IMG_W, cy)
            imgOverlay.addColorStop(0, 'transparent')
            imgOverlay.addColorStop(1, 'rgba(254,249,242,0.95)')
            ctx.fillStyle = imgOverlay
            ctx.fillRect(cx + IMG_W - 30, cy + 4, 34, CH - 8)
        } else {
            // Fallback: warna block kalau gagal load
            rrp(ctx, cx + 4, cy + 4, IMG_W - 4, CH - 8, 8)
            ctx.fillStyle = 'rgba(201,149,110,0.15)';
            ctx.fill()
            ctx.font = '28px NotoEmoji';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'
            ctx.fillText('🏠', cx + IMG_W / 2, cy + CH / 2)
            ctx.textBaseline = 'alphabetic'
        }

        // Left accent bar
        rrp(ctx, cx + 1, cy + 1, 4, CH - 2, 3)
        ctx.fillStyle = 'rgba(139,90,43,0.55)';
        ctx.fill()

        const nX = cx + IMG_W + 10;
        ctx.textAlign = 'left'

        ctx.font = 'bold 14px SFBold';
        ctx.fillStyle = '#4a1e0a'
        ctx.shadowColor = 'rgba(201,149,110,0.3)';
        ctx.shadowBlur = 4
        ctx.fillText(clamp(ctx, item.nama, CW - IMG_W - 20), nX, cy + 20)
        ctx.shadowBlur = 0

        ctx.font = '9px SFRegular';
        ctx.fillStyle = '#9b6a43'
        ctx.fillText(`📍 ${item.lokasi}`, nX, cy + 34)

        ctx.strokeStyle = 'rgba(201,149,110,0.3)';
        ctx.lineWidth = 1
        ctx.beginPath();
        ctx.moveTo(nX - 4, cy + 40);
        ctx.lineTo(cx + CW - 8, cy + 40);
        ctx.stroke()

        const rows2 = [
            [`🏗 ${item.luasTanah}`, `🏢 ${item.luasBangunan}`],
            [`📅 ${item.tahunDibangun}`, `📜 ${item.jenisSertifikat}`],
            [`👥 Kapasitas ${item.kapasitasOrang} orang`, `🏠 ${item.kondisi || ''}`],
        ]
        rows2.forEach(([l, r], ri) => {
            const ry = cy + 54 + ri * 18
            ctx.font = '9px SFRegular';
            ctx.fillStyle = '#7a4a1a'
            ctx.fillText(l, nX, ry)
            ctx.textAlign = 'right'
            ctx.fillText(r, cx + CW - 8, ry)
            ctx.textAlign = 'left'
        })

        ctx.strokeStyle = 'rgba(201,149,110,0.3)';
        ctx.lineWidth = 1
        ctx.beginPath();
        ctx.moveTo(nX - 4, cy + 106);
        ctx.lineTo(cx + CW - 8, cy + 106);
        ctx.stroke()

        ctx.font = 'bold 13px SFBold';
        ctx.fillStyle = '#4a1e0a'
        ctx.fillText(`Harga Beli: Rp ${toRupiah(v.harga)}`, nX, cy + CH - 10)
    }

    const footY = startY + ROWS * CH + Math.max(0, ROWS - 1) * GAP + 8
    ctx.strokeStyle = 'rgba(201,149,110,0.45)';
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(M + 24, footY);
    ctx.lineTo(W - M - 24, footY);
    ctx.stroke()
    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center'
    ctx.fillText(`${global.botname || 'Bot'}  ·  Z7:林企业`, W / 2, footY + 20)

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    })
}

let handler = async (m, {
    conn,
    usedPrefix,
    command,
    text
}) => {
    let user = global.db.data.users
    let bot = global.db.data.bots
    let rawWho = m.mentions?.[0] || m.quoted?.sender || false
    let who = rawWho ? conn.decodeJid(rawWho) : m.sender
    let name = user[m.sender]?.registered ? user[m.sender].name : await conn.getName(m.sender)

    switch (command) {
        case 'rumah-buy': {
            let [kondisi, id] = (text || '').split('|')

            if (kondisi && id) {
                if (kondisi == 'bekas') {
                    let sellRumah = Object.values(bot.sellRumah || {})
                    let item = sellRumah.find(v => v.id == id)
                    if (!item) return m.reply('Rumah tidak ditemukan!')
                    if (item.seller == m.sender) return m.reply('Tidak bisa membeli rumah sendiri')
                    if (user[m.sender].bank < item.harga) return m.reply(`Uang bank kamu tidak cukup!\nBank: *${toRupiah(user[m.sender].bank)}*\nHarga: *${toRupiah(item.harga)}*\n\nTransfer dulu ke bank dengan *.tarik [jumlah]*`)
                    if (typeof user[m.sender].rumah[item.id] !== 'undefined') return m.reply('Tidak bisa membeli rumah yang sama!')
                    m.reply(`Sukses membeli rumah *${item.nama}* seharga *${toRupiah(item.harga)} Bank* ${global.rpg.emoticon('bank')} dari user @${item.seller.split('@')[0]}`, false, {
                        mentions: [item.seller]
                    })
                    user[m.sender].rumah[item.id] = {
                        id: item.id,
                        harga: item.harga
                    }
                    user[m.sender].bank -= item.harga
                    user[item.seller].bank += item.harga
                    delete user[item.seller].rumah[item.id]
                    delete bot.sellRumah[item.seller]
                } else {
                    let item = (bot.rumah || []).find(v => v.id == id)
                    if (!item) return m.reply('Rumah tidak ditemukan!')
                    if (item.stock == 0) return m.reply('Stock rumah ini telah habis!')
                    if (user[m.sender].bank < item.harga) return m.reply(`Uang bank kamu tidak cukup!\nBank: *${toRupiah(user[m.sender].bank)}*\nHarga: *${toRupiah(item.harga)}*\n\nTransfer dulu ke bank dengan *.tarik [jumlah]*`)
                    if (typeof user[m.sender].rumah[item.id] !== 'undefined') return m.reply('Tidak bisa membeli rumah yang sama!')
                    m.reply(`Sukses membeli rumah *${item.nama}* seharga *${toRupiah(item.harga)} Bank* ${global.rpg.emoticon('bank')}`)
                    user[m.sender].rumah[item.id] = {
                        id: item.id,
                        harga: item.harga
                    }
                    item.stock -= 1
                    user[m.sender].bank -= item.harga
                }
            } else if (kondisi && !id) {
                if (kondisi == 'bekas') {
                    let sellRumah = Object.values(bot.sellRumah || {})
                    if (!sellRumah.length) return m.reply('Tidak ada orang yang menjual rumah Bekas')
                    let rows = sellRumah.map((v, i) => ({
                        header: `${i + 1}. ${v.nama}`,
                        title: `Harga: ${toRupiah(v.harga)}`,
                        description: `📍 ${v.lokasi} | Seller: ${user[v.seller]?.name || v.seller.split('@')[0]}`,
                        id: `${usedPrefix}rumah-buy bekas|${v.id}`
                    }))
                    await conn.sendMessage(m.chat, {
                        text: `🏠 *Daftar Rumah Bekas*\nTerdapat *${sellRumah.length}* rumah bekas yang dijual`,
                        footer: 'Klik untuk membeli',
                        buttons: [{
                            buttonId: 'rumah_bekas',
                            buttonText: {
                                displayText: '🏠 Pilih Rumah Bekas'
                            },
                            type: 4,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: 'Rumah Bekas',
                                    sections: [{
                                        title: 'Tersedia',
                                        rows
                                    }]
                                })
                            }
                        }]
                    }, {
                        quoted: m
                    })
                } else {
                    let rumah = (bot.rumah || []).filter(v => v.stock > 0)
                    if (!rumah.length) return m.reply('Tidak ada rumah baru yang dijual')
                    let rows = rumah.map((v, i) => ({
                        header: `${i + 1}. ${v.nama}`,
                        title: `Harga: ${toRupiah(v.harga)}`,
                        description: `📍 ${v.lokasi} | Stock: ${v.stock}`,
                        id: `${usedPrefix}rumah-buy baru|${v.id}`
                    }))
                    await conn.sendMessage(m.chat, {
                        text: `🏠 *Daftar Rumah Baru*\nTerdapat *${rumah.length}* rumah baru yang dijual`,
                        footer: 'Klik untuk membeli',
                        buttons: [{
                            buttonId: 'rumah_baru',
                            buttonText: {
                                displayText: '🏠 Pilih Rumah Baru'
                            },
                            type: 4,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: 'Rumah Baru',
                                    sections: [{
                                        title: 'Tersedia',
                                        rows
                                    }]
                                })
                            }
                        }]
                    }, {
                        quoted: m
                    })
                }
            } else {
                await conn.sendMessage(m.chat, {
                    text: `🏠 *Beli Rumah*\nKamu ingin membeli rumah Baru atau Bekas?`,
                    footer: 'Pilih kategori',
                    buttons: [{
                        buttonId: 'rumah_pilih',
                        buttonText: {
                            displayText: '🏠 Pilih Kategori'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Kategori Rumah',
                                sections: [{
                                    title: 'Pilihan',
                                    rows: [{
                                        title: '🆕 Rumah Baru',
                                        description: 'Rumah langsung dari developer',
                                        id: `${usedPrefix}rumah-buy baru|`
                                    }, {
                                        title: '♻️ Rumah Bekas',
                                        description: 'Rumah dijual oleh player lain',
                                        id: `${usedPrefix}rumah-buy bekas|`
                                    }]
                                }]
                            })
                        }
                    }]
                }, {
                    quoted: m
                })
            }
            break
        }

        case 'rumah-sell': {
            let userRumah = Object.values(user[m.sender].rumah || {})
            if (!userRumah.length) return m.reply('Kamu tidak mempunyai rumah!')
            let [id, harga] = (text || '').split('|')

            if (id && harga) {
                let item = (bot.rumah || []).find(x => x.id == id)
                if (!item) return m.reply('Rumah tidak ditemukan!')
                m.reply(`Berhasil menambahkan rumah *${item.nama}* ke daftar tunggu, tinggal menunggu pembeli!`)
                bot.sellRumah[m.sender] = {
                    seller: m.sender,
                    harga: parseInt(harga),
                    id: item.id,
                    nama: item.nama,
                    lokasi: item.lokasi,
                    luasTanah: item.luasTanah,
                    luasBangunan: item.luasBangunan,
                    tahunDibangun: item.tahunDibangun,
                    fasilitasTambahan: item.fasilitasTambahan,
                }
            } else if (id && !harga) {
                let item = (bot.rumah || []).find(x => x.id == id)
                if (!item) return m.reply('Rumah tidak ditemukan!')
                let hargaOpts = [item.harga, Math.floor(item.harga * 1.1), Math.floor(item.harga * 1.25), Math.floor(item.harga * 1.5)].map(h => ({
                    title: `Rp ${toRupiah(h)}`,
                    description: h === item.harga ? '💰 Harga beli (modal)' : `📈 +${Math.round((h / item.harga - 1) * 100)}% dari harga beli`,
                    id: `${usedPrefix}rumah-sell ${id}|${h}`
                }))
                await conn.sendMessage(m.chat, {
                    text: `🏷️ *Jual Rumah: ${item.nama}*\nPilih harga jual`,
                    footer: 'Pilih harga jual',
                    buttons: [{
                        buttonId: 'rumah_harga',
                        buttonText: {
                            displayText: '💰 Pilih Harga Jual'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Harga Jual',
                                sections: [{
                                    title: 'Pilihan Harga',
                                    rows: hargaOpts
                                }]
                            })
                        }
                    }]
                }, {
                    quoted: m
                })
            } else {
                const sudahJual = Object.values(bot.sellRumah || {}).map(v => v.id)
                let rows = userRumah.map((v, i) => {
                    let item = (bot.rumah || []).find(x => x.id == v.id)
                    if (!item) return null
                    const sedangJual = sudahJual.includes(v.id)
                    return {
                        title: `${i + 1}. ${item.nama}`,
                        description: `📍 ${item.lokasi} | Harga beli: ${toRupiah(v.harga)}${sedangJual ? ' (sedang dijual)' : ''}`,
                        id: sedangJual ? `${usedPrefix}rumah` : `${usedPrefix}rumah-sell ${v.id}|`
                    }
                }).filter(Boolean)
                await conn.sendMessage(m.chat, {
                    text: `🏠 *Rumah Kamu* (${userRumah.length} unit)\nPilih rumah yang ingin dijual`,
                    footer: 'Pilih rumah',
                    buttons: [{
                        buttonId: 'rumah_sell_list',
                        buttonText: {
                            displayText: '🏠 Pilih Rumah'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Daftar Rumah',
                                sections: [{
                                    title: 'Rumah Kamu',
                                    rows
                                }]
                            })
                        }
                    }]
                }, {
                    quoted: m
                })
            }
            break
        }

        default: {
            let userRumah = Object.values(user[who]?.rumah || {})
            if (!userRumah.length) return m.reply(`${who == m.sender ? 'Kamu' : 'Dia'} tidak mempunyai rumah!\n_Gunakan command *${usedPrefix}rumah-buy* untuk membeli rumah_`)

            try {
                const ppUrl = await conn.profilePictureUrl(who, 'image').catch(() => 'src/avatar_contact.png')
                const img = await generateRumahCanvas({
                    avatarURL: ppUrl,
                    name: who == m.sender ? name : (user[who]?.registered ? user[who].name : who.split('@')[0]),
                    userRumah,
                    botRumah: bot.rumah || [],
                    isSelf: who == m.sender
                })
                await conn.sendMessage(m.chat, {
                    image: img,
                    mimetype: 'image/jpeg',
                    caption: `🏠 *${who == m.sender ? 'Rumah Kamu' : 'Rumah ' + (user[who]?.name || who.split('@')[0])}*`
                }, {
                    quoted: m
                })
            } catch (e) {
                console.error('[rumah canvas]', e)
                let caption = `*RUMAH ${who == m.sender ? 'KAMU' : 'DIA'}*\n\n${userRumah.map((v, i) => {
                    let item = (bot.rumah || []).find(x => x.id == v.id)
                    if (!item) return null
                    return `*${i + 1}.* ${item.nama}\nLokasi : ${item.lokasi}\nLuas Tanah : ${item.luasTanah}\nLuas Bangunan : ${item.luasBangunan}\nTahun Dibangun : ${item.tahunDibangun}\nFasilitas : ${item.fasilitasTambahan.join(', ')}\nJenis Sertifikat : ${item.jenisSertifikat}\nHarga Beli : ${toRupiah(v.harga)}`
                }).filter(Boolean).join('\n\n')}`.trim()
                await conn.adReply(m.chat, caption, `Halo ${name}, ${wish()}`, global.wm, 'https://telegra.ph/file/ccfab120681cd8bff3245.jpg', global.website, m)
            }
        }
    }
}

handler.help = ['rumah', 'rumah-buy', 'rumah-sell']
handler.showAllHelp = true
handler.tags = ['rpg']
handler.command = /^(rumah(-buy|-sell)?)$/i
handler.rpg = true
handler.group = true
handler.register = true;
export default handler

const toRupiah = number => parseInt(number).toLocaleString().replace(/,/g, '.')

function wish() {
    const h = parseInt(moment.tz('Asia/Jakarta').format('HH'))
    if (h >= 23 || h < 4) return 'Selamat Malam'
    if (h < 11) return 'Selamat Pagi'
    if (h < 15) return 'Selamat Siang'
    if (h < 18) return 'Selamat Sore'
    return 'Selamat Malam'
}