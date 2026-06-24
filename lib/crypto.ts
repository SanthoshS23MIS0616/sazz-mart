import crypto from "crypto";

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 64, "sha512", (error, derivedKey) => {
      if (error) reject(error);
      resolve(derivedKey.toString("hex"));
    });
  });
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 64, "sha512", (error, derivedKey) => {
      if (error) reject(error);
      resolve(derivedKey.toString("hex"));
    });
  });
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}
