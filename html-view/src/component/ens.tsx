import * as React from 'react'
import { contract } from '../eth/contract'
import { ipfs } from '../ipfs/node'
import { datastore } from '../level-datastore/datastore';
import { hexStringFull } from '../lib/str-util'
const Hash = require('ipfs-only-hash');

interface iProps {
  url: string
  load: () => void
  onClose: () => void
  contractConnect: () => void
}

interface iState {
  msg:string
  owner: string
  eth: number
  domain: string
  dist: string
  isOnwer: boolean
}

class ENS extends React.Component<iProps, iState> {

  constructor(props: iProps, state:iState) {
    super(props, state)
    this.state = {
      msg:null,
      owner: null,
      eth: null,
      domain: null,
      dist: null,
      isOnwer: false
    }
    this.upload = this.upload.bind(this)
    this.import = this.import.bind(this)
    this.save = this.save.bind(this)
  }

  async componentDidMount() {
    await this.load()
  }

  async load() {
    (document.getElementById('contractAddress') as HTMLInputElement).value = contract.contractAddress;
    (document.getElementById('endpoint') as HTMLInputElement).value = contract.endpoint;

    const eth = await contract.getBalance()
    this.setState({eth})

    const hash = await Hash.of(this.props.url)
    const domain = await contract.callMethod('domains', hash)
    if(domain.exist) {
      const owner = hexStringFull(await contract.callMethod('domainOwnerOf', hash)).toLowerCase()
      const address = hexStringFull(contract.accountAddress).toLowerCase()

      this.setState({owner})
      this.setState({dist: domain.dist})
      this.setState({domain: domain.domain})

      if(owner == address) this.setState({isOnwer: true})
    } else {
      this.setState({isOnwer: true})
    }
  }

  async import() {
    const privateKey = (document.getElementById('privateKey') as HTMLInputElement).value
    if(!privateKey || privateKey.length == 0) return

    await datastore.put('privateKey', privateKey)
    await this.props.contractConnect()

    await this.load()
  }

  async save() {
    const contractAddress = (document.getElementById('contractAddress') as HTMLInputElement).value;
    const endpoint = (document.getElementById('endpoint') as HTMLInputElement).value;

    if(contractAddress && contractAddress.length > 0) await datastore.put('contractAddress', contractAddress)
    if(endpoint && endpoint.length > 0) await datastore.put('endpoint', endpoint)

    await this.props.contractConnect()

    await this.props.load()
    await this.load()
  }

  async upload() {
    const url = this.props.url
    if(!url || url.length == 0) return

    let method = 'registor'
    if(this.state.owner && this.state.owner.length > 0) {
      method = 'updateDist'

      const owner = hexStringFull(this.state.owner).toLowerCase()
      const address = hexStringFull(contract.accountAddress).toLowerCase()
      if(owner != address) {
        this.setState({msg: 'You are not owner'})
        return
      }
    }

    const fileElm = document.getElementById("file") as HTMLInputElement
    if(fileElm.files) {
      const file = fileElm.files.item(0) as unknown as File
      const buffer = await file.arrayBuffer()
      const cid = await ipfs.add(buffer)

      const hash = await Hash.of(url)
      await contract.sendMethod(method, {waitReceipt:true}, hash, cid)

      await this.props.load()
      await this.load()

      this.setState({msg: 'Upload success.'})
    }
  }

  render() {
    return (
      <div style={{position: 'absolute',  backgroundColor:'white', width:'100%', height:'100%', backgroundPosition: 'center center', backgroundSize: 'cover'}}>
          <b>-- account --</b><br/>
          address: {contract.accountAddress}<br/>
          eth: {this.state.eth}<br/>
          <input type='text' id="privateKey" style={{width: 400}} placeholder='private key'></input><br/>
          <button onClick={() => this.import()}>import</button><br/>
          <br/>
          <b>-- setting --</b><br/>
          endpoint:<input type="text" id="endpoint" style={{width:400}} /><br/>
          contract:<input type="text" id="contractAddress" style={{width:400}}/><br/>
          <button onClick={() => this.save()}>save</button><br/>
          <br/>
          <b>-- ens --</b><br/>
          url: {this.props.url}<br/>
          domain: {this.state.domain} <br/>
          dist: {this.state.dist} <br/>
          owner: {this.state.owner}<br/>
          <br/>
          {
            this.state.isOnwer?
            <div>
              <input type="file" id="file" />
              <button onClick={this.upload}>upload</button>
              <br/>
                {this.state.msg}
            </div>
            :null
          }
          <br/>
          <button onClick={() => this.props.onClose()}>close</button>
      </div>
    )
  } 
}

export default ENS;