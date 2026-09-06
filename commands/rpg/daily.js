const COOLDOWN = 24 * 60 * 60 * 1000

function msToTime(ms) {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor(ms / 60000) % 60
    const s = Math.floor(ms / 1000) % 60
    return `${h}j ${m}m ${s}d`
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

const toRupiah = n => parseInt(n).toLocaleString('id-ID').replace(/,/g, '.')

let handler = async (m, {
    conn,
    user,
    isOwner,
    isPremium,
    usedPrefix
}) => {
    if (!Number.isFinite(user.lastclaim)) user.lastclaim = 0

    const now = Date.now()
    const remaining = (user.lastclaim + COOLDOWN) - now

    if (remaining > 0) {
        return await new AIRich(conn)
            .setTitle('🔖 ᴄʟᴀɪᴍ ᴅᴀɪʟʏ')
            .addText(`⏳ Sudah klaim hari ini!\nTunggu *${msToTime(remaining)}* lagi`)
            .addTable([
                ['Info', 'Status'],
                ['Cooldown', msToTime(remaining)],
                ['Klaim lagi', '24 jam sekali']
            ])
            .send(m.chat, {
                quoted: m
            })
    }

    const limitReward = randInt(50, 100)
    const expReward = randInt(5000, 15000)
    const moneyReward = randInt(2000, 8000)
    const potionReward = randInt(3, 8)

    user.limit = (user.limit || 0) + limitReward
    user.exp = (user.exp || 0) + expReward
    user.money = (user.money || 0) + moneyReward
    user.potion = (user.potion || 0) + potionReward
    user.lastclaim = now

    return await new AIRich(conn)
        .setTitle('🔖 ᴄʟᴀɪᴍ ᴅᴀɪʟʏ')
        .addText('✅ Reward berhasil diklaim!')
        .addTable([
            ['Reward', 'Jumlah', 'Total'],
            ['🎫 Limit', `+${toRupiah(limitReward)}`, toRupiah(user.limit)],
            ['✨ EXP', `+${toRupiah(expReward)}`, toRupiah(user.exp)],
            ['💰 Money', `+${toRupiah(moneyReward)}`, toRupiah(user.money)],
            ['🥤 Potion', `+${potionReward}`, String(user.potion)]
        ])
        .addText('_Klaim lagi dalam *24 jam* 🌸_')
        .send(m.chat, {
            quoted: m
        })
}

handler.help = ['claim']
handler.tags = ['rpg']
handler.command = /^(daily|claim)$/i
handler.register = true
handler.group = true
handler.rpg = true

export default handler