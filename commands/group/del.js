let handler = async (m, {
    conn
}) => {
    if (!m.quoted) return m.reply('Reply pesan yang ingin dihapus!')
    try {
        await conn.sendMessage(m.chat, {
            delete: m.quoted.fakeObj.key
        })
    } catch (e) {
        console.error('[DELETE] Error:', e)
        m.reply('Gagal menghapus pesan. Pastikan bot adalah admin jika menghapus pesan orang lain.')
    }
}

handler.help = ['delete']
handler.tags = ['group']
handler.command = /^(d|del|delete|hapus)$/i
handler.group = true
handler.admin = true

handler.register = true

export default handler