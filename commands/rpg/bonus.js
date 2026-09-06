const toRupiah = n => parseInt(n).toLocaleString('id-ID').replace(/,/g, '.')

function msToTime(ms) {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor(ms / 60000) % 60
    const s = Math.floor(ms / 1000) % 60
    return `${h}j ${m}m ${s}d`
}

let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users[m.sender]
    if (!Number.isFinite(user.lastbonus)) user.lastbonus = 0

    const now = Date.now()
    const remaining = (user.lastbonus + 86400000) - now

    if (remaining > 0) {
        return await new AIRich(conn)
            .setTitle('🎁 ʙᴏɴᴜs ʜᴀʀɪᴀɴ')
            .addText(`⏳ Sudah ambil bonus hari ini!\nTunggu *${msToTime(remaining)}* lagi`)
            .addTable([
                ['Info', 'Status'],
                ['Cooldown', msToTime(remaining)],
                ['Reset', '24 jam sekali']
            ])
            .send(m.chat, {
                quoted: m
            })
    }

    const money = Math.floor(Math.random() * 50000000)
    user.money = (user.money || 0) + money
    user.lastbonus = now

    return await new AIRich(conn)
        .setTitle('🎁 ʙᴏɴᴜs ʜᴀʀɪᴀɴ')
        .addText('✅ Bonus berhasil diklaim!')
        .addTable([
            ['Reward', 'Jumlah', 'Total'],
            ['💰 Money', `+${toRupiah(money)}`, toRupiah(user.money)]
        ])
        .addText('_Klaim lagi dalam *24 jam* 🌸_')
        .send(m.chat, {
            quoted: m
        })
}

handler.help = ['bonus']
handler.tags = ['rpg', 'premium']
handler.command = /^(bonus)$/i
handler.register = true
handler.group = true
handler.premium = true
handler.rpg = true

export default handler