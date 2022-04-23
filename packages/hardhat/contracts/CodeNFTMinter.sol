pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CodeNFTMinter is ERC721, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Optional mapping for token URIs
    mapping (uint256 => string) private _tokenURIs;

    // Base URI
    string private _baseURIextended;


    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _baseURIextended = "ipfs://";
    }
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(base, tokenId.toString()));
    }
    

    function mint(
        address _to,
        string memory tokenURI_
    ) external onlyOwner() {
        _tokenIds.increment();
        uint256 id = _tokenIds.current();

        _safeMint(_to, id);
        _setTokenURI(id, tokenURI_);
    }
}

// //SPDX-License-Identifier: MIT
// pragma solidity ^0.8.12;

// import "hardhat/console.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";

// contract CodeNFTMinter is ERC721, Ownable {
//     using Counters for Counters.Counter;
//     Counters.Counter private _tokenIds;

//     // Base URI
//     string private _baseURIextended = "ipfs://";

//     constructor(string memory tokenName, string memory symbol) ERC721(tokenName, symbol) {
//     }

//     // function _setBaseURI(string memory baseURI_) external onlyOwner() {
//     //     _baseURIextended = baseURI_;
//     // }
    
//     function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
//         require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
//         _tokenURIs[tokenId] = _tokenURI;
//     }
    
//     function _baseURI() internal view virtual override returns (string memory) {
//         return _baseURIextended;
//     }

//     function mintToken(address owner, string memory metadataURI)
//     public
//     returns (uint256)
//     {
//         _tokenIds.increment();

//         uint256 id = _tokenIds.current();
//         _safeMint(owner, id);
//         _setTokenURI(id, metadataURI);

//         return id;
//     }
// }
