const hdkey = require('ethereumjs-wallet/hdkey');
const bip39 = require('bip39');
import * as ethUtil from 'ethereumjs-util';
import { hexArrayToString, hexStringShort } from './str-util'
const JAPANESE_WORDLIST = require('bip39/wordlists/japanese.json')

export const create = () => {
  const mnemonic =  createMnemonic();
  return mnemonicToAccount(mnemonic);
}

export const privateKeyToAccount = (privateKey: string) => {
  const publicKey = ethUtil.privateToPublic(Buffer.from(hexStringShort(privateKey), 'hex')).toString('hex');
  const address = ethUtil.publicToAddress(Buffer.from(hexStringShort(publicKey),'hex')).toString('hex');
  return {privateKey, publicKey, address};
}

export const mnemonicToAccount = (mnemonic: string) => {
  const seedhex = bip39.mnemonicToSeedHex(mnemonic);
  const seed = Buffer.from(seedhex,'hex');
  const walletGenerator = hdkey.fromMasterSeed(seed);
  const wallet = walletGenerator.deriveChild(0).getWallet();
  const {privateKey, publicKey, address} = walletToAccount(wallet);

  return {mnemonic, privateKey, publicKey, address};
}
const walletToAccount = (wallet) => {
  const privateKey = hexArrayToString(wallet.getPrivateKey());
  const publicKey = hexArrayToString(wallet.getPublicKey());
  const address = hexArrayToString(wallet.getAddress());

  return {privateKey, publicKey, address};

}
const createMnemonic = () => {
  let mnemonic = bip39.generateMnemonic(0, undefined, JAPANESE_WORDLIST);
  while (true) {
    const words = mnemonic.split(' ');
    const uniqueWords = words.filter((word, index) => words.indexOf(word) == index);
    if (words.length == uniqueWords.length) {
      break;
    } else {
      mnemonic = bip39.generateMnemonic(0, undefined, JAPANESE_WORDLIST);
    }
  }
  return mnemonic;
}