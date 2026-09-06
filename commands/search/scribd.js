let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (!text) {
        return m.reply(`📚 Gunakan: ${usedPrefix + command} <judul>\nContoh: ${usedPrefix + command} lord of the mysteries`)
    }

    if (text.startsWith('https://')) {
        await m.reply('⏳ Mengunduh dokumen Scribd...')

        try {
            const url = global.API('theresav', '/download/scribd', {
                url: text
            }, 'apikey')

            const res = await fetch(url)
            const data = await res.json()

            if (!data?.status) {
                throw new Error('Gagal download dokumen')
            }

            const result = data.result

            await conn.sendMessage(m.chat, {
                document: {
                    url: result.downloadUrl
                },
                mimetype: 'application/pdf',
                fileName: `${result.title}.pdf`,
                caption: `📚 *S C R I B D - D O W N L O A D*

◦ *Title:* ${result.title}
◦ *Pages:* ${result.pagesDownloaded}/${result.totalPagesFound}
◦ *Status:* Success
◦ *Note:* ${result.note}`
            }, {
                quoted: m
            })

        } catch (e) {
            console.error('[scribd:download]', e)
            m.reply(`❌ Gagal mengunduh dokumen: ${e.message}`)
        }

        return
    }

    await m.reply(`🔍 Mencari dokumen ${text}...`)

    try {
        const url = global.API('theresav', '/search/scribd', {
            query: text
        }, 'apikey')

        const res = await fetch(url)
        const data = await res.json()

        if (!data?.status || !Array.isArray(data.result) || !data.result.length) {
            return m.reply('❌ Dokumen tidak ditemukan')
        }

        const list = data.result
        const MAX_PER_SECTION = 10

        const all = list.map(v => ({
            header: v.title || 'No Title',
            title: `👤 ${v.author || 'Unknown'}`,
            description: `📄 ${v.pageCount || 0} halaman | 👁️ ${v.views || 0} views`,
            id: `${usedPrefix + command} ${v.url}`
        }))

        const sections = []
        for (let i = 0; i < all.length; i += MAX_PER_SECTION) {
            sections.push({
                title: `Results ${i + 1}–${Math.min(i + MAX_PER_SECTION, all.length)}`,
                rows: all.slice(i, i + MAX_PER_SECTION)
            })
        }

        await conn.sendMessage(m.chat, {
            image: {
                url: list[0]?.imageUrl || 'https://telegra.ph/file/404.jpg'
            },
            caption: `📚 Hasil pencarian: ${text}\nTotal: ${list.length} dokumen ditemukan\n\nPilih dokumen untuk langsung download PDF!`,
            footer: 'Powered by Scribd',
            buttons: [{
                buttonId: 'scribd_select',
                buttonText: {
                    displayText: '📚 Pilih Dokumen'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Scribd Documents',
                        sections
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        })

    } catch (e) {
        console.error('[scribd:search]', e)
        m.reply(`❌ Gagal mencari dokumen: ${e.message}`)
    }
}

handler.help = ['scribd <query/url>']
handler.tags = ['search', 'downloader']
handler.command = ['scribd']
handler.description = 'Search and download Scribd documents'
handler.register = true
handler.limit = true

export default handler