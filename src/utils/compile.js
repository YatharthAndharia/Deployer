import { errors } from 'ethers';

const compile = (contractCode) => {
  try {
    return new Promise((resolve, reject) => {
      var worker = new Worker('./dist/bundle.js');
      worker.addEventListener(
        'message',
        function (e) {
          const output = e.data.output;

          let compiledContracts = {};
          console.log(output.errors?.length > 0);
          if (output.errors?.length <= 0) {
            for (var contractName in output.contracts['contract']) {
              compiledContracts = {
                byteCode:
                  output.contracts['contract'][contractName].evm.bytecode
                    .object,
                abi: output.contracts['contract'][contractName].abi,
                contractName,
                deployedBytecode:
                  output.contracts['contract'][contractName].evm
                    .deployedBytecode.object,
              };
            }
          } else {
            compiledContracts = { error: output.errors };
          }

          resolve(compiledContracts);
        },
        false,
      );

      worker.addEventListener('error', (error) => {
        reject(error);
      });

      worker.postMessage({
        contractCode,
      });
    });
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export { compile };
