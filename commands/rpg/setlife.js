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

function hexStar(ctx, cx, cy, r, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function glowDot(ctx, cx, cy, r, color, alpha = 1) {
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function cornerDeco(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1]
    ].forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * size, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + dx * (size * 0.5), cy + dy * 4);
        ctx.lineTo(cx + dx * 4, cy + dy * 4);
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

async function generateSetLifeCard(life, pp) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('poppins-bold.ttf', 'PoppinsBold');
    await lf('poppins-medium.ttf', 'PoppinsMedium');
    await lf('poppins-regular.ttf', 'PoppinsRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'Emoji');

    const W = 680,
        H = 420;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Background — deep midnight purple
    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#0d0b1a');
    bgG.addColorStop(0.5, '#110d22');
    bgG.addColorStop(1, '#0a0915');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    // Noise texture
    for (let i = 0; i < 800; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Ambient glow
    const ag1 = ctx.createRadialGradient(W * 0.75, H * 0.2, 0, W * 0.75, H * 0.2, 220);
    ag1.addColorStop(0, 'rgba(138,43,226,0.10)');
    ag1.addColorStop(1, 'transparent');
    ctx.fillStyle = ag1;
    ctx.fillRect(0, 0, W, H);

    const ag2 = ctx.createRadialGradient(W * 0.2, H * 0.8, 0, W * 0.2, H * 0.8, 180);
    ag2.addColorStop(0, 'rgba(72,170,255,0.08)');
    ag2.addColorStop(1, 'transparent');
    ctx.fillStyle = ag2;
    ctx.fillRect(0, 0, W, H);

    const MARGIN = 18;

    // Outer border with gradient
    rrp(ctx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, 14);
    const borderG = ctx.createLinearGradient(0, 0, W, H);
    borderG.addColorStop(0, 'rgba(160,100,255,0.7)');
    borderG.addColorStop(0.5, 'rgba(100,180,255,0.5)');
    borderG.addColorStop(1, 'rgba(160,100,255,0.7)');
    ctx.strokeStyle = borderG;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner border
    rrp(ctx, MARGIN + 5, MARGIN + 5, W - MARGIN * 2 - 10, H - MARGIN * 2 - 10, 10);
    ctx.strokeStyle = 'rgba(160,100,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    cornerDeco(ctx, MARGIN + 3, MARGIN + 3, W - MARGIN * 2 - 6, H - MARGIN * 2 - 6, 22, 'rgba(160,100,255,0.8)');

    // Hex stars scattered
    [
        [W * 0.82, H * 0.10, 9, 0.25],
        [W * 0.12, H * 0.18, 7, 0.20],
        [W * 0.90, H * 0.60, 10, 0.22],
        [W * 0.08, H * 0.72, 8, 0.18],
        [W * 0.76, H * 0.88, 9, 0.20],
        [W * 0.38, H * 0.93, 6, 0.15],
        [W * 0.94, H * 0.30, 7, 0.18],
        [W * 0.58, H * 0.06, 5, 0.20],
    ].forEach(([sx, sy, sr, sa]) => hexStar(ctx, sx, sy, sr, 'rgba(160,100,255,0.9)', sa));

    glowDot(ctx, W * 0.78, H * 0.08, 3, 'rgba(200,150,255,0.9)', 0.9);
    glowDot(ctx, W * 0.14, H * 0.22, 2, 'rgba(100,180,255,0.9)', 0.8);
    glowDot(ctx, W * 0.92, H * 0.65, 3, 'rgba(160,100,255,0.9)', 0.9);
    glowDot(ctx, W * 0.40, H * 0.92, 2, 'rgba(200,150,255,0.9)', 0.7);

    // ── Avatar ──
    const AX = 108,
        AY = H / 2,
        AR = 58;

    ctx.save();
    ctx.strokeStyle = 'rgba(160,100,255,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    const ringG = ctx.createRadialGradient(AX, AY, AR, AX, AY, AR + 10);
    ringG.addColorStop(0, 'rgba(160,100,255,0.6)');
    ringG.addColorStop(1, 'transparent');
    ctx.strokeStyle = ringG;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (pp) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(await loadImage(pp), AX - AR, AY - AR, AR * 2, AR * 2);
        ctx.restore();
    } else {
        ctx.save();
        const avG = ctx.createRadialGradient(AX, AY - AR * 0.2, 0, AX, AY, AR);
        avG.addColorStop(0, 'rgba(160,100,255,0.3)');
        avG.addColorStop(1, 'rgba(80,40,160,0.5)');
        ctx.fillStyle = avG;
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i + Math.PI / 4;
        hexStar(ctx, AX + (AR + 8) * Math.cos(angle), AY + (AR + 8) * Math.sin(angle), 5, 'rgba(180,130,255,0.9)', 0.85);
    }

    // ── Content ──
    const CX = W / 2 + 32;

    diamondRow(ctx, CX, 52, 9, 26, 5, 'rgba(160,100,255,0.8)');

    ctx.font = 'bold 12px PoppinsBold';
    ctx.fillStyle = 'rgba(200,170,255,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText('✦ LIFE PROFILE ✦', CX, 74);

    const divG = ctx.createLinearGradient(CX - 160, 0, CX + 160, 0);
    divG.addColorStop(0, 'transparent');
    divG.addColorStop(0.5, 'rgba(160,100,255,0.5)');
    divG.addColorStop(1, 'transparent');
    ctx.strokeStyle = divG;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX - 160, 82);
    ctx.lineTo(CX + 160, 82);
    ctx.stroke();

    ctx.font = 'bold 28px PoppinsBold';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(160,100,255,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText((life.name || 'User').slice(0, 18), CX, 116);
    ctx.shadowBlur = 0;

    const genderIcon = life.gender === 'male' ? '♂' : life.gender === 'female' ? '♀' : '—';
    const genderColor = life.gender === 'male' ? 'rgba(100,180,255,0.9)' : 'rgba(255,140,200,0.9)';
    ctx.font = '12px PoppinsMedium';
    ctx.fillStyle = genderColor;
    ctx.fillText(`${genderIcon} ${life.gender || '-'}`, CX, 136);

    diamondRow(ctx, CX, 150, 5, 20, 4, 'rgba(160,100,255,0.7)');

    const rows = [
        ['Nama', life.name || '-'],
        ['Gender', life.gender || '-'],
        ['Umur', (life.age || '-') + ' Tahun'],
        ['Status', life.verified ? '✅ Verified' : '❌ Belum'],
        ['Life ID', '#' + (life.id || '000000')],
    ];

    const rowY = 172;
    const colL = CX - 148;
    const colR = CX + 8;
    const rowH = 28;

    rows.forEach(([k, v], i) => {
        const y = rowY + i * rowH;
        if (i % 2 === 0) {
            rrp(ctx, colL - 8, y - 14, 314, 22, 4);
            ctx.fillStyle = 'rgba(160,100,255,0.06)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(160,100,255,0.12)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        ctx.font = '11px PoppinsRegular';
        ctx.fillStyle = 'rgba(180,150,255,0.75)';
        ctx.textAlign = 'left';
        ctx.fillText(k, colL, y);

        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = 'rgba(160,100,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const kw = ctx.measureText(k).width;
        ctx.moveTo(colL + kw + 5, y - 2);
        ctx.lineTo(colR - 5, y - 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.font = 'bold 12px PoppinsBold';
        ctx.fillStyle = '#e8e0ff';
        ctx.fillText(String(v), colR, y);
    });

    diamondRow(ctx, CX, rowY + rows.length * rowH + 6, 7, 22, 4, 'rgba(160,100,255,0.7)');

    // Seal stamp
    const SX = CX + 158,
        SY = H / 2 + 65;
    ctx.save();
    ctx.strokeStyle = 'rgba(160,100,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.arc(SX, SY, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(160,100,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(SX, SY, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    hexStar(ctx, SX, SY, 13, 'rgba(200,160,255,0.9)', 0.85);
    ctx.font = 'bold 7px PoppinsBold';
    ctx.fillStyle = 'rgba(200,160,255,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('LIFE SET', SX, SY + 26);

    // Footer
    const fdG = ctx.createLinearGradient(MARGIN + 24, 0, W - MARGIN - 24, 0);
    fdG.addColorStop(0, 'transparent');
    fdG.addColorStop(0.3, 'rgba(160,100,255,0.35)');
    fdG.addColorStop(0.7, 'rgba(160,100,255,0.35)');
    fdG.addColorStop(1, 'transparent');
    ctx.strokeStyle = fdG;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 24, H - 36);
    ctx.lineTo(W - MARGIN - 24, H - 36);
    ctx.stroke();

    ctx.font = '9px PoppinsRegular';
    ctx.fillStyle = 'rgba(180,150,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Life hanya bisa diset satu kali · Jaga datamu', W / 2, H - 22);
    ctx.fillText(`${global.botname || 'Bot'}  ·  ${moment.tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm')} WIB`, W / 2, H - 10);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

const handler = async (m, {
    conn,
    usedPrefix,
    command,
    text
}) => {
    const user = global.db.data.users[m.sender];
    const life = user.life;

    if (!text) {
        m.reply(`Contoh : ${usedPrefix + command} name,gender,age`);
        return;
    }

    if (life.verified === true) {
        m.reply('⚠️ Sepertinya kamu sudah melakukan set life sebelumnya.');
        return;
    }

    const [name, gender, age] = text.split(',');

    if (!name || !gender || !age) {
        m.reply(
            `Contoh :\n\n${usedPrefix + command} name,gender,age\n` +
            `${usedPrefix + command} Z7:林企业,male/female,18\n\n` +
            `Note :\nSet life hanya bisa satu kali ya, jadi kamu tidak bisa mengubahnya.`
        );
        return;
    }

    if (!['male', 'female'].includes(gender.trim())) {
        m.reply('⚠️ Gender hanya bisa (male atau female)');
        return;
    }

    if (isNaN(age.trim())) {
        m.reply('⚠️ Age harus berupa angka.');
        return;
    }

    life.name = name.trim();
    life.gender = gender.trim();
    life.age = age.trim();
    life.verified = true;

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

        const card = await generateSetLifeCard(life, pp);

        await conn.sendFile(m.chat, card, 'setlife.jpg', '', m);
        await global.db.save();
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.command = ['setlife'];
handler.tags = ['rpg'];
handler.premium = true;
handler.rpg = true;
handler.register = true;
export default handler;