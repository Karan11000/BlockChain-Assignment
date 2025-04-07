// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/ILaunchPadToken.sol";
import "./interfaces/IUniswapV2Router.sol";

contract Launchpad is Initializable, PausableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable, OwnableUpgradeable {
    using Math for uint256;

    address public token;
    address public usdc;
    address public platform;
    address public router;

    uint256 public reserveBalance;
    uint256 public tokensSold;
    uint256 public reserveRatio; // in ppm (e.g., 100000 = 10%)
    bool public finalized;

    uint256 public constant PUBLIC_SALE_CAP = 500_000_000 ether;
    uint256 public constant MAX_WEIGHT = 1_000_000;
    uint256 public constant CREATOR_ALLOCATION = 200_000_000 ether;
    uint256 public constant PLATFORM_ALLOCATION = 50_000_000 ether;
    uint256 public constant LIQUIDITY_ALLOCATION = 250_000_000 ether;
    uint256 public constant TOTAL_SUPPLY_CAP = 1_000_000_000 ether;

    event Purchased(address indexed buyer, uint256 usdcAmount, uint256 tokensMinted);
    event Finalized();

    error InvalidAmount();
    error LaunchPadFinalized();
    error MaxCapReached();

    function initialize(
        address _token,
        address _usdc,
        address _platform,
        address _router,
        uint256 _reserveRatio
    ) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        require(_reserveRatio > 0 && _reserveRatio <= 1000000, "Invalid CRR");

        token = _token;
        usdc = _usdc;
        platform = _platform;
        router = _router;
        reserveRatio = _reserveRatio;

        // Can set the initial price of token to usdc.
        reserveBalance = 1e6;
        tokensSold = 1 ether;
    }

    function _authorizeUpgrade(address newImpl) internal override onlyOwner {}

    function buy(uint256 usdcAmount) external whenPaused nonReentrant {
        if (finalized) revert LaunchPadFinalized();
        if (usdcAmount <= 0) revert InvalidAmount();

        uint256 tokensToMint = calculatePurchaseReturn(tokensSold, reserveBalance, reserveRatio, usdcAmount);
        if (tokensSold + tokensToMint > PUBLIC_SALE_CAP) revert MaxCapReached();

        reserveBalance += usdcAmount;
        tokensSold += tokensToMint;
        IERC20(usdc).transferFrom(msg.sender, address(this), usdcAmount);
        ILaunchPadToken(token).mint(msg.sender, tokensToMint);

        emit Purchased(msg.sender, usdcAmount, tokensToMint);
    }

    /* ============ Admin functions ============ */

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function finalize() external onlyOwner whenPaused {
        if (finalized) revert LaunchPadFinalized();
        finalized = true;

        // Distribute tokens
        ILaunchPadToken(token).mint(owner(), CREATOR_ALLOCATION);
        ILaunchPadToken(token).mint(platform, PLATFORM_ALLOCATION);
        ILaunchPadToken(token).mint(address(this), LIQUIDITY_ALLOCATION);

        // Split reserve funds
        uint256 halfReserve = reserveBalance / 2;
        IERC20(usdc).transfer(owner(), halfReserve);

        // Provide liquidity
        IERC20(usdc).approve(router, halfReserve);
        ILaunchPadToken(token).approve(router, LIQUIDITY_ALLOCATION);

        IUniswapV2Router(router).addLiquidity(
            token,
            usdc,
            LIQUIDITY_ALLOCATION,
            halfReserve,
            0,
            0,
            owner(),
            block.timestamp
        );

        emit Finalized();
    }

    function calculatePurchaseReturn(
        uint256 _supply,
        uint256 _reserveBalance,
        uint256 _reserveRatio,
        uint256 _depositAmount
    ) public pure returns (uint256) {
        require(_supply > 0 && _reserveBalance > 0, "Invalid state");
        require(_reserveRatio > 0 && _reserveRatio <= MAX_WEIGHT, "Invalid CRR");

        if (_depositAmount == 0) {
            return 0;
        }

        if (_reserveRatio == MAX_WEIGHT) {
            return (_supply * _depositAmount) / _reserveBalance;
        }

        uint256 base = (1e18 * (_reserveBalance + _depositAmount)) / _reserveBalance;
        uint256 result = pow(base, _reserveRatio);
        return (_supply * (result - 1e18)) / 1e18;
    }

    function pow(uint256 base, uint256 ppm) public pure returns (uint256) {
        require(base > 0, "Base must be > 0");

        if (ppm == 0) return 1e18;
        if (base == 1e18) return 1e18;

        uint256 lnBase = ln(base);
        uint256 expValue = (lnBase * ppm) / MAX_WEIGHT;
        return exp(expValue);
    }

    function ln(uint256 x) public pure returns (uint256 r) {
        require(x >= 1e18, "ln input too small");
        int256 k = 0;
        while (x >= 2e18) {
            x = x * 1e18 / 2e18;
            k++;
        }
        x -= 1e18;
        r = x;
        uint256 y = x;
        for (uint8 i = 2; i < 20; i++) {
            y = (y * x) / 1e18;
            uint256 z = y / i;
            if (i % 2 == 0) {
                r -= z;
            } else {
                r += z;
            }
        }
        r += uint256(k) * 693147180559945309; // ln(2) * 1e18
    }

    function exp(uint256 x) public pure returns (uint256 r) {
        r = 1e18;
        uint256 term = 1e18;
        for (uint8 i = 1; i < 20; i++) {
            unchecked {
                term = (term * x) / (1e18 * i);
            }
            r += term;
        }
    }
}
