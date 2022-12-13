export const hexStringFull = (value: string) => {
  return (!value || typeof(value) !== 'string' || value.match(/^0x/)) ? value : '0x' + value;
}

export const hexStringShort = (value: string) => {
  return (value && typeof(value) === 'string' && value.match(/^0x/)) ? value.substr(2) : value;
}

export const padLeft = (value: string, length: number, fill?: string) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.padStart(length, fill);
}

export const hexArrayToString = (arr) => {
  let result = '';
  for (let i = 0; i < arr.length; i++) {
    const dec = arr[i];
    const hexStr = Number(dec).toString(16);
    const str = hexStr.length == 1 ? `0${hexStr}` : hexStr;
    result = result + str;
  }
  return result;
}