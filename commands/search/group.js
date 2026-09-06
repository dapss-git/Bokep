let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (command === 'groupsearch' || command === 'carigrup') {
        if (!text) return m.reply(`Contoh:\n${usedPrefix + command} workout`);

        if (global.loading) await global.loading(m, conn);

        try {
            const apiUrl = global.API('theresav', '/search/group', {
                q: text
            }, 'apikey');
            const res = await fetch(apiUrl);
            if (!res.ok) return m.reply(`❌ Error API ${res.status}: ${res.statusText}`);

            const json = await res.json();
            let results = json.result || json.results || [];
            if (!json.status || results.length === 0) {
                return m.reply('❌ Tidak ada grup yang ditemukan.');
            }

            let rows = results.slice(0, 50).map((v, i) => {
                let link = v.link || v.url || '';
                let name = v.name || 'No Name';

                let dataStr = Buffer.from(JSON.stringify({
                    t: name,
                    l: link,
                    c: v.category || '-',
                    k: v.country || '-',
                    d: v.description || '-'
                })).toString('base64');

                return {
                    header: `Grup ${i + 1} - ${v.country || '-'}`,
                    title: name.length > 35 ? name.substring(0, 35) + '...' : name,
                    description: v.category || 'Klik untuk detail',
                    id: `${usedPrefix}gsearchinfo ${dataStr}`
                };
            });

            let caption = `> ╭─❁ ɢʀᴏᴜᴘ sᴇᴀʀᴄʜ ❁\n`;
            caption += `> ◦❒ ǫᴜᴇʀʏ: ${text}\n`;
            caption += `> ◦❒ ᴛᴏᴛᴀʟ ʜᴀsɪʟ: ${rows.length} Grup\n`;
            caption += `> ╰─❁`;

            return conn.sendMessage(m.chat, {
                text: caption.trim(),
                footer: "Klik tombol di bawah untuk memilih grup",
                buttons: [{
                    buttonId: "group_select",
                    buttonText: {
                        displayText: "📥 PILIH GRUP"
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: "Hasil Pencarian",
                            sections: [{
                                title: "List Grup",
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
            m.reply('❌ Terjadi kesalahan saat mencari grup.');
        } finally {
            if (global.loading) await global.loading(m, conn, true);
        }
    }

    if (command === 'gsearchinfo') {
        if (!text) return;

        try {
            let decoded = JSON.parse(Buffer.from(text, 'base64').toString('utf-8'));
            if (!decoded.l) return m.reply('❌ Link untuk grup ini tidak valid atau tidak ditemukan.');

            let detailText = `> ╭─❁ ᴅᴇᴛᴀɪʟ ɢʀᴏᴜᴘ ❁\n`;
            detailText += `> ◦❒ 📛 ɴᴀᴍᴀ: ${decoded.t}\n`;
            detailText += `> ◦❒ 📁 ᴋᴀᴛᴇɢᴏʀɪ: ${decoded.c}\n`;
            detailText += `> ◦❒ 🌍 ɴᴇɢᴀʀᴀ: ${decoded.k}\n`;
            detailText += `> ◦❒ 📝 ᴅᴇsᴋʀɪᴘsɪ: ${decoded.d}\n`;
            detailText += `> ╰─❁`;

            return conn.sendMessage(m.chat, {
                text: detailText.trim(),
                footer: global.wm || "Detail Group",
                buttons: [{
                        buttonId: "group_join_cta",
                        buttonText: {
                            displayText: "🔗 MASUK GRUP"
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: "cta_url",
                            paramsJson: JSON.stringify({
                                display_text: "🔗 MASUK GRUP",
                                url: decoded.l,
                                merchant_url: decoded.l
                            })
                        }
                    },
                    {
                        buttonId: "group_copy_cta",
                        buttonText: {
                            displayText: "📋 SALIN LINK"
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: "cta_copy",
                            paramsJson: JSON.stringify({
                                display_text: "📋 SALIN LINK",
                                copy_code: decoded.l
                            })
                        }
                    }
                ],
                headerType: 1,
                viewOnce: true
            }, {
                quoted: m
            });

        } catch (e) {
            console.error(e);
            m.reply('❌ Gagal memuat detail grup.');
        }
    }
};

handler.help = ['groupsearch <query>'];
handler.tags = ['search'];
handler.command = /^(groupsearch|carigrup|gsearchinfo)$/i;
handler.register = true;
handler.limit = true;

export default handler;