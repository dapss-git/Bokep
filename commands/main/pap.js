const CACHE_DURATION = 10 * 60 * 1000;
global.theresaCache = global.theresaCache || {};

const handler = async (m, {
    conn,
    text
}) => {
    try {
        await conn.sendMessage(m.chat, {
            react: {
                text: "🕐",
                key: m.key
            }
        });

        const user = global.db.data.users[m.sender] || {};

        const waifu =
            user?.life?.waifu ||
            user?.waifu ||
            "";

        const husbu =
            user?.life?.husbu ||
            user?.husbu ||
            "";

        const keywords =
            text ||
            waifu ||
            husbu ||
            "Anime";

        const charaName =
            waifu ||
            husbu ||
            keywords;

        const keyCache = keywords.toLowerCase();

        if (!global.theresaCache[keyCache]) {
            global.theresaCache[keyCache] = {
                data: [],
                lastUpdate: 0
            };
        }

        const cache = global.theresaCache[keyCache];
        const now = Date.now();

        if (!cache.data.length || now - cache.lastUpdate > CACHE_DURATION) {
            console.log(`[PAP] Refresh cache '${keywords}'`);

            const api = `https://theresapis.vercel.app/search/pinterest?q=${encodeURIComponent(keywords)}`;

            const res = await fetch(api);
            const json = await res.json();

            if (json?.status && Array.isArray(json.result)) {
                cache.data = json.result
                    .map(v => v.directLink)
                    .filter(Boolean);

                cache.lastUpdate = now;
            }
        }

        const list = cache.data;

        const image =
            list.length ?
            list[Math.floor(Math.random() * list.length)] :
            "https://files.catbox.moe/k0sfvt.jpg";

        await new AIRich(conn)
            .setTitle(`📸 ${charaName} PAP Mode~`)
            .addText(`💖 Karakter: ${keywords}\n✨ Nih sensei~`)
            .addImage([image])
            .send(m.chat);

        await conn.sendMessage(m.chat, {
            react: {
                text: "✅",
                key: m.key
            }
        });

    } catch (e) {
        console.error("[PAP Error]", e);

        await conn.sendMessage(m.chat, {
            react: {
                text: "❌",
                key: m.key
            }
        });

        const user = global.db.data.users[m.sender] || {};
        const chara =
            user?.life?.waifu ||
            user?.life?.husbu ||
            "Dia";

        m.reply(`❌ ${chara} lagi malu difoto, coba lagi nanti 🥺`);
    }
};

handler.customPrefix = /^pap$/i;
handler.command = new RegExp();
handler.tags = ["main"];
handler.help = ["pap <keyword>"];
handler.register = true;

export default handler;