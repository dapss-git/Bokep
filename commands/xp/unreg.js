import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas';
import moment from 'moment-timezone';

const _fc = new Set();
const _fb = 'https://raw.githubusercontent.com/Blckrose2/font2/main/';
async function lf(file, alias) {
    if (_fc.has(alias)) return;
    const r = await fetch(_fb + encodeURIComponent(file));
    if (!r.ok) throw new Error('Font: ' + file);
    GlobalFonts.register(Buffer.from(await r.arrayBuffer()), alias);
    _fc.add(alias);
}

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

async function generateUnregCard(name, sn, pp, timestamp) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'Emoji');

    const W = 680,
        H = 360;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Background: dark charcoal
    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#1a1410');
    bgG.addColorStop(0.5, '#161210');
    bgG.addColorStop(1, '#120e0c');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    // Paper grain texture (dark noise)
    for (let i = 0; i < 800; i++) {
        const nx = Math.random() * W,
            ny = Math.random() * H;
        const a = Math.random() * 0.06 + 0.01;
        ctx.fillStyle = `rgba(255,200,150,${a})`;
        ctx.beginPath();
        ctx.arc(nx, ny, Math.random() * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }

    // Subtle red ambient glow top-left
    const redGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 320);
    redGlow.addColorStop(0, 'rgba(180,30,20,0.18)');
    redGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = redGlow;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.7);
    vign.addColorStop(0, 'transparent');
    vign.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);

    // Outer border — dark red
    const MARGIN = 18;
    rrp(ctx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, 10);
    ctx.strokeStyle = '#6b1a14';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner border
    rrp(ctx, MARGIN + 5, MARGIN + 5, W - MARGIN * 2 - 10, H - MARGIN * 2 - 10, 7);
    ctx.strokeStyle = 'rgba(107,26,20,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Corner brackets
    const CB = '#7a1f18',
        CS = 20;
    const bx = MARGIN + 3,
        by = MARGIN + 3,
        bw = W - MARGIN * 2 - 6,
        bh = H - MARGIN * 2 - 6;
    ctx.strokeStyle = CB;
    ctx.lineWidth = 1.5;
    [
        [bx, by, 1, 1],
        [bx + bw, by, -1, 1],
        [bx, by + bh, 1, -1],
        [bx + bw, by + bh, -1, -1]
    ].forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * CS, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * CS);
        ctx.stroke();
    });

    // Diagonal VOID stripes (background strikethrough feel)
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#cc2200';
    ctx.lineWidth = 18;
    for (let i = -H; i < W + H; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
    }
    ctx.restore();

    // Big X watermark (faint)
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#cc1100';
    ctx.lineWidth = 80;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(MARGIN + 40, MARGIN + 40);
    ctx.lineTo(W - MARGIN - 40, H - MARGIN - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - MARGIN - 40, MARGIN + 40);
    ctx.lineTo(MARGIN + 40, H - MARGIN - 40);
    ctx.stroke();
    ctx.restore();

    // Avatar
    const AX = 108,
        AY = H / 2 - 10,
        AR = 58;

    // Broken/dashed ring
    ctx.save();
    ctx.strokeStyle = '#7a1f18';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Solid ring
    ctx.save();
    ctx.strokeStyle = '#9e2a20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Avatar image
    if (pp) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(await loadImage(pp), AX - AR, AY - AR, AR * 2, AR * 2);
        ctx.restore();
        // Greyscale overlay
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#1a1410';
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Red X over avatar
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#cc2200';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(AX - AR * 0.5, AY - AR * 0.5);
    ctx.lineTo(AX + AR * 0.5, AY + AR * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(AX + AR * 0.5, AY - AR * 0.5);
    ctx.lineTo(AX - AR * 0.5, AY + AR * 0.5);
    ctx.stroke();
    ctx.restore();

    // REVOKED stamp circle (top-left of avatar area)
    ctx.save();
    ctx.strokeStyle = '#cc2200';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Right content area
    const CX = W / 2 + 28;

    // Header line
    ctx.strokeStyle = 'rgba(107,26,20,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX - 170, 52);
    ctx.lineTo(CX + 170, 52);
    ctx.stroke();

    // Title
    ctx.font = 'bold 12px SFBold';
    ctx.fillStyle = '#8a2218';
    ctx.textAlign = 'center';
    ctx.fillText('✦ UNREGISTER ✦', CX, 44);

    // Subtitle divider
    ctx.beginPath();
    ctx.moveTo(CX - 170, 56);
    ctx.lineTo(CX + 170, 56);
    ctx.stroke();

    // Name — faded, strikethrough feel
    ctx.font = 'bold 30px SFBold';
    ctx.fillStyle = '#c4b5ac';
    ctx.shadowColor = 'rgba(200,50,30,0.2)';
    ctx.shadowBlur = 10;
    ctx.fillText(name.slice(0, 18), CX, 94);
    ctx.shadowBlur = 0;

    // Strikethrough on name
    const nw = ctx.measureText(name.slice(0, 18)).width;
    ctx.save();
    ctx.strokeStyle = '#cc2200';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(CX - nw / 2, 84);
    ctx.lineTo(CX + nw / 2, 84);
    ctx.stroke();
    ctx.restore();

    // "Akun dihapus" label
    ctx.font = '11px SFMedium';
    ctx.fillStyle = '#6b3028';
    ctx.fillText('Akun dihapus dari database', CX, 114);

    // Horizontal divider
    ctx.strokeStyle = 'rgba(107,26,20,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX - 170, 126);
    ctx.lineTo(CX + 170, 126);
    ctx.stroke();

    // Data rows
    const colL = CX - 155,
        colR = CX + 10;
    const rows = [
        ['Nama', name],
        ['SN', sn + ' (dicabut)'],
        ['Status', '❌ Tidak Aktif'],
        ['Tanggal', timestamp],
    ];

    rows.forEach(([k, v], i) => {
        const y = 148 + i * 28;
        if (i % 2 === 0) {
            rrp(ctx, colL - 8, y - 14, 330, 22, 4);
            ctx.fillStyle = 'rgba(107,26,20,0.08)';
            ctx.fill();
        }
        ctx.font = '11px SFRegular';
        ctx.fillStyle = '#6b3028';
        ctx.textAlign = 'left';
        ctx.fillText(k, colL, y);

        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(107,26,20,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colL + ctx.measureText(k).width + 4, y - 2);
        ctx.lineTo(colR - 4, y - 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.font = 'bold 11px SFBold';
        ctx.fillStyle = '#c4a89e';
        ctx.fillText(String(v), colR, y);
    });

    // REVOKED stamp (big, rotated, right side)
    const SX = CX + 155,
        SY = H / 2 + 30;
    ctx.save();
    ctx.translate(SX, SY);
    ctx.rotate(-0.35);
    rrp(ctx, -48, -20, 96, 40, 6);
    ctx.strokeStyle = '#cc2200';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.75;
    ctx.stroke();
    ctx.font = 'bold 16px SFBold';
    ctx.fillStyle = '#cc2200';
    ctx.textAlign = 'center';
    ctx.fillText('REVOKED', 0, 6);
    ctx.restore();

    // Footer divider
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(107,26,20,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 24, H - 36);
    ctx.lineTo(W - MARGIN - 24, H - 36);
    ctx.stroke();

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(130,80,70,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('Daftar kembali dengan .daftar · Data telah dihapus', W / 2, H - 22);
    ctx.fillText('ᴅᴀᴛᴀ ᴛᴇʟᴀʜ ᴅɪʜᴀᴘᴜs ᴅᴀʀɪ ᴅᴀᴛᴀʙᴀsᴇ 🗑️', W / 2, H - 10);

    return canvas.toBuffer('image/jpeg', {
        quality: 94
    });
}

const handler = async (m, {
    conn,
    text,
    command
}) => {
    try {
        const user = global.db.data.users[m.sender];

        if (!user || !user.registered) {
            return m.reply('_Anda belum terdaftar._');
        }

        const inputSN = text?.trim()?.toUpperCase();
        if (!inputSN) {
            return m.reply(
                `_Masukkan Serial Number (SN)._\nContoh:\n*.${command} ${user.sn}*`
            );
        }

        if (inputSN !== user.sn) {
            return m.reply('❌ *Serial Number tidak valid!*');
        }

        await global.loading(m, conn);

        const oldName = user.name;
        const oldSn = user.sn;
        const ts = moment.tz('Asia/Jakarta').format('DD MMM YYYY · HH:mm');

        const pp = await conn.profilePictureUrl(m.sender, 'image')
            .then(url => fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 Chrome/124'
                    }
                })
                .then(r => r.arrayBuffer()).then(b => Buffer.from(b)))
            .catch(() => 'src/avatar_contact.png');

        user.name = '';
        user.age = 0;
        user.registered = false;
        user.register = false;
        user.regTime = 0;
        user.sn = '';
        user.limit = Math.max((user.limit || 0) - 50, 0);

        await global.db.save();

        const card = await generateUnregCard(oldName, oldSn, pp, ts);
        await conn.sendFile(m.chat, card, 'unreg.jpg', '', m);

    } finally {
        await global.loading(m, conn, true);
    }
};

handler.command = ['unreg', 'unregister'];
handler.tags = 'xp';
handler.description = 'Unregister akun menggunakan Serial Number';
handler.register = true;

export default handler;