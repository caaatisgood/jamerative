import React, { useState, useRef } from "react";
import { Upload } from "antd";
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { NFTStorage } from 'nft.storage';
import { useContractLoader } from "../hooks";
import { Transactor } from "../helpers";
import { NFT_STORAGE_KEY } from "../constants";
import { StyledLabelText, StyledInput, StyledButton } from './CodeMinter'

async function mintNFT({contract, ownerAddress, provider, gasPrice, setStatus, image, name, description}) {

  // First we use the nft.storage client library to add the image and metadata to IPFS / Filecoin
  const client = new NFTStorage({ token: NFT_STORAGE_KEY });
  setStatus("Uploading to nft.storage...")
  const metadata = await client.store({
    name,
    description,
    image,
  });
  setStatus(`Upload complete! Minting token with metadata URI: ${metadata.url}`);

  // the returned metadata.url has the IPFS URI we want to add.
  // our smart contract already prefixes URIs with "ipfs://", so we remove it before calling the `mintToken` function
  const metadataURI = metadata.url.replace(/^ipfs:\/\//, "");

  // scaffold-eth's Transactor helper gives us a nice UI popup when a transaction is sent
  const transactor = Transactor(provider, gasPrice);
  const tx = await transactor(contract.mint(ownerAddress, metadataURI));

  setStatus("Blockchain transaction sent, waiting confirmation...");

  // Wait for the transaction to be confirmed, then get the token ID out of the emitted Transfer event.
  const receipt = await tx.wait();
  let tokenId = null;
  for (const event of receipt.events) {
    if (event.event !== 'Transfer') {
        continue
    }
    tokenId = event.args.tokenId.toString();
    break;
  }
  setStatus(`Minted token #${tokenId}`);
  return tokenId;
}

export default function GenartMinter({
  customContract,
  gasPrice,
  signer,
  provider,
  name,
}) {
  const contracts = useContractLoader(signer);
  let contract;
  if (!customContract) {
    contract = contracts ? contracts[name] : "";
  } else {
    contract = customContract;
  }

  const [file, setFile] = useState(null);
  const [nftName, setName] = useState("");
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState("");
  const [tokenId, setTokenId] = useState(null);
  const fileInputRef = useRef(null)

  // const beforeUpload = (file, fileList) => {
  //   console.log(file, fileList);
  //   setFile(file);
  //   setPreviewURL(URL.createObjectURL(file));
  //   return false;
  // }

  const onFileChange = (evt) => {
    // console.log(evt)
    console.log(fileInputRef.files)
    console.log('> fileInputRef', fileInputRef.current.files)
  }

  const mintEnabled = file != null && !!nftName;

  const startMinting = () => {
    console.log(`minting nft with name ${nftName}`);
    setMinting(true);
    signer.getAddress().then(ownerAddress => {
      mintNFT({ 
        contract, 
        provider, 
        ownerAddress, 
        gasPrice, 
        setStatus,
        name: nftName, 
        image: file, 
      }).then(newTokenId => {
        setMinting(false);
        console.log('minting complete');
        setTokenId(newTokenId);
      })
    });
  }
  
  return (
    <div style={{ margin: "auto", maxWidth: "1024px", width: "100%", textAlign: "left" }}>
      <h2 style={{ fontSize: 72, margin: 0 }}>
        Mint Your Jamerative Art🍻
      </h2>
      <p style={{ fontSize: 24, color: "#555" }}>{">"} Jam your generative art project with "the secret sauce"!</p>
      <div>
        {file === null && (
          <input
            ref={fileInputRef}
            type="file"
            webkitdirectory="true"
            mozdirectory="true"
            onChange={onFileChange}
            title="Choose directory"
          />
        )}
        <br />
        <br />
        <StyledLabelText>
          <span>
            Name of your Jamerative Art:
          </span>
          <br />
          <StyledInput onChange={e => {
            setName(e.target.value);
          }} value={nftName} />
        </StyledLabelText>
      </div>
      <br />
      <StyledButton type="primary" disabled={!mintEnabled} onClick={startMinting}>
        {minting ? <LoadingOutlined/> : "Mint!"}
      </StyledButton>{" "}
      <small>
        {status}
      </small>
    </div>
  );
}
