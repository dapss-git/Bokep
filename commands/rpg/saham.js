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

function clamp(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text
    while (ctx.measureText(text + '…').width > maxW && text.length > 0)
        text = text.slice(0, -1)
    return text + '…'
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
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = '#fff8f0'
    ctx.fill()
    ctx.restore()
}

function cornerFlourish(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5;
    [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1]
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
        ctx.translate(dx, y)
        ctx.rotate(Math.PI / 4)
        rrp(ctx, -size / 2, -size / 2, size, size, 1)
        if (i === Math.floor(count / 2)) {
            ctx.fillStyle = color
            ctx.fill()
        } else {
            ctx.strokeStyle = color
            ctx.lineWidth = 1
            ctx.stroke()
        }
        ctx.restore()
    }
}

async function generateSahamCanvas({
    invest = [],
    botName = 'Bot',
    username = 'User'
}) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold')
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium')
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular')
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji')

    const COLS = 2
    const M = 18
    const GAP = 10
    const ROWS = Math.ceil(invest.length / COLS)
    const CW = 320
    const CH = 100
    const W = M * 2 + COLS * CW + (COLS - 1) * GAP + 20
    const HDR = 110
    const FTR = 38
    const H = M * 2 + HDR + ROWS * CH + (ROWS - 1) * GAP + FTR + 16

    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const bgG = ctx.createLinearGradient(0, 0, W, H)
    bgG.addColorStop(0, '#fdf8f0')
    bgG.addColorStop(0.45, '#fef9f2')
    bgG.addColorStop(1, '#faf3e8')
    ctx.fillStyle = bgG
    ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < 700; i++) {
        ctx.fillStyle = `rgba(180,140,100,${Math.random() * 0.04 + 0.01})`
        ctx.beginPath()
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2)
        ctx.fill()
    }

    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75)
    vg.addColorStop(0, 'transparent')
    vg.addColorStop(1, 'rgba(160,110,60,0.12)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, W, H)

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

    ctx.font = 'bold 13px SFBold'
    ctx.fillStyle = '#7a3e1a'
    ctx.textAlign = 'center'
    ctx.fillText('✦ DAFTAR SAHAM ✦', W / 2, M + 42)

    ctx.strokeStyle = 'rgba(201,149,110,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(M + 24, M + 50)
    ctx.lineTo(W - M - 24, M + 50)
    ctx.stroke()

    ctx.font = '11px SFRegular'
    ctx.fillStyle = '#9b6a43'
    ctx.textAlign = 'center'
    ctx.fillText(`${botName}  •  @${username}  •  ${invest.length} emiten`, W / 2, M + 68)

    diamondRow(ctx, W / 2, M + 80, 7, 20, 4, '#c9956e')

    const startY = M + HDR
    invest.forEach(([key, item], idx) => {
        const col = idx % COLS
        const row = Math.floor(idx / COLS)
        const cx = M + 10 + col * (CW + GAP)
        const cy = startY + row * (CH + GAP)

        const now = item.harga || 0
        const prev = item.hargaBefore || now
        const diff = now - prev
        const pct = prev !== 0 ? (diff / prev) * 100 : 0
        const isUp = diff >= 0
        const cc = isUp ? '#2a6a2a' : '#8a1a1a'
        const cbg = isUp ? 'rgba(42,106,42,0.10)' : 'rgba(138,26,26,0.10)'
        const cbrd = isUp ? 'rgba(42,106,42,0.40)' : 'rgba(138,26,26,0.35)'
        const mcap = (item.marketcap || 0) * now

        rrp(ctx, cx, cy, CW, CH, 10)
        const cg = ctx.createLinearGradient(cx, cy, cx + CW, cy + CH)
        cg.addColorStop(0, 'rgba(201,149,110,0.10)')
        cg.addColorStop(1, 'rgba(201,149,110,0.04)')
        ctx.fillStyle = cg
        ctx.fill()
        rrp(ctx, cx, cy, CW, CH, 10)
        ctx.strokeStyle = '#c9956e'
        ctx.lineWidth = 1
        ctx.stroke()

        rrp(ctx, cx + 1, cy + 1, 4, CH - 2, 3)
        ctx.fillStyle = isUp ? 'rgba(42,106,42,0.6)' : 'rgba(138,26,26,0.6)'
        ctx.fill()

        const rankTxt = `#${idx + 1}`
        ctx.font = '9px SFRegular'
        const rW = ctx.measureText(rankTxt).width + 10
        rrp(ctx, cx + CW - rW - 6, cy + 6, rW, 16, 4)
        ctx.fillStyle = 'rgba(201,149,110,0.18)'
        ctx.fill()
        ctx.fillStyle = '#7a3e1a'
        ctx.textAlign = 'center'
        ctx.fillText(rankTxt, cx + CW - rW / 2 - 6, cy + 17)

        const nX = cx + 14
        ctx.textAlign = 'left'

        ctx.font = 'bold 16px SFBold'
        ctx.fillStyle = '#4a1e0a'
        ctx.shadowColor = 'rgba(201,149,110,0.3)'
        ctx.shadowBlur = 4
        ctx.fillText(clamp(ctx, item.name || key, CW - 70), nX, cy + 24)
        ctx.shadowBlur = 0

        ctx.font = '10px SFRegular'
        ctx.fillStyle = '#9b6a43'
        ctx.fillText(key.toUpperCase(), nX, cy + 38)

        ctx.strokeStyle = 'rgba(201,149,110,0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx + 8, cy + 44)
        ctx.lineTo(cx + CW - 8, cy + 44)
        ctx.stroke()

        ctx.font = 'bold 14px SFBold'
        ctx.fillStyle = '#3d1a06'
        ctx.fillText(`Rp ${toRupiah(now)}`, nX, cy + 62)

        const pctStr = `${isUp ? '+' : ''}${pct.toFixed(2)}%`
        ctx.font = 'bold 10px SFBold'
        const pw = ctx.measureText(pctStr).width + 12
        const px2 = cx + CW - pw - 8
        const py2 = cy + 48
        rrp(ctx, px2, py2, pw, 18, 5)
        ctx.fillStyle = cbg
        ctx.fill()
        rrp(ctx, px2, py2, pw, 18, 5)
        ctx.strokeStyle = cbrd
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillStyle = cc
        ctx.textAlign = 'center'
        ctx.fillText(pctStr, px2 + pw / 2, py2 + 12)

        ctx.font = '9px SFRegular'
        ctx.fillStyle = '#9b6a43'
        ctx.textAlign = 'left'
        ctx.fillText(`Lot/Lembar : Rp ${toRupiah(now * 100)} / Rp ${toRupiah(now)}`, nX, cy + 78)
        ctx.fillText(`Mkt Cap : Rp ${toRupiah(mcap)}`, nX, cy + 90)
    })

    const footY = startY + ROWS * CH + (ROWS - 1) * GAP + 8
    ctx.strokeStyle = 'rgba(201,149,110,0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(M + 24, footY)
    ctx.lineTo(W - M - 24, footY)
    ctx.stroke()

    ctx.font = '9px SFRegular'
    ctx.fillStyle = 'rgba(154,100,60,0.6)'
    ctx.textAlign = 'center'
    ctx.fillText(
        `saham-buy [nama] [lot]  ·  saham-sell [nama] [lot]  ·  ${moment.tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm')} WIB`,
        W / 2, footY + 20
    )
    ctx.fillStyle = 'rgba(154,100,60,0.4)'
    ctx.fillText(`${global.botname || 'Bot'}  ·  Z7:林企业`, W / 2, footY + 32)

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    })
}

let handler = async (m, {
    conn,
    usedPrefix,
    command,
    args
}) => {
    let bot = global.db.data.bots
    let user = global.db.data.users[m.sender]
    let name = user.registered ? user.name : conn.getName(m.sender)
    let emot = v => global.rpg.emoticon(v)

    // Pastikan user.saham terinisialisasi
    if (typeof user.saham !== 'object' || !user.saham) user.saham = {}

    let invest = Object.entries(bot.saham.item).sort((a, b) =>
        (b[1].marketcap * b[1].harga) - (a[1].marketcap * a[1].harga)
    )

    let commands = command.split('-')[1]
    let text = (args[0] || '').toLowerCase()
    let sahamName = text.toUpperCase()

    // ── Tampilkan daftar saham ──
    if (!commands && !text) {
        try {
            const img = await generateSahamCanvas({
                invest,
                botName: conn.user.name || global.botname || 'Bot',
                username: name
            })

            const buyRows = invest.map(([key, item]) => ({
                header: key,
                title: `📈 Beli ${item.name}`,
                description: `Rp ${toRupiah(item.harga)}/lembar · Rp ${toRupiah(item.harga * 100)}/lot`,
                id: `${usedPrefix}saham-buy ${item.name.toLowerCase()}`
            }))

            const sellRows = invest
                .filter(([key]) => user.saham[key]?.stock > 0)
                .map(([key, item]) => ({
                    header: key,
                    title: `📉 Jual ${item.name}`,
                    description: `Stock: ${toRupiah(user.saham[key].stock / 100)} lot · Avg: Rp ${toRupiah(user.saham[key].harga)}`,
                    id: `${usedPrefix}saham-sell ${item.name.toLowerCase()}`
                }))

            const sections = [{
                title: '📈 Beli Saham',
                rows: buyRows
            }]
            if (sellRows.length) sections.push({
                title: '📉 Jual Saham (milikmu)',
                rows: sellRows
            })

            return conn.sendMessage(m.chat, {
                image: img,
                caption: `${wish()} *${name}*!\n\n💰 Bank kamu: *Rp ${toRupiah(user.bank)}*\nPilih saham untuk beli atau jual 👇`,
                mimetype: 'image/jpeg',
                footer: `${global.botname || 'Bot'} · Saham`,
                buttons: [{
                    buttonId: 'saham_select',
                    buttonText: {
                        displayText: '📊 Pilih Saham'
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Daftar Saham',
                            sections
                        })
                    }
                }],
                headerType: 4
            }, {
                quoted: m
            })
        } catch (e) {
            console.error('[saham canvas]', e)
            return m.reply(`*Saham*\n\n${invest.map((v, i) => {
                let diff = v[1].harga - v[1].hargaBefore
                let pct = ((diff / (v[1].hargaBefore || v[1].harga)) * 100).toFixed(2)
                return `*${i + 1}.* ${v[1].name}\nHarga: Rp ${toRupiah(v[1].harga)}/lembar\nUpdate: ${diff > 0 ? '+' : ''}${toRupiah(diff)} (${pct}%)`
            }).join('\n\n')}\n\nContoh:\n${usedPrefix}saham-buy bbca 100`)
        }
    }

    // ── Cari saham berdasarkan nama ──
    let saham = Object.entries(bot.saham.item).find(([key, v]) =>
        v.name.toLowerCase() === text || key.toLowerCase() === text
    )
    if (!saham) return m.reply(`Nama saham tidak ditemukan!\n*List saham:*\n\n${invest.map(v => `*•* ${v[1].name}`).join('\n')}`)

    const [sahamKey, sahamData] = saham
    sahamName = sahamKey

    // Inisialisasi user.saham[sahamName] jika belum ada
    if (!user.saham[sahamName] || typeof user.saham[sahamName] !== 'object') {
        user.saham[sahamName] = {
            harga: 0,
            stock: 0
        }
    }

    // ── Tampilkan button pilih lot jika tidak ada args[1] ──
    if (!args[1] && (commands === 'buy' || commands === 'sell')) {
        const maxLot = commands === 'buy' ?
            Math.floor(user.bank / (sahamData.harga * 100)) :
            Math.floor(user.saham[sahamName].stock / 100)

        if (maxLot < 1) {
            if (commands === 'buy') return m.reply(`💸 Saldo bank tidak cukup!\nBank: *Rp ${toRupiah(user.bank)}*\nHarga 1 lot: *Rp ${toRupiah(sahamData.harga * 100)}*`)
            return m.reply(`📦 Kamu tidak punya saham *${sahamName}* untuk dijual.`)
        }

        const lotOptions = [1, 5, 10, 25, 50, 100].filter(l => l <= maxLot)
        if (maxLot > 0 && !lotOptions.includes(maxLot)) lotOptions.push(maxLot)

        const rows = lotOptions.map(lot => {
            const total = lot * 100
            const price = sahamData.harga * total
            return {
                title: `${lot} Lot (${toRupiah(total)} lembar)`,
                description: commands === 'buy' ?
                    `💸 Bayar: Rp ${toRupiah(price)}` :
                    `💰 Dapat: Rp ${toRupiah(price)}`,
                id: `${usedPrefix}saham-${commands} ${text} ${lot}`
            }
        })

        return conn.sendMessage(m.chat, {
            text: `${commands === 'buy' ? '📈' : '📉'} *${commands === 'buy' ? 'Beli' : 'Jual'} Saham ${sahamName}*\n\n💹 Harga: Rp ${toRupiah(sahamData.harga)}/lembar\n💰 Bank: Rp ${toRupiah(user.bank)}\n📦 Stock kamu: ${toRupiah(user.saham[sahamName].stock / 100)} lot\n\nPilih jumlah lot 👇`,
            footer: `${global.botname || 'Bot'} · Saham`,
            buttons: [{
                buttonId: 'saham_lot_select',
                buttonText: {
                    displayText: `${commands === 'buy' ? '📈 Pilih Lot Beli' : '📉 Pilih Lot Jual'}`
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: `${commands === 'buy' ? 'Beli' : 'Jual'} ${sahamName}`,
                        sections: [{
                            title: `Pilih Jumlah Lot (Max: ${maxLot})`,
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        })
    }

    let total = Math.floor(isNumber(args[1]) ? Math.min(Math.max(parseInt(args[1]), 1), Number.MAX_SAFE_INTEGER) : 1) * 100

    switch (commands) {
        case 'buy': {
            let price = sahamData.harga * total
            if (price > user.bank) return m.reply(`Saldo bank kamu kurang!\nBank: *Rp ${toRupiah(user.bank)}*\nHarga: *Rp ${toRupiah(price)}*`)
            let avg = await calculateAverage(user.saham[sahamName].harga, user.saham[sahamName].stock, sahamData.harga, total)
            user.bank -= price
            user.saham[sahamName].stock += total
            user.saham[sahamName].harga = avg
            bot.saham.item[sahamName].marketcap += total
            bot.saham.item[sahamName].volumeBuy += total
            bot.saham.item[sahamName].trade.push({
                user: m.sender,
                total,
                type: 'buy'
            })
            m.reply(`✅ Berhasil membeli *${toRupiah(total / 100)} lot ${sahamName}* seharga *Rp ${toRupiah(price)}*\n💰 Sisa bank: *Rp ${toRupiah(user.bank)}*`)
            break
        }
        case 'sell': {
            if (user.saham[sahamName].stock < total) return m.reply(`Kamu hanya mempunyai *${toRupiah(user.saham[sahamName].stock / 100)} lot ${sahamName}*`)
            let price = sahamData.harga * total
            if (user.fullatm < user.bank + price) return m.reply(`Kapasitas *Bank ${emot('bank')}* kamu telah full!\nUpgrade ATM terlebih dahulu.`)
            let avg = await calculateAverage(user.saham[sahamName].harga, user.saham[sahamName].stock, sahamData.harga, total)
            user.bank += price
            user.saham[sahamName].stock -= total
            user.saham[sahamName].harga = avg
            bot.saham.item[sahamName].marketcap -= total
            bot.saham.item[sahamName].volumeSell += total
            bot.saham.item[sahamName].trade.push({
                user: m.sender,
                total,
                type: 'sell'
            })
            m.reply(`✅ Berhasil menjual *${toRupiah(total / 100)} lot ${sahamName}* seharga *Rp ${toRupiah(price)}*\n💰 Bank sekarang: *Rp ${toRupiah(user.bank)}*`)
            break
        }
        case 'history': {
            let cap = bot.saham.item[sahamName].trade.reverse().slice(0, 19).map(v =>
                `> ( ${conn.getName(v.user).slice(0, 5)}.. ) ${v.type === 'buy' ? '_Membeli_' : '_Menjual_'} *${toRupiah(v.total)}* ${emot(sahamName)} ${bot.saham.item[sahamName].name}`
            ).join('\n')
            m.reply(`${bot.saham.item[sahamName].name} Trade History\n\n` + cap)
            break
        }
    }
}

handler.help = ['saham']
handler.tags = ['rpg']
handler.command = /^(saham(-buy|-sell|-history)?)$/i
handler.rpg = true
handler.group = true
handler.register = true;
export default handler

async function calculateAverage(hargaNew, stockNew, harga, stock) {
    let arr = new Array(stock).fill(harga)
    for (let i = 0; i < stockNew; i++) arr.push(hargaNew)
    let avg = arr.reduce((t, h) => t + h, 0) / arr.length
    return parseFloat(avg.toString().split('.')[0])
}

function isNumber(n) {
    if (!n) return n
    n = parseInt(n)
    return typeof n === 'number' && !isNaN(n)
}

const toRupiah = n => parseInt(n).toLocaleString().replace(/,/g, '.')

function wish() {
    const h = parseInt(moment.tz('Asia/Jakarta').format('HH'))
    if (h >= 23 || h < 4) return 'Selamat Malam'
    if (h < 11) return 'Selamat Pagi'
    if (h < 15) return 'Selamat Siang'
    if (h < 18) return 'Selamat Sore'
    return 'Selamat Malam'
}