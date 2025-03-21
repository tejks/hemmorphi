export const useShortPublicKey = (publickey: string) => {
  return `${publickey.slice(0, 4)}...${publickey.slice(-4)}`;
};
