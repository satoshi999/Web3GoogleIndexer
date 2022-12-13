const Web3 = require('web3');
import { ContractSendMethod } from 'web3-eth-contract';
import * as account from '../lib/account-util'
import { TransactionReceipt, TransactionConfig } from 'web3-core';
import { hexStringFull } from '../lib/str-util';
import * as Web3Utils from 'web3-utils';
const Eth = require('web3-eth');

export type SendMethodOptions = {
  gasPrice?: number;
  gasLimit?: number;
  waitReceipt?: boolean;
}

export type SendMethodReturns = {
  rawTx: TransactionConfig;
  receipt?: TransactionReceipt;
  txHash?: string;
}

export class Contract {
  private _contract;
  private _endpoint = '';
  private _web3;
  private _eth;
  private _contractAddress;
  private _abi;
  private _privateKey;
  private _accountAddress;

  public get privateKey() {
    return this._privateKey;
  }

  public get accountAddress() {
    return this._accountAddress;
  }

  public get endpoint() {
    return this._endpoint;
  }

  public get contractAddress() {
    return this._contractAddress;
  }

  public connect(privateKey:string, contractAddress: string, abi, endpoint:string) {
    this._abi = abi;
    this._contractAddress = contractAddress;
    this._endpoint = endpoint;
    let provider;
    if (endpoint.match(/^wss:/)) {
      const options = {
        reconnect: {
            auto: true,
            delay: 5000,
            maxAttempts: 5,
            onTimeout: false
        }
      };
      provider = new Web3.providers.WebsocketProvider(endpoint, options);
    } else {
      provider = new Web3.providers.HttpProvider(endpoint);
    }
    this._web3 = new Web3(provider);
    this._eth = new Eth(provider);
    this._contract = new this._web3.eth.Contract(abi, contractAddress);
    this._accountAddress = (account.privateKeyToAccount(hexStringFull(privateKey))).address;
    this._privateKey = privateKey;
  }

  public async callMethod<T = any>(methodName: string, ...params) {
    const result = await this._contract.methods[methodName](...params).call();
    return result as T;
  }

  public async sendMethod (methodName: string, _options?: SendMethodOptions, ...params) {
    const options = _options || {};
    const fx = (this._contract.methods[methodName](...params) as ContractSendMethod).encodeABI();

    const rawTx:TransactionConfig = {
      'from': this._accountAddress,
      'gasPrice': '',
      'gas': '',
      'to': this._contractAddress,
      'value': 0x00,
      'data': fx,
    };

    return new Promise<SendMethodReturns>((resolve, reject) => {
      const getNonce = (address) => this._web3.eth.getTransactionCount(address, 'pending');
      const getGasPrice = (options:SendMethodOptions) => options.gasPrice? Promise.resolve(options.gasPrice) : this._web3.eth.getGasPrice();
      const getGasLimit = (options:SendMethodOptions) => options.gasLimit? Promise.resolve(options.gasLimit) : this._web3.eth.estimateGas({data: fx, to: this._contractAddress, from: this._accountAddress});
      getNonce(this._accountAddress)
      .then(nonce => {
        rawTx.nonce = this._web3.utils.numberToHex(Number(nonce));
        return getGasPrice(options);
      })
      .then(gasPrice => {
        rawTx.gasPrice = this._web3.utils.numberToHex(Number(gasPrice));
        return getGasLimit(options);
      })
      .then(gasLimit => {
        rawTx.gas = this._web3.utils.numberToHex(Number(gasLimit));
        return this._eth.accounts.signTransaction(rawTx, hexStringFull(this._privateKey));
      })
      .then(signedData => {
        if(!options.waitReceipt) {
          this._web3.eth.sendSignedTransaction(signedData.rawTransaction, (err, txHash:string) => {
            if(err) {
              reject(err);
            } else {
              resolve({rawTx, txHash});
            }
          });
        } else {
          this._web3.eth.sendSignedTransaction(signedData.rawTransaction)
          .on('receipt', receipt => {
            resolve({rawTx, receipt});
          })
          .on('error', reject);
        }
      })
    });
  }

  public async getBalance() {
    const balance = await this._web3.eth.getBalance(this._accountAddress);
    return parseFloat(Web3Utils.fromWei(balance, 'ether'));
  }
}

export const contract = new Contract()