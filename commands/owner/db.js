let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command,
    isOwner
}) => {
    if (!isOwner) {
        return m.reply("This command is only for the owner.");
    }

    if (!text) {
        return m.reply(`Please provide a phone number to add or remove.\n\nExample: ${usedPrefix}${command} 6281234567890`);
    }

    const number = text.replace(/[^0-9]/g, '');

    if (!number) {
        return m.reply("Invalid phone number. Please provide a valid number.");
    }

    let action = command.toLowerCase().includes('adddb') ? 'add' : 'remove';
    let baseUrl = global.APIs.theresav;
    let endpoint = '/security/DBnumber';

    try {
        const url = global.API('theresav', endpoint, {
            action: action,
            nomor: number
        }, 'apikey');
        const res = await fetch(url);
        const data = await res.json();

        if (data.status) {
            m.reply(data.message);
        } else {
            m.reply(`Failed to ${action} number: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(error);
        m.reply(`An error occurred: ${error.message}`);
    }
};

handler.help = ["adddb <number>", "removedb <number>"];
handler.tags = ["owner"];
handler.command = ["adddb", "deldb"];
handler.owner = true;
handler.description = "Add or remove a phone number from the database (owner only).";
handler.register = true;

export default handler;