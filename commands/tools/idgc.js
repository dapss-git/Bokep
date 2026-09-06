let handler = async (m, { conn, text }) => {
    if (!m || !m.sender) return

    const args = (text || '').trim().split(/ +/)

    if (!args[0]) {
        return m.reply(`Please provide a group link.\nExample: .idgc https://chat.whatsapp.com/xxxxx`)
    }

    let link = args[0]
    let regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{22})/
    let match = link.match(regex)

    if (!match) return m.reply('Invalid WhatsApp group link format.')

    let code = match[1]

    try {
        let groupInfo = await conn.groupGetInviteInfo(code)
        let groupId = groupInfo.id

        m.reply(`Group ID: ${groupId}`)
    } catch (e) {
        console.error(e)
        m.reply('Failed to get group info. The link might be invalid, expired, or I might be blocked from accessing it.')
    }
}

handler.help = ['idgc']
handler.tags = ['tools']
handler.command = ['idgc']
handler.limit = true;
handler.register = true;

export default handler
