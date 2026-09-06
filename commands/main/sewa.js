import {
    createCanvas,
    GlobalFonts
} from '@napi-rs/canvas';

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
    for (let i = 0; i < 5; i++) petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha);
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
    ].forEach(([cx, cy, dx, dy]) => {
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

function dividerLine(ctx, y, W, color) {
    const g = ctx.createLinearGradient(40, 0, W - 40, 0);
    g.addColorStop(0, 'transparent');
    g.addColorStop(0.15, color);
    g.addColorStop(0.85, color);
    g.addColorStop(1, 'transparent');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W - 40, y);
    ctx.stroke();
}

function sectionHeading(ctx, text, x, y, W, color) {
    ctx.font = 'bold 9px SFBold';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
    const tw = ctx.measureText(text).width;
    const g = ctx.createLinearGradient(x + tw + 8, 0, x + tw + 120, 0);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + tw + 8, y - 3);
    ctx.lineTo(x + tw + 120, y - 3);
    ctx.stroke();
}

async function generateSewaCard(owners) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'Emoji');

    const W = 700,
        H = 540;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#fdf8f0');
    bgG.addColorStop(0.35, '#fef9f2');
    bgG.addColorStop(0.7, '#fdf5ec');
    bgG.addColorStop(1, '#faf3e8');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 800; i++) {
        ctx.fillStyle = `rgba(180,140,100,${Math.random()*0.035+0.008})`;
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.8);
    vign.addColorStop(0, 'transparent');
    vign.addColorStop(1, 'rgba(150,100,50,0.13)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);

    const warm = ctx.createRadialGradient(W * 0.15, H * 0.2, 0, W * 0.15, H * 0.2, 260);
    warm.addColorStop(0, 'rgba(248,164,192,0.09)');
    warm.addColorStop(1, 'transparent');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, W, H);

    const MARGIN = 18;
    rrp(ctx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, 14);
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 2;
    ctx.stroke();

    rrp(ctx, MARGIN + 6, MARGIN + 6, W - MARGIN * 2 - 12, H - MARGIN * 2 - 12, 10);
    ctx.strokeStyle = 'rgba(201,149,110,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    cornerFlourish(ctx, MARGIN + 3, MARGIN + 3, W - MARGIN * 2 - 6, H - MARGIN * 2 - 6, 24, '#c9956e');

    const sp = '#f8a4c0',
        sl = '#fcc8d8',
        sd = '#e87098';

    sakura(ctx, 44, 44, 30, sl, 0.20);
    sakura(ctx, W - 48, 36, 24, sp, 0.16);
    sakura(ctx, 34, H - 44, 26, sp, 0.18);
    sakura(ctx, W - 42, H - 48, 28, sl, 0.15);
    sakura(ctx, W * 0.5 + 155, 28, 18, sd, 0.11);
    sakura(ctx, 115, H - 28, 15, sp, 0.13);
    sakura(ctx, W - 110, H * 0.5, 10, sl, 0.10);

    [
        [W * 0.80, H * 0.10, 9, 0.3, sp],
        [W * 0.13, H * 0.22, 7, 0.8, sl],
        [W * 0.90, H * 0.50, 10, 1.1, sp],
        [W * 0.09, H * 0.72, 8, 0.2, sd],
        [W * 0.74, H * 0.88, 9, 1.5, sl],
        [W * 0.38, H * 0.95, 7, 0.6, sp],
        [W * 0.93, H * 0.25, 8, 1.8, sd],
        [W * 0.52, H * 0.05, 6, 0.9, sp],
        [W * 0.25, H * 0.88, 7, 1.2, sl],
        [W * 0.65, H * 0.04, 5, 0.4, sd],
    ].forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55));

    diamondRow(ctx, W / 2, 50, 11, 24, 5, '#c9956e');

    ctx.font = 'bold 11px SFBold';
    ctx.fillStyle = '#9b6a43';
    ctx.textAlign = 'center';
    ctx.fillText('✦  LAYANAN SEWA BOT  ✦', W / 2, 72);

    ctx.font = 'bold 34px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.shadowColor = 'rgba(201,149,110,0.35)';
    ctx.shadowBlur = 12;
    ctx.fillText('S E W A   B O T', W / 2, 112);
    ctx.shadowBlur = 0;

    ctx.font = '12px SFMedium';
    ctx.fillStyle = '#b07850';
    ctx.fillText('Layanan rental bot WhatsApp terpercaya', W / 2, 132);

    dividerLine(ctx, 146, W, 'rgba(201,149,110,0.5)');
    diamondRow(ctx, W / 2, 146, 5, 22, 4, '#c9956e');

    const COL_L = 50,
        COL_R = W / 2 + 18,
        CARD_W = W / 2 - COL_L - 18;

    sectionHeading(ctx, 'PAKET HARGA', COL_L, 172, W, '#9b6a43');

    const plans = [{
            dur: '10 Hari',
            price: '5.000',
            badge: 'STARTER',
            bColor: '#a8d8a8'
        },
        {
            dur: '20 Hari',
            price: '10.000',
            badge: 'POPULAR',
            bColor: '#f4a261'
        },
        {
            dur: '30 Hari',
            price: '15.000',
            badge: 'BEST',
            bColor: '#e07098'
        },
        {
            dur: '40 Hari',
            price: '20.000',
            badge: 'PREMIUM',
            bColor: '#b08ad0'
        },
    ];

    plans.forEach(({
        dur,
        price,
        badge,
        bColor
    }, i) => {
        const y = 182 + i * 48;
        const isEven = i % 2 === 0;

        rrp(ctx, COL_L, y, CARD_W, 40, 10);
        const planBg = ctx.createLinearGradient(COL_L, y, COL_L + CARD_W, y + 40);
        planBg.addColorStop(0, isEven ? 'rgba(201,149,110,0.09)' : 'rgba(248,164,192,0.07)');
        planBg.addColorStop(1, 'rgba(201,149,110,0.03)');
        ctx.fillStyle = planBg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,149,110,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();

        rrp(ctx, COL_L, y, 4, 40, 2);
        ctx.fillStyle = bColor;
        ctx.fill();

        ctx.font = '11px SFMedium';
        ctx.fillStyle = '#7a3e1a';
        ctx.textAlign = 'left';
        ctx.fillText(dur, COL_L + 14, y + 14);

        ctx.font = 'bold 20px SFBold';
        ctx.fillStyle = '#4a1e0a';
        ctx.fillText('Rp ' + price, COL_L + 14, y + 32);

        ctx.font = '8px SFRegular';
        ctx.fillStyle = 'rgba(155,106,67,0.55)';
        ctx.fillText('/ grup', COL_L + 14 + ctx.measureText('Rp ' + price).width + 5, y + 32);

        const bW = ctx.measureText(badge).width + 16;
        rrp(ctx, COL_L + CARD_W - bW - 8, y + 8, bW, 18, 9);
        ctx.fillStyle = bColor + '33';
        ctx.fill();
        ctx.strokeStyle = bColor + '88';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = 'bold 8px SFBold';
        ctx.fillStyle = bColor === '#a8d8a8' ? '#2d7a2d' : bColor === '#f4a261' ? '#7a3e00' : bColor === '#e07098' ? '#7a1040' : '#4a2080';
        ctx.textAlign = 'right';
        ctx.fillText(badge, COL_L + CARD_W - 16, y + 20);
    });

    sectionHeading(ctx, 'FITUR TERSEDIA', COL_R, 172, W, '#9b6a43');

    const features = [
        ['🔗', 'Antilink'],
        ['👋', 'Welcome & Bye'],
        ['⚙️', 'Enable / Disable'],
        ['👑', 'Promote / Demote'],
        ['📢', 'HideTag / Tagall'],
        ['🛒', 'Store List'],
        ['🛡️', 'Anti Media'],
        ['🎉', 'Games & Fun'],
        ['✨', 'Dan Lain Lain'],
    ];

    features.forEach(([icon, feat], i) => {
        const fy = 182 + i * 24;
        if (i % 2 === 0) {
            rrp(ctx, COL_R - 4, fy - 10, W - COL_R - MARGIN - 12, 20, 4);
            ctx.fillStyle = 'rgba(201,149,110,0.05)';
            ctx.fill();
        }
        ctx.font = '12px Emoji';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#7a3e1a';
        ctx.fillText(icon, COL_R + 4, fy + 4);
        ctx.font = i === features.length - 1 ? 'bold 11px SFMedium' : '11px SFRegular';
        ctx.fillStyle = i === features.length - 1 ? '#c9956e' : '#5a2c10';
        ctx.fillText(feat, COL_R + 28, fy + 4);

        ctx.beginPath();
        ctx.arc(COL_R - 8, fy - 1, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#c9956e88';
        ctx.fill();
    });

    const divY = 406;
    dividerLine(ctx, divY, W, 'rgba(201,149,110,0.45)');
    diamondRow(ctx, W / 2, divY, 7, 22, 4, '#c9956e');

    ctx.font = 'bold 10px SFBold';
    ctx.fillStyle = '#9b6a43';
    ctx.textAlign = 'center';
    ctx.fillText('✦  HUBUNGI OWNER  ✦', W / 2, divY + 20);

    const validOwners = owners.slice(0, 3);
    const tot = validOwners.length || 1;
    const owW = 180,
        owGap = 18;
    const owTotalW = tot * owW + (tot - 1) * owGap;
    const owStartX = (W - owTotalW) / 2;

    validOwners.forEach(([jid, name], i) => {
        const ox = owStartX + i * (owW + owGap);
        const oy = divY + 30;

        rrp(ctx, ox, oy, owW, 62, 12);
        const owBg = ctx.createLinearGradient(ox, oy, ox + owW, oy + 62);
        owBg.addColorStop(0, 'rgba(201,149,110,0.10)');
        owBg.addColorStop(1, 'rgba(248,164,192,0.06)');
        ctx.fillStyle = owBg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,149,110,0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const cx2 = ox + owW / 2;

        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(248,164,192,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx2, oy + 20, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.font = '16px Emoji';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7a3e1a';
        ctx.fillText('👤', cx2, oy + 26);

        ctx.font = 'bold 12px SFBold';
        ctx.fillStyle = '#4a1e0a';
        ctx.fillText(name || 'Owner', cx2, oy + 44);

        ctx.font = '9px SFRegular';
        ctx.fillStyle = 'rgba(155,106,67,0.65)';
        ctx.fillText('wa.me/' + jid, cx2, oy + 57);
    });

    dividerLine(ctx, H - 34, W, 'rgba(201,149,110,0.35)');

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('Pembayaran via transfer · Garansi aktif sesuai paket', W / 2, H - 20);
    ctx.fillText(`${global.botname||'Bot'}  ·  ${global.website||''}`, W / 2, H - 8);

    return canvas.toBuffer('image/jpeg', {
        quality: 96
    });
}

let handler = async (m, {
    conn
}) => {
    try {
        await global.loading(m, conn);
        const owners = (global.owner || []).filter(o => Array.isArray(o) && o[2] !== false);
        const card = await generateSewaCard(owners);
        await conn.sendFile(m.chat, card, 'sewa.jpg', '', m);
    } catch (e) {
        throw e;
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['sewabot'];
handler.tags = ['main'];
handler.command = /^sewa(bot)?$/i;
handler.register = true;

export default handler;