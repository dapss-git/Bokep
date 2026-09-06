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

async function generateUnlifeCard(life, pp) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('poppins-bold.ttf', 'PoppinsBold');
    await lf('poppins-regular.ttf', 'PoppinsRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'Emoji');

    const W = 680,
        H = 380;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Background — dark charcoal with purple tint
    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#130b18');
    bgG.addColorStop(0.5, '#100913');
    bgG.addColorStop(1, '#0d080f');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    // Noise texture
    for (let i = 0; i < 800; i++) {
        ctx.fillStyle = `rgba(255,180,200,${Math.random() * 0.04 + 0.005})`;
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }

    // Ambient red/magenta glow top-left
    const ag1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
    ag1.addColorStop(0, 'rgba(160,20,80,0.18)');
    ag1.addColorStop(1, 'transparent');
    ctx.fillStyle = ag1;
    ctx.fillRect(0, 0, W, H);

    // Bottom-right purple glow
    const ag2 = ctx.createRadialGradient(W, H, 0, W, H, 260);
    ag2.addColorStop(0, 'rgba(120,20,160,0.12)');
    ag2.addColorStop(1, 'transparent');
    ctx.fillStyle = ag2;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.7);
    vign.addColorStop(0, 'transparent');
    vign.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);

    const MARGIN = 18;

    // Diagonal stripe watermark
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.strokeStyle = '#cc0044';
    ctx.lineWidth = 18;
    for (let i = -H; i < W + H; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
    }
    ctx.restore();

    // Big X watermark
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#cc0044';
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

    // Outer border
    rrp(ctx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, 12);
    ctx.strokeStyle = '#7a1040';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner border
    rrp(ctx, MARGIN + 5, MARGIN + 5, W - MARGIN * 2 - 10, H - MARGIN * 2 - 10, 8);
    ctx.strokeStyle = 'rgba(122,16,64,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Corner brackets
    const bx = MARGIN + 3,
        by = MARGIN + 3;
    const bw = W - MARGIN * 2 - 6,
        bh = H - MARGIN * 2 - 6;
    ctx.strokeStyle = '#8a1a4a';
    ctx.lineWidth = 1.5;
    [
        [bx, by, 1, 1],
        [bx + bw, by, -1, 1],
        [bx, by + bh, 1, -1],
        [bx + bw, by + bh, -1, -1]
    ]
    .forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * 22, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * 22);
        ctx.stroke();
    });

    // ── Avatar ──
    const AX = 108,
        AY = H / 2 - 8,
        AR = 58;

    // Dashed ring
    ctx.save();
    ctx.strokeStyle = '#7a1040';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Solid ring
    ctx.save();
    ctx.strokeStyle = '#a01850';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (pp) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(await loadImage(pp), AX - AR, AY - AR, AR * 2, AR * 2);
        ctx.restore();

        // Dark overlay
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#130b18';
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else {
        ctx.save();
        const avG = ctx.createRadialGradient(AX, AY, 0, AX, AY, AR);
        avG.addColorStop(0, 'rgba(160,20,80,0.25)');
        avG.addColorStop(1, 'rgba(80,10,40,0.5)');
        ctx.fillStyle = avG;
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Red X over avatar
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#cc0044';
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

    // ── Content ──
    const CX = W / 2 + 28;

    ctx.font = 'bold 12px PoppinsBold';
    ctx.fillStyle = '#8a1a4a';
    ctx.textAlign = 'center';
    ctx.fillText('✦ UNLIFE ✦', CX, 46);

    ctx.strokeStyle = 'rgba(122,16,64,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX - 170, 54);
    ctx.lineTo(CX + 170, 54);
    ctx.stroke();

    // Name with strikethrough
    const displayName = (life.name || 'User').slice(0, 18);
    ctx.font = 'bold 28px PoppinsBold';
    ctx.fillStyle = '#b89aaa';
    ctx.shadowColor = 'rgba(200,20,80,0.2)';
    ctx.shadowBlur = 10;
    ctx.fillText(displayName, CX, 92);
    ctx.shadowBlur = 0;

    const nw = ctx.measureText(displayName).width;
    ctx.save();
    ctx.strokeStyle = '#cc0044';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(CX - nw / 2, 82);
    ctx.lineTo(CX + nw / 2, 82);
    ctx.stroke();
    ctx.restore();

    ctx.font = '11px PoppinsRegular';
    ctx.fillStyle = '#6b2040';
    ctx.fillText('Data life dihapus dari sistem', CX, 112);

    ctx.strokeStyle = 'rgba(122,16,64,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX - 170, 124);
    ctx.lineTo(CX + 170, 124);
    ctx.stroke();

    // Data rows
    const rows = [
        ['Nama', life.name || '-'],
        ['Gender', life.gender || '-'],
        ['Umur', (life.age || '-') + ' Tahun'],
        ['Life ID', '#' + (life.id || '000000')],
        ['Status', '❌ Life Dihapus'],
    ];

    const colL = CX - 155,
        colR = CX + 10;
    const rowY = 146,
        rowH = 28;

    rows.forEach(([k, v], i) => {
        const y = rowY + i * rowH;
        if (i % 2 === 0) {
            rrp(ctx, colL - 8, y - 14, 330, 22, 4);
            ctx.fillStyle = 'rgba(122,16,64,0.08)';
            ctx.fill();
        }

        ctx.font = '11px PoppinsRegular';
        ctx.fillStyle = '#6b2040';
        ctx.textAlign = 'left';
        ctx.fillText(k, colL, y);

        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(122,16,64,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colL + ctx.measureText(k).width + 4, y - 2);
        ctx.lineTo(colR - 4, y - 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.font = 'bold 12px PoppinsBold';
        ctx.fillStyle = '#c4a0b0';
        ctx.fillText(String(v), colR, y);
    });

    diamondRow(ctx, CX, rowY + rows.length * rowH + 6, 7, 22, 4, 'rgba(160,20,80,0.7)');

    // REVOKED stamp — rotated
    const SX = CX + 152,
        SY = H / 2 + 40;
    ctx.save();
    ctx.translate(SX, SY);
    ctx.rotate(-0.35);
    rrp(ctx, -52, -22, 104, 44, 6);
    ctx.strokeStyle = '#cc0044';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.75;
    ctx.stroke();
    ctx.font = 'bold 15px PoppinsBold';
    ctx.fillStyle = '#cc0044';
    ctx.textAlign = 'center';
    ctx.fillText('DELETED', 0, 6);
    ctx.restore();

    // Footer
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(122,16,64,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 24, H - 36);
    ctx.lineTo(W - MARGIN - 24, H - 36);
    ctx.stroke();

    ctx.font = '9px PoppinsRegular';
    ctx.fillStyle = 'rgba(160,80,110,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('Set life kembali dengan .setlife · Data telah dihapus', W / 2, H - 22);
    ctx.fillText(`${global.botname || 'Bot'}  ·  ${moment.tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm')} WIB`, W / 2, H - 10);

    return canvas.toBuffer('image/jpeg', {
        quality: 94
    });
}

const handler = async (m, {
    conn
}) => {
    const user = global.db.data.users[m.sender];
    const life = user.life;

    if (!life || !life.verified) {
        return m.reply('❌ Kamu belum melakukan set life.\nGunakan *.setlife* untuk memulai.');
    }

    await global.loading(m, conn);

    try {
        const pp = await conn.profilePictureUrl(m.sender, 'image')
            .then(url => fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 Chrome/124'
                    }
                })
                .then(r => r.arrayBuffer()).then(b => Buffer.from(b)))
            .catch(() => 'src/avatar_contact.png');

        // Simpan snapshot sebelum direset
        const snapshot = {
            name: life.name,
            gender: life.gender,
            age: life.age,
            id: life.id,
        };

        // Reset semua data life
        life.name = '';
        life.gender = '';
        life.age = '';
        life.verified = false;
        life.waifu = '';
        life.exp = 0;
        life.lastkencan = 0;
        life.money = 0;
        life.gamepas = 0;
        life.about = '';
        // id dipertahankan agar tidak konflik, cukup reset sisanya

        await global.db.save();

        const card = await generateUnlifeCard(snapshot, pp);
        await conn.sendFile(m.chat, card, 'unlife.jpg', '', m);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.command = ['unlife'];
handler.tags = ['rpg'];
handler.register = true;
handler.rpg = true;
export default handler;