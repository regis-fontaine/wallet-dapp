// import logo from './logo.svg';
import './App.css';
import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import Chains from './chains/chains.json';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.min.css';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";


function App() {

  const [isLoading, setIsLoading] = useState(false)
  const [isConnectedWeb3, setIsConnectedWeb3] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [balance, setBalance] = useState(0)
  const [network, setNetwork] = useState({})
  const [web3] = useState(new Web3(Web3.givenProvider || "ws://localhost:8545"))
  const [tx, setTx] = useState({
    from: "",
    to: "",
    amount: 0,
    amountWei: "",
    txHash: "",
    isMined: false,
  })

  const [currency, setCurrency] = useState({
    name: "",
    symbol: ""
  })
  const [explorerAddress, setExplorerAddress] = useState("")
  // Toast
  const success = (data) => {
    toast.success(data, {});
  }

  const info = (data, time) => {
    toast.info(data, {
      autoClose: time
    });
  }

  const danger = (data, time) => {
    toast.error(data, {
      autoClose: time
    });
  }

  /**
   * @function connectToWeb3() 
   * @description Make the first connection with the wallet
  */
  const connectToWeb3 = useCallback(
    async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' })
          setIsConnectedWeb3(true)
          // window.location.reload()
          success("Connected to wallet !")
        } catch (err) {
          danger("Ouch something went wrong !", 8000)
          // console.error(err)
        }
      } else {
        setIsConnectedWeb3(false)
        danger("Please install Metamask !", 8000)
      }
    }, []
  )


  useEffect(() => {
    const connectBtn = document.getElementById("connect-wallet")
    if (connectBtn) connectBtn.addEventListener('click', function () {
      getAccounts()
      getBalance()
      getNetwork()
    });


    /**
     * @function getAccounts() 
     * @description Get the main account connected in Metamask
    */
    const getAccounts = async () => setAccounts(await web3.eth.getAccounts())

    web3.eth.defaultAccount = accounts[0]

    /**
     * @function getBalance()
     * @description Get the balance of the connected address and convert the wei value to ether value
     */
    const getBalance = async () => {
      const toEth = web3.utils.fromWei(await web3.eth.getBalance(web3.eth.defaultAccount))
      setBalance(toEth)
    }

    if (accounts.length === 0) getAccounts()
    if (accounts.length > 0) getBalance()



    /**
      * @function getNetwork()
      * @description Get the current network     
      * 
    */
    const getNetwork = async () => {
      //ChainId is the id of the network

      // DEPRECATED 
      let currentChainId = await web3.eth.getChainId()
      // let currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
      for (let indexChains = 0; indexChains < Chains.length; indexChains++) {
        // Compare the network with the Chao
        if (currentChainId === Chains[indexChains].networkId) {
          // Load the json with all network
          setNetwork({ ...Chains[indexChains] })
          // and create the link to ethercan with the good network
          break;
        }
      }
    }

    /**
     * EVENTS
     */

    /**
    * @description Detect if metamask wallet is connected then Get the network by the chainId
    */
    window.ethereum.on('connect', () => {
      if (window.ethereum.isConnected()) {
        setIsConnectedWeb3(true)
        getNetwork()
      }
    })

    /**
     * @description Detect if account changed on Metamask, and the data (network accounts and balance)
    */
    window.ethereum.on('accountsChanged', (accounts) => {
      // Handle the new accounts, or lack thereof.
      // "accounts" will always be an array, but it can be empty.
      if (web3.eth.defaultAccount !== accounts[0]) {
        web3.eth.defaultAccount = accounts[0];
        getAccounts()
        getNetwork()
        getBalance()
        // too many repeat

      }
      // info("You have changed your account !", 3000)
    })

    /**
     * @description Detect if network change and update the data
     */
    window.ethereum.on('chainChanged', (chainId) => {
      getBalance()
      getNetwork()
      // to many repeat
      // info("You have changed network", 3000)
    })

    /**
    * @description Watch the metamask message events for updated balance at the of the transaction
    */
    window.ethereum.on('message', () => {
      if (tx.isMined) getBalance()

    })

  }, [web3, accounts, tx.isMined, network])

  useEffect(() => {
    /**
    * @function createLink()
    * @description Create the link the addresse wallet and the tx
    */
    const createLink = async () => {
      try {
        setExplorerAddress(await network.explorers[0].url)
      } catch (error) {
        // danger("🙅‍♀️ We can't find an explorer for this network !", 1000)
      }
    }
    /**
    * @function getCurrencySymbol()
    * @description Load the symbol currency
    */
    const getCurrencySymbol = async () => {
      try {
        setCurrency({
          name: await network.nativeCurrency.name,
          symbol: await network.nativeCurrency.symbol
        })
      } catch (error) {
        setCurrency({
          name: "",
          symbol: ""
        })
        // danger("🙅‍♀️ We don't have this currency !", 1000)
      }
    }

    if (network.length !== 0) {
      createLink()
      getCurrencySymbol()
    }

  }, [network])


  /**
   * @function clearInput()
   * @description Clear input
   */
  const clearInput = () => {
    // let inputAmountEth = 
    // let inputAddressReceiver = 
    document.getElementById("input-amount-eth").value = 0
    document.getElementById("input-address-receiver").value = ""
  }

  /**
   * @function sendEth()
   * @description Send ETH
   */
  const sendEth = useCallback(
    async () => {
      tx.from = accounts[0]
      tx.txHash = ""
      // console.log(tx.amount)
      if (web3.utils.isAddress(tx.to) && tx.amount > 0) {
        tx.amountWei = web3.utils.toWei(tx.amount)
        console.log(tx)
        try {
          // send transaction
          await web3.eth.sendTransaction({ from: tx.from, to: tx.to, value: tx.amountWei })
            .on('sending', () => {
              // Then => Start loader
              setIsLoading(true)
              // Then => clear input at the end
              info("Transaction send ! \n Please confirm the transaction on metamask", 3000)
            })
            .on('transactionHash', (hash) => {
              // Then => update txHash and show
              setTx({txHash:hash}) 
              info("Tx Hash is here !", 8000)
            })
            .on('receipt', (receipt) => {
              // When is mined start toast validation transaction
              if (receipt.status) {
                tx.isMined = true
                // Stop Loading
                setIsLoading(false)
                clearInput()
                info("Transaction has been confirmed !", 8000)
              }
            })
            // .on('error', danger("🤷‍♀️ Something went wrong !", 8000))

        } catch (error) {
          // console.log(error)
          if (error.code === 4001) {
            setIsLoading(false)
            danger(" 🙅‍♀️ You reject the transaction !", 8000)
          }
        }
      } else {
        if (!web3.utils.isAddress(tx.to)) danger("🤷‍♀️ Please enter a valid Address!", 8000)
        if (tx.amount === 0) danger("🤷‍♀️ Please enter a valid Amount!", 8000)
      }
    },
    [web3, accounts, tx]
  )

  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <ToastContainer position="bottom-center"
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* onClick={error}  */}
      <main className="container">
        <>
          {
            !isConnectedWeb3
              ?
              <div className="container-nav">
                <button id="connect-wallet"
                  className="connect-btn"
                  onClick={connectToWeb3}>
                  Connect to web3
                </button>
              </div>
              : (
                <>
                  <div className="send-ui">
                    <h2>Wallet dApp</h2>
                    <p className="send-wallet-amount"> <span className="send-current-balance"></span></p>
                    <table>
                      <tbody>
                        <tr>
                          <td className="label-group">
                            Balance {network.shortName} :{" "}
                          </td>
                          <td>
                            {balance} {currency.symbol}
                          </td>
                        </tr>
                        <tr>
                          <td className="label-group">
                            <label htmlFor="input-amount-eth">Address :{" "}</label>
                          </td>
                          <td>
                            <input id="input-address-receiver" type="text" onChange={e => tx.to = e.target.value} placeholder="address" />
                          </td>
                        </tr>
                        <tr>
                          <td className="label-group">
                            <label htmlFor="input-address-receiver">Amount :{" "}</label>
                          </td>
                          <td>
                            <input id="input-amount-eth" type="number" step="0.1" onChange={e => tx.amount = e.target.value} placeholder="Amount" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="group-send-btn">
                      <button className="button-send" onClick={sendEth}>Send</button>
                      {/* If Hash Show Hash sinon hide */}
                      {
                        (isLoading && !tx.isMined)
                        &&
                        <div>
                          <Loader
                            type="ThreeDots"
                            color="#00BFFF"
                            height={50}
                            width={50}
                          />
                        </div>
                      }
                      {
                        (tx.txHash.length > 0)
                        &&
                        <a href={explorerAddress + "/tx/" + tx.txHash}
                        target="_blank"
                        rel="noreferrer"
                        >
                        <p>Show transaction: {tx.txHash}</p>
                        </a>
                      }
                    </div>
                  </div>

                  <div className="network-ui">
                    <div className="network-content">
                      <p>🕸️ {network.name}</p>
                    </div>
                  </div>

                  <div className="wallet-ui">
                    <p className="address-style truncat-text">
                      {
                        explorerAddress &&
                        (
                          <a href={explorerAddress + "/address/" + accounts[0]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            ↗️{" "}
                          </a>)
                      }
                      {accounts[0]}
                    </p>
                  </div>



                </>)

          }


        </>

      </main>
    </div>
  );
}

export default App;
