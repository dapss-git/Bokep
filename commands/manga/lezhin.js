import axios from 'axios';

let handler = async (m, { args, conn, usedPrefix, command }) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply(`Masukkan judul webtoon Lezhin yang ingin dicari\nContoh: ${usedPrefix + command} search painter`);

            await m.reply('Mencari...');
            try {
                const url = global.API('theresav', '/manga/lezhin/search', { q: keyword, t: 'all' }, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.result?.length)
                    return m.reply('Tidak ditemukan hasil untuk ' + keyword);

                let rows = data.result.map(v => ({
                    header: v.authors || 'Author',
                    title: v.title || 'No title',
                    description: `Adult: ${v.adult ? 'Yes 🔞' : 'No'}`,
                    id: `${v.href}` // Sending link directly or could use a detail command if existed
                }));

                await conn.sendMessage(m.chat, {
                    text: `*Hasil Pencarian Lezhin:* _${keyword}_`,
                    footer: `Total: ${data.result.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Webtoon' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'List Webtoon',
                                sections: [{ title: 'Hasil', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('LEZHIN SEARCH ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari');
            }
            break;
        }

        case 'daily': {
            let day = args[1];
            if (day === undefined) day = new Date().getDay();
            await m.reply('Mengambil jadwal harian...');
            try {
                const url = global.API('theresav', '/manga/lezhin/daily', { day }, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.result?.length)
                    return m.reply('Gagal mengambil data harian');

                let rows = data.result.map(v => ({
                    header: v.state || 'Webtoon',
                    title: v.title || 'No title',
                    description: `Author: ${v.authors || '-'}`,
                    id: `${usedPrefix + command} search ${v.title}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `*Lezhin Daily Schedule (Day: ${day})* 📅`,
                    footer: `Total: ${data.result.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Webtoon' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Jadwal Harian',
                                sections: [{ title: 'List Webtoon', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('LEZHIN DAILY ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil jadwal harian');
            }
            break;
        }

        case 'free': {
            await m.reply('Mengambil daftar webtoon gratis...');
            try {
                const url = global.API('theresav', '/manga/lezhin/free', {}, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.result?.length)
                    return m.reply('Gagal mengambil data webtoon gratis');

                let rows = data.result.map(v => ({
                    header: v.state || 'Free',
                    title: v.title || 'No title',
                    description: `Author: ${v.authors || '-'}`,
                    id: `${usedPrefix + command} search ${v.title}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `*Lezhin Free Webtoons* 🎁`,
                    footer: `Total: ${data.result.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Webtoon' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Webtoon Gratis',
                                sections: [{ title: 'List Webtoon', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('LEZHIN FREE ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil webtoon gratis');
            }
            break;
        }

        case 'genre': {
            let genre = args[1] || 'all';
            await m.reply(`Mengambil daftar webtoon genre: ${genre}...`);
            try {
                const url = global.API('theresav', '/manga/lezhin/genreplus', { sub_tags: genre }, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.result?.length)
                    return m.reply(`Gagal mengambil data genre ${genre}`);

                let rows = data.result.map(v => ({
                    header: v.state || 'Genre',
                    title: v.title || 'No title',
                    description: `Author: ${v.authors || '-'}`,
                    id: `${usedPrefix + command} search ${v.title}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `*Lezhin Genre: ${genre.toUpperCase()}*`,
                    footer: `Total: ${data.result.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Webtoon' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Webtoon Genre',
                                sections: [{ title: 'List Webtoon', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('LEZHIN GENRE ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil genre');
            }
            break;
        }

        case 'ranking': {
            await m.reply('Mengambil ranking teratas...');
            try {
                const url = global.API('theresav', '/manga/lezhin', '/ranking', 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.result?.length)
                    return m.reply('Gagal mengambil data ranking');

                let rows = data.result.map((v, i) => ({
                    header: `Rank ${i + 1}`,
                    title: v.title || 'No title',
                    description: `Author: ${v.authors || '-'}`,
                    id: `${usedPrefix + command} search ${v.title}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `*Lezhin Ranking Top Webtoons* 🏆`,
                    footer: `Total: ${data.result.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Webtoon' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Ranking Webtoon',
                                sections: [{ title: 'Top List', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('LEZHIN RANKING ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil ranking');
            }
            break;
        }

        case 'home': {
            await m.reply('Mengambil konten beranda Lezhin...');
            try {
                const url = global.API('theresav', '/manga/lezhin/home', {}, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.result)
                    return m.reply('Gagal mengambil data beranda');

                const spotlight = data.result.spotlight || [];
                if (!spotlight.length) return m.reply('Beranda kosong atau tidak dapat diakses');

                let rows = spotlight.map(v => ({
                    header: 'Spotlight',
                    title: v.title || 'No title',
                    description: v.desc || '-',
                    id: `${usedPrefix + command} search ${v.title}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `*Lezhin Spotlight* ✨`,
                    footer: `Total: ${spotlight.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Webtoon' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Spotlight Webtoon',
                                sections: [{ title: 'List Spotlight', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('LEZHIN HOME ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil beranda');
            }
            break;
        }

        default:
            m.reply(
                '*Lezhin Webtoon Explorer*\n\n' +
                `.${command} search <judul>\n` +
                `.${command} daily <0-6>\n` +
                `.${command} free\n` +
                `.${command} genre <name>\n` +
                `.${command} ranking\n` +
                `.${command} home`
            );
    }
};

handler.command = /^(lezhin)$/i;
handler.help = [
    'lezhin search <judul>',
    'lezhin daily <0-6>',
    'lezhin free',
    'lezhin genre <name>',
    'lezhin ranking',
    'lezhin home'
];
handler.tags = ['manga'];
handler.limit = true;
handler.register = true;

export default handler;
