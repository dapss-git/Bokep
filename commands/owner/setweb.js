let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command,
    isOwner
}) => {
    if (!isOwner) {
        return m.reply("Only the owner can use this command.");
    }

    if (!text) {
        return m.reply(`Please provide the new website URL.\n\nExample: ${usedPrefix}${command} https://example.com`);
    }

    global.website = text;
    await global.db.save();

    m.reply(`Website URL updated to: ${global.website}`);
};

handler.help = ["setwebsite <url>"];
handler.tags = ["owner"];
handler.command = /^setwebsite|setweb$/i;
handler.description = "Sets the global website URL.";
handler.owner = true;
handler.register = true;

export default handler;