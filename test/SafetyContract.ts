import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SafetyContract", function () {

  async function deploy() {
    const signer = await hre.ethers.getSigners();

    const SafetyContract = await hre.ethers.getContractFactory("SafetyContract");
    const safetyContract = await SafetyContract.deploy(1);

    return { safetyContract };
  }

  describe("Deployment", function () {
    it("variable 'a' check", async function () {
      const { safetyContract } = await loadFixture(deploy);

      expect(await safetyContract.a()).to.equal(1);
    });
  });

  describe('initialize', function () {
    it ('InvalidInitialization', async function () {
      const { safetyContract } = await loadFixture(deploy);

      try {
        await safetyContract.initialize(2)
        expect(true).to.equal(false);

      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("InvalidInitialization"));
      }
    });
  });

  describe('reinitialize - ownership', function () {
    it ('success', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const value = 2;

      await safetyContract.reinitialize(value, 2);

      expect(await safetyContract.a()).to.equal(value);
    });
    
    it ('low version', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const value = 2;

      try {
        await safetyContract.reinitialize(value, 0);
      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("InvalidInitialization"));
      }
    });

    it ('equal version', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const value = 2;

      try {
        await safetyContract.reinitialize(value, 1);
      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("InvalidInitialization"));
      }
    });

    it ('InvalidReinitialization', async function () {
      const signer = await hre.ethers.getSigners();
      const { safetyContract } = await loadFixture(deploy);
      const safetyContractByNoOwner = safetyContract.connect(signer[1]); // 컨트랙트 호출자 변경

      try {
        await safetyContractByNoOwner.reinitialize(2, 2);
        expect(true).to.equal(false);

      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("OwnableUnauthorizedAccount"));
      }
    });
  });



  describe('ownership', function () {
    it ('success', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const signer = await hre.ethers.getSigners();
      
      // signer[1]을 owner로 변경
      await safetyContract.transferOwnership(signer[1].address);
      // signer[1]이 msg.sender로 변경된 컨트랙트 객체
      const safetyContractByOwner = safetyContract.connect(signer[1]);
      // owner로 변경된 컨트랙트 객체로 reinitialize 호출
      await safetyContractByOwner.reinitialize(111, 2);

      expect(await safetyContract.owner()).to.equal(signer[1].address);
      expect(await safetyContract.a()).to.equal(111);
    });

    it ('InvalidOwnership - renounceOwner 호출 후', async function () {
      const { safetyContract } = await loadFixture(deploy);
      
      try {
        await safetyContract.renounceOwnership();
        await safetyContract.reinitialize(111, 2);
      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("OwnableUnauthorizedAccount"));
      }
      expect(await safetyContract.owner()).to.equal("0x0000000000000000000000000000000000000000");
    });

    it ('InvalidOwnership - owner가 아닌 EOA가 transferOwnership 호출', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const signer = await hre.ethers.getSigners();
      const safetyContractByOwner = safetyContract.connect(signer[1]);

      try {
        await safetyContractByOwner.transferOwnership(signer[2].address);
        expect(true).to.equal(false);

      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("OwnableUnauthorizedAccount"));
      }
    });
  });

  describe('access control', function () {
    const ROLE_0 = '0x0000000000000000000000000000000000000000000000000000000000000000';

    it ('success - complex call', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const a = await safetyContract.a();
      const value = 2n;
      expect(await safetyContract.complex(value)).to.equal(a + value);
    })

    it ('success - after grantRole, access', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const signer = await hre.ethers.getSigners();
      
      await safetyContract.grantRole(
        ROLE_0,
        signer[1].address
      );

      const safetyContractByOwner = safetyContract.connect(signer[1]); // 컨트랙트 호출자 변경
      
      const a = await safetyContract.a();
      const value = 2n;

      expect(await safetyContractByOwner.complex(value)).to.equal(a + value);
    })

    it ('invalid access - renounceRole ', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const signer = await hre.ethers.getSigners();
      
      await safetyContract.renounceRole(
        ROLE_0,
        safetyContract.runner?.address
      )

      try {
        const a= await safetyContract.complex(2);
        expect(true).to.equal(false);

      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("AccessControlUnauthorizedAccount"));
      }
    })

    it ('invalid access - renounceRole other EOA', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const signer = await hre.ethers.getSigners();

      const safetyContractByNoOwner = safetyContract.connect(signer[1]); // 컨트랙트 호출자 변경

      try {
        await safetyContractByNoOwner.renounceRole(
          ROLE_0,
          safetyContract.runner?.address
        )
      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("AccessControlBadConfirmation"));
      }
    })

    it('invalid access - not access role', async function () {
      const { safetyContract } = await loadFixture(deploy);
      const signer = await hre.ethers.getSigners();

      const safetyContractByNoOwner = safetyContract.connect(signer[1]); // 컨트랙트 호출자 변경

      try {
        await safetyContractByNoOwner.complex(2);
        expect(true).to.equal(false);

      } catch (error: any) {
        expect(true).to.equal(error?.message?.includes("AccessControlUnauthorizedAccount"));
      }
    })
  })
});
