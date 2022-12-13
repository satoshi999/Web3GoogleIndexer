import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { ipfs} from './ipfs/node'
import { getImgFileType, isText } from './lib/file-util'
import { contract } from './eth/contract'
import { datastore } from './level-datastore/datastore'
import ENS from './component/ens'
import { create } from './lib/account-util'
const abi = require('./contract/SampleENSToken.json')
const Hash = require('ipfs-only-hash');

interface iState {
  owner: string
  msg: string
  showENS: boolean
}

class Main extends React.Component<{}, iState> {
  private url

  constructor(state:iState) {
    super(state);
    this.state = {
      owner: null,
      msg:null,
      showENS: false
    }
    this.load = this.load.bind(this)
    this.onNativeMessage = this.onNativeMessage.bind(this)
  }

  async onNativeMessage(e:MessageEvent) {
    this.url = e.data

    await this.load()
  }

  async load() {
    if(!this.url || this.url.length == 0) return

    const hash = await Hash.of(this.url)
    const domain = await contract.callMethod('domains', hash)

    const div = document.getElementById('content') as HTMLDivElement
    div.innerHTML = ""

    if(domain.exist) {
      const content = await ipfs.cat(domain.dist)

      if(isText(content)) {
        div.innerHTML = new TextDecoder().decode(content)
      } else {
        const type = getImgFileType(content)
        const url = URL.createObjectURL(new Blob([content], {type: `image/${type}`}))
        const img = document.createElement('img')
        img.setAttribute('src', url)
        div.appendChild(img)
      }
    }
  }

  async contractConnect() {
    let contractAddress = await datastore.get('contractAddress')
    let privateKey = await datastore.get('privateKey')
    let endpoint = await datastore.get('endpoint')

    if(contractAddress) {
      contractAddress = new TextDecoder().decode(contractAddress)
    } else {
      contractAddress = "0x8A777A511BC2E9e77C02945dd03C909370DD8919"
    }
    if(privateKey) {
      privateKey = new TextDecoder().decode(privateKey)
    } else {
      privateKey = create().privateKey
    }
    if(endpoint) {
      endpoint = new TextDecoder().decode(endpoint)
    } else {
      endpoint = "https://goerli.infura.io/v3/6e58ea9fd61e4bc0b4ac7d0776566851"
    }

    await contract.connect(privateKey, contractAddress, abi, endpoint)

  }

  async componentDidMount() {
    window.addEventListener('message', this.onNativeMessage)
    document.addEventListener('message', this.onNativeMessage)

    await ipfs.create('web3-google-indexer', 120000)
    await datastore.open('web3-google-indexer')
    await this.contractConnect() 
  }

  render() {
    return (
      <div id="root">
        {this.state.showENS ? 
        <ENS 
          onClose={() => this.setState({showENS:false})} 
          url={this.url}
          load={this.load}
          contractConnect={this.contractConnect}
        /> : null}
        <button onClick={() => this.setState({showENS:true})}>ens</button>
        <div id="content">
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Main />,
  document.getElementById('root')
);