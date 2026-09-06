const handler = async (m, { conn, db, Func }) => {
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
    let user = db.data.users[who]
    if (!user) return m.reply('❌ Pengguna tidak ditemukan di database.')

    let caption = `*B A L A N C E  U S E R*\n\n`
    caption += `◦ Nama: ${user.name || conn.getName(who)}\n`
    caption += `◦ Saldo: Rp ${Func.formatNumber(user.saldo || 0)}\n`
    caption += `◦ Limit: ${user.limit || 0}\n\n`
    caption += `Gunakan *.deposit* untuk mengisi saldo.`

    m.reply(caption)
}

handler.help = ['saldo', 'balance']
handler.tags = ['main', 'topup']
handler.command = ['saldo', 'balance', 'cekbalance']
handler.register = true

export default handler
