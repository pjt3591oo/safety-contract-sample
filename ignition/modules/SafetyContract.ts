import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ONE_GWEI: bigint = 0n;

const SafetyModule = buildModule("SafetyModule", (m) => {
  const a = 10;
  const variableA = m.getParameter("initialize value: a", a);
  const amount = m.getParameter("amount", ONE_GWEI);

  const safetyContract = m.contract("SafetyContract", [variableA], {
    value: amount,
  });

  return { safetyContract };
});

export default SafetyModule;
