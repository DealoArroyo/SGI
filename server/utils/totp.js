import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const generateBase32Secret = (size = 20) => {
  const random = crypto.randomBytes(size);
  let bits = "";

  for (const byte of random) {
    bits += byte.toString(2).padStart(8, "0");
  }

  let secret = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    const index = parseInt(chunk, 2);
    secret += BASE32_ALPHABET[index];
  }

  return secret;
};

const decodeBase32 = (input) => {
  const sanitized = (input || "")
    .toUpperCase()
    .replace(/=+$/g, "")
    .replace(/[^A-Z2-7]/g, "");

  let bits = "";
  for (const char of sanitized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
};

const generateTotpAt = (secret, timestampMs, step = 30, digits = 6) => {
  const secretBuffer = decodeBase32(secret);
  const counter = Math.floor(timestampMs / 1000 / step);
  const counterBuffer = Buffer.alloc(8);

  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (codeInt % 10 ** digits).toString().padStart(digits, "0");
};

export const verifyTotpCode = ({
  secret,
  code,
  step = 30,
  digits = 6,
  window = 1,
}) => {
  if (!secret || !code) return false;

  const normalizedCode = String(code).replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) return false;

  const now = Date.now();

  for (let errorWindow = -window; errorWindow <= window; errorWindow += 1) {
    const timestamp = now + errorWindow * step * 1000;
    const expected = generateTotpAt(secret, timestamp, step, digits);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalizedCode))) {
      return true;
    }
  }

  return false;
};

export const buildOtpAuthUrl = ({
  issuer,
  accountName,
  secret,
}) => {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
};
