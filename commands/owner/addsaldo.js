const handler = async (m, { conn, text, usedPrefix, command, db }) => {
    let who = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : null
    let amountStr = ''

    if (m.quoted) {
        amountStr = text.trim()
    } else {
        let [userPart, pricePart] = text.split(' ')
        if (!who) who = userPart?.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        amountStr = pricePart
    }

    if (!who || !amountStr) return m.reply(`*Contoh Penggunaan:*\n\n1. Balas pesan user: *${usedPrefix + command} 10000*\n2. Tag user: *${usedPrefix + command} @user 10000*`)
    
    let user = db.data.users[who]
    if (!user) return m.reply('❌ Pengguna tidak ditemukan di database.')
    
    let amount = parseInt(amountStr)
    if (isNaN(amount)) return m.reply('❌ Nominal harus berupa angka.')
    
    user.saldo = (user.saldo || 0) + amount
    m.reply(`✅ Berhasil menambahkan saldo sebesar *Rp ${amount.toLocaleString('id-ID')}* ke @${who.split('@')[0]}`, null, { mentions: [who] })
}

handler.help = ['addsaldo <@user> <nominal>']
handler.tags = ['owner']
handler.command = ['addsaldo', 'setsaldo']
handler.owner = true

handler.register = true

export default handler
