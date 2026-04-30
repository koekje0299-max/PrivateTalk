// Client-side crypto utilities for onion encryption
// Note: In production, use libsodium-wrappers properly installed

export const wrapOnion = async (message: string, relayNodes: string[]): Promise<string> => {
  // Simple demo encryption - in production use libsodium-wrappers properly
  let encrypted = btoa(message);
  for (let i = relayNodes.length - 1; i >= 0; i--) {
    encrypted = btoa(encrypted + ':' + relayNodes[i]);
  }
  return encrypted;
};

export const unwrapOnionLayer = (encryptedBlob: string): { content: string; nextHop: string | null } => {
  try {
    const decoded = atob(encryptedBlob);
    const parts = decoded.split(':');
    const content = parts.slice(0, -1).join(':');
    const nextHop = parts[parts.length - 1] || null;
    return { content, nextHop };
  } catch {
    return { content: encryptedBlob, nextHop: null };
  }
};

export const generateKeyPair = () => {
  const publicKey = new Uint8Array(32);
  const privateKey = new Uint8Array(32);
  crypto.getRandomValues(publicKey);
  crypto.getRandomValues(privateKey);
  return { publicKey, privateKey };
};