let handler = async (m, {
    conn
}) => {
    let teks = `
*༺♡⃛・‧₊˚ 𝐼𝑁𝑇𝑅𝑂 𝑀𝐸𝑀𝐵𝐸𝑅 𝐵𝐴𝑅𝑈 ˚₊‧・♡⃛༻*

*╭─❍ 𝙁𝙊𝙍𝙈𝘼𝙏 𝙄𝙉𝙏𝙍𝙊 ❍─╮*
*│ ✦ 𝑁𝑎𝑚𝑎:*
*│ ✦ 𝑈𝑚𝑢𝑟:*
*│ ✦ 𝐾𝑒𝑙𝑎𝑠:*
*│ ✦ 𝐺𝑒𝑛𝑑𝑒𝑟:*
*│ ✦ 𝐴𝑠𝑘𝑜𝑡:*
*│ ✦ 𝐻𝑜𝑏𝑖:*
*│ ✦ 𝑆𝑡𝑎𝑡𝑢𝑠:*
*╰────────────────╯*

*˚₊‧୨୧ 𝐶𝑎𝑡𝑎𝑡𝑎𝑛 ୨୧‧₊˚*
🌸 *Jangan lupa makan ya~*
✨ *Patuhi aturan grup~*
💌 *Jangan spam!*
`.trim();

    await conn.sendMessage(
        m.chat, {
            text: teks,
            footer: "꒰ © 2025 THERESA",
            title: "🍡 Format Intro Member Baru",
            interactiveButtons: [{
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "📋 Salin Format Intro",
                    copy_code: teks.replace(/\*/g, "").replace(/_/g, ""),
                }),
            }, ],
        }, {
            quoted: m
        }
    );
};

handler.help = ["intro"];
handler.category = ["group"];
handler.command = ["intro"];
handler.group = true;
handler.register = true;

export default handler;