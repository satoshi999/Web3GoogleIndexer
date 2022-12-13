import type { IPFS } from 'ipfs-core-types'
import { NOISE } from 'libp2p-noise'
import WS from "libp2p-websockets"
import WStar from "libp2p-webrtc-star"
import mplex from "libp2p-mplex"

export class Node {
  private ipfs:IPFS = null
  private timeout:number = null

  public async create(repo, timeout){
    this.ipfs = await require('ipfs').create({
      repo,
      libp2p: {
        modules: {
          transport: [WS, WStar],
          connEncryption: [NOISE],
          streamMuxer: [mplex]
        },
        addresses: {
          listen: [
            '/dns4/web3-pubcom-test.tk/tcp/443/wss/p2p-webrtc-star',
            '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
            '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
          ]
        }
      }
    })
    this.timeout = timeout
  }

  public async id() {
    const id = await this.ipfs.id()
    return id.id
  }

  public async add(data:any) {
    const res = await this.ipfs.add(data)
    return res.cid.toString()
  }

  private async _cat(cid:string):Promise<Uint8Array> {
    const stream = this.ipfs.cat(cid)
    let data = new Uint8Array()
    for await (const chunk of stream) {
      const merged = new Uint8Array(data.length + chunk.length);
      merged.set(data);
      merged.set(chunk, data.length);
      data = merged
    }
    return data
  }

  public cat(cid:string):Promise<Uint8Array> {
    return new Promise(async (resolve, reject) => {
      setTimeout(() => {
        reject(new Error("timeout"))
      }, this.timeout)
      resolve(await this._cat(cid))
    })
  }

  public async privKey() {
    const res:any = await this.ipfs.config.get('Identity')
    return res.PrivKey
  }
}

export const ipfs = new Node()