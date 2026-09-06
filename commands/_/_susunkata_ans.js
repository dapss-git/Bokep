import similarity from 'similarity'
const threshold = 0.72

export async function before(m, { conn }) {
    let id = m.chat
    if (m.isBaileys || m.fromMe) return
    if (!conn.susunkata) conn.susunkata = {}
    if (!(id in conn.susunkata)) return !0

    const room = conn.susunkata[id]

    if (!m.quoted || !m.quoted.fromMe) return !0

    const soalId = room[0]?.key?.id
    const hintId = room[5]?.key?.id

    const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
    if (!isReplyValid) return !0

    if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return !0

    const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
    const setting = global.db.data.settings[botJidKey] || {}
    if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
    if (setting.autoread) await conn.readMessages([m.key])

    const json = room[1]
    const jawaban = json.jawaban.toLowerCase().trim()
    const teks = m.text.toLowerCase().trim()

    if (teks === jawaban) {
        global.db.data.users[m.sender].money += room[2]
        global.db.data.users[m.sender].limit += 1
        m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
        clearTimeout(room[4])
        delete conn.susunkata[id]
    } else if (similarity(teks, jawaban) >= threshold) {
        m.reply(`*Dikit Lagi!*`)
    } else if (--room[3] == 0) {
        clearTimeout(room[4])
        delete conn.susunkata[id]
        conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
    } else {
        m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
    }

    return !0
}
export const exp = 0


