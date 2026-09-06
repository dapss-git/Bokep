let handler = async (m, {
    conn
}) => {
    try {

        await conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        })

        const url = API(
            'theresav',
            '/nsfw/cum', {},
            'apikey'
        )

        const res = await fetch(url)

        if (!res.ok) {
            throw 'Gagal mengambil image'
        }

        const buffer = Buffer.from(
            await res.arrayBuffer()
        )

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: global.botname
        }, {
            quoted: m
        })

        await conn.sendMessage(m.chat, {
            react: {
                text: '✅',
                key: m.key
            }
        })

    } catch (e) {

        console.error(e)

        await conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        })

        m.reply(
            `❌ ${e.message || e}`
        )

    }
}

handler.help = ['cum']
handler.tags = ['nsfw']
handler.command = /^(cum)$/i
handler.premium = true
handler.nsfw = true
handler.register = true
handler.limit = true

export default handler