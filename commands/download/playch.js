import yts from "yt-search"
import {
    canvas as canvasYts
} from "../../library/canvas/canvas-yts.js"

const FORMATS = ['mp3', 'aac', 'm4a', 'flac', 'wav']
const PTT_FORMATS = ['opus', 'ogg']
const BITRATES = ['64k', '128k', '192k', '256k', '320k']

const MIME_MAP = {
    mp3: 'audio/mpeg',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    wav: 'audio/wav',
    opus: 'audio/ogg; codecs=opus',
    ogg: 'audio/ogg; codecs=opus'
}

const getBuffer = async (url) => {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    })
    if (!res.ok) throw new Error(`Gagal mengambil media (${res.status})`)
    return Buffer.from(await res.arrayBuffer())
}

let handler = async (m, {
    text,
    usedPrefix,
    command,
    conn
}) => {
    try {
        if (!text) return m.reply(`Contoh penggunaan:\n${usedPrefix + command} jalan kenangan`)

        // ======================= HANDLE DOWNLOAD =======================
        if (text.startsWith('dl|')) {
            const [, format, bitrate, pttFlag, url] = text.split('|')
            const isPtt = pttFlag === '1'
            const fmt = format || 'mp3'
            const bit = bitrate || '128k'

            await global.loading(m, conn)

            try {
                const json = await global.fetchAPI(
                    'theresav',
                    '/download/ytmp3', {
                        url,
                        format: fmt,
                        bitrate: bit
                    },
                    'x-apikey'
                )

                if (!json?.status || !json?.download_url) {
                    throw new Error(json?.message || 'Gagal mengambil data.')
                }

                const audioBuffer = await getBuffer(json.download_url)
                const mimetype = MIME_MAP[fmt] || MIME_MAP.mp3
                const thumbBuffer = json.thumbnail ? await getBuffer(json.thumbnail).catch(() => null) : null

                const contextInfo = thumbBuffer ? {
                    externalAdReply: {
                        title: json.title || '',
                        body: `${json.channel || ''} • ${json.bitrate || bit}`,
                        thumbnail: thumbBuffer,
                        sourceUrl: url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                } : undefined

                // Paksa PTT hanya untuk format opus/ogg, jika tidak, abaikan pttFlag
                const finalPtt = isPtt && PTT_FORMATS.includes(fmt)
                const finalMime = finalPtt ? 'audio/ogg; codecs=opus' : mimetype

                await conn.sendMessage(m.chat, {
                    audio: audioBuffer,
                    mimetype: finalMime,
                    ptt: finalPtt,
                    fileName: `${json.title || 'audio'}.${fmt}`,
                    contextInfo
                }, {
                    quoted: m
                })

                await m.reply(`✅ Audio terkirim (${fmt.toUpperCase()} ${bit})`)
            } catch (e) {
                m.reply(`❌ Error: ${e.message}`)
            } finally {
                await global.loading(m, conn, true)
            }
            return
        }

        // ======================= HANDLE URL -> PILIH FORMAT =======================
        if (/^https?:\/\//.test(text)) {
            const rows = []

            for (const fmt of FORMATS) {
                for (const bit of BITRATES) {
                    rows.push({
                        title: `${fmt.toUpperCase()} ${bit}`,
                        description: 'Audio biasa',
                        id: `${usedPrefix + command} dl|${fmt}|${bit}|0|${text}`
                    })
                }
            }

            for (const fmt of PTT_FORMATS) {
                for (const bit of BITRATES) {
                    rows.push({
                        title: `${fmt.toUpperCase()} ${bit}`,
                        description: 'Voice Note (PTT)',
                        id: `${usedPrefix + command} dl|${fmt}|${bit}|1|${text}`
                    })
                }
            }

            const sections = [{
                    title: '🎵 Audio Biasa (Non-PTT)',
                    rows: rows.filter(r => !r.description.includes('PTT'))
                },
                {
                    title: '🎤 Voice Note (PTT)',
                    rows: rows.filter(r => r.description.includes('PTT'))
                }
            ]

            await conn.sendMessage(m.chat, {
                text: '🎧 Pilih format & bitrate audio',
                footer: 'YouTube → TheresAV',
                buttons: [{
                    buttonId: 'ytmp3_format_select',
                    buttonText: {
                        displayText: '🎵 Pilih Format & Bitrate'
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Format & Bitrate',
                            sections
                        })
                    }
                }],
                headerType: 1,
                viewOnce: true
            })
            return
        }

        // ======================= SEARCH =======================
        const search = await yts(text)
        const rawVideos = search.all.filter(v => v.type === 'video')
        if (!rawVideos.length) return m.reply('❌ Video tidak ditemukan')

        const videos = rawVideos.slice(0, 20).map(v => ({
            title: v.title,
            channel: v.author?.name || 'Unknown',
            duration: v.timestamp || '0:00',
            cover: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            url: v.url
        }))

        const imageBuffer = await canvasYts(videos, text)

        const rows = videos.map(v => ({
            header: v.channel,
            title: `🎧 ${v.title.length > 40 ? v.title.slice(0, 37) + '...' : v.title}`,
            description: `⏱ ${v.duration}`,
            id: `${usedPrefix + command} ${v.url}`
        }))

        await conn.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `🎶 Hasil pencarian audio YouTube\nQuery: ${text}`,
            footer: 'Klik untuk pilih audio',
            buttons: [{
                buttonId: 'yts_audio_select',
                buttonText: {
                    displayText: '📥 Pilih Audio'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Daftar Audio YouTube',
                        sections: [{
                            title: 'Hasil Pencarian',
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        })

    } catch (e) {
        console.error(e)
        m.reply('❌ Terjadi error')
    }
}

handler.help = ['playch <lagu>', 'songch <lagu>']
handler.tags = ['downloader']
handler.command = /^(playch|songch)$/i
handler.premium = true

export default handler