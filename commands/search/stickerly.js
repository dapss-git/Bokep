let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (!text) {
        return m.reply(`🔍 Gunakan: ${usedPrefix + command} <nama stiker>\nContoh: ${usedPrefix + command} spongebob`)
    }

    if (text.startsWith('https://sticker.ly/')) {
        await m.reply('⏳ Mengunduh sticker pack...')

        try {
            const url = global.API('theresav', '/download/stickerly', {
                url: text
            }, 'apikey')

            const res = await fetch(url)
            const data = await res.json()

            if (!data?.status) throw new Error(data?.message || 'API error')

            const pack = data.data || data.result
            if (!pack?.stickers?.length) throw new Error('Sticker pack kosong')

            const MAX_STICKERS = 30
            const stickerList = pack.stickers.slice(0, MAX_STICKERS)

            if (pack.isAnimated) {
                await m.reply(`✨ Pack animated terdeteksi, mengirim satu per satu...`)

                for (let s of stickerList) {
                    try {
                        const r = await fetch(s.imageUrl)
                        if (!r.ok) continue

                        const buffer = Buffer.from(await r.arrayBuffer())
                        if (!buffer.length) continue

                        await conn.sendMessage(m.chat, {
                            sticker: buffer
                        }, {
                            quoted: m
                        })

                        await new Promise(r => setTimeout(r, 500))

                    } catch (e) {
                        console.log('Skip sticker:', e.message)
                    }
                }

                return
            }

            const results = await Promise.allSettled(
                stickerList.map(async (s) => {
                    const r = await fetch(s.imageUrl)
                    if (!r.ok) throw new Error(`HTTP ${r.status}`)

                    const buffer = Buffer.from(await r.arrayBuffer())
                    if (!buffer.length) throw new Error('Empty buffer')

                    return {
                        data: buffer,
                        emojis: ['🎨'],
                        accessibilityLabel: s.fileName || 'sticker'
                    }
                })
            )

            const stickerBuffers = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value)

            if (!stickerBuffers.length) {
                throw new Error('Semua stiker gagal diunduh')
            }

            const coverUrl = pack.thumbnailUrl || pack.thumbnail || stickerList[0]?.imageUrl
            const coverRes = await fetch(coverUrl)
            if (!coverRes.ok) throw new Error('Gagal unduh cover')

            const coverBuffer = Buffer.from(await coverRes.arrayBuffer())

            await conn.sendMessage(m.chat, {
                stickerPack: {
                    name: pack.name || 'Sticker Pack',
                    publisher: (typeof pack.author === 'object' ? pack.author?.name : pack.author) || 'Unknown',
                    description: `${pack.stickerCount || stickerList.length} stickers | ${pack.exportCount || 0}x exported`,
                    cover: coverBuffer,
                    stickers: stickerBuffers
                }
            }, {
                quoted: m
            })

        } catch (e) {
            console.error('[stickerly:download]', e)
            m.reply(`❌ Gagal mengunduh sticker pack: ${e.message}`)
        }

        return
    }

    await m.reply(`🔍 Mencari stiker ${text}...`)

    try {
        const url = global.API('theresav', '/search/stickerly', {
            query: text
        }, 'apikey')

        const res = await fetch(url)
        const data = await res.json()

        const list = data?.data || data?.result || []

        if (!data?.status || !Array.isArray(list) || !list.length) {
            return m.reply('❌ Stiker tidak ditemukan')
        }

        const MAX_PER_SECTION = 10

        const all = list.map(v => ({
            header: v.name || 'No Name',
            title: `👤 ${typeof v.author === 'object' ? (v.author?.name || v.author?.username || 'Unknown') : (v.author || 'Unknown')}`,
            description: `🖼️ ${v.stickerCount || 0} stiker | 📤 ${v.exportCount || 0}x export${v.isAnimated ? ' | ✨ Animated' : ''}`,
            id: `${usedPrefix + command} ${v.url}`
        }))

        const sections = []
        for (let i = 0; i < all.length; i += MAX_PER_SECTION) {
            sections.push({
                title: `Pack ${i + 1}–${Math.min(i + MAX_PER_SECTION, all.length)}`,
                rows: all.slice(i, i + MAX_PER_SECTION)
            })
        }

        await conn.sendMessage(m.chat, {
            image: {
                url: list[0]?.thumbnailUrl || list[0]?.thumbnail || 'https://telegra.ph/file/404.jpg'
            },
            caption: `🎨 Hasil pencarian: ${text}\nTotal: ${list.length} pack ditemukan\n\nPilih pack untuk langsung download!`,
            footer: 'Powered by Stickerly',
            buttons: [{
                buttonId: 'stickerly_select',
                buttonText: {
                    displayText: '🎨 Pilih Stiker Pack'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Sticker Packs',
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
        console.error('[stickerly:search]', e)
        m.reply(`❌ Gagal mencari stiker: ${e.message}`)
    }
}

handler.help = ['stickerly <query>']
handler.tags = ['search']
handler.command = ['stickerly']
handler.description = 'Search and download stickers from Stickerly'
handler.register = true
handler.limit = true
export default handler