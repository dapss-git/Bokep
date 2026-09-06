import {
    statSync
} from 'node:fs'
import {
    resolve
} from 'node:path'
import {
    createCanvas,
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
    for (let i = 0; i < 5; i++) petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = '#fff8f0'
    ctx.fill()
    ctx.restore()
}

function cornerFlourish(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    const corners = [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1]
    ]
    corners.forEach(([cx, cy, dx, dy]) => {
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
        ctx.translate(dx, y)
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

function drawBar(ctx, x, y, w, h, pct, c1, c2) {
    rrp(ctx, x, y, w, h, h / 2)
    ctx.fillStyle = 'rgba(201,149,110,0.12)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(201,149,110,0.25)'
    ctx.lineWidth = 1
    ctx.stroke()
    const fw = Math.max(h, w * Math.min(pct, 1))
    rrp(ctx, x, y, fw, h, h / 2)
    const g = ctx.createLinearGradient(x, y, x + fw, y)
    g.addColorStop(0, c1)
    g.addColorStop(1, c2)
    ctx.fillStyle = g
    ctx.fill()
}

async function generateDbInfoCanvas(data) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold')
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium')
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular')

    const W = 680,
        H = 660
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const bgG = ctx.createLinearGradient(0, 0, W, H)
    bgG.addColorStop(0, '#fdf8f0')
    bgG.addColorStop(0.4, '#fef9f2')
    bgG.addColorStop(1, '#faf3e8')
    ctx.fillStyle = bgG
    ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < 600; i++) {
        ctx.fillStyle = `rgba(180,140,100,${Math.random() * 0.04 + 0.01})`
        ctx.beginPath()
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2)
        ctx.fill()
    }

    const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75)
    vign.addColorStop(0, 'transparent')
    vign.addColorStop(1, 'rgba(160,110,60,0.12)')
    ctx.fillStyle = vign
    ctx.fillRect(0, 0, W, H)

    const M = 18
    rrp(ctx, M, M, W - M * 2, H - M * 2, 12)
    ctx.strokeStyle = '#c9956e'
    ctx.lineWidth = 1.5
    ctx.stroke()
    rrp(ctx, M + 5, M + 5, W - M * 2 - 10, H - M * 2 - 10, 9)
    ctx.strokeStyle = 'rgba(201,149,110,0.35)'
    ctx.lineWidth = 1
    ctx.stroke()
    cornerFlourish(ctx, M + 3, M + 3, W - M * 2 - 6, H - M * 2 - 6, 20, '#c9956e')

    const sp = '#f8a4c0',
        sl = '#fcc8d8',
        sd = '#e87098'
    sakura(ctx, 44, 42, 26, sl, 0.18)
    sakura(ctx, W - 48, 36, 20, sp, 0.14)
    sakura(ctx, 34, H - 44, 22, sp, 0.16)
    sakura(ctx, W - 44, H - 48, 24, sl, 0.14)
    const petals = [
        [W * 0.78, H * 0.10, 8, 0.3, sp],
        [W * 0.14, H * 0.22, 6, 0.8, sl],
        [W * 0.88, H * 0.55, 9, 1.1, sp],
        [W * 0.10, H * 0.68, 7, 0.2, sd],
        [W * 0.72, H * 0.90, 8, 1.5, sl],
        [W * 0.92, H * 0.26, 7, 1.8, sd]
    ]
    petals.forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55))

    const CX = W / 2

    diamondRow(ctx, CX, 46, 9, 26, 5, '#c9956e')
    ctx.font = 'bold 12px SFBold'
    ctx.fillStyle = '#7a3e1a'
    ctx.textAlign = 'center'
    ctx.fillText('✦ DATABASE INFO ✦', CX, 68)
    ctx.strokeStyle = 'rgba(201,149,110,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(CX - 155, 76);
    ctx.lineTo(CX + 155, 76);
    ctx.stroke()
    ctx.font = 'bold 26px SFBold'
    ctx.fillStyle = '#4a1e0a'
    ctx.shadowColor = 'rgba(201,149,110,0.3)'
    ctx.shadowBlur = 8
    ctx.fillText(global.botname || 'Bot', CX, 106)
    ctx.shadowBlur = 0
    ctx.font = '11px SFMedium'
    ctx.fillStyle = '#8b5e3c'
    ctx.fillText(moment.tz('Asia/Jakarta').format('DD MMM YYYY · HH:mm') + ' WIB', CX, 122)
    diamondRow(ctx, CX, 134, 5, 20, 4, '#c9956e')

    const colL = 52
    const colMid = 200
    const colVal = 270
    const barX = colVal + 90
    const barW = W - M - 20 - barX

    const drawSectionTitle = (title, y) => {
        ctx.font = 'bold 11px SFBold'
        ctx.fillStyle = '#7a3e1a'
        ctx.textAlign = 'left'
        ctx.fillText(title, colL, y)
        ctx.strokeStyle = 'rgba(201,149,110,0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(colL + ctx.measureText(title).width + 8, y - 3)
        ctx.lineTo(W - M - 24, y - 3)
        ctx.stroke()
    }

    const drawRow = (k, v, y, shade, barPct = null, barC1 = '#c9956e', barC2 = '#e8b48a', bold = false) => {
        if (shade) {
            rrp(ctx, colL - 6, y - 14, W - colL - M - 12, 22, 4)
            ctx.fillStyle = 'rgba(201,149,110,0.07)'
            ctx.fill()
        }
        ctx.font = '11px SFRegular'
        ctx.fillStyle = '#9b6a43'
        ctx.textAlign = 'left'
        ctx.fillText(k, colL, y)

        ctx.save()
        ctx.setLineDash([2, 3])
        ctx.strokeStyle = 'rgba(180,130,80,0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(colL + ctx.measureText(k).width + 4, y - 2)
        ctx.lineTo(colMid - 4, y - 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        ctx.font = bold ? 'bold 12px SFBold' : '12px SFBold'
        ctx.fillStyle = bold ? '#7a3e1a' : '#3d1a06'
        ctx.fillText(String(v), colVal, y)

        if (barPct != null && barW > 20) {
            drawBar(ctx, barX, y - 10, barW, 10, barPct, barC1, barC2)
        }
    }

    const sepLine = (y) => {
        ctx.strokeStyle = 'rgba(201,149,110,0.28)'
        ctx.lineWidth = 1
        ctx.beginPath();
        ctx.moveTo(M + 20, y);
        ctx.lineTo(W - M - 20, y);
        ctx.stroke()
    }

    let cy = 148
    drawSectionTitle('📁 Ukuran File', cy)
    cy += 20
    drawRow('database.db', data.fmt(data.mainSize), cy, false)
    cy += 28
    drawRow('-wal', data.fmt(data.walSize), cy, true)
    cy += 28
    drawRow('-shm', data.fmt(data.shmSize), cy, false)
    cy += 28
    drawRow('Total', data.fmt(data.total), cy, true, null, null, null, true)
    cy += 20

    sepLine(cy)
    cy += 14

    const maxRow = Math.max(...Object.values(data.summary), 1)
    const barColors = {
        users: ['#c9956e', '#e8b48a'],
        chats: ['#e87098', '#f8a4c0'],
        settings: ['#9b59b6', '#c39bd3'],
        bots: ['#2e86c1', '#7fb3d3'],
        guilds: ['#27ae60', '#82e0aa'],
    }

    drawSectionTitle('📊 Rows per Tabel', cy)
    cy += 20
    const nsRows = [
        ['users', 'Users'],
        ['chats', 'Chats'],
        ['settings', 'Settings'],
        ['bots', 'Bots'],
        ['guilds', 'Guilds']
    ]
    nsRows.forEach(([ns, label], i) => {
        const pct = data.summary[ns] / maxRow
        const [c1, c2] = barColors[ns]
        drawRow(label, data.summary[ns], cy, i % 2 === 0, pct, c1, c2)
        cy += 28
    })
    drawRow('Total', data.totalRows, cy, true, null, null, null, true)
    cy += 20

    sepLine(cy)
    cy += 14

    drawSectionTitle('⚙️ SQLite Info', cy)
    cy += 20
    drawRow('Page size', data.fmt(data.pageSize), cy, false)
    cy += 28
    drawRow('Pages', data.pageCount, cy, true)
    cy += 28
    drawRow('Free pages', data.freePages, cy, false)
    cy += 28
    drawRow('Mode', data.walMode.toUpperCase(), cy, true)

    diamondRow(ctx, CX, H - 34, 7, 22, 4, '#c9956e')
    ctx.strokeStyle = 'rgba(201,149,110,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(M + 24, H - 26);
    ctx.lineTo(W - M - 24, H - 26);
    ctx.stroke()
    ctx.font = '9px SFRegular'
    ctx.fillStyle = 'rgba(154,100,60,0.6)'
    ctx.textAlign = 'center'
    ctx.fillText(`${global.botname || 'Bot'}  ·  ${moment.tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm')} WIB`, W / 2, H - 10)

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    })
}

const handler = async (m, {
    conn
}) => {
    const db = global.db._db
    if (!db) return m.reply('❌ SQLite tidak aktif.')

    const dbPath = resolve('./database.db')
    const walPath = dbPath + '-wal'
    const shmPath = dbPath + '-shm'

    const fmt = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(2) + ' KB'
        return (bytes / 1024 ** 2).toFixed(2) + ' MB'
    }

    const fileSize = (p) => {
        try {
            return statSync(p).size
        } catch {
            return 0
        }
    }

    const mainSize = fileSize(dbPath)
    const walSize = fileSize(walPath)
    const shmSize = fileSize(shmPath)
    const total = mainSize + walSize + shmSize

    const totalRows = db.prepare('SELECT COUNT(*) as c FROM kv').get().c
    const summary = {}
    for (const ns of ['users', 'chats', 'settings', 'bots', 'guilds']) {
        summary[ns] = db.prepare('SELECT COUNT(*) as c FROM kv WHERE key LIKE ?').get(ns + ':%').c
    }

    const pageSize = db.pragma('page_size', {
        simple: true
    })
    const pageCount = db.pragma('page_count', {
        simple: true
    })
    const freePages = db.pragma('freelist_count', {
        simple: true
    })
    const walMode = db.pragma('journal_mode', {
        simple: true
    })

    await global.loading(m, conn)
    try {
        const card = await generateDbInfoCanvas({
            fmt,
            mainSize,
            walSize,
            shmSize,
            total,
            summary,
            totalRows,
            pageSize,
            pageCount,
            freePages,
            walMode,
        })

        await conn.sendMessage(
            m.chat, {
                image: card,
                caption: `🗄️ *Database Info*\n\n` +
                    `📁 *Ukuran File*\n` +
                    `» database.db  : ${fmt(mainSize)}\n` +
                    `» -wal         : ${fmt(walSize)}\n` +
                    `» -shm         : ${fmt(shmSize)}\n` +
                    `» *Total       : ${fmt(total)}*\n\n` +
                    `📊 *Rows per Tabel*\n` +
                    `» Users    : ${summary.users}\n` +
                    `» Chats    : ${summary.chats}\n` +
                    `» Settings : ${summary.settings}\n` +
                    `» Bots     : ${summary.bots}\n` +
                    `» Guilds   : ${summary.guilds}\n` +
                    `» *Total   : ${totalRows}*\n\n` +
                    `⚙️ *SQLite Info*\n` +
                    `» Page size  : ${fmt(pageSize)}\n` +
                    `» Pages      : ${pageCount}\n` +
                    `» Free pages : ${freePages}\n` +
                    `» Mode       : ${walMode.toUpperCase()}`,
                footer: `꒰ © 2025 ${global.botname} ꒱`,
            }, {
                quoted: m
            }
        )
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.command = ['dbinfo', 'dbsize']
handler.tags = 'owner'
handler.description = 'Cek ukuran dan info database SQLite'
handler.owner = true
handler.register = true;

export default handler