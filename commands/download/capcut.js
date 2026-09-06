import axios from "axios";

async function downloadCapcut(url) {
	const startTime = Date.now();
	const response = await axios.get(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
			Accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
		},
		timeout: 10000,
	});

	const html = response.data;

	const getRegexValue = (regex, str) => {
		const m = str.match(regex);
		return m ? m[1] : "N/A";
	};

	const title = getRegexValue(/"title":"(.*?)"/, html);
	const usageAmount = getRegexValue(/"usageAmount":([0-9]+)/, html);
	const likeCount = getRegexValue(/"likeCount":([0-9]+)/, html);
	const playCount = getRegexValue(/"playCount":([0-9]+)/, html);

	let videoUrl = getRegexValue(/"videoUrl":"(.*?)"/, html);
	if (videoUrl !== "N/A") {
		videoUrl = videoUrl.replace(/\\u002F/g, "/");
	}

	let coverUrl = getRegexValue(/"coverUrl":"(.*?)"/, html);
	if (coverUrl !== "N/A") {
		coverUrl = coverUrl.replace(/\\u002F/g, "/");
	}

	return {
		title: title !== "N/A" ? title : "CapCut Template",
		usageAmount: usageAmount !== "N/A" ? parseInt(usageAmount, 10) : 0,
		likeCount: likeCount !== "N/A" ? parseInt(likeCount, 10) : 0,
		playCount: playCount !== "N/A" ? parseInt(playCount, 10) : 0,
		thumbnail: coverUrl !== "N/A" ? coverUrl : null,
		download_url: videoUrl !== "N/A" ? videoUrl : null,
		time_taken: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
	};
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        const text = args.join(' ') || (m.quoted && (m.quoted.text || m.quoted.caption));

        if (!text) {
            return m.reply(
                `> ◦❒ *Contoh:* ${usedPrefix + command} https://www.capcut.com/template-detail/xxxxx\n` +
                `> ◦❒ Atau reply pesan yang berisi link CapCut`
            );
        }

        const urlMatch = text.match(/https?:\/\/[^\s]+/i);
        if (!urlMatch || !urlMatch[0].includes("capcut.com")) {
            return m.reply('> ◦❒ Masukkan URL CapCut yang valid!');
        }

        const targetUrl = urlMatch[0];
        await m.reply('> ◦❒ Mengambil data template CapCut... ⏳');

        const data = await downloadCapcut(targetUrl);

        if (!data || !data.download_url) {
            return m.reply('> ◦❒ Gagal mendownload video dari link CapCut tersebut.');
        }

        const caption = `> ╭─❁ *CAPCUT DOWNLOADER* ❁\n` +
                        `> ◦❒ *Judul:* ${data.title}\n` +
                        `> ◦❒ *Digunakan:* ${data.usageAmount.toLocaleString()}x\n` +
                        `> ◦❒ *Suka:* ${data.likeCount.toLocaleString()}\n` +
                        `> ◦❒ *Dilihat:* ${data.playCount.toLocaleString()}\n` +
                        `> ╰─❁`;

        await conn.sendMessage(m.chat, {
            video: { url: data.download_url },
            caption: caption
        }, { quoted: m });

    } catch (e) {
        console.error('[CAPCUT ERROR]', e);
        const errMessage = e.message || 'Terjadi kesalahan saat mendownload video CapCut.';
        await m.reply(`> ◦❒ Gagal memproses CapCut: ${errMessage}`);
    }
};

handler.help = ['capcut'];
handler.tags = ['download'];
handler.command = /^(capcut|cc)$/i;
handler.limit = true;

export default handler;
