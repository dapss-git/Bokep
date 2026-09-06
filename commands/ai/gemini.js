let handler = async (m, {
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Use example: ${usedPrefix}${command} hi`)
    }

    try {
        if (!global.db.data.gemini) global.db.data.gemini = {}

        const sender = m.sender

        if (!global.db.data.gemini[sender]) {
            global.db.data.gemini[sender] = ''
        }

        let chatId = global.db.data.gemini[sender]

        await m.reply('⏳ Please wait...')

        const request = async (id) => {
            const url = global.API('theresav', '/ai/gemini', {
                prompt: text,
                chatId: id
            }, 'apikey')

            const res = await fetch(url)
            return await res.json()
        }

        let data = await request(chatId)

        if (!data.status && /401/i.test(JSON.stringify(data))) {
            data = await request('')
        }

        if (!data.status) {
            return m.reply(`Error:\n${JSON.stringify(data, null, 2)}`)
        }

        if (data.chatId) {
            global.db.data.gemini[sender] = data.chatId
        }

        await m.reply(data.result)

    } catch (e) {
        console.error(e)
        m.reply(`An error occurred:\n${String(e)}`)
    }
}

handler.help = ['gemini <text>']
handler.tags = ['ai']
handler.command = /^(gemini)$/i
handler.description = 'Chat dengan Gemini AI'
handler.register = true
handler.limit = true

export default handler