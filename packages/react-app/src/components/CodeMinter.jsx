import React, { useState } from "react";
import { NFTStorage } from 'nft.storage';
import styled from 'styled-components'
import { Input, Upload, Button } from "antd";
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useContractLoader } from "../hooks";
import { Transactor } from "../helpers";
import { NFT_STORAGE_KEY } from "../constants";

const _DEBUG_DEFAULT_CODE = "window.__fancyFunc=()=>console.log('fancy func');";
const _DEBUG_DEFAULT_CODE_NAME = "__fancyFunc";

async function mintNFT({ contract, ownerAddress, provider, gasPrice, setStatus, image, name, code }) {
  const client = new NFTStorage({ token: NFT_STORAGE_KEY });
  setStatus("Uploading to nft.storage...");
  const metadata = await client.store({
    name,
    description: "",
    image,
    properties: {
      type: "CodeNFT",
      code,
    },
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

export default function CodeMinter({
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
  const [previewURL, setPreviewURL] = useState(null);
  const [nftName, setName] = useState(_DEBUG_DEFAULT_CODE_NAME);
  const [code, setCode] = useState(_DEBUG_DEFAULT_CODE);
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState("");
  const [tokenId, setTokenId] = useState(null);

  const beforeUpload = (file, fileList) => {
    console.log(file, fileList);
    setFile(file);
    setPreviewURL(URL.createObjectURL(file));
    return false;
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
        name,
        image: file,
        code,
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
        Mint Your Secret Sauce🥫
      </h2>
      <p style={{ fontSize: 24 }}>{">"} Mint your sharable code to let others to "jamerate" along!</p>
      <br />
      <div style={{ display: 'flex' }}>
        <StyledUploadWrapper>
          {file === null && (
            <Upload
              name="avatar"
              accept=".jpeg,.jpg,.png,.gif"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              beforeUpload={beforeUpload}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>
                  Choose image
                </div>
              </div>
            </Upload>
          )}
          {previewURL ? <img src={previewURL} style={{maxWidth: "800px"}}/> : <div/>}
        </StyledUploadWrapper>
        <div style={{ flex: 1 }}>
          <label>
            <span>
              Name of your Secret Sauce:
            </span>
            <br />
            <Input style={{ width: '40%' }} placeholder="Enter a name for your code" onChange={e => {
              setName(e.target.value);
            }} value={nftName} />
          </label>
          <br />
          <br />
          <label>
            <span>
              The Secret Sauce:
            </span>
            <Input.TextArea rows={6} style={{ fontFamily: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace" }} placeholder="Enter your code here" onChange={e => {
              setCode(e.target.value);
            }} value={code} />
          </label>
          <Button type="primary" disabled={!mintEnabled} onClick={startMinting}>
            {minting ? <LoadingOutlined/> : "Mint!"}
          </Button>
        </div>
      </div>
      {status}
    </div>
  );
}

const StyledUploadWrapper = styled.div`
  width: 30%;
  height: 183px;
  margin-right: 20px;
  .avatar-uploader {
    height: 100%;
  }
  .ant-upload-select-picture-card {
    width: 100%;
    height: inherit;
  }
`
