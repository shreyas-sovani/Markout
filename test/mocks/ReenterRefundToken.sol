// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {MarkoutHook} from "../../src/MarkoutHook.sol";

/// @title ReenterRefundToken — hostile ERC-20 for the claim-reentrancy test.
/// @notice On the armed transfer it reenters `MarkoutHook.claimRefund` for the
/// same trade while the hook's `refundClaimed` flag is already set. The
/// reentrancy must fail without disrupting the legitimate claim.
contract ReenterRefundToken {
    string public constant name = "Reenter Refund Token";
    string public constant symbol = "RRT";
    uint8 public constant decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    MarkoutHook private hook;
    bytes32 private armedTradeId;
    address private armedTarget;
    bool private armed;
    uint256 public reentries;
    mapping(address => bool) public rejected;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /// @notice Blacklist-style rejection: transfers TO `who` fail while set.
    function setReject(address who, bool on) external {
        rejected[who] = on;
    }

    function arm(address _hook, bytes32 tradeId, address target) external {
        hook = MarkoutHook(payable(_hook));
        armedTradeId = tradeId;
        armedTarget = target;
        armed = true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        // Reentrancy window: the hook has already marked the refund claimed.
        if (armed && msg.sender == address(hook) && to == armedTarget) {
            armed = false;
            reentries += 1;
            try hook.claimRefund(armedTradeId) {
            // If this ever succeeds the protocol has a double-spend bug;
            // the test asserts reentries == 1 and single delivery.
            }
                catch {}
        }
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "insufficient allowance");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - value;
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(!rejected[to], "transfer rejected");
        require(balanceOf[from] >= value, "insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
