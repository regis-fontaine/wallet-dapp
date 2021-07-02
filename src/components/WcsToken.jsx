import React, { useState, useEffect, useCallback } from 'react'
import Loader from "react-loader-spinner"
import Abi from '../contracts/wcstoken.json'
import ethContract from "web3-eth-contract"
import { info, success, danger } from "../utils/toast"
const WcsToken = ({ web3Provider, explorer }) => {
    /*
    * WCS Contract
    */
    const [tx, setTx] = useState({
        from: "",
        to: "",
        amount: 0,
        amountWei: "",
        txHash: "",
        isMined: false,
    })
    const [web3] = useState(web3Provider)
    const [contract, setContract] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [balanceRegWCS, setBalanceRegWCS] = useState("")
    const [wcsTokenName, setWcsTokenName] = useState("")
    const [wcsTokenSymbol, setWcsTokenSymbol] = useState("")

    const [input, setInput] = useState("");

    const getContract = async () => {
        ethContract.setProvider(web3)
        return await new ethContract(Abi, input)
    }

    // const getName = () => {
    //     //Get Name - Call
    //     contract.methods.name().call({}).then(res => {
    //         setWcsTokenName(res)
    //     })
    // }

    // const getSymbol = () => {
    //     //Get Symbol- Call
    //     contract.methods.symbol().call({}).then(res => {
    //         setWcsTokenSymbol(res)
    //     })
    // }

    const getBalance = () => {
        //Get Balance- Call
        contract.methods.balanceOf(web3.eth.defaultAccount).call({ from: web3.eth.defaultAccount })
            .then(res => { setBalanceRegWCS(web3.utils.fromWei(res)) })
    }
    // WCS token Contract 
    // 0xbc6f1fbED5976D11990363918A762888d722cB56
    const [validationAddress, setValidationAddress] = useState(false);
    const initContract = async () => {
        // Check if the length and the type are good
        if (input && input.length === 42 && web3.utils.isAddress(input)) {
            setValidationAddress(true)
            if (validationAddress) {
                try {
                    getContract().then((res) => {
                        setContract(res)
                        res.methods.name().call({}).then(res => {
                            setWcsTokenName(res)
                        })
                        res.methods.symbol().call({}).then(res => {
                            setWcsTokenSymbol(res)
                        })
                        res.methods.balanceOf(web3.eth.defaultAccount).call({ from: web3.eth.defaultAccount })
                            .then(res => { setBalanceRegWCS(web3.utils.fromWei(res)) })

                    })
                } catch (error) {
                    console.error(error)
                }
            }
        } else {
            if (input.length < 42) { danger("To small"); setValidationAddress(false) }
            if (input.length > 42) { danger("To big"); setValidationAddress(false) }
            if (!web3.utils.isAddress(input)) { danger("It's not a valid address"); setValidationAddress(false) }
        }

    }

    const sendWCS = useCallback(
        () => {
            tx.from = web3.eth.defaultAccount
            tx.txHash = ""
            if (web3.utils.isAddress(tx.to) && tx.amount > 0) {
                tx.amountWei = web3.utils.toWei(tx.amount)
                console.log(tx)
                try {
                    contract.methods.transfer(tx.to, tx.amountWei).send({
                        from: tx.from
                    })
                        .on('sending', () => {
                            setIsLoading(true)
                            info("Transaction send ! \n Please confirm the transaction on metamask", 3000)
                        })
                        .on('transactionHash', (hash) => {
                            setTx({ txHash: hash })
                            info("Tx Hash is here !", 8000)
                        })
                        .on('receipt', (receipt) => {
                            if (receipt.status) {
                                tx.isMined = true
                                setIsLoading(false)
                                getBalance()
                                success("Transaction has been confirmed !", 8000)
                            }
                        })
                        .on('error', console.error("🤷‍♀️ Something went wrong !", 8000))

                } catch (error) {
                    if (error.code === 4001) {
                        setIsLoading(false)
                        danger(" 🙅‍♀️ You reject the transaction !", 8000)
                    }
                }
            } else {
                if (!web3.utils.isAddress(tx.to)) danger("🤷‍♀️ Please enter a valid Address!", 8000)
                if (tx.amount === 0) danger("🤷‍♀️ Please enter a valid Amount!", 8000)
            }
        }, [contract, tx, web3]
    )



    return (
        <div className={"wcs-token-ui"}>
            <table>
                <tbody>
                    <tr>
                        <td className="label-group">
                            Balance {wcsTokenName} :{" "}
                        </td>
                        <td>
                            {balanceRegWCS} {wcsTokenSymbol}
                        </td>
                    </tr>
                    <tr>
                        <td className="label-group">
                            <label htmlFor="input-amount-eth">Address Contract :{" "}</label>
                        </td>
                        <td className={"wcs-td"}>
                            <input id="input-address-receiver" type="text" onChange={e => setInput(e.target.value)} placeholder="address" />
                            {!validationAddress && <button className="button-verify" onClick={initContract}>Verify Address</button>}
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
                <button className="button-send" onClick={sendWCS}>Send</button>

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
                    <a href={explorer + "/tx/" + tx.txHash}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <p>Show transaction: {tx.txHash}</p>
                    </a>
                }
            </div>

        </div>
    );
}

export default WcsToken;
