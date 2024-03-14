import { ethers } from 'ethers';
const deploy = async ({ abi, byteCode, signer, constructorArgs = null }) => {
  try {
    let argsArray;
    let deployedContract;
    const factory = new ethers.ContractFactory(abi, byteCode, signer);

    if (constructorArgs) {
      argsArray = constructorArgs.split(',');
      deployedContract = await factory.deploy(...argsArray);
    } else {
      deployedContract = await factory.deploy();
    }
    await deployedContract.deployed();
    return { contractAddress: deployedContract.address };
  } catch (error) {
    throw new Error(error);
  }
};
export { deploy };
