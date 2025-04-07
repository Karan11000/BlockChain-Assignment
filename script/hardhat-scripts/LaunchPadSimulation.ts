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
    let [admin, player1] = await ethers.getSigners();

    // deploy proxyAdmin
    let proxyAdmin = await new ProxyAdmin__factory(admin).deploy();
    await proxyAdmin.deployed();
    console.log("Proxy Admin:", proxyAdmin.address);

    console.log("========================================================================");
    console.log("=========================Deploy Launc Pad=========================");
    console.log("========================================================================");

    const launchPadToken = await new LaunchPadToken__factory(admin).deploy("LaunchPadToken", "LPT");
    await launchPadToken.deployed();
    console.log("Launch Pad impl deployed:", launchPadToken.address);


    const launchPad_impl = await new Launchpad__factory(admin).deploy();
    await launchPad_impl.deployed()
    var launchPadConstructor = abi.simpleEncode("initialize(address,address,address,address,uint256)", launchPadToken.address, usdcAddress, admin.address, uniSwapRouterAddress, 100000)
    const launchPadProxy = await new TransparentUpgradeableProxy__factory(admin).
    deploy(launchPad_impl.address, proxyAdmin.address, launchPadConstructor);
    await launchPadProxy.deployed()
    const launchPad = Launchpad__factory.connect(launchPadProxy.address, admin);
    console.log("Launch Pad Proxy Deployed :", launchPad.address)

    await launchPadToken.grantRole(launchPadToken.MINTER_ROLE(), launchPad.address);

    console.log("==================== Deployment Done ====================");

    console.log("==================== User Simulation ====================");

    await player1.sendTransaction({ to: testerAddress, value: ether(100) });
    await network.provider.request({ method: "hardhat_impersonateAccount", params: [testerAddress] });
    const testerWallet = ethers.provider.getSigner(testerAddress);

    let usdc = ERC20__factory.connect(usdcAddress, testerWallet);

    await usdc.connect(testerWallet).approve(launchPad.address, 20000000);
    console.log("Token Balance Before Buying: ", await launchPadToken.balanceOf(testerAddress));
    await launchPad.connect(testerWallet).buy(10000000);
    console.log("Token Balance After Buying: ", await launchPadToken.balanceOf(testerAddress));

    console.log("Second roung of depositing.....");

    console.log("Token Balance Before Buying: ", await launchPadToken.balanceOf(testerAddress));
    await launchPad.connect(testerWallet).buy(10000000);
    console.log("Token Balance After Buying: ", await launchPadToken.balanceOf(testerAddress));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });