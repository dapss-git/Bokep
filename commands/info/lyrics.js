const headers = {
    'Accept-Encoding': 'gzip',
    'x-genius-app-background-request': '0',
    'x-genius-logged-out': 'true',
    'x-genius-android-version': '8.1.1',
    'user-agent': 'Genius/8.1.1 (Android; Android 13; ZN/Android)'
}

function parselirik(node) {
    if (typeof node === 'string') return node
    if (!node) return ''
    if (node.tag === 'br') return '\n'

    let text = ''
    if (node.children) {
        text = node.children.map(parselirik).join('')
    }

    if (node.tag === 'p' || node.tag === 'div') {
        return text + '\n'
    }
    return text
}

async function detail(id) {
    const res = await fetch(`https://api.genius.com/songs/${id}`, {
        headers
    })
    const data = await res.json()
    const song = data.response.song

    return {
        id: song.id,
        title: song.title,
        artist: song.artist_names,
        header_image_url: song.header_image_url,
        song_art_image_url: song.song_art_image_url,
        instrumental: song.instrumental,
        is_music: song.is_music,
        hidden: song.hidden,
        explicit: song.explicit,
        release_date: song.release_date_for_display,
        url: song.url,
        lyrics: song.lyrics ? parselirik(song.lyrics.dom).replace(/\[.*?\]/g, '').trim().replace(/\n{3,}/g, '\n\n') : null
    }
}

async function search(query) {
    const res = await fetch(`https://api.genius.com/search/multi?q=${encodeURIComponent(query)}`, {
        headers
    })
    const data = await res.json()
    const songs = []

    for (const section of data.response.sections) {
        if (section.type === 'song' || section.type === 'top_hit') {
            for (const hit of section.hits) {
                if (hit.type === 'song') {
                    const song = hit.result
                    songs.push({
                        id: song.id,
                        title: song.title,
                        artist: song.artist_names,
                        header_image_url: song.header_image_url,
                        url: song.url
                    })
                }
            }
        }
    }
    return songs
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} bergema sampai selamanya`)

    if (text.startsWith('id|')) {
        let id = text.split('|')[1]
        if (global.loading) await global.loading(m, conn)
        try {
            let res = await detail(id)
            if (!res.lyrics) return m.reply('❌ Lirik tidak ditemukan atau lagu ini berbentuk instrumental.')

            let caption = `> ╭─❁ ʟɪʀɪᴋ ʟᴀɢᴜ ❁\n`
            caption += `> ◦❒ ᴊᴜᴅᴜʟ: ${res.title}\n`
            caption += `> ◦❒ ᴀʀᴛɪs: ${res.artist}\n`
            caption += `> ◦❒ ʀɪʟɪs: ${res.release_date || '-'}\n`
            caption += `> ╰─❁\n\n`
            caption += `${res.lyrics}`

            return m.reply(caption.trim())
        } catch (e) {
            console.error(e)
            return m.reply('❌ Gagal mengambil detail lirik.')
        } finally {
            if (global.loading) await global.loading(m, conn, true)
        }
    }

    if (global.loading) await global.loading(m, conn)
    try {
        let results = await search(text)
        if (!results.length) return m.reply('❌ Lagu tidak ditemukan.')

        let tracks = results.slice(0, 10).map(v => ({
            title: v.title,
            description: `Artis: ${v.artist}`,
            id: `${usedPrefix + command} id|${v.id}`
        }))

        return conn.sendMessage(m.chat, {
            text: `> ╭─❁ ɢᴇɴɪᴜs sᴇᴀʀᴄʜ ❁\n> ◦❒ Query: _${text}_\n> ╰─❁\n\nSilakan pilih lagu di bawah untuk melihat lirik 👇`,
            footer: `© ${global.botname || 'Bot'}`,
            buttons: [{
                buttonId: 'genius_select',
                buttonText: {
                    displayText: '📥 Pilih Lagu'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Hasil Pencarian',
                        sections: [{
                            title: 'Daftar Lagu',
                            rows: tracks
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        })

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi kesalahan saat mencari lagu.')
    } finally {
        if (global.loading) await global.loading(m, conn, true)
    }
}

handler.help = ['lirik <judul lagu>']
handler.tags = ['info']
handler.command = /^(lirik|lyrics|lyric)$/i
handler.register = true
handler.limit = true

export default handler