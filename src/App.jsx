import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [mining, setMining] = useState(false);
  const [waves, setWaves] = useState([]);
  const [waveMessage, setWaveMessage] = useState("<Your message here...>");
  const contractAddress = "0x7f1bA6e8A664139115C58F70f07374Fa978b08Fd";
  const contractAbi = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if ( !ethereum ) {
        console.log('Make sure you have metamask!');
      } else {
        console.log('We have the ethereum object: ', ethereum);

        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if ( !accounts.length ) console.log("No authorized account found!!!")
        else {
          const account = accounts[0];
          console.log('Found an authorized account: ', account);
          setCurrentAccount(account);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if ( !ethereum ) {
        alert('Get Metamask!!!');
        return;
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected: ', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch(err) {
      console.log(err);
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;
      if ( ethereum ) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractAbi, signer);
        
        const waveTxn = await wavePortalContract.wave(waveMessage, {gasLimit: 300000});
        console.log("Mining ... ", waveTxn.hash);
        setMining(true);
        await waveTxn.wait();
        setMining(false);
        console.log("Mined - ", waveTxn.hash);
        
        const waveCount = await wavePortalContract.getWaves(currentAccount);
        console.log("%d wave(s) from %s", waveCount, currentAccount);

        // await getWaves();
      }
    } catch(err) {
      console.log(err);
    }
  }

  const getWaves = async() => {
    try {
      const {ethereum} = window;
      if ( ethereum ) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractAbi, signer);
        const result = await wavePortalContract.getWaves(signer.getAddress());
        const {0: messages, 1: timestamps} = result;
        let wavesCleaned = [];
        for (let i = 0; i < messages.length; i++) {
          wavesCleaned.push({
            message: messages[i],
            timestamp: timestamps[i],
          });
        }
        setWaves(wavesCleaned);
      }
    } catch(err) {
      console.log(err);
    }
  }

  const handleMsgChange = evt => {
    evt.preventDefault();
    setWaveMessage(evt.target.value);
  };

  useEffect(() => {
    let wavePortalContract;

    checkIfWalletIsConnected();
    getWaves();

    const onNewWave = (message, timestamp) => {
      console.log("Message arrived:", message);
      setWaves(prevState => [
        ...prevState,
        {
          message,
          timestamp
        }
      ]);
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(contractAddress, contractAbi, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    }
  }, []);
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
        I am Robert and I really love this tutorial.
        Connect your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={wave} disabled={mining}>
          {mining ? "Waving..." : "Wave at Me"}
        </button>
        <input className="waveMessage" value={waveMessage} onChange={handleMsgChange}></input>
        {!currentAccount && (
            <button className="connectButton" onClick={connectWallet}>
              Connect Wallet
            </button>
        )}
        {waves.map((wave, index) => (
          <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Time: {new Date(wave.timestamp*1000).toISOString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        )}
      </div>
    </div>
  );
}
