import axios from 'axios'

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    user
}) => {
    if (!text) return m.reply(`Gunakan format: ${usedPrefix + command} on/off`)

    if (text === 'on') {
        user.autoai = true
        user.autoaiChatId = ""
        m.reply('Auto AI berhasil diaktifkan. Session AI telah direset.')
    } else if (text === 'off') {
        user.autoai = false
        m.reply('Auto AI berhasil dinonaktifkan.')
    } else {
        m.reply(`Gunakan format: ${usedPrefix + command} on/off`)
    }
}

handler.onMessage = async (m, {
    conn,
    user
}) => {
    if (!user.autoai || m.fromMe || m.isBot || !m.text || m.isCommand) return

    const prefix = /^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text)
    if (prefix) return

    try {
        global.loading(m, conn)

        const about = user.life?.about || ''
        if (!about.trim()) {
            global.loading(m, conn, true)

            const gender = (user.life?.gender || '').toLowerCase()
            const cmd = gender === 'pria' || gender === 'male' ? '.setwaifu' : '.sethusbu'

            return await conn.sendMessage(
                m.chat, {
                    text: `Silakan set prompt/kepribadian AI kamu terlebih dahulu menggunakan perintah ${cmd} agar Auto AI bisa mengenali karakter yang kamu inginkan.`
                }, {
                    quoted: m
                }
            )
        }

        const charName = user.life?.waifu || user.life?.husbu || 'karakter anime ini';
        const prompt = `Berperanlah sepenuhnya sebagai karakter anime bernama ${charName}. Berikut adalah latar belakang dan sifatmu:\n${about}\n\nJangan pernah mengakui dirimu sebagai AI, asisten, atau bot. Jawablah sesuai kepribadian karakter ini. Gunakan Bahasa Indonesia.`;

        const chatId = user.autoaiChatId || ''

        const url = global.API('theresav', '/ai/feelbetter', {
            text: m.text,
            prompt,
            chatId
        }, 'apikey')

        const res = await axios.get(url)

        if (res.data && res.data.status) {
            if (res.data.chatId) user.autoaiChatId = res.data.chatId

            global.loading(m, conn, true)

            await conn.sendMessage(
                m.chat, {
                    text: res.data.result
                }, {
                    quoted: m
                }
            )
        } else {
            global.loading(m, conn, true)
        }

    } catch (e) {
        global.loading(m, conn, true)
        console.error('Error in Auto AI:', e)
    }
}

handler.help = ['autoai <on/off>']
handler.tags = ['ai']
handler.command = /^(autoai)$/i
handler.register = true

export default handler