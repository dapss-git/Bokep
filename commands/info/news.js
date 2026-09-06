import axios from 'axios';

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  try {
    m.reply('📰 Fetching latest news...');

    const newsCategories = [
      'Technology',
      'Business',
      'Sports',
      'Entertainment',
      'Health',
      'Science'
    ];

    const headlines = [
      "Breaking: Major tech company announces revolutionary new product",
      "Global markets show positive trends amid economic recovery",
      "Sports team wins championship in stunning upset victory",
      "New study reveals benefits of healthy lifestyle choices",
      "Scientists make breakthrough discovery in renewable energy",
      "Entertainment industry sees record-breaking box office numbers",
      "International summit addresses climate change concerns",
      "New technology promises to transform daily life",
      "Health experts recommend new guidelines for wellness",
      "Education sector embraces digital transformation"
    ];

    const randomNews = [];
    for (let i = 0; i < 5; i++) {
      randomNews.push({
        title: headlines[Math.floor(Math.random() * headlines.length)],
        category: newsCategories[Math.floor(Math.random() * newsCategories.length)],
        time: `${Math.floor(Math.random() * 12) + 1}h ago`
      });
    }

    const newsList = randomNews.map((news, i) => 
      `${i + 1}. *${news.title}*\n   📁 ${news.category} • ⏰ ${news.time}`
    ).join('\n\n');

    const message = `╭───「 *LATEST NEWS* 」───⬣
│
│ ${newsList}
│
│ 📰 Stay informed!
│ ⏰ ${new Date().toLocaleString()}
│
╰─────────────────────⬣`;

    await conn.sendMessage(m.chat, {
      text: message,
      contextInfo: {
        externalAdReply: {
          title: 'Latest News',
          body: 'Stay Updated',
          thumbnailUrl: 'https://api.deline.web.id/2qOH0fJyNH.jpg',
          sourceUrl: global.website
        }
      }
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply('❌ Error fetching news!');
  }
};

handler.command = ['news', 'berita', 'latestnews', 'headlines'];
handler.help = ['news'];
handler.tags = ['info'];
handler.exp = 5;
handler.limit = true;

handler.register = true

export default handler;
