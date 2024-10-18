import Web3 from "web3";
import amsABI from "./amsABI.json";
const getContractInstance = async () => {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const web3 = new Web3(window.ethereum);
    // console.log("ethnet", await web3.eth.net.getId());
    const contractAddress = "0xb0a5d320172d6e54862b64934D06b9724AE78493";
    const acc = new web3.eth.Contract(amsABI, contractAddress);
    // console.log("acc", acc.defaultChain);
    // console.log("acc", acc);
    return acc;
  } else {
    throw new Error("Ethereum object not found, install MetaMask.");
  }
};
export default getContractInstance;
// 0x973638A77E25e9Fbf0B1Ca502e073b2B7Dc7FCe1
