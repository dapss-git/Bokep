import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas';
import { jidNormalizedUser } from 'baileys';
import fs from 'fs';

// ─── Font loader (cached) ────────────────────────────────────────────────────
const _fc = new Set();
const _fb = 'https://raw.githubusercontent.com/Blckrose2/font2/main/';
async function lf(file, alias) {
    if (_fc.has(alias)) return;
    const r = await fetch(_fb + encodeURIComponent(file));
    if (!r.ok) throw new Error('Font: ' + file);
    GlobalFonts.register(Buffer.from(await r.arrayBuffer()), alias);
    _fc.add(alias);
}

// ─── Safe avatar loader ───────────────────────────────────────────────────────
async function safeAvatar(url) {
    try {
        if (url) {
            const r = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            if (r.ok) return await loadImage(Buffer.from(await r.arrayBuffer()));
        }
    } catch {}
    try {
        return await loadImage(fs.readFileSync('./src/avatar_contact.png'));
    } catch {}
    // Fallback: generate initials circle
    const c = createCanvas(80, 80);
    const g = c.getContext('2d');
    g.fillStyle = '#c9956e';
    g.beginPath();
    g.arc(40, 40, 40, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.font = 'bold 28px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('?', 40, 40);
    return await loadImage(c.toBuffer('image/png'));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rrp(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function petal(ctx, cx, cy, r, angle, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-r * 0.5, -r * 0.8, -r * 0.3, -r * 1.5, 0, -r * 1.6);
    ctx.bezierCurveTo(r * 0.3, -r * 1.5, r * 0.5, -r * 0.8, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function sakura(ctx, cx, cy, r, color, alpha = 1) {
    for (let i = 0; i < 5; i++)
        petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#fff8f0';
    ctx.fill();
    ctx.restore();
}

function cornerFlourish(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1]
    ]
    .forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * size, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * size);
        ctx.stroke();
    });
}

function diamondRow(ctx, cx, y, count, spacing, size, color) {
    const startX = cx - (count - 1) * spacing / 2;
    for (let i = 0; i < count; i++) {
        const dx = startX + i * spacing;
        ctx.save();
        ctx.translate(dx, y);
        ctx.rotate(Math.PI / 4);
        rrp(ctx, -size / 2, -size / 2, size, size, 1);
        if (i === Math.floor(count / 2)) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }
}

function drawBase(ctx, W, H) {
    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#fdf8f0');
    bgG.addColorStop(0.45, '#fef9f2');
    bgG.addColorStop(1, '#faf3e8');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 700; i++) {
        ctx.fillStyle = `rgba(180,140,100,${Math.random() * 0.04 + 0.01})`;
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(160,110,60,0.12)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    const M = 18;
    rrp(ctx, M, M, W - M * 2, H - M * 2, 12);
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    rrp(ctx, M + 5, M + 5, W - M * 2 - 10, H - M * 2 - 10, 9);
    ctx.strokeStyle = 'rgba(201,149,110,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    cornerFlourish(ctx, M + 3, M + 3, W - M * 2 - 6, H - M * 2 - 6, 20, '#c9956e');

    const sp = '#f8a4c0',
        sl = '#fcc8d8',
        sd = '#e87098';
    sakura(ctx, 44, 44, 24, sl, 0.18);
    sakura(ctx, W - 46, 38, 18, sp, 0.14);
    sakura(ctx, 36, H - 44, 20, sp, 0.16);
    sakura(ctx, W - 44, H - 46, 22, sl, 0.14);
    [
        [W * 0.76, H * 0.10, 7, 0.3, sp],
        [W * 0.12, H * 0.22, 5, 0.8, sl],
        [W * 0.88, H * 0.55, 8, 1.1, sp],
        [W * 0.08, H * 0.72, 6, 0.2, sd],
        [W * 0.70, H * 0.90, 7, 1.5, sl],
        [W * 0.92, H * 0.28, 6, 1.8, sd]
    ]
    .forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55));
}

// ─── Format helpers ───────────────────────────────────────────────────────────
const toNum = n => parseInt(n || 0).toLocaleString('id-ID');

function formatLastChat(time) {
    if (!time || time === 0) return 'Belum pernah';
    const diff = Date.now() - time;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} mnt lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
}

// ─── Main canvas renderer ────────────────────────────────────────────────────
async function canvasTopChat(entries, groupName) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji');

    const W = 680;
    const M = 18;
    const HEADER_H = 140;
    const ROW_H = 80;
    const ROW_GAP = 8;
    const FOOTER_H = 52;
    const H = HEADER_H + entries.length * (ROW_H + ROW_GAP) + FOOTER_H;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    drawBase(ctx, W, H);

    // ── Header ──
    diamondRow(ctx, W / 2, M + 20, 11, 24, 5, '#c9956e');

    ctx.font = 'bold 13px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('✶ TOP MEMBER AKTIF ✶', W / 2, M + 42);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, M + 52);
    ctx.lineTo(W - M - 24, M + 52);
    ctx.stroke();

    // Group name
    ctx.font = 'bold 22px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 6;
    ctx.fillText((groupName || 'Grup').slice(0, 34), W / 2, M + 82);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '10px SFRegular';
    ctx.fillStyle = '#9b6a43';
    ctx.fillText('Berdasarkan total pesan yang dikirim', W / 2, M + 100);

    diamondRow(ctx, W / 2, M + 112, 7, 20, 3, '#c9956e');

    // ── Rank colors ──
    const rankColors = ['#b07820', '#8a8a8a', '#7a3a0a', '#4a6a8a', '#5a7a5a'];
    const rankBg = [
        'rgba(176,120,32,0.12)', 'rgba(138,138,138,0.10)', 'rgba(122,58,10,0.10)',
        'rgba(74,106,138,0.07)', 'rgba(90,122,90,0.07)'
    ];
    const rankMedals = ['🥇', '🥈', '🥉', '4.', '5.'];

    let rowY = HEADER_H;

    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const rc = rankColors[i] || '#4a5a6a';
        const rb = rankBg[i] || 'rgba(74,90,106,0.07)';

        // Row card
        rrp(ctx, M + 14, rowY, W - (M + 14) * 2, ROW_H, 12);
        ctx.fillStyle = rb;
        ctx.fill();
        ctx.strokeStyle = rc + '66';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Left accent bar
        rrp(ctx, M + 14, rowY + 10, 4, ROW_H - 20, 2);
        ctx.fillStyle = rc;
        ctx.fill();

        // Medal / rank number
        const isEmoji = i < 3;
        ctx.font = isEmoji ? '20px NotoEmoji' : 'bold 13px SFBold';
        ctx.textAlign = 'left';
        ctx.fillStyle = rc;
        ctx.fillText(rankMedals[i] || (i + 1) + '.', M + 24, rowY + ROW_H / 2 + (isEmoji ? 8 : 5));

        // Avatar circle
        const AV_R = 28;
        const AV_X = M + 74;
        const AV_Y = rowY + ROW_H / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(AV_X, AV_Y, AV_R + 2, 0, Math.PI * 2);
        ctx.strokeStyle = rc + 'aa';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(AV_X, AV_Y, AV_R, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(e.avatar, AV_X - AV_R, AV_Y - AV_R, AV_R * 2, AV_R * 2);
        ctx.restore();

        // Text area
        const TX = AV_X + AV_R + 16;

        // Name
        ctx.font = 'bold 14px SFBold';
        ctx.fillStyle = '#3c2818';
        ctx.textAlign = 'left';
        ctx.fillText(String(e.name).slice(0, 26), TX, rowY + 22);

        // Stats row 1: Total chat
        ctx.font = '10px SFMedium';
        ctx.fillStyle = '#9b6a43';
        ctx.fillText('Total Chat:', TX, rowY + 40);

        ctx.save();
        ctx.font = 'bold 13px SFBold';
        ctx.fillStyle = rc;
        ctx.shadowColor = rc + '88';
        ctx.shadowBlur = 4;
        ctx.fillText(toNum(e.totalChat) + ' pesan', TX + 68, rowY + 40);
        ctx.restore();

        // Stats row 2: Chat hari ini
        ctx.font = '10px SFMedium';
        ctx.fillStyle = '#9b6a43';
        ctx.fillText('Hari Ini:', TX, rowY + 56);

        ctx.save();
        ctx.font = 'bold 11px SFBold';
        ctx.fillStyle = '#3c8a3c';
        ctx.fillText(toNum(e.chatToday) + ' pesan', TX + 56, rowY + 56);
        ctx.restore();

        // Last chat (right-aligned)
        const lastLabel = '🕐 ' + formatLastChat(e.lastChat);
        ctx.font = '9px SFRegular';
        ctx.fillStyle = 'rgba(100,70,40,0.7)';
        ctx.textAlign = 'right';
        ctx.fillText(lastLabel, W - M - 24, rowY + ROW_H - 12);

        rowY += ROW_H + ROW_GAP;
    }

    // ── Footer ──
    const footY = rowY + 6;
    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, footY);
    ctx.lineTo(W - M - 24, footY);
    ctx.stroke();

    diamondRow(ctx, W / 2, footY + 8, 7, 20, 3, '#c9956e');

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(
        `${global.botname || 'Bot'}  ·  ${new Date().toLocaleString('id-ID')} WIB`,
        W / 2, footY + 26
    );

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

// ─── Handler ──────────────────────────────────────────────────────────────────
let handler = async (m, {
    conn,
    args
}) => {
    const db = global.db.data.users;
    const metadata = await conn.groupMetadata(m.chat).catch(() => null);
    if (!metadata) return m.reply('❌ Gagal mengambil data grup.');

    const participantJids = new Set();
    for (const p of metadata.participants || []) {
        let v = conn.decodeJid(p.id)
        if (v.endsWith('@lid') && conn.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const pn = await conn.signalRepository.lidMapping.getPNForLID(v)
                if (pn) v = jidNormalizedUser(pn)
            } catch (e) {}
        }
        participantJids.add(v)
    }

    // Filter: hanya member grup, punya data chat
    let users = Object.entries(db)
        .filter(([jid, u]) =>
            participantJids.has(jid) &&
            !jid.endsWith('@newsletter') &&
            !jid.endsWith('@g.us') &&
            ((u.totalChat || 0) > 0 || (u.chatToday || 0) > 0)
        )
        .map(([jid, u]) => ({
            jid,
            ...u
        }));

    if (!users.length) return m.reply('📭 Belum ada data chat di grup ini.');

    // Sort berdasarkan args: today / default totalChat
    const mode = (args[0] || '').toLowerCase();
    if (mode === 'today' || mode === 'hari') {
        users.sort((a, b) => (b.chatToday || 0) - (a.chatToday || 0));
    } else {
        users.sort((a, b) => (b.totalChat || 0) - (a.totalChat || 0));
    }

    const top5 = users.slice(0, 5);

    // Load avatars
    const pp = jid => conn.profilePictureUrl(jid, 'image').catch(() => 'src/avatar_contact.png');
    const entries = await Promise.all(top5.map(async u => ({
        name: (u.registered && u.name) ? u.name : (conn.getName(u.jid) || u.jid.split('@')[0]),
        totalChat: u.totalChat || 0,
        chatToday: u.chatToday || 0,
        lastChat: u.lastChat || 0,
        avatar: await safeAvatar(await pp(u.jid)),
        jid: u.jid,
    })));

    await m.reply('⏳ Membuat canvas...');

    const groupName = metadata.subject || 'Grup';
    const img = await canvasTopChat(entries, groupName);

    const modeLabel = (mode === 'today' || mode === 'hari') ? 'Hari Ini' : 'Semua Waktu';
    const caption = [
        `🏆 *Top 5 Member Aktif — ${modeLabel}*`,
        `📌 ${groupName}`,
        ``,
        ...entries.map((e, i) =>
            `${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} *${e.name}*\n   💬 Total: ${toNum(e.totalChat)} | Hari ini: ${toNum(e.chatToday)}`
        ),
        ``,
        `_Gunakan_ *.topchat today* _untuk ranking hari ini_`
    ].join('\n');

    await conn.sendMessage(m.chat, {
        image: img,
        caption,
        mentions: entries.map(e => e.jid)
    }, {
        quoted: m
    });
};

handler.help = ['topchat [today]'];
handler.tags = ['info'];
handler.command = /^(topchat|aktivitas|topaktif)$/i;
handler.group = true;
handler.register = true;
handler.limit = true;

export default handler;