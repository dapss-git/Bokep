import {
    fileTypeFromBuffer
} from 'file-type';

const REPO_OWNER = global.deploy?.github?.user || 'dapss-git';
const REPO_NAME = 'uploader';
const TOKEN = global.deploy?.github?.token;

if (!TOKEN || TOKEN === '-') {
    console.error('[LISTUPLOAD] GitHub token not configured');
}

const FOLDERS = ['image', 'video', 'audio', 'document'];
const PER_PAGE = 15;

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function fetchFolder(folder, page = 1) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/upload/${folder}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (response.status === 404) return {
        files: [],
        total: 0,
        size: 0
    };
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`GitHub API: ${err.message || response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return {
        files: [],
        total: 0,
        size: 0
    };

    data.sort((a, b) => a.name.localeCompare(b.name));
    const total = data.length;
    const size = data.reduce((sum, f) => sum + (f.size || 0), 0);
    const start = (page - 1) * PER_PAGE;
    const end = Math.min(start + PER_PAGE, total);
    const files = data.slice(start, end).map(f => ({
        name: f.name,
        size: f.size || 0,
        download_url: f.download_url
    }));

    return {
        files,
        total,
        size,
        page,
        totalPages: Math.ceil(total / PER_PAGE)
    };
}

async function getSummary() {
    const results = {};
    let totalFiles = 0;
    let totalSize = 0;
    for (const folder of FOLDERS) {
        const {
            total,
            size
        } = await fetchFolder(folder, 1);
        results[folder] = {
            total,
            size
        };
        totalFiles += total;
        totalSize += size;
    }
    return {
        results,
        totalFiles,
        totalSize
    };
}

function buildQuickReply(caption, buttons, footer = '📂 Uploader Files') {
    return {
        interactiveMessage: {
            header: {
                title: '',
                hasMediaAttachment: false
            },
            body: {
                text: caption
            },
            footer: {
                text: footer
            },
            nativeFlowMessage: {
                buttons: buttons.map(btn => ({
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: btn.display_text,
                        id: btn.id
                    })
                })),
                messageParamsJson: JSON.stringify({
                    bottom_sheet: {
                        in_thread_buttons_limit: 2,
                        divider_indices: [1, 2, 3, 4, 5, 999],
                        list_title: 'Pilih Aksi',
                        button_title: '📂 Menu'
                    }
                })
            }
        }
    };
}

const additionalNodes = [{
    tag: 'biz',
    attrs: {},
    content: [{
        tag: 'interactive',
        attrs: {
            type: 'native_flow',
            v: '1'
        },
        content: [{
            tag: 'native_flow',
            attrs: {
                v: '9',
                name: 'mixed'
            }
        }]
    }]
}];

const handler = async (m, {
    text,
    usedPrefix,
    conn
}) => {
    if (!TOKEN || TOKEN === '-') {
        return m.reply('❌ GitHub token belum dikonfigurasi.');
    }

    if (!text) {
        const summary = await getSummary();
        let caption = `📊 *UPLOADER SUMMARY*\n\n`;
        const emojis = {
            image: '🖼️',
            video: '🎬',
            audio: '🎵',
            document: '📄'
        };
        for (const folder of FOLDERS) {
            const data = summary.results[folder];
            caption += `${emojis[folder]} *${folder.charAt(0).toUpperCase() + folder.slice(1)}*\n`;
            caption += `   📁 ${data.total} files\n`;
            caption += `   💾 ${formatSize(data.size)}\n\n`;
        }
        caption += `📦 *Total:* ${summary.totalFiles} files\n`;
        caption += `💾 *Total Size:* ${formatSize(summary.totalSize)}`;

        const buttons = FOLDERS.map(folder => ({
            display_text: `${emojis[folder]} ${folder.charAt(0).toUpperCase() + folder.slice(1)}`,
            id: `${usedPrefix}listupload ${folder}`
        }));
        buttons.push({
            display_text: '🔄 Refresh',
            id: `${usedPrefix}listupload`
        });

        const message = buildQuickReply(caption, buttons);
        await conn.relayMessage(m.chat, message, {
            additionalNodes
        });
        return;
    }

    const parts = text.trim().split(' ');
    const folder = parts[0].toLowerCase();
    const page = parseInt(parts[1]) || 1;

    if (!FOLDERS.includes(folder)) {
        return m.reply(`❌ Folder tidak valid. Pilih: ${FOLDERS.join(', ')}`);
    }

    try {
        const {
            files,
            total,
            size,
            page: currentPage,
            totalPages
        } = await fetchFolder(folder, page);

        if (total === 0) {
            return m.reply(`📂 *${folder.charAt(0).toUpperCase() + folder.slice(1)}*\n\nTidak ada file.`);
        }

        const emojis = {
            image: '🖼️',
            video: '🎬',
            audio: '🎵',
            document: '📄'
        };
        let caption = `${emojis[folder]} *${folder.charAt(0).toUpperCase() + folder.slice(1)}*\n`;
        caption += `📁 ${total} files · 💾 ${formatSize(size)}\n`;
        caption += `📄 Halaman ${currentPage} dari ${totalPages}\n\n`;

        files.forEach((f, i) => {
            const num = (currentPage - 1) * PER_PAGE + i + 1;
            caption += `${num}. ${f.name}\n`;
            caption += `   📦 ${formatSize(f.size)}\n`;
        });

        const buttons = [];
        if (currentPage > 1) {
            buttons.push({
                display_text: '⬅️ Prev',
                id: `${usedPrefix}listupload ${folder} ${currentPage - 1}`
            });
        }
        if (currentPage < totalPages) {
            buttons.push({
                display_text: '➡️ Next',
                id: `${usedPrefix}listupload ${folder} ${currentPage + 1}`
            });
        }
        buttons.push({
            display_text: '📊 Summary',
            id: `${usedPrefix}listupload`
        });
        for (const f of FOLDERS) {
            if (f !== folder) {
                buttons.push({
                    display_text: `${emojis[f]} ${f.charAt(0).toUpperCase() + f.slice(1)}`,
                    id: `${usedPrefix}listupload ${f}`
                });
            }
        }

        const message = buildQuickReply(caption, buttons, `📂 ${folder} · Page ${currentPage}/${totalPages}`);
        await conn.relayMessage(m.chat, message, {
            additionalNodes
        });

    } catch (e) {
        console.error('[LISTUPLOAD]', e);
        m.reply(`❌ Gagal mengambil data: ${e.message}`);
    }
};

handler.help = ['listupload', 'listupload <folder> [page]'];
handler.tags = ['tools'];
handler.command = /^(listupload|lu)$/i;
handler.owner = true;

export default handler;