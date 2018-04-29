pragma solidity ^0.4.18;

import "./ERC223.sol";

contract AnotherToken is ERC223Token {
  string public name = "Another Token";
  string public symbol = "ANT";
  uint public decimals = 4;
  uint public totalSupply = 1000000000 * 10**4;

  function AnotherToken() {
    balances[msg.sender] = totalSupply;
  }
}
