import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import Chains from '../chains/chains.json';
import { ToastContainer, toast } from "react-toastify";

export default function Wallet() {
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

    const notify = () => {
        toast("Default Notification !");

        toast.success("Success Notification !", {
        
        });

        toast.error("Error Notification !", {
        
        });

        toast.warn("Warning Notification !", {
        
        });

        toast.info("Info Notification !", {
        
        });

        toast("Custom Style Notification with css class!", {
        
            className: 'foo-bar'
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
                    window.location.reload()
                } catch (err) {
                    console.error(err)
                }
            } else {
                setIsConnectedWeb3(false)
                alert("Install Metamask")
            }
        }, []
    )
    /**
* @function createLink()
* @description Create the link the addresse wallet and the tx
*/

    // console.log(network.chain)


    useEffect(() => {

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
                getNetwork()
                getBalance()
                window.location.reload()
            }
        })

        /**
         * @description Detect if network change and update the data
         */
        window.ethereum.on('chainChanged', (chainId) => {
            getBalance()
            getNetwork()
        })

        /**
        * @description Watch the metamask message events for updated balance at the of the transaction
        */
        window.ethereum.on('message', () => {
            if (tx.isMined) getBalance()
        })

    }, [web3, accounts, tx.isMined, network])

    useEffect(() => {
        const createLink = async () => {
            try {
                setExplorerAddress(await network.explorers[0].url)
            } catch (error) {
                // Log pour le site
                // console.log(error + "🚫")
            }
        }

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
                // Toast 
                // notify()

                // Log pour le site
            }
        }
        if (network.length !== 0) {
            createLink()
            getCurrencySymbol()
        } else {
            console.dir("🚫 Aie something wrong")
            // Toast
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
            // console.log(web3.eth.defaultAccount)
            // check if accounts[0] == to sender
            //Check if address _to is good
            if (web3.utils.isAddress(tx.to) && tx.amount.length > 0) {
                // convert amount eth to wei
                tx.amountWei = web3.utils.toWei(tx.amount)
                // console.log(tx.amount, "eth")
                // console.log(tx.amountWei, "wei")
                console.log(tx)
                try {
                    // send transaction
                    await web3.eth.sendTransaction({ from: tx.from, to: tx.to, value: tx.amountWei })
                        .on('sending', () => {
                            // Then => Start loader
                            setIsLoading(true)
                            // Then => clear input at the end
                            clearInput()
                            console.log("tx Send ! \n Please confirme the transaction on metamask")
                        })
                        .on('transactionHash', (hash) => {
                            // Then => update txHash and show
                            tx.txHash = hash
                            console.log("txHash is here: \n", hash)
                        })
                        .on('receipt', (receipt) => {
                            // When is mined start toast validation transaction
                            if (receipt.status) {
                                tx.isMined = true
                                setIsLoading(false)
                                // Toast: The transaction has been confirmed *****
                                console.log("tx has been confirmed !")
                            }
                        })
                        .on('error', console.error)

                } catch (error) {
                    console.log(error)
                    if (error.code === 4001) {
                        setIsLoading(false)
                        // Toast: You reject the transaction 
                        console.log("You reject the transaction !")
                    }
                }
            } else {
                // Toast: Pls enter a valid address or valid amount
                console.log(web3.utils.isAddress(tx.to), tx.amount.length)
            }
        },
        [web3, accounts, tx]
    )
    return (
        <>
            {
                !isConnectedWeb3
                    ?
                    <div className="container-nav">
                        <button
                            className="connect-btn"
                            onClick={connectToWeb3}>
                            Connect to web3
                        </button>
                    </div>
                    : (
                        <>
                            <div className="send-ui">
                                <h2 onClick={notify} >Wallet dApp</h2>
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
                                <button className="button-send" onClick={sendEth}>Send</button>

                                {/* If Hash Show Hash sinon hide */}
                                {
                                    (isLoading && !tx.isMined)
                                    &&
                                    <div>
                                        <a href={explorerAddress + "/tx/" + tx.txHash} rel="noreferrer" target="_blank">
                                            Loader ...
                                        </a>
                                    </div>
                                }
                                {
                                    tx.isMined && <p>Transaction Mined</p>
                                }
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

                            <ToastContainer position="top-center"
                                autoClose={2000}
                                hideProgressBar={false}
                                newestOnTop
                                closeOnClick
                                rtl={false}
                                pauseOnFocusLoss
                                draggable
                                pauseOnHover />

                        </>)

            }


        </>
    )
}

