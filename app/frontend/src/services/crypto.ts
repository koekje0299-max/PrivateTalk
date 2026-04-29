import { encryptFor, decryptWith, wrapOnion, unwrapLayer } from 'libsodium-wrappers';

export const encryptMessage = async (text: string, recipientPublicKey: Uint8Array): Promise<string> => {
  const encrypted = await encryptFor(text, recipientPublicKey);
  return encrypted;
};

export const decryptMessage = async (encryptedBlob: string, privateKey: Uint8Array): Promise<string> => {
  const decrypted = await decryptWith(encryptedBlob, privateKey);
  return decrypted;
};

export const wrapOnion = async (message: string, relayNodes: string[]): Promise<string> => {
  let encrypted = btoa(message);
  for (let i = relayNodes.length - 1; i >= 0; i--) {
    encrypted = btoa(encrypted + ':' + relayNodes[i]);
  }
  return encrypted;
};

export const unwrapOnionLayer = (encryptedBlob: string): { content: string; nextHop: string | null } => {
  const decoded = atob(encryptedBlob);
  const parts = decoded.split(':');
  const content = parts[0];
  const nextHop = parts.length > 1 ? parts[parts.length - 1] : null;
  return { content, nextHop };
};

export const generateKeyPair = async () => {
  const keypair = await encryptFor('test', new Uint8Array(32));
  return { publicKey: new Uint8Array(32), privateKey: new Uint8Array(32) };
};