import decode from 'audio-decode';
import { jidNormalizedUser } from 'baileys';

export function cleanJid(jid) {
  if (!jid || typeof jid !== 'string') return jid;
  
  // Handle cases with leaked session paths or spaces
  let clean = jid.split(' ')[0].trim(); 
  
  if (jid.includes('@sessions/') || jid.includes('.json')) {
    // If it looks like a session file but we have the user part
    const user = clean.split('@')[0];
    const isGroup = jid.includes('@g.us');
    clean = user + (isGroup ? '@g.us' : '@s.whatsapp.net');
  }

  // Ensure it has a domain if it's just numbers (heuristic for group/user)
  if (!clean.includes('@')) {
    clean += clean.length > 15 ? '@g.us' : '@s.whatsapp.net';
  }

  try {
    return jidNormalizedUser(clean).trim();
  } catch {
    // Final safety: strip anything that's not part of a JID
    return clean.replace(/[^0-9\-@.a-z]/g, '');
  }
}

export async function getBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal ambil data dari ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function getSizeMedia(buffer) {
  const bytes = buffer.length;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export async function generateWaveform(buffer) {
  try {
    const audioBuffer = await decode(buffer);
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.floor(channelData.length / 64);
    const waveform = Buffer.alloc(64);
    for (let i = 0; i < 64; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += Math.abs(channelData[i * step + j]);
      }
      waveform[i] = Math.min(255, Math.floor((sum / step) * 255 * 2)); // Amplify a bit
    }
    return waveform;
  } catch (e) {
    return Buffer.from(Array.from({ length: 64 }, () => Math.floor(Math.random() * 255)));
  }
}
