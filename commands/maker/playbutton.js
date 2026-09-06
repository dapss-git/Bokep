import axios from 'axios';

const platforms = ['youtube', 'facebook', 'instagram', 'twitter'];
const types = ['silver', 'gold'];

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {

    const text = args.join(' ').trim();
    if (!text) {
        return m.reply(`Usage: ${usedPrefix + command} <text>`);
    }

    try {
        const rows = platforms.map(p => ({
            header: 'Platform',
            title: `📺 ${p.charAt(0).toUpperCase() + p.slice(1)}`,
            description: `Generate ${p} play button`,
            id: `${usedPrefix}playbutton_platform ${text}|${p}`
        }));

        await conn.sendMessage(m.chat, {
            text: `🎬 *Play Button Generator*\n\nText: *${text}*`,
            footer: 'Select platform first',
            buttons: [{
                buttonId: 'playbutton_select_platform',
                buttonText: {
                    displayText: '📺 Select Platform'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Platform List',
                        sections: [{
                            title: 'Available Platforms',
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply(`Error: ${e.message}`);
    }
};

handler.before = async (m, {
    conn,
    usedPrefix
}) => {

    const txt = (m.text || '').trim();
    if (!txt) return;

    const pfxPlatform = `${usedPrefix}playbutton_platform `;
    const pfxGenerate = `${usedPrefix}playbutton_generate `;

    if (txt.startsWith(pfxPlatform)) {

        const data = txt.slice(pfxPlatform.length);
        const [text, platform] = data.split('|');

        if (!text || !platform) return;

        const rows = types.map(t => ({
            header: platform.toUpperCase(),
            title: `🏅 ${t.charAt(0).toUpperCase() + t.slice(1)}`,
            description: `Generate ${t} play button`,
            id: `${usedPrefix}playbutton_generate ${text}|${platform}|${t}`
        }));

        return conn.sendMessage(m.chat, {
            text: `📺 Platform selected: *${platform}*\n\nNow choose type.`,
            footer: 'Select type',
            buttons: [{
                buttonId: 'playbutton_select_type',
                buttonText: {
                    displayText: '🏅 Select Type'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Type List',
                        sections: [{
                            title: 'Available Types',
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        });
    }

    if (txt.startsWith(pfxGenerate)) {

        const data = txt.slice(pfxGenerate.length);
        const [text, platform, type] = data.split('|');

        if (!text || !platform || !type) return;

        try {
            await m.reply('⏳ Generating play button...');

            const apiUrl = global.API(
                'theresav',
                '/maker/playbutton', {
                    text,
                    platform,
                    type
                },
                'apikey'
            );

            const {
                data: image
            } = await axios.get(apiUrl, {
                responseType: 'arraybuffer'
            });

            await conn.sendMessage(m.chat, {
                image: Buffer.from(image),
                caption: `✅ *Play Button Generated*

📝 Text: ${text}
📺 Platform: ${platform}
🏅 Type: ${type}`
            }, {
                quoted: m
            });

        } catch (e) {
            console.error(e);
            m.reply('Failed to generate play button.');
        }
    }
};

handler.command = /^(playbutton)$/i;
handler.help = ['playbutton <text>'];
handler.tags = ['maker'];
handler.limit = true;
handler.register = true;

export default handler;