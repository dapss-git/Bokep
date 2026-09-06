import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas'

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
        if (!r.ok) throw new Error()
        return await loadImage(Buffer.from(await r.arrayBuffer()))
    } catch {
        const c = createCanvas(80, 80)
        const g = c.getContext('2d')
        g.fillStyle = '#e8d5c4'
        g.beginPath();
        g.arc(40, 40, 40, 0, Math.PI * 2);
        g.fill()
        return await loadImage(c.toBuffer('image/png'))
    }
}

function rrp(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y);
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
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(angle)
    ctx.beginPath();
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(-r * 0.5, -r * 0.8, -r * 0.3, -r * 1.5, 0, -r * 1.6)
    ctx.bezierCurveTo(r * 0.3, -r * 1.5, r * 0.5, -r * 0.8, 0, 0)
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore()
}

function sakura(ctx, cx, cy, r, color, alpha = 1) {
    for (let i = 0; i < 5; i++) petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha)
    ctx.save();
    ctx.globalAlpha = alpha
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = '#fff8f0';
    ctx.fill();
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
        ctx.beginPath();
        ctx.moveTo(cx + dx * size, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * size);
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

async function generateAddItemCanvas({
    avatarURL,
    username,
    itemKey,
    emot,
    before,
    after,
    jumlah
}) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold')
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium')
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular')
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji')

    const W = 620,
        H = 340,
        M = 18
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const bgG = ctx.createLinearGradient(0, 0, W, H)
    bgG.addColorStop(0, '#fdf8f0');
    bgG.addColorStop(0.45, '#fef9f2');
    bgG.addColorStop(1, '#faf3e8')
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < 500; i++) {
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
    sakura(ctx, 40, 40, 22, sl, 0.18);
    sakura(ctx, W - 42, 34, 18, sp, 0.14)
    sakura(ctx, 32, H - 40, 18, sp, 0.16);
    sakura(ctx, W - 40, H - 42, 20, sl, 0.14);
    [
        [W * 0.75, H * 0.10, 6, 0.3, sp],
        [W * 0.12, H * 0.22, 5, 0.8, sl],
        [W * 0.88, H * 0.55, 7, 1.1, sp],
        [W * 0.09, H * 0.70, 5, 0.2, sd]
    ].forEach(
        ([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55)
    )

    diamondRow(ctx, W / 2, M + 20, 11, 22, 5, '#c9956e')

    ctx.font = 'bold 13px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center'
    ctx.fillText('✦ ADD ITEM RPG ✦', W / 2, M + 40)
    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(M + 24, M + 48);
    ctx.lineTo(W - M - 24, M + 48);
    ctx.stroke()

    const AX = M + 28 + 44,
        AY = M + 48 + 52,
        AR = 40
    ctx.save();
    ctx.strokeStyle = '#d4936b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3])
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 10, 0, Math.PI * 2);
    ctx.stroke();
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
        sakura(ctx, AX + (AR + 4) * Math.cos(a), AY + (AR + 4) * Math.sin(a), 5, sp, 0.9)
    }

    const IX = AX + AR + 20,
        IY = M + 62
    ctx.font = 'bold 18px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 5
    ctx.fillText(username.slice(0, 20), IX, IY + 16);
    ctx.shadowBlur = 0
    ctx.font = '10px SFRegular';
    ctx.fillStyle = '#9b6a43'
    ctx.fillText(`Item: ${emot} ${itemKey}`, IX, IY + 32)

    diamondRow(ctx, W / 2, M + 48 + 110, 7, 18, 4, '#c9956e')

    const cardY = M + 48 + 122
    const isAdd = jumlah > 0
    const cards = [{
            label: 'Sebelum',
            value: toRp(before),
            color: '#7a3e1a'
        },
        {
            label: isAdd ? '+ Ditambah' : '- Dikurangi',
            value: (isAdd ? '+' : '') + toRp(jumlah),
            color: isAdd ? '#2a6a2a' : '#8a1a1a'
        },
        {
            label: 'Sesudah',
            value: toRp(after),
            color: '#4a1e0a'
        },
    ]
    const CW = Math.floor((W - M * 2 - 20 - 16) / 3)
    const CH = 60

    cards.forEach((card, i) => {
        const cx = M + 10 + i * (CW + 8)
        rrp(ctx, cx, cardY, CW, CH, 10)
        const cg = ctx.createLinearGradient(cx, cardY, cx + CW, cardY + CH)
        if (i === 1 && isAdd) {
            cg.addColorStop(0, 'rgba(42,106,42,0.12)');
            cg.addColorStop(1, 'rgba(42,106,42,0.05)')
        } else if (i === 1 && !isAdd) {
            cg.addColorStop(0, 'rgba(138,26,26,0.12)');
            cg.addColorStop(1, 'rgba(138,26,26,0.05)')
        } else {
            cg.addColorStop(0, 'rgba(201,149,110,0.12)');
            cg.addColorStop(1, 'rgba(201,149,110,0.04)')
        }
        ctx.fillStyle = cg;
        ctx.fill()
        rrp(ctx, cx, cardY, CW, CH, 10)
        ctx.strokeStyle = i === 1 ? (isAdd ? 'rgba(42,106,42,0.5)' : 'rgba(138,26,26,0.4)') : '#c9956e'
        ctx.lineWidth = 1;
        ctx.stroke()

        ctx.font = '10px SFRegular';
        ctx.fillStyle = '#9b6a43';
        ctx.textAlign = 'center'
        ctx.fillText(card.label, cx + CW / 2, cardY + 18)
        ctx.font = 'bold 14px SFBold';
        ctx.fillStyle = card.color
        ctx.shadowColor = 'rgba(201,149,110,0.25)';
        ctx.shadowBlur = 4
        ctx.fillText(card.value, cx + CW / 2, cardY + 42);
        ctx.shadowBlur = 0
    })

    const footY = cardY + CH + 12
    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(M + 24, footY);
    ctx.lineTo(W - M - 24, footY);
    ctx.stroke()
    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.55)';
    ctx.textAlign = 'center'
    ctx.fillText(`${global.botname || 'Bot'}  ·  Z7:林企业`, W / 2, footY + 16)

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    })
}

const RPG_ITEMS = [
    'money', 'exp', 'limit', 'chip', 'atm', 'bank',
    'health', 'energy', 'potion', 'trash', 'wood', 'rock', 'string',
    'emerald', 'diamond', 'gold', 'iron', 'petfood', 'pet',
    'common', 'uncommon', 'mythic', 'legendary',
    'umpan', 'garam', 'minyak', 'gandum',
    'steak', 'ayam_goreng', 'ribs', 'roti', 'udang_goreng', 'bacon',
    'anggur', 'apel', 'jeruk', 'mangga', 'pisang', 'makanan',
    'bibitanggur', 'bibitapel', 'bibitjeruk', 'bibitmangga', 'bibitpisang',
    'horse', 'cat', 'fox', 'dog',
    'paus', 'kepiting', 'gurita', 'cumi', 'buntal',
    'dory', 'lumba', 'lobster', 'hiu', 'udang', 'orca', 'ikan',
    'banteng', 'gajah', 'harimau', 'kambing', 'panda',
    'buaya', 'kerbau', 'sapi', 'monyet', 'babihutan', 'babi', 'ayam',
    'ojek', 'polisi', 'roket', 'taxy',
    'sword', 'armor', 'pickaxe', 'fishingrod',
]

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    db
}) => {
    if (!text) return m.reply(
        `*Format:*\n${usedPrefix + command} @user|item|jumlah\n\n*Contoh:*\n${usedPrefix + command} @user|money|10000\n${usedPrefix + command} @user|diamond|50\n\n*List item:*\n${RPG_ITEMS.join(', ')}`
    )

    const parts = text.split('|').map(s => s.trim())
    if (parts.length < 3) return m.reply(`Format salah!\n${usedPrefix + command} @user|item|jumlah`)

    const [targetRaw, item, jumlahRaw] = parts
    const jumlah = parseInt(jumlahRaw)

    if (!RPG_ITEMS.includes(item.toLowerCase())) return m.reply(
        `Item *${item}* tidak valid!\n\n*List item:*\n${RPG_ITEMS.join(', ')}`
    )
    if (isNaN(jumlah) || jumlah === 0) return m.reply('Jumlah harus angka valid (boleh negatif untuk mengurangi)')

    let who
    if (m.isGroup) {
        who = m.mentions?.[0] || m.quoted?.sender ||
            (targetRaw.replace(/[^0-9]/g, '') ? targetRaw.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
    } else {
        who = targetRaw.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }
    if (!who || who === '@s.whatsapp.net') return m.reply('Tag, reply, atau masukkan nomor user yang valid.')

    who = conn.decodeJid(who)
    const user = db.data.users[who]
    if (!user) return m.reply('User belum terdaftar di database.')

    const itemKey = item.toLowerCase()
    const before = user[itemKey] || 0
    user[itemKey] = Math.max(0, before + jumlah)
    const after = user[itemKey]
    const emot = global.rpg?.emoticon?.(itemKey) ?? ''
    const uname = user.registered ? user.name : who.split('@')[0]

    try {
        const ppUrl = await conn.profilePictureUrl(who, 'image').catch(() => 'src/avatar_contact.png')
        const img = await generateAddItemCanvas({
            avatarURL: ppUrl,
            username: uname,
            itemKey,
            emot,
            before,
            after,
            jumlah
        })
        await conn.sendMessage(m.chat, {
            image: img,
            mimetype: 'image/jpeg',
            caption: `✅ *ADD ITEM RPG*\n👤 @${who.split('@')[0]}\n${emot} *${itemKey}* : ${toRp(before)} → ${toRp(after)}`,
            mentions: [who]
        }, {
            quoted: m
        })
    } catch (e) {
        console.error('[additem canvas]', e)
        m.reply(
            `✅ *ADD ITEM RPG*\n\n` +
            `👤 User: @${who.split('@')[0]}\n` +
            `📦 Item: ${emot} ${itemKey}\n` +
            `📊 Sebelum: ${toRp(before)}\n` +
            `${jumlah > 0 ? '➕' : '➖'} Jumlah: ${jumlah > 0 ? '+' : ''}${toRp(jumlah)}\n` +
            `📊 Sesudah: ${toRp(after)}`, {
                mentions: [who]
            }
        )
    }
}

handler.help = ['additem']
handler.tags = ['owner']
handler.command = ['additem', 'giveitem', 'setitem']
handler.owner = true
handler.register = true;
export default handler

const toRp = n => parseInt(n || 0).toLocaleString().replace(/,/g, '.')