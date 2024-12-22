const xrpl = require("xrpl");

const client = new xrpl.Client(
  "wss://fabled-magical-shape.xrp-testnet.quiknode.pro/625f51498c89991ed5a798b56b8d37ca2984c271"
  // "wss://s2.ripple.com/"
);
// Example usage:
// Replace with your actual wallet created on the testnet faucet
const wallet = xrpl.Wallet.fromSeed("sEdTrL7t3xapY3rEn473WkpQ5DethTh");
const wallet2 = xrpl.Wallet.fromSeed("sEdTGE8RqHgdjXyQKv9dxDqKrGvutVw");
// configureAccountForNFT(wallet);

async function getTransactionsFromLedger(ledgerIndex) {
  // Connect to the XRPL network (you can use testnet or mainnet)
  // const client = new xrpl.Client("wss://clio.altnet.rippletest.net:51233/"); // Use 'wss://s.altnet.rippletest.net:51233' for testnet
  // const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233"); // Use 'wss://s.altnet.rippletest.net:51233' for testnet
  // const client = new xrpl.Client(
  //   "wss://shy-fittest-sponge.xrp-testnet.quiknode.pro/5a92aa0afd2aebaf3643f67ea439ba9fc2ba373a"
  // ); // Use 'wss://s.altnet.rippletest.net:51233' for testnet
  await client.connect();

  try {
    // Request the ledger data with transactions
    const ledger = await client.request({
      command: "ledger",
      ledger_index: ledgerIndex, // Replace with the ledger index you want
      transactions: true, // Include the transactions in the response
      expand: true, // Include the full transaction details
      owner_funds: true,
      diff: true,
    });

    console.log(`Transactions in Ledger ${ledgerIndex}:`);
    console.log(ledger.result.ledger.transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
  } finally {
    // Always disconnect when done
    await client.disconnect();
  }
}

// Replace with the desired ledger index
// const ledgerIndex = 12345111;
const ledgerIndex = 2043989;
// getTransactionsFromLedger(ledgerIndex);

async function getTransactionData(txid) {
  // const client = new xrpl.Client("wss://s1.ripple.com");
  await client.connect();

  try {
    // Get the transaction details using the txid
    const transaction = await client.request({
      command: "tx",
      transaction: txid,
    });

    console.log("Transaction :", transaction);
    return transaction;
  } catch (error) {
    console.error("Error retrieving transaction:", error);
  } finally {
    // Disconnect from the client
    client.disconnect();
  }
}

function getIssuerFromNFTokenID(nfTokenID) {
  // NFTokenID is 256 bits (64 hexadecimal characters)
  if (nfTokenID.length !== 64) {
    throw new Error("Invalid NFTokenID length");
  }

  // The issuer is located in the bits 8-28 (20 bytes starting from position 2)
  const issuerHex = nfTokenID.slice(8, 48);
  const issuerBytes = Buffer.from(issuerHex, "hex");

  // Use xrpl library to convert the issuer bytes to a classic address
  const issuerAddress = xrpl.encodeAccountID(issuerBytes);
  return issuerAddress;
}

function getTaxonFromNFTokenID(nfTokenID) {
  // NFTokenID is 256 bits (64 hexadecimal characters)
  if (nfTokenID.length !== 64) {
    throw new Error("Invalid NFTokenID length");
  }

  // The issuer is located in the bits 8-28 (20 bytes starting from position 2)
  const taxonHex = nfTokenID.slice(48, 56);
  // const issuerBytes = Buffer.from(issuerHex, "hex");

  // Use xrpl library to convert the issuer bytes to a classic address
  // const issuerAddress = xrpl.encode(issuerBytes);
  console.log("taxonHex", taxonHex);

  const taxon = parseInt(taxonHex, 16);
  const mask = 0x55555555;
  const unscrambledTaxon = taxon ^ mask;
  return unscrambledTaxon;
}

// Example NFTokenID (Replace with the actual NFTokenID you want to decode)
// const nfTokenID =
//   "00081388708483251E9600B5E82453CFF39EF1AADD3B5A8DC0C171BF052C0424";
// const issuer = getIssuerFromNFTokenID(nfTokenID);
// console.log("Issuer Account:", issuer);
// const taxon = getTaxonFromNFTokenID(nfTokenID);
// console.log("Taxon:", taxon);

async function configureAccountForNFT(wallet) {
  await client.connect();

  const transaction = {
    TransactionType: "AccountSet",
    Account: wallet.address,
    SetFlag: xrpl.AccountSetAsfFlags.asfDisallowXRP,
  };

  const signedTx = await client.submitAndWait(transaction, { wallet });
  console.log("Account configured for NFTs:", signedTx.result);
  client.disconnect();
}

async function mintNFT(wallet) {
  await client.connect();

  const transaction = {
    TransactionType: "NFTokenMint",
    Account: wallet.address,
    // Account: wallet2.address,
    URI: xrpl.convertStringToHex(
      "ipfs://bafkreigfijjsorl24pla36tyitxkmqljan4isw5bmgu3ln5ttqr2n5qnvi"
    ), // Replace with your metadata URL
    Flags: xrpl.NFTokenMintFlags.tfTransferable, // Allow NFT transfer
    TransferFee: 0, // Optional: fee for secondary sales
    NFTokenTaxon: 0, // Required; can categorize NFT types (arbitrary)
    // Issuer: wallet.address,
  };

  const signedTx = await client.submitAndWait(transaction, { wallet });
  console.log("NFT minted:", signedTx.result);
  client.disconnect();
}

async function setMiner(wallet, miner) {
  await client.connect();

  const transaction = {
    TransactionType: "AccountSet",
    Account: wallet.address,
    NFTokenMinter: miner.address,
    SetFlag: xrpl.AccountSetAsfFlags.asfAuthorizedNFTokenMinter,
  };

  const signedTx = await client.submitAndWait(transaction, { wallet });
  console.log("Transaction result:", signedTx.result);

  client.disconnect();
}

async function mintNFTByMiner(issuer, wallet) {
  await client.connect();

  const transaction = {
    TransactionType: "NFTokenMint",
    Account: wallet.address,
    URI: xrpl.convertStringToHex("https://example.com/my-nft-metadata-1"), // Replace with your metadata URL
    Flags: xrpl.NFTokenMintFlags.tfTransferable, // Allow NFT transfer
    TransferFee: 0, // Optional: fee for secondary sales
    NFTokenTaxon: 0, // Required; can categorize NFT types (arbitrary)
    Issuer: issuer.address,
  };

  const signedTx = await client.submitAndWait(transaction, { wallet });
  console.log("NFT minted:", signedTx.result);
  client.disconnect();
}

async function createSellerOffer(wallet, nftId, recipientAddress) {
  await client.connect();
  const transaction = {
    TransactionType: "NFTokenCreateOffer",
    Account: wallet.address,
    NFTokenID: nftId, // Replace with your NFT's unique ID
    Destination: recipientAddress,
    Flags: xrpl.NFTokenCreateOfferFlags.tfSellNFToken, // Offer to transfer/sell
    Amount: "0", // Set to zero for a free transfer
  };

  const signedTx = await client.submitAndWait(transaction, { wallet });
  console.log("NFT Offer Created:", signedTx.result);
  client.disconnect();
}

// createNFTokenOffer(
//   wallet,
//   "0008000024D8861E377F08A0317E4D6538C72759CABF2BFF905C630900218B6E",
//   "raazg5eSPLgGCYenLnzWizonzm7T1nvAc1"
// );

async function acceptNFTOffer(wallet, offerId, isSellOffer = true) {
  await client.connect();

  const transaction = {
    TransactionType: "NFTokenAcceptOffer",
    Account: wallet.address,
    NFTokenOfferID: offerId, // Offer ID to accept the NFT transfer
    [isSellOffer ? "NFTokenSellOffer" : "NFTokenBuyOffer"]: offerId,
  };

  const signedTx = await client.submitAndWait(transaction, { wallet });
  console.log("NFT Transfer Completed:", signedTx.result);
  client.disconnect();
}

// Recipient's wallet and the offer ID of the created NFT offer
const offerId =
  "78DCB1D746F911FE96AFC0892FC707069CFFDBBD09DA0961C7D176C0F5CC4519"; // Replace with actual offer ID

// acceptNFTOffer(wallet2, offerId);

async function getNFTTransferDetails(transactionHash) {
  // const client = new xrpl.Client("wss://s.altnet.rippletest.net/");
  await client.connect();

  const txResponse = await client.request({
    command: "tx",
    transaction: transactionHash,
  });

  const transaction = txResponse.result;
  console.log("transaction", transaction);

  const affectedNodes = transaction.meta.AffectedNodes;

  // Determine if it's a buy or sell offer
  const isBuyOffer = transaction.tx_json.NFTokenBuyOffer !== undefined;
  const isSellOffer = transaction.tx_json.NFTokenSellOffer !== undefined;

  let buyer = null;
  let seller = null;
  let nftId = null;

  for (const node of affectedNodes) {
    // Look for the offer that was accepted (should be deleted upon acceptance)
    if (
      node.DeletedNode &&
      node.DeletedNode.LedgerEntryType === "NFTokenOffer"
    ) {
      const offerDetails = node.DeletedNode.FinalFields;
      nftId = offerDetails.NFTokenID;

      // If it's a buy offer, the offer creator is the buyer; otherwise, it's the seller
      if (isBuyOffer) {
        buyer = offerDetails.Owner;
        seller = transaction.tx_json.Account;
      } else if (isSellOffer) {
        seller = offerDetails.Owner;
        buyer = transaction.tx_json.Account;
      }
      break;
    }
  }

  console.log("NFT ID:", nftId);
  console.log("Buyer (Offer Creator):", buyer);
  console.log("Seller (NFT Owner):", seller);

  client.disconnect();
}

async function burnNFT(wallet, nftId) {
  await client.connect();

  const transaction = {
    TransactionType: "NFTokenBurn",
    Account: wallet.address,
    NFTokenID: nftId, // Replace with the ID of the NFT to burn
  };

  const signedTx = await client.submitAndWait(transaction, { wallet });
  console.log("NFT Burn Transaction Result:", signedTx.result);

  client.disconnect();
}
// burnNFT(
//   wallet,
//   "0008000024D8861E377F08A0317E4D6538C72759CABF2BFFBE28050B00218B70"
// );

// getNFTTransferDetails(
//   "291873C503070FB245AC55CFCAF5C9EC0C803FCD178085378C23AA95546D9EBF"
// );

async function createBuyerOffer(wallet, nftId, ownerAddress, offerAmount) {
  await client.connect();

  const transaction = {
    TransactionType: "NFTokenCreateOffer",
    Account: wallet.address,
    NFTokenID: nftId, // The ID of the NFT you want to buy
    Amount: xrpl.xrpToDrops(offerAmount), // Offer amount in drops (1 XRP = 1,000,000 drops)
    Owner: ownerAddress, // Current owner of the NFT
    // No Flags needed for a buyer offer
  };

  const signedTx = await client.submitAndWait(transaction, { wallet });
  console.log("Buyer Offer Created:", signedTx.result);

  client.disconnect();
}

async function getNFTInfo(tokenID) {
  // Connect to the XRPL Testnet or Mainnet
  // const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233"); // Use Mainnet URL for production
  await client.connect();

  try {
    // Fetch information about the specific NFT
    const response = await client.request({
      command: "nft_info",
      nft_id: tokenID,
    });

    console.log("NFT Info:", response.result);
    return response.result;
  } catch (error) {
    console.error("Error fetching NFT info:", error);
    return null;
  } finally {
    await client.disconnect();
  }
}
// getNFTInfo("0008000024D8861E377F08A0317E4D6538C72759CABF2BFF905C630900218B6E");

// getTransactionData(
//   "0C8BF2303848100D0F214206E7E98C732533C8BECF4FA12C9B0F1621F2E0CC42"
// );

// getTransactionsFromLedger(2596514);

// setMiner(wallet, wallet2);
// mintNFTByMiner(wallet, wallet2);

mintNFT(wallet);

// burnNFT(
//   wallet,
//   "0008000024D8861E377F08A0317E4D6538C72759CABF2BFF02D9780E00218B73"
// );

// createBuyerOffer(
//   wallet2,
//   "0008000024D8861E377F08A0317E4D6538C72759CABF2BFF159F441A00218B7F",
//   wallet.address,
//   1
// );

// createSellerOffer(
//   wallet2,
//   "0008000024D8861E377F08A0317E4D6538C72759CABF2BFF159F441A00218B7F",
//   wallet.address
// );

// acceptNFTOffer(
//   wallet,
//   "72F1A36856A612DEC47D0CEF388C8037E2AB77DD69E41F640FEBA85A5AC39EAF"
//   // false
// );
