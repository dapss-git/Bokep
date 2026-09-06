const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (!text) {
        return m.reply(
            `Gunakan format:\n${usedPrefix + command} @user <jumlah>\n\nContoh:\n${usedPrefix + command} @user 3`
        )
    }

    let who =
        m.mentionedJid?.[0] ||
        m.quoted?.sender ||
        null

    if (!who) {
        let num = text.replace(/[^0-9]/g, '')
        if (num) who = num + '@s.whatsapp.net'
    }

    if (!who || who === '@s.whatsapp.net') {
        return m.reply('❌ User tidak valid. Gunakan tag / reply / nomor.')
    }

    const jumlahMatch = text.match(/\d+/g)
    const jumlah = jumlahMatch ?
        parseInt(jumlahMatch[jumlahMatch.length - 1]) :
        NaN

    if (isNaN(jumlah) || jumlah < 1) {
        return m.reply('⚠️ Jumlah minimal 1.')
    }

    who = conn.decodeJid(who)

    global.db.data.users[who] = global.db.data.users[who] || {}
    global.db.data.users[who].life = global.db.data.users[who].life || {}
    global.db.data.users[who].life.gamepas = global.db.data.users[who].life.gamepas || 0

    global.db.data.users[who].life.gamepas += jumlah

    await global.db.save()

    const nama = await conn.getName(who)

    return m.reply(
        `✅ Berhasil menambahkan ${jumlah} gamepass ke ${nama}\n\n` +
        `💳 Total gamepass: ${global.db.data.users[who].life.gamepas}`, {
            mentions: [who]
        }
    )
}

handler.command = ['addgamepass']
handler.tags = ['owner']
handler.description = 'Menambahkan gamepass ke user'
handler.owner = true
handler.register = true

export default handler