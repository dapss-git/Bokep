import sharp from 'sharp'
import {
    prepareWAMessageMedia
} from 'baileys'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'other', 'unknown']
const SEASONS = ['fall', 'spring', 'winter', 'summer']
const TYPES = ['tv-new', 'tv-continuing', 'ona', 'ova', 'movie', 'special']
const MAX_CHARS = 4000

const pageCache = new Map()

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

const apiGet = async (path, params = {}) => {
    const url = global.API('theresav', `/anime/myanimelist/${path}`, params, 'apikey')
    const res = await fetch(url)
    const data = await res.json()
    return data
}

const forwardContext = () => ({
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: global.idch || '120363000000000000@newsletter',
        newsletterName: global.botname || 'Shizuku',
        serverMessageId: -1,
    },
})

const makeDetailRows = (result) =>
    result.slice(0, 10).map((v) => ({
        header: v.type || '',
        title: v.title || 'No title',
        description: v.score ? `⭐ ${v.score} | ${v.type || '-'}` : v.type || '-',
        id: `.mal detail ${encodeURIComponent(v.url)}`,
    }))

async function buildLinkPreview(conn, url, title, description, thumbnail) {
    try {
        const res = await fetch(thumbnail)
        const raw = Buffer.from(await res.arrayBuffer())

        const processed = await sharp(raw)
            .resize(800, 600, {
                fit: 'cover',
                position: 'centre'
            })
            .jpeg({
                quality: 90
            })
            .toBuffer()

        const {
            imageMessage: hqImage
        } = await prepareWAMessageMedia({
            image: processed
        }, {
            upload: conn.waUploadToServer,
            mediaTypeOverride: 'thumbnail-link'
        })

        const meta = await sharp(processed).metadata()
        hqImage.width = meta.width || 800
        hqImage.height = meta.height || 600

        return {
            'matched-text': url,
            title,
            description: description.substring(0, 100),
            previewType: 0,
            jpegThumbnail: processed,
            highQualityThumbnail: hqImage,
            linkMediaDuration: 0,
            socialMediaPostType: 4,
        }
    } catch {
        return null
    }
}

const fixThumb = (url) =>
    url?.replace(/\/r\/\d+x\d+\//, '/').replace(/\.webp(\?.*)?$/, '.jpg').replace(/\?.*$/, '') || null

async function sendPage(conn, m, cacheKey, pageIndex, preview = null) {
    const cached = pageCache.get(cacheKey)
    if (!cached) return m.reply('❌ Sesi habis. Ulangi perintah.')

    if (preview && !cached.preview) cached.preview = preview

    const {
        pages,
        rows
    } = cached
    const storedPreview = cached.preview || null
    const total = pages.length
    const isLast = pageIndex >= total - 1
    const pageInfo = total > 1 ? `\n\n_Halaman ${pageIndex + 1}/${total}_` : ''
    const text = pages[pageIndex] + pageInfo

    const buttons = [{
            buttonId: 'action_detail',
            buttonText: {
                displayText: '🔍 Lihat Detail'
            },
            type: 4,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: '📺 Pilih Item',
                    sections: [{
                        title: 'Daftar',
                        rows
                    }],
                }),
            },
        },
        ...(!isLast ? [{
            buttonId: `.mal next ${cacheKey} ${pageIndex + 1}`,
            buttonText: {
                displayText: `➡️ Halaman ${pageIndex + 2}/${total}`
            },
            type: 1,
        }] : []),
    ]

    await conn.sendMessage(
        m.chat, {
            text,
            ...(storedPreview ? {
                linkPreview: storedPreview
            } : {}),
            contextInfo: forwardContext(),
            buttons,
        }, {
            quoted: m
        }
    )
}

function buildSchedulePages(day, data) {
    const {
        result,
        total,
        creator
    } = data
    const header = `📅 *Jadwal Anime ${capitalize(day)}*\n📊 *Total:* ${total} anime\n👤 *Creator:* ${creator || '-'}\n\n`
    const pages = []
    let current = header

    for (const [i, anime] of result.entries()) {
        const date = anime.airing_start ? new Date(anime.airing_start).toLocaleDateString('id-ID') : '-'
        const block =
            `${i + 1}. *${anime.title}*\n` +
            `   ├ ❯ Type: ${anime.type || '-'}\n` +
            `   ├ ❯ Score: ${anime.score || 'N/A'}\n` +
            `   ├ ❯ Episodes: ${anime.episodes || '?'}\n` +
            `   ├ ❯ Airing: ${date}\n` +
            `   └ ❯ URL: ${anime.url}\n\n`

        if ((current + block).length > MAX_CHARS) {
            pages.push(current.trimEnd())
            current = header + block
        } else {
            current += block
        }
    }

    if (current.trim()) pages.push(current.trimEnd())
    return pages
}

function buildSeasonalPages(season, type, data) {
    const {
        result,
        total,
        creator
    } = data
    const header = `🌸 *Seasonal: ${capitalize(season)} - ${type.toUpperCase()}*\n📊 *Total:* ${total} anime\n👤 *Creator:* ${creator || '-'}\n\n`
    const pages = []
    let current = header

    for (const [i, anime] of result.entries()) {
        const d = anime.details || {}
        const s = anime.stats || {}
        const t = anime.tags || {}
        const block =
            `${i + 1}. *${anime.title}*\n` +
            `   ├ ❯ Type: ${anime.type || '-'}\n` +
            `   ├ ❯ Score: ⭐ ${s.score || 'N/A'} | ${s.members || '-'} members\n` +
            `   ├ ❯ Episodes: ${d.totalEpisodes || '?'}\n` +
            `   ├ ❯ Studio: ${d.studio || '-'}\n` +
            `   ├ ❯ Genres: ${t.genres || '-'}\n` +
            `   ├ ❯ Release: ${d.releaseDate || '-'}\n` +
            `   └ ❯ URL: ${anime.url}\n\n`

        if ((current + block).length > MAX_CHARS) {
            pages.push(current.trimEnd())
            current = header + block
        } else {
            current += block
        }
    }

    if (current.trim()) pages.push(current.trimEnd())
    return pages
}

function buildTopPages(data) {
    const {
        result,
        total,
        creator
    } = data
    const header = `🏆 *Top Anime MyAnimeList*\n📊 *Total:* ${total} anime\n👤 *Creator:* ${creator || '-'}\n\n`
    const pages = []
    let current = header

    for (const anime of result) {
        const block =
            `${anime.rank}. *${anime.title}*\n` +
            `   ├ ❯ Score: ⭐ ${anime.score}\n` +
            `   ├ ❯ Type: ${anime.type || '-'}\n` +
            `   ├ ❯ Release: ${anime.release || '-'}\n` +
            `   ├ ❯ Members: ${anime.members || '-'}\n` +
            `   └ ❯ URL: ${anime.url}\n\n`

        if ((current + block).length > MAX_CHARS) {
            pages.push(current.trimEnd())
            current = header + block
        } else {
            current += block
        }
    }

    if (current.trim()) pages.push(current.trimEnd())
    return pages
}

function buildDetailText(r) {
    const info = r.information || {}
    const stats = r.statistics || {}
    const alt = r.alternativeTitles || {}

    const field = (label, value) => value && value !== '-' ? `┠ ❯ ${label}: ${value}\n` : ''
    const fieldLast = (label, value) => `┗ ❯ ${label}: ${value || '-'}`

    let text = `🎬 *${r.title || '-'}*\n\n`
    text += `📝 *Synopsis:*\n${r.synopsis || '-'}\n\n`
    if (r.background) text += `📜 *Background:*\n${r.background}\n\n`

    const altLines = [
        alt.japanese && `┠ ❯ Japanese: ${alt.japanese}`,
        alt.english && `┠ ❯ English: ${alt.english}`,
        alt.synonyms && `┗ ❯ Synonyms: ${alt.synonyms}`,
    ].filter(Boolean)
    if (altLines.length) text += `🌐 *Alternative Titles:*\n${altLines.join('\n')}\n\n`

    text += `📊 *Information:*\n`
    text += field('Type', info.type)
    text += field('Episodes', info.episodes)
    text += field('Status', info.status)
    text += field('Aired', info.aired)
    text += field('Premiered', info.premiered)
    text += field('Broadcast', info.broadcast)
    text += field('Producers', info.producers)
    text += field('Licensors', info.licensors)
    text += field('Studios', info.studios)
    text += field('Source', info.source)
    text += field('Genres', info.genres)
    text += field('Themes', info.themes !== 'None' ? info.themes : null)
    text += field('Demographic', info.demographic)
    text += field('Duration', info.duration)
    text += `${fieldLast('Rating', info.rating)}\n\n`

    text += `📈 *Statistics:*\n`
    text += `┠ ❯ Score: ⭐ ${stats.score || 'N/A'}\n`
    text += field('Ranked', stats.ranked)
    text += field('Popularity', stats.popularity)
    text += field('Members', stats.members?.toLocaleString())
    text += fieldLast('Favorites', stats.favorites?.toLocaleString())

    return text
}

const handler = async (m, {
    args,
    conn
}) => {
    const sub = (args[0] || '').toLowerCase()
    const sub2 = (args[1] || '').toLowerCase()

    try {
        if (sub === 'search') {
            const keyword = args.slice(1).join(' ')
            if (!keyword) return m.reply('Masukkan judul anime yang ingin dicari.')

            await m.reply('🔍 Mencari...')
            const data = await apiGet('anime/search', {
                q: keyword
            })

            if (!data?.status || !data?.result?.length)
                return m.reply('❌ Tidak ditemukan hasil untuk pencarian tersebut.')

            const rows = makeDetailRows(data.result)
            await conn.sendMessage(
                m.chat, {
                    text: `✨ *Hasil Pencarian:* ${keyword}\n📊 *Total:* ${data.total || rows.length} ditemukan`,
                    footer: 'MyAnimeList Search',
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: '📋 Pilih Anime'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: '📺 Hasil Pencarian Anime',
                                sections: [{
                                    title: `🔍 "${keyword}" (${data.total || rows.length})`,
                                    rows
                                }],
                            }),
                        },
                    }],
                    viewOnce: true,
                }, {
                    quoted: m
                }
            )
            return
        }

        if (sub === 'detail') {
            let url = args[1]
            if (!url) return m.reply('❌ URL tidak valid. Gunakan: `.mal detail <url>`')

            url = decodeURIComponent(url)
            await m.reply('📥 Mengambil detail...')
            const data = await apiGet('anime/detail', {
                url
            })

            if (!data?.status || !data?.result)
                return m.reply('❌ Gagal mengambil detail anime. Pastikan URL valid.')

            const r = data.result
            const info = r.information || {}
            const stats = r.statistics || {}
            const shortDesc = `${info.type || 'TV'} • ${info.episodes || '?'} eps • ⭐ ${stats.score || 'N/A'}`
            const text = buildDetailText(r)
            const preview = await buildLinkPreview(conn, r.url, r.title, shortDesc, r.cover)

            await conn.sendMessage(
                m.chat, {
                    text: `${r.url}\n\n${text}`,
                    linkPreview: preview,
                    contextInfo: forwardContext()
                }, {
                    quoted: m
                }
            )
            return
        }

        if (sub === 'schedule') {
            const day = sub2

            if (!day) {
                const rows = DAYS.map((d) => ({
                    title: capitalize(d),
                    id: `.mal schedule ${d}`
                }))
                await conn.sendMessage(
                    m.chat, {
                        text: `📅 *MyAnimeList Schedule*\n\nPilih hari untuk melihat jadwal tayang anime:`,
                        footer: 'Anime Schedule',
                        buttons: [{
                            buttonId: 'action',
                            buttonText: {
                                displayText: '📆 Pilih Hari'
                            },
                            type: 4,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: '📅 Jadwal Tayang Anime',
                                    sections: [{
                                        title: 'Hari',
                                        rows
                                    }],
                                }),
                            },
                        }],
                        viewOnce: true,
                    }, {
                        quoted: m
                    }
                )
                return
            }

            await m.reply('📥 Mengambil jadwal...')
            const data = await apiGet('schedule', {
                day
            })

            if (!data?.status || !data?.result?.length)
                return m.reply(`❌ Tidak ada jadwal untuk hari ${capitalize(day)}.`)

            const pages = buildSchedulePages(day, data)
            const rows = makeDetailRows(data.result)
            const cacheKey = `schedule_${day}_${m.chat}`
            pageCache.set(cacheKey, {
                pages,
                rows
            })
            setTimeout(() => pageCache.delete(cacheKey), 10 * 60 * 1000)

            const firstAnime = data.result[0]
            const preview = firstAnime?.image ?
                await buildLinkPreview(conn, firstAnime.url, `Jadwal Anime ${capitalize(day)}`, `${data.total} anime akan tayang`, firstAnime.image) :
                null

            await sendPage(conn, m, cacheKey, 0, preview)
            return
        }

        if (sub === 'seasonal') {
            const season = sub2
            const type = (args[2] || '').toLowerCase() || 'tv-new'

            if (!season) {
                const seasonRows = SEASONS.map((s) => ({
                    title: capitalize(s),
                    id: `.mal seasonal ${s}`
                }))
                const typeRows = TYPES.map((t) => ({
                    title: t.toUpperCase(),
                    id: `.mal seasonal fall ${t}`
                }))

                await conn.sendMessage(
                    m.chat, {
                        text: `🌸 *MyAnimeList Seasonal*\n\nPilih season untuk melihat daftar anime:\n_Default type: tv-new_`,
                        footer: 'Anime Seasonal',
                        buttons: [{
                            buttonId: 'action_season',
                            buttonText: {
                                displayText: '📆 Pilih Season'
                            },
                            type: 4,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: '🌸 Season',
                                    sections: [{
                                            title: 'Season',
                                            rows: seasonRows
                                        },
                                        {
                                            title: 'Type',
                                            rows: typeRows
                                        },
                                    ],
                                }),
                            },
                        }],
                        viewOnce: true,
                    }, {
                        quoted: m
                    }
                )
                return
            }

            await m.reply('📥 Mengambil data seasonal...')
            const data = await apiGet('seasonal', {
                season,
                type
            })

            if (!data?.status || !data?.result?.length)
                return m.reply(`❌ Tidak ada data seasonal untuk ${season} - ${type}.`)

            const pages = buildSeasonalPages(season, type, data)
            const detailResult = data.result.map((v) => ({
                title: v.title,
                type: v.type,
                score: v.stats?.score,
                url: v.url
            }))
            const rows = makeDetailRows(detailResult)
            const cacheKey = `seasonal_${season}_${type}_${m.chat}`
            pageCache.set(cacheKey, {
                pages,
                rows
            })
            setTimeout(() => pageCache.delete(cacheKey), 10 * 60 * 1000)

            const firstAnime = data.result[0]
            const thumbUrl = fixThumb(firstAnime?.cover)
            const preview = thumbUrl ?
                await buildLinkPreview(conn, firstAnime.url, `Seasonal ${capitalize(season)}`, `${data.total} anime`, thumbUrl) :
                null

            await sendPage(conn, m, cacheKey, 0, preview)
            return
        }

        if (sub === 'top') {
            await m.reply('📥 Mengambil top anime...')
            const data = await apiGet('top')

            if (!data?.status || !data?.result?.length)
                return m.reply('❌ Gagal mengambil data top anime.')

            const pages = buildTopPages(data)
            const detailResult = data.result.map((v) => ({
                title: v.title,
                type: v.type,
                score: v.score,
                url: v.url
            }))
            const rows = makeDetailRows(detailResult)
            const cacheKey = `top_${m.chat}`
            pageCache.set(cacheKey, {
                pages,
                rows
            })
            setTimeout(() => pageCache.delete(cacheKey), 10 * 60 * 1000)

            const firstAnime = data.result[0]
            const thumbUrl = fixThumb(firstAnime?.cover)
            const preview = thumbUrl ?
                await buildLinkPreview(conn, firstAnime.url, 'Top Anime MAL', `Top ${data.total} Anime MyAnimeList`, thumbUrl) :
                null

            await sendPage(conn, m, cacheKey, 0, preview)
            return
        }

        if (sub === 'chara' && sub2 !== 'detail') {
            const keyword = args.slice(1).join(' ')
            if (!keyword) return m.reply('Masukkan nama karakter yang ingin dicari.')

            await m.reply('🔍 Mencari karakter...')
            const data = await apiGet('chara/search', {
                q: keyword
            })

            if (!data?.status || !data?.result?.length)
                return m.reply('❌ Tidak ditemukan karakter untuk pencarian tersebut.')

            const rows = data.result.slice(0, 10).map((v) => ({
                header: v.anime?.[0]?.title || v.manga?.[0]?.title || '',
                title: v.name || 'No name',
                description: [v.anime?.[0]?.title, v.manga?.[0]?.title].filter(Boolean).join(' | ') || '-',
                id: `.mal chara detail ${encodeURIComponent(v.url)}`,
            }))

            await conn.sendMessage(
                m.chat, {
                    text: `👤 *Hasil Pencarian Karakter:* ${keyword}\n📊 *Total:* ${data.total || rows.length} ditemukan`,
                    footer: 'MAL Character Search',
                    buttons: [{
                        buttonId: 'action_chara',
                        buttonText: {
                            displayText: '👤 Pilih Karakter'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: '👤 Hasil Pencarian',
                                sections: [{
                                    title: `🔍 "${keyword}" (${data.total || rows.length})`,
                                    rows
                                }],
                            }),
                        },
                    }],
                    viewOnce: true,
                }, {
                    quoted: m
                }
            )
            return
        }

        if (sub === 'chara' && sub2 === 'detail') {
            let url = args.slice(2).join(' ')
            if (!url) return m.reply('❌ URL tidak valid.')

            url = decodeURIComponent(url)
            await m.reply('📥 Mengambil detail karakter...')
            const data = await apiGet('chara/detail', {
                url
            })

            if (!data?.status || !data?.result)
                return m.reply('❌ Gagal mengambil detail karakter.')

            const r = data.result
            const animeList = r.animeography?.slice(0, 5).map((a, i) => `   ${i + 1}. ${a.title}`).join('\n') || '-'
            const mangaList = r.mangaography?.slice(0, 5).map((a, i) => `   ${i + 1}. ${a.title}`).join('\n') || '-'
            const vaList = r.voiceActors?.map((v) => `   ┠ ❯ ${v.name} (${v.role})`).join('\n') || '-'

            let text = `👤 *${r.name || '-'}*\n\n`
            if (r.nicknames) text += `🏷️ *Nicknames:* ${r.nicknames}\n`
            if (r.birthday) text += `🎂 *Birthday:* ${r.birthday}\n`
            if (r.age) text += `📅 *Age:* ${r.age}\n`
            if (r.height) text += `📏 *Height:* ${r.height}\n`
            if (r.favorites) text += `❤️ *Favorites:* ${r.favorites}\n`
            text += `\n📖 *Description:*\n${r.description?.substring(0, 500) || '-'}${r.description?.length > 500 ? '...' : ''}\n\n`
            text += `🎬 *Anime (${r.animeography?.length || 0}):*\n${animeList}`
            if ((r.animeography?.length || 0) > 5) text += `\n   _...dan ${r.animeography.length - 5} lainnya_`
            text += `\n\n📚 *Manga (${r.mangaography?.length || 0}):*\n${mangaList}`
            if ((r.mangaography?.length || 0) > 5) text += `\n   _...dan ${r.mangaography.length - 5} lainnya_`
            text += `\n\n🎙️ *Voice Actors:*\n${vaList}`

            const thumbUrl = fixThumb(r.cover)
            const preview = thumbUrl ?
                await buildLinkPreview(conn, r.url, r.name, r.description?.substring(0, 100) || '', thumbUrl) :
                null

            await conn.sendMessage(
                m.chat, {
                    text: `${r.url}\n\n${text}`,
                    ...(preview && {
                        linkPreview: preview
                    }),
                    contextInfo: forwardContext()
                }, {
                    quoted: m
                }
            )
            return
        }

        if (sub === 'manga' && sub2 !== 'detail') {
            const keyword = args.slice(1).join(' ')
            if (!keyword) return m.reply('Masukkan judul manga yang ingin dicari.')

            await m.reply('🔍 Mencari manga...')
            const data = await apiGet('manga/search', {
                q: keyword
            })

            if (!data?.status || !data?.result?.length)
                return m.reply('❌ Tidak ditemukan manga untuk pencarian tersebut.')

            const rows = data.result.slice(0, 10).map((v) => ({
                header: v.type || '',
                title: v.title || 'No title',
                description: `⭐ ${v.score || 'N/A'} | ${v.type || '-'} | Vol: ${v.vol || '?'}`,
                id: `.mal manga detail ${encodeURIComponent(v.url)}`,
            }))

            await conn.sendMessage(
                m.chat, {
                    text: `📚 *Hasil Pencarian Manga:* ${keyword}\n📊 *Total:* ${data.total || rows.length} ditemukan`,
                    footer: 'MAL Manga Search',
                    buttons: [{
                        buttonId: 'action_manga',
                        buttonText: {
                            displayText: '📚 Pilih Manga'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: '📚 Hasil Pencarian',
                                sections: [{
                                    title: `🔍 "${keyword}" (${data.total || rows.length})`,
                                    rows
                                }],
                            }),
                        },
                    }],
                    viewOnce: true,
                }, {
                    quoted: m
                }
            )
            return
        }

        if (sub === 'manga' && sub2 === 'detail') {
            let url = args.slice(2).join(' ')
            if (!url) return m.reply('❌ URL tidak valid.')

            url = decodeURIComponent(url)
            await m.reply('📥 Mengambil detail manga...')
            const data = await apiGet('manga/detail', {
                url
            })

            if (!data?.status || !data?.result)
                return m.reply('❌ Gagal mengambil detail manga.')

            const r = data.result
            const info = r.information || {}
            const stats = r.statistics || {}
            const alt = r.alternativeTitles || {}

            const field = (label, value) => value && value !== '-' && value !== 'None' ? `┠ ❯ ${label}: ${value}\n` : ''
            const fieldLast = (label, value) => `┗ ❯ ${label}: ${value || '-'}`

            let text = `📚 *${r.title || '-'}*\n\n`
            text += `📝 *Synopsis:*\n${r.synopsis || '-'}\n\n`
            if (r.background) text += `📜 *Background:*\n${r.background.substring(0, 300)}${r.background.length > 300 ? '...' : ''}\n\n`

            const altLines = [
                alt.japanese && `┠ ❯ Japanese: ${alt.japanese}`,
                alt.english && `┠ ❯ English: ${alt.english}`,
                alt.synonyms && `┗ ❯ Synonyms: ${alt.synonyms}`,
            ].filter(Boolean)
            if (altLines.length) text += `🌐 *Alternative Titles:*\n${altLines.join('\n')}\n\n`

            text += `📊 *Information:*\n`
            text += field('Type', info.type)
            text += field('Volumes', info.volumes)
            text += field('Chapters', info.chapters)
            text += field('Status', info.status)
            text += field('Published', info.published)
            text += field('Genres', info.genres)
            text += field('Themes', info.themes)
            text += field('Demographic', info.demographic)
            text += field('Serialization', info.serialization)
            text += `${fieldLast('Authors', info.authors)}\n\n`

            text += `📈 *Statistics:*\n`
            text += `┠ ❯ Score: ⭐ ${stats.score || 'N/A'}\n`
            text += field('Ranked', stats.ranked)
            text += field('Popularity', stats.popularity)
            text += field('Members', stats.members)
            text += fieldLast('Favorites', stats.favorites)

            const thumbUrl = fixThumb(r.cover)
            const shortDesc = `${info.type || 'Manga'} • ${info.volumes || '?'} vol • ⭐ ${stats.score || 'N/A'}`
            const preview = thumbUrl ?
                await buildLinkPreview(conn, r.url, r.title, shortDesc, thumbUrl) :
                null

            await conn.sendMessage(
                m.chat, {
                    text: `${r.url}\n\n${text}`,
                    ...(preview && {
                        linkPreview: preview
                    }),
                    contextInfo: forwardContext()
                }, {
                    quoted: m
                }
            )
            return
        }

        if (sub === 'next') {
            const cacheKey = args[1]
            const pageIndex = parseInt(args[2])
            if (!cacheKey || isNaN(pageIndex)) return
            await sendPage(conn, m, cacheKey, pageIndex)
            return
        }

        const knownSubs = ['search', 'detail', 'schedule', 'seasonal', 'top', 'chara', 'manga', 'next']
        if (!knownSubs.includes(sub)) {
            m.reply(
                '📺 *MyAnimeList*\n\n' +
                '*Perintah:*\n' +
                '• `.mal search <judul>` — Cari anime\n' +
                '• `.mal detail <url>` — Detail lengkap anime\n' +
                '• `.mal schedule` — Jadwal tayang anime\n' +
                '• `.mal schedule <hari>` — Jadwal hari tertentu\n' +
                '• `.mal seasonal <season> <type>` — Anime per season\n' +
                '• `.mal top` — Top 50 anime MAL\n' +
                '• `.mal chara <nama>` — Cari karakter\n' +
                '• `.mal chara detail <url>` — Detail karakter\n' +
                '• `.mal manga <judul>` — Cari manga\n' +
                '• `.mal manga detail <url>` — Detail manga\n\n' +
                '*Season:* fall, spring, winter, summer\n' +
                '*Type:* tv-new, tv-continuing, ona, ova, movie, special\n\n' +
                '*Contoh:*\n' +
                '`.mal search naruto`\n' +
                '`.mal schedule monday`\n' +
                '`.mal seasonal fall tv-new`\n' +
                '`.mal top`\n' +
                '`.mal chara naruto`\n' +
                '`.mal manga naruto`'
            )
        }
    } catch (e) {
        console.error(`[MAL:${sub}]`, e?.response?.data || e.message)
        m.reply('❌ Terjadi kesalahan. Coba lagi nanti.')
    }
}

handler.command = /^(mal)$/i
handler.help = ['mal <search|detail|schedule|seasonal|top|chara|manga>']
handler.tags = ['anime']
handler.limit = true
handler.register = true

export default handler