// Password and Passcode (PWD) security utilities

export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText + '_uet_salt_v1');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback if crypto.subtle is unavailable (e.g. non-secure context)
    let hash = 0;
    const str = plainText + '_salt';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fb_' + Math.abs(hash).toString(16);
  }
}

export async function verifyPassword(plainText: string, expectedHash: string): Promise<boolean> {
  if (!expectedHash) return true;
  const computed = await hashPassword(plainText);
  return computed === expectedHash;
}
