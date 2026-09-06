import axios from 'axios';

const getParamValue = (rawVal) => {
    if (!rawVal) return null;
    rawVal = decodeURIComponent(rawVal);
    // Anichin uses full URLs for its endpoints instead of just slugs
    return rawVal;
};

let handler = async (m, { args, conn, usedPrefix, command }) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply(`Masukkan judul donghua yang ingin dicari\nContoh: ${usedPrefix + command} search btth`);
            await m.reply('Mencari...');
            try {
                const url = global.API('theresav', '/anime/anichin/search', { q: keyword }, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.result;

                if (!data?.status || !results?.length) return m.reply('Tidak ditemukan hasil untuk ' + keyword);

                let rows = results.slice(0, 50).map((v) => ({
                    header: v.status || '',
                    title: (v.title || 'No title').substring(0, 50),
                    description: `Lihat Detail`,
                    id: `${usedPrefix + command} detail ${v.link || v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian Anichin: *${keyword}*`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Donghua' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Donghua', sections: [{ title: 'Hasil', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANICHIN SEARCH ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari');
            }
            break;
        }

        case 'latest':
        case 'new': {
            await m.reply('Mengambil update terbaru dari Anichin...');
            try {
                const url = global.API('theresav', '/anime/anichin/latest', {}, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.result;

                if (!data?.status || !results?.length) return m.reply('Tidak ada update terbaru');

                let rows = results.slice(0, 50).map((v) => ({
                    header: v.episode || '',
                    title: (v.title || 'No title').substring(0, 50),
                    description: 'Download Episode',
                    id: `${usedPrefix + command} download ${v.link || v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Update Terbaru Anichin 🆕`,
                    footer: `Total Update: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Donghua' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'Update Terbaru', sections: [{ title: 'List Update', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANICHIN LATEST ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil update terbaru');
            }
            break;
        }

        case 'popular': {
            await m.reply('Mengambil daftar donghua terpopuler...');
            try {
                const url = global.API('theresav', '/anime/anichin/popular', {}, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.result;

                if (!data?.status || !results?.length) return m.reply('Tidak ada daftar populer');

                let rows = results.slice(0, 50).map((v) => ({
                    header: v.status || '',
                    title: (v.title || 'No title').substring(0, 50),
                    description: 'Lihat Detail',
                    id: `${usedPrefix + command} detail ${v.link || v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Daftar Populer Anichin 🌟`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Donghua' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Populer', sections: [{ title: 'Hasil', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANICHIN POPULAR ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil daftar populer');
            }
            break;
        }

        case 'genre': {
            const genre = args.slice(1).join(' ').toLowerCase();
            if (!genre) {
                const genres = ["action", "adventure", "comedy", "cultivation", "demons", "drama", "ecchi", "fantasy", "harem", "historical", "horror", "isekai", "magic", "martial-arts", "mecha", "military", "music", "mystery", "psychological", "reincarnation", "romance", "school", "sci-fi", "shounen", "slice-of-life", "super-power", "supernatural", "thriller"];
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
                    text: `Silakan pilih genre donghua:`,
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
            await m.reply(`Mencari donghua genre *${genre}*...`);
            try {
                const url = global.API('theresav', '/anime/anichin/genre', { genre }, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.result;

                if (!data?.status || !results?.length) return m.reply(`Tidak ditemukan donghua untuk genre *${genre}*`);

                let rows = results.slice(0, 50).map((v) => {
                    return {
                        header: v.status || '',
                        title: (v.title || 'No title').substring(0, 50),
                        description: `Lihat Detail`,
                        id: `${usedPrefix + command} detail ${v.link || v.url}`
                    };
                });

                await conn.sendMessage(m.chat, {
                    text: `Donghua Genre: *${genre}*`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Donghua' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Donghua', sections: [{ title: 'Hasil', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANICHIN GENRE ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari genre');
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
                    text: `Silakan pilih hari jadwal rilis donghua:`,
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
                const url = global.API('theresav', '/anime/anichin/schedule', { day }, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.result;

                if (!data?.status || !results?.length) return m.reply(`Tidak ada jadwal rilis untuk hari *${day}*`);

                let rows = results.slice(0, 50).map((v) => {
                    return {
                        header: v.time || '',
                        title: (v.title || 'No title').substring(0, 50),
                        description: `Lihat Detail`,
                        id: `${usedPrefix + command} detail ${v.link || v.url}`
                    };
                });

                await conn.sendMessage(m.chat, {
                    text: `Jadwal Rilis: *${day.toUpperCase()}*`,
                    footer: `Total Jadwal: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Donghua' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Donghua', sections: [{ title: 'Jadwal', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('ANICHIN SCHEDULE ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil jadwal');
            }
            break;
        }

        case 'detail': {
            const val = args.slice(1).join(' ');
            if (!val) return m.reply('Parameter tidak valid');

            await m.reply('Mengambil detail donghua...');
            try {
                // Determine if it's a full URL or needs prepending
                let detailUrlTarget = val;
                if (!detailUrlTarget.startsWith('http')) {
                    detailUrlTarget = `https://anichin.cafe/seri/${val}`;
                }

                // Fetch detail
                const detailUrl = global.API('theresav', '/anime/anichin/detail', { url: detailUrlTarget }, 'apikey');
                const detailReq = await axios.get(detailUrl);
                const r = detailReq.data?.result;

                if (!detailReq.data?.status || !r) return m.reply('Gagal mengambil detail');

                // Fetch episodes
                const episodeUrl = global.API('theresav', '/anime/anichin/episode', { url: detailUrlTarget }, 'apikey');
                const episodeReq = await axios.get(episodeUrl);
                const chapters = episodeReq.data?.result || [];

                let teks = `*${r.title || '-'}*\n\n`;
                if (r.alternativeTitles) teks += `Alternatif: ${r.alternativeTitles}\n`;
                if (r.status) teks += `Status: ${r.status}\n`;
                if (r.rating) teks += `Rating: ${r.rating}\n`;
                if (r.released) teks += `Rilis: ${r.released}\n`;
                if (r.studio) teks += `Studio: ${r.studio}\n`;
                if (r.genres && r.genres.length > 0) teks += `Genre: ${r.genres.join(', ')}\n`;
                
                let desc = r.synopsis || 'Tidak ada deskripsi';
                if (desc.length > 800) desc = desc.substring(0, 800) + '...';
                teks += `\n*Sinopsis:*\n${desc}`;

                const thumbUrl = r.thumbnail;

                if (!chapters?.length) {
                    return conn.sendMessage(m.chat, { ...(thumbUrl ? { image: { url: thumbUrl } } : {}), caption: teks + '\n\n(Belum ada episode)' }, { quoted: m });
                }

                const rows = chapters.map((ch) => ({
                    id: `${usedPrefix + command} download ${ch.link}`,
                    title: `Episode ${ch.episodeNumber || ch.title}`,
                    description: ch.releaseDate || 'Unduh'
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
                console.error('ANICHIN DETAIL ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil detail donghua');
            }
            break;
        }

        case 'download':
        case 'episode': {
            const val = args.slice(1).join(' ');
            if (!val) return m.reply('Parameter tidak valid');

            await m.reply('Mengambil link download...');
            try {
                let downloadUrlTarget = val;
                if (!downloadUrlTarget.startsWith('http')) {
                    // Assuming episode links might just be passed as slugs if truncated
                    downloadUrlTarget = `https://anichin.cafe/${val}`;
                }

                const apiUrl = global.API('theresav', '/anime/anichin/download', { url: downloadUrlTarget }, 'apikey');
                const { data } = await axios.get(apiUrl);
                const results = data?.result;
                
                if (!data?.status || !results?.length) {
                    return m.reply('Gagal mengambil link download atau link tidak tersedia.');
                }

                let resultText = `*Link Download Anichin*\nEpisode: ${downloadUrlTarget.split('/').filter(Boolean).pop()}\n\n`;

                results.forEach((resObj) => {
                    if (resObj.links && resObj.links.length > 0) {
                        resultText += `*[ ${resObj.resolution} ]*\n`;
                        
                        // To avoid spam, only take unique hosts or the first 5
                        const uniqueHosts = new Set();
                        resObj.links.forEach((linkObj) => {
                            if (!uniqueHosts.has(linkObj.host)) {
                                uniqueHosts.add(linkObj.host);
                                resultText += `- ${linkObj.host}: ${linkObj.url}\n`;
                            }
                        });
                        resultText += '\n';
                    }
                });

                await m.reply(resultText.trim());

            } catch (e) {
                console.error('ANICHIN DOWNLOAD ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil link download');
            }
            break;
        }

        default: {
            m.reply(`*Fitur Anichin (Donghua)*\n\n1. *${usedPrefix + command} search <judul>* - Mencari donghua\n2. *${usedPrefix + command} latest* - Update donghua terbaru\n3. *${usedPrefix + command} popular* - Daftar donghua populer\n4. *${usedPrefix + command} genre <genre>* - Cari donghua per genre\n5. *${usedPrefix + command} schedule <hari>* - Jadwal tayang donghua\n6. *${usedPrefix + command} detail <url>* - Detail & list episode\n7. *${usedPrefix + command} download <url>* - Link download episode`);
            break;
        }
    }
}

handler.help = ['anichin']
handler.tags = ['anime']
handler.command = /^(anichin)$/i

handler.register = true

export default handler
