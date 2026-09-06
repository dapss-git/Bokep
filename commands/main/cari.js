import path from "path";

const handler = async (m, {
    conn,
    text,
    cmd,
    usedPrefix
}) => {

    if (!text) {
        return m.reply(
            `Cara penggunaan:\n\n` +
            `${usedPrefix}search <query>\n\n` +
            `Contoh:\n` +
            `${usedPrefix}search menu\n` +
            `${usedPrefix}search sticker\n\n` +
            `Fitur ini mencari command berdasarkan nama dan menampilkan:\n` +
            `- Nama command\n` +
            `- Nama file\n` +
            `- Lokasi file\n` +
            `- Nomor file plugin`
        );
    }

    const query = text.toLowerCase().trim();
    const results = [];

    const pluginEntries = Object.entries(cmd.plugins);

    pluginEntries.forEach(([pluginPath, plugin], index) => {
        if (!plugin?.command) return;

        let commandNames = [];

        if (plugin.command instanceof RegExp) {

            const source = plugin.command.source
                .replace(/^\^|\$$/g, "")
                .replace(/\(\?:|\(\?/g, "(")
                .replace(/[()]/g, "")
                .replace(/[+?]/g, "");

            commandNames = source
                .split("|")
                .map(c => c.trim())
                .filter(Boolean);

        } else if (Array.isArray(plugin.command)) {

            commandNames = plugin.command.map(c => {

                if (c instanceof RegExp) {
                    return c.source
                        .replace(/^\^|\$$/g, "")
                        .replace(/[()]/g, "")
                        .replace(/[+?]/g, "")
                        .trim();
                }

                return String(c).trim();

            }).filter(Boolean);

        } else if (typeof plugin.command === "string") {

            commandNames = [plugin.command.trim()];

        }

        const matchedCommands = commandNames.filter(cmdName =>
            cmdName.toLowerCase().includes(query)
        );

        if (matchedCommands.length > 0) {

            const fileName = path.basename(pluginPath);

            const relativePath = pluginPath
                .replace(process.cwd(), "")
                .replace(/^\/|\\/, "");

            results.push({
                number: index + 1,
                commands: matchedCommands,
                file: fileName,
                path: relativePath,
                tags: plugin.tags || []
            });

        }

    });

    if (results.length === 0) {
        return m.reply(
            `Tidak ditemukan command yang cocok dengan "${query}"\n\n` +
            `Coba gunakan kata kunci lain yang lebih umum.`
        );
    }

    let caption = `╭─❁ Hasil Pencarian ❁\n`;
    caption += `◦❒ Query: *${query}*\n`;
    caption += `◦❒ Ditemukan: *${results.length}* command\n`;
    caption += `╰─❁\n\n`;

    results.forEach((result) => {

        const tags = Array.isArray(result.tags) ?
            result.tags.join(", ") :
            String(result.tags || "unknown");

        caption += `*${result.number}. Command:* `;
        caption += `${result.commands.map(c => `*${c}*`).join(", ")}\n`;

        caption += `   *File:* ${result.file}\n`;
        caption += `   *Lokasi:* \`${result.path}\`\n`;
        caption += `   *Tags:* ${tags}\n\n`;

    });

    caption += `Gunakan ${usedPrefix}menu untuk melihat daftar command lengkap.`;

    await conn.sendMessage(
        m.chat, {
            text: caption
        }, {
            quoted: m
        }
    );

};

handler.help = ["search", "cari"];
handler.tags = ["main"];
handler.command = ["search", "cari"];
handler.owner = true;
handler.register = true;

export default handler;