let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    try {
        if (args.length < 3) {
            return m.reply(`Format salah!

Contoh:
${usedPrefix + command} Theresa premium 30`)
        }

        const username = args[0]
        const role = args[1]
        const days = args[2]

        const url = global.API('theresav', '/user/set-role', {
            username: username,
            role: role,
            days: days
        }, 'apikey')

        const res = await fetch(url)
        const data = await res.json()

        if (!data) throw new Error("Tidak ada respon dari API")

        let hasil = `
✅ *SET ROLE BERHASIL*

👤 Username : ${username}
🎖️ Role     : ${role}
⏳ Durasi   : ${days} hari
📡 Status   : ${data.status || 'unknown'}
        `.trim()

        await conn.sendMessage(m.chat, {
            text: hasil
        }, {
            quoted: m
        })

    } catch (e) {
        console.error(e)
        m.reply(`Error: ${e.message}`)
    }
}

handler.help = ['setrole <username> <role> <days>']
handler.tags = ['owner']
handler.command = /^(setrole)$/i
handler.description = 'Set role user dari API (dynamic).'
handler.owner = true

handler.register = true

export default handler