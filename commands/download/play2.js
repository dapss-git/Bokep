import {
    prepareWAMessageMedia
} from 'baileys'
import {
    canvas as canvasYts
} from '../../library/canvas/canvas-yts.js'

const bitrates = ['64', '128', '192', '256', '320']

async function searchYouTube(query) {
    const url = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false'
    const payload = {
        context: {
            client: {
                clientName: 'WEB',
                clientVersion: '2.20240514.01.00',
                hl: 'en',
                gl: 'US',
            }
        },
        query
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-YouTube-Client-Name': '1',
            'X-YouTube-Client-Version': '2.20240514.01.00',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`)
    const data = await res.json()
    const results = []

    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents
    if (contents && Array.isArray(contents)) {
        for (const section of contents) {
            const items = section.itemSectionRenderer?.contents || section.richGridRenderer?.contents
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    const videoRenderer = item.videoRenderer || item.richItemRenderer?.content?.videoRenderer
                    if (videoRenderer && videoRenderer.videoId) {
                        results.push({
                            id: videoRenderer.videoId,
                            title: videoRenderer.title?.runs?.map(r => r.text).join('') || 'No Title',
                            channel: videoRenderer.ownerText?.runs?.map(r => r.text).join('') || 'Unknown Channel',
                            views: videoRenderer.viewCountText?.simpleText || '0 views',
                            publishedTime: videoRenderer.publishedTimeText?.simpleText || '',
                            duration: videoRenderer.lengthText?.simpleText || 'LIVE',
                            thumbnail: videoRenderer.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoRenderer.videoId}/hq720.jpg`
                        })
                    }
                }
            }
        }
    }

    return results
}

// Dapatkan URL thumbnail terbaik untuk canvas
async function getValidThumb(video) {
    // Jika thumbnail dari scraping mengandung hq720, gunakan itu
    if (video.thumbnail && video.thumbnail.includes('hq720')) {
        return video.thumbnail
    }

    const sizes = ['hq720.jpg', 'hqdefault.jpg', 'mqdefault.jpg', 'sddefault.jpg', 'maxresdefault.jpg']
    for (const size of sizes) {
        const url = `https://i.ytimg.com/vi/${video.id}/${size}`
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            })
            if (res.ok) return url
        } catch {}
    }
    return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
}

async function downloadAudio(url, bitrate, conn, m) {
    const apiUrl = global.API('theresav', '/download/ytmp3', {
        url,
        format: 'mp3',
        bitrate: `${bitrate}k`
    })
    const apiKey = global.APIKeys?.[global.APIs?.theresav] || 'yamete'
    const headers = {
        'x-apikey': apiKey
    }

    const res = await fetch(apiUrl, {
        headers
    })
    const data = await res.json()

    if (!data?.status || !data?.download_url) {
        throw new Error(data?.message || 'Gagal download audio')
    }

    const filesizeMB = data.filesize ? (data.filesize / 1024 / 1024).toFixed(2) : '-'

    let thumbBuf, image
    if (data.thumbnail) {
        try {
            const thumbRes = await fetch(data.thumbnail)
            thumbBuf = Buffer.from(await thumbRes.arrayBuffer())
            const {
                imageMessage
            } = await prepareWAMessageMedia({
                image: thumbBuf
            }, {
                upload: conn.waUploadToServer,
                mediaTypeOverride: 'thumbnail-link'
            })
            image = imageMessage
            image.width = 1280
            image.height = 720
        } catch {}
    }

    const linkPreview = thumbBuf ? {
        'matched-text': data.thumbnail,
        title: data.title,
        description: `${data.channel || 'YouTube'} • ${bitrate}kbps • ${filesizeMB} MB`,
        previewType: 0,
        jpegThumbnail: thumbBuf,
        ...(image ? {
            highQualityThumbnail: image
        } : {}),
        linkPreviewMetadata: {
            linkMediaDuration: 0,
            socialMediaPostType: 4
        }
    } : null

    if (linkPreview) {
        const infoText = `🎵 *${data.title}*\n\n` +
            `👤 *Channel:* ${data.channel || '-'}\n` +
            `⏱️ *Durasi:* ${data.duration_sec ? `${data.duration_sec}s` : '-'}\n` +
            `🎚️ *Bitrate:* ${data.bitrate || `${bitrate}k`}\n` +
            `📦 *Ukuran:* ${filesizeMB} MB\n` +
            `👍 *Like:* ${data.like_count || 0}\n` +
            `👁️ *View:* ${data.view_count || 0}`

        await conn.sendMessage(m.chat, {
            text: `${data.thumbnail}\n\n${infoText}`,
            linkPreview
        }, {
            quoted: m
        })
    }

    const audioRes = await fetch(data.download_url)
    if (!audioRes.ok) throw new Error(`Gagal mengunduh audio (${audioRes.status})`)
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer())

    await conn.sendMessage(m.chat, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${data.title || 'audio'}_${bitrate}k.mp3`,
        ptt: false
    }, {
        quoted: m
    })
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        // Mode pilihan bitrate dari tombol
        if (text.startsWith('res|')) {
            const parts = text.split('|')
            const bitrate = parts[1]
            const url = parts.slice(2).join('|')
            if (!bitrates.includes(bitrate)) return m.reply('Bitrate tidak tersedia.')

            await global.loading(m, conn)
            try {
                await downloadAudio(url, bitrate, conn, m)
            } catch (e) {
                m.reply(`❌ Error: ${e.message}`)
            } finally {
                await global.loading(m, conn, true)
            }
            return
        }

        // Mode URL langsung -> pilih bitrate
        if (/^https?:\/\//.test(text)) {
            const rows = bitrates.map(b => ({
                title: `${b}k`,
                description: `Download audio ${b}k`,
                id: `${usedPrefix + command} res|${b}|${text}`
            }))

            return conn.sendMessage(m.chat, {
                text: '📥 Pilih bitrate audio',
                footer: 'YouTube Audio Downloader',
                buttons: [{
                    buttonId: 'yta_res_select',
                    buttonText: {
                        displayText: '🎵 Pilih Bitrate'
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Pilih Bitrate Audio',
                            sections: [{
                                title: 'Bitrate Tersedia',
                                rows
                            }]
                        })
                    }
                }],
                headerType: 1,
                viewOnce: true
            }, {
                quoted: m
            })
        }

        // Mode pencarian
        if (!text) return m.reply(`Contoh: ${usedPrefix + command} belajar nodejs dasar`)

        await global.loading(m, conn)

        const results = await searchYouTube(text)
        if (!results.length) return m.reply('❌ Tidak ada hasil ditemukan.')

        // Siapkan thumbnail valid untuk 9 video pertama
        const topResults = results.slice(0, 9)
        const validThumbs = await Promise.all(topResults.map(v => getValidThumb(v)))

        // Konversi ke properti yang dibutuhkan canvasYts
        const videosForCanvas = topResults.map((v, i) => ({
            title: v.title,
            channel: v.channel,
            duration: v.duration,
            views: v.views,
            publishedTime: v.publishedTime,
            cover: validThumbs[i], // <-- properti harus "cover"
            url: `https://youtu.be/${v.id}`
        }))

        const imageBuffer = await canvasYts(videosForCanvas, text)

        const rows = results.slice(0, 10).map(v => ({
            header: `${v.channel} • ${v.views}`,
            title: v.title,
            description: `${v.duration} • ${v.publishedTime}`,
            id: `${usedPrefix + command} https://youtu.be/${v.id}`
        }))

        await conn.sendMessage(m.chat, {
            image: imageBuffer,
            caption: `🎬 *Hasil Pencarian YouTube*\nQuery: ${text}`,
            footer: 'Pilih video untuk download audio',
            buttons: [{
                buttonId: 'yt_search_select',
                buttonText: {
                    displayText: '📥 Pilih Video'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Daftar Video',
                        sections: [{
                            title: 'Hasil Pencarian',
                            rows
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
        m.reply(`❌ Terjadi error: ${e.message}`)
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ['playv2 <query/url>']
handler.tags = ['downloader', 'search']
handler.command = /^(playv2|yp|ytplay|play2|yta2)$/i
handler.limit = true
handler.register = true

export default handler