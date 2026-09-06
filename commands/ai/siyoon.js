const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Silakan berikan teks yang ingin direspon oleh Siyoon.\nContoh: ${usedPrefix + command} Apa kabar?`)
    }

    try {
        global.loading(m, conn)

        if (!global.db.data.siyoon) global.db.data.siyoon = {}

        const sender = m.sender

        if (!global.db.data.siyoon[sender]) {
            global.db.data.siyoon[sender] = sender
        }

        const chatId = global.db.data.siyoon[sender]

        const url = global.API('theresav', '/ai/siyoon', {
            text,
            chatId
        }, 'apikey')

        const res = await fetch(url)
        const data = await res.json()

        global.loading(m, conn, true)

        if (data.status) {
            await conn.sendMessage(m.chat, {
                text: data.result
            }, {
                quoted: m
            })
        } else {
            m.reply(`Terjadi kesalahan:\n${JSON.stringify(data, null, 2)}`)
        }

    } catch (e) {
        global.loading(m, conn, true)
        console.error(e)

        m.reply(`Terjadi kesalahan!\n\n${String(e)}`)
    }
}

handler.help = ['siyoon <text>']
handler.tags = ['ai']
handler.command = /^(siyoon)$/i
handler.description = 'Chat dengan Siyoon AI'
handler.register = true

export default handler