like web3 but for minimalists

> **Note**  
> **This is a temporary fork of [`ethereumjs/eth-query`](https://github.com/ethereumjs/eth-query) created by MetaMask which adds TypeScript type definitions for compatibility with our libraries.**

```js
var provider = {
  sendAsync: function (params, cb) {
    /* ... */
  },
};
var query = new EthQuery(provider);

query.getBalance(address, cb);
```
