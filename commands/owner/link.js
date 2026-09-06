let handler = async (m, {
    conn,
    args
}) => {
    // kalau ada JID langsung kasih link
    if (args[0]) {
        try {
            let code = await conn.groupInviteCode(args[0])
            return m.reply(`https://chat.whatsapp.com/${code}`)
        } catch (e) {
            return m.reply('Gagal ambil link grup / bot bukan admin')
        }
    }

    // ambil semua grup
    let groups = await conn.groupFetchAllParticipating()

    let rows = Object.entries(groups).map(([jid, meta]) => {
        return {
            header: '',
            title: meta.subject,
            description: jid,
            id: `.link ${jid}`
        }
    })

    await conn.sendMessage(m.chat, {
        text: 'Pilih grup:',
        footer: 'Daftar Semua Grup',
        buttons: [{
            buttonId: 'list_gc',
            buttonText: {
                displayText: 'Pilih Grup'
            },
            type: 4,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: 'LIST GROUP',
                    sections: [{
                        title: 'Semua Grup',
                        rows
                    }]
                })
            }
        }]
    }, {
        quoted: m
    })
}

handler.command = ['link']
handler.owner = true
handler.tags = ['owner']
export default handler