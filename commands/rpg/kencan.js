import {
    prepareWAMessageMedia
} from 'baileys'

const handler = async (m, {
    conn
}) => {
    try {
        const cooldown = 3600300;
        const userData = global.db.data.users[m.sender];

        if (!userData?.life || !userData.life.verified)
            return m.reply("⚠️ Kamu harus set life terlebih dahulu dengan .setlife");

        const user = userData.life;
        const partner = user.waifu || user.husbu;
        const partnerType = user.waifu ? "waifu" : "husbu";

        if (!partner)
            return m.reply("❌ Kamu belum mempunyai pasangan! Ketik .setwaifu atau .sethusbu untuk memilih pasanganmu");

        const now = Date.now();
        if (now - user.lastkencan < cooldown) {
            return m.reply(`Kamu sudah berkencan sebelumnya! Tunggu selama ${maToTime(user.lastkencan + cooldown - now)} untuk berkencan lagi!`);
        }

        const query = partnerType === "waifu" ? `${partner} anime icons` : `${partner} anime boy aesthetic`;
        const pinterestUrl = API('theresav', '/search/pinterest', {
            query
        }, 'apikey');
        const pinterestRes = await fetch(pinterestUrl);
        const pinterestJson = await pinterestRes.json();

        const fallback = 'https://files.catbox.moe/k0sfvt.jpg';
        const pool = (pinterestJson?.status && pinterestJson.result?.length) ?
            pinterestJson.result.map(r => r.directLink).filter(Boolean) : [fallback];

        const shuffled = pool.sort(() => Math.random() - 0.5);
        const images = Array.from({
            length: 6
        }, (_, i) => shuffled[i % shuffled.length]);

        const tempat = pick(["pantai", "taman kota", "kebun binatang", "taman bermain", "kolam renang", "teater", "pusat seni dan budaya", "museum seni", "pusat sains", "perpustakaan", "kafe", "restoran", "kebun bunga", "taman anggur", "lapangan golf", "lapangan tenis", "pusat perbelanjaan", "pasar seni", "galeri seni", "pertunjukan musik", "lapangan bola basket", "lapangan baseball", "lapangan sepak bola", "pusat yoga", "karaoke", "kebun buah", "pertunjukan seni", "arena balap", "pusat bowling"]);
        const alesan = pick(["belajar bersama tentang cinta", "merayakan momen-momen penting bersama", "berbagi hobi dan minat bersama", "menguatkan hubungan", "bersenang-senang bersama", "mempererat komunikasi", "merayakan hubungan", "membangun kenangan"]);
        const tempat2 = pick(["rumah mertua", "pusat seni kuliner", "studio musik", "pesta seni pertunjukan", "pesta seni kreatif", "studio perhiasan", "pusat seni keramik", "pusat seni berkebun", "arena konser", "studio lukisan", "pusat seni film", "pusat hiking indoor", "pemandian air panas", "memancing", "kebun apel", "pusat mainan", "taman bermain air"]);
        const alesan2 = pick(["saling mengenal lebih baik", "membangun ikatan emosional yang lebih dalam", "bersenang-senang bersama", "mempererat komunikasi", "merayakan hubungan", "membangun kenangan"]);
        const perasaan = pick(["senang", "semakin cinta denganmu", "sangat cinta denganmu", "biasa saja", "sangat senang", "bahagia", "sangat bahagia", "cukup senang"]);
        const gaun = partnerType === "waifu" ? pick(["blouse & rok yang anggun", "gaun pendek yang elegan", "gaun panjang yang anggun", "kimono yang indah", "yukata yang sangat cantik", "crop top & rok mini"]) : pick(["kemeja & celana panjang yang rapih", "kaos & jeans yang modis", "jas formal yang gagah", "hoodie & celana kargo yang keren", "jaket kulit & jeans hitam yang maskulin"]);
        const gift = pick(["seikat bunga matahari kuning cerah", "sebuah coklat", "sebuah kartu ucapan"]);
        const tempat3 = pick(["taman bermain. Mereka tertawa dan bersenang-senang seperti anak-anak, naik roller coaster, dan bermain permainan karnaval", "restoran. Mereka menikmati hidangan yang begitu lezat dan mereka saling menyuap-nyuapi dengan sangat romantis", "sebuah kafe yang nyaman. Mereka duduk di sudut yang tenang, berbagi coklat panas dan kue"]);

        const send = async (title, text, imgUrl) => {
            let thumbBuf;
            try {
                const imgRes = await fetch(imgUrl);
                thumbBuf = Buffer.from(await imgRes.arrayBuffer());
            } catch {
                thumbBuf = undefined;
            }

            let image;
            if (thumbBuf) {
                try {
                    const {
                        imageMessage
                    } = await prepareWAMessageMedia({
                        image: thumbBuf
                    }, {
                        upload: conn.waUploadToServer,
                        mediaTypeOverride: 'thumbnail-link'
                    });
                    image = imageMessage;
                    image.width = 1280;
                    image.height = 720;
                } catch {}
            }

            await conn.sendMessage(m.chat, {
                text: `${imgUrl}\n\n${text}`,
                linkPreview: {
                    'matched-text': imgUrl,
                    title,
                    description: text.slice(0, 60),
                    previewType: 0,
                    jpegThumbnail: thumbBuf,
                    ...(image ? {
                        highQualityThumbnail: image
                    } : {}),
                    linkPreviewMetadata: {
                        linkMediaDuration: 0,
                        socialMediaPostType: 4
                    }
                }
            }, {
                quoted: m
            });
        };

        await send(
            "Kencan... 🌅 07:00",
            `Jam 07:00 Pagi\nPagi yang cerah menyapa ${partner} dan ${user.name}. Mereka berdua telah merencanakan kencan spesial ini dengan penuh antusiasme. ${partner} bangun lebih awal untuk bersiap-siap. Dia memakai ${gaun} dan tersenyum senang.`,
            images[0]
        );

        setTimeout(() => send(
            "Kencan... 🌸 07:15",
            `Jam 07:15 Pagi\n\nSementara itu, ${user.name} sudah bersiap di luar rumah ${partner}. Dia membawa ${gift} untuk ${partner}. Saat ${partner} melihat ${user.name}, senyum mereka bertemu dan mata mereka bersinar.`,
            images[1]
        ), 15000);

        setTimeout(() => send(
            "Kencan... 🚶 07:30",
            `Jam 07:30 Pagi\n\nKeduanya memutuskan untuk pergi ke ${tempat} untuk ${alesan}. Mereka berjalan berdua, berbicara tentang segala hal, dari hobi mereka hingga impian masa depan. Setiap jalanan dipenuhi dengan bunga-bunga yang berwarna-warni, seperti perasaan mereka satu sama lain.`,
            images[2]
        ), 30000);

        setTimeout(() => send(
            "Kencan... 💑 08:00 - 15:00",
            `Jam 08:00 Pagi - 15:00 Siang\n\nSetelah menikmati ${tempat}, ${partner} dan ${user.name} pergi ke ${tempat2} untuk ${alesan2}. Mereka saling memandang dengan penuh kasih sayang, merasakan ikatan mereka semakin kuat.`,
            images[3]
        ), 45000);

        setTimeout(() => send(
            "Kencan... 🌃 15:00 - 22:00",
            `Jam 15:00 Siang - 22:00 Malam\n\nKencan mereka berlanjut ke ${tempat3}. Malam datang begitu cepat, dan mereka merencanakan untuk menonton bintang-bintang bersama.`,
            images[4]
        ), 60000);

        setTimeout(async () => {
            await send(
                "Kencan Selesai 🌙 22:00",
                `Jam 22:00 Malam\n\nDi malam yang tenang, mereka berdua duduk di bawah langit yang penuh dengan bintang. ${user.name} merangkul ${partner} dengan lembut, dan mereka saling berbagi cerita dan impian mereka. Waktu berlalu begitu cepat, dan kencan pun telah selesai. Kamu mengantar ${partner} pulang ke rumah dan ${partner} merasa ${perasaan} dari kencan tadi.\n\n[ ! ] Pasanganmu telah naik level!\n+1 💘 Level Love\n+2 ✤ W Money`,
                images[5]
            );

            user.exp += 1;
            user.money += 2;
            user.lastkencan = now;
            await global.db.save();
        }, 75000);

    } catch (e) {
        console.error(e);
        m.reply("Maaf, terjadi kesalahan saat memproses permintaanmu.");
    }
};

handler.command = ["kencan"];
handler.tags = ["rpg"];
handler.premium = true;
handler.rpg = true;
handler.register = true;

export default handler;

const pick = (a) => a[Math.floor(Math.random() * a.length)];

function maToTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const d = s % 60;
    return `${h}j ${m}m ${d}d`;
}