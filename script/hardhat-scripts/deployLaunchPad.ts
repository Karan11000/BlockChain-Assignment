import "@nomiclabs/hardhat-ethers";
import { ethers, network } from "hardhat";
import { LaunchPadToken__factory, Launchpad__factory, ProxyAdmin__factory, TransparentUpgradeableProxy__factory, ERC20__factory } from "../../typechain-types";
import { ether } from "../../utils"
var abi = require('ethereumjs-abi')
const fs = require("fs");

let testerAddress = "0x1fD9611f009fcB8Bec0A4854FDcA0832DfdB04E3";
let usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
let uniSwapRouterAddress = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

async function main() {
    const pk = `b8aa28843a1c40e05683b9692f3cf07a51893e896896ccec0fdbfb9783afbb6b`;
    const providerUrl = `https://rpc-sepolia.rockx.com`
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const deployer = await new ethers.Wallet(pk, provider);

    // deploy proxyAdmin
    let proxyAdmin = await new ProxyAdmin__factory(deployer).deploy();
    await proxyAdmin.deployed();
    console.log("Proxy Admin:", proxyAdmin.address);

    console.log("========================================================================");
    console.log("=========================Deploy Launc Pad=========================");
    console.log("========================================================================");

    const launchPadToken = await new LaunchPadToken__factory(deployer).deploy("LaunchPadToken", "LPT");
    await launchPadToken.deployed();
    console.log("Launch Pad impl deployed:", launchPadToken.address);


    const launchPad_impl = await new Launchpad__factory(deployer).deploy();
    await launchPad_impl.deployed()
    var launchPadConstructor = abi.simpleEncode("initialize(address,address,address,address,uint256)", launchPadToken.address, usdcAddress, deployer.address, uniSwapRouterAddress, 100000)
    const launchPadProxy = await new TransparentUpgradeableProxy__factory(deployer).
    deploy(launchPad_impl.address, proxyAdmin.address, launchPadConstructor);
    await launchPadProxy.deployed()
    const launchPad = Launchpad__factory.connect(launchPadProxy.address, deployer);
    console.log("Launch Pad Proxy Deployed :", launchPad.address)

    await launchPadToken.grantRole(launchPadToken.MINTER_ROLE(), launchPad.address);

    console.log("==================== Deployment Done ====================");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });