import fs from 'fs';
import axios from 'axios';

const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

let handler = async (m, { args, conn }) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply('Masukkan judul novel sakura yang ingin dicari');

            await m.reply('Mencari...');
            try {
                const url = global.API('theresav', '/manga/sakura/search', { q: keyword }, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.results?.length)
                    return m.reply('Novel tidak ditemukan');

                let rows = data.results.map(v => ({
                    header: v.type || '',
                    title: v.title || 'No title',
                    description: v.status || '-',
                    id: `.sakura detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian: *${keyword}*`,
                    footer: `Total: ${data.total || data.results.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Novel' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'List Novel',
                                sections: [{ title: 'Hasil', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('SAKURA SEARCH ERROR:', e?.response?.data || e.message);
                m.reply('Error saat mencari (API Error)');
            }
            break;
        }

        case 'detail': {
            let url = args[1];
            if (!url) return m.reply('Link novel tidak valid');
            url = decodeURIComponent(url);

            await m.reply('Mengambil detail novel...');
            try {
                const apiUrl = global.API('theresav', '/manga/sakura/detail', { url }, 'apikey');
                const { data } = await axios.get(apiUrl);

                if (!data?.status || !data?.result)
                    return m.reply('Gagal mengambil detail novel');

                const r = data.result;

                let teks = `*${r.title || '-'}*\n\n`;
                if (r.alternativeTitle) teks += `Alt: ${r.alternativeTitle}\n`;
                teks += `Type: ${r.type || '-'}\n`;
                teks += `Status: ${r.status || '-'}\n`;
                teks += `Rating: ${r.rating || '-'}\n`;
                teks += `Author: ${r.author || '-'}\n`;
                teks += `Genre: ${(r.genres || []).join(', ') || '-'}\n\n`;
                teks += `${r.synopsis || '-'}`;

                let thumbBuffer;
                try {
                    if (r.cover) {
                        const res = await axios.get(r.cover, { responseType: 'arraybuffer' });
                        thumbBuffer = Buffer.from(res.data);
                    }
                } catch (e) { }

                if (!r.chapters?.length) {
                    return conn.sendMessage(m.chat, {
                        ...(thumbBuffer ? { image: thumbBuffer } : {}),
                        caption: teks + '\n\n(Tidak ada chapter yang tersedia)'
                    }, { quoted: m });
                }

                const rows = r.chapters.map(ch => ({
                    id: `.sakura read ${ch.url}`,
                    title: ch.title || 'No title',
                    description: ch.releaseDate || '-'
                }));

                await conn.sendMessage(m.chat, {
                    ...(thumbBuffer ? { image: thumbBuffer } : {}),
                    caption: teks,
                    footer: `Total Chapter: ${r.chapters.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Chapter' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Daftar Chapter',
                                sections: [{ title: 'Chapter', rows }]
                            })
                        }
                    }]
                }, { quoted: m });
            } catch (e) {
                console.error('SAKURA DETAIL ERROR:', e?.response?.data || e.message);
                m.reply('Error saat mengambil detail');
            }
            break;
        }

        case 'read':
        case 'download': {
            let url = args[1];
            if (!url) return m.reply('Link chapter tidak valid');
            url = decodeURIComponent(url);

            await m.reply('Mengambil isi chapter...');
            try {
                const apiUrl = global.API('theresav', '/manga/sakura/chapter', { url }, 'apikey');
                const { data } = await axios.get(apiUrl);

                if (!data?.status || !data?.result)
                    return m.reply('Gagal mengambil isi chapter novel');

                const r = data.result;
                let rawContent = (r.content || 'Tidak ada teks.').replace(/\n{3,}/g, '\n\n');
                let textContent = `*${r.chapterInfo || 'Chapter'}*\n\n${rawContent}`;

                if (r.navigation?.previousChapter || r.navigation?.tableOfContents || r.navigation?.nextChapter) {
                    let btn = new Button(conn)
                        .setTitle('乂 S A K U R A  N O V E L')
                        .setBody(textContent)
                        .setFooter(global.botname)
                        .addButton('', '');

                    if (r.navigation?.previousChapter) {
                        btn.addReply('⬅️ Sebelumnya', `.sakura read ${r.navigation.previousChapter}`);
                    }
                    if (r.navigation?.tableOfContents) {
                        try {
                            const detailUrl = global.API('theresav', '/manga/sakura/detail', { url: r.navigation.tableOfContents }, 'apikey');
                            const detailData = await axios.get(detailUrl);
                            
                            if (detailData.data?.status && detailData.data?.result?.chapters?.length > 0) {
                                btn.addSelection('📖 Daftar Chapter')
                                   .makeSection('Chapter List');
                                
                                detailData.data.result.chapters.forEach(ch => {
                                    btn.makeRow('', ch.title || 'Chapter', ch.releaseDate || '-', `.sakura read ${ch.url}`);
                                });
                            } else {
                                btn.addSelection('📖 Daftar Chapter')
                                   .makeSection('Navigasi')
                                   .makeRow('', 'Daftar Chapter', 'Kembali ke detail novel', `.sakura detail ${r.navigation.tableOfContents}`);
                            }
                        } catch (e) {
                            btn.addSelection('📖 Daftar Chapter')
                               .makeSection('Navigasi')
                               .makeRow('', 'Daftar Chapter', 'Kembali ke detail novel', `.sakura detail ${r.navigation.tableOfContents}`);
                        }
                    }
                    if (r.navigation?.nextChapter) {
                        btn.addReply('Selanjutnya ➡️', `.sakura read ${r.navigation.nextChapter}`);
                    }

                    await btn.send(m.chat, { quoted: m });
                } else {
                    await conn.sendMessage(m.chat, { text: textContent }, { quoted: m });
                }

                } catch (e) {
                console.error('SAKURA CHAPTER ERROR:', e?.response?.data || e.message);
                m.reply('Error saat mengambil isi chapter');
            }
            break;
        }

        default:
            m.reply(
                '*SakuraNovel*\n\n' +
                '.sakura search <judul>\n' +
                '.sakura detail <url>\n' +
                '.sakura read <url>'
            );
    }
};

handler.command = /^(sakura|sakuranovel)$/i;
handler.help = [
    'sakura search <judul>',
    'sakura detail <url>',
    'sakura read <url>'
];
handler.tags = ['manga'];
handler.limit = true;
handler.register = true;

export default handler;