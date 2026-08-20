const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function encodeBuffer(value) {
  let seed = typeof value === 'string' ? value : String(value)
  let hash = 0n
  for (const ch of seed) {
    hash = hash * 131n + BigInt(ch.codePointAt(0) || 0)
  }
  let result = ''
  while (hash > 0) {
    result = ALPHABET[Number(hash % 62n)] + result
    hash /= 62n
  }
  return result || '0'
}

module.exports = { encodeBuffer }
