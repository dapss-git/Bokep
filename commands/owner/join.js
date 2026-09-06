import { cleanJid } from '../../core/utils.js';

const handler = async (m, {
    conn,
    text,
    args
}) => {
    const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
    const link = (args[0] || text).match(linkRegex);

    if (!link) {
        throw '⚠️ Invalid invitation link. Please provide a valid WhatsApp group link.';
    }

    const code = link[1];

    try {
        await m.reply('🟢 Joining group, please wait...');

        // Try to get group ID from invite info first as fallback
        let groupId = null;
        try {
            const inviteInfo = await conn.groupGetInviteInfo(code);
            groupId = inviteInfo?.id;
        } catch (e) {
            console.error('[JOIN] Error fetching invite info:', e.message);
        }

        // Gabung grup
        const res = await conn.groupAcceptInvite(code);

        // Ambil group ID dari response jika info invite gagal
        if (!groupId) {
            groupId = typeof res === 'object' ? (res?.gid || res?.id || res) : res;
        }

        if (groupId) {
            groupId = cleanJid(groupId.toString());
        }

        await m.reply(`✅ Successfully joined group!\nGroup ID: ${groupId || 'Unknown'}`);

    } catch (e) {
        console.error(e);
        throw '❌ Failed to join the group. The link might be invalid, revoked, the group might be full, or I might have been removed previously.';
    }
};

handler.command = ['join', 'joingc'];
handler.description = 'Join a WhatsApp group via an invitation link.';
handler.tags = ['owner'];
handler.help = ['join <chat.whatsapp.com link>'];
handler.args = true;
handler.owner = true;
handler.register = true;

export default handler;