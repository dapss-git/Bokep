import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import webp from 'node-webpmux'
import { fileTypeFromBuffer } from 'file-type'
import ffmpegPath from 'ffmpeg-static'

ffmpeg.setFfmpegPath(ffmpegPath)

const tmpdir = os.tmpdir()

const randomName = (ext) =>
  path.join(tmpdir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`)

async function imageToWebp(media, cropToSquare = false) {
  const type = await fileTypeFromBuffer(media)
  const tmpIn = randomName(type.ext || 'jpg')
  const tmpOut = randomName('webp')

  fs.writeFileSync(tmpIn, media)

  let filters = cropToSquare 
    ? ["crop='min(iw,ih)':'min(iw,ih)'", "scale=512:512"] 
    : ["scale=512:512:force_original_aspect_ratio=decrease", "pad=512:512:(512-iw)/2:(512-ih)/2:color=black@0"]

  await new Promise((resolve, reject) => {
    ffmpeg(tmpIn)
      .on('error', reject)
      .on('end', resolve)
      .videoFilters(filters)
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-quality', '90',
        '-preset', 'default',
        '-loop', '0'
      ])
      .toFormat('webp')
      .save(tmpOut)
  })

  const buff = fs.readFileSync(tmpOut)
  fs.unlinkSync(tmpIn)
  fs.unlinkSync(tmpOut)

  return buff
}

async function videoToWebp(media, cropToSquare = false) {
  const type = await fileTypeFromBuffer(media)
  const tmpIn = randomName(type.ext || 'mp4')
  const tmpOut = randomName('webp')

  fs.writeFileSync(tmpIn, media)

  let filters = cropToSquare
    ? ["scale=512:512:force_original_aspect_ratio=increase", "crop=512:512", "fps=12"]
    : ["scale=512:512:force_original_aspect_ratio=decrease", "pad=512:512:(512-iw)/2:(512-ih)/2:color=black@0", "fps=12"]

  await new Promise((resolve, reject) => {
    ffmpeg(tmpIn)
      .on('error', reject)
      .on('end', resolve)
      .videoFilters(filters)
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-quality', '70',
        '-loop', '0',
        '-ss', '00:00:00',
        '-t', '00:00:05',
        '-an',
        '-preset', 'default',
        '-compression_level', '4'
      ])
      .toFormat('webp')
      .save(tmpOut)
  })

  const buff = fs.readFileSync(tmpOut)
  fs.unlinkSync(tmpIn)
  fs.unlinkSync(tmpOut)

  return buff
}

async function writeExif(media, data = {}) {
  const type = await fileTypeFromBuffer(media)
  const cropToSquare = data.cropToSquare === true

  let webpMedia
  if (/webp/.test(type.mime)) {
    webpMedia = media
  } else if (/image/.test(type.mime)) {
    webpMedia = await imageToWebp(media, cropToSquare)
  } else if (/video/.test(type.mime)) {
    webpMedia = await videoToWebp(media, cropToSquare)
  } else {
    throw new Error('Format tidak didukung')
  }

  if (!webpMedia) throw new Error('Gagal konversi ke WebP')

  const tmpIn = randomName('webp')
  const tmpOut = randomName('webp')
  fs.writeFileSync(tmpIn, webpMedia)

  const img = new webp.Image()
  await img.load(tmpIn)

  const json = {
    'sticker-pack-id': data.packid || data.name || 'sticker-pack',
    'sticker-pack-name': data.packname || global.wm || 'Sticker Pack',
    'sticker-pack-publisher': data.author || global.author || 'Bot',
    'emojis': data.categories || [''],
    'premium': data.premium || 0,
    'is-ai-sticker': data.isAiSticker || 0,
    'is-avatar-sticker': data.isAvatarSticker || 0,
    'is-from-sticker-maker': data.isFromStickerMaker || 1,
    'accessibility-text': data.accessibilityText || '',
    'android-app-store-link': data.androidAppStoreLink || '',
    'ios-app-store-link': data.iosAppStoreLink || ''
  }

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00,
    0x00, 0x00
  ])

  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuff])
  exif.writeUIntLE(jsonBuff.length, 14, 4)

  img.exif = exif
  await img.save(tmpOut)

  fs.unlinkSync(tmpIn)
  const finalBuff = fs.readFileSync(tmpOut)
  fs.unlinkSync(tmpOut)
  return finalBuff
}

export {
  imageToWebp,
  videoToWebp,
  writeExif
}
