// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title FaucetToken — demo asset for the Markout pool.
/// @notice Deliberately unsabotageable: no owner, no pause, no blacklist, no
/// fee-on-transfer, hard total-supply cap, per-address mint cap, and mints
/// directly to the PoolManager are rejected so nobody can poison pool
/// accounting through the faucet. Standard ERC-20 otherwise.
contract FaucetToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    /// @notice Maximum total amount ever mintable.
    uint256 public immutable cap;
    /// @notice Maximum cumulative amount any single address may mint.
    uint256 public immutable perUserCap;
    /// @notice The PoolManager (and by policy its hooks) may not receive
    /// direct faucet mints.
    address public immutable blockedRecipient;

    uint256 public totalMinted;
    mapping(address account => uint256) public mintedBy;

    mapping(address account => uint256) public balanceOf;
    mapping(address owner => mapping(address spender => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    error MintBlocked();
    error UserCapExceeded();
    error TotalCapExceeded();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cap,
        uint256 _perUserCap,
        address _blockedRecipient
    ) {
        name = _name;
        symbol = _symbol;
        cap = _cap;
        perUserCap = _perUserCap;
        blockedRecipient = _blockedRecipient;
    }

    function mint(address to, uint256 amount) external {
        if (to == blockedRecipient) revert MintBlocked();
        if (mintedBy[to] + amount > perUserCap) revert UserCapExceeded();
        if (totalMinted + amount > cap) revert TotalCapExceeded();
        mintedBy[to] += amount;
        totalMinted += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed < value) revert InsufficientAllowance();
        // Unlimited allowance is not decremented.
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - value;
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (balanceOf[from] < value) revert InsufficientBalance();
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
