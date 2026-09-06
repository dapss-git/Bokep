import serialize from '../../core/serialize.js'

let handler = m => m

handler.before = async function (m, { conn, group, store }) {
    if (!m.isGroup) return
    if (m.mtype !== 'protocolMessage') return
    
    let protocolMessage = m.msg
    if (!protocolMessage || protocolMessage.type !== 0) return 
    
    let key = protocolMessage.key
    if (!key) return
    if (m.fromMe) return
    
    if (!group?.antidelete) return

    // Ambil pesan asli dari cache
    let raw = await conn.loadMessage(key.id)
    if (!raw) return

    // Serialize agar dapat helper method seperti .download()
    let msg = await serialize(raw, conn, store)
    if (!msg) return

    let sender = msg.sender
    let caption = `*「 ANTI DELETE 」*
    
*👤 Pengirim:* @${sender.split('@')[0]}
*🕒 Waktu Kirim:* ${new Date(msg.timestamps).toLocaleString()}
*🚫 Waktu Hapus:* ${new Date().toLocaleString()}
*📑 Tipe:* ${msg.mtype.replace('Message', '')}

*Isi Pesan:*`.trim()

    try {
        // Kirim info penghapusan
        await conn.reply(m.chat, caption, null, { mentions: [sender] })
        
        // Kirim ulang kontennya
        if (msg.isMedia) {
            let buffer = await msg.download().catch(e => {
                console.error(`[ANTIDELETE-ERROR] Download gagal untuk ${key.id}:`, e)
                return null
            })
            
            if (buffer) {
                await conn.sendFile(m.chat, buffer, '', msg.text || '', null)
            } else {
                if (msg.text) await conn.reply(m.chat, msg.text, null)
            }
        } else {
            if (msg.text) await conn.reply(m.chat, msg.text, null)
        }
    } catch (err) {
        console.error('[ANTIDELETE-ERROR] Gagal kirim ulang pesan:', err)
    }
}

export default handler
