import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "solidity-coverage";
import { privateKeys } from "./utils/wallet";
// import "@nomicfoundation/hardhat-foundry";


dotenv.config();

const forkingConfig = {
  url: `https://mainnet.optimism.io `,
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: { enabled: true, runs: 100 },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: { enabled: true, runs: 100 },
        },
      },
      {
        version: "0.8.15",
        settings: {
          optimizer: { enabled: true, runs: 100 },
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: { enabled: true, runs: 100 },
        },
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: { enabled: true, runs: 100 },
        },
      },
      {
        version: "0.8.21",
        settings: {
          optimizer: { enabled: true, runs: 100 },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      // goerli: ${process.env.GOERLI_ETHERSCAN_API_KEY},
      mainnet: "BHAMAE8XRJB3DQ1SUSP6S4XK4G3ZXMY6MS",
      sepolia: "BHAMAE8XRJB3DQ1SUSP6S4XK4G3ZXMY6MS",
      zircuit: "AD6CC47F8E3F66819FAE5FEE6CA983B1F8"
    },
    customChains: [
      {
        network: "zircuit",
        chainId: 48899,
        urls: {
          apiURL: "https://explorer.testnet.zircuit.com/api/contractVerifyHardhat", // Ensure this is correct
          browserURL: "https://explorer.testnet.zircuit.com"
        }
      }
    ]
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: (process.env.FORK) ? forkingConfig : undefined,
      accounts: getHardhatPrivateKeys(),
      gas: 30193413,
      blockGasLimit: 120000000,
      chainId: 1
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      timeout: 200000000,
      gas: 1186722850,
      blockGasLimit: 1186722850,
      allowUnlimitedContractSize: true
    },
    mainnet: {
      url: "https://1rpc.io/eth",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: "https://rpc-sepolia.rockx.com",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    bsclocalhost: {
      url: "http://127.0.0.1:8549",
      gas: 80000000,
      timeout: 2000000,
      blockGasLimit: 702056136595,
      gasPrice: 489979591000,
      // accounts: getHardhatPrivateKeys(),
      allowUnlimitedContractSize: true
    },
    arblocalhost: {
      url: "http://127.0.0.1:8550/",
      gas: 80000000,
      timeout: 2000000,
      blockGasLimit: 702056136595,
      gasPrice: 489979591000,
      // accounts: getHardhatPrivateKeys(),
      allowUnlimitedContractSize: true
    },
    ethlocalhost: {
      url: "https://1rpc.io/eth",
      gas: 80000000,
      timeout: 2000000,
      blockGasLimit: 702056136595,
      gasPrice: 489979591000,
      // accounts: getHardhatPrivateKeys(),
      allowUnlimitedContractSize: true
    },

    devnet:{
      url : "https://rpc.vnet.tenderly.co/devnet/bsc-tenderly/e7da4aca-a3ff-4ffa-8b96-8ccc0f0ad603",
      chainId: 56
    },

  },
};

function getHardhatPrivateKeys() {
  return privateKeys.map(key => {
    const ONE_MILLION_ETH = "1000000000000000000000000";
    return {
      privateKey: key,
      balance: ONE_MILLION_ETH,
    };
  });
}

export default config;