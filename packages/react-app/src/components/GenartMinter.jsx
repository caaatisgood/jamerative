import React, { useState, useRef, useEffect } from "react";
import styled from 'styled-components'
// import { Upload } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import { create as ipfsCreate } from 'ipfs-http-client'
import { useContractLoader } from "../hooks";
import { Transactor } from "../helpers";
import { NFT_STORAGE_KEY } from "../constants";
import { StyledLabelText, StyledInput, StyledButton } from './CodeMinter'

async function mintNFT({contract, ownerAddress, provider, gasPrice, setStatus, files, name }) {
  let ipfs = ipfsCreate();
  ipfs.add(files)
  setStatus("Uploading to ipfs...")
  // const metadata = await client.store({
  //   name,
  //   description: "",
  // });
  // setStatus(`Upload complete! Minting token with metadata URI: ${metadata.url}`);

  // // the returned metadata.url has the IPFS URI we want to add.
  // // our smart contract already prefixes URIs with "ipfs://", so we remove it before calling the `mintToken` function
  // const metadataURI = metadata.url.replace(/^ipfs:\/\//, "");

  // console.log({ metadata });

  // // scaffold-eth's Transactor helper gives us a nice UI popup when a transaction is sent
  // const transactor = Transactor(provider, gasPrice);
  // const tx = await transactor(contract.mint(ownerAddress, metadataURI));

  // setStatus("Blockchain transaction sent, waiting confirmation...");

  // // Wait for the transaction to be confirmed, then get the token ID out of the emitted Transfer event.
  // const receipt = await tx.wait();
  // let tokenId = null;
  // for (const event of receipt.events) {
  //   if (event.event !== 'Transfer') {
  //       continue
  //   }
  //   tokenId = event.args.tokenId.toString();
  //   break;
  // }
  // setStatus(`Minted token #${tokenId}`);
  // return tokenId;
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

  const [files, setFiles] = useState(undefined);
  const [nftName, setName] = useState("");
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState("");
  const [tokenId, setTokenId] = useState(null);
  const fileInputRef = useRef(null)

  const onFileChange = (evt) => {
    let files = Array.from(fileInputRef.current.files).filter((file) => !file.name.startsWith("."))

    let indexHtmlFile = files.find(file => file.name === 'index.html')
    jamSourceCodeWithSauce(indexHtmlFile)
    // let jammedIndexHtmlFile = jamSourceCodeWithSauce(indexHtmlFile)

    setFiles(files)
  }

  const jamSourceCodeWithSauce = (indexHtmlFile) => {
    const reader = new FileReader()
    reader.onload = (file) => {
      console.log(file)
      console.log("reader.result", reader.result)
    }
    reader.readAsText(indexHtmlFile)
    return indexHtmlFile
  }

  const mintEnabled = (files?.length > 0) && !!nftName;

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
        files,
      }).then(newTokenId => {
        setMinting(false);
        console.log('minting complete');
        setTokenId(newTokenId);
      })
    });
  }

  console.log({ files })
  
  return (
    <div style={{ margin: "auto", maxWidth: "1024px", width: "100%", textAlign: "left" }}>
      <h2 style={{ fontSize: 72, margin: 0 }}>
        Mint Your Jamerative Art🍻
      </h2>
      <p style={{ fontSize: 24, color: "#555" }}>{">"} Jam your generative art project with "the secret sauce"!</p>
      <div style={{ display: 'flex' }}>
        <StyledUploadWrapper>
          {!files && (
            <input
              ref={fileInputRef}
              type="file"
              webkitdirectory="true"
              mozdirectory="true"
              onChange={onFileChange}
              title="Choose directory"
            />
          )}
          {files?.length > 0 && (
            <>
              <p style={{ fontSize: 18 }}>List of files:</p>
              <ul style={{ paddingLeft: 16 }}>
                {files?.map((file, idx) => {
                  return (
                    <li key={idx}>
                      <p style={{ marginBottom: 4 }}>{file.name}</p>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </StyledUploadWrapper>
        <div style={{ flex: 1 }}>
          <StyledLabelText>
            <span>
              Name of your Jamerative Art:
            </span>
            <br />
            <StyledInput onChange={e => {
              setName(e.target.value);
            }} value={nftName} />
          </StyledLabelText>
          <br />
          <br />
          <StyledButton type="primary" disabled={!mintEnabled} onClick={startMinting}>
            {minting ? <LoadingOutlined/> : "Mint!"}
          </StyledButton>{" "}
          <small>
            {status}
          </small>
        </div>
      </div>
    </div>
  );
}

const StyledUploadWrapper = styled.div`
  margin-right: 20px;
  width: 35%;
`
