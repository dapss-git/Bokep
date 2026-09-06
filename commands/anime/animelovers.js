import axios from 'axios';
import { AIRich } from '../../core/nixcode.js';

const getParamValue = (rawVal) => {
    if (!rawVal) return null;
    rawVal = decodeURIComponent(rawVal);
    if (rawVal.startsWith('http')) {
        return rawVal.split('/').filter(Boolean).pop();
    }
    return rawVal;
};

let handler = async (m, { args, conn, usedPrefix, command }) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply(`Masukkan judul anime yang ingin dicari\nContoh: ${usedPrefix + command} search one piece`);
            await m.reply('Mencari...');
            try {
                const url = global.API('theresav', '/anime/animelovers/search', { q: keyword }, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.data?.data?.[0]?.result;

                if (!data?.status || !results?.length) return m.reply('Tidak ditemukan hasil untuk ' + keyword);

                let rows = results.slice(0, 50).map((v, i) => ({
                    header: '',
                    title: (v.judul || 'No title').substring(0, 50),
                    description: `ID: ${v.id} | Lihat Detail`,
                    id: `${usedPrefix + command} detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian AnimeLovers: *${keyword}*`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Anime' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Anime', sections: [{ title: 'Hasil', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANIMELOVERS SEARCH ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari');
            }
            break;
        }

        case 'latest':
        case 'new':
        case 'home': {
            await m.reply('Mengambil update terbaru dari AnimeLovers...');
            try {
                const url = global.API('theresav', '/anime/animelovers/new', {}, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.data;

                if (!data?.status || !results?.length) return m.reply('Tidak ada update terbaru');

                let rows = results.slice(0, 50).map((v, i) => ({
                    header: v.lastup || '',
                    title: (v.judul || 'No title').substring(0, 50),
                    description: v.lastch ? `Ch: ${v.lastch}` : 'Lihat Detail',
                    id: `${usedPrefix + command} detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Update Terbaru AnimeLovers 🆕`,
                    footer: `Total Update: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Anime' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'Update Terbaru', sections: [{ title: 'List Update', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANIMELOVERS NEW ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil update terbaru');
            }
            break;
        }

        case 'movies': {
            await m.reply('Mengambil daftar movie terbaru dari AnimeLovers...');
            try {
                const url = global.API('theresav', '/anime/animelovers/movies', {}, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.data;

                if (!data?.status || !results?.length) return m.reply('Tidak ada daftar movie');

                let rows = results.slice(0, 50).map((v, i) => ({
                    header: v.lastup || '',
                    title: (v.judul || 'No title').substring(0, 50),
                    description: v.lastch ? `Ch: ${v.lastch}` : 'Lihat Detail',
                    id: `${usedPrefix + command} detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Daftar Movie AnimeLovers 🎬`,
                    footer: `Total Movie: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Movie' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Movie', sections: [{ title: 'Hasil', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANIMELOVERS MOVIES ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil daftar movie');
            }
            break;
        }

        case 'genre': {
            const genre = args.slice(1).join(' ').toLowerCase();
            if (!genre) {
                const genres = ["action", "adventure", "comedy", "demons", "drama", "ecchi", "fantasy", "game", "harem", "historical", "horror", "josei", "magic", "martial-arts", "mecha", "military", "music", "mystery", "psychological", "parody", "police", "romance", "samurai", "school", "sci-fi", "seinen", "shoujo", "shoujo-ai", "shounen", "shounen-ai", "slice-of-life", "space", "sports", "super-power", "supernatural", "thriller", "vampire", "yaoi", "yuri"];
                let rows = genres.map(g => ({
                    title: g.charAt(0).toUpperCase() + g.slice(1),
                    id: `${usedPrefix + command} genre ${g}`
                }));
                let sections = [];
                let currentRows = [];
                let sectionIndex = 1;
                rows.forEach((row, index) => {
                    currentRows.push(row);
                    if (currentRows.length >= 20 || index === rows.length - 1) {
                        sections.push({ title: `Pilihan Genre (${sectionIndex++})`, rows: currentRows });
                        currentRows = [];
                    }
                });
                return conn.sendMessage(m.chat, {
                    text: `Silakan pilih genre anime yang ingin dicari:`,
                    footer: global.footer,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Genre' },
                        type: 4,
                        nativeFlowInfo: { name: 'single_select', paramsJson: JSON.stringify({ title: 'Daftar Genre', sections }) }
                    }],
                    viewOnce: true
                }, { quoted: m });
            }
            await m.reply(`Mencari anime genre *${genre}*...`);
            try {
                const url = global.API('theresav', '/anime/animelovers/genre', { genre }, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.data;

                if (!data?.status || !results?.length) return m.reply(`Tidak ditemukan anime untuk genre *${genre}*`);

                let rows = results.slice(0, 50).map((v, i) => {
                    const idUrl = (v.link || v.url || '');
                    return {
                        header: v.release_date || '',
                        title: (v.anime_name || v.judul || 'No title').substring(0, 50),
                        description: `Lihat Detail`,
                        id: `${usedPrefix + command} detail ${idUrl}`
                    };
                });

                await conn.sendMessage(m.chat, {
                    text: `Anime Genre: *${genre}*`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Anime' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Anime', sections: [{ title: 'Hasil', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANIMELOVERS GENRE ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari genre');
            }
            break;
        }

        case 'list': {
            const alphabet = args.slice(1).join(' ').toLowerCase();
            if (!alphabet) {
                const alphabets = ["0-9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
                let rows = alphabets.map(a => ({
                    title: `Awalan ${a.toUpperCase()}`,
                    id: `${usedPrefix + command} list ${a}`
                }));
                let sections = [];
                let currentRows = [];
                let sectionIndex = 1;
                rows.forEach((row, index) => {
                    currentRows.push(row);
                    if (currentRows.length >= 20 || index === rows.length - 1) {
                        sections.push({ title: `Pilihan Abjad (${sectionIndex++})`, rows: currentRows });
                        currentRows = [];
                    }
                });
                return conn.sendMessage(m.chat, {
                    text: `Silakan pilih awalan abjad untuk daftar anime:`,
                    footer: global.footer,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Abjad' },
                        type: 4,
                        nativeFlowInfo: { name: 'single_select', paramsJson: JSON.stringify({ title: 'Daftar Abjad', sections }) }
                    }],
                    viewOnce: true
                }, { quoted: m });
            }
            await m.reply(`Mengambil daftar anime dengan abjad *${alphabet}*...`);
            try {
                const url = global.API('theresav', '/anime/animelovers/list', { alphabet }, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.data;

                if (!data?.status || !results?.length) return m.reply(`Tidak ditemukan anime untuk abjad *${alphabet}*`);

                let rows = results.slice(0, 50).map((v, i) => {
                    const idUrl = (v.url || v.link || '');
                    return {
                        header: '',
                        title: (v.judul || v.anime_name || 'No title').substring(0, 50),
                        description: `Lihat Detail`,
                        id: `${usedPrefix + command} detail ${idUrl}`
                    };
                });

                await conn.sendMessage(m.chat, {
                    text: `Daftar Anime: *${alphabet.toUpperCase()}*`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Anime' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Anime', sections: [{ title: 'Hasil', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANIMELOVERS LIST ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil daftar anime');
            }
            break;
        }

        case 'schedule': {
            const day = args.slice(1).join(' ').toLowerCase();
            if (!day) {
                const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
                let rows = days.map(d => ({
                    title: d.charAt(0).toUpperCase() + d.slice(1),
                    id: `${usedPrefix + command} schedule ${d}`
                }));
                return conn.sendMessage(m.chat, {
                    text: `Silakan pilih hari jadwal rilis:`,
                    footer: global.footer,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Hari' },
                        type: 4,
                        nativeFlowInfo: { name: 'single_select', paramsJson: JSON.stringify({ title: 'Daftar Hari', sections: [{ title: 'Hari', rows }] }) }
                    }],
                    viewOnce: true
                }, { quoted: m });
            }
            await m.reply(`Mengambil jadwal rilis hari *${day}*...`);
            try {
                const url = global.API('theresav', '/anime/animelovers/schedule', { day }, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.data;

                if (!data?.status || !results?.length) return m.reply(`Tidak ada jadwal rilis untuk hari *${day}*`);

                let rows = results.slice(0, 50).map((v, i) => {
                    const idUrl = (v.link || v.url || '');
                    return {
                        header: '',
                        title: (v.anime_name || v.judul || 'No title').substring(0, 50),
                        description: `Lihat Detail`,
                        id: `${usedPrefix + command} detail ${idUrl}`
                    };
                });

                await conn.sendMessage(m.chat, {
                    text: `Jadwal Rilis: *${day.toUpperCase()}*`,
                    footer: `Total Jadwal: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Anime' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Anime', sections: [{ title: 'Jadwal', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANIMELOVERS SCHEDULE ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil jadwal');
            }
            break;
        }

        case 'detail': {
            const val = getParamValue(args[1]);
            if (!val) return m.reply('Parameter tidak valid');

            await m.reply('Mengambil detail anime...');
            try {
                const apiUrl = global.API('theresav', '/anime/animelovers/detail', { url: val }, 'apikey');
                const { data } = await axios.get(apiUrl);
                const r = data?.data?.data?.[0];

                if (!data?.status || !r) return m.reply('Gagal mengambil detail');

                let teks = `*${r.judul || '-'}*\n\n`;
                if (r.type) teks += `Tipe: ${r.type}\n`;
                if (r.status) teks += `Status: ${r.status}\n`;
                if (r.rating) teks += `Rating: ${r.rating}\n`;
                if (r.published) teks += `Rilis: ${r.published}\n`;
                if (r.author) teks += `Author/Studio: ${r.author}\n`;
                if (r.genre && r.genre.length > 0) teks += `Genre: ${r.genre.join(', ')}\n`;
                
                let desc = r.sinopsis || 'Tidak ada deskripsi';
                if (desc.length > 800) desc = desc.substring(0, 800) + '...';
                teks += `\n*Sinopsis:*\n${desc}`;

                const thumbUrl = r.cover;
                const chapters = r.chapter;

                if (!chapters?.length) {
                    return conn.sendMessage(m.chat, { ...(thumbUrl ? { image: { url: thumbUrl } } : {}), caption: teks + '\n\n(Belum ada episode)' }, { quoted: m });
                }

                const rows = chapters.map((ch, idx) => ({
                    id: `${usedPrefix + command} download ${ch.url}`,
                    title: `Episode ${ch.ch}`,
                    description: `ID: ${ch.id} | Tanggal: ${new Date(ch.date * 1000).toLocaleDateString('id-ID')}`
                }));

                // Split rows into sections if > 20
                let sections = [];
                let currentRows = [];
                let sectionIndex = 1;

                rows.forEach((row, index) => {
                    currentRows.push(row);
                    if (currentRows.length >= 20 || index === rows.length - 1) {
                        sections.push({
                            title: `Episode List (Bagian ${sectionIndex++})`,
                            rows: currentRows
                        });
                        currentRows = [];
                    }
                });

                await conn.sendMessage(m.chat, {
                    ...(thumbUrl ? { image: { url: thumbUrl } } : {}),
                    caption: teks,
                    footer: global.footer,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Episode' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'Daftar Episode', sections: sections })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANIMELOVERS DETAIL ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil detail anime');
            }
            break;
        }

        case 'download':
        case 'episode': {
            const val = getParamValue(args[1]);
            if (!val) return m.reply('Parameter tidak valid');

            await m.reply('⏳ Memeriksa resolusi yang tersedia...');
            
            const possibleResolutions = ['360p', '480p', '720p', '1080p', '4K'];
            let availableResolutions = [];

            await Promise.all(possibleResolutions.map(async (reso) => {
                try {
                    const apiUrl = global.API('theresav', '/anime/animelovers/episode', { url: val, reso: reso }, 'apikey');
                    const { data } = await axios.get(apiUrl);
                    if (data?.data?.data?.[0]?.stream?.length > 0) {
                        availableResolutions.push(reso);
                    }
                } catch (e) {
                    // Ignore
                }
            }));

            if (availableResolutions.length === 0) {
                return m.reply('❌ Tidak ada link video yang tersedia untuk episode ini.');
            }

            // Sort to maintain order
            availableResolutions.sort((a, b) => {
                const order = { '360p': 1, '480p': 2, '720p': 3, '1080p': 4, '4K': 5 };
                return order[a] - order[b];
            });

            let rows = availableResolutions.map(reso => ({
                title: `Resolusi ${reso}`,
                id: `${usedPrefix + command} sendvideo ${val} ${reso}`
            }));

            await conn.sendMessage(m.chat, {
                text: `Pilih resolusi video untuk Episode: *${val}*`,
                footer: global.footer,
                buttons: [{
                    buttonId: 'action',
                    buttonText: { displayText: 'Pilih Resolusi' },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({ title: 'Daftar Resolusi', sections: [{ title: 'Resolusi Tersedia', rows }] })
                    }
                }],
                viewOnce: true
            }, { quoted: m });
            break;
        }

        case 'sendvideo': {
            const val = args[1];
            const reso = args[2];
            if (!val || !reso) return m.reply('Parameter tidak valid');

            await m.reply(`⏳ Sedang mengambil video resolusi ${reso}...`);
            try {
                const apiUrl = global.API('theresav', '/anime/animelovers/episode', { url: val, reso: reso }, 'apikey');
                const { data } = await axios.get(apiUrl);
                
                const streamData = data?.data?.data?.[0]?.stream;
                
                if (streamData && streamData.length > 0) {
                    const videoLink = streamData[0].link;
                    await conn.sendMessage(m.chat, {
                        video: { url: videoLink },
                        caption: `🎬 *AnimeLovers Video*\n\nEpisode ID: ${val}\nResolusi: ${reso}`
                    }, { quoted: m });
                } else {
                    return m.reply(`❌ Link video untuk resolusi ${reso} tidak tersedia.`);
                }
            } catch (e) {
                console.error('ANIMELOVERS SENDVIDEO ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat memproses video');
            }
            break;
        }

        default: {
            m.reply(`*Fitur AnimeLovers*\n\n1. *${usedPrefix + command} search <judul>* - Mencari anime\n2. *${usedPrefix + command} latest* - Update anime terbaru\n3. *${usedPrefix + command} movies* - Daftar anime movie\n4. *${usedPrefix + command} genre <genre>* - Cari anime per genre\n5. *${usedPrefix + command} list <abjad>* - Daftar anime dari A-Z\n6. *${usedPrefix + command} schedule <hari>* - Jadwal tayang anime\n7. *${usedPrefix + command} detail <url>* - Detail anime\n8. *${usedPrefix + command} download <url>* - Link streaming episode`);
            break;
        }
    }
}

handler.help = ['animelovers']
handler.tags = ['anime']
handler.command = /^(animelovers|al)$/i

handler.register = true

export default handler