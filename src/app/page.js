/* eslint-disable @next/next/no-sync-scripts */
'use client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useRef, useState } from 'react';
import { compile } from '@/utils/compile';
import { ethers } from 'ethers';
import { deploy } from '@/utils/deploy';

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
import Head from 'next/head';
import Editor from '@monaco-editor/react';

export default function Home() {
  const [tooltipContent, setTooltipContent] = useState('');
  const [monaco, setMonaco] = useState();
  const [editor, setEditor] = useState();
  const [decorationIds, setDecorationIds] = useState([]);
  const tooltipRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [textareaValue, setTextareaValue] = useState('');
  const [inputValue, setInputValue] = useState('');

  const [byteCode, setByteCode] = useState('');
  const [errors, setErrors] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  // const [deployedBytecode, setDeployedBytecode] = useState('');
  const [abi, setAbi] = useState();
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [showContractAddress, setShowContractAddress] = useState(false);

  const [contractName, setContractName] = useState();
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const savedContent = window
      ? localStorage.getItem('editorContent')
      : undefined;
    if (savedContent) {
      setTextareaValue(savedContent);
    }
  }, []);

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
    setTextareaValue(event);
    handleCompile(event);
    window ? localStorage.setItem('editorContent', event) : undefined;
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleCompile = async (data = null) => {
    setShowDialog(false);

    if (data) {
      try {
        const { byteCode, contractName, abi, error } = await compile(data);

        setByteCode(byteCode);
        setAbi(abi);
        setContractName(contractName);

        // error ? setErrors(error) : setShowDialog(true);

        // setErrors(error);

        if (error) {
          setErrors(error);
        } else {
          setErrors(null);

          setShowDialog(true);
        }
      } catch (error) {
        setShowDialog(false);
        const errorCodeRegex = /code=([A-Z_]+)/;

        // Match the error code using the regex
        const match = error.message.match(errorCodeRegex);

        // Extract the error code if a match is found
        if (match) {
          const errorCode = match[1];
          alert(errorCode);
        } else {
          alert('We are sorry! but something went wrong!');
        }
      }
    } else if (textareaValue) {
      try {
        const { byteCode, contractName, abi, error } = await compile(
          textareaValue,
        );

        setByteCode(byteCode);
        setAbi(abi);
        setContractName(contractName);

        if (error) {
          setErrors(error);
        } else {
          setErrors(null);
          setShowDialog(true);
        }
        // error ? setErrors(error) : setShowDialog(true);

        // setErrors(error);
      } catch (error) {
        setShowDialog(false);
        const errorCodeRegex = /code=([A-Z_]+)/;

        // Match the error code using the regex
        const match = error.message.match(errorCodeRegex);

        // Extract the error code if a match is found
        if (match) {
          const errorCode = match[1];
          alert(errorCode);
        } else {
          alert('We are sorry! but something went wrong!');
        }
      }
    }
  };

  const handleDeploy = async (constructorArgs = null) => {
    try {
      if (!signer) {
        alert('Please connect the wallet first...');
      } else if (textareaValue) {
        setShowContractAddress(false);
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
        setShowContractAddress(true);
        setShowDialog(true);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      const errorCodeRegex = /code=([A-Z_]+)/;

      // Match the error code using the regex
      const match = error.message.match(errorCodeRegex);

      // Extract the error code if a match is found
      if (match) {
        const errorCode = match[1];
        alert(errorCode);
      } else {
        alert('We are sorry! but something went wrong!');
      }
    }
  };
  const handleShowConstructorInput = async () => {
    try {
      setShowDialog(false);
      const { byteCode, contractName, abi, error } = await compile(
        textareaValue,
      );

      setByteCode(byteCode);
      setAbi(abi);
      setContractName(contractName);

      if (abi) {
        const data = abi.find((item) => item.type === 'constructor');

        setShowInput(data?.inputs.length > 0);
      }
      setShowDialog(true);
    } catch (error) {
      alert('Sorry! Something went wrong!');
    }
  };

  const handleMouseHover = (e) => {
    const lineNumber = e.target.position?.lineNumber;
    if (lineNumber) {
      if (errors) {
        const { errorLines } = extractLineNumbers(errors);
        errorLines[0] == lineNumber
          ? setTooltipContent(`from solidity: ${errors[0].formattedMessage}`)
          : setTooltipContent();
      } else {
        setTooltipContent();
      }

      // Position the tooltip
      // tooltipRef.current.style.left = e.event.clientX + 'px';
      // tooltipRef.current.style.top = e.event.clientY + 'px';
      // tooltipRef.current.style.display = 'block';
    } else {
      setTooltipContent('');
      tooltipRef.current.style.display = 'none';
    }
  };

  function extractLineNumbers(errors) {
    const errorLines = [];
    let errorMessage;
    if (errors[0].formattedMessage) {
      errorMessage = errors[0].formattedMessage;

      const lineMatch = errorMessage.match(/contract:(\d+)/);
      if (lineMatch && lineMatch[1]) {
        errorLines.push(parseInt(lineMatch[1]));
      }
    }

    return { errorLines, errorMessage };
  }

  const decorateErrorLines = (monaco, editor, errors) => {
    try {
      // const errorLines = [2, 3];

      if (errors) {
        const { errorLines } = extractLineNumbers(errors);

        const decorations = errorLines.map((lineNumber) => ({
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'border-b border-red-400',
          },
        }));
        const decorationId = editor.deltaDecorations(
          decorationIds,
          decorations,
        );

        setDecorationIds(decorationId);
        editor.onMouseMove(handleMouseHover);
      } else {
        editor.removeDecorations(decorationIds);
        editor.onMouseMove(handleMouseHover);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (monaco && editor) {
      decorateErrorLines(monaco, editor, errors);
    }
  }, [monaco, errors, editor]);

  return (
    <div>
      <Head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.23.0/min/vs/loader.min.js"></script>
      </Head>
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
        <Editor
          onMount={(editor, monaco) => {
            setMonaco(monaco);
            setEditor(editor);
            // editor.onMouseMove(handleMouseHover);

            // editor.onDidChangeModelContent(() => {
            //   const decorations = decorateErrorLines(monaco);
            //   editor.deltaDecorations([], decorations);
            // });
          }}
          className="font-serif"
          theme="vs-dark"
          height="75vh"
          defaultLanguage="sol"
          defaultValue={
            globalThis.window
              ? localStorage.getItem('editorContent')
                ? localStorage.getItem('editorContent')
                : ''
              : undefined
          }
          onChange={handleTextAreaChange}
        />
        {tooltipContent ? (
          <div
            ref={tooltipRef}
            className="bg-gray-600 text-white shadow p-2 rounded w-full"
          >
            {tooltipContent}
          </div>
        ) : undefined}
        <div>
          <Dialog>
            <DialogTrigger
              onClick={() => {
                handleCompile();
              }}
              className="mt-8 border border-gray-400 rounded-md p-2 hover:bg-gray-100"
            >
              Compile
            </DialogTrigger>
            {showDialog ? (
              <DialogContent
                handleDialogClose={() => {
                  setInputValue(null);
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
            ) : undefined}
          </Dialog>

          <Dialog>
            <DialogTrigger
              onClick={handleShowConstructorInput}
              className="m-1 mt-8 border border-gray-400 rounded-md p-2 hover:bg-gray-100 hover:text-black text-white bg-black"
            >
              Deploy
            </DialogTrigger>
            {showDialog ? (
              <DialogContent
                handleDialogClose={() => {
                  setInputValue(null);
                  setShowContractAddress(false);
                }}
              >
                <DialogHeader>
                  <DialogTitle>{contractName}</DialogTitle>
                  {showInput ? (
                    <DialogDescription className="flex justify-between p-2">
                      Constructor Arguments
                      <Input
                        onChange={handleInputChange}
                        placeholder="Separate arguments by commas"
                      ></Input>
                    </DialogDescription>
                  ) : undefined}

                  <Button
                    disabled={loading}
                    onClick={async () => {
                      inputValue ? handleDeploy(inputValue) : handleDeploy();
                    }}
                  >
                    {loading ? 'Deploying...' : 'Deploy'}
                  </Button>
                  {showContractAddress ? (
                    <div className="flex">
                      Contract deployed to {contractAddress}
                      <MdContentCopy
                        className="text-2xl mt-6 hover:text-gray-600"
                        onClick={() => {
                          handleCopyClick({ contractAddress });
                        }}
                      ></MdContentCopy>
                    </div>
                  ) : undefined}
                </DialogHeader>
              </DialogContent>
            ) : null}
          </Dialog>
        </div>
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
