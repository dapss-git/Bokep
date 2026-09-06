import axios from 'axios';

let handler = async (m, { args, conn, usedPrefix, command, text }) => {
    let input = text || (m.quoted && m.quoted.text) || '';
    if (!input) {
        return m.reply(`Masukkan kata kunci pencarian atau URL Douyin.\nContoh:\n${usedPrefix + command} Beijing\n${usedPrefix + command} https://v.douyin.com/xxxx/`);
    }

    const isUrl = /(https?:\/\/[^\s]+)/.exec(input);

    if (!isUrl) {
        // Jika bukan URL, maka lakukan pencarian (Search)
        const keyword = input.trim();
        await global.loading(m, conn);
        try {
            const url = global.API('theresav', '/search/douyin', { q: keyword }, 'apikey');
            const { data } = await axios.get(url);

            const hasil = data?.data || data?.results || data?.result || [];

            if (!data?.status || !hasil.length)
                return m.reply('Tidak ditemukan hasil pencarian Douyin untuk: ' + keyword);



            let rows = hasil.slice(0, 50)
                .filter(v => v.video_url)  // Filter out items without valid URL
                .map(v => ({
                    header: 'Douyin Video',
                    title: (v.description || v.title || v.desc || 'Video').substring(0, 50),
                    description: `❤️ ${v.likes || 0} | 💬 ${v.comments || 0}`,
                    id: `.${command} ${v.video_url}`
                }));

            if (!rows.length) return m.reply('Tidak ditemukan video yang valid untuk: ' + keyword);

            await conn.sendMessage(m.chat, {
                text: `Hasil pencarian Douyin: ${keyword}`,
                footer: 'Douyin Downloader & Search',
                buttons: [{
                    buttonId: 'action',
                    buttonText: { displayText: 'Pilih Video' },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Daftar Video',
                            sections: [{ title: 'Hasil Pencarian', rows }]
                        })
                    }
                }],
                viewOnce: true
            }, { quoted: m });
        } catch (e) {
            console.error('DOUYIN SEARCH ERROR:', e?.response?.data || e.message);
            m.reply('Error API saat mencari Douyin');
        } finally {
            await global.loading(m, conn, true);
        }
        return;
    }

    // Jika berupa URL, lakukan download
    const link = isUrl[0];

    await global.loading(m, conn);
    try {
        const apiUrl = global.API('theresav', '/download/douyin', { url: link }, 'apikey');
        const { data } = await axios.get(apiUrl);

        const r = data?.data || data?.result || data;

        if (!data?.status || !r) {
            return m.reply('Gagal mengambil data dari URL tersebut.');
        }

        const videoUrl = r.hd || r.mp4 || r.video_no_watermark || r.video || r.play_url || r.url || r.media || (r.video_data && r.video_data.nwm_video_url) || r.no_watermark;
        const title = r.title || r.desc || r.description || '-';
        const author = (r.author && r.author !== 'Unknown') ? r.author : '-';

        if (!videoUrl) return m.reply('Gagal menemukan link video di dalam respon API.');

        let teks = `🎬 *Douyin Downloader*\n\n`;
        teks += `📌 *Title:* ${title}\n`;
        teks += `👤 *Author:* ${author}\n`;

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: teks,
            mimetype: 'video/mp4'
        }, { quoted: m });

    } catch (e) {
        console.error('DOUYIN DOWNLOAD ERROR:', e?.response?.data || e.message);
        m.reply('Error saat mendownload Douyin');
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['douyin <query/url>'];
handler.tags = ['downloader'];
handler.command = /^(douyin|dy)$/i;
handler.limit = true;
handler.register = true;

export default handler;
