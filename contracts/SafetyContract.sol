// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

contract SafetyContract is Initializable, Ownable, AccessControl {
    uint public a = 10;

    bytes32 ROLE_0 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    bytes32 ROLE_1 = 0x0000000000000000000000000000000000000000000000000000000000000001;

    constructor(uint _a) Ownable(msg.sender) {
        initialize(_a);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ROLE_0, msg.sender);
        _grantRole(ROLE_1, msg.sender);
    }

    function initialize(uint _a) public initializer {
        a = _a;
    }

    function reinitialize(uint _a, uint64 _version) public reinitializer(_version) onlyOwner {
        a = _a;
    }

    function complex(uint _a) public view onlyRole(ROLE_0) returns (uint) {
        return a + _a;
    }
}