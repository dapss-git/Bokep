let handler = async (m, {
    conn,
    command,
    text
}) => {
    let apiUrl;

    if (command === 'amsend') {
        if (!text) {
            return m.reply('Contoh:\n.amsend email@gmail.com');
        }

        apiUrl = global.API('theresav', '/premium/alightmotion/send', {
            email: text.trim()
        }, 'apikey');
    }

    if (command === 'amverify') {
        if (!text.includes('|')) {
            return m.reply(`Contoh:
.amverify email@gmail.com|https://alight-creative.firebaseapp.com/...`);
        }

        const [email, link] = text.split('|');

        apiUrl = global.API('theresav', '/premium/alightmotion/verify', {
            email: email.trim(),
            link: link.trim()
        }, 'apikey');
    }

    try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (command === 'amsend' && data.status) {
            global.db.data.amprems = global.db.data.amprems || [];
            global.db.data.amprems.push({
                email: text.trim(),
                status: 'pending_verify',
                date: new Date().toISOString(),
                creator: m.sender,
                source: 'amsend'
            });
        }

        if (command === 'amverify' && data.status) {
            global.db.data.amprems = global.db.data.amprems || [];
            const existing = global.db.data.amprems.find(x => x.email === text.split('|')[0].trim() && x.status === 'pending_verify');
            if (existing) {
                existing.status = 'verified';
                existing.package = data.data?.package_type || data.data?.duration || '1 Bulan';
                existing.verifyDate = new Date().toISOString();
            } else {
                global.db.data.amprems.push({
                    email: text.split('|')[0].trim(),
                    status: 'verified',
                    package: data.data?.package_type || data.data?.duration || '1 Bulan',
                    date: new Date().toISOString(),
                    creator: m.sender,
                    source: 'amverify'
                });
            }
        }

        let msg = `
*乂 A L I G H T  M O T I O N*

▢ *Status:* ${data.status ? '✅ Success' : '❌ Failed'}
▢ *Message:* ${data.message || '-'}
`;

        if (data.data) {
            msg += '\n\n' + Object.entries(data.data)
                .map(([k, v]) => `▢ *${k.charAt(0).toUpperCase() + k.slice(1)}:* ${v}`)
                .join('\n');
        }

        return m.reply(msg.trim());

    } catch (e) {
        return m.reply(`❌ Error: ${e.message}`);
    }
};

handler.help = [
    'amsend <email>',
    'amverify <email>|<link>'
];

handler.tags = ['premium'];
handler.command = /^(amsend|amverify)$/i;

handler.premium = true;
handler.register = true;

export default handler;