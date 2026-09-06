import moment from "moment-timezone";

const handler = async (m, { db }) => {
  const users = db.data.users || {};
  const now = Date.now();

  const premiumList = Object.entries(users)
    .filter(([_, u]) => u?.premium?.status === true)
    .map(([jid, u]) => ({
      jid,
      expired: u.premium.expired || 0,
    }))
    .sort((a, b) => a.expired - b.expired);

  if (!premiumList.length) {
    return m.reply("📭 Tidak ada user premium saat ini.");
  }

  const aktif = premiumList.filter(u => !u.expired || u.expired > now);
  const kadaluarsa = premiumList.filter(u => u.expired && u.expired <= now);

  let text =
    "📋 *DAFTAR USER PREMIUM*\n\n" +
    `📊 *STATISTIK*\n` +
    `• Total : ${premiumList.length}\n` +
    `• Aktif : ${aktif.length}\n` +
    `• Expired : ${kadaluarsa.length}\n\n`;

  premiumList.forEach((u, i) => {
    const status = u.expired > now ? "🟢 Aktif" : "🔴 Expired";
    text +=
      `${i + 1}. @${u.jid.split("@")[0]}\n` +
      `   ⏰ Expired: ${moment(u.expired)
        .tz("Asia/Jakarta")
        .format("DD MMM YYYY, HH:mm")} WIB\n` +
      `   📌 Status: ${status}\n\n`;
  });

  m.reply(text.trim(), {
    mentions: premiumList.map(v => v.jid),
  });
};

handler.command = ["listprem", "listpremium"];
handler.tags = "owner";
handler.owner = true;
handler.register = true;

export default handler;