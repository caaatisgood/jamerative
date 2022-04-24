import React, { useState, useRef, useEffect, Fragment } from "react";
import styled from 'styled-components'
// import { Upload } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import { create as ipfsCreate } from 'ipfs-http-client'
import { useContractLoader } from "../hooks";
import { Transactor } from "../helpers";
import { NFT_STORAGE_KEY } from "../constants";
import { StyledLabel, StyledInput, StyledButton } from './CodeMinter'

const CODE_NFT_CONTRACT_ADDR = "0xDA0Dab7cB2aaE6b28BF888f87904888262159c9d"

const getReadableHash = (address) => {
  let displayAddress = address.substr(0, 6);
  if (address.indexOf("0x") < 0) {
    displayAddress = address;
  } else {
    displayAddress += "..." + address.substr(-4);
  }
  return displayAddress
}

async function mintNFT({contract, ownerAddress, provider, gasPrice, setStatus, files, name }) {
  let ipfs = ipfsCreate();
  setStatus("Uploading to ipfs...")
  let result = await ipfs.addAll(files)

  console.log("result", result)
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
  const [codeNft, setCodeNft] = useState("");
  const [codeNfts, setCodeNfts] = useState(undefined)
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState("");
  const [tokenId, setTokenId] = useState(null);
  const [jammedFiles, setJammedFiles] = useState(undefined)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch(`https://testnets-api.opensea.io/api/v1/assets?offset=0&limit=20&asset_contract_address=${CODE_NFT_CONTRACT_ADDR}`)
    // fetch(`https://testnets-api.opensea.io/api/v1/assets?offset=0&limit=20&owner=0xa2E487CadD1262056DDfF55335fE864a03178f16`)
      .then(res => res.json())
      .then(({ assets }) => {
        setCodeNfts(
          assets.filter(asset => asset.description === "CodeNFT" || asset.traits.some(trait => trait.trait_type === "type" && trait.value === "Sauce")).sort((a, b) => b.tokenId > a.tokenId)
        )
      })
  }, [])

  const onChangeCodeNftSelection = (token) => (evt) => {
    if (!evt.target.checked) {
      return
    }
    setCodeNft(token);
    if (files) {
      jamSourceCodeWithSauce(undefined, token)
    }
  }

  const onFileChange = (evt) => {
    let files = Array.from(fileInputRef.current.files).filter((file) => !file.name.startsWith("."))
    setFiles(files)
    jamSourceCodeWithSauce(files)
  }

  const jamSourceCodeWithSauce = (_files = files, _codeNft = codeNft) => {
    if (!_codeNft?.traits) {
      return
    }
    let sauce = _codeNft.traits.find(trait => trait.trait_type === "code")?.value || ""
    let indexHtmlFile = _files.find(file => file.name === 'index.html')
    const reader = new FileReader()
    reader.onload = (file) => {
      let indexHtmlStr = reader.result
      let headEndTag = "</head>"
      let headEndTagIdx = indexHtmlStr.indexOf(headEndTag)
      let jammedIndexHtml =
        indexHtmlStr.substring(headEndTagIdx, 0) +
        `<script>${sauce}</script>` +
        indexHtmlStr.substring(headEndTagIdx)

      let restFiles = _files.filter(file => file.name !== 'index.html')
      console.log("jammedIndexHtml", jammedIndexHtml)
      let jammedIndexHtmlBlob = new Blob([jammedIndexHtml], { type: "text/html" })
      setJammedFiles([...restFiles, jammedIndexHtmlBlob])
    }
    reader.readAsText(indexHtmlFile)
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
        files: jammedFiles,
      }).then(newTokenId => {
        setMinting(false);
        console.log('minting complete');
        setTokenId(newTokenId);
      })
    });
  }

  console.log({ codeNfts, files, jammedFiles })
  
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
          <StyledLabel>
            <span>
              Name of your Jamerative Art:
            </span>
            <br />
            <StyledInput onChange={e => {
              setName(e.target.value);
            }} value={nftName} />
          </StyledLabel>
          <br />
          <br />
          {codeNfts && (
            <>
              {codeNfts?.map(token => {
                return (
                  <StyledLabel key={token.token_id} style={{ display: 'flex', alignItems: "center" }}>
                    <StyledInput
                      style={{ width: 'fit-content', marginRight: 8 }}
                      type="radio"
                      name="sauce"
                      onChange={onChangeCodeNftSelection(token)}
                    />
                    <span style={{ flex: 1 }}>
                      #{token.token_id} <code>{getReadableHash(token.asset_contract.address)}</code>, by <code>{getReadableHash(token.creator.address)}</code>
                    </span>
                  </StyledLabel>
                )
              })}
            </>
          )}
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
