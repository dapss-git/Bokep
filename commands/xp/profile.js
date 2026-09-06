import fs from 'fs'
import moment from 'moment-timezone'
import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas'
const _fontCache = new Set()
const _fontBase = 'https://raw.githubusercontent.com/Blckrose2/font2/main/'
async function loadFont(filename, alias) {
    if (_fontCache.has(alias)) return
    const res = await fetch(_fontBase + encodeURIComponent(filename))
    if (!res.ok) throw new Error(`Font not found: ${filename}`)
    GlobalFonts.register(Buffer.from(await res.arrayBuffer()), alias)
    _fontCache.add(alias)
}

const num = n => parseInt(n || 0).toLocaleString().replace(/,/g, '.')
const trunc = (s, n) => {
    const t = String(s ?? '-');
    return t.length > n ? t.slice(0, n) + '…' : t
}
const date = ts => new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
})
const ago = ts => {
    const d = Date.now() - ts
    if (d < 60000) return Math.floor(d / 1000) + 'd lalu'
    if (d < 3600000) return Math.floor(d / 60000) + 'm lalu'
    if (d < 86400000) return Math.floor(d / 3600000) + 'j lalu'
    return Math.floor(d / 86400000) + 'hr lalu'
}

function rr(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

function glass(ctx, x, y, w, h, r = 14, fillA = 0.06, strokeA = 0.12) {
    rr(ctx, x, y, w, h, r)
    const g = ctx.createLinearGradient(x, y, x, y + h)
    g.addColorStop(0, `rgba(255,255,255,${fillA+0.02})`)
    g.addColorStop(1, `rgba(255,255,255,${Math.max(0,fillA-0.02)})`)
    ctx.fillStyle = g;
    ctx.fill()
    ctx.strokeStyle = `rgba(255,255,255,${strokeA})`;
    ctx.lineWidth = 1;
    ctx.stroke()
}

function bar(ctx, x, y, w, h, pct, c1, c2, glow = true) {
    rr(ctx, x, y, w, h, h / 2)
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill()
    const fw = Math.max(h, w * Math.min(1, Math.max(0, pct)))
    const g = ctx.createLinearGradient(x, 0, x + fw, 0)
    g.addColorStop(0, c1);
    g.addColorStop(1, c2)
    rr(ctx, x, y, fw, h, h / 2)
    ctx.fillStyle = g;
    ctx.fill()
    if (glow) {
        ctx.save();
        ctx.shadowColor = c2;
        ctx.shadowBlur = 14
        rr(ctx, x, y, fw, h, h / 2)
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fill()
        ctx.restore()
    }
}

function heading(ctx, text, x, y, w, color) {
    ctx.font = 'bold 10px SFBold'
    ctx.fillStyle = color + 'dd'
    ctx.textAlign = 'left'
    ctx.fillText(text, x, y)
    const g = ctx.createLinearGradient(x, 0, x + w, 0)
    g.addColorStop(0, color + '99');
    g.addColorStop(1, 'transparent')
    ctx.strokeStyle = g;
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x + w, y + 5);
    ctx.stroke()
}

function tile(ctx, x, y, w, h, icon, label, val, accent) {
    glass(ctx, x, y, w, h, 10, 0.055)
    rr(ctx, x, y, w, 3, 1)
    ctx.fillStyle = accent;
    ctx.fill()
    ctx.font = '16px Emoji'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff'
    ctx.fillText(icon, x + w / 2, y + 22)
    ctx.font = 'bold 13px SFBold'
    ctx.fillStyle = '#ede9fe'
    ctx.fillText(trunc(String(val ?? '-'), 12), x + w / 2, y + 40)
    ctx.font = '9px SFRegular'
    ctx.fillStyle = 'rgba(200,190,240,0.45)'
    ctx.fillText(label.toUpperCase(), x + w / 2, y + 53)
}

function row(ctx, x, y, w, icon, label, val, accent) {
    ctx.font = '12px SFRegular, Emoji'
    ctx.fillStyle = 'rgba(180,170,220,0.5)'
    ctx.textAlign = 'left'
    ctx.fillText(icon + '  ' + label, x, y)
    ctx.font = 'bold 12px SFMedium'
    ctx.fillStyle = accent
    ctx.textAlign = 'right'
    ctx.fillText(trunc(String(val ?? '-'), 20), x + w, y)
}

const handler = async (m, {
    conn
}) => {
    try {
        await global.loading(m, conn)

        await loadFont('SFPRODISPLAYBOLD.OTF', 'SFBold')
        await loadFont('SFPRODISPLAYMEDIUM.OTF', 'SFMedium')
        await loadFont('SFPRODISPLAYREGULAR.OTF', 'SFRegular')
        await loadFont('NotoColorEmoji-Regular.ttf', 'Emoji')

        const u = global.db.data.users[m.sender]
        if (!u) return m.reply('❌ Pengguna tidak ada di database.')

        const isOwner = m.fromMe || global.owner.map(([n]) => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isPrem = isOwner || (u.premium?.status && Date.now() < u.premium?.expired)
        const tier = isOwner ? 'OWNER' : isPrem ? 'PREMIUM' : u.level > 999 ? 'ELITE' : 'FREE'
        const tC = {
            OWNER: '#f59e0b',
            PREMIUM: '#c084fc',
            ELITE: '#f87171',
            FREE: '#64748b'
        } [tier]
        const tE = {
            OWNER: '👑',
            PREMIUM: '💎',
            ELITE: '⚔️',
            FREE: '🔰'
        } [tier]

        const name = u.name || conn.getName(m.sender) || m.sender.split('@')[0]
        const bio = await conn.fetchStatus(m.sender).catch(() => null)
        const bioText = bio?.status || ''
        const lifeAbout = u.life?.about || ''

        const ppBuf = await conn.profilePictureUrl(m.sender, 'image')
            .then(url => fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 Chrome/124'
                    }
                })
                .then(r => r.arrayBuffer()).then(b => Buffer.from(b)))
            .catch(() => fs.readFileSync('./src/avatar_contact.png'))

        const maxExp = u.level * 38 + 38
        const xpPct = Math.min(1, u.exp / Math.max(1, maxExp))
        const lifeMaxExp = 1000
        const lifePct = Math.min(1, (u.life?.exp || 0) / lifeMaxExp)

        
        const pets = []
        if (u.horse) pets.push({
            e: '🐴',
            n: 'Kuda',
            lv: u.horse,
            xp: u.horseexp
        })
        if (u.cat) pets.push({
            e: '🐱',
            n: 'Kucing',
            lv: u.cat,
            xp: u.catexp
        })
        if (u.fox) pets.push({
            e: '🦊',
            n: 'Rubah',
            lv: u.fox,
            xp: u.foxexp
        })
        if (u.dog) pets.push({
            e: '🐶',
            n: 'Anjing',
            lv: u.dog,
            xp: u.dogexp
        })
        if (u.robo) pets.push({
            e: '🤖',
            n: 'Robot',
            lv: u.robo,
            xp: u.roboexp
        })

        const W = 1020,
            H = 920
        const canvas = createCanvas(W, H)
        const ctx = canvas.getContext('2d')

        
        ctx.fillStyle = '#07050f';
        ctx.fillRect(0, 0, W, H)
        const bgG = ctx.createLinearGradient(0, 0, W, H)
        bgG.addColorStop(0, '#0f0820');
        bgG.addColorStop(0.5, '#09061a');
        bgG.addColorStop(1, '#05030e')
        ctx.fillStyle = bgG;
        ctx.fillRect(0, 0, W, H)

        
        ;
        [
            [180, -50, 320, 'rgba(109,40,217,0.20)'],
            [W + 40, H * 0.4, 280, 'rgba(29,78,216,0.16)'],
            [W * 0.55, -40, 220, 'rgba(192,38,211,0.11)'],
            [W * 0.15, H * 0.9, 200, 'rgba(6,182,212,0.08)'],
            [W * 0.8, H * 0.75, 180, 'rgba(245,158,11,0.06)'],
        ].forEach(([cx, cy, r, c]) => {
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
            g.addColorStop(0, c);
            g.addColorStop(1, 'transparent')
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill()
        })

        // Dot grid
        ctx.fillStyle = 'rgba(255,255,255,0.018)'
        for (let x = 28; x < W; x += 44)
            for (let y = 28; y < H; y += 44) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill()
            }

        
        const topG = ctx.createLinearGradient(0, 0, W, 0)
        topG.addColorStop(0, 'transparent');
        topG.addColorStop(0.3, tC + '77')
        topG.addColorStop(0.7, tC + '55');
        topG.addColorStop(1, 'transparent')
        ctx.fillStyle = topG;
        ctx.fillRect(0, 0, W, 3)

        const LX = 28,
            LY = 28,
            LW = 268,
            LH = H - 56
        glass(ctx, LX, LY, LW, LH, 22, 0.05, 0.09)

        
        const AX = LX + LW / 2,
            AY = LY + 140,
            AR = 70
        const halo = ctx.createRadialGradient(AX, AY, 0, AX, AY, 110)
        halo.addColorStop(0, tC + '44');
        halo.addColorStop(1, 'transparent')
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(AX, AY, 110, 0, Math.PI * 2);
        ctx.fill()

        ctx.save();
        ctx.shadowColor = tC;
        ctx.shadowBlur = 28
        ctx.strokeStyle = tC;
        ctx.lineWidth = 3
        ctx.beginPath();
        ctx.arc(AX, AY, AR + 7, 0, Math.PI * 2);
        ctx.stroke()
        ctx.restore()
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1
        ctx.beginPath();
        ctx.arc(AX, AY, AR + 16, 0, Math.PI * 2);
        ctx.stroke()

        
        ctx.save()
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.clip()
        ctx.drawImage(await loadImage(ppBuf), AX - AR, AY - AR, AR * 2, AR * 2)
        ctx.restore()

        
        const bTxt = tE + ' ' + tier
        ctx.font = 'bold 10px SFBold'
        const bW = ctx.measureText(bTxt).width + 22
        rr(ctx, AX - bW / 2, AY + AR + 8, bW, 21, 10)
        ctx.fillStyle = tC + '2a';
        ctx.fill()
        ctx.strokeStyle = tC + 'bb';
        ctx.lineWidth = 1;
        ctx.stroke()
        ctx.fillStyle = tC;
        ctx.textAlign = 'center'
        ctx.fillText(bTxt, AX, AY + AR + 22)

        
        ctx.font = 'bold 21px SFBold, Emoji'
        ctx.fillStyle = '#f5f0ff';
        ctx.textAlign = 'center'
        ctx.shadowColor = tC + '88';
        ctx.shadowBlur = 14
        ctx.fillText(trunc(name, 16), AX, AY + AR + 52);
        ctx.shadowBlur = 0

        
        if (u.life?.waifu) {
            ctx.font = '11px SFRegular, Emoji'
            ctx.fillStyle = 'rgba(248,113,113,0.7)'
            ctx.fillText('❤️ ' + trunc(u.life.waifu, 20), AX, AY + AR + 68)
        }

        ctx.font = '11px SFMedium'
        ctx.fillStyle = 'rgba(167,139,250,0.7)'
        ctx.fillText(trunc(u.role || '', 22), AX, AY + AR + (u.life?.waifu ? 86 : 70))


        ctx.font = '10px SFRegular'
        ctx.fillStyle = 'rgba(148,163,184,0.55)'
        ctx.fillText('+' + m.sender.split('@')[0], AX, AY + AR + 100)

       
        const aboutText = lifeAbout || bioText
        if (aboutText) {
            ctx.font = '10px SFRegular, Emoji'
            ctx.fillStyle = 'rgba(148,163,184,0.42)'
            const maxLineW = LW - 40,
                lineH = 14
            let words = aboutText.split(' '),
                line = '',
                lineY = AY + AR + 118,
                maxY = AY + AR + 162
            for (const w of words) {
                const test = line ? line + ' ' + w : w
                if (ctx.measureText(test).width > maxLineW) {
                    if (lineY >= maxY) {
                        ctx.fillText(line + '…', AX, lineY);
                        break
                    }
                    ctx.fillText(line, AX, lineY);
                    line = w;
                    lineY += lineH
                } else line = test
            }
            if (line && lineY <= maxY) ctx.fillText(line, AX, lineY)
        }

        // Divider
        let divY = AY + AR + 172
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1
        ctx.beginPath();
        ctx.moveTo(LX + 20, divY);
        ctx.lineTo(LX + LW - 20, divY);
        ctx.stroke()

        // Info rows
        const rows_data = [
            ['🎂', 'Umur', u.age ? u.age + ' tahun' : '-', '#fbbf24'],
            ['📅', 'Daftar', u.registered ? date(u.regTime) : 'Belum', '#34d399'],
            ['🪪', 'SN', u.sn || '-', '#60a5fa'],
            ['✅', 'Verifikasi', u.verif ? 'Ya' : 'Belum', '#a78bfa'],
            ['⚠️', 'Warn', u.warn || 0, '#f87171'],
            ['💕', 'Pacar', u.pacar ? '@' + u.pacar.split('@')[0] : '-', '#f472b6'],
            ['💰', 'Money', num(u.money), '#34d399'],
            ['🏦', 'Bank', num(u.bank), '#60a5fa'],
            ['🎯', 'Limit', num(u.limit), '#fb923c'],
            ['💳', 'Saldo', num(u.saldo), '#c084fc'],
        ]
        rows_data.forEach(([icon, label, val, accent], i) => {
            row(ctx, LX + 22, divY + 18 + i * 26, LW - 44, icon, label, val, accent)
        })

        // Life XP bar
        const lifeBarY = divY + 18 + rows_data.length * 26 + 8
        ctx.font = '9px SFRegular'
        ctx.fillStyle = 'rgba(248,113,113,0.5)'
        ctx.textAlign = 'left'
        ctx.fillText('LIFE EXP  ' + num(u.life?.exp || 0), LX + 22, lifeBarY)
        bar(ctx, LX + 22, lifeBarY + 6, LW - 44, 7, lifePct, '#f43f5e', '#fb7185')

       
        const xpBarY = lifeBarY + 22
        ctx.font = '9px SFRegular'
        ctx.fillStyle = 'rgba(167,139,250,0.5)'
        ctx.textAlign = 'left'
        ctx.fillText('XP  ' + num(u.exp) + ' / ' + num(maxExp), LX + 22, xpBarY)
        ctx.textAlign = 'right'
        ctx.fillStyle = 'rgba(167,139,250,0.5)'
        ctx.fillText('LVL ' + num(u.level), LX + LW - 22, xpBarY)
        bar(ctx, LX + 22, xpBarY + 6, LW - 44, 7, xpPct, '#7c3aed', '#c084fc')
        ctx.font = '9px SFRegular'
        ctx.fillStyle = 'rgba(148,163,184,0.4)'
        ctx.textAlign = 'center'
        ctx.fillText(Math.floor(xpPct * 100) + '% menuju level berikutnya', AX, xpBarY + 24)

       
        if (pets.length) {
            const petY = xpBarY + 36
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1
            ctx.beginPath();
            ctx.moveTo(LX + 20, petY);
            ctx.lineTo(LX + LW - 20, petY);
            ctx.stroke()
            heading(ctx, 'PELIHARAAN', LX + 22, petY + 14, LW - 44, '#34d399')
            pets.forEach((p, i) => {
                const px = LX + 22 + i * (LW - 44) / pets.length
                ctx.font = '18px Emoji';
                ctx.textAlign = 'left'
                ctx.fillStyle = '#fff';
                ctx.fillText(p.e, px, petY + 34)
                ctx.font = '9px SFRegular';
                ctx.fillStyle = 'rgba(200,220,200,0.5)'
                ctx.fillText('Lv.' + p.lv, px, petY + 48)
            })
        }

        
        const RX = LX + LW + 18,
            RY = LY,
            RW = W - RX - 28

        const COLS = 5,
            GAP = 8
        const TW = (RW - GAP * (COLS - 1)) / COLS,
            TH = 68

        const drawTiles = (tiles, startY) => tiles.forEach(([e, l, v, c], i) => {
            const col = i % COLS,
                row2 = Math.floor(i / COLS)
            tile(ctx, RX + col * (TW + GAP), startY + row2 * (TH + GAP), TW, TH, e, l, v, c)
        })

        let curY = RY + 10
        heading(ctx, 'EKONOMI', RX, curY + 10, RW, '#34d399');
        curY += 22
        drawTiles([
            ['💸', 'Money', num(u.money), '#34d399'],
            ['🏦', 'Bank', num(u.bank), '#60a5fa'],
            ['🎰', 'Chip', num(u.chip), '#a78bfa'],
            ['💳', 'Saldo', num(u.saldo), '#f472b6'],
            ['🏧', 'ATM', num(u.atm), '#fb923c'],
            ['💹', 'Invest', Object.keys(u.invest || {}).length + '🪙', '#fbbf24'],
            ['📊', 'Saham', Object.keys(u.saham || {}).length + '📈', '#22d3ee'],
            ['🎁', 'Donasi', num(u.donasi), '#f87171'],
            ['💰', 'Deposit', num(u.deposit), '#84cc16'],
            ['🎯', 'GamePass', num(u.life?.gamepas || 0), '#c084fc'],
        ], curY);
        curY += 2 * TH + 2 * GAP + 18

        heading(ctx, 'RPG STATS', RX, curY + 10, RW, '#60a5fa');
        curY += 22
        drawTiles([
            ['❤️', 'HP', u.health + '/100', '#f43f5e'],
            ['⚡', 'Energy', u.energy + '/100', '#a3e635'],
            ['😴', 'Sleep', u.sleep + '/100', '#818cf8'],
            ['🧪', 'Potion', num(u.potion), '#c084fc'],
            ['🎥', 'Konten', num(u.konten), '#fb923c'],
            ['⭐', 'Follower', num(u.follower), '#fbbf24'],
            ['💬', 'Chat', num(u.chatTotal), '#22d3ee'],
            ['🔧', 'CMD Total', num(u.commandTotal), '#94a3b8'],
            ['⚠️', 'Warn', u.warn || 0, '#f87171'],
            ['🚗', 'Ojek', num(u.ojek), '#34d399'],
        ], curY);
        curY += 2 * TH + 2 * GAP + 18

        heading(ctx, 'EQUIPMENT', RX, curY + 10, RW, '#ef4444');
        curY += 22
        drawTiles([
            ['⚔️', 'Armor', u.armor ? 'Lv.' + u.armor + ' (' + u.armordurability + '🛡)' : 'None', '#ef4444'],
            ['🗡️', 'Sword', u.sword ? 'Lv.' + u.sword + ' (' + u.sworddurability + '⚡)' : 'None', '#f97316'],
            ['⛏️', 'Pickaxe', u.pickaxe ? 'Lv.' + u.pickaxe + ' (' + u.pickaxedurability + ')' : 'None', '#eab308'],
            ['🎣', 'Fish Rod', u.fishingrod ? 'Lv.' + u.fishingrod + ' (' + u.fishingroddurability + ')' : 'None', '#22d3ee'],
            ['🤖', 'Robo', u.robo ? 'Lv.' + u.robo + ' (' + u.robodurability + '🔋)' : 'None', '#94a3b8'],
        ], curY);
        curY += TH + GAP + 18

        
        heading(ctx, 'MATERIAL', RX, curY + 10, RW, '#eab308');
        curY += 22
        drawTiles([
            ['🪵', 'Kayu', num(u.wood), '#a16207'],
            ['🪨', 'Batu', num(u.rock), '#6b7280'],
            ['💎', 'Diamond', num(u.diamond), '#22d3ee'],
            ['🥇', 'Gold', num(u.gold), '#f59e0b'],
            ['💚', 'Emerald', num(u.emerald), '#10b981'],
            ['🔩', 'Iron', num(u.iron), '#94a3b8'],
            ['🧵', 'String', num(u.string), '#f472b6'],
            ['🍶', 'Botol', num(u.botol), '#60a5fa'],
            ['📦', 'Kardus', num(u.kardus), '#fb923c'],
            ['🥫', 'Kaleng', num(u.kaleng), '#34d399'],
        ], curY);
        curY += 2 * TH + 2 * GAP + 18

        
        heading(ctx, 'INVENTORY', RX, curY + 10, RW, '#84cc16');
        curY += 22
        drawTiles([
            ['🍎', 'Apel', num(u.apel), '#ef4444'],
            ['🍇', 'Anggur', num(u.anggur), '#a855f7'],
            ['🍊', 'Jeruk', num(u.jeruk), '#f97316'],
            ['🥭', 'Mangga', num(u.mangga), '#f59e0b'],
            ['🍌', 'Pisang', num(u.pisang), '#fbbf24'],
            ['🌾', 'Gandum', num(u.gandum), '#84cc16'],
            ['🧂', 'Garam', num(u.garam), '#e2e8f0'],
            ['🛢️', 'Minyak', num(u.minyak), '#ca8a04'],
            ['🍖', 'Ribs', num(u.ribs), '#dc2626'],
            ['🍗', 'Ayam', num(u.ayam_goreng), '#f97316'],
        ], curY);
        curY += 2 * TH + 2 * GAP + 18

        heading(ctx, 'HEWAN LAUT', RX, curY + 10, RW, '#38bdf8');
        curY += 22
        drawTiles([
            ['🐟', 'Ikan', num(u.ikan), '#38bdf8'],
            ['🦞', 'Lobster', num(u.lobster), '#ef4444'],
            ['🦐', 'Udang', num(u.udang), '#fb923c'],
            ['🐙', 'Gurita', num(u.gurita), '#a855f7'],
            ['🦑', 'Cumi', num(u.cumi), '#818cf8'],
            ['🐡', 'Buntal', num(u.buntal), '#fbbf24'],
            ['🐳', 'Paus', num(u.paus), '#60a5fa'],
            ['🐬', 'Lumba', num(u.lumba), '#22d3ee'],
            ['🦈', 'Hiu', num(u.hiu), '#94a3b8'],
            ['🦀', 'Kepiting', num(u.kepiting), '#f87171'],
        ], curY);
        curY += 2 * TH + 2 * GAP + 18

        
        if (curY + TH + 40 < H - 30) {
            heading(ctx, 'HEWAN DARAT', RX, curY + 10, RW, '#a3e635');
            curY += 22
            drawTiles([
                ['🐂', 'Banteng', num(u.banteng), '#ef4444'],
                ['🐘', 'Gajah', num(u.gajah), '#94a3b8'],
                ['🐯', 'Harimau', num(u.harimau), '#f97316'],
                ['🐐', 'Kambing', num(u.kambing), '#e2e8f0'],
                ['🐼', 'Panda', num(u.panda), '#f5f5f5'],
                ['🐊', 'Buaya', num(u.buaya), '#4ade80'],
                ['🐃', 'Kerbau', num(u.kerbau), '#6b7280'],
                ['🐄', 'Sapi', num(u.sapi), '#fbbf24'],
                ['🐒', 'Monyet', num(u.monyet), '#a16207'],
                ['🐗', 'Babi', num(u.babi), '#f472b6'],
            ], curY)
        }

       
        const footY = H - 22
        const footG = ctx.createLinearGradient(0, 0, W, 0)
        footG.addColorStop(0, 'transparent');
        footG.addColorStop(0.25, tC + '44')
        footG.addColorStop(0.75, tC + '33');
        footG.addColorStop(1, 'transparent')
        ctx.strokeStyle = footG;
        ctx.lineWidth = 1
        ctx.beginPath();
        ctx.moveTo(28, footY - 8);
        ctx.lineTo(W - 28, footY - 8);
        ctx.stroke()

        ctx.font = '10px SFRegular'
        ctx.fillStyle = 'rgba(100,116,139,0.4)'
        ctx.textAlign = 'left'
        ctx.fillText('🌸 Apocalypse Bot  •  Profile Card  •  ID: ' + (u.life?.id || '-'), 36, footY + 3)
        ctx.textAlign = 'right'
        ctx.fillText(moment.tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm') + ' WIB', W - 36, footY + 3)

        const buf = canvas.toBuffer('image/jpeg', {
            quality: 96
        })
        await conn.sendFile(m.chat, buf, 'profile.jpg', '', m, false, {
            contextInfo: {
                mentionedJid: [m.sender, u.pacar].filter(Boolean)
            }
        })

    } catch (e) {
        throw e
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ['profile']
handler.tags = ['xp']
handler.command = /^(profile|profil|me)$/i
handler.register = true;
export default handler