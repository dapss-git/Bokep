let handler = async (m, {
    conn,
    text,
    args,
    usedPrefix,
    command
}) => {
    let sub = (args[0] || '').toLowerCase();

    if (sub === 'search' || (command === 'nekopoi' && text && sub !== 'latest' && sub !== 'detail')) {
        let query = sub === 'search' ? args.slice(1).join(' ') : text;
        if (!query) return m.reply(`• Example : ${usedPrefix + command} search naruto`);

        await global.loading(m, conn);
        try {
            let url = global.API('theresav', '/anime/nekopoi/search', {
                q: query
            }, 'apikey');
            let res = await fetch(url);
            let json = await res.json();
            if (!json.status) throw json.error || 'Data tidak ditemukan';

            let rows = json.result.map((v, i) => ({
                title: v.title,
                id: `${usedPrefix + command} detail ${v.link}`
            }));

            await conn.sendMessage(m.chat, {
                text: `🔍 Nekopoi Search Result\n\nKeyword: ${query}\nTotal: ${json.result.length} hasil`,
                footer: 'Nekopoi Search',
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📋 Pilih Anime',
                        sections: [{
                            title: 'Hasil Pencarian',
                            rows: rows
                        }]
                    })
                }],
                viewOnce: true
            }, {
                quoted: m
            });
        } catch (e) {
            console.error(e);
            m.reply('Terjadi kesalahan saat mencari data.');
        } finally {
            global.loading(m, conn, true);
        }
        return;
    }

    if (sub === 'latest') {
        await global.loading(m, conn);
        try {
            let url = global.API('theresav', '/anime/nekopoi/latest', {}, 'apikey');
            let res = await fetch(url);
            let json = await res.json();
            if (!json.status) throw json.error || 'Data tidak ditemukan';

            let rows = json.result.map((v, i) => ({
                title: v.title,
                description: `📅 ${v.date}`,
                id: `${usedPrefix + command} detail ${v.link}`
            }));

            await conn.sendMessage(m.chat, {
                text: `🆕 Nekopoi Latest Update`,
                footer: 'Nekopoi Latest',
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📋 Pilih Anime',
                        sections: [{
                            title: 'Update Terbaru',
                            rows: rows
                        }]
                    })
                }],
                viewOnce: true
            }, {
                quoted: m
            });
        } catch (e) {
            console.error(e);
            m.reply('Terjadi kesalahan saat mengambil data terbaru.');
        } finally {
            global.loading(m, conn, true);
        }
        return;
    }

    if (sub === 'detail') {
        let q = args.slice(1).join(' ');
        if (!q) return m.reply(`• Example : ${usedPrefix + command} detail https://nekopoi.care/xxx`);

        await global.loading(m, conn);
        try {
            let url = global.API('theresav', '/anime/nekopoi/detail', {
                url: q
            }, 'apikey');
            let res = await fetch(url);
            let json = await res.json();
            if (!json.status) throw json.error || 'Data tidak ditemukan';

            let {
                title,
                info,
                downloads,
                thumb
            } = json.result;
            let caption = `🎬 ${title}\n\n`;
            caption += `┠ ❯ Genre: ${info.genre}\n`;
            caption += `┠ ❯ Producers: ${info.producers}\n`;
            caption += `┠ ❯ Duration: ${info.duration}\n`;
            caption += `┠ ❯ Size: ${info.size}\n\n`;
            caption += `📍 Link: ${q}\n\n`;
            caption += `Silakan pilih kualitas download melalui tombol di bawah ini.`;

            let rows = [];
            downloads.forEach(dl => {
                dl.links.forEach(link => {
                    rows.push({
                        title: `${dl.quality} (${link.provider})`,
                        id: `${usedPrefix}bypass ${link.link}`
                    });
                });
            });

            let buttons = [];
            if (rows.length > 0) {
                buttons.push({
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📥 Download Links',
                        sections: [{
                            title: 'Pilih Kualitas & Provider',
                            rows: rows
                        }]
                    })
                });
            }

            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '🌐 View on Web',
                    url: q
                })
            });

            if (thumb && typeof thumb === 'string' && thumb.startsWith('http')) {
                await conn.sendMessage(m.chat, {
                    image: {
                        url: thumb
                    },
                    caption: caption,
                    footer: 'Nekopoi Detail',
                    buttons: buttons,
                    viewOnce: true
                }, {
                    quoted: m
                });
            } else {
                await conn.sendMessage(m.chat, {
                    text: caption,
                    footer: 'Nekopoi Detail',
                    buttons: buttons,
                    viewOnce: true
                }, {
                    quoted: m
                });
            }

        } catch (e) {
            console.error(e);
            m.reply('Terjadi kesalahan saat mengambil detail.');
        } finally {
            global.loading(m, conn, true);
        }
        return;
    }

    m.reply(`🎬 Nekopoi Menu

• ${usedPrefix + command} search <judul>
• ${usedPrefix + command} latest
• ${usedPrefix + command} detail <url>

Contoh: ${usedPrefix + command} search naruto`);
};

handler.help = ['nekopoi search', 'nekopoi latest', 'nekopoi detail'];
handler.tags = ['anime'];
handler.command = /^(nekopoi)$/i;
handler.register = true;
handler.limit = true;
handler.nsfw = true;

export default handler;