pragma solidity ^0.4.18;

import "./ERC223.sol";

contract STN is ERC223Token {
  string public name = "Old STN";
  string public symbol = "STN";
  uint public decimals = 4;
  uint public totalSupply = 2000000000;

  function STN() {
    balances[msg.sender] = totalSupply;
  }
}
