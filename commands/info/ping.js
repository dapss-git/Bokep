import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas';
import {
    performance
} from 'perf_hooks';
import os from 'os';
import {
    execSync
} from 'child_process';

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

function sakura(ctx, cx, cy, r, color, alpha) {
    if (alpha === undefined) alpha = 1;
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
    var corners = [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1]
    ];
    corners.forEach(function(c) {
        var cx = c[0],
            cy = c[1],
            dx = c[2],
            dy = c[3];
        ctx.beginPath();
        ctx.moveTo(cx + dx * size, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * size);
        ctx.stroke();
    });
}

function diamondRow(ctx, cx, y, count, spacing, size, color) {
    var startX = cx - (count - 1) * spacing / 2;
    for (var i = 0; i < count; i++) {
        var dx = startX + i * spacing;
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

function drawDonut(ctx, cx, cy, radius, lineWidth, pct, arcColor, label, sublabel) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201,149,110,0.2)';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    var start = -Math.PI / 2;
    var end = start + Math.PI * 2 * Math.min(pct / 100, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.shadowColor = arcColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px SFBold';
    ctx.fillStyle = '#3c2818';
    ctx.fillText(label, cx, cy - 7);
    ctx.font = '10px SFRegular';
    ctx.fillStyle = '#9b6a43';
    ctx.fillText(sublabel, cx, cy + 10);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
}

function drawBar(ctx, x, y, w, h, pct, color, label, valText) {
    rrp(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = 'rgba(201,149,110,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    var fw = Math.max(w * Math.min(pct / 100, 1), h);
    rrp(ctx, x, y, fw, h, h / 2);
    var g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, color);
    g.addColorStop(1, color + 'aa');
    ctx.save();
    ctx.fillStyle = g;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();

    ctx.font = '9px SFRegular';
    ctx.fillStyle = '#9b6a43';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 5);

    ctx.font = 'bold 10px SFBold';
    ctx.fillStyle = '#3c2818';
    ctx.textAlign = 'right';
    ctx.fillText(valText, x + w, y - 5);
}

function drawPill(ctx, x, y, w, h, icon, label, value) {
    rrp(ctx, x, y, w, h, 8);
    ctx.fillStyle = 'rgba(201,149,110,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '9px SFRegular';
    ctx.fillStyle = '#9b6a43';
    ctx.fillText(icon + ' ' + label, x + 10, y + 16);

    ctx.font = 'bold 12px SFBold';
    ctx.fillStyle = '#3c2818';
    ctx.fillText(value, x + 10, y + 33);
}

function fmtSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var s = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + s[i];
}

function fmtTime(sec) {
    sec = Number(sec);
    var d = Math.floor(sec / 86400);
    var h = Math.floor(sec % 86400 / 3600);
    var m = Math.floor(sec % 3600 / 60);
    if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm ' + Math.floor(sec % 60) + 's';
}

function getNetStats() {
    try {
        var ifaces = os.networkInterfaces();
        var iface = 'N/A',
            rx = 0,
            tx = 0;
        for (var name in ifaces) {
            if (name.toLowerCase().includes('lo')) continue;
            var addrs = ifaces[name];
            for (var j = 0; j < addrs.length; j++) {
                if (addrs[j].family === 'IPv4' && !addrs[j].internal) {
                    iface = name;
                    break;
                }
            }
        }
        try {
            var lines = execSync('cat /proc/net/dev 2>/dev/null || echo ""').toString().split('\n');
            lines.forEach(function(l) {
                if (l.includes(':') && !l.includes('lo:')) {
                    var p = l.trim().split(/\s+/);
                    if (p.length >= 10) {
                        rx += parseInt(p[1]) || 0;
                        tx += parseInt(p[9]) || 0;
                    }
                }
            });
        } catch (_) {}
        return {
            iface,
            rx,
            tx
        };
    } catch (_) {
        return {
            iface: 'N/A',
            rx: 0,
            tx: 0
        };
    }
}

async function renderPingCard(stats) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');

    var W = 720;

    var FOOTER_H = 40;
    var pillH2_pre = 46,
        pillRows = 2;
    var donutY_pre = 210,
        donutR_pre = 46;
    var barsH = 4 * 30;
    var pillsH = pillRows * (pillH2_pre + 8) + 26;
    var H = donutY_pre + donutR_pre + 38 + barsH + pillsH + FOOTER_H;
    var canvas = createCanvas(W, H);
    var ctx = canvas.getContext('2d');

    var bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#fdf8f0');
    bgG.addColorStop(0.45, '#fef9f2');
    bgG.addColorStop(1, '#faf3e8');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < 800; i++) {
        ctx.fillStyle = 'rgba(180,140,100,' + (Math.random() * 0.04 + 0.01) + ')';
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(160,110,60,0.12)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    var M = 18;
    rrp(ctx, M, M, W - M * 2, H - M * 2, 12);
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    rrp(ctx, M + 5, M + 5, W - M * 2 - 10, H - M * 2 - 10, 9);
    ctx.strokeStyle = 'rgba(201,149,110,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    cornerFlourish(ctx, M + 3, M + 3, W - M * 2 - 6, H - M * 2 - 6, 20, '#c9956e');

    var sp = '#f8a4c0',
        sl = '#fcc8d8',
        sd = '#e87098';
    sakura(ctx, 46, 46, 28, sl, 0.18);
    sakura(ctx, W - 50, 40, 22, sp, 0.14);
    sakura(ctx, 38, H - 46, 24, sp, 0.16);
    sakura(ctx, W - 46, H - 50, 26, sl, 0.14);

    [
        [W * 0.75, H * 0.10, 8, 0.3, sp],
        [W * 0.14, H * 0.25, 6, 0.8, sl],
        [W * 0.88, H * 0.52, 9, 1.1, sp],
        [W * 0.09, H * 0.70, 7, 0.2, sd],
        [W * 0.70, H * 0.90, 8, 1.5, sl],
        [W * 0.92, H * 0.28, 7, 1.8, sd],
    ].forEach(function(p) {
        petal(ctx, p[0], p[1], p[2], p[3], p[4], 0.55);
    });

    diamondRow(ctx, W / 2, 40, 11, 24, 5, '#c9956e');

    ctx.font = 'bold 14px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('\u2736 SYSTEM MONITOR \u2736', W / 2, 62);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, 70);
    ctx.lineTo(W - M - 24, 70);
    ctx.stroke();

    ctx.font = 'bold 26px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 8;
    ctx.fillText(global.botname || 'Bot Monitor', W / 2, 98);
    ctx.shadowBlur = 0;

    var pingMs = parseFloat(stats.ping);
    var pingColor = pingMs < 100 ? '#2a8a2a' : pingMs < 300 ? '#9a6200' : '#c03030';
    var pingBg = pingMs < 100 ? '#d8f0d8' : pingMs < 300 ? '#fce8c0' : '#fcd8d8';
    var pingBdr = pingMs < 100 ? '#60c060' : pingMs < 300 ? '#d09030' : '#e06060';
    var pingLabel = pingMs < 100 ? 'LATENCY \u2022 GOOD' : pingMs < 300 ? 'LATENCY \u2022 MEDIUM' : 'LATENCY \u2022 HIGH';

    rrp(ctx, W / 2 - 72, 108, 144, 32, 16);
    ctx.fillStyle = pingBg;
    ctx.fill();
    ctx.strokeStyle = pingBdr;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '9px SFMedium';
    ctx.fillStyle = pingColor;
    ctx.fillText(pingLabel, W / 2, 121);
    ctx.font = 'bold 15px SFBold';
    ctx.fillStyle = pingColor;
    ctx.fillText(stats.ping + ' ms', W / 2, 135);

    diamondRow(ctx, W / 2, 148, 7, 22, 4, '#c9956e');

    var donutY = 210;
    var donutR = 46;
    var donutLW = 11;
    var cpuPct = parseFloat(stats.cpuLoad);
    var ramPct = Math.round((stats.ramUsed / stats.ramTotal) * 100);
    var diskPct = stats.diskTotal > 0 ? Math.round((stats.diskUsed / stats.diskTotal) * 100) : 0;

    drawDonut(ctx, W / 4, donutY, donutR, donutLW, cpuPct, '#b07820', Math.round(cpuPct) + '%', 'CPU');
    drawDonut(ctx, W / 2, donutY, donutR, donutLW, ramPct, '#c04a2a', ramPct + '%', 'RAM');
    drawDonut(ctx, W * 3 / 4, donutY, donutR, donutLW, diskPct, '#7a3a8a', diskPct + '%', 'DISK');

    var donutSubs = [
        [W / 4, stats.cpuCores + ' Core \u00b7 ' + (stats.cpuSpeed > 0 ? stats.cpuSpeed + ' MHz' : 'N/A')],
        [W / 2, fmtSize(stats.ramUsed) + ' / ' + fmtSize(stats.ramTotal)],
        [W * 3 / 4, fmtSize(stats.diskUsed) + ' / ' + fmtSize(stats.diskTotal)],
    ];
    donutSubs.forEach(function(d) {
        ctx.font = '9px SFRegular';
        ctx.fillStyle = '#9b6a43';
        ctx.textAlign = 'center';
        ctx.fillText(d[1], d[0], donutY + donutR + 20);
    });

    var barX = M + 28,
        barW = W - (M + 28) * 2,
        barH = 10;
    var barY = donutY + donutR + 38;

    drawBar(ctx, barX, barY, barW, barH, cpuPct, '#b07820', 'CPU Load', cpuPct + '%');
    barY += 30;
    drawBar(ctx, barX, barY, barW, barH, ramPct, '#c04a2a', 'Memory Usage', ramPct + '%');
    barY += 30;
    drawBar(ctx, barX, barY, barW, barH, diskPct, '#7a3a8a', 'Disk Usage', diskPct + '%');
    barY += 30;
    drawBar(ctx, barX, barY, barW, barH, Math.min(100, pingMs / 5), pingColor, 'Network Latency', stats.ping + ' ms');

    barY += 26;
    diamondRow(ctx, W / 2, barY, 9, 24, 4, '#c9956e');
    barY += 14;

    var pillData = [
        ['>', 'Hostname', stats.hostname.slice(0, 14)],
        ['>', 'Platform', stats.platform + ' ' + stats.arch],
        ['>', 'Node.js', stats.nodeVersion],
        ['>', 'Bot Uptime', stats.uptimeBot],
        ['>', 'OS Uptime', stats.uptimeServer],
        ['>', 'Network', '\u2193' + fmtSize(stats.netRx) + ' \u2191' + fmtSize(stats.netTx)],
    ];

    var pillW = Math.floor((W - (M + 28) * 2 - 10) / 3);
    var pillH2 = 46;
    pillData.forEach(function(p, idx) {
        var col = idx % 3,
            row = Math.floor(idx / 3);
        var px = barX + col * (pillW + 5);
        var py = barY + row * (pillH2 + 8);
        drawPill(ctx, px, py, pillW, pillH2, p[0], p[1], p[2]);
    });

    var footerY = barY + 2 * (pillH2 + 8) + 12;
    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, footerY);
    ctx.lineTo(W - M - 24, footerY);
    ctx.stroke();

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText((global.botname || 'Bot') + '  \u00b7  ' + new Date().toLocaleString('id-ID') + ' WIB', W / 2, footerY + 16);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

let handler = async (m, {
    conn
}) => {
    try {
        const loadMsg = await m.reply('\u23f3 Generating...');

        const t0 = performance.now();
        await new Promise(r => setTimeout(r, 10));
        const latency = (performance.now() - t0).toFixed(2);

        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        let cpuPct = '0.0';
        try {
            function readCpuStat() {
                const line = execSync('head -1 /proc/stat').toString().trim();
                const p = line.split(/\s+/).slice(1).map(Number);
                const idle = p[3] + (p[4] || 0);
                const total = p.reduce((a, b) => a + b, 0);
                return {
                    idle,
                    total
                };
            }
            const s1 = readCpuStat();
            await new Promise(r => setTimeout(r, 150));
            const s2 = readCpuStat();
            const dtotal = s2.total - s1.total;
            const didle = s2.idle - s1.idle;
            cpuPct = dtotal > 0 ? Math.min(100, ((dtotal - didle) / dtotal * 100)).toFixed(1) : '0.0';
        } catch (_) {

            const loadAvg = os.loadavg();
            cpuPct = Math.min(100, (loadAvg[0] * 100) / cpus.length).toFixed(1);
        }

        let cpuSpeed = cpus[0].speed;
        if (!cpuSpeed || cpuSpeed === 0) {
            try {
                const mhz = execSync('grep -m1 "cpu MHz" /proc/cpuinfo 2>/dev/null || echo ""').toString();
                const m = mhz.match(/[\d.]+/);
                cpuSpeed = m ? Math.round(parseFloat(m[0])) : 0;
            } catch (_) {}
        }

        let diskTotal = 0,
            diskUsed = 0;
        try {
            const df = execSync('df -k --output=size,used / 2>/dev/null').toString();
            const lines = df.trim().split('\n');
            if (lines.length > 1) {
                const [t, u] = lines[1].trim().split(/\s+/).map(Number);
                diskTotal = t * 1024;
                diskUsed = u * 1024;
            }
        } catch (_) {}

        const net = getNetStats();

        const stats = {
            ping: latency,
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptimeBot: fmtTime(process.uptime()),
            uptimeServer: fmtTime(os.uptime()),
            cpuSpeed: cpuSpeed,
            cpuCores: cpus.length,
            cpuLoad: cpuPct,
            ramTotal: totalMem,
            ramUsed: totalMem - freeMem,
            diskTotal,
            diskUsed,
            netRx: net.rx,
            netTx: net.tx,
        };

        const img = await renderPingCard(stats);

        await conn.sendMessage(m.chat, {
            image: img,
            caption: `*System Monitor*\n\n` +
                `• Latency : ${latency} ms\n` +
                `• CPU     : ${stats.cpuLoad}%\n` +
                `• RAM     : ${fmtSize(stats.ramUsed)} / ${fmtSize(stats.ramTotal)}\n` +
                `• Disk    : ${fmtSize(stats.diskUsed)} / ${fmtSize(stats.diskTotal)}\n` +
                `• Network : \u2193${fmtSize(stats.netRx)} \u2191${fmtSize(stats.netTx)}`
        }, {
            quoted: m
        });

        await conn.sendMessage(m.chat, {
            delete: loadMsg.key
        });

    } catch (e) {
        console.error(e);
        m.reply(`Error: ${e.message}`);
    }
};

handler.help = ['ping'];
handler.tags = ['info'];
handler.command = ['ping'];
handler.register = true;
handler.limit = true;

export default handler;