'use client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { compile } from '@/utils/compile';
import { ethers } from 'ethers';
import { deploy } from '@/utils/deploy';
import { ColorRing } from 'react-loader-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MdContentCopy } from 'react-icons/md';
import { SiHiveBlockchain } from 'react-icons/si';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [textareaValue, setTextareaValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [byteCode, setByteCode] = useState('');
  const [error, setErrors] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  // const [deployedBytecode, setDeployedBytecode] = useState('');
  const [abi, setAbi] = useState();
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const [contractName, setContractName] = useState();
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();

  const handleCopyClick = async ({
    abi = null,
    byteCode = null,
    contractAddress = null,
  }) => {
    try {
      if (abi) {
        await navigator.clipboard.writeText(abi);
      } else if (byteCode) {
        await navigator.clipboard.writeText(byteCode);
      } else if (contractAddress) {
        await navigator.clipboard.writeText(contractAddress);
        setShowDialog(false);
      }
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };
  async function connectToMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        const signer = provider.getSigner();
        setSigner(signer);

        const network = await provider.getNetwork();
        setNetwork(network);

        const address = await signer.getAddress();
        setAddress(address);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('Metamask is not installed...');
    }
  }

  const handleDisconnect = async () => {
    try {
      window.location.reload();
    } catch (error) {
      throw new Error(error);
    }
  };

  const handleTextAreaChange = (event) => {
    setTextareaValue(event.target.value);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleCompile = async () => {
    if (textareaValue) {
      try {
        const { byteCode, contractName, abi, error } = await compile(
          textareaValue,
        );
        setByteCode(byteCode);
        setAbi(abi);
        setContractName(contractName);
        setShowDialog(true);
        setErrors(error);
      } catch (error) {
        console.log(error);
        throw new Error(error);
      }
    }
  };

  const handleDeploy = async (constructorArgs = null) => {
    try {
      if (!signer) {
        alert('Please connect the wallet first...');
      }
      if (textareaValue) {
        setLoading(true);
        const { byteCode, contractName, abi } = await compile(textareaValue);

        setByteCode(byteCode);
        setAbi(abi);
        setContractName(contractName);

        const { contractAddress } = await deploy({
          abi,
          byteCode,
          signer,
          constructorArgs,
        });

        setContractAddress(contractAddress);
        setShowDialog(true);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      throw new Error(error);
    }
  };
  return (
    <div>
      <div className="w-full flex md:justify-around justify-center">
        <div className="mt-8 font-bold text-4xl">
          <SiHiveBlockchain></SiHiveBlockchain>
        </div>
        <div className="mt-8 font-bold text-3xl text-gray-600">
          Compile and Deploy Your Solidity Code Here...
        </div>

        {address ? (
          <Dialog>
            <DialogTrigger className="mt-8 border border-gray-400 rounded-md p-2 hover:bg-gray-100">
              {address.substring(0, 7) ? address.substring(0, 7) + `...` : null}
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{network?.name}</DialogTitle>
                <DialogDescription className="flex justify-between p-2">
                  {address}{' '}
                  <MdContentCopy
                    onClick={handleCopyClick}
                    className="mt-1 hover:text-black"
                  />
                </DialogDescription>
                <Button onClick={handleDisconnect}>Logout</Button>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        ) : (
          <Button className="mt-8 mr-12" onClick={connectToMetaMask}>
            Connect
          </Button>
        )}
      </div>
      <main className="flex flex-col items-center justify-between p-12">
        <Textarea
          className="font-serif"
          onChange={handleTextAreaChange}
          placeholder="Paste your solidity code here..."
        ></Textarea>
        <div>
          <Dialog>
            <DialogTrigger
              onClick={handleCompile}
              className="mt-8 border border-gray-400 rounded-md p-2 hover:bg-gray-100"
            >
              Compile
            </DialogTrigger>
            {showDialog ? (
              <DialogContent
                handleDialogClose={() => {
                  setShowDialog(false);
                }}
              >
                <DialogHeader>
                  <DialogTitle>{contractName}</DialogTitle>
                  <DialogDescription className="flex justify-between p-2">
                    ABI
                    <MdContentCopy
                      onClick={() => {
                        handleCopyClick({ abi: JSON.stringify(abi) });
                      }}
                      className="mt-1 hover:text-black"
                    />
                  </DialogDescription>
                  <DialogDescription className="flex justify-between p-2">
                    ByteCode
                    <MdContentCopy
                      onClick={() => {
                        handleCopyClick({ byteCode });
                      }}
                      className="mt-1 hover:text-black"
                    />
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            ) : null}
          </Dialog>

          <Dialog>
            <DialogTrigger
              // onClick={handleDeploy}
              className="m-1 mt-8 border border-gray-400 rounded-md p-2 hover:bg-gray-100 hover:text-black text-white bg-black"
            >
              Deploy
            </DialogTrigger>
            {true ? (
              <DialogContent
                handleDialogClose={() => {
                  setInputValue(null);
                }}
              >
                <DialogHeader>
                  <DialogTitle>{contractName}</DialogTitle>
                  <DialogDescription className="flex justify-between p-2">
                    Constructor Arguments
                    <Input
                      onChange={handleInputChange}
                      placeholder="type each args seperated by coma..."
                    ></Input>
                  </DialogDescription>
                  <Button
                    disabled={loading}
                    onClick={async () => {
                      inputValue ? handleDeploy(inputValue) : handleDeploy();
                    }}
                  >
                    {loading ? 'Deploying...' : 'Deploy'}
                  </Button>
                </DialogHeader>
              </DialogContent>
            ) : null}
          </Dialog>
        </div>
        <div>{error[0]?.formattedMessage}</div>
      </main>
    </div>
  );
}

// const verify = async () => {
//   console.log('Verifying...');
//   try {
//     // Create a new ethers.ContractFactory instance
//     const factory = new ethers.ContractFactory(abi, byteCode, signer);
//     console.log(abi);
//     // Fetch contract metadata
//     // const contractName = await factory
//     //   .getDeployTransaction()
//     //   .then((tx) => tx.contractName);

//     // Create a new ethers.Contract instance
//     const contract = new ethers.Contract(
//       '0x66bdf83d2edd8150d8c135dd09bffefea26f1b5f', //contractAddress,
//       abi,
//       signer,
//     );

//     // Get the constructor arguments (if any)
//     // const constructorArgs = factory.interface.decodeFunctionData(
//     //   'constructor',
//     //   deployedBytecode,
//     // );
//     console.log(')00000000000000000000');
//     // Fetch verification API from Etherscan
//     const apiKey = '1MEIPUYDHAKK6W8BQPQ7JB41FJ1Q48RT2X'; // Replace this with your Etherscan API key
//     const etherscanAPI = new ethers.providers.EtherscanProvider(
//       'sepolia',
//       apiKey,
//     );

//     // Submit the contract for verification
//     // const verificationResponse = await etherscanAPI.verifyContract({
//     //   address: '0x66bdf83d2edd8150d8c135dd09bffefea26f1b5f',
//     //   constructorArguments: [],
//     //   contractBytecode: byteCode,
//     //   contractAbi: JSON.stringify(abi),
//     //   contractName: contractName,
//     //   // Other optional parameters can be included here
//     // });
//     console.log(textareaValue, contractName);

//     const response = await axios.post(
//       'https://api-sepolia.etherscan.io/api',
//       {
//         apikey: '',
//         module: 'contract',
//         action: 'verifysourcecode',
//         contractaddress: '0x66bdf83d2edd8150d8c135dd09bffefea26f1b5f',
//         sourceCode: abi,
//         contractname: contractName,
//         compilerversion: '0.8.0',
//         optimizationUsed: 1, // Convert to 1 or 0 for Etherscan API
//         runs: 500, // Adjust runs accordingly
//         constructorArguements: [2000], // Provide constructor arguments if needed
//         // Other optional parameters can be included here
//       },
//     );

//     console.log('Contract verification response:', response.data);

//     // Log the verification response
//     // console.log('Contract verification response:', verificationResponse);
//   } catch (error) {
//     console.error('Error verifying contract:', error);
//   }
// };
