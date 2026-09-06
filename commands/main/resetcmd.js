let handler = async (m, {
    db
}) => {
    let userData = db.data.users[m.sender]

    if (!userData?.sticker || Object.keys(userData.sticker).length === 0) {
        return m.reply('◦❒ *Tidak ada command stiker untuk direset*')
    }

    let total = Object.keys(userData.sticker).length

    userData.sticker = {} // 🔥 reset total
    db.data.users[m.sender] = userData; db.save()

    m.reply(`◦❒ *Berhasil reset command stiker*\n◦❒ Total dihapus : ${total}`)
}

handler.help = ['resetcmd']
handler.tags = ['main']
handler.command = /^resetcmd$/i
handler.premium = true
handler.register = true;

export default handler