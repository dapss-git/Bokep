import fs from "fs";
import {
    execSync
} from "child_process";

let handler = async (m, {
    conn
}) => {
    try {
        const tempDir = "./tmp";
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, {
            recursive: true
        });
        const backupName = global.botname || "backup";
        const backupPath = `${tempDir}/${backupName}.zip`;
        
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
        
        await m.reply("📦 Memproses backup script bot...");
        const ls = (await execSync("ls"))
            .toString()
            .split("\n")
            .filter(
                (pe) =>
                pe !== "node_modules" &&
                pe !== "sessions" &&
                pe !== "package-lock.json" &&
                pe !== "yarn.lock" &&
                pe !== "pnpm-lock.yaml" &&
                pe !== ""
            );
        await execSync(`zip -r ${backupPath} ${ls.join(" ")}`);
        
        if (!fs.existsSync(backupPath)) {
            throw new Error("File backup gagal dibuat.");
        }

        await conn.sendMessage(
            m.sender, {
                document: fs.readFileSync(backupPath),
                fileName: `${backupName}.zip`,
                mimetype: "application/zip",
            }, {
                quoted: m.chat === m.sender ? m : null
            }
        );
        fs.unlinkSync(backupPath);
        if (m.chat !== m.sender) return m.reply("Script bot berhasil dikirim ke private chat!");
    } catch (e) {
        console.error(e);
        m.reply(`❌ Gagal membuat backup script: ${e.message}`);
    }
};

handler.help = ["backup"];
handler.tags = ["owner"];
handler.command = ["backup"]
handler.owner = true;
handler.register = true;

export default handler;