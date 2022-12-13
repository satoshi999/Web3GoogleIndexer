
const FILE_TYPES = [
  {meta:'ffd8', format:'hex', type:'JPG'},
  {meta:'PNG', format:'str', type:'PNG'},
  {meta:'GIF', format:'str', type:'GIF'},
  {meta:'BM', format:'str', type:'BMP'}
]

// (from: https://x.gd/L9O4Y)
export const isText = (array:Uint8Array) => {
  const textChars = [7, 8, 9, 10, 12, 13, 27]
  for(let i = 32; i <= 255; i++) {
    textChars.push(i)
  }
  return array.every((e:number) => textChars.includes(e))
}

// (from: https://kinsentansa.blogspot.com/2013/04/javascript.html)
export const getImgFileType = (array:Uint8Array) => {
  let headerStr = ""
  let headerHex = ""
  for (var i = 0; i < 10; i++) {
    headerHex += array[i].toString(16)
    headerStr += String.fromCharCode(array[i])
  }
  let type = ""
  FILE_TYPES.forEach(t => {
    const header = t.format == 'hex'? headerHex: headerStr
    if(header.includes(t.meta)) {
      type = t.type
      return
    }
  })

  return type
}