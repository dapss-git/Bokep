import fs from 'fs'
let timeout = 60000
let money = 5000
let limit = 1

let handler = async (m, { conn, usedPrefix }) => {
    if (!conn.tebaklogo) conn.tebaklogo = {}
    let id = m.chat
    if (!(id in conn.tebaklogo)) {
        let src = JSON.parse(fs.readFileSync('./json/tebaklogo.json', 'utf-8'))
        let json = src[Math.floor(Math.random() * src.length)]
        let caption = `
*🎮 TEBAK LOGO 🎮*

📷 Logo: ${json.img}

📮 Deskripsi: ${json.deskripsi}

⏳ Timeout: *${(timeout / 1000).toFixed(2)} detik*
💬 Ketik ${usedPrefix}tebaklogohint untuk bantuan
➕ Bonus: ${money} Money
🎟️ Limit: ${limit} Limit

Logo apakah ini?
`.trim()
        conn.tebaklogo[id] = [
            await conn.reply(m.chat, caption, m),
            json, money, 4,
            setTimeout(() => {
                if (conn.tebaklogo[id]) {
                    conn.reply(m.chat, `⏰ Waktu habis!\n📑 Jawabannya adalah: *${json.jawaban}*`, conn.tebaklogo[id][0])
                    delete conn.tebaklogo[id]
                }
            }, timeout)
        ]
    } else conn.reply(m.chat, '*⚠️ Masih ada soal belum terjawab di chat ini!!*', conn.tebaklogo[id][0])
}

handler.help = ['tebaklogo', 'tebaklo']
handler.tags = ['game']
handler.command = /^(tebaklogo|tebaklo)$/i

handler.limit = true
handler.game = true
handler.onlyprem = true
handler.register = true

export default handler
