const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function encodeBuffer(buf, length = 7) {
  // Treat buffer as a big integer and convert to base62
  let num = BigInt('0x' + buf.toString('hex'))
  const base = BigInt(ALPHABET.length)
  let out = ''
  while (out.length < length) {
    const rem = num % base
    out = ALPHABET[Number(rem)] + out
    num = num / base
    if (num === 0n) break
  }
  // pad with random chars if too short
  while (out.length < length) {
    out = ALPHABET[Math.floor(Math.random() * ALPHABET.length)] + out
  }
  return out
}

module.exports = { encodeBuffer }
