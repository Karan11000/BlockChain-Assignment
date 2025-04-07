// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface ILaunchPadToken {
    function mint(address to, uint256 amount) external;
    function totalSupply() external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}