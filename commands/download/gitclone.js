let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Por favor, proporciona una URL de GitHub.\n\nEjemplo: ${usedPrefix}${command} https://github.com/jlucaso1/Baileys/tree/feat-add-stickerpack-support`);
    }

    try {
        global.loading(m, conn);
        const apiUrl = global.API('theresav', '/download/github', {
            url: text
        }, 'apikey');
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.status) {
            const result = data.result;
            let caption = `
      *Owner:* ${result.owner}
      *Repo:* ${result.repo}
      *Language:* ${result.language}
      *Stars:* ${result.stars}
      *Forks:* ${result.forks}
      *Size (MB):* ${result.size_mb}
      *Last Update:* ${result.last_update}
      `;
            await conn.sendMessage(m.chat, {
                text: caption
            }, {
                quoted: m
            });
            await conn.sendMessage(m.chat, {
                document: {
                    url: result.download
                },
                fileName: `${result.repo}.zip`,
                mimetype: 'application/zip'
            }, {
                quoted: m
            });
        } else {
            return m.reply(`Error: ${data.message || 'No se pudo obtener la información del repositorio.'}`);
        }
        global.loading(m, conn, true);
    } catch (error) {
        global.loading(m, conn, true);
        console.error(error);
        return m.reply(`Ocurrió un error: ${error.message || error}`);
    }
};

handler.help = ["gitclone <url>"];
handler.tags = ["downloader"];
handler.command = /^gitclone$/i;
handler.description = "Descarga un repositorio de GitHub.";
handler.register = true;
handler.limit = true;

export default handler;