## **Overview**

The Reactive Network is an EVM-compatible execution layer that allows developers to create dApps using reactive contracts. These contracts differ from traditional smart contracts by using inversion-of-control for the transaction lifecycle, driven by data flows across blockchains rather than user input.

Reactive contracts receive event logs from various chains, executing Solidity logic based on these events instead of user transactions. They can independently determine the need to transmit data to destination chains, enabling conditional state changes. The Reactive Network offers fast and cost-effective computation through a proprietary parallelized EVM implementation.

## **Step 1 — Reactive Basics**

[Origins & Destinations →](https://dev.reactive.network/origins-and-destinations) Check on Reactive's origins and destinations, along with their Callback Proxy addresses.

[Hyperlane →](https://dev.reactive.network/hyperlane) Explore an alternative transport system for callbacks like Hyperlane.

[Reactive Contracts →](https://dev.reactive.network/reactive-contracts) Understand the core concept of reactive contracts.

[ReactVM →](https://dev.reactive.network/reactvm) Learn about ReactVM and its purpose.

[Economy →](https://dev.reactive.network/economy) Explore the Reactive Network's economy and callback payment mechanism.

## **Step 2 — Reactive Essentials**

[Reactive Mainnet & Lasna Testnet →](https://dev.reactive.network/reactive-mainnet) Connect to Reactive Mainnet or Lasna Testnet.

[Reactive Library →](https://dev.reactive.network/reactive-library) Implement abstract contracts and interfaces in your project.

[Events & Callbacks →](https://dev.reactive.network/events-&-callbacks#callbacks-to-destination-chains) Read up on how to work with events and callbacks in reactive contracts.

[Subscriptions →](https://dev.reactive.network/subscriptions) Set up and manage subscriptions.

[RNK RPC Methods →](https://dev.reactive.network/rnk-rpc-methods) Key RPC methods for the Reactive Network's Geth version.

## **Step 3 — Reactive Building**

[Reactive Demos →](https://dev.reactive.network/demos) Hands-on demonstrations for the Reactive Network.

[Reactive Demos on GitHub →](https://github.com/Reactive-Network/reactive-smart-contract-demos) Clone the GitHub project and start building.

## **Extra**

[Reactscan →](https://dev.reactive.network/reactscan) Learn to navigate the Reactive block explorer.

[Reactive Education →](https://dev.reactive.network/education/introduction) Begin a Reactive Tech education course.

[FAQ →](https://dev.reactive.network/faq) Find answers to common questions.

[Debugging →](https://dev.reactive.network/debugging/) Debug errors and issues related to Reactive and beyond.

[Contacts →](https://dev.reactive.network/contacts/) Reach out via socials for technical or trading inquiries.

## **Overview**

The Reactive Network reads event streams and enables transactions across different ecosystems. An Origin acts as an event log provider, delivering events to reactive contracts within the Reactive Network. A Destination is the ecosystem where the actual state transition (transaction) takes place.

Origins and destinations don't have to be the same. Reactive contracts can be configured to work with multiple origins, and the system allows for multiple destinations, enabling conditional selection of which destination ecosystem will be used.

## **Callback Proxy Address**

The Callback Proxy address ensures the validity of a callback transaction by enforcing two key conditions. First, it checks that the callback is genuinely initiated by the Reactive Network by verifying that the sender address matches the Callback Proxy address. Then, it confirms the legitimacy of the callback’s origin by checking the RVM ID embedded in the transaction payload, which should correspond to the intended reactive contract.

**Hyperlane**

Some networks are currently unable to act as destination chains because the callback proxy contract has not yet been deployed on them. In such cases, it is recommended to use [Hyperlane](https://dev.reactive.network/hyperlane) as the cross-chain message relayer.

## **Mainnet Chains**

**Origin/Destination**

Origin is the chain where events originate and are read from. Destination is the chain where callbacks are delivered in response to those events. Mainnets and testnets must not be mixed. If origin is a mainnet, destination must also be a mainnet.

| Chain | Origin | Destination | Chain ID | Callback Proxy Address | Recommended RPC URL |
| :---: | :---: | :---: | :---: | :---: | :---: |
| [Abstract](https://abscan.org/) | ✅ | ✅ | 2741 | 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4 | [Find on Chainlist](https://chainlist.org/chain/2741) |
| [Arbitrum One](https://www.arbiscan.io/) | ✅ | ✅ | 42161 | 0x4730c58FDA9d78f60c987039aEaB7d261aAd942E | [Find on Chainlist](https://chainlist.org/chain/42161) |
| [Avalanche C-Chain](https://avascan.info/) | ✅ | ✅ | 43114 | 0x934Ea75496562D4e83E80865c33dbA600644fCDa | [Find on Chainlist](https://chainlist.org/chain/43114) |
| [Base Chain](https://basescan.org/) | ✅ | ✅ | 8453 | 0x0D3E76De6bC44309083cAAFdB49A088B8a250947 | [Find on Chainlist](https://chainlist.org/chain/8453) |
| [Binance Smart Chain](https://bscscan.com/) | ✅ | ✅ | 56 | 0xdb81A196A0dF9Ef974C9430495a09B6d535fAc48 | [Find on Chainlist](https://chainlist.org/chain/56) |
| [Ethereum](https://etherscan.io/) | ✅ | ✅ | 1 | 0x1D5267C1bb7D8bA68964dDF3990601BDB7902D76 | [Find on Chainlist](https://chainlist.org/chain/1) |
| [HyperEVM](https://hyperevmscan.io/) | ✅ | ✅ | 999 | 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4 | [Find on Chainlist](https://chainlist.org/chain/999) |
| [Linea](https://lineascan.build/) | ✅ | ✅ | 59144 | 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4 | [Find on Chainlist](https://chainlist.org/chain/59144) |
| [Plasma](https://plasmascan.to/) | ✅ | ✅ | 9745 | 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4 | [Find on Chainlist](https://chainlist.org/chain/9745) |
| [Reactive Mainnet](https://reactscan.net/) | ✅ | ✅ | 1597 | 0x0000000000000000000000000000000000fffFfF | https://mainnet-rpc.rnk.dev/ |
| [Sonic](https://sonicscan.org/) | ✅ | ✅ | 146 | 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4 | [Find on Chainlist](https://chainlist.org/chain/146) |
| [Unichain](https://uniscan.xyz/) | ✅ | ✅ | 130 | 0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4 | [Find on Chainlist](https://chainlist.org/chain/130) |

## **Testnet Chains**

**Origin/Destination**

Origin is the chain where events originate and are read from. Destination is the chain where callbacks are delivered in response to those events. Mainnets and testnets must not be mixed. If origin is a testnet, destination must also be a testnet.

| Chain | Origin | Destination | Chain ID | Callback Proxy Address | Recommended RPC URL |
| :---: | :---: | :---: | :---: | :---: | :---: |
| [Avalanche Fuji](https://43113.testnet.routescan.io/) | ✅ | ➖ | 43113 | ➖ | [Find on Chainlist](https://chainlist.org/chain/43113) |
| [Base Sepolia](https://sepolia.basescan.org/) | ✅ | ➖ | 84532 | ➖ | [Find on Chainlist](https://chainlist.org/chain/84532) |
| [Binance Smart Chain](https://testnet.bscscan.com/) | ✅ | ➖ | 97 | ➖ | [Find on Chainlist](https://chainlist.org/chain/97) |
| [Ethereum Sepolia](https://sepolia.etherscan.io/) | ✅ | ✅ | 11155111 | 0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA | [Find on Chainlist](https://chainlist.org/chain/11155111) |
| [Reactive Lasna](https://lasna.reactscan.net/) | ✅ | ✅ | 5318007 | 0x0000000000000000000000000000000000fffFfF | https://lasna-rpc.rnk.dev/ |
| [Polygon Amoy](https://www.oklink.com/amoy) | ✅ | ➖ | 80002 | ➖ | [Find on Chainlist](https://chainlist.org/chain/80002) |

## **Overview**

An alternative to Reactive transport can be Hyperlane Mailboxes. Hyperlane is a modular interoperability protocol for cross-chain messaging. Its core component, the Mailbox contract, is deployed on each supported blockchain. The Mailbox acts as both the entry and exit point for cross-chain messages, allowing smart contracts to transmit and receive data across networks.

## **Hyperlane/Reactive Transport Comparison**

| Category | Hyperlane | Reactive |
| :---: | :---: | :---: |
| **Pros** | ✅ Decentralized and highly secure | 🚀 Direct execution without relayers → faster and cheaper |
|  | 🌐 Broad chain and dApp compatibility | 🔁 Deterministic finality with minimal latency |
|  | 💸 Entire flow can be funded in REACT | ⚙️ Supports arbitrary function calls — \`no handle()\` constraint |
|  |  | 💸 Cost-efficient, fees only cover raw gas on both ends |
| **Cons** | ⚠️ Relayer-dependent, operational and liveness risks | 🧱 Smaller but growing ecosystem |
|  | 🐢 Slower due to multi-step message relay and network latency | ⚠️ Higher trust assumptions due to controlled execution environment |
|  | 🔒 Requires \`handle()\` interface on the destination contract | 💰 Gas must be paid in REACT on Reactive Network and the native token on destination for full execution |
|  | 💰 Higher cost due to relayer fee overhead |  |

## **Hyperlane Mailboxes**

**Hyperlane Demo**

See our [Hyperlane Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/hyperlane) to understand how to deploy contracts and send messages with Hyperlane mailboxes.

| Chain | Origin | Destination | Chain ID | Mailbox Address | Recommended RPC URL |
| :---: | :---: | :---: | :---: | :---: | :---: |
| [Ethereum Mainnet](https://etherscan.io/) | ✅ | ✅ | 1 | 0xc005dc82818d67AF737725bD4bf75435d065D239 | [Find on Chainlist](https://chainlist.org/chain/1) |
| [Binance Smart Chain](https://bscscan.com/) | ✅ | ✅ | 56 | 0x2971b9Aec44bE4eb673DF1B88cDB57b96eefe8a4 | [Find on Chainlist](https://chainlist.org/chain/56) |
| [Avalanche C-Chain](https://avascan.info/) | ✅ | ✅ | 43114 | 0xFf06aFcaABaDDd1fb08371f9ccA15D73D51FeBD6 | [Find on Chainlist](https://chainlist.org/chain/43114) |
| [Base Chain](https://basescan.org/) | ✅ | ✅ | 8453 | 0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D | [Find on Chainlist](https://chainlist.org/chain/8453) |
| [Sonic Mainnet](https://sonicscan.org/) | ✅ | ✅ | 146 | 0x3a464f746D23Ab22155710f44dB16dcA53e0775E | [Find on Chainlist](https://chainlist.org/chain/146) |
| [Reactive Mainnet](https://reactscan.net/) | ✅ | ✅ | 1597 | 0x3a464f746D23Ab22155710f44dB16dcA53e0775E | https://mainnet-rpc.rnk.dev/ |

## **Overview**

Reactive Contracts (RCs) operate on a standard Ethereum Virtual Machine (EVM) and can be written in any EVM-compatible language, with Application Binary Interfaces (ABIs) particularly customized for Solidity. Their unique capabilities stem from Reactive nodes and a specialized pre-deployed system contract.

## **Key Features**

Reactive Contracts monitor blockchains for specific events and respond automatically, unlike traditional contracts that rely on EOAs to trigger actions. This reactivity and their use of Inversion of Control (IoC) — where contracts decide when to act — set them apart.

RCs define which blockchains, contracts, and events to watch. When a relevant event occurs, they execute logic, update state, and perform trustless transactions within the Reactive Network.

### **Deployment**

RCs deploy to both the main Reactive Network and a private [ReactVM](https://dev.reactive.network/reactvm). The main copy interacts with EOAs and manages subscriptions via the system contract. The ReactVM copy handles event processing but is not accessible to EOAs.

### **State and Separation**

The two copies are isolated and don’t share state. Since they use the same bytecode, use constructor flags or checks to distinguish the environment. You can detect if a contract is on ReactVM by calling the system contract — calls will revert outside ReactVMs. See [examples](https://dev.reactive.network/demos) for details.

### **ReactVM Limitations**

In [ReactVM](https://dev.reactive.network/reactvm), RCs can’t access external systems directly. They receive logs from the Reactive Network and can call destination chain contracts but nothing else.

## **Contract Verification**

Contracts can be verified either after or during deployment with the Sourcify endpoint. Sourcify is a decentralized verification service that stores and verifies source code for smart contracts. It allows anyone to match deployed bytecode with human-readable source code, making smart contracts auditable and transparent.

**Reactive Sourcify Endpoint**: [https://sourcify.rnk.dev/](https://sourcify.rnk.dev/)

### **Verify After Deployment**

For contract verification after deployment, run the following command:

forge verify-contract \\

\--verifier sourcify \\

\--verifier-url https://sourcify.rnk.dev/ \\

\--chain-id $CHAIN\_ID \\

$CONTRACT\_ADDR $CONTRACT\_NAME

**Replace:**

* $CHAIN\_ID with 1597 for Reactive Mainnet and 5318007 for Lasna Testnet  
* $CONTRACT\_ADDR with your deployed contract’s address  
* $CONTRACT\_NAME with the name of the contract (e.g., MyContract)

### **Verify on Deployment**

You can also verify the contract during deployment by appending the relevant flags to forge create. The following command submits your contract source to Sourcify right after deployment:

forge create \\

\--verifier sourcify \\

\--verifier-url https://sourcify.rnk.dev/ \\

\--verify \\

\--chain-id $CHAIN\_ID \\

\--private-key $PRIVATE\_KEY \\

$PATH

**Replace:**

* $CHAIN\_ID with 1597 for Reactive Mainnet and 5318007 for Lasna Testnet  
* $PATH with something like src/MyContract.sol:MyContract  
* $PRIVATE\_KEY with your signer’s private key

An example of verifying on deployment could look like so:

forge create \\

 \--broadcast \\

 \--rpc-url $REACTIVE\_RPC\_URL \\

 \--private-key $REACTIVE\_PRIVATE\_KEY \\

 \--chain-id $REACTIVE\_CHAIN\_ID \\

 \--value 0.01ether \\

 \--verify \\

 \--verifier sourcify \\

 \--verifier-url https://sourcify.rnk.dev/ \\

 src/.../MyContract.sol:MyContract \\

 \--constructor-args \\

   $ARGUMENT\_1 \\

   $ARGUMENT\_2 \\

   $ARGUMENT\_3 \\

   \# ...add more as needed

**Broadcast Error**

If you encounter the error described below, it means your Foundry version (or local setup) does not expect the \--broadcast flag for forge create. Simply remove \--broadcast from your command and re-run it.

error: unexpected argument '\--broadcast' found

### **Verified Contracts on Reactscan**

**Reactive Block Explorers:** [Mainnet](https://reactscan.net/) and [Lasna Testnet](https://lasna.reactscan.net/).

After verification, go to the relevant **Reactscan.** While in your RVM, navigate to **Contracts** and click the required contract address.

![Image a][image1]

Open the “Contract” tab.

![Image b][image2]

If successful, you’ll see the following:

Contract Address: 0xc3e185561D2a8b04F0Fcd104A562f460D6cC503c

Status: VERIFIED (EXACT MATCH)

Compiler: 0.8.28

![Image c][image3]

The source code will be publicly viewable, with full syntax highlighting and structure, helping others understand and trust the contract logic.

# **Lesson 1: Reactive Contracts**

## **Overview**

In the [introduction article](https://dev.reactive.network/education/introduction/reactive-contracts), we discuss the basics of Reactive Contracts (RCs), what they are, and why we need them. Let's dive deeper into the technical concepts of RCs with some examples to illustrate those concepts.

By the end of this lesson, you will learn to:

* Understand the key differences between Reactive Contracts (RCs) and traditional smart contracts.  
* Grasp the concept of Inversion of Control and its significance in RCs.  
* Recognize how RCs autonomously monitor and react to blockchain events.  
* Explore various practical use cases where RCs can be applied, such as data collection from oracles, UniSwap stop orders, DEX arbitrage, and pools rebalancing.

## **How RCs Differ from Traditional Smart Contracts**

The main distinction between RCs and traditional smart contracts lies in reactivity. Traditional smart contracts are passive, only executing in response to direct EOA transactions. In contrast, RCs are reactive, continuously monitoring the blockchains for events of interest and autonomously executing predefined blockchain actions in response.

## **Inversion of Control**

A key concept in understanding RCs is the Inversion of Control (IoC). Traditional smart contracts operate under a direct control model, where the execution of their functions is initiated by external actors (EOA users or bots). RCs, however, invert this control by autonomously deciding when to execute based on the occurrence of predefined events. This IoC paradigm shifts how applications interact with the blockchain, enabling more dynamic and responsive systems.

![Inversion of Control][image4]

Without a reactive contract, you would need to set up a separate entity — let's say a bot — to monitor the blockchains using existing, most likely centralized, data solutions. This bot would hold the private keys for the managed funds and initiate transactions on EVM chains from its EOA address. Though such systems prove to be useful, they might be suboptimal for some use cases and not suitable at all for others.

Inversion of Control allows us to avoid hosting additional entities that emulate humans signing transactions. If you have a predefined scenario outlining the sequence of transactions following on-chain events, you should be able to run this logic in a completely decentralized manner, as both your inputs and outputs remain on the blockchain. The Reactive Network gives smart contracts the property they’ve been missing from the start — the ability to be executed automatically, without a person (or a bot) signing a transaction, just based on other on-chain events.

## **What Happens Inside a Reactive Contract**

When creating a Reactive Contract, the first thing you need to specify is the chains, contracts, and events (topic 0\) of interest. The RC will monitor these addresses for the specified events and initiate execution when one is detected. These events can include simple currency or token transfers, DEX swaps, loans, flash loans, votes, whale moves, or any other smart contract activity.

Once an event of interest is detected, the Reactive Network automatically executes the logic you’ve implemented in your reactive contract. This may involve performing calculations based on the event data. RCs are stateful, meaning they have a state where values can be stored and updated. You can accumulate data over time in the state and then act when the combination of historical data and a new blockchain event meets the specified criteria.

As a result of the event, the RC updates its state, keeping it up to date, and can initiate transactions on EVM blockchains. The entire process runs trustlessly within the Reactive Network, ensuring automatic, fast, and reliable execution.

## **Use Cases**

Let's take a closer look at several use cases to illustrate the concepts we’ve just discussed. This educational course will be structured around those use cases because we see practical application as the best way to learn about this tech.

### **Collecting Data from Several Oracles**

For RCs to respond to a broader spectrum of events, including off-chain occurrences, they integrate with oracles. Oracles are third-party services that feed trusted external data into the blockchain. A simple example of such data includes exchange rates or sports event outcomes. RCs can use this data to make informed decisions and execute actions based on real-world events, extending their applicability beyond the blockchain.

Moreover, since an RC can monitor data from different smart contracts across various EVM-compatible blockchains, it can combine data from multiple oracles, resulting in more precise and decentralized information. In this case, the events that RCs will monitor are the updated events from the corresponding oracles. The calculations within the RC will involve combining data from different oracles (for example, by taking the average). The resulting action might be a trustless payout based on the outcome of a basketball game.

### **Uniswap Stop Order**

Another example of a reliable data source on the blockchain is a trading pool, such as a Uniswap pool. It can be even more dependable than oracles since it consists of pure on-chain data and does not rely on third parties.

In this setup, a reactive contract would monitor the swaps in the specified UniSwap pool, calculating the liquidity and the exchange rate. When the exchange rate reaches a predetermined price, the reactive contract executes a swap transaction, thereby implementing a trustless stop order on top of the existing DEX.

### **DEX Arbitrage**

However, we can take the previous example further by implementing an actual arbitrage using RCs. Our reactive contract will monitor several different pools for price discrepancies and capitalize on them. Both one-chain and cross-chain approaches are possible. In the first case, we can use flash loans; in the second case, we will need liquidity on several chains, but we will gain access to more arbitrage opportunities.

The beauty of this solution is that it will be decentralized, unlike the traditional approach with bots. This allows for numerous improvements that we have yet to explore — hopefully, together with you.

### **Pools Rebalancing**

While all the previous use cases involve building RCs on top of existing traditional Smart Contracts, the next one requires initially developing a DApp that relies on RCs. If we design our system from the start, knowing that we can leverage the Reactive Network technology, we can build our Ethereum Smart Contracts utilizing the functionality of RCs.

This approach allows us to potentially create liquidity pools that automatically rebalance across several exchanges. The RC will monitor liquidity on all chains of interest and rebalance them by adding or draining funds as needed.

## **Conclusion**

After reading this lesson, you should have a solid understanding of the foundational concepts and potential applications of Reactive Contracts (RCs). Key takeaways include:

* **Reactive vs. Traditional Contracts:** Unlike traditional smart contracts, RCs autonomously monitor blockchain events and execute actions without user intervention, providing a more dynamic and responsive system.  
* **Inversion of Control:** RCs invert the traditional execution model by allowing the contract itself to decide when to execute based on predefined events, eliminating the need for external triggers like bots or users.  
* **Decentralized Automation:** RCs enable fully decentralized operations, automating processes like data collection, DEX trading, and liquidity management without centralized intermediaries.  
* **Cross-Chain Interactions:** RCs can interact with multiple blockchains and sources, enabling sophisticated use cases like cross-chain arbitrage and multi-oracle data aggregation.  
* **Practical Applications:** RCs have diverse applications, including collecting data from oracles, implementing UniSwap stop orders, executing DEX arbitrage, and automatically rebalancing pools across exchanges.

Explore more practical applications in our [use cases](https://dev.reactive.network/education/use-cases) and join our [Telegram](https://t.me/reactivedevs) group to contribute to the evolving world of Reactive Contracts.

# **Lesson 2: How Events and Callbacks Work**

## **Overview**

In Ethereum, events enable smart contracts to communicate with the external world by logging specific information when certain conditions are met. This allows decentralized applications (dApps) to trigger and respond to occurrences without constantly polling the blockchain. Events are indexed by the EVM, making them easily searchable, which is particularly useful for monitoring blockchain activities like transfers, contract updates, and price changes from oracles.

This lesson focuses on the role of events and callbacks in smart contracts. By learning how to emit, process, and listen to events, developers can create dynamic dApps that respond to blockchain changes in real-time. We will also explore how Reactive Contracts use the react() method to handle events and initiate cross-chain transactions through callbacks, enabling improved functionality within the Reactive Network.

By the end of this lesson, you will learn to:

* Define and emit events in an Ethereum smart contract.  
* Listen for and process events using decentralized applications.  
* Implement event processing in Reactive Contracts.  
* Send callbacks to trigger actions on destination chains.

## **How EVM Events Work**

When a smart contract emits an event, the event data is stored in the transaction's logs. These logs are attached to the blocks of the blockchain but don't directly affect the blockchain state. Instead, they provide a way to record and retrieve information based on the event's parameters.

Developers define events in smart contracts using the event keyword, followed by the event name and the data types of the information they want to log. To emit an event, the smart contract uses the emit keyword, followed by the event name and the data to be logged.

External applications, such as dApps or backend services, can listen for these events. By specifying the event signature and, optionally, filtering parameters, these applications can subscribe to real-time updates whenever the event is emitted. This mechanism is pivotal for creating responsive and interactive blockchain applications.

## **Example: Chainlink Price Oracle Integration**

Chainlink's decentralized oracle network provides real-time data feeds for various cryptocurrencies, commodities, and other off-chain data, directly into smart contracts. Let's see how an EVM event can be used in conjunction with Chainlink's price oracle.

### **Defining the Price Update Event**

Imagine a smart contract that needs real-time price information to execute its logic, such as a DeFi lending platform that adjusts collateral requirements based on the latest market prices. The contract might define an event like this:

event PriceUpdated(string symbol, uint256 newPrice);

This event is designed to log the symbol of the asset and its new price whenever the price is updated.

### **Emitting the Event**

When the smart contract receives a new price update from Chainlink's oracle, it emits the PriceUpdated event:

emit PriceUpdated("ETH", newEthPrice);

In this line, newEthPrice is the updated price of Ethereum fetched from Chainlink, whose oracle is updated periodically.

### **Listening for the Price Update**

A dApp or an investor's portfolio management tool can listen for the PriceUpdated event to trigger specific actions such as rebalancing a portfolio or issuing a loan. We will use a Reactive Contract to catch these events in later lessons.

## **Event Processing in Reactive Contracts**

Reactive Contracts must implement the [IReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/IReactive.sol) interface to handle incoming events.

pragma solidity \>=0.8.0;

import './IPayer.sol';

interface IReactive is IPayer {

   struct LogRecord {

       uint256 chain\_id;

       address \_contract;

       uint256 topic\_0;

       uint256 topic\_1;

       uint256 topic\_2;

       uint256 topic\_3;

       bytes data;

       uint256 block\_number;

       uint256 op\_code;

       uint256 block\_hash;

       uint256 tx\_hash;

       uint256 log\_index;

   }

   event Callback(

       uint256 indexed chain\_id,

       address indexed \_contract,

       uint64 indexed gas\_limit,

       bytes payload

   );


   function react(LogRecord calldata log) external;

}

**LogRecord Structure**: A structured data type, LogRecord, is defined to contain detailed information about an event log:

* chain\_id: ID of the blockchain where the event originated.  
* \_contract: Address of the contract that emitted the event.  
* topic\_0 to topic\_3: Indexed topics of the log.  
* data: Non-indexed data from the event log.  
* block\_number: Block number where the event occurred.  
* op\_code: Potentially denotes an operation code.  
* block\_hash, tx\_hash, and log\_index: Additional identifiers to trace the event's origin and context.

**Callback Event**: An event to notify subscribers of specific occurrences:

* chain\_id: Blockchain ID of the event.  
* \_contract: Address of the emitting contract.  
* gas\_limit: Maximum gas allocated for the callback.  
* payload: Encoded data accompanying the callback.

**react Function**: A key function that handles incoming event notifications.

* Takes a LogRecord as input, enabling reactive contracts to process event logs dynamically.  
* Marked as external, allowing it to be called only from outside the contract.

The Reactive Network continuously monitors event logs and matches them against the subscription criteria defined in reactive contracts. When an event that meets the criteria is detected, the network triggers the react() method, passing in relevant details.

Reactive contracts can access all standard EVM functionalities. However, they run within a private ReactVM, which restricts them to interacting with contracts deployed by the same deployer. This isolation ensures that reactive contracts maintain a controlled and secure environment while processing events from the Reactive Network.

## **Callbacks to Destination Chains**

Reactive contracts can initiate transactions on destination chains by emitting log records in a specific format. These records are picked up by the Reactive Network, which then carries out the desired transactions on the relevant chain.

### **Emitting Callback Events**

To request actions on destination chains, the user must trigger a Callback event in the Reactive Contract. Once triggered, this event is emitted by the smart contract and provides critical information that the Reactive Network needs to create and submit the transaction.

The Callback event includes the following parameters:

* chain\_id: The EIP155 chain ID of the destination network.  
* \_contract: The address of the destination contract.  
* gas\_limit: The gas limit for the transaction on the destination chain.  
* payload: Encoded data that specifies a function call on the destination. This data directs the Reactive Network on how to execute the intended action on the destination contract.

Here’s the signature of the Callback event:

event Callback(

   uint256 indexed chain\_id,

   address indexed \_contract,

   uint64 indexed gas\_limit,

   bytes payload

);

### **Processing the Callback**

When the Callback event is emitted, the Reactive Network detects it and processes the payload, which encodes the transaction details in a specific format. The Reactive Network then submits a transaction to the specified contract on the destination chain, using the provided chain\_id and gas\_limit.

### **Important Note on Authorization**

For security and authorization purposes, the Reactive Network automatically replaces the first 160 bits of the call arguments within the payload with the RVM ID (equivalent to the ReactVM address) of the calling reactive contract. This RVM ID is identical to the contract deployer's address. As a result, the first argument in your callback will always be the ReactVM address (of type address), regardless of the variable name you use in your Solidity code.

### **Encoding and Emitting the Callback Event**

To initiate actions on a destination chain, you can encode the transaction details into the payload and emit the Callback event. For example, in the Uniswap Stop Order Demo, this process is used to trigger token sales through the destination chain contract:

bytes memory payload \= abi.encodeWithSignature(

  "stop(address,address,address,bool,uint256,uint256)",

  address(0),  // The ReactVM address

  pair,        // The Uniswap pair address involved in the transaction

  client,      // The address of the client initiating the stop order

  token0,      // The address of the first token in the pair

  coefficient, // A coefficient determining the sale price

  threshold    // The price threshold at which the sale should occur

);

emit Callback(chain\_id, stop\_order, CALLBACK\_GAS\_LIMIT, payload);

## **Conclusion**

In this lesson, we've explored the fundamentals of events and callbacks in Ethereum and their application in Reactive Contracts. Key takeaways include:

* **Understanding Events:** Events allow smart contracts to log information and interact with external applications, providing a powerful way to respond to on-chain activities without directly altering the blockchain state.  
* **Reactive Contracts and the react() Method:** RCs use the react() method to autonomously process incoming events based on specified criteria, enabling real-time, decentralized, and responsive contract behavior.  
* **Callbacks for Cross-Chain Transactions:** RCs can initiate actions on different blockchains using callbacks, broadening their functionality beyond single-chain constraints and facilitating more complex decentralized applications.  
* **Secure and Controlled Execution:** The ReactVM environment ensures that RCs operate securely by restricting interactions to contracts deployed by the same deployer, maintaining a controlled execution space.

The concepts from this lesson are shown in the [Basic Demo](https://dev.reactive.network/education/use-cases/use-case-1) use case. Feel free to explore it and join our [Telegram](https://t.me/reactivedevs) group for additional guidance.

# **Lesson 3: ReactVM and Reactive Network As a Dual-State Environment**

## **Overview**

In [Reactive Contracts](https://dev.reactive.network/education/module-1/reactive-contracts), we discuss one of the basic concepts of reactive contracts (RCs) — Inversion of Control, and how events and callbacks work in RCs. This article focuses on another crucial property of RCs: the fact they exist in two instances with separate states in the Reactive Network and ReactVM. Understanding this idea is necessary for successful reactive contract development.

By the end of this lesson, you will learn to:

* Distinguish both environments where a reactive contract is executed.  
* Identify the current environment.  
* Manage data with two separate states.  
* Understand the types of transactions RCs operate with.

## **Differences Between the Reactive Network and ReactVM**

Each Reactive Contract has two instances — one on the Reactive Network and the other in its separate ReactVM. It is important to note that both instances are physically stored and executed on each network node. Parallelizing RCs is an architectural decision made to ensure high performance even with big numbers of events. We will talk more about that in one of our next articles.

![Reactive Network | React Vm][image5]

The Reactive Network operates as a typical EVM blockchain with the addition of system contracts that allow subscribing to and unsubscribing from origin chain events on Ethereum, BNB, Polygon, or Optimism. Each deployer address has a dedicated ReactVM.

ReactVM is a restricted virtual machine designed to process events in isolation. Contracts deployed from one address are executed in one ReactVM. They can interact with each other but not with other contracts on the Reactive Network.

Contracts within a single ReactVM can interact with the external world in two ways, both through the Reactive Network:

* They react to specified events to which they are subscribed and are executed when these events occur.  
* Based on the execution of the code with the inputs from events, the ReactVM sends requests to the Reactive Network for callbacks to destination chains to perform the resulting on-chain actions.

For each RC deployed, there are two instances of it with separate states but the same code. Each method is expected to be executed in one or both environments and to interact with one or both states. This leads to the question of how we identify, within the code, which state we are currently working with.

### **Identifying the Execution Context**

The execution context determines whether the contract is running on the Reactive Network or within a ReactVM instance. This distinction is crucial for controlling which functions can be called in which environment. Implement [AbstractReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/abstract-base/AbstractReactive.sol) in your project to get all the necessary functionality.

#### **How Detection Works**

Instead of attempting to invoke the system contract in the constructor, the new code uses the function detectVm() to inspect the code size at the system contract’s address. The 0x0000000000000000000000000000000000fffFfF address only has deployed code on the Reactive Network. If there is code at this address, we conclude that we are on the Reactive Network; if not, we are within a ReactVM instance.

function detectVm() internal {

   uint256 size;

   // solhint-disable-next-line no-inline-assembly

   assembly { size := extcodesize(0x0000000000000000000000000000000000fffFfF) }

   vm \= size \== 0;

}

**Assembly Check**: An inline assembly snippet checks the size of the contract code at the system contract’s address.

**Setting the vm Flag**: If size \== 0, there is no code at that address. This indicates that we are running within a ReactVM instance, so vm is set to true. Otherwise, if size \> 0, it indicates the presence of the system contract, confirming that we are on the Reactive Network, so vm remains false.

#### **Enforcing Execution Context**

We use modifiers to ensure that each function can only be called in its intended environment.

modifier rnOnly() {

   require(\!vm, 'Reactive Network only');

   \_;

}

modifier vmOnly() {

   require(vm, 'VM only');

   \_;

}

**rnOnly()**: requires that vm \== false, meaning the function can only run when the contract is deployed to the Reactive Network.

**vmOnly()**: requires that vm \== true, meaning the function can only run within a ReactVM instance.

### **Managing Dual Variable Sets for Each State**

In Reactive architecture, each deployed contract can run in two operational states:

**Reactive Network State**

* Interacts directly with system contracts.  
* Subscribes to events using service.subscribe(...).  
* Uses variables and methods required to register and manage event subscriptions.

**ReactVM State**

* Contains the business logic to react to subscribed events.  
* Uses variables and methods that execute upon receiving an event.

To accommodate these states, two conceptual sets of variables are maintained — one set in the base (network-facing) contract context and another set in the ReactVM context. In this new example, the "Reactive Network" variables are inherited from our AbstractReactive contract, while the ReactVM variables are declared within a reactive contract itself.

### **Reactive Network Variables**

If a reactive contract inherits from AbstractReactive, the following variables and methods are available behind the scenes:

* service (ISubscriptionService) for subscribing to events.  
* vm (bool) that indicates whether the execution is happening on the ReactVM or in the Reactive Network context.  
* Additional inherited utility methods (e.g., service.subscribe(...)).

In the constructor of the [Uniswap Stop Order reactive contract](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/uniswap-v2-stop-order/UniswapDemoStopOrderReactive.sol), you can notice that if (\!vm) checks if we are running in the Reactive Network state. If so, the contract registers to receive events from pair and stop\_order. Once subscribed, those events will later trigger our react() logic only when we are in the ReactVM state.

// State specific to ReactVM instance of the contract.

bool private triggered;

bool private done;

address private pair;

address private stop\_order;

address private client;

bool private token0;

uint256 private coefficient;

uint256 private threshold;

constructor(

   address \_pair,

   address \_stop\_order,

   address \_client,

   bool \_token0,

   uint256 \_coefficient,

   uint256 \_threshold

) payable {

   triggered \= false;

   done \= false;

   pair \= \_pair;

   stop\_order \= \_stop\_order;

   client \= \_client;

   token0 \= \_token0;

   coefficient \= \_coefficient;

   threshold \= \_threshold;

   if (\!vm) {

       service.subscribe(

           SEPOLIA\_CHAIN\_ID,

           pair,

           UNISWAP\_V2\_SYNC\_TOPIC\_0,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE

       );

       service.subscribe(

           SEPOLIA\_CHAIN\_ID,

           stop\_order,

           STOP\_ORDER\_STOP\_TOPIC\_0,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE

       );

   }

}

### **ReactVM Variables**

Within the [Uniswap Stop Order reactive contract](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/uniswap-v2-stop-order/UniswapDemoStopOrderReactive.sol), the following variables and methods are used specifically after events are received:

bool private triggered;

bool private done;

address private pair;

address private stop\_order;

address private client;

bool private token0;

uint256 private coefficient;

uint256 private threshold;

These variables handle the logic in the react() function:

// Methods specific to ReactVM instance of the contract.

function react(LogRecord calldata log) external vmOnly {

   assert(\!done);

   if (log.\_contract \== stop\_order) {

       if (

           triggered &&

           log.topic\_0 \== STOP\_ORDER\_STOP\_TOPIC\_0 &&

           log.topic\_1 \== uint256(uint160(pair)) &&

           log.topic\_2 \== uint256(uint160(client))

       ) {

           done \= true;

           emit Done();

       }

   } else {

       Reserves memory sync \= abi.decode(log.data, ( Reserves ));

       if (below\_threshold(sync) && \!triggered) {

           emit CallbackSent();

           bytes memory payload \= abi.encodeWithSignature(

               "stop(address,address,address,bool,uint256,uint256)",

               address(0),

               pair,

               client,

               token0,

               coefficient,

               threshold

           );

           triggered \= true;

           emit Callback(log.chain\_id, stop\_order, CALLBACK\_GAS\_LIMIT, payload);

       }

   }

}

* triggered prevents multiple callbacks once the threshold condition is satisfied.  
* done signals that the final stop has occurred.  
* pair, stop\_order, and client reference external contracts and user data.  
* token0, coefficient, and threshold define the math around when to trigger a stop.

The actual logic (checking liquidity reserves and emitting callbacks) is local to ReactVM. Since react() is labeled vmOnly, it is invoked by the underlying system **only** in the ReactVM context upon matching event logs.

## **Transaction Execution**

When working with a Reactive Contract (RC), there are two primary environments where transactions occur: the Reactive Network and the ReactVM. Each environment has different rules for initiating and processing transactions, as detailed below. The code is taken from [AbstractPausableReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/abstract-base/AbstractPausableReactive.sol).

### **Reactive Network Transactions**

Transactions on the Reactive Network can be initiated in two ways: directly by a user or triggered by an event on the origin chain.

#### **User-Initiated Transactions**

Users can invoke methods on the Reactive Network’s instance of an RC to perform administrative functions or update contract state. For instance, pausing event subscriptions is done by calling the pause() function:

function pause() external rnOnly onlyOwner {

       require(\!paused, 'Already paused');

       Subscription\[\] memory subscriptions \= getPausableSubscriptions();

       for (uint256 ix \= 0; ix \!= subscriptions.length; \++ix) {

           service.unsubscribe(

               subscriptions\[ix\].chain\_id,

               subscriptions\[ix\].\_contract,

               subscriptions\[ix\].topic\_0,

               subscriptions\[ix\].topic\_1,

               subscriptions\[ix\].topic\_2,

               subscriptions\[ix\].topic\_3

           );

       }

       paused \= true;

}

* rnOnly ensures that only the Reactive Network can call this function.  
* onlyOwner limits the call to the contract owner.  
* service.unsubscribe() removes the contract from listening to specific events (defined by chain\_id, topic\_0, etc.).

This pause() function prevents the RC from reacting to events by unsubscribing from them, effectively stopping further event-driven transactions until it is resumed.

The corresponding resume() function re-subscribes to those same events so that the RC can continue responding when new events are emitted:

function resume() external rnOnly onlyOwner {

   require(paused, 'Not paused');

   Subscription\[\] memory subscriptions \= getPausableSubscriptions();

   for (uint256 ix \= 0; ix \!= subscriptions.length; \++ix) {

       service.subscribe(

           subscriptions\[ix\].chain\_id,

           subscriptions\[ix\].\_contract,

           subscriptions\[ix\].topic\_0,

           subscriptions\[ix\].topic\_1,

           subscriptions\[ix\].topic\_2,

           subscriptions\[ix\].topic\_3

       );

   }

   paused \= false;

}

#### **Event-Triggered Transactions**

Even if a user does not directly initiate a transaction, the Reactive Network monitors events on the origin chain. When an event of interest is emitted, the Reactive Network dispatches it to all active subscribers, typically specialized ReactVM instances. This dispatch triggers further action or state changes in the subscribers.

### **ReactVM Transactions**

Within the ReactVM, transactions can't be called directly by users. Instead, they are triggered automatically when the Reactive Network forwards relevant events from the origin chain:

* Event emitted on origin chain  
* Reactive Network dispatches event  
* ReactVM receives and processes Event

When an RC running in the ReactVM receives an event, it typically calls its core reaction function react() to handle the event. The react() function contains the business logic for:

* Updating internal state based on the received event.  
* Emitting callbacks to destination chains, which can then trigger transactions on those chains.

Thus, any callback or subsequent transaction to another chain is automatically initiated by the ReactVM in response to the received event, rather than manually triggered by a user.

We will consider other examples of react() functions for different use cases closely in our next lessons.

## **Conclusion**

In this lesson, we've explored how Reactive Contracts (RCs) function within two distinct environments: the Reactive Network and the ReactVM. Understanding the dual-state nature of RCs is crucial for their effective development. Key takeaways include:

* **Dual-State Environments:** RCs exist in two instances, each with separate states but the same code — one in the Reactive Network and one in the ReactVM. This setup allows for parallel processing and high performance.  
* **Identifying Execution Context:** The environment in which the contract is executing is identified using a boolean variable (vm). This allows for precise control over which code and state are accessed, ensuring the correct execution flow.  
* **Managing Separate States:** RCs maintain separate sets of variables for the Reactive Network and ReactVM, which are used according to the environment in which the contract is executed. This helps in maintaining clarity and avoiding conflicts between the two states.  
* **Transaction Types:** The Reactive Network handles transactions initiated by users or triggered by events on the origin chain, while the ReactVM processes events and executes the react() function, defining the reaction logic and initiating cross-chain callbacks.

Explore more practical applications in our [use cases](https://dev.reactive.network/education/use-cases) and join our [Telegram](https://t.me/reactivedevs) group for additional guidance.

# **Lesson 4: How Subscriptions Work**

## **Overview**

In the previous lesson, we covered the basic differences between the Reactive Network and ReactVM. In this one, we will dive into subscriptions, a key feature that allows RCs to automatically respond to events emitted by other contracts. When these events occur, the subscribing contract can automatically execute predefined logic.

By the end of this article, you will learn to:

* Configure and manage subscriptions both statically and dynamically.  
* Handle subscription and unsubscription events within your smart contracts.  
* Recognize the limitations and best practices for using subscriptions in Reactive Contracts.

## **How to Implement Subscriptions**

In reactive contracts, subscriptions are set up using the subscribe method from the Reactive Network’s system contract. Typically, this is done in the constructor to initialize subscriptions, though they can also be managed dynamically. We’ll discuss [dynamic subscriptions](https://dev.reactive.network/education/module-1/how-subscriptions-work#dynamic-subscriptions) closer to the end of this article.

The reactive contract must also handle reverts due to deployments on both the Reactive Network, which has the system contract, and their deployer's private ReactVM, where the system contract is not present.

### **ISubscriptionService Interface**

The [ISubscriptionService](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/ISubscriptionService.sol) interface serves as an event subscription service for reactive contracts that can use this service to subscribe to specific events based on certain criteria and receive notifications when those events occur.

pragma solidity \>=0.8.0;

import './IPayable.sol';

interface ISubscriptionService is IPayable {

   function subscribe(

       uint256 chain\_id,

       address \_contract,

       uint256 topic\_0,

       uint256 topic\_1,

       uint256 topic\_2,

       uint256 topic\_3

   ) external;


   function unsubscribe(

       uint256 chain\_id,

       address \_contract,

       uint256 topic\_0,

       uint256 topic\_1,

       uint256 topic\_2,

       uint256 topic\_3

   ) external;

}

The parameters of both functions mirror each other:

* chain\_id: A uint256 representing the EIP155 source chain ID for the event.  
* \_contract: The address of the origin chain contract that emitted the event.  
* topic\_0, topic\_1, topic\_2, topic\_3: The topics of the event, which are uint256 values.

Unsubscribing is an expensive operation due to the necessity of searching and removing subscriptions. Duplicate or overlapping subscriptions are allowed, but clients must ensure idempotency.

### **IReactive Interface**

The [IReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/IReactive.sol) interface defines a standard for reactive contracts that can receive and handle notifications about events matching their subscriptions. It extends the [IPayer](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/IPayer.sol) interface, indicating that it includes payment-related functionalities.

pragma solidity \>=0.8.0;

import './IPayer.sol';

interface IReactive is IPayer {

   struct LogRecord {

       uint256 chain\_id;

       address \_contract;

       uint256 topic\_0;

       uint256 topic\_1;

       uint256 topic\_2;

       uint256 topic\_3;

       bytes data;

       uint256 block\_number;

       uint256 op\_code;

       uint256 block\_hash;

       uint256 tx\_hash;

       uint256 log\_index;

   }

   event Callback(

       uint256 indexed chain\_id,

       address indexed \_contract,

       uint64 indexed gas\_limit,

       bytes payload

   );


   function react(LogRecord calldata log) external;

}

**LogRecord Struct**: A data structure representing a detailed log of an event, including:

* chain\_id: The ID of the originating blockchain.  
* \_contract: The contract address where the event occurred.  
* topic\_0 to topic\_3: Indexed topics of the event log.  
* data: Additional unindexed event data.  
* block\_number: The block number when the event was logged.  
* op\_code: An operation code for event categorization.  
* block\_hash: The hash of the block containing the event.  
* tx\_hash: The transaction hash that triggered the event.  
* log\_index: The index of the log within the transaction.

**Callback Event**: An event emitted to signal that a reactive contract has been triggered. It includes:

* chain\_id: The ID of the originating blockchain.  
* \_contract: The address of the contract emitting the event.  
* gas\_limit: The maximum gas allocated for the callback.  
* payload: The data payload sent during the callback.

**react Function**: The main entry point for processing event notifications.

* log (of type LogRecord): Contains event details.

### **Constructor Subscribtion**

Here’s how you can subscribe in the constructor:

// State specific to reactive network instance of the contract

address private \_callback;

// State specific to ReactVM instance of the contract

uint256 public counter;

constructor(

       address \_service,

       address \_contract,

       uint256 topic\_0,

       address callback

   ) payable {

       service \= ISystemContract(payable(\_service));

       if (\!vm) {

           service.subscribe(

               CHAIN\_ID,

               \_contract,

               topic\_0,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE

           );

       }

       \_callback \= callback;

   }

### **Subscription Criteria**

When configuring subscriptions in reactive contracts, you should adhere to the following rules:

* Wildcard Usage: Use address(0) to indicate filtering by any contract address, uint256(0) to indicate any chain ID, and REACTIVE\_IGNORE for topics to filter by any topic.  
* Concrete Values: At least one criterion must be a specific value to ensure meaningful subscriptions.

### **Examples**

#### **Subscribing to All Events from a Specific Contract**

Here’s how you can subscribe to all events from a specific contract at 0x7E0987E5b3a30e3f2828572Bb659A548460a3003:

service.subscribe(CHAIN\_ID, 0x7E0987E5b3a30e3f2828572Bb659A548460a3003, REACTIVE\_IGNORE, REACTIVE\_IGNORE, REACTIVE\_IGNORE, REACTIVE\_IGNORE)

#### **Subscribing to a Specific Event Topic (Uniswap V2 Sync)**

Another option is to subscribe to all Uniswap V2 Sync events with topic\_0 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1:

service.subscribe(CHAIN\_ID, 0, 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1, REACTIVE\_IGNORE, REACTIVE\_IGNORE, REACTIVE\_IGNORE)

#### **Combining Parameters**

You can combine these parameters to subscribe to the events of a specific contract at 0x7E0987E5b3a30e3f2828572Bb659A548460a3003 with topic\_0 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1:

service.subscribe(CHAIN\_ID, 0x7E0987E5b3a30e3f2828572Bb659A548460a3003, 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1, REACTIVE\_IGNORE, REACTIVE\_IGNORE, REACTIVE\_IGNORE)

#### **Handling Multiple Events from Different Origins**

To react to multiple events from different origins, you can use multiple subscribe calls in the constructor:

constructor(

   address \_service,

   address \_contract1,

   address \_contract2,

   uint256 topic\_0,

   address callback

) payable {

   // Initialize the subscription service

   SubscriptionService service \= SubscriptionService(payable(\_service));

   if (\!vm) {

       // First subscription

       service.subscribe(

           CHAIN\_ID,

           \_contract1,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE

       );

       // Second subscription

       service.subscribe(

           CHAIN\_ID,

           address(0),

           topic\_0,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE

       );

       // Add more subscriptions here as needed

   }

   // Assign the callback

   \_callback \= callback;

}

### **Prohibited Subscriptions**

* **Non-Equality Operations**: Subscriptions can’t match event parameters using less than (\<), greater than (\>), range, or bitwise operations. Only strict equality is supported.  
* **Complex Criteria Sets**: Subscriptions can’t use disjunction or sets of criteria within a single subscription. While calling the subscribe() method multiple times can achieve similar results, it may lead to combinatorial explosion.  
* **Single Chain and All Contracts**: Subscribing to events from all chains or all contracts simultaneously is not allowed. Subscribing to all events from only one chain is also prohibited, as it is considered unnecessary.  
* **Duplicate Subscriptions**: While duplicate subscriptions are technically allowed, they function as a single subscription. Users are charged for each transaction sent to the system contract. Preventing duplicates in the system contract is costly due to EVM storage limitations, so duplicate subscriptions are permitted to keep costs manageable.

## **Dynamic Subscriptions**

Reactive contracts can dynamically manage their subscriptions based on incoming events. Since the system contract responsible for managing subscriptions is only accessible from the Reactive Network, the ReactVM's contract copy handles these operations and communicates with the Reactive Network using callbacks. You can read more on that in [ReactVM and Reactive Network As a Dual-State Environment](https://dev.reactive.network/education/module-1/react-vm). Below is an example of how you can make a dynamic subscription, based on the [Approval Magic Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/approval-magic).

### **Imports and Initialization**

Initialize the contract by declaring constants and variables that will be used throughout the contract:

pragma solidity \>=0.8.0;

import '../../../lib/reactive-lib/src/abstract-base/AbstractReactive.sol';

import './ApprovalService.sol';

contract ApprovalListener is AbstractReactive {

   uint256 private constant REACTIVE\_CHAIN\_ID \= 0x512578;

   uint256 private constant SEPOLIA\_CHAIN\_ID \= 11155111;

   uint256 private constant SUBSCRIBE\_TOPIC\_0 \= 0x1aec2cf998e5b9daa15739cf56ce9bb0f29355de099191a2118402e5ac0805c8;

   uint256 private constant UNSUBSCRIBE\_TOPIC\_0 \= 0xeed050308c603899d7397c26bdccda0810c3ccc6e9730a8a10c452b522f8edf4;

   uint256 private constant APPROVAL\_TOPIC\_0 \= 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925;

   uint64 private constant CALLBACK\_GAS\_LIMIT \= 1000000;

   address private owner;

   ApprovalService private approval\_service;

**Constants**:

* REACTIVE\_CHAIN\_ID: Represents the ID of the Reactive network.  
* SEPOLIA\_CHAIN\_ID: Represents the Sepolia test network.  
* SUBSCRIBE\_TOPIC\_0, UNSUBSCRIBE\_TOPIC\_0, APPROVAL\_TOPIC\_0: Topics used to identify the different types of actions (subscription, unsubscription, and approval) in the Reactive Network.  
* CALLBACK\_GAS\_LIMIT: The maximum gas allowed for callback operations.

**State Variables**:

* owner: The address of the contract owner, typically the one who deployed the contract.  
* approval\_service: An instance of the ApprovalService contract, used to manage subscription-related operations.

### **Constructor**

The constructor sets up the contract's initial state, including registering for the relevant subscription and unsubscription events.

   constructor(

       ApprovalService service\_

   ) payable {

       owner \= msg.sender;

       approval\_service \= service\_;

       if (\!vm) {

           service.subscribe(

               SEPOLIA\_CHAIN\_ID,

               address(approval\_service),

               SUBSCRIBE\_TOPIC\_0,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE

           );

           service.subscribe(

               SEPOLIA\_CHAIN\_ID,

               address(approval\_service),

               UNSUBSCRIBE\_TOPIC\_0,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE

           );

       }

   }

**Constructor Parameters**:

* service\_: The address of the ApprovalService contract to interact with for subscription management.

**Initialization**:

* owner is set to the address that deploys the contract.  
* approval\_service is set to the provided ApprovalService contract instance.  
* If the environment is not vm instance, the constructor subscribes to the relevant topics (subscription and unsubscription) by calling service.subscribe for both SUBSCRIBE\_TOPIC\_0 and UNSUBSCRIBE\_TOPIC\_0.

### **Authorization**

This modifier restricts the execution of certain functions to only authorized callers (the service contract and the owner).

modifier callbackOnly(address evm\_id) {

       require(msg.sender \== address(service), 'Callback only');

       require(evm\_id \== owner, 'Wrong EVM ID');

       \_;

   }

**Conditions**:

* The msg.sender must be the service contract.  
* The evm\_id passed to the function must match the owner address.

**Functionality**: This ensures that only the service contract or the owner can trigger certain actions, preventing unauthorized access.

### **Subscribing & Unsubscribing**

These functions allow the contract to subscribe or unsubscribe a subscriber address to/from the APPROVAL\_TOPIC\_0 in the Reactive Network.

   // Methods specific to reactive network contract instance

   function subscribe(address rvm\_id, address subscriber) external rnOnly callbackOnly(rvm\_id) {

       service.subscribe(

           SEPOLIA\_CHAIN\_ID,

           address(0),

           APPROVAL\_TOPIC\_0,

           REACTIVE\_IGNORE,

           uint256(uint160(subscriber)),

           REACTIVE\_IGNORE

       );

   }

   function unsubscribe(address rvm\_id, address subscriber) external rnOnly callbackOnly(rvm\_id) {

       service.unsubscribe(

           SEPOLIA\_CHAIN\_ID,

           address(0),

           APPROVAL\_TOPIC\_0,

           REACTIVE\_IGNORE,

           uint256(uint160(subscriber)),

           REACTIVE\_IGNORE

       );

   }

**Parameters**:

* rvm\_id: The ID of the reactive virtual machine (RVM).  
* subscriber: The address that will be subscribed or unsubscribed.

**Operations**:

* subscribe: Registers a subscriber to the APPROVAL\_TOPIC\_0.  
* unsubscribe: Removes a subscriber from the APPROVAL\_TOPIC\_0.

### **react Function & Logic**

The function processes incoming log records from the ReactVM and executes different actions based on the topic in the log.

// Methods specific to ReactVM contract instance

   function react(LogRecord calldata log) external vmOnly {

       if (log.topic\_0 \== SUBSCRIBE\_TOPIC\_0) {

           bytes memory payload \= abi.encodeWithSignature(

               "subscribe(address,address)",

               address(0),

               address(uint160(log.topic\_1))

           );

           emit Callback(REACTIVE\_CHAIN\_ID, address(this), CALLBACK\_GAS\_LIMIT, payload);

       } else if (log.topic\_0 \== UNSUBSCRIBE\_TOPIC\_0) {

           bytes memory payload \= abi.encodeWithSignature(

               "unsubscribe(address,address)",

               address(0),

               address(uint160(log.topic\_1))

           );

           emit Callback(REACTIVE\_CHAIN\_ID, address(this), CALLBACK\_GAS\_LIMIT, payload);

       } else {

           (uint256 amount) \= abi.decode(log.data, (uint256));

           bytes memory payload \= abi.encodeWithSignature(

               "onApproval(address,address,address,address,uint256)",

               address(0),

               address(uint160(log.topic\_2)),

               address(uint160(log.topic\_1)),

               log.\_contract,

               amount

           );

           emit Callback(SEPOLIA\_CHAIN\_ID, address(approval\_service), CALLBACK\_GAS\_LIMIT, payload);

       }

   }

}

**Log Processing**:

* Subscribe Logic: If the log's topic\_0 matches the SUBSCRIBE\_TOPIC\_0, the function encodes a payload for the subscribe() method and emits a callback.  
* Unsubscribe Logic: If the log's topic\_0 matches the UNSUBSCRIBE\_TOPIC\_0, the function encodes a payload for the unsubscribe() method and emits a callback.  
* Approval Logic: For any other log, it decodes the approval amount and creates a payload for the onApproval method, then emits a callback to the approval\_service on Sepolia.

**Callback Emission**: The function uses the emit Callback statement to send the appropriate payload and trigger the corresponding action on the Reactive chain.

## **Conclusion**

In this article, we’ve explored the use of subscriptions in Reactive Contracts, a fundamental feature that enables automatic responses to events from other contracts. Key takeaways include:

* **Subscription Setup:** Subscriptions are established using the subscribe method from the Reactive Network’s system contract. This can be done statically in the constructor or managed dynamically as needed.  
* **Subscription Criteria:** Proper configuration is essential for effective subscriptions. Wildcards and specific values are used to define the scope of events to which a contract subscribes. Avoid prohibited subscription patterns to ensure efficient operation.  
* **Dynamic Management:** Subscriptions can be dynamically adjusted based on incoming events, with the react() method playing a central role in managing these operations. This approach ensures that RCs can respond in real-time to changes in the network.  
* **Handling Events:** Contracts must handle events carefully by preparing appropriate payloads for subscription, unsubscription, and approval actions. This ensures accurate and timely updates across the network.

For practical applications and further insights, explore our [use cases](https://dev.reactive.network/education/use-cases) and join our [Telegram](https://t.me/reactivedevs) group to engage with the community.**Lesson 5: How Oracles Work**

## **Overview**

Reactive Contracts are adept at monitoring on-chain events and executing subsequent on-chain actions in response. Yet within the smart contract ecosystem, a distinct category exists specifically for importing off-chain data onto the blockchain. These are known as oracles. Among the myriad events to which Reactive Contracts can respond, those emitted by oracles hold significant importance. This article delves deeper into the concept of oracles, setting the stage for a clearer comprehension of the upcoming use case we'll explore. By unpacking the mechanisms and implications of oracles within the blockchain framework, we aim to equip you with the knowledge needed to fully grasp the potential and utility of Reactive Contracts in interacting with real-world data.

By the end of this lesson, you will learn to:

* Understand the role of oracles in bridging the gap between blockchain and real-world data.  
* Address the oracle problem by exploring how oracles bring off-chain data onto the blockchain.  
* Implement and integrate oracles within smart contracts, using examples like Chainlink to fetch external data.  
* Recognize the advantages of combining Reactive Contracts with oracles for real-time interaction with on-chain and off-chain events.

## **What Oracles Do**

In the realm of blockchain and smart contracts, the necessity to interact with the real world presents a unique challenge. Smart contracts operate in a deterministic environment, where every operation must be verifiable and repeatable. However, to unlock the full potential of smart contracts, there's often a need to access data from the outside world — be it price feeds, weather reports, or other off-chain information. This requirement introduces the oracle problem: how to fetch off-chain data onto the blockchain without sacrificing the core principles of decentralization and trustlessness.

## **Addressing the Oracle Problem**

The oracle problem is tackled through entities known as oracles, which serve as bridges between the blockchain (on-chain) and the external world (off-chain). Oracles fetch data from a plethora of external sources to feed into the blockchain. This data could stem from APIs of financial marketplaces for price feeds, government databases for public records, or IoT devices for real-world physical data. The crux of an oracle's utility lies in its ability to validate and relay this data to smart contracts in a trust-minimized way.

The question of who signs the transactions for oracles to input data onto the blockchain brings us to the mechanism ensuring the data's integrity and trustworthiness. Typically, transactions are signed using the private keys of the oracle service provider.

To bolster security and mitigate the risks of failure or malicious manipulation, many decentralized oracle networks employ multisig protocols. Multisig requires a predefined number of signatures out of a set of participants to authorize a transaction, ensuring that no single entity can unilaterally submit data to the blockchain. This method adds a layer of decentralization and security to the process, aligning with the trustless nature of blockchain systems.

Some of the popular oracle providers are Chainlink and Band Protocol. These platforms aggregate data from multiple sources, ensuring data integrity and reducing the risk of manipulation.

## **Practical Applications and Examples**

Oracles unlock a myriad of use cases for smart contracts, allowing them to react to real-world events and data. Some notable applications include:

* DeFi Platforms: Utilizing price feed oracles to manage lending rates, liquidations, and asset swaps.  
* Insurance: Triggering payouts based on verifiable events, like natural disasters, reported by trusted oracles.  
* Online Betting: Smart contracts provide great tech solutions for trustless online betting, and oracles feed the data about the outcomes of sporting events to such systems.

## **Code Example: Using Chainlink Oracles**

Here's a simple example of how a smart contract can use Chainlink to fetch a USD/ETH price feed:

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {

   AggregatorV3Interface internal priceFeed;

   /\*\*

    \* Network: Ethereum Mainnet

    \* Aggregator: ETH/USD

    \* Address: 0x... (Chainlink ETH/USD Price Feed Contract Address)

    \*/

   constructor() public {

       priceFeed \= AggregatorV3Interface(0x...);

   }

   /\*\*

    \* Returns the latest price

    \*/

   function getLatestPrice() public view returns (int) {

       (

           /\* uint80 roundID \*/,

           int price,

           /\* uint startedAt \*/,

           /\* uint timeStamp \*/,

           /\* uint80 answeredInRound \*/

       ) \= priceFeed.latestRoundData();

       return price;

   }

}

This contract demonstrates fetching the latest ETH/USD price using Chainlink's decentralized oracle network. It illustrates how smart contracts can securely and reliably access off-chain data.

However, as you may have observed, the smart contract can only request data through the getLatestPrice() function when it's explicitly called. To ensure your contract's data remains current, you should periodically invoke the function that queries the oracle. This challenge isn't insurmountable; one could simply update the price each time someone interacts with the contract, basing this interaction on the most recent price data. Yet this approach falls short of enabling your system to respond to price changes — or other oracle-generated events — in real time.

In the Ethereum ecosystem, while one smart contract can indeed call another, such calls must initially be triggered by an Externally Owned Account (EOA) address. An EOA is an Ethereum address controlled directly by the private key's owner, unlike smart contract addresses, which are governed by contract code. Consequently, each transaction is initiated and signed by a specific EOA, restricting the capacity for smart contracts to operate in real time. This limitation underscores the distinctive advantage of Reactive Contracts.

## **Why We Need Reactive Contracts**

Our exploration has previously touched upon the Inversion of Control principle, a defining characteristic of Reactive Contracts. Here, it's worth emphasizing again: Reactive Contracts stand out because they react not just to direct user transactions but to events across various EVM chains. Following these events, they execute on-chain actions, potentially on the same or different chains.

This brings us to the significance of oracles in our discussion: by integrating oracles with Reactive Contracts, we unlock the potential to respond to off-chain events — once brought on-chain by oracles — with predefined on-chain actions as articulated in our Reactive Contracts. This synergy between oracles and Reactive Contracts enables a dynamic, responsive system capable of real-time interaction with both the digital and physical worlds. This broadens the scope and utility of blockchain technology beyond its current constraints.

## **Conclusion**

In this article, we’ve talked about the role of oracles within the context of Reactive Contracts (RCs), highlighting their significance in bridging the gap between on-chain and off-chain data. Key takeaways include:

* **Oracle Functionality:** Oracles are essential for importing real-world data onto the blockchain, enabling smart contracts to interact with external information such as price feeds, weather reports, and more.  
* **Addressing the Oracle Problem:** The oracle problem is mitigated through decentralized oracle networks that ensure data integrity and minimize trust issues. Multisig protocols and reputable providers like Chainlink and Band Protocol enhance security and reliability.  
* **Practical Applications:** Oracles facilitate various use cases, including decentralized finance (DeFi), insurance, and online betting, by providing real-time data to smart contracts and enabling automated, trustless interactions.  
* **Integration with Reactive Contracts:** The synergy between oracles and RCs allows for dynamic, real-time responses to off-chain events. This integration leverages the strengths of both technologies to enhance the functionality and reach of blockchain applications.

For practical applications and further insights, explore our [use cases](https://dev.reactive.network/education/use-cases) and join our [Telegram](https://t.me/reactivedevs) group to engage with the community.

# **Lesson 6: How Uniswap Works / Understanding Uniswap V2 Pools and Smart Contracts**

## **Overview**

Uniswap V2, a decentralized finance protocol, operates on the Ethereum blockchain, facilitating automated trading of decentralized tokens. At its core are liquidity pools and smart contracts that enable seamless token swaps. Understanding Uniswap-like DEXes is crucial for understanding DeFi, smart contract applications, and Reactive use cases. By the end of this lesson, you'll be equipped with knowledge on:

* The structure and function of Uniswap V2 pools, including how they facilitate token swaps and liquidity provisioning.  
* The constant product formula (x \* y \= k) that governs the pricing mechanism within Uniswap V2.  
* The execution and significance of Swap and Sync events in maintaining pool dynamics and providing transparency.  
* A practical understanding through a code example that demonstrates the swap function within Uniswap V2's smart contracts.

## **Uniswap V2 Pools**

Liquidity pools in Uniswap V2 are essentially reserves of two tokens, forming a trading pair. These pools are the backbone of the Uniswap ecosystem, allowing users to trade tokens without the need for traditional market makers.

In Uniswap V2, each trade or liquidity provision is executed through transactions on the Ethereum blockchain. These transactions are public and can be [viewed on Etherscan](https://etherscan.io/tx/0x7b969e8a74ae9891e322311ca5fe6e5d7bcb53ac3412b4189d84683961043503) or similar block explorers.

Smart contracts in Uniswap V2 manage the liquidity pools, dictate the rules for token swapping, and ensure that trades are executed according to the protocol's algorithm, often referred to as the Constant Product Market Maker model.

### **The Constant Product Formula**

The Uniswap V2 smart contract uses this formula: x \* y \= k, where x and y represent the quantity of the two tokens in the liquidity pool, and k is a constant. This formula maintains the pool's total liquidity while allowing the token prices to fluctuate based on trading activity.

Code Example: Here's a simplified snippet of what a Uniswap V2 swap() function might look like (see the explanation below the code):

function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external {

require(amount0Out \> 0 || amount1Out \> 0, "UniswapV2: INSUFFICIENT\_OUTPUT\_AMOUNT");

(uint112 reserve0, uint112 reserve1,) \= getReserves(); // fetches reserves of the pool

require(amount0Out \< reserve0 && amount1Out \< reserve1, "UniswapV2: INSUFFICIENT\_LIQUIDITY");

   uint balance0;

   uint balance1;

   {

       uint amount0In \= reserve0 \- (balance0 \= reserve0 \- amount0Out);

       uint amount1In \= reserve1 \- (balance1 \= reserve1 \- amount1Out);

       require(amount0In \> 0 || amount1In \> 0, "UniswapV2: INSUFFICIENT\_INPUT\_AMOUNT");

       uint balanceAdjusted0 \= balance0 \* 1000 \- amount0In \* 3;

       uint balanceAdjusted1 \= balance1 \* 1000 \- amount1In \* 3;

       require(balanceAdjusted0 \* balanceAdjusted1 \>= uint(reserve0) \* uint(reserve1) \* (1000\*\*2), "UniswapV2: K");

       // Emit the Swap event

       emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);

   }

   \_update(balance0, balance1, reserve0, reserve1);

   if (amount0Out \> 0) \_safeTransfer(token0, to, amount0Out);

   if (amount1Out \> 0) \_safeTransfer(token1, to, amount1Out);

   if (data.length \> 0) {

       IUniswapV2Callee(to).uniswapV2Call(msg.sender, amount0Out, amount1Out, data);

   }

}

In this function:

* amount0Out and amount1Out are the amounts of each token that the caller wants to receive from the pool.  
* The function first checks that the output amounts are positive and that the swap doesn't deplete the pool's reserves.  
* It then calculates the input amounts (amount0In and amount1In) as the difference between the initial reserves and the new balances after the swap.  
* The contract ensures that the trade maintains the constant product invariant (k) after accounting for a 0.3% fee (balanceAdjusted0 and balanceAdjusted1 calculations).  
* The \_update function is called to update the pool's reserves with the new balances.  
* Tokens are transferred to the recipient's address to.  
* If there is callback data (data), it calls the uniswapV2Call function on the recipient address, which can be used for more complex interactions like flash swaps.  
* The Swap event is emitted right after calculating the input and output amounts and before updating the reserves. The Swap event logs the sender, the amounts of tokens coming in and going out of the pool, and the recipient of the tokens.

This logic encapsulates the essence of a swap transaction in Uniswap V2, balancing the pool's reserves to maintain the constant product while facilitating token exchanges.

We will be mostly interested in Swap events to monitor the blockchain activity and run Reactive Contracts based on it. Since the code of the pool smart contract does not change, most of the information that is different for every transaction is being logged in the event. So let’s talk a bit more about the two types of events we’ll be most interested in: Swap and Sync.

## **Events in Uniswap V2**

### **Swap**

The Swap event is emitted every time a trade occurs in a Uniswap V2 pool. It provides vital information about the transaction, such as the number of tokens involved in the swap and the addresses of the trader and recipient.

Event structure example:

event Swap(

address indexed sender,

uint amount0In,

uint amount1In,

uint amount0Out,

uint amount1Out,

address indexed to

);

In this event:

* sender is the address that initiated the swap.  
* amount0In and amount1In are the amounts of the respective tokens that were sent to the pool.  
* amount0Out and amount1Out are the amounts of the respective tokens that were sent from the pool.  
* to is the address that receives the output tokens.

You can see this event in [the list of the events](https://etherscan.io/tx/0x7b969e8a74ae9891e322311ca5fe6e5d7bcb53ac3412b4189d84683961043503#eventlog) in this transaction on Etherscan.

### **Sync**

The Sync event is emitted whenever the reserves of a Uniswap V2 pool are updated. This event occurs after a swap when liquidity is added or removed, or when there's a direct token transfer into or out of the pool. The Sync event helps keep track of the pool's reserves current state.

Event Structure Example:

event Sync(uint112 reserve0, uint112 reserve1);

In this event:

* reserve0 and reserve1 represent the updated reserves of the pool's two tokens.

The Sync event is critical for maintaining up-to-date information on the pool's liquidity, which in turn affects trading price and slippage. You can see this event in [the list of the events](https://etherscan.io/tx/0x7b969e8a74ae9891e322311ca5fe6e5d7bcb53ac3412b4189d84683961043503#eventlog) in this transaction on Etherscan.

## **Conclusion**

In this article, we’ve explored the fundamentals of Uniswap V2, a cornerstone of DeFi that facilitates automated trading through liquidity pools and smart contracts. Key takeaways include:

* **Uniswap V2 Pools:** These pools, consisting of two tokens, enable seamless trading and liquidity provisioning without traditional market makers. Each transaction is governed by the Constant Product Market Maker model, which maintains the balance of liquidity in the pool.  
* **Constant Product Formula:** The formula (x \* y \= k) ensures that the product of the quantities of the two tokens remains constant, allowing for dynamic pricing based on trading activity.  
* **Swap and Sync Events:** The Swap event provides detailed information about trades, including token amounts and addresses, while the Sync event keeps track of reserve updates. These events are crucial for monitoring and integrating Uniswap activity with Reactive Contracts.  
* **Code Mechanics:** The provided code example illustrates the core functionality of the swap function in Uniswap V2, demonstrating how the contract maintains liquidity and ensures accurate token swaps.

For practical applications and further insights into integrating Uniswap V2 with your projects, explore our [use cases](https://dev.reactive.network/education/use-cases) and join our [Telegram](https://t.me/reactivedevs) group to engage with the community.

# **Lesson 7: Implementing Basic Reactive Functions**

## **Overview**

In this lesson, we’ll go through the Reactive Contract (RC) specifically designed for the Uniswap V2 platform, aimed at executing stop orders based on predefined conditions. By the end of this lesson, you’ll know:

* That RCs are pretty similar to Ethereum smart contracts and thus easy to understand.  
* What each part of the stop-order reactive contract means.  
* How this reactive contract is executed and what it does.

## **Contract**

The [UniswapDemoStopOrderReactive](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/uniswap-v2-stop-order/UniswapDemoStopOrderReactive.sol) contract is set up to monitor liquidity pool events on Uniswap V2, namely tracking the Sync events to determine when the conditions for a stop order are met. When these conditions are triggered, it executes a callback transaction on the Ethereum blockchain to perform the stop order.

## **Key Components**

### **Event Declarations**

Event Declarations: Events like Subscribed, VM, AboveThreshold, CallbackSent, and Done are used for logging and tracking the contract's operations on the blockchain.

// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity \>=0.8.0;

import '../../../lib/reactive-lib/src/interfaces/IReactive.sol';

import '../../../lib/reactive-lib/src/abstract-base/AbstractReactive.sol';

   struct Reserves {

       uint112 reserve0;

       uint112 reserve1;

   }

contract UniswapDemoStopOrderReactive is IReactive, AbstractReactive {

   event Subscribed(

       address indexed service\_address,

       address indexed \_contract,

       uint256 indexed topic\_0

   );

   event VM();

   event AboveThreshold(

       uint112 indexed reserve0,

       uint112 indexed reserve1,

       uint256 coefficient,

       uint256 threshold

   );

   event CallbackSent();

   event Done();

### **Contract Variables**

UNISWAP\_V2\_SYNC\_TOPIC\_0 and STOP\_ORDER\_STOP\_TOPIC\_0 are constants representing the topics for Uniswap's Sync events and the contract's Stop events, respectively. CALLBACK\_GAS\_LIMIT is the gas limit set for the callback transaction. Variables like triggered, done, pair, stop\_order, client, token0, coefficient, and threshold store the state and configuration of the stop order.

   uint256 private constant SEPOLIA\_CHAIN\_ID \= 11155111;

   uint256 private constant UNISWAP\_V2\_SYNC\_TOPIC\_0 \= 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1;

   uint256 private constant STOP\_ORDER\_STOP\_TOPIC\_0 \= 0x9996f0dd09556ca972123b22cf9f75c3765bc699a1336a85286c7cb8b9889c6b;

   uint64 private constant CALLBACK\_GAS\_LIMIT \= 1000000;

   // State specific to ReactVM instance of the contract.


   bool private triggered;

   bool private done;

   address private pair;

   address private stop\_order;

   address private client;

   bool private token0;

   uint256 private coefficient;

   uint256 private threshold;

## **Contract Logic**

### **Constructor**

The constructor initializes the contract by storing references to the Uniswap V2 pair (\_pair), the stop-order contract (\_stop\_order), and the client (\_client). It also records a boolean flag (\_token0), which indicates whether this contract is managing token0 or token1, and sets the coefficient and threshold parameters that handle its behavior.

After these values are stored, the contract subscribes to the Uniswap V2 pair and stop-order contract events, but only if it is not operating in a reactVM instance. Subscribing to these events ensures the contract will be notified of any relevant updates, specifically UNISWAP\_V2\_SYNC\_TOPIC\_0 from the Uniswap pair and STOP\_ORDER\_STOP\_TOPIC\_0 from the stop-order contract.

   constructor(

       address \_pair,

       address \_stop\_order,

       address \_client,

       bool \_token0,

       uint256 \_coefficient,

       uint256 \_threshold

   ) payable {

       triggered \= false;

       done \= false;

       pair \= \_pair;

       stop\_order \= \_stop\_order;

       client \= \_client;

       token0 \= \_token0;

       coefficient \= \_coefficient;

       threshold \= \_threshold;

       if (\!vm) {

           service.subscribe(

               SEPOLIA\_CHAIN\_ID,

               pair,

               UNISWAP\_V2\_SYNC\_TOPIC\_0,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE

           );

           service.subscribe(

               SEPOLIA\_CHAIN\_ID,

               stop\_order,

               STOP\_ORDER\_STOP\_TOPIC\_0,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE,

               REACTIVE\_IGNORE

           );

       }

   }

### **react() Function**

The react() function processes incoming blockchain events and determines if actions need to be triggered based on the event type:

**Stop-Order Events**: If the event originates from the stop-order contract, the function verifies that the event matches the expected topics and addresses (pair and client). Once confirmed and if the stop order has already been triggered (triggered \= true), the contract marks the operation as completed (done \= true) and emits the Done event.

**Uniswap Pair Sync Events**: For events originating from the Uniswap pair contract (specifically Sync events), the function decodes the reserves data to check if the conditions for triggering the stop-order are met. This check is performed using the below\_threshold function, which calculates whether the reserve ratio falls below the defined threshold. If the condition is satisfied, the contract emits a CallbackSent event, prepares the callback payload, sets triggered \= true, and emits a Callback event to execute the stop order.

   // Methods specific to ReactVM instance of the contract.

   function react(LogRecord calldata log) external vmOnly {

       assert(\!done);

       if (log.\_contract \== stop\_order) {

           if (

               triggered &&

               log.topic\_0 \== STOP\_ORDER\_STOP\_TOPIC\_0 &&

               log.topic\_1 \== uint256(uint160(pair)) &&

               log.topic\_2 \== uint256(uint160(client))

           ) {

               done \= true;

               emit Done();

           }

       } else {

           Reserves memory sync \= abi.decode(log.data, ( Reserves ));

           if (below\_threshold(sync) && \!triggered) {

               emit CallbackSent();

               bytes memory payload \= abi.encodeWithSignature(

                   "stop(address,address,address,bool,uint256,uint256)",

                   address(0),

                   pair,

                   client,

                   token0,

                   coefficient,

                   threshold

               );

               triggered \= true;

               emit Callback(log.chain\_id, stop\_order, CALLBACK\_GAS\_LIMIT, payload);

           }

       }

   }

### **below\_threshold() Function**

The below\_threshold() function checks whether the current reserves in the Uniswap pool satisfy the conditions for executing a stop order. It compares the reserve ratio to a predefined threshold based on the selected token (either token0 or token1).

If token0 is selected, the function checks if the ratio of reserve1 to reserve0, multiplied by a coefficient, is less than or equal to the threshold. If token0 is not selected, the function checks if the ratio of reserve0 to reserve1, multiplied by the coefficient, is less than or equal to the threshold.

   function below\_threshold(Reserves memory sync) internal view returns (bool) {

       if (token0) {

           return (sync.reserve1 \* coefficient) / sync.reserve0 \<= threshold;

       } else {

           return (sync.reserve0 \* coefficient) / sync.reserve1 \<= threshold;

       }

   }

## **Execution Flow**

**Initialization**: Upon deployment, the contract subscribes to the necessary events from the Uniswap V2 pair and the stop order callback contract.

**Event Monitoring**: The contract listens for Sync events from the Uniswap pair to monitor the pool's reserve changes andStop events from the stop-order contract to track the execution of orders.

**Stop Order Activation**: When the Sync event indicates that the pool's price hits the threshold, the contract initiates the stop order through the callback function, executing a trade on Uniswap V2.

**Completion**: After the stop order is executed, the contract captures the Stop event from the stop-order contract, marking the process as complete.

## **Conclusion**

In this article, we’ve examined the implementation of a Reactive Contract (RC) for managing stop orders on the Uniswap V2 platform. Key takeaways include:

* **Similarity to Ethereum Smart Contracts:** RCs are conceptually similar to Ethereum smart contracts, making them accessible for those familiar with Ethereum's architecture.  
* **Contract Components:** We reviewed the key elements of the stop-order reactive contract, including event declarations, contract variables, and the logic behind the react() and below\_threshold() functions.  
* **Execution Flow:** The contract’s lifecycle involves subscribing to relevant events, monitoring Uniswap V2 pool reserves, triggering stop orders when conditions are met, and capturing completion events to finalize the process.

For a deeper look into practical applications, explore the [Uniswap Stop Order](https://dev.reactive.network/education/use-cases/use-case-3) use case and consider experimenting with these concepts in your own projects. Join our [Telegram](https://t.me/reactivedevs) group to engage with the community.

## **Overview**

The ReactVM is a specialized Ethereum Virtual Machine (EVM) within the Reactive Network, designed to execute [Reactive Contracts](https://dev.reactive.network/reactive-contracts) (RCs). It allows transactions to occur in random order across multiple threads while maintaining order within each ReactVM.

Technically, ReactVM is an isolated execution environment that activates when an event matches an RC's subscription. Although this approach introduces some overhead, we've optimized the process by separating the EVM from Geth, reducing ReactVm's boot time to approximately 100 microseconds. This overhead is insignificant relative to the network's processing capabilities.

## **My ReactVM**

When you deploy a Reactive Contract, it is assigned to a ReactVM. The ReactVM's address will match the Externally Owned Account (EOA) address used for the deployment. All smart contracts deployed to the Reactive Network will ultimately reside within your personal ReactVM, enabling shared state and interaction among contracts. Although multiple RCs can be deployed within a single ReactVM, this practice is generally discouraged.

### **Calling subscribe()**

Invoking subscribe() or unsubscribe() within an RVM will not have any tangible effect. For interactions, use callbacks instead of directly calling these functions within RVMs.

## **State**

The Reactive Network's state is determined by the collective states of individual ReactVMs and their connections to external blockchains. Each ReactVM's state is tied to specific block numbers and hashes from these chains, embedded within ReactVM blocks. This linkage is necessary for tracking and managing reorgs in the originating chains, enabling the network to respond to changes.

### **Dual-State Environment**

The Reactive Network operates within a dual-state environment that supports parallel transaction execution. While the EVM processes commands sequentially in a single-threaded manner, ReactVMs can operate independently and in parallel across different cores or threads. This architecture facilitates the management of various operations, including fund flows and token management, with each contract copy having its own state and execution context.

Each [Reactive Contract](https://dev.reactive.network/reactive-contracts) has two instances with different states, both initialized in the constructor:

     **ReactVM State**: Updates when an event occurs.

     **Reactive Network State**: Updates when you manually call its functions.

For example, in a governance contract, vote counts are maintained in the ReactVM state, whereas operational commands like pause() are part of the Reactive Network state. The primary logic resides within the ReactVM state.

## **Reactive Network Processing Flow**

The following diagram illustrates a process involving the interaction between an Origin Chain, the Reactive Network along with ReactVM, and a Destination Chain.

![Reactive Network Lifecycle][image6]

## **Overview**

This section covers RVM transaction payments, including direct transfers and system contract deposits. It also explains callback payments, on-the-spot settlements, and the pricing model for callbacks.

## **RVM Transactions**

RVM transactions have no gas price or any monetary value. Payments occur post-factum in a later block (ideally the next one, but not guaranteed). The fee appears only then, determined by the base fee of that block. Reactscan can't directly link this fee to specific RVM transactions.

**Max Gas Limit**

The maximum gas limit for RVM transactions is 900,000 units.

An RVM transaction happens in block *n*, while accounting occurs in block *n+1* (or later) using that block’s base fee. However, it’s impossible to trace which specific RVM transaction was accounted for, as the block aggregates all transactions without distinction.

The Reactive Transaction Fee is determined by the formula:

fee=BaseFee⋅GasUsed

*fee*\=*BaseFee*⋅*GasUsed*

Where:

* BaseFee: Base fee per unit of gas in the block header, ensuring alignment with the network's current pricing conditions.  
* GasUsed: Actual gas consumed by the reactive transaction during execution.

**Reactive Network Transactions**

RNK transactions operate the same way as standard EVM transactions.

### **Direct Transfers**

All RVM transactions must be paid in REACT by transferring funds to a specific reactive contract. A direct payment can be made as follows:

cast send $CONTRACT\_ADDR \--rpc-url $REACTIVE\_RPC \--private-key $REACTIVE\_PRIVATE\_KEY \--value 0.1ether

After funding the contract, you must settle any outstanding debt using the coverDebt() method:

cast send \--rpc-url $REACTIVE\_RPC \--private-key $REACTIVE\_PRIVATE\_KEY $CONTRACT\_ADDR "coverDebt()"

**Contract Status**

The contract's status is available on [Reactive Scan](https://reactscan.net/) under its dedicated RVM. If active, it will execute transactions normally. If inactive, outstanding debt must be settled.

### **Depositing via System Contract**

The depositTo() method allows funding through the system contract. The transaction fee is covered by the sender (EOA), and the system contract automatically settles any debt, eliminating the need to call coverDebt().

cast send \--rpc-url $REACTIVE\_RPC \--private-key $REACTIVE\_PRIVATE\_KEY $SYSTEM\_CONTRACT\_ADDR "depositTo(address)" $CONTRACT\_ADDR \--value 0.1ether

**System Contract**

On the Reactive Network, the system contract and callback proxy share the same address: 0x0000000000000000000000000000000000fffFfF.

## **Callback Pricing**

Callback pricing dynamically adjusts based on block base fees. The cost, 

pcallback

*p*

*callback*

​

, is calculated as follows:

pcallback=pbase⋅C⋅(gcallback+K)

*p*

*callback*

​

\=*p*

*base*

​

⋅*C*⋅(*g*

*callback*

​

\+*K*)

Where:

* pbase  
* *p*  
* *base*  
* ​  
* : Base gas price, determined by tx.gasprice and block.basefee.  
* C  
* *C*: Pricing coefficient specific to the destination network.  
* gcallback  
* *g*  
* *callback*  
* ​  
* : Gas consumed during callback execution.  
* K  
* *K*: Fixed gas surcharge for the destination network.

## **Callback Payment**

Callbacks require the same payment mechanism as reactive transactions. If a contract fails to pay, it is blocklisted, preventing future callbacks and transactions.

**Callback Gas Limit**

The Reactive Network enforces a minimum callback gas limit of 100,000 gas. Callback requests below this threshold are ignored, as this minimum ensures sufficient gas for internal audits and computations required to process the callback.

### **Direct Transfers**

To directly fund your callback contract:

cast send $CALLBACK\_ADDR \--rpc-url $DESTINATION\_RPC \--private-key $DESTINATION\_PRIVATE\_KEY \--value 0.1ether

Then, settle any outstanding debt with coverDebt():

cast send \--rpc-url $DESTINATION\_RPC \--private-key $DESTINATION\_PRIVATE\_KEY $CALLBACK\_ADDR "coverDebt()"

### **Depositing via Callback Proxy**

The depositTo() method allows callback contracts to be funded via the callback proxy. The fee is covered by the sender (EOA), and the proxy automatically settles any debt.

cast send \--rpc-url $DESTINATION\_RPC \--private-key $DESTINATION\_PRIVATE\_KEY $CALLBACK\_PROXY\_ADDR "depositTo(address)" $CALLBACK\_ADDR \--value 0.1ether

**On-The-Spot Payment**

Implementing the pay() method or inheriting from AbstractPayer enables automatic settlement. The callback proxy triggers pay() when a callback results in contract debt. The standard implementation verifies the caller is the proxy, checks for sufficient funds, and then settles the debt.

## **Callback Contract Balance**

### **Contract Balance**

To retrieve the balance of a callback contract, run:

cast balance $CONTRACT\_ADDR \--rpc-url $DESTINATION\_RPC

### **Contract Debt**

To query the debt of a callback contract as recorded by the callback proxy, run:

cast call $CALLBACK\_PROXY\_ADDR "debts(address)" $CONTRACT\_ADDR \--rpc-url $DESTINATION\_RPC | cast to-dec

### **Contract Reserves**

To retrieve the reserve amount of a callback contract held by the callback proxy, run:

cast call $CALLBACK\_PROXY\_ADDR "reserves(address)" $CONTRACT\_ADDR \--rpc-url $DESTINATION\_RPC | cast to-dec

## **Reactive Balance**

### **Contract Balance**

To retrieve the balance of a reactive contract in REACT, run:

cast balance $CONTRACT\_ADDR \--rpc-url $REACTIVE\_RPC

### **Contract Debt**

To query the debt of a reactive contract as recorded by the system contract, run:

cast call $SYSTEM\_CONTRACT\_ADDR "debts(address)" $CONTRACT\_ADDR \--rpc-url $REACTIVE\_RPC | cast to-dec

### **Contract Reserves**

To retrieve the reserve amount of a reactive contract held by the system contract, run:

cast call $SYSTEM\_CONTRACT\_ADDR "reserves(address)" $CONTRACT\_ADDR \--rpc-url $REACTIVE\_RPC | cast to-dec

## **Overview**

Reactive Mainnet is a proof-of-stake blockchain for the Reactive Network. Lasna Testnet serves as a testing environment, allowing developers to test and refine features before deploying them on the mainnet.

**System Contract**

Reactive Mainnet and Lasna Testnet use the same system contract address: 0x0000000000000000000000000000000000fffFfF

## **Reactive Mainnet**

* Network Name — Reactive Mainnet  
* RPC URL — [https://mainnet-rpc.rnk.dev/](https://mainnet-rpc.rnk.dev/)  
* Chain ID — 1597  
* Currency Symbol — REACT  
* Block Explorer URL — [https://reactscan.net/](https://reactscan.net/)

Connect to Mainnet  
---

## **Get Testnet REACT**

To receive testnet REACT, send SepETH to the Reactive faucet contract on Ethereum Sepolia: 0x9b9BB25f1A81078C544C829c5EB7822d747Cf434. The factor is 1/100, meaning you get 100 REACT for 1 SepETH sent. You can use MetaMask or any compatible wallet for the transfer.

**Important**

Do not send more than 5 SepETH per request, as doing so will cause you to lose the excess amount without receiving any additional REACT. The maximum that should be sent in a single transaction is 5 SepETH, which will yield 500 REACT.

Alternatively, call the request(address) method on the Reactive faucet contract:

cast send 0x9b9BB25f1A81078C544C829c5EB7822d747Cf434 \--rpc-url $SEPOLIA\_RPC \--private-key $SEPOLIA\_PRIVATE\_KEY "request(address)" $CONTRACT\_ADDR \--value 0.1ether

## **Lasna Testnet**

* Network Name — Reactive Lasna  
* RPC URL — [https://lasna-rpc.rnk.dev/](https://lasna-rpc.rnk.dev/)  
* Chain ID — 5318007  
* Currency Symbol — REACT  
* Block Explorer URL — [https://lasna.reactscan.net](https://lasna.reactscan.net/)

Connect to Lasna Testnet

## **Overview**

[Reactive Library](https://github.com/Reactive-Network/reactive-lib) is a set of abstract contracts and interfaces that reduce boilerplate by integrating common functionalities. Run the following command in your project to install the library:

forge install Reactive-Network/reactive-lib

## **Abstract Contracts**

### **AbstractCallback**

[AbstractCallback](https://github.com/Reactive-Network/reactive-lib/blob/main/src/abstract-base/AbstractCallback.sol) extends AbstractPayer and provides a callback system. It initializes a specific rvm\_id and a vendor in the constructor to enable callback functionality. The rvm\_id ensures that only an authorized RVM ID can invoke certain functions, enforced by the rvmIdOnly modifier.

modifier rvmIdOnly(address \_rvm\_id) {

       require(rvm\_id \== address(0) || rvm\_id \== \_rvm\_id, 'Authorized RVM ID only');

       \_;

}

The constructor accepts the Callback Proxy address (\_callback\_sender), which is assigned to the vendor variable. The rvm\_id is initialized as the address deploying the contract (msg.sender). The constructor also authorizes the \_callback\_sender by interacting with AbstractPayer.

constructor(address \_callback\_sender) {

   rvm\_id \= msg.sender;

   vendor \= IPayable(payable(\_callback\_sender));

   addAuthorizedSender(\_callback\_sender);

}

### **AbstractPausableReactive**

[AbstractPausableReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/abstract-base/AbstractPausableReactive.sol) combines functionalities from IReactive and AbstractReactive for managing pausable event subscriptions. It introduces a Subscription struct, which defines criteria for subscriptions, including chain ID, contract address, and event topics.

The contract includes mechanisms to pause and resume all active subscriptions. The pause function unsubscribes from all subscriptions retrieved through the getPausableSubscriptions function, while the resume function reactivates them. These operations are restricted to the contract owner, with access controlled by the onlyOwner modifier.

The constructor assigns the deploying address (msg.sender) as the owner and initializes the contract in an unpaused state.

constructor() {

   owner \= msg.sender;

}

The pause function ensures that only the owner can deactivate subscriptions when the contract is not already paused:

function pause() external rnOnly onlyOwner {

   require(\!paused, 'Already paused');

   Subscription\[\] memory subscriptions \= getPausableSubscriptions();

   for (uint256 ix \= 0; ix \!= subscriptions.length; \++ix) {

       service.unsubscribe(

           subscriptions\[ix\].chain\_id,

           subscriptions\[ix\].\_contract,

           subscriptions\[ix\].topic\_0,

           subscriptions\[ix\].topic\_1,

           subscriptions\[ix\].topic\_2,

           subscriptions\[ix\].topic\_3

       );

   }

   paused \= true;

}

Similarly, the resume function reactivates subscriptions when the contract is paused:

function resume() external rnOnly onlyOwner {

   require(paused, 'Not paused');

   Subscription\[\] memory subscriptions \= getPausableSubscriptions();

   for (uint256 ix \= 0; ix \!= subscriptions.length; \++ix) {

       service.subscribe(

           subscriptions\[ix\].chain\_id,

           subscriptions\[ix\].\_contract,

           subscriptions\[ix\].topic\_0,

           subscriptions\[ix\].topic\_1,

           subscriptions\[ix\].topic\_2,

           subscriptions\[ix\].topic\_3

       );

   }

   paused \= false;

}

### **AbstractPayer**

[AbstractPayer](https://github.com/Reactive-Network/reactive-lib/blob/main/src/abstract-base/AbstractPayer.sol) provides payment-related functionality for smart contracts. It manages a mapping of authorized senders and defines mechanisms for initiating payments or covering vendor debts. The authorizedSenderOnly modifier restricts payment initiation to senders explicitly authorized by the contract.

modifier authorizedSenderOnly() {

   require(senders\[msg.sender\], 'Authorized sender only');

   \_;

}

The contract includes a pay function, which allows authorized senders to transfer a specified amount, and a coverDebt function, which retrieves the outstanding debt of the contract to the vendor and attempts to settle it. The vendor is defined as an instance of the IPayable interface, enabling interactions with external systems for debt management. Payments are processed through an internal \_pay function, which validates the contract's balance before executing a transfer.

function pay(uint256 amount) external authorizedSenderOnly {

   \_pay(payable(msg.sender), amount);

}

function coverDebt() external {

   uint256 amount \= vendor.debt(address(this));

   \_pay(payable(vendor), amount);

}

function \_pay(address payable recipient, uint256 amount) internal {

   require(address(this).balance \>= amount, 'Insufficient funds');

   if (amount \> 0) {

       (bool success,) \= payable(recipient).call{value: amount}(new bytes(0));

       require(success, 'Transfer failed');

   }

}

Authorized senders are managed through addAuthorizedSender and removeAuthorizedSender functions, ensuring control over who can initiate payments.

function addAuthorizedSender(address sender) internal {

   senders\[sender\] \= true;

}

function removeAuthorizedSender(address sender) internal {

   senders\[sender\] \= false;

}

The contract also supports receiving Ether, using an empty receive function to handle direct transfers.

receive() virtual external payable {

}

### **AbstractReactive**

[AbstractReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/abstract-base/AbstractReactive.sol) extends AbstractPayer and implements IReactive, providing functionality for interacting with the Reactive Network and system contracts. It introduces two distinct operational modes: vm for reactVM and non-vm for the Reactive Network, ensuring that certain functions are executed in the appropriate mode. The vmOnly and rnOnly modifiers enforce these mode restrictions.

The contract uses an internal mechanism, detectVm(), to dynamically detect whether it is running in a ReactVM context or within the Reactive Network. This detection is based on the contract size of the SERVICE\_ADDR system contract, which is predefined and used to assign the vendor and service variables automatically. The address of SERVICE\_ADDR is set in the constructor and authorized as a sender for payment-related actions.

constructor() {

   vendor \= service \= SERVICE\_ADDR;

   addAuthorizedSender(address(SERVICE\_ADDR));

   detectVm();

}

The detectVm function inspects the size of the SERVICE\_ADDR contract to determine the current execution context, setting the vm flag accordingly:

function detectVm() internal {

   uint256 size;

   // solhint-disable-next-line no-inline-assembly

   assembly { size := extcodesize(0x0000000000000000000000000000000000fffFfF) }

   vm \= size \== 0;

}

## **Interfaces**

### **IPayable**

The [IPayable](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/IPayable.sol) interface defines functionalities for handling payments and debt management. The receive function enables contracts to accept Ether payments directly, allowing them to settle debts and resume subscriptions as necessary.

Additionally, the debt function provides a way for reactive contracts to query their outstanding debts. It takes the address of a reactive contract as input and returns the amount of debt owed, enabling precise debt tracking and efficient fund management.

interface IPayable {

   receive() external payable;


   function debt(address \_contract) external view returns (uint256);

}

### **IPayer**

The [IPayer](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/IPayer.sol) interface defines a minimal contract for managing payments within the Reactive Network. It ensures that implementing contracts can both initiate payments and accept Ether directly.

The pay() function allows the calling contract to make a payment of the specified amount. This function is external and is designed to verify the msg.sender to ensure that only authorized entities can initiate payments. The receive() function allows the implementing contract to accept Ether transfers directly. The function is automatically invoked when the contract receives Ether with no accompanying calldata.

interface IPayer {

   function pay(uint256 amount) external;

   receive() external payable;

}

### **IReactive**

The [IReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/IReactive.sol) interface extends the IPayer interface, enabling reactive contracts to integrate with the Reactive Network. It facilitates event-driven interactions by allowing contracts to subscribe to specific criteria and handle notifications for matching events. This interface defines core structures, events, and functions required for reactive contracts.

The LogRecord struct represents detailed information about an event notification. It includes metadata such as chain ID, contract address, topics, data, block details, and transaction identifiers, making it a container for event data.

struct LogRecord {

  uint256 chain\_id;

  address \_contract;

  uint256 topic\_0;

  uint256 topic\_1;

  uint256 topic\_2;

  uint256 topic\_3;

  bytes data;

  uint256 block\_number;

  uint256 op\_code;

  uint256 block\_hash;

  uint256 tx\_hash;

  uint256 log\_index;

}

The Callback event is emitted when a reactive contract is notified of a new event matching its subscription criteria. It provides key details about the event, such as the chain ID, the originating contract, the gas limit for processing the callback, and the payload data.

event Callback(

  uint256 indexed chain\_id,

  address indexed \_contract,

  uint64 indexed gas\_limit,

  bytes payload

);

The react function serves as the entry point for handling event notifications. It processes the LogRecord data associated with an event and executes the necessary logic within the contract.

function react(LogRecord calldata log) external;

### **ISubscriptionService**

The [ISubscriptionService](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/ISubscriptionService.sol) interface extends IPayable and provides methods for reactive contracts to create or remove subscriptions, specifying detailed criteria for the events they want to monitor.

The subscribe() function enables a contract to subscribe to receive events that match specified criteria.

function subscribe(

   uint256 chain\_id,

   address \_contract,

   uint256 topic\_0,

   uint256 topic\_1,

   uint256 topic\_2,

   uint256 topic\_3

) external;

The unsubscribe function removes an existing subscription matching the specified criteria, if one exists.

function unsubscribe(

   uint256 chain\_id,

   address \_contract,

   uint256 topic\_0,

   uint256 topic\_1,

   uint256 topic\_2,

   uint256 topic\_3

) external;

### **ISystemContract**

The [ISystemContract](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/ISystemContract.sol) interface acts as an integrative contract that combines the functionalities of IPayable and ISubscriptionService. It represents a system-level abstraction within the Reactive Network, designed to handle payments and manage event subscriptions for reactive contracts.

import './IPayable.sol';

import './ISubscriptionService.sol';

interface ISystemContract is IPayable, ISubscriptionService {

}

## **System Contract**

The Reactive Network’s key operations are managed by three core contracts:

[System Contract](https://github.com/Reactive-Network/system-smart-contracts/blob/main/src/SystemContract.sol) oversees:

* Payments: Handles service payments for reactive contracts.  
* Access Control: Manages contract whitelisting/blacklisting.  
* Cron Events: Triggers periodic block interval actions.

[Callback Proxy](https://github.com/Reactive-Network/system-smart-contracts/blob/main/src/CallbackProxy.sol) ensures interactions with:

* Callback Management: Restricted to authorized senders.  
* Payment & Reserves: Manages deposits, reserves, and debts.  
* Gas Adjustment & Kickbacks: Calculates gas prices and rewards originators.  
* Access Control: Tracks authorized contracts, emitting whitelist/blacklist updates.

[AbstractSubscriptionService](https://github.com/Reactive-Network/system-smart-contracts/blob/main/src/AbstractSubscriptionService.sol) manages event subscriptions with:

* Flexible Criteria: Subscribes/unsubscribes based on chain ID, address, or topics.  
* Recursive Tracking: Supports complex criteria structures.  
* Wildcard Support: Uses REACTIVE\_IGNORE for broader matches.  
* Event Emissions: Tracks subscription updates, including deployer events.

### **CRON Functionality**

The SystemContract has a built-in cron mechanism that enables time-based automation by emitting events at fixed block intervals. Instead of running continuous on-chain checks, nodes listen for these predictable signals and create transactions to invoke the appropriate cron function when triggered. This native scheduling layer simplifies the creation of automated workflows, on-chain triggers, and off-chain watchers.

To maintain the reliability and predictability of this mechanism, only authorized validator root addresses are permitted to trigger the relevant functions.

Each call to cron() emits one or more Cron events based on the divisibility of the provided block number. This forms a pyramid of timing signals, growing less frequent as the interval increases. Each event includes a single parameter: number, representing the current block number.

| Event | Interval | Approx. Time | Topic0 |
| :---: | :---: | :---: | :---: |
| Cron1 | Every block | \~7 seconds | 0xf02d6ea5c22a71cffe930a4523fcb4f129be6c804db50e4202fb4e0b07ccb514 |
| Cron10 | Every 10 blocks | \~1 minute | 0x04463f7c1651e6b9774d7f85c85bb94654e3c46ca79b0c16fb16d4183307b687 |
| Cron100 | Every 100 blocks | \~12 minutes | 0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70 |
| Cron1000 | Every 1000 blocks | \~2 hours | 0xe20b31294d84c3661ddc8f423abb9c70310d0cf172aa2714ead78029b325e3f4 |
| Cron10000 | Every 10,000 blocks | \~28 hours | 0xd214e1d84db704ed42d37f538ea9bf71e44ba28bc1cc088b2f5deca654677a56 |

## **Overview**

In the Reactive Network, reactive contracts operate within isolated environments known as [ReactVMs](https://dev.reactive.network/reactvm). These contracts can process incoming events, create transactions on destination chains, and use callbacks to communicate between networks.

## **Event Processing**

To handle incoming events, a reactive contract must implement the [IReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/IReactive.sol) interface.

pragma solidity \>=0.8.0;

import './IPayer.sol';

interface IReactive is IPayer {

   struct LogRecord {

       uint256 chain\_id;

       address \_contract;

       uint256 topic\_0;

       uint256 topic\_1;

       uint256 topic\_2;

       uint256 topic\_3;

       bytes data;

       uint256 block\_number;

       uint256 op\_code;

       uint256 block\_hash;

       uint256 tx\_hash;

       uint256 log\_index;

   }

   event Callback(

       uint256 indexed chain\_id,

       address indexed \_contract,

       uint64 indexed gas\_limit,

       bytes payload

   );


   function react(LogRecord calldata log) external;

}

The Reactive Network feeds events matching a contract's subscriptions by triggering this method. Reactive contracts can access all EVM capabilities but are limited to executing within a private ReactVM tied to the deployer's address, preventing interaction with contracts deployed by others. Below is the react() function of the [Basic Reactive Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/basic):

// State specific to reactive network instance of the contract

address private \_callback;

// State specific to ReactVM instance of the contract

uint256 public counter;

function react(LogRecord calldata log) external vmOnly {

   emit Event(

       log.chain\_id,

       log.\_contract,

       log.topic\_0,

       log.topic\_1,

       log.topic\_2,

       log.topic\_3,

       log.data,

       \++counter

   );

   if (log.topic\_3 \>= 0.01 ether) {

       bytes memory payload \= abi.encodeWithSignature("callback(address)", address(0));

       emit Callback(log.chain\_id, \_callback, GAS\_LIMIT, payload);

   }

}

[More on Events →](https://dev.reactive.network/education/module-1/how-events-work)

## **Callbacks to Destination Chains**

Reactive contracts can initiate transactions on destination chains by emitting structured log records. The format of the log event is as follows:

event Callback(

   uint256 indexed chain\_id,

   address indexed \_contract,

   uint64 indexed gas\_limit,

   bytes payload

);

When the Reactive Network detects this event in the transaction trace, it submits a new transaction to the specified destination network, using the chain\_id.

**Authorization**

The Reactive Network automatically replaces the first 160 bits of the call arguments in the payload with the ReactVM ID (equivalent to the contract deployer's address). As a result, the first argument in your callback will always be the ReactVM address (of type address), regardless of the variable name you use in your Solidity code. This ensures that the transaction is authorized and tied to the correct contract within the network.

### **Example: Uniswap Stop Order Demo**

Here’s how the Uniswap Stop Order Demo uses this feature:

bytes memory payload \= abi.encodeWithSignature(

   "stop(address,address,address,bool,uint256,uint256)",

   address(0),

   pair,

   client,

   token0,

   coefficient,

   threshold

);

emit Callback(chain\_id, stop\_order, CALLBACK\_GAS\_LIMIT, payload);

The payload encodes the function signature and parameters needed for the stop order. The Callback event is emitted with the destination chain ID, target contract, gas limit, and the constructed payload.

## **Overview**

This section explains how to configure and manage subscriptions in a reactive contract within the Reactive Network. It covers the basics of setting up subscriptions in the contract's constructor, handling dynamic subscriptions through callbacks, and applying filtering criteria like chain ID, contract address, and event topics.

## **Subscription Basics**

In a reactive contract, subscriptions are established by invoking the subscribe() method of the Reactive Network's [system contract](https://dev.reactive.network/economy). This method is typically called in the contract's constructor() or dynamically via a callback (see [Dynamic Subscriptions](https://dev.reactive.network/subscriptions#dynamic-subscriptions)).

Since deployments occur both on the Reactive Network and in the deployer's private ReactVM, where the system contract is not present, the reactive contract must handle potential reverts. [IReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/IReactive.sol), [AbstractReactive](https://github.com/Reactive-Network/reactive-lib/blob/main/src/abstract-base/AbstractReactive.sol), and [ISystemContract](https://github.com/Reactive-Network/reactive-lib/blob/main/src/interfaces/ISystemContract.sol) should be implemented. Here's a subscription example in the constructor, taken from the [Basic Demo reactive contract](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/basic/BasicDemoReactiveContract.sol).

uint256 public originChainId;

uint256 public destinationChainId;

uint64 private constant GAS\_LIMIT \= 1000000;

address private callback;

constructor(

   address \_service,

   uint256 \_originChainId,

   uint256 \_destinationChainId,

   address \_contract,

   uint256 \_topic\_0,

   address \_callback

) payable {

   service \= ISystemContract(payable(\_service));

   originChainId \= \_originChainId;

   destinationChainId \= \_destinationChainId;

   callback \= \_callback;

   if (\!vm) {

       service.subscribe(

           originChainId,

           \_contract,

           \_topic\_0,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE

       );

   }

}

The Reactive Network uses the subscription system to link various uint256 fields to specific events. Subscribers can then filter events based on exact matches of these fields.

**Filtering Criteria**

The Reactive Network provides filtering criteria based on the originating contract's chain ID, address, and all four topics.

### **Using 'REACTIVE\_IGNORE' and '0'**

REACTIVE\_IGNORE is an arbitrary predefined value 0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad that allows you to subscribe to any topic.

address(0) can be used for contract address and uint256(0) for chain ID to match any value. Ensure at least one criterion is specific to create a meaningful subscription.

### **Subscription Examples**

**All Events from a Specific Contract**: Subscribe to all events from 0x7E0987E5b3a30e3f2828572Bb659A548460a3003.

service.subscribe(CHAIN\_ID, 0x7E0987E5b3a30e3f2828572Bb659A548460a3003, REACTIVE\_IGNORE, REACTIVE\_IGNORE, REACTIVE\_IGNORE, REACTIVE\_IGNORE)

**Specific Topic 0**: Subscribe to all Uniswap V2 Sync events.

service.subscribe(CHAIN\_ID, 0, 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1, REACTIVE\_IGNORE, REACTIVE\_IGNORE, REACTIVE\_IGNORE)

**Specific Contract with Specific Topic 0**: Subscribe to events from 0x7E0987E5b3a30e3f2828572Bb659A548460a3003 with topic 0 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1.

service.subscribe(CHAIN\_ID, 0x7E0987E5b3a30e3f2828572Bb659A548460a3003, 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1, REACTIVE\_IGNORE, REACTIVE\_IGNORE, REACTIVE\_IGNORE)

**Multiple Independent Subscriptions**: Call the subscribe() method multiple times in the constructor to create multiple independent subscriptions.

uint256 public originChainId;

uint256 public destinationChainId;

uint64 private constant GAS\_LIMIT \= 1000000;

address private callback;

constructor(

   address \_service,

   uint256 \_originChainId,

   uint256 \_destinationChainId,

   address \_contract1,

   uint256 \_topic0,

   address \_contract2,

   uint256 \_topic1,

   address \_callback

) payable {

   service \= ISystemContract(payable(\_service));

   originChainId \= \_originChainId;

   destinationChainId \= \_destinationChainId;

   callback \= \_callback;

   if (\!vm) {

       // First subscription

       service.subscribe(

           originChainId,

           \_contract1,

           \_topic0,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE

       );

       // Second subscription

       service.subscribe(

           originChainId,

           \_contract2,

           REACTIVE\_IGNORE,

           \_topic1,

           REACTIVE\_IGNORE,

           REACTIVE\_IGNORE

       );

   }

}

### **Unsubscribing via System Contract**

There may be situations where a reactive contract needs to stop listening to a particular topic — such as for revoking automation, optimizing gas usage, or replacing an outdated listener. To do this, you need to invoke the unsubscribeContract() function on the system contract by executing the command given below.

First, export the REACTIVE\_IGNORE constant, which is used as a wildcard value when you want to ignore certain topic parameters:

export REACTIVE\_IGNORE\=0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad

If you're only interested in unsubscribing from a contract with a specific topic0 and don't care about the values of topic1, topic2, or topic3, use REACTIVE\_IGNORE in those positions:

cast send \--rpc-url $REACTIVE\_RPC \\

 \--private-key $REACTIVE\_PRIVATE\_KEY \\

 $SYSTEM\_CONTRACT\_ADDR \\

 "unsubscribeContract(address,uint256,address,uint256,uint256,uint256,uint256)" \\

 $REACTIVE\_CONTRACT\_ADDR \\

 $ORIGIN\_CHAIN\_ID \\

 $ORIGIN\_CONTRACT \\

 $TOPIC\_0 \\

 $REACTIVE\_IGNORE \\

 $REACTIVE\_IGNORE \\

 $REACTIVE\_IGNORE

### **Prohibited Subscriptions**

**Non-Equality Operations**: Subscriptions can’t match event parameters using less than (\<), greater than (\>), range, or bitwise operations. Only strict equality is supported.

**Complex Criteria Sets**: Subscriptions can’t use disjunction or sets of criteria within a single subscription. While calling the subscribe() method multiple times can achieve similar results, it may lead to combinatorial explosion.

**Single Chain and All Contracts**: Subscribing to events from all chains or all contracts simultaneously is not allowed. Subscribing to all events from only one chain is also prohibited, as it is considered unnecessary.

**Duplicate Subscriptions**: While duplicate subscriptions are technically allowed, they function as a single subscription. Users are charged for each transaction sent to the system contract. Preventing duplicates in the system contract is costly due to EVM storage limitations, so duplicate subscriptions are permitted to keep costs manageable.

## **Dynamic Subscriptions**

Subscriptions in the Reactive Network are managed through the system contract, which is accessible only from the network. Events are sent to the ReactVM's contract copy, which has no direct access to the system contract. Therefore, dynamic subscriptions and unsubscriptions based on incoming events must be handled via callbacks.

The react() method from the [reactive contract](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/approval-magic/ApprovalListener.sol) of the [Approval Magic demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/approval-magic) processes incoming events and checks if topic\_0 indicates a subscribe or unsubscribe event. If so, it generates a callback to the Reactive Network to manage the subscription.

### **Subscribing & Unsubscribing**

These functions allow the contract to subscribe or unsubscribe a subscriber address to/from the APPROVAL\_TOPIC\_0 in the Reactive Network.

   // Methods specific to reactive network contract instance

   function subscribe(address rvm\_id, address subscriber) external rnOnly callbackOnly(rvm\_id) {

       service.subscribe(

           SEPOLIA\_CHAIN\_ID,

           address(0),

           APPROVAL\_TOPIC\_0,

           REACTIVE\_IGNORE,

           uint256(uint160(subscriber)),

           REACTIVE\_IGNORE

       );

   }

   function unsubscribe(address rvm\_id, address subscriber) external rnOnly callbackOnly(rvm\_id) {

       service.unsubscribe(

           SEPOLIA\_CHAIN\_ID,

           address(0),

           APPROVAL\_TOPIC\_0,

           REACTIVE\_IGNORE,

           uint256(uint160(subscriber)),

           REACTIVE\_IGNORE

       );

   }

**Parameters**:

* rvm\_id: The ID of the reactive virtual machine (RVM).  
* subscriber: The address that will be subscribed or unsubscribed.

**Operations**:

* subscribe: Registers a subscriber to the APPROVAL\_TOPIC\_0.  
* unsubscribe: Removes a subscriber from the APPROVAL\_TOPIC\_0.

### **react Function & Logic**

The function processes incoming log records from the ReactVM and executes different actions based on the topic in the log.

// Methods specific to ReactVM contract instance

   function react(LogRecord calldata log) external vmOnly {

       if (log.topic\_0 \== SUBSCRIBE\_TOPIC\_0) {

           bytes memory payload \= abi.encodeWithSignature(

               "subscribe(address,address)",

               address(0),

               address(uint160(log.topic\_1))

           );

           emit Callback(REACTIVE\_CHAIN\_ID, address(this), CALLBACK\_GAS\_LIMIT, payload);

       } else if (log.topic\_0 \== UNSUBSCRIBE\_TOPIC\_0) {

           bytes memory payload \= abi.encodeWithSignature(

               "unsubscribe(address,address)",

               address(0),

               address(uint160(log.topic\_1))

           );

           emit Callback(REACTIVE\_CHAIN\_ID, address(this), CALLBACK\_GAS\_LIMIT, payload);

       } else {

           (uint256 amount) \= abi.decode(log.data, (uint256));

           bytes memory payload \= abi.encodeWithSignature(

               "onApproval(address,address,address,address,uint256)",

               address(0),

               address(uint160(log.topic\_2)),

               address(uint160(log.topic\_1)),

               log.\_contract,

               amount

           );

           emit Callback(SEPOLIA\_CHAIN\_ID, address(approval\_service), CALLBACK\_GAS\_LIMIT, payload);

       }

   }

}

**Log Processing**:

* Subscribe Logic: If the log's topic\_0 matches the SUBSCRIBE\_TOPIC\_0, the function encodes a payload for the subscribe() method and emits a callback.  
* Unsubscribe Logic: If the log's topic\_0 matches the UNSUBSCRIBE\_TOPIC\_0, the function encodes a payload for the unsubscribe() method and emits a callback.  
* Approval Logic: For any other log, it decodes the approval amount and creates a payload for the onApproval method, then emits a callback to the approval\_service on Sepolia.

**Callback Emission**: The function uses the emit Callback statement to send the appropriate payload and trigger the corresponding action on the Reactive chain.

## **Overview**

This page provides an overview of the RPC methods specific to the Reactive Network's Geth version, essential for interacting with nodes and ReactVMs within the Reactive Network (RNK). These methods enable transaction retrieval, log access, callback information, etc. Below, you will find a detailed description of each method, including its parameters, cURLs, and responses.

**Ethereum RPC Methods**

Reactive Network is fully compatible with [standard Geth RPC methods](https://geth.ethereum.org/docs/interacting-with-geth/rpc). This page covers additional Reactive-specific methods.

## **rnk\_getTransactionByHash**

Returns the details of a transaction for the specified ReactVM ID and transaction hash.

#### **Parameters**

1. **rvmId**: DATA, 20 Bytes — The ReactVM ID associated with the transaction.  
2. **txHash**: DATA, 32 Bytes — The hash of the transaction to retrieve.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getTransactionByHash",

 "params": \[

   "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

   "0xe32b9f60321f7a83ef9dda5daf8cf5b2f5cd523156ee484f417d62d84d1e3044"

 \],

 "id": 1

}' | jq

#### **Response**

Returns an object with the following fields:

* **hash** (string): The transaction hash.  
* **number** (string): The transaction number (hex-encoded).  
* **time** (uint64): The timestamp of when the transaction occurred.  
* **root** (string): The Merkle root associated with the transaction.  
* **limit** (uint32): The maximum gas limit set for the transaction.  
* **used** (uint32): The gas used by the transaction.  
* **type** (uint8): The transaction type (0 for Legacy, 1 for AccessList, 2 for DynamicFee, 3 for Blob, 4 for SetCode).  
* **status** (uint8): The status of the transaction (1 for Success, 0 for Failure).  
* **from** (string): The transaction initiator.  
* **to** (string): The recipient address.  
* **createContract** (bool): Indicates whether a contract was created during this transaction.  
* **sessionId** (uint64): The block number where the transaction is located (hex-encoded).  
* **refChainId** (uint32): The origin chain ID.  
* **refTx** (string): The hash of the origin chain transaction that triggered this one.  
* **refEventIndex** (uint32): The origin chain event opcode (0 for LOG0, 1 for LOG1, 2 for LOG2, 3 for LOG3, 4 for LOG4).  
* **data** (string): The encoded transaction data in hexadecimal format.  
* **rData** (string): Additional response data in hexadecimal format (if any).

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": {

   "hash": "0xe32b9f60321f7a83ef9dda5daf8cf5b2f5cd523156ee484f417d62d84d1e3044",

   "number": "0x9",

   "time": 1753427529,

   "root": "0x8df166bb5c9843696457dbdc5ab20ca1ab9acdd8703b6f1fd1f51766f34fad7d",

   "limit": 900000,

   "used": 47429,

   "type": 2,

   "status": 1,

   "from": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

   "to": "0x6ba34385d9018cfa3341db62b68b5a55839fe71f",

   "createContract": false,

   "sessionId": 109252,

   "refChainId": 11155111,

   "refTx": "0x52daf0ff44c50da56024f02530ba70fcf653ad11dadb1788b24b20fc824520f5",

   "refEventIndex": 328,

   "data": "0x0d152c2c00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000aa36a7000000000000000000000000c156ad2846d093e0ce4d31cf6d780357e9675dce8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925000000000000000000000000a7d9aa89cbcd216900a04cdc13eb5789d643176a00000000000000000000000065a9b8b03a2ef50356104cb594ba2c91223973de00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000086da6000000000000000000000000000000000000000000000000000000000000000034570ac2a3bbfa2809982e69218a745aa83e1bff79b54e2a2ce10e5d6d4c5c00a52daf0ff44c50da56024f02530ba70fcf653ad11dadb1788b24b20fc824520f50000000000000000000000000000000000000000000000000000000000000148000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003e8",

   "rData": "0x"

 }

}

## **rnk\_getTransactionByNumber**

Returns the details of a transaction based on its sequence number within the specified ReactVM.

#### **Parameters**

1. **rvmId**: DATA, 20 Bytes — The ReactVM ID associated with the transaction.  
2. **txNumber**: HEX — The sequence number of the transaction to retrieve.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getTransactionByNumber",

 "params": \[

   "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

   "0x9"

 \],

 "id": 1

}' | jq

#### **Response**

Returns an object with the following fields:

* **hash** (string): The transaction hash.  
* **number** (string): The transaction number (hex-encoded).  
* **time** (uint64): The timestamp of when the transaction occurred.  
* **root** (string): The Merkle root associated with the transaction.  
* **limit** (uint32): The maximum gas limit set for the transaction.  
* **used** (uint32): The gas used by the transaction.  
* **type** (uint8): The transaction type (0 for Legacy, 1 for AccessList, 2 for DynamicFee, 3 for Blob, 4 for SetCode).  
* **status** (uint8): The status of the transaction (1 for Success, 0 for Failure).  
* **from** (string): The transaction initiator.  
* **to** (string): The recipient address.  
* **createContract** (bool): Indicates whether a contract was created during this transaction.  
* **sessionId** (uint64): The block number where the transaction is located (hex-encoded).  
* **refChainId** (uint32): The origin chain ID.  
* **refTx** (string): The hash of the origin chain transaction that triggered this one.  
* **refEventIndex** (uint32): The origin chain event opcode (0 for LOG0, 1 for LOG1, 2 for LOG2, 3 for LOG3, 4 for LOG4).  
* **data** (string): The encoded transaction data in hexadecimal format.  
* **rData** (string): Additional response data in hexadecimal format (if any).

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": {

   "hash": "0xe32b9f60321f7a83ef9dda5daf8cf5b2f5cd523156ee484f417d62d84d1e3044",

   "number": "0x9",

   "time": 1753427529,

   "root": "0x8df166bb5c9843696457dbdc5ab20ca1ab9acdd8703b6f1fd1f51766f34fad7d",

   "limit": 900000,

   "used": 47429,

   "type": 2,

   "status": 1,

   "from": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

   "to": "0x6ba34385d9018cfa3341db62b68b5a55839fe71f",

   "createContract": false,

   "sessionId": 109252,

   "refChainId": 11155111,

   "refTx": "0x52daf0ff44c50da56024f02530ba70fcf653ad11dadb1788b24b20fc824520f5",

   "refEventIndex": 328,

   "data": "0x0d152c2c00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000aa36a7000000000000000000000000c156ad2846d093e0ce4d31cf6d780357e9675dce8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925000000000000000000000000a7d9aa89cbcd216900a04cdc13eb5789d643176a00000000000000000000000065a9b8b03a2ef50356104cb594ba2c91223973de00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000086da6000000000000000000000000000000000000000000000000000000000000000034570ac2a3bbfa2809982e69218a745aa83e1bff79b54e2a2ce10e5d6d4c5c00a52daf0ff44c50da56024f02530ba70fcf653ad11dadb1788b24b20fc824520f50000000000000000000000000000000000000000000000000000000000000148000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003e8",

   "rData": "0x"

 }

}

## **rnk\_getTransactionLogs**

Returns logs for a transaction based on its sequence number within the specified ReactVM.

#### **Parameters**

1. **rvmId**: DATA, 20 Bytes — The ReactVM ID for which transaction logs are being queried.  
2. **txNumber**: HEX — The transaction number for which logs are requested.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getTransactionLogs",

 "params": \[

   "0xA7D9AA89cbcd216900a04Cdc13eB5789D643176a",

   "0x9"

 \],

 "id": 1

}' | jq

#### **Response**

Returns an array of objects with the following fields:

* **txHash** (string): The transaction hash.  
* **address** (string): The contract address that generated the transaction.  
* **topics** (string\[\]): An array of indexed event topics.  
  * **topics\[0\]**: The event signature hash.  
  * **topics\[1\]**: The first indexed parameter (if applicable).  
  * **topics\[2\]**: The second indexed parameter (if applicable).  
  * **topics\[3\]**: The third indexed parameter (if applicable).  
* **data** (string): The non-indexed event data in hexadecimal format.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": \[

   {

     "txHash": "0xe32b9f60321f7a83ef9dda5daf8cf5b2f5cd523156ee484f417d62d84d1e3044",

     "address": "0x6ba34385d9018cfa3341db62b68b5a55839fe71f",

     "topics": \[

       "0x8dd725fa9d6cd150017ab9e60318d40616439424e2fade9c1c58854950917dfc",

       "0x0000000000000000000000000000000000000000000000000000000000aa36a7",

       "0x000000000000000000000000fc2236a0d3421473676c4c422046fbc4f1afdffe",

       "0x00000000000000000000000000000000000000000000000000000000000f4240"

     \],

     "data": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a42f90252d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065a9b8b03a2ef50356104cb594ba2c91223973de000000000000000000000000a7d9aa89cbcd216900a04cdc13eb5789d643176a000000000000000000000000c156ad2846d093e0ce4d31cf6d780357e9675dce00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000"

   }

 \]

}

## **rnk\_getHeadNumber**

Returns the latest transaction number for the specified ReactVM.

#### **Parameters**

1. **rvmId**: DATA, 20 Bytes — The ReactVM ID for which the latest transaction number is requested.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getHeadNumber",

 "params": \[

   "0xA7D9AA89cbcd216900a04Cdc13eB5789D643176a"

 \],

 "id": 1

}' | jq

#### **Response**

Returns an object with the following field:

* **result** (string): the latest transaction number (hex-encoded).

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": "0x9"

}

## **rnk\_getTransactions**

Returns a range of transactions starting from a specified transaction number within the ReactVM.

#### **Parameters**

1. **rvmId**: DATA, 20 Bytes — The ReactVM ID for which transactions are being retrieved.  
2. **from**: HEX — The starting transaction number.  
3. **limit**: HEX — The maximum number of transactions to retrieve.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getTransactions",

 "params": \[

   "0xA7D9AA89cbcd216900a04Cdc13eB5789D643176a",

   "0x9",

   "0x1"

 \],

 "id": 1

}' | jq

#### **Response**

Returns an object with the following fields:

* **hash** (string): The transaction hash.  
* **number** (string): The transaction number (hex-encoded).  
* **time** (uint64): The timestamp of when the transaction occurred.  
* **root** (string): The Merkle root associated with the transaction.  
* **limit** (uint32): The maximum gas limit set for the transaction.  
* **used** (uint32): The gas used by the transaction.  
* **type** (uint8): The transaction type (0 for Legacy, 1 for AccessList, 2 for DynamicFee, 3 for Blob, 4 for SetCode).  
* **status** (uint8): The status of the transaction (1 for Success, 0 for Failure).  
* **from** (string): The transaction initiator.  
* **to** (string): The recipient address.  
* **createContract** (bool): Indicates whether a contract was created during this transaction.  
* **sessionId** (uint64): The block number where the transaction is located (hex-encoded).  
* **refChainId** (uint32): The origin chain ID.  
* **refTx** (string): The hash of the origin chain transaction that triggered this one.  
* **refEventIndex** (uint32): The origin chain event opcode (0 for LOG0, 1 for LOG1, 2 for LOG2, 3 for LOG3, 4 for LOG4).  
* **data** (string): The encoded transaction data in hexadecimal format.  
* **rData** (string): Additional response data in hexadecimal format (if any).

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": \[

   {

     "hash": "0xe32b9f60321f7a83ef9dda5daf8cf5b2f5cd523156ee484f417d62d84d1e3044",

     "number": "0x9",

     "time": 1753427529,

     "root": "0x8df166bb5c9843696457dbdc5ab20ca1ab9acdd8703b6f1fd1f51766f34fad7d",

     "limit": 900000,

     "used": 47429,

     "type": 2,

     "status": 1,

     "from": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

     "to": "0x6ba34385d9018cfa3341db62b68b5a55839fe71f",

     "createContract": false,

     "sessionId": 109252,

     "refChainId": 11155111,

     "refTx": "0x52daf0ff44c50da56024f02530ba70fcf653ad11dadb1788b24b20fc824520f5",

     "refEventIndex": 328,

     "data": "0x0d152c2c00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000aa36a7000000000000000000000000c156ad2846d093e0ce4d31cf6d780357e9675dce8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925000000000000000000000000a7d9aa89cbcd216900a04cdc13eb5789d643176a00000000000000000000000065a9b8b03a2ef50356104cb594ba2c91223973de00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000086da6000000000000000000000000000000000000000000000000000000000000000034570ac2a3bbfa2809982e69218a745aa83e1bff79b54e2a2ce10e5d6d4c5c00a52daf0ff44c50da56024f02530ba70fcf653ad11dadb1788b24b20fc824520f50000000000000000000000000000000000000000000000000000000000000148000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003e8",

     "rData": "0x"

   }

 \]

}

## **rnk\_getRnkAddressMapping**

Returns the RVM ID mapped to the specified reactive contract address.

#### **Parameters**

1. **reactNetworkContrAddr**: DATA, 20 Bytes — The address of the Reactive Network contract for which the RVM ID is being requested.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getRnkAddressMapping",

 "params": \[

   "0xc3e185561D2a8b04F0Fcd104A562f460D6cC503c"

 \],

 "id": 1

}' | jq

#### **Response**

Returns an object with the following field:

* **rvmId** (string): The unique identifier of the RVM associated with the given contract.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": {

   "rvmId": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a"

 }

}

## **rnk\_getStat**

Returns and compiles statistics about origin chain data.

#### **Parameters**

This method does not require any input parameters.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getStat",

 "params": \[\],

 "id": 1

}' | jq

#### **Response**

Returns an object with the following fields:

* **chainId** (object): The statistics for a specific origin chain.  
  * **txCount** (uint64): The total number of transactions processed from this origin chain.  
  * **eventCount** (uint64): The total number of events emitted from this origin chain.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": {

   "origin": {

     "11155111": {

       "txCount": 20807136,

       "eventCount": 60122691

     },

     "43113": {

       "txCount": 1244787,

       "eventCount": 4929280

     },

     "5318007": {

       "txCount": 160035,

       "eventCount": 169908

     },

     "80002": {

       "txCount": 450072,

       "eventCount": 1786648

     },

     "84532": {

       "txCount": 14266438,

       "eventCount": 122218657

     },

     "97": {

       "txCount": 3787433,

       "eventCount": 9384761

     }

   }

 }

}

## **rnk\_getVms**

Returns information about all RVMs, including the number of transactions processed and the count of associated contracts.

#### **Parameters**

This method does not require any input parameters.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getVms",

 "params": \[\],

 "id": 1

}' | jq

#### **Response**

Returns a list of active RVMs with the following fields:

* **rvmId** (string): The unique identifier of the RVM.  
* **lastTxNumber** (string): The last transaction number executed by this RVM (hex-encoded).  
* **contracts** (uint32): The number of contracts associated with this RVM.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": \[

   {

     "rvmId": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

     "lastTxNumber": "0x9",

     "contracts": 4

   },

   {

     "rvmId": "0xfe5a45db052489cbc16d882404bcfa4f6223a55e",

     "lastTxNumber": "0x2",

     "contracts": 1

   },

   {

     "rvmId": "0x49abe186a9b24f73e34ccae3d179299440c352ac",

     "lastTxNumber": "0x2d6",

     "contracts": 1

   },

   {

     "rvmId": "0x941b727ad8acf020558ce58cd7cb65b48b958db1",

     "lastTxNumber": "0x7",

     "contracts": 3

   },

   {

     "rvmId": "0xc1d48a9173212567bd358e40c50bfe131a9fabf1",

     "lastTxNumber": "0x3c",

     "contracts": 28

   }

 \]

}

## **rnk\_getVm**

Returns detailed information about a specific RVM, including the latest transaction number and the number of contracts deployed within it.

#### **Parameters**

1. **rvmId**: DATA, 20 Bytes — The unique identifier of the RVM for which information is requested.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getVm",

 "params": \["0xA7D9AA89cbcd216900a04Cdc13eB5789D643176a"\],

 "id": 1

}' | jq

#### **Response**

Returns an object with the following fields:

* **rvmId** (string): The unique identifier of the RVM.  
* **lastTxNumber** (string): The last transaction number executed by this RVM (hex-encoded).  
* **contracts** (uint32): The number of contracts created by this RVM.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": {

   "rvmId": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

   "lastTxNumber": "0x9",

   "contracts": 4

 }

}

## **rnk\_getSubscribers**

Returns a list of contracts that have subscribed to events from a specified RVM, along with their filter topics.

#### **Parameters**

1. **rvmId**: DATA, 20 Bytes — The unique identifier of the RVM for which subscriber information is requested.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getSubscribers",

 "params": \["0xA7D9AA89cbcd216900a04Cdc13eB5789D643176a"\],

 "id": 1

}' | jq

#### **Response**

Returns a list of RVM-related contract events with the following fields:

* **uid** (string): The unique identifier of the subscription.  
* **chainId** (uint32): The blockchain ID of the subscribed contract.  
* **contract** (string): The address of the subscribed contract on the origin chain.  
* **topics** (array): An array of event topics (some may be null if not indexed).  
* **rvmId** (string): The unique identifier of the RVM.  
* **rvmContract** (string): The address of the RVM contract handling this subscription.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": \[

   {

     "uid": "7d45d863e45da3a7e60d2cc5bdd7088f",

     "chainId": 11155111,

     "contract": "0xe1bac3039ea58fee2abce7a8cbcc4b0c8ad030c5",

     "topics": \[

       "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1",

       null,

       null,

       null

     \],

     "rvmId": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

     "rvmContract": "0xc3e185561d2a8b04f0fcd104a562f460d6cc503c"

   },

   {

     "uid": "d979ded638e32915f59ae9bfb3b70e6c",

     "chainId": 11155111,

     "contract": "0x7acbd40c79da73b671d47618135486eef39ec6e3",

     "topics": \[

       "0x9996f0dd09556ca972123b22cf9f75c3765bc699a1336a85286c7cb8b9889c6b",

       null,

       null,

       null

     \],

     "rvmId": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

     "rvmContract": "0xc3e185561d2a8b04f0fcd104a562f460d6cc503c"

   },

   {

     "uid": "62968b91e4122e0c03a08f38b31a1ae4",

     "chainId": 11155111,

     "contract": "0x16102fe2caa2610a99beaa5f4fb6e230825b1096",

     "topics": \[

       "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1",

       null,

       null,

       null

     \],

     "rvmId": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

     "rvmContract": "0x2afafd298b23b62760711756088f75b7409f5967"

   }

 \]

}

## **rnk\_getCode**

Retrieves the bytecode of a deployed contract at a specific transaction or block state for a given RVM.

#### **Parameters**

1. **rvmId**: DATA, 20 bytes — The unique identifier of the RVM.  
2. **contract** DATA, 20 bytes — The Reactive contract address.  
3. **txNumberOrHash** HEX | TAG — Specifies the state at which the contract code is retrieved. Accepts either a block number (HEX) or a tag ("latest", "earliest", "pending").

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getCode",

 "params": \[

   "0xA7D9AA89cbcd216900a04Cdc13eB5789D643176a",

   "0xA79933a054c8Ad29ae55bEe769Cd9d8228F03520",

   "0x22"

   \],

 "id": 1

}' | jq

#### **Response**

Returns the bytecode of a contract:

* **bytecode** (string) — The contract bytecode in hexadecimal format.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": "0x60806040526004361061007e575f3560e01c80638456cb591161004d5780638456cb591461010757806396f90b451461011d578063995e4b9814610147578063c290d6911461017157610085565b806303ac52b314610089578063046f7da2146100b35780630d152c2c146100c95780637a90b990146100f157610085565b3661008557005b5f5ffd5b348015610094575f5ffd5b5061009d610199565b6040516100aa9190610cb0565b60405180910390f35b3480156100be575f5ffd5b506100c761019f565b005b3480156100d4575f5ffd5b506100ef60048036038101906100ea9190610cf4565b610458565b005b3480156100fc575f5ffd5b5061010561059d565b005b348015610112575f5ffd5b5061011b610665565b005b348015610128575f5ffd5b50610131610920565b60405161013e9190610cb0565b60405180910390f35b348015610152575f5ffd5b5061015b610929565b6040516101689190610cb0565b60405180910390f35b34801561017c575f5ffd5b5061019760048036038101906101929190610d65565b61092f565b005b60055481565b60025f9054906101000a900460ff16156101ee576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101e590610dea565b60405180910390fd5b60035f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461027d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161027490610e52565b60405180910390fd5b600360149054906101000a900460ff166102cc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c390610eba565b60405180910390fd5b5f6102d56109c5565b90505f5f90505b8151811461043a57600260019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16635a6aced083838151811061033557610334610ed8565b5b60200260200101515f015184848151811061035357610352610ed8565b5b60200260200101516020015185858151811061037257610371610ed8565b5b60200260200101516040015186868151811061039157610390610ed8565b5b6020026020010151606001518787815181106103b0576103af610ed8565b5b6020026020010151608001518888815181106103cf576103ce610ed8565b5b602002602001015160a001516040518763ffffffff1660e01b81526004016103fc96959493929190610f44565b5f604051808303815f87803b158015610413575f5ffd5b505af1158015610425573d5f5f3e3d5ffd5b505050508061043390610fd0565b90506102dc565b505f600360146101000a81548160ff02191690831515021790555050565b60025f9054906101000a900460ff166104a6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161049d90611061565b60405180910390fd5b60045481604001350361059a5743600581905550620f424067ffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff16467f8dd725fa9d6cd150017ab9e60318d40616439424e2fade9c1c58854950917dfc6040516024016040516020818303038152906040527f083b2732000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505060405161059191906110ef565b60405180910390a45b50565b5f5f5f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16639b6c56ec306040518263ffffffff1660e01b81526004016105f7919061110f565b602060405180830381865afa158015610612573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610636919061113c565b90506106625f5f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1682610b0b565b50565b60025f9054906101000a900460ff16156106b4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106ab90610dea565b60405180910390fd5b60035f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610743576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161073a90610e52565b60405180910390fd5b600360149054906101000a900460ff1615610793576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161078a906111b1565b60405180910390fd5b5f61079c6109c5565b90505f5f90505b8151811461090157600260019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16632f8073368383815181106107fc576107fb610ed8565b5b60200260200101515f015184848151811061081a57610819610ed8565b5b60200260200101516020015185858151811061083957610838610ed8565b5b60200260200101516040015186868151811061085857610857610ed8565b5b60200260200101516060015187878151811061087757610876610ed8565b5b60200260200101516080015188888151811061089657610895610ed8565b5b602002602001015160a001516040518763ffffffff1660e01b81526004016108c396959493929190610f44565b5f604051808303815f87803b1580156108da575f5ffd5b505af11580156108ec573d5f5f3e3d5ffd5b50505050806108fa90610fd0565b90506107a3565b506001600360146101000a81548160ff02191690831515021790555050565b5f600554905090565b60045481565b60015f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff166109b8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109af90611219565b60405180910390fd5b6109c23382610b0b565b50565b60605f600167ffffffffffffffff8111156109e3576109e2611237565b5b604051908082528060200260200182016040528015610a1c57816020015b610a09610c52565b815260200190600190039081610a015790505b5090506040518060c00160405280468152602001600260019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200160045481526020017fa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad81526020017fa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad81526020017fa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad815250815f81518110610af957610af8610ed8565b5b60200260200101819052508091505090565b80471015610b4e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b45906112ae565b60405180910390fd5b5f811115610c4e575f8273ffffffffffffffffffffffffffffffffffffffff16825f67ffffffffffffffff811115610b8957610b88611237565b5b6040519080825280601f01601f191660200182016040528015610bbb5781602001600182028036833780820191505090505b50604051610bc99190611306565b5f6040518083038185875af1925050503d805f8114610c03576040519150601f19603f3d011682016040523d82523d5f602084013e610c08565b606091505b5050905080610c4c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c4390611366565b60405180910390fd5b505b5050565b6040518060c001604052805f81526020015f73ffffffffffffffffffffffffffffffffffffffff1681526020015f81526020015f81526020015f81526020015f81525090565b5f819050919050565b610caa81610c98565b82525050565b5f602082019050610cc35f830184610ca1565b92915050565b5f5ffd5b5f5ffd5b5f5ffd5b5f6101808284031215610ceb57610cea610cd1565b5b81905092915050565b5f60208284031215610d0957610d08610cc9565b5b5f82013567ffffffffffffffff811115610d2657610d25610ccd565b5b610d3284828501610cd5565b91505092915050565b610d4481610c98565b8114610d4e575f5ffd5b50565b5f81359050610d5f81610d3b565b92915050565b5f60208284031215610d7a57610d79610cc9565b5b5f610d8784828501610d51565b91505092915050565b5f82825260208201905092915050565b7f5265616374697665204e6574776f726b206f6e6c7900000000000000000000005f82015250565b5f610dd4601583610d90565b9150610ddf82610da0565b602082019050919050565b5f6020820190508181035f830152610e0181610dc8565b9050919050565b7f556e617574686f72697a656400000000000000000000000000000000000000005f82015250565b5f610e3c600c83610d90565b9150610e4782610e08565b602082019050919050565b5f6020820190508181035f830152610e6981610e30565b9050919050565b7f4e6f7420706175736564000000000000000000000000000000000000000000005f82015250565b5f610ea4600a83610d90565b9150610eaf82610e70565b602082019050919050565b5f6020820190508181035f830152610ed181610e98565b9050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52603260045260245ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610f2e82610f05565b9050919050565b610f3e81610f24565b82525050565b5f60c082019050610f575f830189610ca1565b610f646020830188610f35565b610f716040830187610ca1565b610f7e6060830186610ca1565b610f8b6080830185610ca1565b610f9860a0830184610ca1565b979650505050505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f610fda82610c98565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820361100c5761100b610fa3565b5b600182019050919050565b7f564d206f6e6c79000000000000000000000000000000000000000000000000005f82015250565b5f61104b600783610d90565b915061105682611017565b602082019050919050565b5f6020820190508181035f8301526110788161103f565b9050919050565b5f81519050919050565b5f82825260208201905092915050565b8281835e5f83830152505050565b5f601f19601f8301169050919050565b5f6110c18261107f565b6110cb8185611089565b93506110db818560208601611099565b6110e4816110a7565b840191505092915050565b5f6020820190508181035f83015261110781846110b7565b905092915050565b5f6020820190506111225f830184610f35565b92915050565b5f8151905061113681610d3b565b92915050565b5f6020828403121561115157611150610cc9565b5b5f61115e84828501611128565b91505092915050565b7f416c7265616479207061757365640000000000000000000000000000000000005f82015250565b5f61119b600e83610d90565b91506111a682611167565b602082019050919050565b5f6020820190508181035f8301526111c88161118f565b9050919050565b7f417574686f72697a65642073656e646572206f6e6c79000000000000000000005f82015250565b5f611203601683610d90565b915061120e826111cf565b602082019050919050565b5f6020820190508181035f830152611230816111f7565b9050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b7f496e73756666696369656e742066756e647300000000000000000000000000005f82015250565b5f611298601283610d90565b91506112a382611264565b602082019050919050565b5f6020820190508181035f8301526112c58161128c565b9050919050565b5f81905092915050565b5f6112e08261107f565b6112ea81856112cc565b93506112fa818560208601611099565b80840191505092915050565b5f61131182846112d6565b915081905092915050565b7f5472616e73666572206661696c656400000000000000000000000000000000005f82015250565b5f611350600f83610d90565b915061135b8261131c565b602082019050919050565b5f6020820190508181035f83015261137d81611344565b905091905056fea264697066735822122034fc1c6a89fb4e371bf625c4ac368d40ce079d62f9661894e35ec6c69efb147864736f6c634300081c0033"

}

## **rnk\_getStorageAt**

Retrieves the storage value at a specified key for a contract on a given RVM at a specific transaction or block state.

#### **Parameters**

1. **rvmId**: DATA, 20 bytes — The unique identifier of the RVM.  
2. **address**: DATA, 20 bytes — The address of the contract from which to retrieve the storage value.  
3. **hexKey**: DATA, 32 bytes — The hexadecimal key for which the storage value is being queried.  
4. **txNumberOrHash**: HEX | TAG — Specifies the block number or hash at which the storage value is queried. Accepts either a block number (HEX) or a tag ("latest", "earliest", "pending").

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getStorageAt",

 "params": \[

   "0xA7D9AA89cbcd216900a04Cdc13eB5789D643176a",

   "0xA79933a054c8Ad29ae55bEe769Cd9d8228F03520",

   "0x0000000000000000000000000000000000000000000000000000000000000002",

   "0xb707d1ddcea3fce0a966fde10f412b4c9cdedf99c67a470a7bbcb2407e1c8bcc"

 \],

 "id": 1

}' | jq

#### **Response**

Returns the storage value:

**result** (string): A hexadecimal string representing the storage data.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": "0x000000000000000000000000a7d9aa89cbcd216900a04cdc13eb5789d643176a"

}

## **rnk\_call**

Performs a read-only simulation of a Reactive contract function call on a given RVM, without creating a transaction.

#### **Parameters**

1. **rvmId**: DATA, 20 bytes — The unique identifier of the RVM.  
2. **args**: OBJECT — The transaction arguments, including the contract method and parameters. Should include:  
   * to: DATA, 20 bytes — The address of the contract.  
   * data: DATA — The call data, representing the method and parameters.  
   * from: DATA, 20 bytes, (optional) — The address from which the call is simulated. If omitted, the simulation assumes the call is made from an empty address (0x000...).  
   * gas: HEX, (optional) — The maximum amount of gas allowed for the simulation. If omitted, a default value is used.  
   * gasPrice: HEX, (optional) — The price of gas (in RVM-specific units) for the simulation.  
   * value: HEX, (optional) — The amount of tokens (e.g., Ether) to send along with the call. For non-payable functions, this should be 0\.  
3. **txNumberOrHash**: HEX | TAG — Specifies the block number or hash to use for simulating the call. Accepts either a block number (HEX) or a tag ("latest", "earliest", "pending").

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_call",

 "params": \[

   "0xA7D9AA89cbcd216900a04Cdc13eB5789D643176a",

   {

     "to": "0xA79933a054c8Ad29ae55bEe769Cd9d8228F03520",

     "data": "0x96f90b45"

   },

   "latest"

 \],

 "id": 1

}' | jq

#### **Response**

Returns the result of the simulated call:

**result** (string): The simulated result of the contract call, returned as a hexadecimal string.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": "0x0000000000000000000000000000000000000000000000000000000000027a94"

}

## **rnk\_getBlockRvms**

Retrieves the history of RVMs for a given block number, specifically those RVMs that have generated an RVM transaction.

#### **Parameters**

1. **blockN**: uint64 – The block number for which to retrieve the RVM history.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getBlockRvms",

 "params": \[

   109252

 \],

 "id": 1

}' | jq

#### **Response**

Returns an array of objects representing RVMs that were active in the given block. Each object contains:

* **rvmId** (string): The unique identifier of each RVM.  
* **headTxNumber** (string): The transaction with the greatest number in the session (hex-encoded).  
* **prevRnkBlockId** (uint64): The previous block number in which the RVM session was active.  
* **txCount** (uint32): The total number of transactions in the current RVM session.

{

 "jsonrpc": "2.0",

 "id": 1,

 "result": \[

   {

     "rvmId": "0xa7d9aa89cbcd216900a04cdc13eb5789d643176a",

     "headTxNumber": "0x9",

     "prevRnkBlockId": 109244,

     "txCount": 1

   }

 \]

}

## **rnk\_getFilters**

Returns all the active log filters registered on the Reactive Network, along with their configurations and target contracts.

#### **Parameters**

This method does not require any input parameters.

#### **cURL**

curl \--location 'https://lasna-rpc.rnk.dev/' \\

\--header 'Content-Type: application/json' \\

\--data '{

 "jsonrpc": "2.0",

 "method": "rnk\_getFilters",

 "params": \[\],

 "id": 1

}' | jq

#### **Response**

Returns an array of filter objects. Each filter object contains the following fields:

* **uid** (string): The unique identifier for the filter.  
* **chainId** (uint32): The chain ID on which the filter is active.  
* **contract** (string): The address of the contract the filter is listening to.  
* **topics** (array\[string | null\]): An array of up to 4 log topics (from topic\_0 to topic\_3) used for event filtering. Unused topics are null.  
* **configs** (array\[object\]): An array of configuration objects for reactive contracts and their associated ReactVMs.  
* **contract** (string): The reactive contract address.  
* **rvmId** (string): The ReactVM ID where the reactive contract resides.  
* **active** (bool): Indicates whether the subscription/filter is active.

{  
 "jsonrpc": "2.0",  
 "id": 1,  
 "result": \[  
   {  
     "Uid": "4603da7efc5d1b77f7fa5b0bfd949d6c",  
     "ChainId": 11155111,  
     "Contract": "0x1e8db093a0cc38302f5822a451809bfd692ff695",  
     "Topics": \[  
       "0x8cabf31d2b1b11ba52dbb302817a3c9c83e4b2a5194d35121ab1354d69f6a4cb",  
       null,  
       null,  
       null  
     \],  
     "Configs": \[  
       {  
         "Contract": "0xac9163487ca9c5189766706595cbef9b75c1c8e9",  
         "RvmId": "0xc1d48a9173212567bd358e40c50bfe131a9fabf1",  
         "Active": true  
       }  
     \]  
   },  
   {  
     "Uid": "b91cf2f05464d578896164d4e6c0c854",  
     "ChainId": 11155111,  
     "Contract": "0x5e3eeda090eea783af9ee8d81147d9417bb97b38",  
     "Topics": \[  
       "0x8cabf31d2b1b11ba52dbb302817a3c9c83e4b2a5194d35121ab1354d69f6a4cb",  
       null,  
       null,  
       null  
     \],  
     "Configs": \[  
       {  
         "Contract": "0xe3cf3d848557974d3abf8e7c15c3a534187f1c6f",  
         "RvmId": "0xc1d48a9173212567bd358e40c50bfe131a9fabf1",  
         "Active": true  
       }  
     \]  
   },  
   {  
     "Uid": "0fce746e0305e2fc2e425735ea71a52f",  
     "ChainId": 11155111,  
     "Contract": "0x0102e0a1792b8805f16b6ec27978f6898b865475",  
     "Topics": \[  
       "0x9bffe4738606691ddfa5e5d28208b6ef74537676b39ddb9854b7854a62df0692",  
       null,  
       null,  
       null  
     \],  
     "Configs": \[  
       {  
         "Contract": "0xe4d4b0c2f8502a98e68c6f0ef2483214c106fd82",  
         "RvmId": "0x941b727ad8acf020558ce58cd7cb65b48b958db1",  
         "Active": true  
       }  
     \]  
   }  
 \]  
}

## **Overview**

This section is dedicated to practical demonstrations explaining the capabilities of the Reactive Network.

## **Reactive Network Demo**

The [Reactive Network Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/basic) serves as an introduction, illustrating the Reactive Network's functionality in monitoring logs emitted by contracts in the L1 Network and initiating calls back to L1 contracts. It outlines the interaction between three smart contracts: the Origin chain contract [BasicDemoL1Contract.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/basic/BasicDemoL1Contract.sol), the Destination chain contract [BasicDemoL1Callback.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/basic/BasicDemoL1Callback.sol), and the Reactive contract [BasicDemoReactiveContract.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/basic/BasicDemoReactiveContract.sol).

## **Uniswap V2 Stop Order Demo**

The [Uniswap V2 Stop Order Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/uniswap-v2-stop-order) extends the functionality to implement stop orders for Uniswap V2 liquidity pools. It elaborates on three smart contracts: the Origin chain contract [UniswapDemoToken.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/uniswap-v2-stop-order/UniswapDemoToken.sol), the Destination chain contract [UniswapDemoStopOrderCallback.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/uniswap-v2-stop-order/UniswapDemoStopOrderCallback.sol), and the Reactive contract [UniswapDemoStopOrderReactive.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/uniswap-v2-stop-order/UniswapDemoStopOrderReactive.sol), executing stop orders based on exchange rate thresholds. It also ponders potential refinements and improvements for a production-grade stop order system.

## **Approval Magic Demo**

The [Approval Magic Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/approval-magic) demonstrates the use of reactive and subscription-based smart contracts to enable automated token approvals and cross-chain exchanges. It elaborates on contracts like [ApprovalService.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/approval-magic/ApprovalService.sol) for managing subscriptions, [ApprovalListener.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/approval-magic/ApprovalListener.sol) for handling reactive events, and additional contracts for token initialization, exchanges, and swaps.

## **Hyperlane Demo**

The [Hyperlane Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/hyperlane) demonstrates real-time cross-chain interaction between smart contracts without relying on centralized relayers or callback proxies. It uses Reactive for subscribing to on-chain events and Hyperlane for message delivery between chains. The demo includes two contracts. The [HyperlaneOrigin.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/hyperlane/HyperlaneOrigin.sol) contract emits trigger events and records messages received from other chains via a trusted Hyperlane mailbox. [HyperlaneReactive.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/hyperlane/HyperlaneReactive.sol) listens for these events via the Reactive Network, responds through a react() function, and can send messages back.

## **Uniswap V2 Exchange Rate History Demo**

The [Uniswap V2 Exchange Rate History Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/uniswap-v2-history) captures and stores historical exchange rates from Uniswap V2 liquidity pools. It elaborates on two smart contracts: the Origin chain contract [UniswapHistoryDemoL1.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/uniswap-v2-history/UniswapHistoryDemoL1.sol), and the Reactive contract [UniswapHistoryDemoReactive.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/uniswap-v2-history/UniswapHistoryDemoReactive.sol), which collaborate to record exchange rate data based on specific block numbers. The purpose of this demo is to monitor sync events on all Uniswap V2 liquidity pools and provide historical exchange rate information upon request.

## **ERC-20 Turnovers Demo**

The [ERC-20 Turnovers Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/erc20-turnovers) records and reports the turnover of ERC-20 tokens. It details two smart contracts: the Origin chain contract [TokenTurnoverL1.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/erc20-turnovers/TokenTurnoverL1.sol), and the Reactive contract [TokenTurnoverReactive.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/erc20-turnovers/TokenTurnoverReactive.sol), which work together to calculate and report token turnovers based on specific events. The purpose of this demo is to monitor token turnovers on all ERC-20 contracts and provide this information upon request.

## **ERC-721 Ownership Demo**

The [ERC-721 Ownership Demo](https://github.com/Reactive-Network/reactive-smart-contract-demos/tree/main/src/demos/erc721-ownership) tracks and reports the ownership of ERC-721 tokens. It details two smart contracts: the Origin chain contract [NftOwnershipL1.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/erc721-ownership/NftOwnershipL1.sol), and the Reactive contract [NftOwnershipReactive.sol](https://github.com/Reactive-Network/reactive-smart-contract-demos/blob/main/src/demos/erc721-ownership/NftOwnershipReactive.sol), which work together to record and report token ownership changes. The purpose of this demo is to monitor token ownership changes on all ERC-721 contracts and provide this information upon request.

## **Reactive Faucet App/Demo**

The [Reactive Faucet App/Demo](https://github.com/Reactive-Network/testnet-faucet) facilitates fund transfers between any chain and the Reactive Network. This is the same faucet that operates on our testnet. It involves two smart contracts: [ReactiveFaucetL1.sol](https://github.com/Reactive-Network/testnet-faucet/blob/main/src/faucet/ReactiveFaucetL1.sol) and [ReactiveFaucet.sol](https://github.com/Reactive-Network/testnet-faucet/blob/main/src/faucet/ReactiveFaucet.sol).

## **Overview**

Reactscan is a tool that provides developers with an overview of the Reactive Network, including addresses, contracts, and transaction details.

[Reactive Scan (Mainnet) →](https://reactscan.net/)

[Lasna Scan (Testnet) →](https://lasna.reactscan.net/)

## **My RVM Address**

Your contracts and reactive transactions are located in your RVM address section, which should match the deployment address.

[Learn more about ReactVM →](https://dev.reactive.network/reactvm)

## **How to Find Your RVM Address**

1. Navigate to the **Latest RVMs** section on the main page.  
2. If your address doesn’t appear there, click the **View All RVMs** link to access the complete list of addresses.

![Img 1][image7]

3. Alternatively, use the search bar at the top of the page to locate your RVM address by entering it directly into the search field.  
4. For direct access, you can open your RVM page by entering the following URL into your browser: [**https://reactscan.net/rvm/ADDRESS**](https://reactscan.net/rvm/ADDRESS). Replace ADDRESS with your unique RVM address.

**Good to Know**

Clicking the **\[watch\]** button on your RVM page moves your RVM address to the top of the list in the **Latest RVMs** section. This feature ensures quick and convenient access to your address directly from the main page. With your address pinned at the top, there's no need to manually search or enter it into the search bar — it will always be available.

![Img 2][image8]

![Img 3][image9]

## **RVM Page for Developers**

On your RVM page, you can access a detailed view of the contracts you've deployed and the transactions you've initiated. Additionally, your balance in REACT is displayed for quick reference.

![Img 4][image10]

The **Main Transactions** page provides an overview of all transactions, organized into a table with the following columns: **Numb, Hash, Status, Time, Origin, Interacted With, Type,** and **Callbacks.** Here’s a detailed explanation of some key columns:

* **Type**: indicates the nature of the transaction. It can take two values \- **DEPLOY** (transaction where a contract was deployed) and **REACT** (a transaction that reacts to an originating transaction).  
* **Callbacks**: If a transaction generates callbacks, this column displays the exact number of callbacks triggered. For transactions with no callbacks, it simply shows **N/A**. You can click the transaction hash to open its details and view all associated callbacks.  
* **Interacted With**: the contract initiating the transaction.

![Img 5][image11]

### **Contract**

The **Contract** page provides a detailed view of all transactions related to a specific contract. Contract subscriptions can be viewed on this page, too.

**Good to Know**

Your REACT balance is also visible on your RVM page for easy reference.

The page displays the current **contract status**, either Active or Inactive. If your contract is inactive, you can follow the instructions on the [Debt Coverage](https://dev.reactive.network/economy#direct-transfers) page to activate it.

![Img 6][image12]

Similar to the **Main Transactions** page in your RVM, the contract page features a transaction table with the same columns: **Numb, Hash, Status, Time, Origin, Interacted With, Type,** and **Callbacks.** Here’s a breakdown of key columns:

* **Type**: indicates the nature of the transaction. It can take two values \- **DEPLOY** (transaction where a contract was deployed) and **REACT** (a transaction that reacts to an originating transaction).  
* **Callbacks**: If a transaction generates callbacks, this column displays the exact number of callbacks triggered. For transactions with no callbacks, it simply shows **N/A**. You can click the transaction hash to open its details and view all associated callbacks.  
* **Interacted With**: the contract initiating the transaction.

### **Subscriptions**

Next to the transactions section, you can view the **subscriptions** associated with the contract. The subscription details include the following fields:

* **Subscription Status**: **Active** (the subscription is actively monitoring events on the origin chain) or **Inactive** (the subscription has stopped monitoring events).  
* **Chain**: Specifies the origin chain where the subscription is monitoring events.  
* **Criteria**: **Origin Contract**, **topic\_0**, **topic\_1**, **topic\_2**, and **topic\_3**.

![Img 7][image13]

[Learn more about Subscriptions →](https://dev.reactive.network/subscriptions)

## **RVM Transaction**

Each RVM displays a list of clickable, numbered transactions, with the most recent appearing at the top. Clicking on a transaction number or hash reveals detailed information.

![Img 8][image14]

At the top left, the **RVM address** is shown and can be copied. Below that, you’ll find the **contract status** and **timestamp**.

![Img 9][image15]

The **Transaction Overview** section includes:

* **Interacted With**: The contract address involved in the transaction.  
* **Transaction Hash, Transaction Type, and Status**: Self-explanatory.  
* **From**: The EOA associated with the RVM address.

![Img 10][image16]

Next, the **Gas Overview** displays gas consumption details.

If the transaction involves cross-chain activity (beyond contract deployment), two additional sections appear:

* **Destination Transaction:** Includes a clickable hash linking to the relevant chain.  
* **Origin Transaction:** Shows the corresponding hash from the originating chain.

![Img 11][image17]

The **Origin Transaction Payload** contains: Origin Contract, Topic 0, Topic 1, Topic 2, Topic 3, Data, Block Number, OpCode.

![Img 12][image18]

Additionally, there may be log entries:

* **Log 1**: Event Signature Hash, Address, Topic 1, Topic 2, Topic 3, Log Data  
* **Log 2**: Event Signature Hash, Callback Address, Chain ID, Contract, Gas Limit, Payload

![Img 13][image19]

## **RNK Transactions**

On the main page of Reactive Scan, the **\[Latest RNK Transactions\]** section is located at the bottom right. This section displays four key columns: transaction hash, transaction status, initiating contract, block timestamp.

![Img 14][image20]

Below this section, you'll find the **\[View All Transactions \>\>\]** button. Clicking it opens a real-time list of recent transactions, providing detailed information such as the transaction hash, status, timestamp, from (sender), and to (recipient).

![Img 15][image21]

To explore a specific transaction, either click on its hash in the list or add the transaction hash directly to the URL, like so: \`tx/0xea20f5cd4b2c01b549f58c2f109129987e95fc15560d56cab62f76262c571454\`. This will bring you to a detailed transaction view.

At the top left, the **transaction hash** is shown and can be copied. Below that, you’ll find the **transaction status**, **Transaction Type** (\`Legacy 0\`, \`AccessList 1\`, \`DynamicFee 2\`, \`Blob 3\`, and \`SetCode 4\`), and **Block Timestamp.**

**![Img 16][image22]**

The **Transaction Overview** section includes:

* **Interacted With**: The contract initiating the transaction.  
* **Transaction Hash**, **Block Number**, **From (sender)** – Self-explanatory.  
* **Value**: The amount transferred (if any).

![Img 17][image23]

Next, the **Gas Overview** displays gas consumption details.

* **Gas Used**: The amount of gas consumed by the transaction.  
* **Gas Price**: The price paid per unit of gas.

![Img 18][image24]

If applicable, **logs** associated with the transaction may be displayed, containing: Event Signature Hash, Address, Topic 1, and Log Data. Logs may appear in two groups (Logs 1 and Logs 2\) if multiple events are triggered during the transaction.

![Img 19][image25]

## **General Questions**

**What problem does the Reactive Network solve?**

It enables the execution of arbitrary Solidity logic without user intervention and provides reactive contracts that allow users to subscribe to remote ecosystem events. These contracts can affect protocols across chains based on incoming data.

**How is the Reactive Network different from other cross-chain relayers?**

Existing cross-chain relayers often need to be integrated into your infrastructure during development and may be specific to certain use cases. The Reactive Network generalizes this concept and can apply arbitrary EVM logic. Unlike many cross-chain relayers, the Reactive Network can execute arbitrary EVM logic, not limited to predefined use cases.

**What is the Reactive Network physically?**

The Reactive Network is a fork of Geth, compatible with the Ethereum Virtual Machine, and operates on a Proof of Stake protocol using Prism. It generates blocks approximately every 7 seconds. A Reactive Network node subscribes to other ecosystems' nodes via WebSocket and monitors the newheads event. When triggered, the node obtains transaction receipts, searches for subscribers within the Reactive Network, and propagates event logs to their reactVMs. The state of the Reactive Network is determined by the collective states of reactVMs and their connections to external blockchains.

**How is the Reactive Network different from Geth?**

The Reactive Network can listen to other blockchains by subscribing to their event logs. It uses event logs from different blockchains to identify reactive contracts subscribed to various topics, execute their logic, and propagate results. This computation occurs outside the main layer, making the process more cost-effective.

**Is there any nuance to the Reactive Network?**

Simply increasing the gas limit for blocks would compromise decentralization, leading to fewer validators. The Reactive Network includes an additional layer called reactVM to manage computations while maintaining decentralization.

**What is meant by a dual-state environment?**

Each reactive contract operates in a dual-state environment with two instances initialized in the constructor. The reactVM instance updates its state based on events, while the Reactive Network instance updates its state through manual function calls.

**Why do we always have two contract copies — in the Reactive Network and reactVM?**

The architecture enables parallel transaction execution. The Ethereum Virtual Machine (EVM) is single-threaded, processing commands one at a time. To overcome this limitation, the Reactive Network uses reactVMs which execute independently and in parallel. Each contract copy in this architecture handles its own state and execution context.

## **Subscriptions**

**Are subscriptions to one or multiple events from different chain IDs allowed?**

Yes, users can subscribe to events from all chains with a single subscription by specifying the chain ID as uint256(0). Note: Use either REACTIVE\_IGNORE for topics 0-3 or uint256(0) for the chain ID and addres(0) for contact address, but not altogether. Subscribing to events from all chains and all contracts simultaneously is not allowed, nor is subscribing to all events from only one chain, as it is considered unnecessary.

**Are identical subscriptions allowed. Why?**

Duplicate subscriptions are allowed but function as a single subscription. Users are charged for each transaction they send to the system contract. Preventing duplicate subscriptions in the system contract is costly due to EVM storage limitations. Therefore, to keep costs manageable, duplicate subscriptions are permitted.

## **Technical Questions**

**Why does the subscribe() function not work when used in a react() function to subscribe to another contract?**

The subscribe() function will not work directly from the RVM because the system contract resides in the Reactive Network, not within the RVM. To subscribe or unsubscribe from the RVM, you should emit the Callback event, which will send a callback to the Reactive Network.

**The call (bool subscription\_result,) \= address(service).call(payload); is failing, resulting in vm \= false. What could be the issue?**

This failure occurs because a reactive contract exists in two instances: on the Reactive Network and within your reactVM. The call will fail in the RVM instance since the System Contract doesn't exist there, so vm will be true. It will succeed in the Reactive Network instance, so vm will be false.

**My deployed reactive contract doesn't seem to catch the emitted events. Running the react() function using a cast call doesn’t trigger any response either. What should I do?**

If your cast calls the Reactive Network instance of the contract, the callback won’t be triggered because it can only be invoked by the RVM instance. To invoke a callback, you should run the transaction on the origin chain, which will trigger the reactive contract and the callback.

**How can I check if my reactive contract is listening to my origin contract events?**

You can verify this by checking for a new transaction on [Reactive Scan](https://reactscan.net/) in the relevant RVM.

**What is received in bytes calldata in the react() function?**

The bytes calldata contains the encoded data of all elements other than topics.

**What does the REACTIVE\_IGNORE value for topics mean?**

Setting a specific topic as REACTIVE\_IGNORE means that reactive contracts will not filter events by this topic when subscribing to events. However, events with any value for this topic will still be accessible.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAloAAACvCAYAAAAlm3BpAAAs+ElEQVR4Xu3cfWwV190n8LtP1TZPXvoY2iQkJGUIUEgMMSGkkPBihzezvMUFYsODIU6A2Mb4JTHEppeWRH36gNQktFEFaBfJaKOlrLIP/IFqS5uK0FIB2uzabXYN3WxrUVY1pa3lourWf/72/M6ZM3PmnJlrXzJJePla+ujO/ObMmXNnLp4vZy5kMpkMAQAAAMCnwikAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwynALe6LX/wiPfjggwAAUIB7773X+X0KMAJOAW5hd955p/PLAwAARoZ/h9q/VwGG4RTgFmb/0gAAgMLYv1cBhuEUpC988Q5as5+o4l+IVu4kWraNaN7K39E//MOXnbafF/7585//7NQL1dLS4tRuVfYvDAAAKIz9e/V28sQTTzg1GJZToOf/A8mQVVbbQ1++8z5Z+9Id99GCf09UOp/okQffcfb5LPBPb29vsP7Tn/6UXnjhBaddoeKC1j333EMbN26kmTNnOttuZvYvjDhf//rX6fHHp9O4ceOcbQAAN7tnnpnr1Gz52ti/V28nCFrXJVqYXP6qDFkz1nQENb7x6uVHH/mvtHgW2Z18JuyglZa4oMU/r7/+Ov3lL3+Ry/b2m5X9C8M2efIUWrBgsQiY36TS0gVy2W4DAHAzGzv2Iadmy9fG/r16O0HQui7RAoesr9z/eLD+yCOP0F//+tdIm7WLiZ4v/53dEf3qV7+iv//97zKY8EzQL3/5S7msf/r6+oK2f/vb3yLb+GfFihVy2y9+8YtI/f7774+s8w+30z/Tpk0Lahr/7N+/X35x0f6xx20HLbvNjBkzIut1dXWyb7PGxzl9+jR9+9vfDmrbt2+Xr2+//TZt3bo10v7zYv/CsH3zm7Od2rPPLnJqpoWrX6KmplZq2LjA2VaIStGHXZNmrafFU2LqeWxeMsWpsaam9VbtaafNJ9HUWO0vPy3PiZY0njTVNLTSuJh6XuLcVs4K15uaat02lsUvJVwnw/KpZp/+OVi/VNUKuJ4jbQfwWbJ/r95OELSuS7RQ8f0wZDz88MMydNhBa+LXN9P2DW5g+fWvfy3bFxcXy3X+OX/+vFzmx1D8M3bsWDlTxD8LFy6U2/70pz/J9ZUrV9KcOXPkcn19vdz2/vvvB/3zjzmjpX/08quvviqX77vvvkhdL3No5J/Ro0dHxm0HrZMnT1JZWVmkZh6TA+OOHTuCfvkRI/9UVFTQ0aNH6bvf/a6s/+Y3v5F17ot/+FGn3d9nzf6FYZo06RtOjeWb1Srb2Eqzx7v165FW0Bo3p5o2N7U4dfapBq0n10YCBkt8TykaSThK9GkErUnRzwuHLH4d98x62vTsIwVdz5G2A/ikyrbudWpJ7N+rN5IDPUPU92EP5XJDdLzFk7XcwCXqPHORDixTbXK5Qeo4fIRyl7vk+oBo2/Ful9zH7s82kqB1oGeQjh4+Jvvl9aNiPLzcLV4rxTq/dn88qF4/PB05bi7XQ539Q9Tkr/d3NYvXg6ptj3gf/nv6pPo/4mOLcfUclOu5fnUuNH4Px0+EY/NauujsiSPy3Nl9jUC0sGKHCg9jxoyR4cD+4fDA279dFx+07GBk//Csj/4x9+UfDlpx28w2+YKWufyd73wncQwcpMx+7aDFOBjqAPjee+8F9T179jhtbfzDr/pc2fXPk/0LwzRlyqNOjeULWuPETbOpNhpe6sWNdc4zi6lihlrf/PxSmjN/VXDT3LSxlh6WbT2q31Qh2s6TdQ4laxbMo4VrGqIzM+IYK5esl+24b641BUHqEZpmjalp21p5s5c3da6Nf5oql5TS5obGIGipMZZSQ32jv9/TtLmqVC4/tmQrzRPH2lCrjsVhko9ds62SHpyxVm5bubEhcszguFYtDFqi/40v+ctTaKV4nxxAxvltarbVyvfdVMXn4hvU1FBL88R7nv2gCjZ8/CCw8PkQ+89ZUEHTZb2B5jxVHBzrscVbqeGl9bRw1UvUVK/eLweohUYfgYSgtdm/hk1N6vw0NTbK4/E15PFsWFZK85a9QNPGRt+v6kO/T72ujrmu3p9x00FrbLH6bIjj1D+vAu/iF1tlbfHzW9W6aLdc1BY/5h4HIE2vrBzv1JLYv1dvJBy0DvjLHFhqT14JtqmQoIIFK11dRR7XB3qcfpKMJGjlPgyPoXXbIe5QeMyRBK1guxWIrldno3rVx472e5ByfgDLZJqpVLYLz+N1iBaW1bthQP/89re/DWrfe8Vtx0HLnLXhH569MlVWVgb92cfgoMX/itDeZra5cOFCZF23Xbx4sVzmPwTm/vzDs2rmGHjmyew3LmiZBgfDBPv0008725n++f3vfx8c/2YLWjzbOGnSJKeeL2hJYx+RN9NJ4qY7bl41LX9c1e3Zoyb/Zlr5jFq3Z0bM2Z/ITIa4Ma+b5/nrM+Xr7OdV28lLrBkYEYQqntTHV2HI7FeO6Zn1QZsHx6qQZ85sNTXpx3+if2FdY7j/tGVuwNIWTnJrZtBqqtTH8vsWY+f3GR2feD/jRCB6cbnTl36vbpBRdd2PuV2fJx12ODQ+ZvYrzu2mlfNkkFNhLno+1TV6PAhsYU0tmyFNmroqPLc+PrYKqq209HEvCFrLXzb68c9xw7fU9Q2O9dg3aOnUh6PHAPic2b9XbyRm0OLlpq4wIPTLUOGGoJJ6nqkZouP7qpxttpEELRmONr4uZ81K/dpwQSsUH7T09toJ7vGuh+6v8/tL1boVtNRx1TqPhceVyZTJ97Rno9vfMKIF8Zdou4EMCJcvXw7W16/8N3pnj9suLmjxzzvvvCNnunK5nKzfddddwbY//vGPwTIHLXM/Dkj8Y/f3ve99L7JubzdrJ06ckOunTp2iM2fORLZpdtCy2/AjTv2f1J07dy6oc2i74447nPZ6/WYLWmzOnPk0Y8ZMGboee6xYhqzZs+c47eK8LG6ojzz7UhC0pCn+93IeDIOWDlEV25KDVuQGbs66jFOzTmzOONHn1lWRPnimS4eGOctV4NgU9OvJoBUZY9BffNAK+GFSr6+zxj7jW/GPKiMzWv73tHT4eaw8LmiFyzNW1sr33bRNhRxur9pcT9BSbXidZ8mC/eNmtMY+TQ1+KFy6ORzP5Ger5Xswg5b93bPwO2pmn+b7q80ftJ6zgpZoV1P+uNMnQJqWN/3AqeVj/169kZhBq4/DzT719R2Wy10Ur1VBiOnsG6TnxGuHP7tjhp8kIwlauaun/eXm4FjDBa1wuYeOXhiiPf66M6Nl93Od9IyWDnXRoFUVvocFx+RrcFwx7u5Dbn/DiBYWrSKa+WT0ZPf390fW38oSLXim0e7ICVrM/HnxxReDOn9ZXv+88cYb8lUHLXs/XfvRj34UqdnbS0pK5PqBAwciY/jBD34QtDUDo2YHrbfeeovOnj0rl/nL7eYx+GfLli3ye166/oc//IF+9rOfyeWf//znQf1mDFps5synZMB68smn5DoHrVmz4r/LJB97ra+kyk2NweMfPYOxafEUOTvDj7kWrq51glb46EiFnXxBq+bFRtkuctOub5RhyxzPy8ujN2WeZRr3zUo5hvra9TJoqcClHo3VP69nasL3N/v5RvmYbc4CFeJqtm1Vj9FEiJj9vApy9cYslxxLTMBgcUGLZ8X48SM/Qo0NWiKc8qPONS+10Lzx/vmcv0q25zb8aHPx/Hk0b0mlXOfHfIuXLQgfHS4xHh2+qIJuQUGLZ7AaG+SjwU0yaD1Nm1YtpuX/3CgDar6gZX9HTfWpPg+bG1ppzaxwRst8dFizpFi2raxvVcdaHz465OuhtwN8Gv61aaVTy8f+vXoj4aB16vAR6hsYEoFAzdYMfHyaat84Fny/ib+zVblehIkBFcI4RFSubwu+U5XPSIJW5+Uhek30f/TMJTmjtYfHI/o2Z7jyBa3MgoNyjHtOXKRyWT8o9+04fIIGzuxzjnc9uk9wf0cod+2SXM9d7fGPcUSu83uoNc5J6Y9FAHyjjnpFMDuug+nIOQWa+zjF/hcOJVM20Fsid/zHfe62m5kdtG5l9i+MkXrooeR/6vx5sWezPi9zqlppUkz9dpPvsSrAjSTf/5E1kjb279XbyUiCFjicgrSq7M/00mqS/7rw2/VE//IqyceFb2U/0RfCbkgIWjcf50vdAACfEfv36u0EQeu6OIXAg/fNp00V/4P2NP2dmmrC7ybdahC0AABgpOzfq7cTBK3r4hTgFsZf6rd/aQAAwMjofxgFUACnALc4/j/S7F8eAAAwPPv3KcAIOAUAAAAASIdTAAAAAIB0OAUAAAAASIdTAAAAAIB0OAUAAAAASIdTAAAAAIB0OAUAAAAASIdTAAAAAIA08H+nDwAAAADpyzjJCwAAAADS4hQAAAAAIB1OAQAAAADS4RQAAAAAIB1OAQAAAADS4RQAAAAAIB1OAQAAAADS4RQAAAAAIB1OAQAAAADSYRUmNFMuNyQ52yLaRJtLwbrex9xXL3fUlwTtTvWpWt/7+yJ9HV8f7f/U1aFI7e0zV1R/AxedY5Yb+9n6u5qdWj7dh9TrgN9397t10f6uRc9L7Q9PR8/Vsn3O+Tt+YVDV+k4HNd1m7zJ3DPn2Y+WHL9IBvT6hzjme1tR1JXg/cbz5zZHz89qJi7KfXus9RxzqiRn7waCmjhd+hsxx6fXjLZ6qxZwrvW5+ZpxzbLTV50FfL3vs5vUyx2T219sff/4K0ZrdTVVPufXrt5Syos9gfVY1ZdvaY9p9dmaNt2vWGAEAIE60YN5w+k/yTWsWdb65VK57Lceo+4ODcrlT3JyOfzBod0aZ9tPBzVvf5EvFzXngzD6qPRne+PcY+3JfuVwYoOQ4rvLNVdfEjby/Sy2LvviV+wra5sLl3suD1HvGb5tRQevUhSuRG/eBrvM0cDXch3V+eImO76tS42sM9+8V5+MFudxMJdyfcX44DB5YEPahxhJu72zJUOV7l6j3sKdqP1Zj51pc+/6rg9RtjN3ej5WK5b739gcBI5cLz2Pustq3pP6g7CsStGbURd7z3jdr1DGDoNVG3e+ra2u+x8yEKrnfAX3+/POvju23M2o2DkBq+SA1WfvZ54pf7c8Mj8s+x3K7OA/8uVHnoY0q/Xo4dvd6BYzPKF9Dezufv4H+S+F7HgEOWnbtk6q1glbtinCbN0oEn+odYrmIJsbse13EMZyaYcMstxYZIwAAxIkWOLTsff8SDXx0jHI96sbLN+z+k8004K/LdtfOi1ePOpygcSlYNmdTZBgSN7jchWNyvfOyvsHVyL4O9AwZfdXQXvHKNb1/5Q/PyxvzgL8/96VnsuJu3CokhkHitff9QLLvPHl59rNngMz3LPsz2vJ+/R8eo86PB2ngnJqhC4LFhGbZF5+7zkbVtra9S27jGs8GyP399gcOH/H79WR7XuZXvhZ6P3n8k/x+msOgpQOoYeD9tuA48v2I96xCS/S9yv6sGT/e3rHVk8vem2K/D16Xy6UdF1UbY0brtRlqn7c/FKFbjP/UhcFIKNp7bpCObzTG5e9XOyFcl9v8c8XL9mdGfvbEOa6s3x+cY+87p+V5CINWRoZjc+xaXNCyZ2L31FfJa+hxrfJ1OtCu/mLR8ZG7bxIzaC2vU8tFxRWyz6JFW2gMbxs1k6pKuM0KqiguouJV26lt01wZmDYvKZL7mDNE+YKWfcxslkOXWF6hPvd636In11GRbNtOZTVqRiyb3U4bWndTmQhrY5Zsodbq2cExwv492jB3jGq/rUK+ttWp12w2nFlD0AIAGFa0wDee4+3qb/I6aLFe65FZd0cNVa6virRhZ9/0wjbBTZMfb6lZD/047OgZNbvCszuyr8YTQV9c47655sn920QYUzd6FVLCsSqqZs5saUGQ8GepzPAW9hPuZ97o+6z3LPszbtzmfkGAmdGmxtR3Ws7S8HiDbf4YZG3gUqS/8u+roDBwdTAIWsG1MPZTx8sftPT+Omjxe9Y1mx20ZJ/iuF5G7ReeY/89GLNX4WyVsa8ZxiPb26jDf9SYdK64Zn9mzOul99PnPRK0jDaesR4XtMzPaOTa/1i99g6o6zAQc/2TmKHHnt3iUKOXs3UriINWsJ7lYFQkXlsoIwJZQ4UXbMsXtDa8spuWjxf7t6lglRS0MpnZNEu8rtm+mxrEMZZz2y2L5DE3vFRHbTvb/TGpY5jHC5b1Mf0ZLfP9IWgBAAwrWugNbkxLg9mIbnHjObAsvCmVvnsxaG8/SjP70jdNbmPOdJTUHwv6Mm/Gui+zluNZjAVH5KNEXi83jq370iEiHLsnju2p/f3HacEMmuiryZ9R0cfpE6+qtjQYc1xoY+b75ePt4f0mvO7P8IXt+Gatj5frOyGXj14Iay/47fTsSvCelx0Mg5a9XyAMWjx2NbPnUW9HmdrPD1+8n3w/PAa/Fg0/ZtDi0KPOLQeoUq5tFOF3wA9WE9QNPAxaJUFf4XX3qO+9Kr/967TXP8+SGIM8VzFjCM5VJuYzY+5nnWPz0eFRP8QFY/fZQcv+jAafGTHetyeokN93okbW+HNvts3HDB81O/WyR2Xidc6mcAZIzVytkLNMmUlrKbt9rawXldaosGX0mS9o2fRM2PR1qg87aGWmraOGVSLQvbJDhi093qInq+ODVmau2o/73lkjXxG0AACui11Qj7TC7/6UBDfjcn5s9NERI9Co71qd+g4vhzdqTfUzRC/4j5gYz7L0nfEf/3Eb/SjQ70uGAqOmx7G366Lsa6AvvNnyutkX39j0MXWt9yfqC9cDPWE7/oI01/QjLP4ektyv77R/o49+mduc9YneuD3V17VB+X2gYFwDV2hPpRes67H3dqlHX4xnS7imH3/qGS1u0/tuWeJ+Shi05PXx+9Lb9T8c6Oi6FASX2sPqkV/wnn3me9NtjvozmmYtd9kPWPrRoXiPtcF1dc+7HWiYfs/m4z37XOl+zM+Mfn/mOWbmjFb/gGpjjl3WjTHFfUaDsV/Tn3cV/Phzt9eYPR1OdBaLZ6h2U3aXP8uUUUEofCy4gmqaeXu7Cly+mrnRPgsJWhMXclDbTeVLa6x9/aAlxsSv4SPFtbJ97aoKyraGAYtrm5eo5dZdasx6jAhaAADXxSkAQIEadrYX8K8Ow0eHrHhZDbU5gWWpfKwXrD+1Lrp+Q7DGCAAAcZwCAAAAAKTDKQAAAABAOpwCAAAAAKTDKQAAAABAOpwCAAAAAKTDKQAAAABAOpwCAAAAAKTDKQAAAABAOpwCAAAAAKTDKQAAAABAOpwCAAAAAKTDKUjjx4+nJ554AkB+FuzPBwAAAIxItPDQQw/ZDQAkfDYAAAAKFi3cfffddgMACZ8NAACAgjkFgETFxcVODQAAABI5BYBE/J0tuwYAAACJnAJAIgQtAACAgjgFgEQIWgAAAAVxCgCJELQAAAAK4hQAEiFoAQAAFMQpACRC0AIAACiIUwBIhKAFAABQEKcAkAhBCwAAoCBOYWQWbaGGCs+pOe20WdVUPG0qzXx2BWXb6mStNbubKlZVSOWzw764Hu47kZo3LaXMAxOD/dQ+66jK31fXmv3+ykoyVNW8m6qm+X3MrSHPOp7ez7Gijtrq1ontaylrjkOM31yvjYwxZI59eZ0YQ0m0vryuXb6fOavqgvejjueehxsRghYAAEBBnMKINMQEjbhaQAQVvcyByMvYgUqbTdmdNbRmvFpftCVsw/3PNNrNsvaNhJ+SdZTdvlYuc+ji1/jjWUTQaq2eHSzr+oZWEZpq2oP1+KAVHTsHrWx2h1zWx85mwz70+QqOdxNA0AIAACiIUxiR5nXTo7W5NW7N5M9ozVmylrKvqNDF4YNnicyZIg5FizIcSLbL9fhAw4YJWn7/mUyR6KslWNfHSww3IlzpNm3b1wX17C6erSuiCj9E2cdi9tg5aOnAFwStVvXeTfp4kRm0GxSCFgAAQEGcwvBGLaUiq7Z5126nFqGD1j+r0MPiZpg4bHA7nvXi/rhfu40yfNAq4xmoRVuCUBV3PIcxozVRLOv3VFsxXY4rW7ci9ljMHrsMWhk1g5cvaCWGvhsQghYAAEBBnMKwODjYtbZNc51ahPHoMNumvssVF3yC733xd6K2LJIzQhP1fpH2wwcte5+44zmMoDWneocMTN5qNUNl9hF3LHvsOmgxPQ4+d+r98EybqiFoAQAA3LKcwrD0d59Cc+V3rux2EUbQ4u8mLRoV8yhvfEWkH/19ptZdqs3MUWaf0aBlPn6rXWHU5SM/tWweL/ExnfHosLZazV6Z3z3jWbKaUhW0gr54litm7HFBK5MZ47wfc0w3euhC0AIAACiIUwBIhKAFAABQEKcAkAhBCwAAoCBOASARghYAAEBBnAJAIgQtAACAgjgFgEQIWgAAAAVxCgCJELQAAAAK4hQAEiFoAQAAFMQpACRC0AIAACiIUwBIhKAFAABQEKcAkAhBCwAAoCBOASARghYAAEBBnMKwvK1HKJcbknq79o14W14TqoL9mJfQZy436Oybbxt74Y1j1H3IrUPhELQAAAAK4hSGxaFGL/dzwOk7EdnmJWzLh/c71R5/jEjwauxKPJ69rZuPf22Q9rx3EUErJQhaAAAABXEKwygT4eV8sO4d6jFCUb5t+XG7Jms9rk9nm9W/uV4631PLYhwIWulA0AIAACiIUxhWLncpXG/psmafkrflc/Rj9fivZEIZnbowSP1dzfF9yvXobFfStgCCVmoQtAAAAAriFIZlhpkBfjxnBZ/OFi92W14z2mRbrdzYZvb52olLkT5782wLIGilBkELAACgIE5hRPqvDtLA5YvkHb4ows2VyLbODy8lbkvCAcmz1l+L6fOFGbwt/nhx2yQErdQgaAEAABTEKRSk99oQ5c7td+rDbbPZM1FyFqvRbZdZdiS5z6RtCFqpQdACAAAoiFMYgTLqPKO+6D7Qc9DZ1nH4WMK2DDV1XYl8/0qTjwz7e1Sbw9y3+V81hH3agYzl2yYhaKUGQQsAAKAgTmEEmuV/m3DqJ6/HbxOBJ36bClp971U59UymhPquht/RKqTPfNskBK3UIGgBAAAUxCl8qnpFKCqNqcPNAUELAACgIE7hU+TRqQsxX1aHmwaCFgAAQEGcAkAiBC0AAICCOAWARAhaAAAABXEKAIkQtAAAAAriFAASIWgBAAAUxCkAJELQAgAAKIhTAEg0ffp0pwYAAACJnAJAovHjxzs1AAAASBQtTJ482W4AIOGzAQAAUDCnQHfffbdTg9sbPhMAAADXxSkAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwykAAAAAQDqcAgAAAACkwynA56R42lRholM3TZRtpjp1uNEUyes0xqlHjZnE13OKU4eoyvVVVD7DrZtKllWJds85dQCAz5lTCNg3Cb4p2DVtih8AvFFhbeID/vIoj4onjaHMAxNpyrgif/uYcLuJ2/p9aWHNvSGZwcQMIPJ4/nL5qgpn3HagGTNpLpU/49fixiDGHlnX+5WUUVlJeKykMVTEjMGWba2JjKto3HS5n9mGg1ZN625n35Gwj8/X026jOdfzgej54nrRuPB6mO87Iu5c5rme5hiDPvXnx6/HnUt7na950vWUn7uE67lc7GdeT+czzMcSnxX7urhmy+sZHdcYsd/SSDu+Btnsjpj9hzFjqRM8OIw47QyvvXnE2afj8BEqMfrU9dLV3Jcn+zTp48Qdy67x8TrebPPX4/viY/IY7L5sudwVZ+zMM5Y5aHE7uw0AwOfMKUjlW9ybeXbXFqemtWZ1+yJx41DL/OpxbVY1ZetWUGZFHbVWz1brw9xcNogwMUuvi/ZyP7E8qzrcj5f1sSLH42U+nvHqiWPrbfZ+bWK5SC9vmhsZg14OjtFaHdlvolyeKPprV9vtMSzaEjuGOGbfmcwiWuSHHHOsLG5cw3GvZ9GIr6c+J82VKpDoa8CvbTVlcjm7y+4/KjJm43qa701el+Z1wbrz+Uk4l/Z+fF2CZeN6Rs8vW+FcT7U8kWrmJo9BH9e81i4OWmHfPMbmtSr4bd4ZPVfD/VmIk8sNObWzb3pOLdg24LdfdoxyV0+L5TbKXbsoa+WH1WvmUI+o9cjlzv6w/6auK9TZaBy7v0u+ei1d9Jo+RmNXZEzB8bi9PF7Yl17OZPbRgQVqufvaEHX4y3HsAMXHOiXG2DRMOwCAG4BTkHRwMOmbT5zwxpyhBn95wwpxc9pW4QQtvkHpYJMkKWhlxq8Nbm7NfJxFYVjgG5Y8Hi/roPWKfXON268uWC5+1AuW4wKNefM096v137MzBg4HMWOI4wYBxTy3LG5cw7Gvp7d6+4ivZ3b7Wr8P9X7l+cvowNour49+/0mSghZ/Vjy/zv1Gg7N/Ls2gFXMuo/vx5yv+errnNxq0zP30cZzPsBjDLGPWNlk0aJk2W6H0eoLWwPt6psi34JjTxmSGIH68VnvyCnX/ONzeWZ+RQUsHrJEErUymjI764eh43xDtEcGpNOF4Zl96mYNWZ4tnrCeLC1A8RgQtALgJOAWas6mdKsa7NbudiW/MfLNjM/3HLRtmZWjRFnUj1kFLtcnfl9zXClq679aXw0c22S2L5GvtCvU4km9YfLya0qIgaLHl1eq4ifsl3BDjAk3kxmws67ZJY2jeGQ0RceLGUTS72rmxx40rn7jrmc1ud9qZzOupazXiPZTxvv7sEQctr2K7bFNo0LI/K5lp6+R14f7s6xl8fvz97XMZ3S8ankxu3QpaMaHL+Qxn+JHpbDmG1peijwGj4oKWR5vrWuT7Muv2+rDaTzu1gZgZLpMdQA70DEXCU/ehjAxasq8PXs8ftMSxpH7VXtaunVevPQdjj2f2FalNKKPujwdFX2r/JHH9IWgBwE3CKcQGgriaSc+A8N/W9SMvvknxo6fNlWHQ4pkM+cjp5fDGGccOWnIGZNRSyrbpmSj+bosfBvxHYOqGxY8u2/2bYlH4HZlJa2lR4n5h6ChsRivcT8/i2WPwHjW+1xaMIZ5zY54kgkCbG4jixpVP3LXbvER/Vy6eeT2DemmNvA7quupHiJ6c8Sk0aOnrqT8rVc1hsLOvp/78xJ9L+3rOTLyezvm1g5axnw6T9meYx6Db8DVPvp5xQUtZZD3GLTRodceEqty5/U4tst2aYap87xL1Hvb8mkfH12fCoCXa5g1ackbLE30ORvrX4o5n9qWXvflh/eiFITq7zx132L8boBC0AOAm4RSoqiS6Pn1di1OzRR41+cv6hlwrbtZm0OJaWU173seHsUErE86srdkeHs+cTZK18SvCR4diLBtWVwTfv7H34xulDH6NNVT18o7I7FEkHMxdS7Uv14mb+Q75yjX56Kx1O9WKduF3jqwxjFKPSvnL0+Z3h+JEb8wetb68Tu5nf/G60KBlXzu+nnYbm3k9myunB8tmaDO/L3ddQcvozww59vUMPj8x59K+nvzK41qzZK5zPSPnV17PFud68meFr6f+bDqfYR5Da50cQ/6ZWStocWgW7cuWrYucQzmuQoLWxhPUd6LGqTntLPx9qlPv7qf+a0PB47p+EYY6Dh8LQ5EftPiRoBmU4oNWRs6svSBeS9+9GGnLgUkf7+0TPZHHg9EZLRHWrl2RX4bn45UGdVdcgELQAoCbhFUwvruk2TeGm02+f10XKor8i8mRG+P8i7c4if8qz5A0A2IrKGjdgtdzJOeSZ56u53ryv+pM53rGz2iZM2xaIUHr7DU3kHDNbhfHnEHS7H8pmCY+3nPzPaduG8kYRhqgRtoOAOAz5BQAAAAAIB1OAQAAAADS4RQAAAAAIB1OAQBuQE9/6S76f2OmfeoujZlKv7t/Kv2f+4vpovC/7n+MfnXfo/Q/hf9+7xQ6e+9k+sXXJtPpr32Dfva1SfTfhJ9+dSKd/OoEOjF6Av3b6Efovwj/ebRH/2mURx3C4aJxdKjo63RAeKfoYfrhPz1EPxD2fWUsff8rD9Ib9zxAe4Ss0H7PGNp59/306t33UdNd99G2u+6l2ru+RluEF+/8Km26czRtEKr+cRStFb71j0W08o5/ouXCki9/hRZ9+R76dzHnDwDgc+IUAOAG9NAXviQCzjfojAg6vxQ48JwTzovwwwHow/umyDDULfQIvxY+uu8x+t9CrwhLF0Ro+o3AAer/Cr+9XwWqPoHD1e9jQtfNatQ/fME5fwAAnxOnAAAAAADpcAoAAAAAkA6nAAAAAADpcAoAAAAAkA6nAAAAAADpcApUXFxMo0ePduoAAAAAEMWZibOTXfdFC5MnT7YbAAAAAMAwEjKUUwAAAACAdDgFAAAAAEiHUwAAAACAdDgFAAAAAEiHUwAAAACAdDgFAAAAAEiHUwAAAACAdDgFAAAAAEiHU8hv6RZq29lOG5bNlOtV29vlurR9XdCuZlFRsFz7Sjtls7sj+2uZzNLo+rM11LB6qr+vR8vHZiLbZ9rj8XH/ba/UBeutbbsp29qi1p9aR0V+vW1n9PhqDDPVsm6v+9i5I1ge81SFPEbVwol+P+H+VU/5fe+KjgFufbWHz1Pu2iDtXeZuiyPb54Zob6XnbAvMqKHerv3BevflQer/+HywPnB10HdRrp/V62f0PiV0qudSpM/SloP+cp1s23/hPJX427zKfXJMZw8nf3bNMRzoGXK29/UPyfNg1s72D9Lbcnm/MWa/zTJ1TM9va26vtfqO0u8jY50nT46hv+dEpH04BraP+j/YF2yzzyPr/vhK0L5y3wk5xo76kmB75+Uh6v6wh079MDyGuT+PaeBqeK36r4nzMnBFrdefkMfrPdMVthfj7tfnJMberotyDLUT1PrxC9Z5mlAnt3ef8N/XDGv9OmRbq53aJzWrOvxdCnAbcgr5rVC/jGeua6GGCo82tPoBKqKMsru2+MtzadYoVc/urAnaZLPRP3jZuhX+cpHYtl0tL1J9hNvi1ez0xzBqNs0Rr54YowpWE6mqRLzOqqa2LYtUX9nwZrJhlu5jdnCMcIxlYTjkuv/Lh98vH0P1Fb6Hzbv0GGaqY/p1HfDgFjRhP+U+OiKX+3Nu+IiT61FBYSCp/aEe6u46H7TjG/FRDnGNXZQ7p26euX7zRu0eO5e7EoQotT4kgpe+mTcH+6v9PLFdBYXjffFj4mBljsEJWuI8lPvLfSdqgvrAwBAdkMsHjfejx6TCR+6aCiX29mR+O+s8nRWBhsfgtXQljCFDez4YlOdCb7PPY+81433xtb1wTC73mfv44w5s5DDm15YdEX32BNu8N3Xg8uj4xow8f2q9hPpPNst6Lpccsljv4aXyVY+727nWar2pyz+f/vreM/n7zQdBCyB1TiE/P2jxHxwdtIqnTZXG+G04+JRvUcEj6Q9YctDKUMU2tW+rH3Sy29b6x1CzSbYgmPlq7YAkgpYex0iDFr+HIhH6yvy2a8bHHTd8DxPFeamtzh8I4RYjbvadjSKgfDxI/Vf9G9w5vsGVUWeLJ9dzA+rGa4ahyvVVlLusbro63JQfCm/QdjDJ9Z2n7n4RGOSs2UF5M2XBMfx1FXaqqLdPrZuzbPpGbAYtXjZnj/QY9c3/rAgpTbyt8URkDBy0PK4vO0h7eabFHzufBzPEcbv4oNUs1yt/qGb35DGdIDYkw2LHR2r7Kf/81v7kotEu7DcIbuI1fgy8rccIP+F50+dx4IKaPep735wNioahSNASwaq/qzmocSDr4xks/z3pQNonziO3C4OWGtvec0PU+5EKf0e38hjKgr5U6IueE3V81X+uT/XF77WkXVyf/nBclevbwiAvjlkpZ8NK6FR7tK8kkaAlfncWy78oj6Gaufw6nSqKi2jiwi3yL6/8e7W1ei5lHpirfg+PX0HZZvVkQ7+ypPsAwG3CKeQnAgU/Lmutni3X42a01B+4Crmc9AcsX9DKjF8rXqeGf2CHmdEaSdDiZf5FkRi0drXLR392n/p9Vvizcib7PYwpKaPWXRzQ3LZwC+JZlQ8uysc65iyPvtGys/vc/WTQCoKBehTF9gZtosGkr2s/dXx4hboPqdmNuOPIdRkwDqpwJLeH4S0paOm2nX1h4PDmN8tHaAPXVEh5oeNiZAzme+097MnzwDd2Pg+6b54BiwStvtPUcfiI8Loaw8fnqfP7S8NwF9nO69FHgGHAMcNHNGjpcMFjaDp5xRqDGOu7ZcRhRr/nsG+1nwxD3M44rxycmvzHdtFx8KykCmDmtZTbFhyRQZSPzdt4OS5odXJwXWD0K7b3vVcVtIkLWtrRj8W+8nyLz4585Bu25c8Xj5uXndnHETCD1vK66O/3olXh71r+/ce/3/XvUf0X42b5OjWY+WdJ9wGA24RTyM+f0drctpumZ9ygNX1dC1VNU8vN66ZTZtRSmuhvCx8nuiHFDlP82C54RDdM0Aoe22UmUrkIRMVr9XetitTfwnTQ2rk7OWj5x9i8RH23LHgPelZtO4e/DK3ZvlseQ9aM99BmhLtaYyYBoesWJm6ouXP75bJ+vMQzU96E5vAG6gcBnpEp5Xb+Yy19MzcfS4XMoHVQ7pfJ1FDu6mnyRP9n3/RU33Lf5iCU6FmyU9/xt4v2us+4oNU9oI4dbvPH7O/H4YtDCj+uKjXGEN68y+j4+kwQLLg28H5b0E/yjBaP/ZL/elG9OtvVmErfVduD87RMPc5Twn75fHr+9tgxbAyDmz5f0fMYvm99LP4+Vnis6LjianyN93Ao88dY2qHGLrfxbJIRtAbO7ZPbe9/l8Oz556EtDKoX1LH1tQxCpP+olbfz+9JjL//JJX8s6lUf2xyDCprRsccxg5ZXEQarhtWe/Au0/H0+qkz+RVgGrdm8nb/ywd935eWJ8i+cZp8IWnCbcwqfgiIqftSLqafHe3RqNNQ8MJG8mFmoT4KPYddMYyaFj0/h9lG5rMSpmcrXV0XWn7PWS1dXRb5T5SoJgkzQx3wvsl65PjrbZa8XimdFojVrDBPKqHxGdH2482CrXP+cUzN586Pbh2vPY3Bqw7DfZ6HvwRXdn99D5DzFKDVmzFjl6rLoujXGkmXWmO33YF+7GUuHHYPJ+Y6W+F068QGzzZhgWc9oTRkX/uMnpv/CaraL9Alwe3EKAABwm5L/mvqlkQV189GhMpcarKccMyu3+/+6290f4DbhFAAAAAAgHU4BAAAAANLhFAAAAAAgHU4BAAAAANLhFAAAAAAgHU4BAAAAANLhFAAAAAAgHdHC5MmT7QYAAAAAMIyEDOUUqLi4mEaPHu3UAQAAACCKMxNnJ7vucwoAAAAAkA6nAAAAAADpcAoAAAAAkA6nAAAAAADpcAoAAAAAkA6nAAAAAAAp+P+DyBUEd/Gk/AAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,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>

[image4]: <data:image/png;base64,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>

[image5]: <data:image/png;base64,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>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAloAAAFRCAYAAACsdAO0AABLFklEQVR4Xu3dB5gUVfY28NXdzzWzfyO4K5JUJKOACcU1AcKQk4BIziBpgGEkg4AoKiAoKFkRJSqCGUkCrgiSc1BEkJwFgfo4t701t+p0z/RM3e6u8PI8v+dWnQodZuh+51bVrb/97W9/MwAAAAAgJlgBAAAAAPRgBQAAAADQgxUAAAAAQA9WAAAAAAA9WAEAAAAA9GAFAAAAANCDFQAAAABAD1YAAAAAAD1YAQAAAAD0YAUAAAAA0IMVAAAAAEAPVgAAAAAAPVgBAAAAAPRgBQAAAADQgxUAAAAAQA9WAAAAAAA9WAEAAAAA9GAFAAAAANCDFQAAAABAD1YAAAAAAD1YAQAAAAD0YAUAAAAA0IMVAAAAAEAPVgAAAAAAPVgBAAAAAPRgBQAAAADQgxVcLzm5q9GrV29WJy++2JPVyBVXXMFq4fTs2UvsO2fOO8R8nz592Tp2bdu2ZTWIPfo5kcaNm7BlWUE/e3stPerv4HXXXceW63LTTTeyGgAAeAYruJr65dagwfNsuRPqvp9+uiyrgbvUq1dftDfemPUg4uTnS8Gsc+cuYvraa69ly6VI4T9aN9xwA6sBAIBnsIKr1ahR0zLfvHkLI0+ePEa2bP8S871797G0pG3bduZ0jx6p5jT1jNn3b6f2ctSp86xlmdxvxYoVRZs3bz7Rqo8NsVO3bj3Ryh6tli1bmcvs4Ub+HLt16y5a+bNTg1aFChWMsmVDAZs8/HBp4+6787N9SOq2MmjdcMP/sfVle/XVV4m2dOnSRps2oV7QihWTBPs+5fMM7fMGIyWlhzkPAACewgqu1qJFS8s8fUlR0JLzMuRUqlTZrEUKWvbejBw5cljm7evIx6Z90CHFDh06inkZtMJtA7HTsGEjo2jRoka+fHeKeQo09HMh8veAfhZUl2Hn/vvvt+zDHrSorV+/vtGgQQMx3aFDB7ZP+7bUyqDVvv0LbH01oD3/fEPzecpQ16VLsrm8XLnyok1KSgtftH6zZs0tjw0AAJ7BCq6mftnJL6hwQUv9Ao02aKlfiPKLzR601FCFoJVY8tCh/LnJw3ikZMmSxnPPPWfO29epXz+0TP19kkGLarJ+3333mcsLFixkThP15yx7oAoWLGjWZGhSe9dov7Vq1TYefPAh8zFq1aplWU6tGrSoR4t613LnTvs9BwAAz2AF16MQpIaivHnzmtPqyevyC0wNWuqXXrgT3ekLU923uo48NEVfsFTv1KmzmE9KqmTZR7j9gn4yLKnT9gslaLpr127mz+TKK68Utfz5+SFB9RCeesiwevUaYcOz+nMuXry4OV27dh2xvuwhpYDWvXuKmKaAJdejw95yumnTZpbHqFQp7XfqpptuEm2XLmlBEgAAPIMVfEF+aT3yyCPGv/6Fk4kBAAAgIVgBAAAAAPRgBQAAAADQgxUAAAAAQA9WSDg6ebhdu/bixHU/odeUK1du9nqD6vrrrzeefbYue59ALzrpXr0aEgAA4ooVEoaGXohmEFEvoyvI6ER9XbeN8aInnnhSXOl3771pQydA7NGVjxj4FAAg7lghIegvb3vN7+wjjQcB9WDZBw2F+Ari/zUAgARihbgL8gd/kMLWnXfeZQ4yCokV5P9zAABxxgpxRaNk22tBQ7dtsdf8iAYOtdcgcWrWtN43FAAAYoIV4io19UVWC5og9C507hwaRR/cA//3AADighXiyn6TaLumTZsae/bsNf7884InrV+/gb0muwYNnmc1v4n1IdJhw14zDh8+yt5/L5s//zP2OnWiq2DtNQAA0I4V4qpq1WqsJp05c9Zo06Ytq3vNmDFjxWux16UiRYqymt/EstcuvffW644ePW5MnDiJ1XWoW7cuqwEAgHasEFeRgta+fb+zmtedPv0Hq5HChQuzmt/EKmj98cc5VvOb1at/MrJnv4XVnaIrQO01AADQjhXiKlLQ2rt3H6t53aJFS1iNIGhl3fDhI1jNjyKFdCcQtAAA4oIV4ipS0KpevQar+RWCVtbMmfMxq/nVuXPnWc0pBC0AgLhghbiKHLSqs5pfIWhlzezZc1jNrxC0gqNs2bLi7hHEviwr+vTpa5lv1KixUa5ceaN48eLprgcA2rBCXOkKWu+88y6rRWvr1u3Co48+ypZlZOrUaayWWQhaWZOZoLVz525j7dr1rB4NOkfKXiN030r6vdm2bYdZW7t2HVsvnLZt27FaehC0guOpp542p52MPdepU2hIFXW8tKSkSqKlMKdeCUxXPusKdgDAsEJcOQlax4+fNKdnzZrNlmdFwYIFWC09X331NatFMnr0W+IqMnsdQStrog1amzZtNqfPnv2TLScffzyX1aT9+8NfmJEnTx5z+vjxE6I9ePAwWy+czN5zEEErONSgRfenpLZ37z6iffjhh0WrhiR5w/AmTZpatuncuYu5jrwjgwxTFLTkMlmXjwEA2rFCXDkJWuT8+YuilUHr++9/EO27744zChUqbPkyGT58pGh37fqZ7Yd06cJvaP3AAw8Z3bp1Mx5//AkxL7/w5JACMmitWbOWbavq16+/cerUGZO6DEEra6IJWj/+uJrViPwZyJ/nzJmzzGXHjoVC09mzoWUyHNtPSFeDlvw9lEGLxvSi9sSJtD8Gli79TrR0Ra0MWvPmRTdWFoJWcFDQSk7ueulzp7tZe+GFDiIsSVSrVKmS0bdvP+PJJ58y6tR5lu1HDVoymBUrVky0Mmj16JFqroOgBRAzrBBXToMW2b//gBm06Etyy5Ztgvzy27Bhk/iypF6HUqUi39CYPsyaNm1mzsvtSaQvul9+2WOsWhX+y1y1fPn3lqA1YcJEUaderrvvzm/07z/AXLdly9AgrhQWqVXXpTZbthuMW2+91bjmmuuMp58OfWCOHz9BtJMnT7HMV65c2bjpphvF9Ntvjwm732bNmou2dOlHzOfwyiuvinbSpMminTgx1HbtmhZG7X9ty3Vef/0N0b766mvmuvK5y+cl9zt27DuizZ//HqNEiRJGjhw5jGrVQj/7yZPfs6wrDw8/8kjoEG80QSvS4cI33njj0s/uVzMwz507T7Tjxo1n68oeLfr9UOvp9Wjt2LHLXEZfcurvEqGgdeLEKUstPZF+/5xA0HKncIcO1f93RD3MR0Hr8ssvN+dbt24tWjVokWzZ/mVOy6D1zDMVLu07FOgQtABihhXiSkfQovMOvv76GzEdblylCxcMY/PmrUa+fHcaJ0+eZstVO3fuMqfVc2/kF7L9voRffvmVOLm0fPln2L7sqEeEQtbu3b9Y6ujRyppoghapWbOWOU0jrqvLDhw4JFoZtB55JC1s3nPPPaKNJmjJ32MZtI4cOWYuK1PmMRH85XzRosXMHq3z5w3LPiNB0AqOcuXKmdPq7xydrN6lSyg80e8ezdNhQxma6DNTPaG9WrVqltH/1WXq55UMZOofewCgFSvElY6gRdRznyhsqV9M6geI+gUo0bokXA8DndOj7mvJkqViPfkF/c03C0Qb6XBkNBC0sibaoNWu3QviZ6iGcPq5Uuil3k5Zkz9nOrRHP+PPPvtCzMufdYcOHS37zZs3n9iGwtuPP64SNfn7dccduUU4Vw83yvmSJUtZ7jNo7+0KB0ELAMCzWCGudAUtL0PQyppog5YfIGgBAHgWK8QVghaCVlYhaDmDoAUAEBesEFeRgpYfzxcoWbIkqxEEraxp1KiReWm73yFoAQB4FivEVaSgFe6kdq+TJ9TbIWhlXaT31G9++OFHVnMqyEGLhmuhq2ZpCAVwv9at24gBgu0/RwCPYIW4ihS0iHqlltfRlY/2moSg5cyQIUNYLVbkCe1duiSzZbESqzAZtKCVPXsO8Xv4/PMN2TLwBrpCEiPYgwexQlyFG2hPRT1bdFUXXZnlRfTcM+qdU8ev8qtYBq2OHTuLMGJ/73WTw3NI9uW60e/NypWhqxljIUhBi8aKa9GiBauDN6kj4wN4ACvEFf46iW0IcQs/vEYKPpFG9/eiIAUtGpjTXgNv88NnCgQGK8QV/jIJxgeGX16jDFlOxk1zi6AELb/87gH32GP/ZTUAF2KFuKNb0NhrQWEfBNOv/PRlt379RlbzoqAErQoVKrIa+AP+UAePYIW4o5ukVq9eg9X9jq6mufHGm1jdj/wUtPwiCEFL3o/TLW6//faLd95556U/Lu828ufPnyHbehdtbXpoHft6Yj6Kx7ZvZ8qbN6+4z+pll13GXlsiVK1aldUAXIgVEqJ06dKBOl8raMHDT6932bLlrOZFQQhabvi9o1Byyy23GHfddZdAQecvFxVq3SS3kdvZW2Va3Zfcn2XfYR5frpPuPu3PWc7bXycARMQKCUVXIdKHI3UJ+1XZsmk3jQ0KN3zhgVUwglbiDy1dfvnl9gDDpv8KNSwMKfMs8CjTYbdRwpJlv/bWzl63PSdLMHNLzxaAy7ECgHZ+Clrr1m1gNS9C0IqPcKFFDUHhAk64cKMGJFtYMnuu5LytbvZMqY+h1pXWvtz+XC3rXX311ez1AgDDCgDa+Slo+QWCVuxRj0+4IJM3b96LdL6TDD9KCLKHG3M72dI5XvZavnz5zHmaVh5LPA65VDcD2V/bhA1ZynMRy+jxChUqZC5X18mVKxd6tQAyxgoA2vkpaMVyENF4QtCKPQohajCRKlSoYOTOnfvim2++KZZT8FICzkVaJkPNpWnRUuBp3bo1tRdz5swpar179xbbjBw50nwcmpZhjDRp0kTsg0IRBa6/Hs/yfGQ4GzFihDlN69O6Q4cOFaEsOTnZss3OnbvFIL40KLP9dQOABSsAaOenoOUXfgpaU6a8J9r58z8T7Zo160S7evUa0U6aNEW011xztXkLHnkIeOXK0H0kZVuzZi3RtmrV+lLAyCOmly1bYdmvbKdOnWY+h65du4r2tddeF+3cufNk0LIc2iPly5c3cuTIYYwaNUqMWE+1e+65RwSiunXrivlevXoZr7/+upju0KGD2E+bNm3E/KuvvirmW7ZsKeYrV65sFC9eXAQsutH6X1c2isfs27ev0bFjR1rnYpEiRYxrr71W9FBdc801Rp48eYwBAwYYd9xxh+i5Gj58uAhXb731ltgvBUKap+cigxft9/bbb7cM3nvs2Anxmvv3HyDapUuXiXbAgIHm+wMQYKwAoJ2fgtYPP6xkNS/yetDauHEzq9nRECr2WjwpQUuGFBFgnnnmGXEl4qVwdXH06NFGUlKSUbFiRbGcwlfZsmVFQKJlakCjHi2ab9q0qfHEE0/InquLVapUEdu1atXKKFasmOj1kqGoWbNmZkCifcjer0tB6yIFLerBohr1cv0VtES9ffv2BgU7mq9Xr56lN4seVw1a+/b9zl673bZtO1gNICBYAUA7PwUtv/Bq0Fq0aDGrRZLoQ4dEBiU1aFGwopYOHVLbsGFDY/DgwSLAUNipXbu20a9fP6NatWoilFGIom1p2V/nW4lt/9qfCFoUjqjnqWjRopbztFJTUw0KW9T71adPH1GnQ45XXXWV2IZCFvV4XZq+SIcJaV+078cff/zS+/eiWIda9flT+KJeK7rH6IkTp9hrTs+KFf9jNQCfYwUA7fwUtPwymr/XglZmApaU6KClnqOlBhUZVpSa5RwtdT37tup2f5GHJtUT6e2PZdmvfT37ftTnYn9eauvkZPhDh46wGoBPsQKAdn4KWn7htaCVFYkOWkQGmXChRwYZuY7qr/VpuSV42abVoRwsgShMQDK3/Ws6Yl1uqz6eWpfb/vOf/8xy0AIIEFYA0A5By328FLTOnDnHatFwQ9D6a8DSiEMoKMFF7TGy9C6p2ynrWep02JHOScuePbs9hKnbSmpostTkdJjHYfNOQxauWISAYAUA7RC03MdLQSur3BC0JBlewoQZS8Cyh7BwgUhuI+s5cmS3nJxON9JW17ft0/44lv3ZH195TMtzotfkNGgBBAQrAGiHoOU+XgladMK1vRYtNwQtCiOSfZlOatCSw13Ekq7Xc/bsn6wG4DOsAKAdgpb7eCVoOeGGoEVkKFEDl71mp26b3rpyPRo8VAatcI9v36faRtp3NI8LABliBQDtELTcxytB6803R7FatNwStOLl/HmD1dyudes2rAbgM6wAoF2sglbPnr2MGjVqGo8+WsaXnnzyKaNXr95GixYt2Wt3yitBi0ZMt9eiFbSgBQCuxAoA2sUiaHXvnsJqfkah0l5zwitBKyUl6z/noAUt+mevud348RNYDcBnWAFAO91Bi3p57DW/q1q1Gqs54ZWgRbeasdeiFbSgBQCuxAoA2ukOWrp7d4LIK0HLiaAFLS/2aL355mhWA/AZVgDQDkHLfbwStKZO/YDVohW0oAUArsQKANohaLmPV4KWE0ELWocPH2U1txs9+i1WA/AZVgDQzs1Ba926DayWGRcveu9wDfFK0Jo1aw6rRStoQQsAXIkVALTzQtCaMGGiMWnSZDFNo5G/8sow448/QvfYo3uyffDBh+b0oEFDzPu00cjWkyZNEdO0Pm3nZDTzePFK0HIiaEHLC793dm+/PYbVAHyGFQC080LQSk+4m9+uWvWTaM+fv8iWeYFXgtbMmbNYLVpBC1oA4EqsAKCdn4LW1q3bRLt06XeiRdByLwQtAHABVgDQzitBq0uXZNFSsCpSpKgZotSgtWfPXuPuu+82TzxetmyFkZzcVUzT+oULF/HEZfZeCVqDBw9htWghaAGAC7ACgHZuDlpB5ZWgddddd7FatBC0AMAFWAFAOwQt9/FK0HICQQsAXIAVALRD0HIfrwStSpUqs1q0ghC0+vbta0736uX+19uvXz/R5sqViy0D8ClWANAuEUGrR49UC/vyWBo5ciSruY1XgpYTQQha/fv3F2haBq2uXbsaAwYMYOu6RfPmzc2A2KNHD6N8+fJiWtYqVKjAtgHwMFYA0C4RQUvKkSMHq8XC2rXrWM3NvBK0pk+fwWrRCkrQorZMmTIiaMn5W265ha3rFu3atRNtqVKljJdeekmg/6fdu3e/9H9b72cFgAuwAoB2iQxauXPnFm2ZMo8Ze/fuMz777Atj+fLvxfhM27btMNfbtetn45tvFlz6ogr1BJw7d94YNuw147ff9ov5kydPGVOnTr0UqNaL+c2btxqffDLXHCSSrkb8+OO5YnrBgoWiPXDg0KXaJwLN0+CmtI4cCPXtt8caH3740aVtf2XPO9a8ErScCFLQol4iCimpqaHe26effpqt6xaNGzc2p0uXLm1OywDWokULtg2Ah7ECgHZuCVr2ZaRhw4aWeTmUw++/H2DrEgpg1E6bFhopXlJ7tChotWv3gjl/5swfln337z9QtFu2hMbkSgSvBK0ZM2ayWrSCELSSkpLM6WeeeUa0VatWNbJly8bW9YLLLruM1QA8jhUAtHNb0JJhiUQKWqR27Trmuu3bt7csnzhxkmU7e9B6+eWh5vyaNaFlctsBA0JBS1q/PuNBU3XzStByIghBCwBcjxUAtHNb0Dp06IjxySefGlu2bI0YtKilwLRuXehQIR0GPHXqjLl85szZ4jDioUOHxfzAgS8ZFy6EBiqVhw5pfuPGTcaoUaMs+5ZB6733phpLliwNe4ufWPNK0MI5WgDgcawAoF0igxaE55Wg5QSCFgC4ACsAaIeg5T5eCVqNGqWdOJ1ZCFoA4AKsAKAdgpb7eCVo0Xly9lq0gha0tm/fyWpuN3bsO6wG4DOsAKCd7qDVq1dvVvO7Bg2eZzUnvBK0nAha0AIAV2IFAO10By3Su3cfVou1oUNfNT76KOsnZzuhuxfPK0ELwztE7/jxk6zmdsOGvc5qAD7DCgDaxSJoEQpbbdu2M1q0aBlzJ0+eFlcdSjSoon0d3Vq2bCXeu6efLsteu1NeCVpOBC1oAYArsQKAdrEKWvFEI8CrQcu+3Gu8ErRmz57DatEKWtCSdynwkkGDBrEagM+wAoB2fgha9erVN0PW6dOhkd69zCtBy4mgBS0AcCVWANDOD0FLkvc69DqvBC0MWBo9eQcCL/HqrYIAMoEVALTzU9DyC68ELSeCFrS8KCmpEqsB+AwrAGjnp6C1bl3870sYC14JWpMmTWa1aAUtaEW6EToAJBQrAGjnp6DlF14JWk4ELWh5UfPmLVkNwGdYAUA7PwWt9es3spoXeSVoPfLIo6wWraAFLSfnswFAzLACgHZ+Clp+4ZWg5WRg2qAFLS8aN248qwH4DCsAaOenoDVmjD/uzeaVoOVEvIPWG28MNxYtWhxY8+d/zt4TAOAFAO38FLT8witBywsDls6cOcs4f/4iqwfRsGGvGYcOHWH1SN56621WA/AZVgDQzk9Bi75U7TUv8krQciIeQWvnzt2sBn8zzp79k9UAAooVALTzU9DyC68ErVmzZrNatOIRtNCTFd64cRNYLZzhw0eyGoDPsAKAdgha7uOVoOVEPILW++9/wGoQMm3aR6wGEECsAKCdn4JW48aNWc2LvBK0xo+fwGrRikfQeu+991kNQr788mtWAwggVgDQzk9Byy+8ErSccFPQSknpwWo63HfffYK9nhWlSt1vmy8l2muvvdZSL1myJNs2nGiCVsGChVgNwGdYAUA7PwWt775bzmpe5JWgde+997JatNwStP7446xoH3jgQbZMunDBYLXMeOedd1ktWvI8s7Zt21rqf/xxznjssf+yE9tPnTrD9hFONEELIABYAUA7PwUtv/BK0HLCLUHLHlTIihXfi/brr78RrQxa//nP7eY6MgAdOHBItOldGHD55ZeLduPGzaJt3/4F4/bbbxPTn30WGt9qwoSJoj19+g/RnjkTCoDqCf0//7xHtK+8Mky0FLTUx1mx4n9Gr169LbVIoglaVapUYTUAn2EFAO38FLRatPDHvdkQtPSIJmiR2rXrmIHmiy++MlJTXxTOnTsvaukFrc2bt5o1+3AStB1ZvHiJmP/zzwvmvn/99TdzvXnzPjN++mktOzyoPg45fTrUW0X7oVYGLfk8qe3Tpy/bRzjRBC2AAGAFAO38FLT8witBa+zYrI/E75agValSJXN61arVl0LPfLaODFq3357TrMmws23bdrMWblsie83sw03MmJE27hsFLft24bYho0ePFq0MWrNmpe1HZ9By8vMF8AhWANAuq0GrYsUko2fPXkaHDh0hjM6du2T5vfVK0HLCLUHrxIlTxoIF35q9QoRCFA1+O2bMWDFPo6nTP5qmc6MoeMkAtHbterG9DF7hPPnkk0axYkWNokWLG3v37jP3RY4cOWbs2bPXDFp0jtUHH0wTz4vmjx49bllfHlok6qFDWdcZtAACgBUAtMtKGOjSJdkoUqQIqwNHh4nstYx4JWild15SRtwStJzatCl03pXXRBO0oh3YFMDDWAFAu6wErSZNmrIaRNaqVWtWS49XgpYTfglaTsYSS6RoghZAALACgHaZDVp0WMxeg/TRIVZ7LT1eCVpu79FauHARq8HfjMKFCxv16z/H6nZvvz2G1QB8hhUAtMts0Ir28nFI49eg5UQ8gpYcIgGsnI4LBuAjrACgHYJW7Pk1aDm5Ki0eQYu4IWw99dTT4mR7OsndvizeZs/+2Hj33XGsHk6FChVZDcBnWAFAO7cGLbqK65NP5gqffhr+svnfftvPatGYM+cTVoslvwYtJ+IVtAhdkffFF1+K36N4mzt3nriSUPr888Q8Dxp6gv5P9e4d/f/f//u/G1kNwGdYAUA7Nwctdf7bb9POt6EvzuPHT4ovLjqpd9++343t23eYy2ncInUgyYMHD19aJxTKTp48LdgfL5YQtLh4Bq1EU4OWk9vxAIB2rACgnZuD1u7dvwjdunUXNQpY8jYmRN6ShMY5krVatWpZ9qMO+LhkyXeinTFjJnu8WPJr0Jo8eQqrRStIQYvG3pJBy77MzUaNCg2MCuBjrACgnZuDlr22Zs0649ixE+a8DFqHDx81a3QuzA03pB3yUAeilBC0Ei9IQYuov7cA4BqsAKCdl4LW9OnTjYceesjIli2bmJejYatBSx4W3L59p2gpnMll3buniHbr1u1s37Hk16Dl5OTuoAUtL8LwDhAArACgnVuDlhPhbs6bSH4NWk4ELWhdvIghFQBciBUAtPNj0HIbvwatWbPmsFq0gha0vMjJ8B0AHsEKANohaMWeX4OWE0ELWupFGQDgGqwAoJ3fgta8eZ+xWqL5NWi5/RY84AxuKg0BwAoA2sUyaGV1QFEn7r47P6tlZP36Daymk1+DlhNBC1o0xIO9BgAJxwoA2sUyaMlBQgnd4FdeSUgtDTjaqFFjMb9p0xZx+bsciuH996cae/b8at4+pWvXbsbOnbstX1a0D3k4hu7dJqdl+/bbY41fftljHD16XMxv27ZDjGNEy5OSrLcWsQetlStXibG51Nu30OPR48jXQPu1DzcRiV+D1pAhL7NatIIWtLzo/vvddVEJQAywAoB28QpaGzZsZMvlzW0pBFF71VXXiDbc2FdkypT3RKsGrr///R+WdWQQooFO1bo6pIN96Ah70Jo27UNz+uWXhxqLFy8152nUeWp///2gZZv0+DVo3Xhj1m/RErSgtWzZclYDgIRjBQDt4hW01q9PC1pz534qWhm0wo1rVb58eXOcLBmsxo+fINpIQYzIEKVeMdWqVSvLY9i3twet++9/wJxesOBb48SJk2G3HTz45Uvz1tAWjl+DlhNBC1oA4EqsAKBdIoKWJEORPWjJMLNgwULLvAxcNHCpXHf58hWiffbZZy37lOvu2vUzewx70Fq3zhq05D4mTpxs1ugw4YABA839yv3JQ5Pp8WvQokO89lq0gha0atSowWpuN3DgS6wG4DOsAKBdLIOWH9lDWjT8GrScCFrQKlSoEKsBQMKxAoB2CFrRodv8qLf6yQy/Bi0n94wMWtCqXLkKq7kdnZ9orwH4DCsAaJfZoJWcnMxqkD6/Bi0ngha0Pv10PqsBQMKxAoB2mQ1adMl3gQIFWB0iy2wvoFeCFgYs9bd33x3HagA+wwoA2mU2aGV1m3ioUsV9h2doDDB7LSNeCVpOBC1oLVmSNkQIALgGKwBol9XQRNv94x9XsHoirF79kxiMlLhpBO5OnTobxYsXZ/WMeCVo9e3bj9WiFbSg5UX0+2uvAfgMKwBol9Wg5SY0grsMWsS+3Gu8ErScSFTQot8POeSH361a9ZOr/vAAcCFWANDOD0Hrq6++MUOWHLndy7wStJo2bcZq0UpE0FJvqRQkcuDfzPryy69ZDcBnWAFAOz8ELYkGFbXXvMgrQev55xuyWrQSEbSCfHL3okWLWS0juFISAoAVALTzU9DyC68ELSfiHbTWrl3PakGCQ4gAYbECgHZ+Clp+OdThlaA1c6Z3hnew30g8aDJ77mLQ3y8IDFYA0M5PQcsvvBK0nEDQiq/MBC31puoAPscKANr5KWgtWPAtq3mRV4LWrFlzWC1abgxaJUuWMqezcr6fvA9m2bLljBUr/seWR6tZs+aW/ZFffvlVtPQ66td/zqzT8/z440/YPuwyE7QAAoQVALTzU9DyC68ELSfcHrTCbffJJ3NF26JFS1Fv3bqVZV01GMntdu7cbfz662/GwYOHxfy6dRvEPTPVc6bOn78o0DT9k9Njx75rrnPy5Glzv+pzoqEqdAUtP1yxC5BJrACgnZ+CVsGCBVnNi7wStGbMmMVq0XJr0Grf/gWjW7fu5lAQaniyBxp1mZxPSelhbNu2wxg1apSo3Xbbv0X72GP/tawre60OHTpi1u688y7LMlXOnDlFS6+jSZOmYpoCH7X25xWODFoyTFHQe+ON4WL6+PGTbH2AgGAFAO38FLT8witBywm3Bi05Tf+ozWzQoja9catk0GnQ4Pmw+yBq0Nq5c5foEZPz8nWcPn3WnLY/r3Ci6dECCCBWANAOQct9vBK0GjZsxGrRcnvQWrw4dG/CvXv3iXby5PdYoLGHJHX+xx9Xi/bYsROiXbnyR9GuX7/RUn/55aFGsWLFjRIlShhPPVVW1CZNmmLuZ/v2ncaRI8fMefk6Nm3abNbszyscBC2AsFgBQDs/BS0nJ2e7iVeCVoMGDVgtWm4MWrFSsmRJy/zjjz/B1ok1BC2AsFgBQDs/BS2/8ErQKlSoMKtFK0hByw0QtADCYgUA7fwUtKZMSTvk4mVeCVp00ri9Fq14By31PKcgCup9HgEywAoA2vkpaPmFV4KWE/EOWk2bNjev0guiLVu2shoA8AKAdn4KWvJEY6/zStByck5cvIMWSe9qwFgrVep+VouXoB82BUgHKwBo56eg5RdeCVpOJCJoETqEVqbMY6weSxR06Bwp8sgjj7LlsYRBSAHSxQoA2vkpaNGo2/aaF3klaE2fPoPVopWooEWqV69h/P77QePCBSMuZMiS7MtjgR6ne/cU9toBwIIVALTzU9DyC68ELScSGbTiTe3RevLJJ9lyAEgYVgDQLitBq1y58kZq6otGr169IQOdO3dh719GvBK03n9/KqtFK0hBi4wc+SarAUDCsQKAdpkNWnQ44r77SrA6REah1F5Lj1eClhNBC1oA4EqsAKBdZoJWrly5jSpVqrA6ZKxHj1RWiwRBy39eeKEDqwFAwrECgHaZCVp0KMxeg+ikpPRgtUi8ErT69evPatEKWtACAFdiBQDtMhO0MnsIDNJ07dqN1SLxStByImhBC1cAArgSKwBoh6AVH34MWm+/PYbVohW0oAUArsQKANrpDlrDh48wzp+/KBw+fFTUhgwZwtbLyNix77BaLMh74HXp0tUoVqwYW66LH4OWEwhaAOACrACgXSyClr120003GmXLlhXTJ0+eNuvZs2cXYwvZ19+yZZsYUPLBBx8yFi5cbLRu3UbU8+bNJ9avVq2amN+xY5dYtmTJUnPbjz6abmzfvtOc/+GHlcbq1T+Z82XKlDGfw9Chr4jbsixatMS44YYbzXVo+zlzPjHnCxYsyG7KS8/joYcestTS48eg5bVb8CTSlVdexWoAkHCsAKBdLILWgAEDjUGDBpu1f//730aVKlWNK664Usz/9NMa0U6e/J5oR4wYyfYzbdpHot26dbtZmzhxkmjHjAn1dlGvmbpNamraa/nHP/4hQpWcl6OY16v3nGhlb9u5c+dFe9tt/xatel+43bt/Ee327TtEK29ncujQYdG2adPWXDcjfgxaTgQtaAGAK7ECgHaxCFr2mgxacn7HjrQep0jCBa2lS5cZFy8a5q121KB15535REsBSvY+FSpUSKy/Z89e47PPPjeqVavOHscetH755VdzmQxddeo8a1l3/PgJ4rFlUIyGH4PWlCnRv367oAUt+uPDXgOAhGMFAO0SGbSOHj0u2s2bt7JtvvnmW9GqQUt+sR8/flK09qA1btwEc57+qcspaFH77bcLzeXU2oMWBTO5zTffLBCtPWjt3LlbtIsXLzHXzYgfg5YTQQtaAOBKrACgne6gdeWVocOD6fnPf/5jTsvzr8LJli2bZV3SokVLc5rO2bJvU6JECcv95Dp16izaG29MOwcrObmrZRv7SPePPfZfI3/+/GzfefLkMaczE5wyu75XgtY777zLatEKWtDq27cfqwFAwrECgHa6gxaE58eg5UTQghYAuBIrAGiHoBUfCFpWQQtaI0bgptIALsQKANohaMWHH4PW6NFvsVq0gha0AMCVWAFAu0QHrS5dkllt/fqNxqZNWywnpmdk+fLvWS0z6MT5ZctWGK+/Ptys0VWHdKL+H3+cY+tnlh+DlhNBC1qvvfYGqwFAwrECgHbxDloUZI4dO2F8990yMU9X8tnHw9q162e2nUQDjFJ74sRp49ChI0bv3r2NI0eOifqmTZvFMgpo6nhYjz76qAhLNWvWEo914YI1wKlDOkhyzCxpwYLQ1YpZ5cegNWXK+6wWraAFLQBwJVYA0C7eQUtau3a9aF96aRBbRigoLVy4yJxv1qyZaBcvDo0CP2vWbMv6e/fuE+2aNevMmhwhvkKFCqKVwzM0bNjIsi2hsKUGsHnz5rN1nPBj0HJCZ9A6d+6C+NmCM/THyObNW9j7C+BjrACgXbyDFn2g02CkGzZsEvORgpYke6aobdq0uWUZjdxOt+GhaRm0aL0ZM2YKs2d/LGpXX32N+djUVq9ekz2O/fH27z/Aljnhx6BlD7uZoStohbuFEzgje40BAoAVALSLd9D67bf9opWhp3fvPmwdOiQop+XAohMmTLQcDixVqqRlPzIY0ajtch26TyK1GQUt9Rwsuc7KlavMmtPDhsSPQcsJHUFLx7lzEN6uXaFBeQF8jhUAtIt30CLt2rU3KlZMMufDDVrav/8Ao0GDBpbaqFGjzWm6vY59EMjKlauI9vHHnzB69uRf5PXq1RftzTffwpbVrl3HGDx4iKWWL9+dRo8eqWzdrPBj0HrzzVGsFi2nQeu2224zDwmDfvZzFAF8ihUAtEtE0MoK2dPkVX4MWk44DVqrV//EaqCP/YIRAJ9iBQDtMhO0MrMuWPkxaPXqlfWw5DRorVqFoBVLCFoQEKwAoF1mwpO8byBkXrhDmZF4JWiVLl2a1aIVr6BFPaE0pId9CBEntm7dxmqq7t1TxOPRSeXUyvMMY2nbth2iHTv2XbYsKxC0ICBYAUC7zAQtksjDh16VO3ceIykp7Zy0jHglaDkRr6A1YMBAy/wHH3woWnWg3AMHDlnWmT//c3Noka+++tqsL126zOjWrbsIUPXrPydq77wzzli2bLlle0kdn42GHZFXyF5++WWWx6SBchctWmy88sqrZm3OnI8tF2TQ9JQp71n2v3Nn6IR1uor3zJmzYkgSGitOLqcre9XzDgsXLsxeayQIWhAQrACgXWaD1q233mr06tWb1ROJRt2my/yJzp4LHVq2bCV6OOz19HglaE2aNInVohWvoDVx4iSjY8dOZrD6/PMvRLtxY2h4ETmUgewJOnr0uGV7ORYbkVfDyvMFKdzIZeGCiRq01N9LOUbbkiXfifbgwcOizZUrj2hHjBhp2U/jxk3M6ZdfHirali1bivbkydOW/TdvHhoCRb1C93//WylaGvKE2mjOdwz3egB8iBUAtMts0JKaNWsuAhcdEks0+rKUQYukpPRg6yQCfcHb37doeCVoORGvoNWv3wBWsw/nQXcSkLd7osFP1XUzClpy27NneXiJFLSoZ4y2kWO/qcOZPPDAA6Kl/Z06FQpR99//gDj8SPuj3quvvvqGPZY9aKkXC8jnW6fOs6JVQ1gkCFoQEKwAoF1Wg5abqCHLDwNYeiVoJXLA0miDlv3QoRy3be7cT0X7++8HRXvvvfeK1t4j+v33P5jT9qClDuwphxZRRQpaEt3TU90voaCVK1duc75AgXsswYiCFrV58+YVrTzEaQ9aaq/V1q3bRYugBcCwAoB2fghahMbB2rIl/ZOUvcIrQcuJeAWtGjVqmmheniuXM2cuc52hQ1+xbEPjramH6xo1aizaatWqm7UCBQqItkqVKkb79u0t20uVKlU2p2XIIRUqVBS9rvJiAnW/V1xxhWipx7hu3Xpm/dVXh4mWerdkzd5jSueN3Xbbv835Nm3aGmXLljXnb7klNH4c/V9RtwsHQQsCghUAtPNL0PITrwSt2bPnsFq04hW0IGsQtCAgWAFAOz8FLeolsNe8yCtBywmnQUue4A2xgaAFAcEKANr5KWj5hVeClv0WSJnhNGgR9XAc6IX7SEJAsAKAdgha7uOVoKWe/5NZOoKWOrwC6PXrr7+xGoAPsQKAdgha7uOVoNW4cegk8azQEbQIha1y5cqzuptQ75BXroil4Sx27/6F1QF8ihUAtEPQch+vBC0nh+50BS1CV9vRMA00pIEbqUOPUOiyL3eLDRtCw00ABAgrAGjnp6A1cKB1zCSv8krQckJn0HI7NWiVK1eOLQeAhGEFAO38FLT8witBa/r0GawWrSAFrSpVqoqQ5WSAVwCICVYA0M5PQUvev87rvBK0nAhS0CKtW7dhNQBIOFYA0M5PQcsvvBK0Zs1K3IClXnPzzaFR2QHAVVgBQDs/Ba3ly1ewmhd5JWg5EbSgVa9e2u10AMA1WAFAOz8FLb/wStCaOXMWq0UraEELAFyJFQC081PQWrduA6t5kVeClhNBC1oYmwrAlVgBQDs/BS2/8ErQcnI4LGhBCwBciRUAtPNT0Fq5chWreZFXglbVqlVZLVpBC1rnz19kNQBIOFYA0M5PQcsvvBK0nAha0AIAV2IFAO2iCVolStxrnD37p7ivHGQd3X7lwIFD7P2180rQSk7uymrRClrQon/2GgAkHCsAaJdR0KKAVb68u2/a6zWnT/9hPPnkk6wueSVoORG0oAUArsQKANqlF7TmzPnEKF36EVYH586ePcdqkleC1vTpM1ktWkELWhcvokcLwIVYAUC79IIW9bzYaxB7XglaTgQtaAGAK7ECgHbpBa1z586zGsSeV4LWjBno0YrWb7/tZzUASDhWANAOQct9vBK0nAha0AIAV2IFAO2cBi1ah/z55wXjttuys+Wx0rNnfL6oBwwYKNpcuXKxZbHihaDVr18/VsuMoAWtY8dOsBoAJBwrAGinI2jJabpCkdqUlFRj/PgJYvqRR0obY8e+a64zZMjLxtSpH1j20adPX+PVV4eJ6RIlSop25Mg3RUtfyKmpL1rWHzDgJePQoSNG9+4pRqNGjY3HH3/cXDZhwiTjnnvuEdPDh48wChUqZLzxxghz+Q03/J8xadJkc75evfrGmDFjLfufOnWaOX3q1Blj2LDXLcvbt3/BfL6kU6fO7DU54YWg5VTQghYAuBIrAGgXi6Al2y5dks1lcmRsGk+K2unTZ4h23Ljx5jpffPGlUb/+c0aRIkXE/PbtO9njSfv2/W7ZD9m7d59oq1QJjVhOvWxymQxuUt269YwKFSqa80eOHBNtcnLoOV+4ELpKjIKWut3Spd+Z07KXQr7eP//UM/o3glbs/PjjavF7IXti/W7Hjl3sPQAAEysAaOc0aNEgnHTpugwmRH640/Z79vwqyMBy+PBRc70ePVJFu3nzVrEu3UKHgpZcTlc9yu2XLVtuedxwQYvs2rXbHBxSve2JvD0Pfclu2rTFrNM0hT81lKnsQUt9T+T+f/31N9EuWPAt2z4r3B601ACdVfEOWvv3HzCWL/+e1YOgb99+5h84AGDBCgDaOQ1a4daRQWvPnr1smTpkxH333WeZtwetSOGHhAta69dvsKwTLmhJCxcuMnuxiP2xZK+YPWip59rI1x6koPXhhx+xWlbEO2jVqFGT1YKG/iiy1wACjhUAtHMatMINxLh79y/m9PHjJ0WIadu2rZinHi0KQHSOFc0XKFBALP/551+M1avXGA0aPG/ZFz0Hewgi1ENBvVEzZ85WHvdnse+rrrpSzKu3PVm9+ifR0l/2agCjfVOYkq+DnhfVhgwZIubLlPmvpbdObqM+Jxn6Fi1abFkvq9wctGrVqsNqWRHPoHXy5GlWC6JVq0L/BwDAxAoA2jkNWpml9iIFGYU7yb7MjUFLPeSrQzyDFg6bAUAErACgXbyDFvzNaNashSVoycOn5cs/Y5w4ccqoXbsOu3iATuKeN2++kZLSwxz8Um4n240bNxvvvBO6wlP+7OT2cn/lypU3e/rkOvKQ0rx5n5mHe+U6TgYlTQ+CFgC4ACsAaIeglRhe69HSzY1B6+DBQ5ccZvXMoBPP6bA2ufrqq9nyzLI/H3nIXZ4XGGk9AIgKKwBol4igRcM42GsZyZs3r2V+1KjRolXPt1KtWrWa1aI1aNBg8dqJ7D1SD53Jcbvs527demt243//+4HtL5Ju3bqzGkHQ0iuaoEXnEspp2ZtH5wza18vIoEGhc/vISy8NZsujJc8rmz17jqUux4Cz34fUPg8AUWEFAO10BS0aJPT1198w51u1am28+eYoyzr01/7112czPvvsC0v9hRc6iufxxBNPiHn1hHjahtrcufNc2l8oXJGRI0P7psFOZU19vB9/XMUen9Agpy+80CHsNtLAgYNYTb3aUH5x0wnx6pVcFPpWrHA+hACCll7RBK1wv+t0uFZOT506VbTywoeFC0MXPsix2yQ1aEk04G61atXFla40n5SUZLz33vuWxzh69Lho5UUWdAhZbi+v9JwxY5ZZa9CggTm9Zcs2Y9066xW3ABAVVgDQTlfQsm8je5pkj5B6lZ49aJ09a30cdbncj9q7cPPNN5tBS+5Xju1UsWKSaGWvhP0Qi4quUpTTd9xxuzmtBq2dO3ez7eR5UPTY48ZNMOu33XYbglaU3Ba0pI4dO5mH5376aa1o1d/dtWvXi7ZDh45mbcGCheY0BS3qsf3hh5VGvnx3ihqFcTr3jWzdul3UaOy49MZvU6+UPHDgkGjpcKSsNWnS1Az/n346H0ELIGtYAUA7XUGL1qXDL3Ib+Zf/t9+G/opPL2ht377DnKbxq8IFrTvuyGXWaKBTe9AaOPAlMUL72LHviHnq0aI2vSEXSpYsZU7TieZyWg1a6hcqXR5Pt/iR8/KxN2zYaE4jaEXHbUGLLiSQ0/J3WAatbdvSfj/lz/m775aZtXvvvc+cVnu0ZG+n/f+ROm8PWuXLlxdtRkNSUNCaNWuOebECghZAlrACgHY6gtaaNevMadk7ZQ9a6pedPWjZB1J8660x5rT8IpKDoFavXkO09qAlyeccTdCSX2aFCxe21NWgpT5v6pFQH099bitX/iimEbSi47agNXToK+Lnqf58Dx8+Ynz55ddi+uTJU5bzAVu3biPmf/89rZeJvPzyUMu8PAx+7tyf5q2aCD0OHR6UPa/Ua0X7GzYsdA/Ne+8tbjkH0P5/sVmz5qKVvW9qUASAqLECgHY6ghahv6jnzv3UDF2LFy8RrXoDZzrsMmLESLPXSaLDc7T9p5/OM2u0nzp16lj+Ul+/fqPx1FNPi2n5vOWhnMGDhxgbNmwy15V/6U+ePMXyWESeK0No0NOHH37YspzOGVPn33rrbXO6Vq3a5rR8bNW0aR+yWmYhaOkVTdDKLB23IQKAhGMFAO10BS0nwp0HFWQIWnrFImgBgC+wAoB2bghaYIWgpZd6yC7ISpYsyWoAAccKANqlF7QwNk9iIGjp1bx5S1YLIvTsATCsAKBdekGrb9++6S6HrLNfAKBC0NIvkX80fPPNAvH48sT3RLAPrgsAAisAaJdRkKKxe6ZPj8397oIqo0OyQQhaKSmprBZrdJsaOowory6MF/V2S/Szty+PJXq8RBw6zZnzDlYDcCFWANAuo6BFaLwp+sCmv8oh66gXa8WK/7H31y4IQatmzZqs5ldq0KKrY+3L/Sg5uSurAbgQKwBoF03QgvgKQtAiHTtah9Hwq4sXDRGygnSOVM+e8T00DJBFrACgHYKW+wQlaAXpy5juKmCv+RXdispeA3ApVgDQDkHLfYIStEhQfv/Um5/7WYUKFY2WLVuxOoBLsQKAdkH5ovOSIAUtQj1btWvXYXU/eemlwazmN6mpLxrPPFOB1QFcjBUAtEPQcp+gBS2pd+8+InT5EZ0Eb6/5BX2GNG8euvcigMewAoB2CFruE9Sg5WczZsxiNQBIOFYA0A5By30QtPzniiv+H6sBQMKxAoB2CFrug6DlP1u3bmM1AEg4VgDQDkHLfRC0/KdRo8asBgAJxwoA2iFouQ+Clv+MHz+R1QAg4VgBQDsELfdB0AIAiAtWANAOQct9ELT8J6MbiQNAQrACgHYIWu6DoAUAEBesAKAdgpb7IGj5y9mzf7IaALgCKwBoh6DlPghaAABxwQoA2iFouQ+Clj+8+uprRqlSpVgdAFyDFQC0Q9Byn0hBK2fOnMajjz5qlChRQrT25U689NJLoo02GLRr184oXbq00a9fP7YsPZdddhmrycf2k4ULF7MaALgOKwBoh6DlPo8//jirSWpQ6du3r1GzZk2jfv36Rrly5YxWrVoZhQsXNnr16mUMGDBArENBqGrVqub6tN6LL74o5qtXr27079/fyJMnj1jviiuuMFJTU8WyihUrimU03bVrV6Ny5cpGs2bNzMdu2rSpaLt3727um9B07969jfLlyxudOnUy15WB7KmnnhLLn332WbF/Co3UhgtgAAAxxgoA2gUhaJ0/f9GcTkpKEm2VKqHw0ahRI9FS6KC2Vq3a5roFChQUbYMGz/+1bmh074YNQ9sUKlSYPVaNGjXDrkvBRa7z0EMPi/bhh0tb1qlXr75oU1JS2H4lNZDIIEQoINE8BS11fQpVbdq0EdO33nqr0aNHDxF65OuVZDCj/XTp0kVM58uXT7QtW7ZkjyeDVcGCBY0iRYqI/ZL//Oc/RuvWrc31KKRRvWfP0O+ZDFo0TcFOfWw7+f4T+XOTPy/5nlWtWs1cJ3fu3KItWrToX+uGfgbPP99QtPL9zZbtX+Y21aqF3gfZiyj3S8+T2jJlypjrUg+eul+5LoVGuQ4AeAorAGjn56A1adJkVvOCSIcOSbigRYHnrrvuChu0qEaHA7NlyybWu/nmm83eJTr8SL1fNE012jcFreuuu07sR64XLmjJHi25TnJysvHcc8+Z69FhTgpXtK9KlSoZAwcOFMsowNBjPvzww5ZeN/U5AwDECSsAaOfHoLV69U9mr5EXpRe0/ED2aAFAdG677d+slpGcOe9gtWjQqQT2Wnr+/ve/s5qHsAKAdn4MWl7n96B1yy23sBqAXxUsWMCcbtas+aVg8g+2TjgdO4bOccyMDh06slpmyO+DBx98yHjkkdAFN/Sc7ev5CCsAaOe3oHXu3AVW8xq/By2AIFGDFunVK9Sj26NHqrhgpGvXbmKezhtt0aKFOZ+a+qLRs2fo0D6dO9q+/QtiG/rM/u9/QxfM0DwFssaNm7Bt6tcPHcqnedrmrrvuNh9f1tTnVbZsOcu8PAe1SZOmRnJyV3O/NWvWMlJS6LzL0HyxYsVE27t3H1GTdY9gBQDt7P/ZIPEQtAD8I1LQkmQAsgcUtUeLgla7du0j7kPOqz1aFLTUfch1ZPvMMxUs+5ABzy69Hq0cOXKYQUt9TvZzRV2MFQC081PQ+uOPc6zmRQhaAP5hD1o9e0Y+R/GJJ540A0s0QYt6sNR5e9CSV/sS6i1T1y1Xrry5jDz00EOW+WeeeUa09qBF2994441iOnv2tKBFPVpynUKFClm2cTFWANDOT0HLLxC0APyDglbr1m2MNm3aWnp9qAerRImSZk8WHY6jgCLXoeFDaBuajhS0aBsaUkbuI7RNaDgXeeiwU6fO4rCkDEyRghbp27efGL5E/V4IF7Tuueceo1u37ghaANHwU9D64ouvWM2LELQAAOKCFQC081PQ8gsELQCAuGAFAO38FLQqV67Cal6EoAUAEBesAKCdn4JWUlIlVvMiBC0AgLhgBQDt/BS0/AJBCwAgLlgBQDsELfdB0ALwHrp/J32e0nhUNDQDpKH3hN4buu+q/X1LMFYA0A5By30QtAC8hT5Hs2W7ntXB6vrrr3Pbdw4rAGjnsl96R2bP/pjVvAhBC8A7/PQZGi8ues9YAUA7F/3Cw18QtAC8ge77Z69BdOrWrcdqCcAKANr5KWgtXLiI1bwIQQvAG+z3J4To2e/XmCCsAKCdn4KWXyBoAbhfgQIFjSJFirI6ROeuu+4y7r47dEPtBGIFAO0yClp0o+Z9+/Yb8+d/Dhp8+eVX4j2dNu0j9l5LCFoA7te+/Quspjpz5pxx8OBh9hkQFAcOHDLOnzfY+6Lq1CntxtkJwgoA2qUXtE6f/oPVQI/0DjkgaAG4X69efVhNOnHiFKsFVXrfIy44fMgKANpFClrHjp1gNdDrzJmzrEYQtADcL72g9c4777JaUI0bN4HVJAQtCIRIQevs2T9ZDfSaOvUDViMIWgDuFylo7dixi9WCbvfuX1iNIGhBICBoJU6nTp1ZjSBoAbhfpKCFz04u0nuCoAWBgKCVOAhaAN6FoBW9SO8JghYEgtOgde7ceXEfq969+xgbNmxky2Pl4MFDrBYLdIWgvaYLghaAdzkJWt26dTeSk7saW7ZsFZ+f9uW6JSUlmdPjx09gyzOL/tlr6Yn0niBoQSDoCFr26bVr15nTp06dsaxz5MhREV727Nlr1mhePt5zzzUwPvjgQ/M8Bzph3B52fv/9oLiSZf36jcb06TONkydPi3qdOnXEfugxaf7CBUNsq25P26nztK76WumSZJqvWbOmufz8+YuWx7c/px9/XC3mv/76G8t6GUHQAvAuJ0FLWrNmnTk9YMBAM8DQ5476GfPKK6+Kz9E2bdqK+Z49e4rPsl9++VXMr1u3QXwu0fAxchvaXl7xp37Gys+zVat+ErXRo98S80eOHBPryc9P1aFDR8RwFTT97rvjxDqZCVuR3hMELQgEnUFLXkV3+PBR0dJ/ZLlMfmjIUETy589v2RcFlvr1nzPn1YDTr19/y7r79v0u2unTZ1jqqj//vGBOL1jwLVseaV3yxhsjRGv/0KEPIzkt3yMKdNSuXbue7Tc9CFoA3qU7aNEfjfbl8urvZcuWi1YGJ/vnkiQ/c9XP5Xz57jQqVKhgzts/6yZOnCRa+blNqlevwfZN9u8Pfe7a//jMSKT3BEELAkFH0MqTJ4+lJnujaNmKFd+bqKb+Z+7RI9V4/fU3xPpjxow1Vq5cZQlaFNzktvLDQAoXtCjMff/9D+a8+mFA+6a2T5++ZtgrWrSoeD6zZs1mHz6S/QNN/QCTy3799TfRZhTm7BC0ALxLd9B6881RoqWBUOkz5ZNPPjWDFn1OUquOz7Vx4yazV4k+65YtW2EGraNHj1seJ72gJamfzXXrWj+D6DXR/uloAs0jaAFkgo6gZa/JoKUOyvnzz3tEK3u9JkyYKFo1yNiDlgxTpE6dZy2PsX//AdGqQWvLlm2inTbtQ9Hag5bagzZ3btqHGJEfPk888YRoZQ+cPWht3rzVnD51KhTYELQAgidWQUs9ZBgpaMne87lz51n2J5fbT7eoWDHtHC35Wde//wDRbtu2Q7SRglabNu3Mafm5GymsRRLpPUHQgkBwGrTkITZV3779zOlWrVobU6a8Z87Tobf33ptquccV3Y4mf/57xEmhxYsXt+zr1VeHGaNGjWaPUbBgQRHkGjduYql/9FFa8BoxYqQ5LU84pUOQdI6BrE+YMEk8x+HDQ6/j/vsfMD78cLpln2+99bZlnj703nprjDk/cOBLom3Xrr1lvYx8/PEnYcfcQdACcD8dQSslpYc5XaNG6LxQMnXqNKNSpcri3Cyar1q1mmjp81CuQ39k5s2bV0x3754iTnKnVi6n4FarVm3LPLXDh6d9Lqq3Anv55VfM6WLFipnT5LXXXhefg4MHDzFr4T6XI4n0niBoQSA4DVqZdfz4SVYLKuotk9Q6ghaA+9GVg/YaidVnp5dFek8QtCAQ4h20IIT+QlWD1tKl34k6HbqkqydpukGD50W7ZMlS0X711dei/fTTtMMFshdN9sjReRTUzpnzMXvMsWPfEe1334VOrJUn2A4dOtRcZ8qUKaKVh0Hl/vr1C/VSNmjQwFz3228XWva3YEFovlKlSuY6CxcuEu3ixaHX8PXXC0RLPYdynebNm4t2yZLQeyCvnKLDu3Kdzp27iHbp0mWilc99xoy0E4hpiBFq5eXr8nlNnhx6TYMGDTLX/eCD0Kj8ae9F6HWGuwelfJ3yseVzefLJp8x15OtM+1mFrkClntpbbskuptu2DR2CkT/rL774kj2W7OH47jvr6/zgg2nmOgMHDhStfF3yNYwbN1606oUj8tC6XEe2KSlpPR/y9+nbb+VrCD0/edPkBx98yFxXvs5Fi5aI9ssvQ7+T1113vVG0aKgXZNGixaKV79fnn39hbi/17h36gpXPZ/78z0Sr9n4PGfKyaOXPRq47Zkxab7I0e/YcyzrDhw8XbZcuyeY68nnYfyepR1uuky3b/4lWvoaFC0Ot+rMqU+Yx0a5eveavx7S+Tnx2cpHeEwQtCASnQevpp8uyGkRHhiz7eW7o0QJwPx2HDoMi0nuCoAWB4CRoNWnSlNV0k1fV0NWC9mWRyG1SU8O/tozQSaEdO3bK1AmfH31kPa8rGjgZHsC7Yhm07Cez165dx9LzllVz5nwizvOi8QztyyLJ7BWG4UR6TxC0IBCcBC3qjZHjutBJ3RRMcucODfVA24fbhz280BV7ao8ODWQq16ET1ekx6ENH7Zb/7bf9ln0fPkyD6YWuZhw58k2xDX04zJw5y1yHrsZRL42Wz6Vx40aWmr13SX2+NH355aHpYcNeF/PySkf5fL744ivxXORl0OlB0ALwrlgGLTnYspynzxoZtNav3yDmKXzR/Nat28TnFh1+pc9Pe0hTqSezS3TerHqeKI1nSPuvWbOWmEfQAnDISdCS//GHDXvNrMlzheyBhchzGe67r4Ro582bby779NPQ9DffhM7hkWTQkedIqPulDxx1XXkptPxgoPGx1H3Yt1fXlcJdBaiyb09XUKp1ed7Gddddx7a1Q9AC8K5YB60PP0y7IpDQ5616qoa8Glp+ZqlDRdiHw5Fo6Bv63JEjyqf32VikSFHR2j8jsyLSe4KgBYGgI2jJk1VJ8+YtRGv/T0vkybrSzp272TqEwpr8CyuaoCUPK0YTtOwfGufPhw4zSvbXvXhx6KRfST6+HCFe/oUo63Jg1mggaAF4V6yDFrV0YYKcps9buj+ifd3t23eKNpqgNWjQYMu8+nlq7/HPnj10EYf9MzMrIr0nCFoQCDqCFpGD3slQEy5oyS5teRsHIgfck9tNmfK+aOV/7miCFilQoIA5GrLcRgYt9f5f778futpMsgct+otRjq4sB+dTycffsSP04SZfE4IWQLDEI2jRH4+y11x+3sreKPmHZWaClv3QobxylcgrSWUPmXwdCFoADjkJWuAMghaAd8UyaGXkn/+8ktXcLNJ7gqAFgYCglTgIWgDelcig5TWR3hMELQgEBK3ECXe+BUHQAnC/SEHLfq4TpN3j1g5BCwIhUtDScVwe0hfuPDaCoAXgfpGCFt2EuVy58qweVIUKFY445iKCFgRCpKBF5BhZEBtyuAs7BC0A94sUtEikHpwgSu+9QNCCQEgvaBH6T1K1alVWh6yj+9fZbyStqlu3HqsBgLskJ6fdRzEc+uyUg4oGUbVq1dMNWaR797R7biYIKwBoF+4muuH89NMa0EBeqp0e9Ua4AOBO1atXZ7Vw1qxZyz4H/O7HH1ex9yEcOfp8ArECgHbPPdeA1SCxMuplBAB3wOdn1tWv/xyrJQArAMREjx6prAaJc//997MaALhPtEcEgHPJe8cKADETaagBiC/0ZgF4C/5QzbyUlB6sliCsABAz+fLdaTRt2ozVIT5y5rzDLX/hAUAmXHbZ5fi/mwn0XmXL9i9WTxBWAIg56lGhG0O76D+Cr9WoUVO855HuTQYA3kA9W6RIkSJsWdAVK1ZcBCwXBlJWAIgb+rBISqoEMfTYY4+x9x0AvO2GG2649P87if1/D6qKFZOMa6+9jr1PLsEKAAAAAKAHKwAAAACAHqwAAAAAAHqwAgAAAADowQoAAAAAoAcrAAAAAIAerAAAAAAAerACAAAAAOjBCgAAAACgBysAAAAAgB6sAAAAAAB6sAIAAAAA6MEKAAAAAKAHKwAAAACAHqwAAAAAAHqwAgAAAADowQoAAAAAoAcrAAAAAIAerAAAAAAAerACAAAAAOjBCgAAAACgBysAAAAAgB6sAAAAAAB6sAIAAAAA6MEKAAAAAKDB/weM19hBIltruQAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAloAAAEUCAIAAAB8gw88AABTAklEQVR4Xu29TW9eSZbfGcyCS1KjUZLqJcmsdkusri4pq7pFqdItKQ1YUmNQUnmRYnohqRepVBsuMQtokVUNk8wGFGRiPsEYXhnwwvZigNn2YOCt7W8xwCw8sxlv2/C+M33i/O8999wTcR8+pPhIJOv/wwNl3HPjxuuJcyLiXmakRAghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIeRUcY4QQghRvvWtb0Uncbb54IMPfq58+OGHPyGEEEJ6PvroI/EO3/ve96LnOGMsLS1JPaOUEEIIGSPO4iwvFqV67733XpQSQgghFWd2+XT16tWVlZUoJYQQQlrI6vD3f//3o/QM8NFHH0URIYQQMs3ZXCCura1FESGEEDLNGXSHly5d+sEPfhClhBBCyDQffvhhFJ12Pvjgg7P/4SwhhJA5WFpaiqIJfvKTn3z729+O0lMN3SEhhJDDQndICCHHw//2wz/85sadv1/7s79fuyMB/k7Wb+1u7LAxZ9Ad/i9/cOWf/OD9KCWEkIVQ/r75m7U/E2sb7W/1Ezf5n358/T//+Hr5949+yt9b+P2nH//0v/70Ftyh/Pu/Lv9B7MCes+AO31tKoluiZ92MDEq5dhthaY55d44JIeRwvPeb779ffGGxNvrvjN/NYpT++5/8WUyDvBVWv30OPuKvv7/cdAqn2x3+qz+40inZgYq49mczJgWEEHIEyuT7QOMTbZE8cvfWhd+LaZGF06/jb9y5+K1/EG+eZnf4niyBi2IVX1jUK+pcSwX/9kc/ickQQsiRmMvyVD97rfijc+djiuStgJ3tKD2V7lBXuX/3px91ioUt+3mUUicFf/en3KkghLwRS7Y1VQzLHMYn/LoXOrRF74ClfoEYb5xKd5jS//fhraOo4I1OC+XxmCIhhByGY/h2dMIok8WyVJb1f9+ai5w+d/jbHyzP+RFX46evskWP//z3vxPTJYSQ+SjG5GgmqPrFpMniKS1/BjZLL37rW7U+HeXXaovfZeb/HzcQ8jvO6rfPRXvS/76+2ftIfYMjSxBMwWf8TsvrmxkmYsatkwlaPkpPnTuslemIv5u3RXFj6qewXxcKW4OQmhmfkurXDMUjfv1v/u03wtff1HHqX8zgJJHzPn5bW1smvHr1ai/PLu6pYarZT5s7PKYNivK7eTskLtZ/bW1tqoOl79NBHuLx48dTj59McqHoNLh06ZLJt7d3Q8w+MIwBjAqeH0J+p/j6Tw9Y8H3z//+3r//H/8C6UBxivBt+3U7V4c4qv3PnDizS2+H58+ebm7+xSzODp8vcGWj5KD197vDGx1GZBq3q/hL263/xxTd/+x/j3Ri5bGV0iToHJ7178eLl4dqxt/dVFFU8fvxpUz+WlCh1NJ86GjJI7t+/Pzs7QyJ//vnnCK+urloxrl+/boNNkjp//rxdqt+0cJkh3rx5c87sCDkDzPqIZu0fF9siFAujFkn4p/9s9jz+r3/wwzccP8cyAGck8vz5i83NzSg9kuFCLjPyegug2aP0dLnDf/3DKzO2Kcrvf/8/ivIJB7rDG8Uj1n+YPzXhElUwtzGDKXcIxKnI8lGmdV4VriryFAKCe6KAR4Iw6ZmODx8+9BJLSh5pJlUjPt7XS5598uQJiuebQqo/doGltH24uEOLefHixfX19WaBCTkbzPRtHw82Cn8AhtXhDMO1drf5rbufgyYdgzI2Uz/odFYaTQ1u2TJOHunHqW3txEc8mmOZ7NbR3tAd7u3tiVVBmZeXl5M+KNlZBKRzv/DnuWxNbSOyRWgia9Yo0lpHUQVaPkpPlzssmw+z30tDTed0h/or6fa+aWVlZWrfb56lYZrpDkXJ4L3EYWT1OuGuv+yFGZqNR27fLru7S/2OLpSp1t2sq0MvmYE8a+5Q9XV41ic7Du9j2Lx8+VKelYC5Q7n16NGj1BfYHiHkLDHLt+EHQyTG6tnnX//f/0+82/rFPBQZUBcuXOjDcUB5owFng7CNPhmn//Jf7qTOL/5IH4mJeOzuuXPngkV6Q3eopiw+blk8ffoXsELO+HS3DpxYi6PN1fsa2KUZZZtq81PlDk3Pmj/zlPO7w/Hrw6nmm/+N4Ax36DtMfEaINuUOLYxlH8KqAcOtsGyVpO7du+clM8jOHapnHYohkwNxeP1O6cgd6r+dtuXeHcog9JMG0eOpuQUhp5poRpo/MUf/5Bfd0nDmD1uvMQ/FRr0MpRnuJBWP8lRGq7vVDdisGznXrl3DpwBT1smQwd5vMh2zOwwS778tr9odzjmzv3Pn44ksGnY1nRF3OHtpeOPQq8Pwl5hTbVc39BQz3GFSD/FK2dnZCdHqrCWy6LfuHnTYI/BPksj4iY58yNWhUhxh+HZG75ZS6U5pdIdWBfHNfnWY3Uzt3b4eIGQRiFbXlqT9+6a8QSx/a1Hfcj894+KnMZuefvYZ7UMQyiCVIbnp6OMUEFmc3OzFVi47WL/s3eHIQB27O0z6gQICtfODRJr6QFOGtUpIH/vMWfexvNxAy0fpKXOHN2auDu03tzv0/5Ok9fX1Zn+nib5sMsMdituQ9LH14X1bmpjFSJxNfWHp8REePnyoatDtwRr5cO5w360OY8n7gTR8caqXpah4D4q7/t2hDCQsXuvUCDkbRDPift0fWogL7F4Z6utDzOOn/eKM/ysIXo81R5MMNAsHk2LYSJR/xaXF22N8CiE1/bK0YR6bmdbU9g3I41KLixcv4jK4Qy9pIo+/eBErhSpPOUKAZo/SU+YOy/+MZlKlht8h3GH3calfuQdkziWeMkonmOEOvfzevXshWq0uKysr29vbQdgkPPsm7jC8mhZJPcyq7Ebu0JClbfDThJwNDp6UV5Q14rTtmr2P4h2GUZssucRbEv92Q/8eo4Rn/AmZYf5VHcqh3eGMWtT2DegabkjhsO7QmJF1EzR7lJ4ud/hffvyzg/dLb8znDlU1/8/VbrWexlMtz1RHNhHHOaVzPh0oge/Cvb2vZLEVOlWiXb5c/uoDcnxWg2HgNzbrUVFve07h3WH4ki31f9tUpR+9r/6hxbfUcQ63pDpzqjIhp4v//Mc/+6b8D2j0LJ3athz2d9D/IasagADfl46GZ3+rSMyYXLlyxe5azCZwmYhmkV1G5Yc9Ibxc9D+fTs2UdX3y5IlfbDh32OU+/2cQhwItH6Wnyx2meeZla7e//vrrb/72/4ry1s+SzeXPDeP8K+kL6uacaArbyDYt8X+7Ct2V5ebFi5dr1ZS74hSDYtnGY3hTqBmV9Jt6ZgVYXV2N98bI434PFnm5+40hFCSSgr0s1E/auoqHrV1CzhLfuP8BzRv+Vr99LqZ+SMzz+fl0CB92/XS2QctH6Rl0h3P+dE+/pKhKUht9AOd0ejUJJT+95SfkZPLv/+GP1IxM7n/O9TMrdKwc43g/xqQOpM6rlhwXaP8oPa3ucOZG/Fw/TSemTggh89F9JlPblvl/a3f/3R/+UUyXLJ5vdHEfpafOHab0HtToDRWx2RaBxc1NCCFngDedlHNG/o5Ax0XpKXSH6e9+9o9qrTrsr/l/RSKEkPmZcdJT81e+vrnR/yVGdYQAeTv888vfl15o/q3n6XOHwv/7s5/Xqjb/Tx6PKRJCyCEYDqCoLczkr/8Y9V/9cBXPcgPqLSMtj76IN5RT6Q6F//rTW1HV5vvRFxJCjoOjeES8puF7mHeCvWKLN3pOqzsUXfwPf/jjWtsmf/r1zb/+YfkTHL4UJIQcK8U19h/6dV82tM+BerOPHvg74s+afeanvKfSHb7X7zH89feX1c/d/frmwUomkcfJEELIsdCtFGWq/eK73+//r2wHGyX+3sZvtCicdczyqXSHI5bSf/jDP9I/iS1+cTRB68P1uYaEEEKI5/S7w4prKyur3/1u4mtqQgghc3MG3eEHH3zwve99r7ugSySEEDIHZ90dEkIIIXNAd0gIIYTQHY45UX+D0SxMU3gsHHvKx57gnMzId8atY+Tt5HJiOZbqz5/I/DHJO8E66OT3FN1h4fz581eVeKMFYs4ZeU6aGhO05+Qr0xQo+Ukr/zGW5xiT+l3j2Jvu2BMkU9i4fvM2n53C7LuBQ0UO0B0W9DTL9hlPTe7fv49zEA9sekn58ePHly5dijfGSASJubq6GuTmeoMDFv/9ySefhGSnIoO6DOvr69euXbNLlKH5bNITFpeXR3+46bJqPCISa5yptpU4V65cwePvv/++yaV2kp38m8YtXOeS9IxiHElqTGWX+gON9VzJIc7Dhw/rU0ZRBt8+QCLfvTv6S16bSwGTr62thYIBEcqtoDl1ChLh6kzlkURev34dpS2khKHvRIGlIl6StHFqIdqhLoMIJX4Qgjqy5I7eBKZpQeEhrIvqL2vqUYMWDkKyOExpexXuCF0JlfaS+4qXpLFZSL0F8MlCbpHFjpnKIbIM26bSHgjdYeGqHu4cpdOoOxzO9Z1CbK54TSQezu8N4Nzgp0+f4rxfk+McXQNCSVPiXL9+Hen7yDi/V5B0vDeCxGIispiMra0tyw7H2UsuGxsbIpRbkKsL6bKzyEihyyzKC76+/q53A/7xUDtttLy9vW2RNf7+8+fPx5L87Nmz0H0zujLckgEjKYh7g5v0t+RSqozC+MgSU4rqIz969Oj16+6UZouctTdlWErg5cuXEGrD7mOsWszUz8aqFPZ75RmEnhs3bjTlNbk/xLy/zNLXevT5vpkMEYovRC9bTFQftRhrWoazrxqtwwtNbpemadqS2YymCMW0BaGZy3rqqanGkSUSaRnfceQY8b0gGo4ANPzixYubjqwWxiIn7a+xFu2LykGLLNmVlRU789ybrOysjZkmGXrS+8FWZDUmEAZ/fCB0h4UFucPQne5OxNtHH24+5YWy0GnKDdG/3d2/qYVmH+UpzLbUSI28XQhU4Ya5yWpqa6G/DKvGYOamstPLgl1KFfzo2t7eRaDZDqBOUMawhb1v8HGwsvERvAmWMtTrpCdPnli42Zs+XLeY9IhXHnG37maH+rNGF3ikbaV4sva17lan3mUt9UIK8u/NmzftKWvVpqb5TKUdbIIiRmpqzhc6rtK0We1TNw7ILU2TwrjCD5WqXSl5c9Bxovx+uWaEsSYaKO7TPJnpXhrrg4Rt+uhpDuqxFpUI4iD9wAlrgAOhOywsyB16Y20dIxndvt2d7ZJ7VxQm2k0D0aRpVjzNFHJv4pMqECZWmLO7OF04ZGEmZiplBMIqUCxyVny71QWWASNLKLtcXV21csqDWNDYXWu9VEbX77kClxUD5pg2PXz9+rXm380xIfT4yHVfSHX8U1Iqc4HZucma8KDhhWHJW2NlSMUDfZl14iwza0tkbe0W6iUlv3fvQf3s48ef4vL58xe2EJ9S+/ntkZTcUmtWE2XGgs+6snKHQ8eZUFJGMSSy1KjvuIZ+eqR2L19+gbA0ke11a6PFFMiRMWWzn6kBkIHsNyRS319mEqd0QPq9nuXMM4gOjDAPdIeFKbswxYHu0KxA0hcn0B27i7zEhppyeHeIvr9w4YLFbCLGRRYNXnVswMvPWfaCTO3FOrjVz75Zc1uMQkHF5WDnsDZzSN+7QyQungb1lQfFs0LoSy4XbjE60mDEtMg+ZgAPPlZ6yf6qvjeCY7BEpLJuzTdqwD23mPYER5v0QdGKjY1fW4ElYD5eWtIXA7lLC/s3oEC62GbERljX9o1QCG8xsUNr/glbQAijqRG2gA97I1K7QymATBpCrdN44Yv6YiIPTZu5lAelN/38QOZbSVvYtrMkKWkr0zRzkz41q+mDBw9evHgBoZQNiWADH3n5uicthjwrVtVerPrBJYrx8OEvh9jkDUCrNldgVad07W9qD6toEWRgQrW8Fo21y4zbMAwlkc3+bVRtN2Qohd3aA6E7LBy7OwQ6Ke5WMJV+lK61y3p12G/Qlcd7fmQRgJQhJGtYatnty/vIEhaTkXW5ZtNwi+AbRON0O64i9LtqSe2j7XsgQbtlYS/UWX83f/cgTj7IHY4D5eVE7u2plyOAsDfNFieY9YsXL/unpPoopBnl1HmF8vJyd3dXGs1/ZdNs4aTm27s9wyebqpW0hcGmvoZBOOurR4S9Czd/iaTMsti0ILhDnyAC/WV++vQvvAT4Mhj1sy48UuYgnNa0URcgTlgrII7UopkFZg9J3Z7bj4lNSt6clZUVTHRqxRBt8d9kySgwtzSeBZa34zoni182AHv94RFNtncH8jjM0fr6euhlGRFH6He6w4Ifk/Mwpzscj9hoO3xvVe6w82F1qYIdb6pRcg82rQa4qh9/ijrCwqqRakTO+v1IH47u0OSptegJgaS7KBN7cSWO3m04S7zx6n9Dsj7liSoPC+VwKyDt4Bd8Jt9071mTNlrS1YlJPL48OiAns5u6ld3Wq/OyVrWy9EFY3WGXXd2kcJbiNvDb2vottmR1yhLVEhmJSgfnPfbTUYHN15rEhUeKZH2Hvqg0rdFxoglSGClAcIdQ+ErThhSsu+0tgC8YORbQp3gfAcZ3h37EyO318Ln0iH81IMp87ty58Ighpqb5GqKpMD6sr2YaCR4I3WHhLbtDCUsKohbW2d4d3rnzsalXXaqlsgM2sjUWFoPeNKAWoWkXTFgZqYYzswiixN4vQu5fj6uwmULZj01q7/zAaFa5WQsxc7D+zxWTz05h4nJUsF/84hepamExu7KcCrOQZpt4uQzIMFOpOm4I+5hIwb8XVGEXWUpiW47eHY5T6PrikuPJk2dQtitXrjSLIU1afwjTjIlw8IUqbBRYOsi+Krrafx9UaZr1ckMokbH6X9LP9JFL0LS94TOfwR3qmCpx5N8HD4b3qT4XcmTQlTIYw9ebz93XTKnSQ7kFPfR4dfLdaqNbutLCU9sJFg7bsIeC7rCwCHeo5q/b+pO5ufWQLPbNeNlbN7hDMXDYOujTaA9difDqVXkdVUfGHoWX2xrFq6lkKitCRPvOd74DIbaw7ivZbdyLxiM1XVj47MpKBYbJrau6j2Vyv3pAO2Rd9Ogel7di5QUSItsg0RRKOXd2vrTXP/6p1A9FpNynMBoYSFA/nxk1YLjUqpXd1Ev9Jhuw/sUXQCaXvpOWzzqbMWEuH3mXXR1UE0JUzehjdkvbsFkqfSQNuKRfgZo8618+6N0vfOSsrY0/fvCR0WjSws0NA7/AzfrRkHSceBGsNdHjrQJ3vekLJm0immAxbVbU1DRfcrsca9rwZjQPr66Hr0YRB3+IllWpMGSsyiq8jMirq6vI4vr162GSgS2QUB5yZNCSdXs2TZYBdTKwpendJyTSxaurf+QTz/rVgvR+Vt9pOgDFtjGCNxqmnGt8d3hC3CEQi7Y5/hDfW1IZtLhE4H4/ETZ8ZI90syRbdzY2kcJWntRuc7ybD6Ftu5nkfvmK7x6K4ddDF/UviurCyGJF5GGhILmL0L9aw4MbGxvh87PU74mFkki9Xr165YUha38ZUljS7TW4Frzb8NRVkMLLCPSfswK08Pr6uhfe1z/X8xKAv1AMvewJMe0PtgzoSSheszeTNrvElz7y8dHsdWTguyP1HYd9qlSV1q+lak0Lke9rGaAt0DTf7LgbLqFpwCs8JLX2pr4prMAAVa57pNnCqHIYX+TIoCtD/zYlntC5dd+l3to0bUU9TkUxtra2LFmZ55lqgXH0A6A7LMAd1jOdJtgxn9Mdhk22mgMjHC9vObtFMGcV5oxG5ufENumJLRg5XdAdEkIIIXSHhBBCCN0hIYQQkugOCSGEkER3SAghhCS6Q0IIISTRHRJCCCGJ7pAQQghJdIeEEEJIojskhBBCEt0hIYQQkugOCSGEkER3eKLA/4l4Ef8/4pDmIrI4Y7CJFoo1L9v5tHPkHjxeo/SGjwO6wwKOUjvMiRb7m+Nzw08+y8vL4ZSft8BhNf7ACAvl3eZ+Knj7TfT2cyS/s9AdFuAOo3Sa++W8w7ncIbzsq1ev4o0xOP7XTrP04JDeunjhQPDZIPFPP/3UTj28fPkykq0Pp7ZDemGJEE0Ip80Bfx79FJYCsJPMkH44kwwn8drJwAae3doq5x6DmzdvjtIdHxYahF6S3emydstnN3X4JU4DzuPDigPjJ0oEq284N/hA0D7hkPpHjx7hiDEvTBq5Fhq+RjhfN4+7fqrKhkSwk34PC8aXz85astnL6+vr3gtq5O5IZxcXkffD4MJ4efnyCy8ki8AOGc1jxbtw4cJ9PXPUC5MeWBgkSTvXX8Ks5fGZwMmtWPzpqrAVWbXIZ5fVgISBMw90hwWcdxil06g7PPi8QzvMPVUaE4A7RFgCT548QXhv7yuL41PI/VHpTYIi1o5TtMckErDDM6FbQ7xO2BXsvp6Z7uTF0M/TbhLHn+WL4sEgqvEaUtCCWTsMdRy3QxfBR/bokdmNWtSOX+VdTOmC7e3t1PmVRrIywMwZN0+cT65sYFMPkT+aO8zFAeyLBfF18bOEUEc4uanjfy2ypPDixYteuG/H4dYt5kGbHM0dSsrheGcpg50w7G2WlQGaBj2ReZvNESXC6upqiLy8vGxzMmt/ydHrDFkE6AIc5mwS1dtuuokexCiQPgo6lqvhr8LuEufaIzw2j506wYjZlNFO6va5TI3TKegOCwtyhzCvwDrJ95Yoyu7ubtL+xui1BVnqzPpQKutanP9ucuBXcn6JqYJiWHHLhGahVlZWnLzRCF6Yx+sqlcRHZLaex5O7PHaHQNaaKLM3W+KxzEDLMsgX2OJYjlPucE0PcA/C3HKHz549E1+FYvjVlUTGYBvn24Ul5lXFboE8nrqqZF+W2uYOpabSeli+hJgQ1kttTIrtcryeC8alNEUY/5hzSGuYPKwIzcPJ1M0m4BYhaWPKs2rLRu4w6wQ8bGY8fPhLKJtJrl+/HhJM4zJI+taSXm5asbPzpQnNAsL3mxy1Uxc4VN8Xw9Yc9e4LOQKXlKzr9Y2NDT9sU2UlZLFochMaYQgH/ewD2dK3qbzPVOdPRSiSGWPkQOgOCwtyh35Z8Pp1N1C9k7OAn/6ovPQiLBEkMJf+ro7uYXYPCTRPp2NDavVqyS7v3PlY0ymXjx9/KgUW6yPPehvkk/LLShDaLfdLOom5vV08PeLUzsOYUtlc+YxefoA7FA+k+70ju5yrrbakDeVWHkN8CaAWNsxS5WnEW/vLVFUEqXl3mIsavEaXZTfCcz87efnyZahRcIeequXLpY+sK0urUSMRL8y9q/CexrobSnvr1q0+cqd40DSbipna+HxlPSeX0np1+yNCFKUkq3AbX2HLCykHd2jZ2b6IGutO6HdHJLXz538PYXJk7itZdzvw79r4XYN3h07e6OugxgZmcghbHNires2XW7ZieXn5sLMfusPCsbtDDEvYQUnZOyS5Jc8Gj1W7QxnP5g7llox/W/GIENuwwc/5vvcaM+UOxXjBfuFS9ewrb+b6yEPBaus8467X5uywCP3dhkTK3/zwB42JMNyh/SCU5lVjWtpKGsRmIX3mo8gSbX193cwl5NgYRAQ8KOMKAXFXvTAOeEnKWwRZTqE7gju0p/AKsJePGs1seqqaFKAiXqKTj7IVkd26PyRrYVzm+O6wETn3S2q0ia0OpWpWSBd5SMFXrRkBl9I7Yc8fiucHl1TH74Vaxe1NRP0uII2bMccXwzEyORqmckFej45eHmOqMBpeVZkwly1h2MDayGQ1jyaBcE8/ePTCeaA7LBy7OwSiLtZzYUaDDrPL2h2mwdx3A9vcYdAGqIJMppqz7zThDsVnmHXD3aDEVh5fMNNFZ2uGu1KLepcyFcu1d7TVoSxYx5JRCadWhwaMuDmzev4opZUJgXXEXr9BF/rCrSALYoivXLkSahRqYUlNuUPrFOgeUtYxPEqn6Q5BKCTmMb6vLeD3gT32FMJejoBNJlTYuUPRt8uXL5vcaPaFT1a8ms0njLD4g175dW3qm13QrddOrkMmW9NZZFTW97W/S44L6Ytr1z5Matn8BC6N9Xwsb3REU23SeHRn3a+CbWmOCBmS9YuG2u4dCN1hYUHucLzlGEZsGcYmqdxhCetbvegj7W7qFpqbmF/fuHEDdr+mVgu5tG8Z7K6U1q8vXXbDs2K8njx5ZpdprM3+bZ+Byh7KHWJ0hWLLqDO/Ag50h0mLByOeW+8ONzY2fD8iO8ndz1TkQWsro/5GzpfNLVs74Neze6diKuff3daEwe/tjsjdhMavv82IjFrPwoZYkOYcy3y5BZJmsabf78m/TU1r9oWkYM1+v995DtbTrzWNZptIIze/IPNZf/LJJ36tMDUVIG9Cv4gvs0mxCdAiP0V+c3eY3K2sMyGEm+5QbEXQcBSmqfYzoDssLMIdwg3Ype9CC1tAxrDr+33bJ2ymoGalYfIsjLfcJq/doV/kZTeVtmTxaXsQ6hiIihjazfTPVz/P7Q7NYkJu7lmyrtd2U+4wu09SfRlqdwg5ArJcFu/YC/2yKWYhMcMw86uogLgcvzr0tbM2aXYiCINfwvZhupf7Rfnu7t8gYHYqjdrBb/n6rh/99QgC/mvA7DZLLTX8uU4vzGtr9nKxEzZXq7l/NZvGJbcIXv2AqJN/fW5U7bMPnfH+VfWkiyPh27fv2i1yZNBBzT9myG/gDi2ON2K+l3OvtMEM4ps43TkfEmzmOAO6w8Kqvu2P0mnUHY4mRDVyC7YAmNy6E2Gs8fudn4L/OgZxgPcH+OYi9zuBSbODL8nVq+baHSaXo1/oWIGRAmqHjLwJ89QpIwWTw+OKQjfbqp68Y+Ipq4pgKK0Yuf9s1Zu5AKqQ+9d+kDTdYb9XGb4e6j4B9y0Mea7+xEWSnTEJlf61P2zY0xeiKJivXXKNFuYN3hCMu2OI6df0Sd+lyfKojzxgEfQqdmjWIoWYSe2d9EXWpYC5w9u3b6OP/PIxuZSTGxr2J4Z+0QbJ3viPw9ChwIRpotlNPpaYkpSfffsDba/3osmRQUs22zNX35+bPIoqIfbJoeHeYmBmFtRgUz+ZzuPRBDdpengo6A4Lh10dyggP5uxNqP1EkNQR5uTID87DQhOfh7dfgMPmeNj474SpQk7J52dGCjNupYPukjMJOn3Orp8z2mGhOyz0S4TG5KUG845jdIfzMLv7Z99dNAvKfUmJ0sXzTjJ95/xu1pq8OQvSnCMke4RHAnSHhBBCCN0hIYQQQndICCGEJLpDQgghJNEdEkIIIYnukBBCCEl0h4QQQkiiOySEEEIS3SEhhBCS6A4JIYSQRHdICCGEJLpDQgghJNEdEkIIIYnusOZQ/1v0Q0UmhBByYqE7LOCQ1TkPeKoPnCSEEHLaoTssHPb43/v3729u/iZKW9y5c+f58+fhiPMma2Pi7TE+Zkh86tkg9yk0H7HJwYw4T5TkVsnLy8uIfPPmTf+IFFLaoXkefarKdv78+brRVPiiWYzAoboyzVziT2UnZbOj4XHpa4cEpcCff/45Du+2LFC1+mB30GyHR48eeSGQvHzkQ1W578+OeLvF9evXb9y4EYSYQdaTyGvXrvlLtEMQJqc8HoyXIExa36APaIG6Fl4oWYsEqmjUJSFHA82bKr1NageCpO7uqR6U0TFlK5rJrq+vByGYx+oG6A4L0nB7e19F6TQHukMcXSuWQgyB9OvOzpe11QhIhHVHvD1GrVA5hViK/fjxY5PLg7J4dREHQgF0jVtSmDr32IQSE0VCphZBspZ2E+PihaLHVjaTSwqymBZVFslnn31mkYFPVhpNUpD40mgi3N7e9dEkBUlnqoLGobpSu740RZCjWab2ALw7FE2QyFI2VBNC8WEQSu9YgeWupClVE2Hd5lq1oeRiFBBZPMRE8QZhHWEG+TCaBtAaY0munbp25ajRtHFKLV6/fm0poEbShmIEfcmloTBeJObt23dNnvqUvUQ1zRR43yYcXgiDKA++fPnS6tucXpAj8PTp06Rj9uXLL0yIlr93755J0KEyo1pdXfXdLY9jp813rgTEusJWbG1tWWRJsNYBeRzz7yBXexs1dh7oDgsLWh36/rCw6IQJpS9tCjNVAJmCifUUZfLCqchZHbAUr5LvP378aZD4S0NMFR53Cjr4KhGiwGEKjzgaofgAf0vbNsNaIYK/K6Yz2MRxo3XyEAFlQJqyapH2sYmqRRahta3ZSrHgoXHwYF0qf+mRZpQZgHeHoWzIq1mjpj4A1ajiLJ1ZHyIECw5b47OAx9WyfWhCcL/w514yZSakUr7RjKwWyp6SFsN4kX+vXLniFDiLNRke64UubL05CEWxJQWp9crKim/2UMhcWTepcl3U1OdizQhJPSLIm4MeEa9mow+KGhrcd5x08cOHv+zl0QSJDty9O0yDLIJZvzCCbKF/587HdgtZw+xY5DmhOywsyB2KZ0JANMDS9yuDsdFsFAAmUrQBAZNLZPFbYaNS5SWOxexNc7548WLtDqVUtVfb3d3FbKtpvJxwVHJXoxJ48uTZlAHyqcm0cU/XQz41b+Z8Q1k1pczWsFndP7rPxiTK09eiS6Ffc9wOi63ae+llltRkSeEHJ1J4qEh85w5LZItgQsmrD8fsEMGEgiyeTGi9ZnellfzeLBIMXbCzs4Mq22IU5bmjjCM3zIREEB2TuZoott/UQiLeHYou6WUxeaBPAV3/xG9XeKwMXmODBi4puhQYCixGFpM8H9myC5omcimAX7miqC4KeVNyRxlo+NeGZFJ19Q3u9Q2RTX5V3zI0pzWp3+ap7ZsHd4PSJrpD46S5Q0lZDCv6xiyd2EqxPmJZLLJEe9Xz/vvvQwiF6COM1ljr6+vqI4dib2xsQAu98PLly8g6GCnYCJnZSQDb9GJ0/D6khVXjxch+lccuJ3W2cmSa5SlzqH6vA0g0X2X4AMhNCLkOm0Ho2wFbakl3hre3d2sH4x+0sBdKd4clbCiAJCXeBbULoxf2WiYowT9ZTFeezljUthj7pXYpzYVmsby0i0tYPBnmB9779pF9NUcWB4HXr/estSURn4JpmrXDDPuFu15o8rGkIFXbVMJdGS/NIeNVLvXzv6o7Gp2I7KBplh0GsjSanz6iI2xfzlIgbwgaM/SgyhurQ4wmXQxYb3ZbWZLC9va2xe/vjmxFL2x3X62NdIcdJ8od5pbxSqpD1lu9jyxuCcDrwAaZ5fIv0gy8q0PYB9wCq8t3as6uS4fiaOXfBw8emNyl1jC7Ihxn3Wg9L4QLl2mBScRgWXa+KcQPIZq+fvN2uTRFVtuHub+vpmdc4M7ZN0to1EWtb3lh8E9SnqXyBqWb9CStndloX4teMiqMy2JUX2kKJGLZyb/NZA8ssCer0/KaBmR+nXuStsOmbmWned1howzgk08+qRshabTa5CWd/XhVsWebiaQJubSeqCgUu56RkDdEdLKffMfGz5U7fPr0LxANe2M2ZTT8fFcv97wCGHVeklTtjxPdoXFy3KHvj9oCHmhfYIPMcjUNhwgtHZv/ApFsbf12Z+fLV6+25IdA0ykictaNtSDUQFcw0Tx5HPO4rFtSLvKwmWl4Fb9UFg2jFpPSSnlEKP9mXRlDbvlqeOSlesfWbU7mOdyhlKF/Kjavp+6dOuyFwR2avLnelVatX226y+L2MOPJumMJZy8lv3LlClpVsltdXVVhaTSL7BqtUeBgYgwUOPRX7udtFkFVax/ZSQlzmY4My/26PZtl6C8bhkkWr36NvqTYZUitKHRhv/5+RyM00sfCMelds861lpIjkPvtInRKaP9cuUPbShWjYZtGvi8kNVMAGQL1xhIIGcEXNg0j3WHHSXKHbQOBsJhIv6fULIAXwqwnXTbZSlGKAVW7VL5avmWR69S89/K6Yu8yQyNY2Ew8hFguSOFN4x8//tRao5kCPpI0eY1/ys/16lr86le/sqSmCowAhpYTDh8r3rnzcRhCISNfWgvnsiB+gbA0WvNTGjHxCHhXZL186dJ3528HCV+4cAHh5vzXZzHRDoMbyO4Tp7pVpTfHKUSjozOzoVVTy9fmspf+exZG4JJ7n+rJ1fwJ3hdhfaoLW5sDV7uhwFaYjY1f2/vFrLumenfPW2dyLKBbNzY24o2x4iVdptskRpVk9MIFXtCPsqnO0miT43TMe1cP+ccCgO6wsCB3iN0zxX95MfR37r8FTxMmDx8c97+RjQ7CoBmigv4yVZulmO/7Pduk5UGaAMK9bhpYfv6FuStDMW2wbpiSQ+jsLyQd/q2bRTDj2KdQCAvQXD4Y+dIkaXjVVDChXpXIUnI/tEzuI6dumMVxZQUer5g7oXeH6io6LLu+4zrscW3MjrrHLWZ/iRRigfu7ocqIOVo/WRnmmHhZCoVwF3X0krrw8Kl43C00uwY3IJR2kKmDF6ZOJ2MH+bC/VD3pIq+srEB/0JUhESfpfpYaOTJo3tA7qe+C4NJMB7zZdCN9NFfrhQWL3N8dJGKL3H7YSGcSV4fGyXGHnjAXPnaON/15UpuKMyU/yZy6MvsCH7bwh43/JhwhryM8QsixQHdYgDucczaB2YifbhNCCDnt0B0SQgghdIeEEEII3SEhhBCS6A4JIYSQRHdICCGEJLpDQgghJNEdEkIIIYnukBBCCEl0h4QQQkiiOySEEEIS3SEhhBCS6A4JIYSQRHcIzp8/f1WJN1og5pyRTxon87iAk1Oqd1iSOutDHVthEZYUkxz4YM0RHlkEJ6QY5FAcWeuOl6MVgO6wgBMt/GF+M5Bom0q88a558OBBFL0VpPXszFVycnjzTpEU/IH1hJxt6A4LCzrv8JNPPrHTKQ80KxsbGzib1E5U9+TqkOhwxLzMhh4//tTdL+Cke8+lS5fS6KTW/Xv37iGyi9WdwOmTCpceHMSKsB17K7WwY69BdgdhY+7WzCv3hxJX8q7A45NsiwQHFJuwr135ob4W2Y4yNrkeINxF9i1vwpBdX7aDtcVS8JF3d3e7irkTj3H4O5K9du0ahP3puFK7PSutPWtALp3Yp5D9yeMI1GRtCj//u379uqVgyWY9ntpPtH34zp07IYu9Qmlhp1RogVGyaWj2kTB1tY6NZo1jkf3JsT4F6x35PXnyJLkCaxNN6jA5RqydfYPrqIztn1W90V+wb37sg6Sd6MdISKGOjL4OZ5vPA91hYUHu0HfGVMfYcLUIuXGWdDZ1SZ2TK2vZkGbtDtPYfll8sVm4tVSOrm5XPCSex2fTe7w79KnVKXiJLrC7Nrx48aItZZoNhbvmRLFTLQHzr9l5F5/CVNgLvcsEMjVx57kP/WItIM4j9FFAItTnxSfXPpKaq/LI9FuE5KpsEQwpDCx+0qdc9Rt9ARBnZ2fHXKYhqdW7I1ndYRAaWX2qv7Q2cY22b2q5s/Pl9vZ26t0/hPKI6A/CiG9hJ+xSw/QuqcpZ8/rBGLobhZcIErkeL2RBoJ1XVlYePXqUVOt0ktQ4I/bAHllbu4WAKYZOwnwvNxWmE5rCzAndYWFB7hCDHwQzB8QwQUWePn368uXLpKqDxY3FQdlev35d29/Q02J3xOLksqBpl219fR2BYDUsbIg/8M5VjDum8y7KsPT07tD7gBBf1j0z9NhuNcvjhTYefAq+cfLINQ5xLBG7q7OBIbIR2gcr+1Awfyn9mJ17S2NfZWAFhrAUGCmocJQdFoje04gOSK3tEvin/EzFjA7yyuOVlskDUoWbN28GYVZ3mJUwaZBbFy9eHpe80dTZuUMkJQFRdV9ge1CmIM2yeT+NFLA6DEINDI9LO4QJnH+ELAL9pqL0svwrvRzmUrU7hNGbotnFGm5ommfqwQOhOywcuzuEhcUw1v3Dgt1FXmJfTD9mTHkgz9WSUYVtM9dcmjTVYqriVcrlWZ+mL7x6yi5x7A9LsmJebd8v9c/iFiTNfNNEOS1ybi2LVR4HAKpmO43wOrnfu/ORe2HJwvtRSWFj49cWebrAnVyt+RAZGYUdGwnDTJhQWu/FixcWwQh1DMXztv7BgwdSx5ZTH3YULDWZsH/++V/6KlsEE5pflEmYc65D34kQKfsUUH2JI0tP75KfP38h3uuzzz6zyDL5G88Uu7JJRazdvOnMui7HdAr7AeYO+9Vzt4qV1l5TMEHB481tA7IgrvZTNzMXXmktGpA5n+iY6l7sGr+FkMaaFvR2rzB6XSLGWRTsypUr2b2gmQe6w8KUV5jiQHcI8NENetr3NwyHn/6nvo+xw26FsYB0+IHu0KbhWPT4W6mK3AtjNAj9/pVKyrNSgOaW5o0bN+wSfl09VnhvV1IIDsPuelB9/bek0wtLalm3BMPKAHfD6nBlZQXpZ7essYEhfWeW3YS6XBsNOcld+igstgLVPObgtWbYuJP0613KVHUN6u4vLQx3aJeGjyPuAe5TFbKTS3h7e9fiGBYhOxcoftSK5AJDFlBdfQU+en/58uUX0rbiAqUx3UvQTj1KN7tG83vUfidcyg+lgiTogKSMcmadNerw3JxzRkiOFz9/Gt9puEMDg8JLctl+6JQBl3hc9WXQOouzs/OlKAnCYqZyZ4ViGWZDd1hYkDuUNKe+a5BLP0HuJ7ll2Ns758eKxbfPE4yQpt/eFAMxtp7Z61YvbFc56JDaQZnjF+wR78tlMWFyn6aF4cn6FKJJDTTlOgY6oxlMoQyDMMyyLgot3HQVzZGJAutkwtei271sNpcsfbRo+CKgkNx0GEj7oAzSkva1zt27d5GgtElzyyi0Q7j05ZcGaX6o5Qss5YS5kQefPHlmcpmbW9jIvevNzh1as/vS+lL57Kya2W2W4tKFy8zg3LlzoWpgs1/+ynAY76wWNQg6kHvf6dPH50V2mao2JMcIFObVq1fSyK8KW9L48h8fpznoQHhlkFqdhaWFmcepeWfQqOawnYLusLA4d9gM/+IXv8hK3aNJOxWLM8TJ7tOp8HYnlHnK7uAy5CW6VTtIyMM0TWyW5KtbUIMNsolYan1K0xtTE5blgqUAyxUm75ayBTw+sjgVG1cS2N2N65tms/sXe8m9jvLyUAtg7qpq0lLOO3c+bhbYJysryN5Y5/X1f2ZydIpfMSNO/apS/IHvrNqs+Oysa0I7YAEthbGpjDr+LpeJdhjcoUSw6bltcIHwFMI2h/BqGb6algKIHTRfHmqBqaQUe7zNULIL7tDPfhCQlOtB7R8hCwKNbFumnqC3vrvrN+iwgTU6t+5ihhVCUzeCDsyG7rBQj5zZzO8O4Rj81zE+XGfq33l4zJwFYfMSf7Ph5Pn27bt2mbrNhJg1qHP3MeVB9zWj2cHsa+T3uEIgOf/htxlFrU376wIkXUv5PwhBoJ7+AxEiNRs50gtSctsY9L4cKSyVP1Mp3+suKdmtKcXUwhVhIYjI4iAvXrzcp9A5MEsNwrrAXs2kDFtbvw0R/PuSGdUMl0vly73BzbhmH3YgxvowZGELL/GRdS3g9kxYz95Csv7vKyxg7jCXN4KjUXN/vEG9qfRzqUENLGx/XDSemX1plndcnmzfJZrEX5JFgC4QExRvVO7w6tUfud2vkf+zngoqV48FG9Qy07J9C3s8KNiB0B0WFuQOdeLf+GYBDgNzc7+fkFvfy4DmrTC8oSshu1RFg0TpIlsEdQmjyGGqlVxqO+Ur1sJ3vvMdH6dPvJOEV+IaoVxK9VVZR5H1biwtsNLaElmfsyqg1u+FyMPzZTT+BkK4Qxtpzcgm9JPc9fX1PX1pL3V3cYeS+Pf2VjX/Vw1W5WAa+hR8O3QFCIt1XaU1dC/3n+346Yh+/Fn+LjPspqIM9dua0A5anvcQuVY/jdBoNMnOvwK0pWRIIY//phNs6ju/7FalEOb+b0YhUbVEaUfJWhVCCv3dtmqRYwTd0Wzquru1W0t3e1XME3/TJTHrFKAbWV8zmRBqDzVwcQ+G7rAAdzi1PA9ItKdPnzZN0hT1tDpgEQ6MeeY5xhY4MKkQ4cD4R8CnWadfS8CU/Hg5llyOJZF54Bghi4busCArmAcPHjTnvzX3lXpnnBBCyOmF7pAQQgihOySEEELoDgkhhJBEd0gIIYQkukNCCCEk0R0SQgghie6QEEIISXSHhBBCSKI7JIQQQhLdISGEEJLoDgkhhJBEd0gIIYQkukOwurqKU0LijRYasXE2TZMT8n/fPyHFMMLpBCeteCeNxbXPkVOuH6wlhJwu6A4LesDTXL4Q3C/nHc7lDi9dujTnQRlTnD9//v74QPApLjnCSfeSgpf4mCDYskvV+eMzwOFzCFuCPsKQTXVXCmbn0i3p0fBTMZOeGIwz1sHly5dnRAah8JJCfQze8vJy3UfzN7sH2VljSgrhoMEZNPOStvVVBnfv3vW9KUU9sB0CzcPKJSMTogohWX+ao9QLh/16zZFk65ZM2g7+2XPnztUJJtehXnjhwoWhBNXdQIgpCSZXQjxLt71orI9md5bh1WCGBcAlIpgwTYwy9HJQsAOhOyws6PjfrOevpv7k99njcGdnp16hSqmuXLmS+pOE/a2aZoTcn6UpZbbTop8/f/7ixYtRPAXlfPjwYTjG1kVpYO5QC9lFrk8SBjKNgEPK5Zx0Owu7UfLkspYBYA0ukWHmAs3sLGU9JtQKOWS3t/cVKpvdQbJWSInsD5o/EEtZAo8ePerDjYIFJHKI9vjxpyYx5RElQTvMmMCZfEnPl5aShBmAT3Z7ezuNj2iWuvsDhO2wZY9EhkmyVk3akghsbGxYS8rdp0//Io3PJfdnmksKoo0WGQGvPKJdwfzNiXUiQFO4+2RRWN/Zob7Sxdr+I41VrSudEuQeW3XAtqz12HQNp/6GQa0KNjp2e07oDguLc4epn6c0uxy38O+aHj4cokmpzImGW8uKl5g9GgsHa24piHaGk9BBsxHw1KVqLp+0zDJ5b7rDNDM1H9BwiRmmC2KIt7Z+i7CvRdMT1Mdnm9PFpS+MnWUv7h/+AEyULXtzLEuoen0pLYO+mMhuOKc7aeR6wSe5iEd88uSJk+xb/7p5Q1cwuLqmnxg7lVHD1qqIhpV/zYFJHLNB2bnDJaWXD7VDeHd313fBVEsi4F2jlwch2rl2h1YMaUmMmiZBSWR0iKTWYXLsZJ29iT6jByUM7Xr16pWPhmmQKkMczsBrlAzVekMuaJftbTQtzzzQHRYW5A7N5ajD6HpOHjT7ONaD94Lk+vXrVirMpOxW1peXW1tbQWhhJ4y2L024Q/MNUjtxcibPiszxEfByWQdIdVRcsq7cYdRyiV/7rdSKqcJoc2uaBlpmhVrgp1awEGFt7ZYtbrynsfaxiQWaHYMZSyhJXJru9evXiKCR90QuwqnsgpUXZ4yymTD1XeNjSrT19XV/N9BsNIlp+6hITXTv7t27Po49uLKyUici1TQfk6vVYe9Q27UzmgW2RpvTHSJQu0OgLbkDY1rvlYmGy/IaYSmzeMGsq+RmaclxkXWpp/+Wn6iBn+PW/izNdIe+sz777LNHj/6p2CivDP5BSwd2TCyYzfDmh+6wcNhxcih3uFP4MlgQyVEMaz239dHMiWKrQZTJZvdmxDc2fu23HMUE4OcsWpcg1hMIP3/+wlTWIuhu7b78iy1TW6mMS96lIHHEqVgYcXRrsczBMSTsKaPWe5kwirD2zWkcuZma4WcbWs1RU4dA0mEZ3KHU2usAUnv58iUqgnElhTSzaxuhGrmZXUkBmzbWQZtK0kJKn3rrgHBoH+SOTvFmJY33Gz3Z7cnr42XLSEru/ZN0k3gm3DVhKn2xhexMopddGXxk1KtOATSFMnWz+sJy1Sn02RVsCY7OBb4WXmd8Ir1k1DgSASvyOiY5Xu70r+frpj6UO5R+9/GhAP2ks4u/u7trESQy5lt462R2zCLMA91hYXHuMPdL+NAxWadOqdoh9MVQQ1AMxLNnz5JTJkuqfnatx6zJZnm7kx88eODVqLk6lMfFZvnLENBwt1zw1UE503h1KJ7Dl1MQr9AcD96ZGWERObt36ratwxgb4htknNgGqZTnk0/Wc/+C1haFWS0v3j3k3h0m3Z2TWYK4DZnfwKGGd36u0Qqor1+A3lekO7wVsLmLf+tmgzmsuUGzQaAAqbUpGjoR9c3VRERXUcOOojw18e6wvMVJutXhd5tVUvTNS1Jl8kLdLWwB/ypobWJ1mLoNtN9gRuXltabVWZAF4Zs6GKjm8J9yh00NB2PFLoNaRqskLsMHEstILGcz8SnoDgsLcoc7/TuqNO5CrGCa/eSLoXtZIyvWB9pFnZIbFqHpDqW087z+6d3hkJdZtGqzdFQefxnGSb2DGiL7zcnUx0ciLdvnG63RJibEZq+TN1o49y4hu5cT9/uPTnUwN7LzwvpTkUAeFmGFXtgF+mp2W392y7ehhLGXa5LkUkAYS1solV9BWhzDt0PTHY5XZr76w+dIxqXyGdSog4IFDI2GslmcKXfoV4qhFqEd8LI56xQnVx8WkWNEOnpv7yv5V+Yo+tnXqN/nd4dPnz5tRgbZbR444T5eE0i+9hENpnejeDOhOywsyB0GS+HDMsLFMJmhdLeCRWukIP1tD0oxmruaNZ988omtQpru8Ny5c2aP1GF3k7vslgvmlq5fv26Gz1ZIwR2GF0ghx2bVgIwE/1FJGn+Ngm1GM+j1a6qxuR8sLFhe/sCywyslhJvLFA2bsR6Em/12q4/gHVKzdvVaCkxlZ82+5v7cwtfOk3uH513d7du3LexixrKJxDe4bRLkCXdouqHhLjXpI/t02eOzDq6uj9BuNEx6pO71h8S+s5Jb1oOXL7/wl6Ih9k1HGudCjh00r/iz+qulpodrusNa4ru4viujw4TeCkmOTZ2cgu6wsCB3uFk+M9nHKyibsGT97MLCYeYbivFYvzjHu5/xOsbesngL0q4Covm7/XfPeCc0rFP1HWfG7hP+REQfH/LyCm3P6hc9JXHscVlkWHDzqfYgQNWQV3BpzYpYZH83mEUvBGEUAZOo1y8FRh+ZHG5S1o5a5a7Z1et3tRODa/5pU7cHsfKwsmGrU6Jp9FEfyc+3sLSD36N+rqTSmJezvgLJ/b66Pl6wN3+55VQ8Fs0bBbzJRhlsToOqhY3Hvr6lzNiPghyVxbtGpIxVskVGIta8QQ4LCKSDKk0r/9oEyPXmkIJGNoZmhxwBPy2wu/UlOV5g3JqNPKc7xJtpL0m9kxP9xOrT5FlVyCtA6l8f1rvoB0J3WDiSO2x0bRMMyzCjb07w5+RNnj0VLClRqtTyWnI2mK0wR671kR884TTr1RSSxXEsDd5MpCk8dugOC3CHc04lMBud3x0ujnlUZJ44gSM8Ao784KLxBTtsIQ8b3/Mmz9Ycl0cMTCV7XOm/W85GLc4qJ6136A4JIYQQukNCCCGE7pAQQghJdIeEEEJIojskhBBCEt0hIYQQkugOCSGEkER3SAghhCS6Q0IIISTRHRJCCCGJ7pAQQghJdIeEEEJIojskhBBCEt0hwIkW9UGyTXDG2jznHR4XONM5t86ArsFpYYc6rwqctP+7/DvETgE8XYQePCG1oF6Rd8IRFI/usCBuZk5fCMTQbG39Nh3U4jgDFs4pHPPbxI6VD8jjFy9e9JdIEz9/yjzO1LXLGfTH1XZHqKfuvNl9nKWJ3+zaWRnGh9N2z4YzOXt5wZy6RZMUUAvJEWfKI7I97lLYtwPltbKdMMQ3oR3Sa3LJ0feFVN8iW33zxGQCh/FqIoO29IfZjsqgZwJ39fXJjn9dZJyf7CXCw4cP8bjIcRy8pYPpkcVM/RQtj4/5bar0jBaeARIfX5YUtrd3XawCTpZ2ly+aVZaWNE2TcnpNu3fvwTyOvK9xoxYiwVHsSNZKi9/bnMgSA+c5y3B7+PCXqTF4Bwtp/VUrsI6Urrulc/sTucvP4vgRbcI5oTssHOn434MHlU+zHrQ1qgHD6e2gPi1aot28edNLjDlrsVeOIO/8qz2C86aHSDMR3TXLC6Uc3y/41JopTzzVCcWjmLWV7PxR7DLPSDqimqdOSl42RbDUlsrJ7MPh74ZFePr0qYXrcZjGSiJG35y6hMV1DfEUizmlWlLytbVbSedMfj4hqVnYIuexq4a9sLsQIiCdYuFmvsml3Oy45hxIc+yekma3KZQIbcKBOL4ASd2hn64ByUI0EB7LgxQ2NjbqbjJQPJmM2gCU9MOuSXZzJlzOSJC8HaA/og+4DGpmOrOp9MJoNKD8aZjVdRH8JMw/VZvT2dAdFqZs1hRzukNvrK2TxPa55dHIQGe1hmZbr1y5koflWvZmrnaHdoKx/tspTVJH0kv2awOUnCLOcIeabMHP4HyE2tyYWQfNlGuvo2Uo5VlSrGziMyxrSRkWdoY7tJr6RmtW3w8YF3lgbW0NQsnOG1nrJt8s4Lxil7m1zra6S8dZZGwnDJF6pJBT5qO+tBREKB5XK7F/7969OgLi+DCUzSS9vGipfwq9IwFxXcHbacwhhaY7TFX5PaIDQZ12dr5ELawMwf+JX7ew9IVpEch0h+8U7buu+/BvGC/Z7VFJ2IybjLghUq8zpgPLit0Nng/6OUPNmtAdFhbkDmEI+jd/bYNlwtRbWLsLgiVK+lTtDkFdi2a+Bvb0EJ5yhyI0vbTIIWZt7rPzATBP+I2nCIP/9sI6rK6xODntqS7rKXdoFZGVCgYJPKtWtmTn3bCY2q2traQ1Wl7+AEJfu3F4H94rRDCCx5V8sSnkhUlNtnlZj6Tgd8XBzs5OrWwhTX9pUwcRiruqI0iCyD0XZ19WqIjg5hCj2sE/eSHwfWFIzNevh+ad4Q6t0SCBtsi/yM5rlPQRAroIKBXxd7Pbjsal/lt6qpfQHb5L0DvYTKoVRoWDcmJwXb58OWiXaDUG+0QKjY0f0Zb79/88CGdDd1hYnDvEG6A07nL0dMjR7ZKN5GG6nbTv9c1fx/hWrEVtKQwkYusGvDtEwfDrZ1gj4whPHJIKSJrBUWF7M+mDZqdMgyW+r/7t27cRc5x1NKDr6+smqZsIWO2ym0P4iaR7vzvKy4ftQX13CAajvLKygrviY3wiqV+aewkI0YBoVGg0K1g9+6nqO1zeuHHD3KGLkG05e+3aNUsZErE+vkjWQZIO2qp2h70GxtoFdf3887+0vHwK169fR+DcuXMh5bA6NI8OwrpQPxyLXZ/GrtprTsiLvB2kQ9FxdfuLzsuUMZipurOsl+sU8PGgl0BdczU9PRC6w8KC3GF2nzZ4A4pbte27r0hMcx6psi9Jk6rtI6hrgV11yUt8c61JyanX9OqwWBM1f8VHwlTl8ZQ8Rb8bi2FMva8Kqg9VNqEMGFs2SY2waRlWh75t3ZvRwSYikHo33HT2CGB9gwjS0Riu+lKjy07KFnaDQWjAuqagbmd9cxmFRn2rVgkL285hdgt022GGHAEL144cmPDBgwcW9h0t84PQDkFdfb5ThKyDO6w1zcBHE16C90k2jiA0pSVvHxkpjx9/mnWHSRB7WG2BDr0PO2CDV3oN/ixPv6bB3G5J8XLQ1OoZ0B0WFuYOo90Bd+58nAujHPf2vlrv8dtNOrBHnSoxp91h7P690buxzrIEcwNV09Xh6PHeYTRapipSV2B5BO+r/F2fndkpcfl+pl+XXG30YNHS2OGlyh0aodlv3vy5DrNBaOUJ/e6zc3l1n6f6MYlxi7CvXWhtC4O+PYf3kUaILIsnPyWqkwqSZi38nnDuV4eylq0jh5dtoN/DANgwKJn615BSzvACOKhrc7NUbFzQQHez6KG/2+zi1Hu+IBSJTCwwiCQsS08I6Q7fLV67bGRJQDorGNKgTk+ePEvag70GDnoIQspQrWAo5ofusLAwd9gZPr8k8ts7FpBZtv868fXr1xau3aFc4v2Q4W+5iJ0EZcCbs17YvcPzhbl06bv148l9taXLtfKGycw6IuRiasvH0/1lbElbd8qzwUaj8FJ9/85MCowP8U2ClaLle+PGjdS7w7od8OcQms7gmPUDzpLgpd6MWmq3b9+VML7XQGQpJBY9z549s8h+/02ysOysMUML1wVLLSOukkbk3O8q6357bFJfBVzKg7rxO6yEspL6jusfLXJMukWHXYG77QpfTcMroUSQB2F6ss7lrRghZtLNUlkQWNXwFyNJ2wfllNrh3a0hehi8ly8khgn2x4Ym6xvNa5dpHZ6qI5O3BtRPnF8a7y54VYH8V7/6le9uu2t44dTAwYytqcmzoTssLMgdpvLm49d5/KeBMDroe3GTZkktQtL3JTYHt3fIBnbtjDpxj2QkzlU8gVqx4a5+4pFfvPjnJpFZeTBMBlYP+Muh1Be+f9c4fLMgcrw19BoPkELdyOqE9r03TVr9ev0kC+JcGL74EBsXmsIiY2UZWgMFtu8yjC+++CKPFxDyINbKIXJfi7ja0O2gfVmRmKRZsCXdcfWOP/VOvY6c+g+d6tUVboVLIfy9h8Z5D+87vTx1nnL0uWnqa9FU7KCE8NC59W4mxJxRO929b9ROWt6vjCFBgcXkQbVEUetkZeHr0099K4WYEJK3CRZ5dcs/efIkSFI/eL1h8Vgi6O5mt7548SJXb6Pmge6wgHnEnNNGiQZDHG+QE0btlcmphh1KFgrdYUEmGp8r8UYLxAwvhE8vc5qY2dFm3w0cKjIhiTrzu8c76XG6Q0IIIYTukBBCCKE7JIQQQhLdISGEEJLoDgkhhJBEd0gIIYQkukNCCCEk0R0SQgghie6QEEIISXSHhBBCSKI7JIQQQhLdISGEEJLoDsGVK1f0BJl4Dk4TxMSJFu/k/zNLCCHk2KE7LBz7eYfmJl+9eiW+s3msV83KysrLly/t8lXHVv97taRA+vz5C/doh9Rib2+vPqlK4geJIHnVJ4rhsF8cfmvgtNV5DvGYc0pRI4lbo+G0s7oWqT9BNPDo0aO/+qu/8hI9kC8eOo9e9qcKA5wI2MwuYOcd2sF7ntDIOFrZDokMbI4PqpxBOMUQh5F5PZlCsoDm4LQ5QxKEOoHU0LTRsZeSXTijHEJrNDSFPC+9YGrp2+f8+fMyBJotbI1miUij1addJj1J0cKutF3JXcTSREGByTvHRm4wI/WRmTJwZJAGS/Ly5RdBaYGojWhLGA7eZi4vL/tbs6E7LMj4qa3kDA50h8BOsMRZu/F2BUyMXV7tWV1d9SWUgNjlS3qKuvfiuT+OtT45UyS1gYDvDBKcxItTiyHc7A95F8n29naaWBNDOE81m2CQoFJ9LUany6JxUCorAPy0+BVvQHM5trc4oez8uj9TPjQa2soCU2jZ7JzuOHlC4dxld44uPOgQr+dAdyjDGPX1yWpflNT0iNQDmho1EsSR+I6WxlnvQbObpoFx++xfVEKjWR9J/L7rywwGj+N4ZMjRRyKpDZ+pFpDwzZs35alcOm6Y7aFt/QitCjwkgslN06GSdwj6SGau5p/QccHwikrgzO1a5Uxp190521kHe+hui/zpp5/SHR7FHTZt1hRzu8PRUHd3CrVTwbAPQsNuBS3B6kFsjS0jJOzNn9RO3FidspraUa2bBQ7ZWRiEWiBCXbXUmgZ6YJezM2Qycixrs9qhwPWqJcUCN1ygZIHCBKcSEg8F9nflFiy+IfogSbkF7pCsVKSue+0Oq+xKCsHWzyitcPnyZX/pI0hDWYHrBwN2tLV2QZejCG2Tw2tas4WnyuzB9MKeCjX1PQuLNlVsaXNbcEiHBpVoqiJ5m/iJsu9izFnrGbmFRf0Q0BlSo/dl0InXjNJpVTkQusNCbWdnM6c7NHuHkQ+1ECUwc1OpQpaJvN31iNBsUCgqpldiCPxmVLBHOtWKVkm0Leysji3agWauLC51Mj56Kpf52pd5vNuZy2qpLAVCahpfFp279U6sLOzCHoiskv3jT58+RQtfrZbCddhPQnM/h3j16pXlq/6si3zt2jUJS+JatrIg1qeGZLe2fhta2P4F9lQA7QNMPdQro332fTuIwuCttkk8Xi5NoSn8Rqpp+hPawVoJ8ubWZXK+MHW7Jp2K5n6mIv96v2u5IGBKjhbe2NiQGonXrCfpiO8LmfrHw3i01adJPKEjJPL7779fz9J2lKlEyOJQZS/DPOtaMI9fTAT1HittvnXrloWTKq3vWUQWs2CSXt5FDvIDoTssLNQdfv75X6pCjByJdJV4Pr/CwEaTzoMa5i887u4Ml347dBy/hIO/QeRQcSlP1g1GEd68eRPCoKAIiJm2wvtELOArktXNWxh22U8LxFvX7rBuh1BaiYBVr7Tz2Nv5OF349evBrCM7KaEUAPlKQOtutWi0tg9IdSyOuAdUxD/V3AgVndna6t5ySfUtDh70k2gjrJmA7r2PHGezyrkzQHtoIh+hl+/fvn3b5HZ3fDlgwrGmxfZJWkJMCLLOjcQphhSkKaA/vuOSrjvl2SAEoWCGj4zKrq+vIztrUrwCSNpZMtex+OTtcL68PC4vsL0OgCBBL2PXYXn5A2+Fcq+05ucgxFzQps46hytOV2nrzBR0h4UFuUPM9xGurMzonZBKzHl0L8/8LUzM+8uYVB/oNEBXCcX6iznwy02/ZPFPOWEXvnTpuxbBvh/RfxtPeUzu9zeakYMwuMPmI7U79OtCq50sRDBsUOY+crk0r2BeUCy72VOf+OvXr1FfXwvvwlFCvOzsJfs2dW26Q5/+Zr9Z2ly4G013mDp7UeS2ctLKdiBOaKva86k86JJoWjcfT/F16dDamklpGV1SN7ITC2VTBGxnYfIBP3rv3r3QjAGfrBGK2gu79O3ShYdxhE+rgFlY8taQ+RAC9UeFoaOhydhakJ5tdlZzxJnQLx/9gJ0HusPCgtyh7+kw4UWvJ9d5OlRhf8uiJ0SeulxZWalLbrYy9RnhX783q0LQLQSvX78eJtoWNlyy0VoBL3da24gc0h+vdfKDBw/czQ7fTVh9+pl+Mxc/crzdxNJERileYFicEBgLs4wWk/fmvusyAz4jFKZ+++XdYbOpwZQ7TJqFGYvayqRxdlPpBOWpLocWVk2LKQRNM7nUCBM4vxuPvQfE9I3WrH4oSVOiwuF9LS5duNsf3ix0o1Va288syaLBbA/dbZNUH6G6HCYxVxV/1yZ/uPQq0VQPU7k5oTssLMwdtnsrq2m+e/euvQ4M1spHlozCUmOc1LAR7ydKZvrHyXbhTfcm0lYnwbPWaiQlsamW+E5vVtwCy39OYlo7fH+4u/s32DjN7rNPqYK5QxkzU39FENyh395M6T3sf/aX3fL08eNPcanVeQ9hE168eBnVlMi++r4dfNVscNYDNcWm9j3YNdrOzpf2weR4s3Sy2WcoRi67Sd0LOR/HbSUNwq2t8tF5L2+rpXloI5e/Eer+SAM7tP5u0sedpjVqIV3sXr4Oe+aGPSUa1UzBSerc4xek2f2RhuvNYYzI3eaCgywU9GY9ZFLV0f7S29jmKAiabM4Sk12EbbDPA91hYXHuMOsn5lk/lIBQbKLbKeoyFZvrdaXZ917y6tVWLgwdn/ovMpBjL7nlH3+upGkVtDQ14MtQ5FhI+eWsGHe1ksNfROzprj1M53gXa18csH5iM0pWmkKcn2ptcYd4yWR/XeT/wChVviH1BRONr+SlHaydpczw+rKK0g9kQtXQR0VoI0oqgoJZZKxHnz59KonUnZLGrYpO1yrHT42kESRl+dd8DyLLgjhXf1AYqox3llqA0aJKcpFLyW53d9fia82wDis/i4xpDTrO60+9SkOV+z4ainHjxg0twFfyuJ/9SH/pCmDUFyKRAqOEXg7y+HNcSQR/mHHt2ofjiKPm7SXtXlB9GP7iE42mb8TLdrd9r0jeGuh62zL1BK3Qvy8qA0dN3Gh6pD1bDItNbjCo9VVxeJVexlFzAjcbusPCgtxhUoMSJrA2+BHwC5oTwvzTZ2k3LFBCLURe/2mBTP9rYTPmoVpGhoSkHKUTWIE9UoB6A60Zc4a8WdqpKtcL+qSzGQs3scjNWXaayK5JaLRm4Y1lJUoPg69yoM4a7VDL56fZkk0hOZlMKUxzpDd7VjS2GXk2dIeFq/pBeT39bIK59qHe0BJCCDnh0B0SQgghdIeEEEII3SEhhBCS6A4JIYSQRHdICCGEJLpDQgghJNEdEkIIIYnukBBCCEl0h4QQQkg6k+5QfOH7778fpYQQQsgES0tL4g7f5P8OeEL5+c9/HkWEEELINGfTcZzNWhFCCFkYZ9NxXLhw4aOPPopSQgghpMUHH3wQRWeGP/mTP5k6B4cQQggxzp07J0vDM/ji0KBHJIQQMpsPP/zw1q1bUXqWMD//s5/9TKr6c0IIIcTx0Ucf/fEf/3HtNQghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQggh5O3xPwE6QTyAhpR4/wAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,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>

[image9]: <data:image/png;base64,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>

[image10]: <data:image/png;base64,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>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAloAAAFFCAIAAAC7UdRuAACAAElEQVR4Xuy9TZRdV3Xvu7YCtmQ+VMLEkkmQKl+yiVHJxlgy4CoRsGQgKtmAS4SgEh+WTBKVIIlKDtGRadweJrd5GyYZL68Zcl/72uSN8V7vwb2v8XrmpvN6OHn9mKSTkTf3+tf+1//MtffRqap9PmTP32Bs5pprrrnWXl9z71PW2ikFQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEs6CqKq/qZkfGJV3Fu/QzYbaN6aX2XpwEQRAE/YMNutymS804tJZqVc4Jo9tW5lYZp5waS0tLJ06c8NqdsJRxGk32yMLCwuScB0FwV/LGG//zF7/4J6/NvPHGG5r8+c9/DuHatetvvfWvkH/0ox+ZbP+7deuWJQeDgcnHjh0z2QRzDhm88sorlFdWVrh3WwNeffWvqf/lL/8Nsgnm5Mc//jGSr7/+D6zX3JrMUkmc3779fZrZrmdOzKfJy8vLpjcnLJLSPjYvt3brfnFHb731FpMbG9+BfO3ataZ5+xoz1LXP7oL1mvDTn/53yCnf1JtvvgnZ+kRK1ff46quv0lK7yGTrz9REPs16/fXXKcMbbgTDAX2+91/S+cGDB92AEm1ACfthNGjqHnFOMHC9UDbv0qXLThMEwTsXhhPbTC1a2I6pytdee+369euQLdoNBi83xr+R8i6sxgAeXnnlr2hg/OQn/7tt6BYeqEk5KkB47bWfYLvf2NhIzQ745pv/nMRDanxSievy8hkaWCRI8j4Bg0uXLqU6kP+jGiOZchuWlh6lcRreNKFcX1/P+q17P3nyZMoxzNqszUPwoxL14opAxdivpSivrq46jZo1oe5vkCx3dmAjCKHsPbSEmEN9UnlLnhKs/7O8j1nqZwTaKvNszw1M2shyXKyRV65cgXz48GG7Hjp0iJbsZ8BwaM5tpE6detIE9BUc2nzbv3+/1YXk8ePHzYMZmICCbIYVXFxcZNWp6JMgCN7RMLRg33krv2RgB+EbHiwHGRa0NyEERQuHOafexVDEXlwQI93ObleNXgyHfOmxeMYNHbyV3y/xNoZgmXIoSnV4vq0vi6kJh8BacuJEHbdSbiH2etaut6a/mLFJtAHmAW/GzQ1u1WtXdgsfC5DFNw9rtsV7bepb+cURdZWRhm/GZmA9M3yDW+HwrfxaDA/WY3zOsNjAcYQHGyN780OQtiGzu7BbsCReB61hcGgxnhUhSCBpxvaKWTayFU4Pi0+YG9Bwbpiexjdu3GCWhsCucJiyN+tMazzdwuHa2ppdz507RzMpAv+w324ehAiHQRBskzf0esvgvsPtGFl4z7h2rX5HvH37+1vFMv/yL79Mw2+Hx+ofMOsf1mzrsW1LXdn1xz/+r6bnr3wae+x1zWKwPdS7P+dwI0Ycst38zTffhBJXvtGm4XD4s5/9jHJq3pZ4j+fPX0g5qiUJexZfNQS6GIDIkW9wu3ZnY7UwMjEc2k3xZZTxLDX9XEYaajAu58+fZxaL40XTLPnGmYNEbY+4ix9mTbBgBgO6fav5WZVYm21c/u7v/p4G5gTNw0NA2chWGG/cL5x4n3Z6GJ86dSrJm3HWd4bD1Pz2YO+IVtDiHwLh5ubm1atX+bR0+/bt1HQRPVsS+pR/Q4YQ4TAIgm0QJ4htgrbj4O9kzJIfrLa2Kuxl2CXdj6XI0lcfC6W2//JFhHsrgwRgdESUctGCO7jtZVq76bnbMhzq9g0/fJFSA1zxY6n5cZsj3cIDb1Nrx5UxKWVv2IIRDvFHWas32+xDFmMVr/rSrHErDXcvwyFGBA3jH1Ylcmz/zpmarmP/I8LhjRzviHxqwc/RaKT2ocojYDi89957USk0Fq5SHrgDBw7QmNHrxo2bSfpwdDgk+tqHrmbkG3473G5AhMMgCO5A/imvfmOzuIVd6Qc/+GGSCPTaa69B4BuP7e85wNTbrtu/LB5YFnYc88x3Dm7HeNE0/v7v/zcIxt/93d9RPpb/rAXZStn/7L2NZtzLUg5yuvfxr0QoxRrZHmvbf/tvr+vftJhlMVhLsSyw96enntral13zto3q5v09X1UtS//LF/Pwwx/+Zyb1zdiyNByqTzPTLHadDYR7t/7BD34A2dogRfaZmfTe3/MPhLgL3Pvq6rNQItdiJH6IhjIVt9mFjoV1NQNeGv7bocUtZGGyaamcHCscQn/27DMp/9xtDvWV15IsyGbgb8ApfiwNgiAIJsqxjNeOxMXC0sPi4qIme8QeBXba2iAIgiB4W6G/bwdBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEDjwHdQHg1lw7Nixxx57zA9JEARBMGUeeeQRrwqmToxCEARBENS4L1sFQRAE0+Oee+7xqmBGxHHSQRAEMyPC4fzw4IMPelUQBEEwHSIczg8RDoMgCGZGhMP5IcJhEATBzIhwOD9EOAyCIJgZEQ7nhwiHQRAEMyPC4fwQ4TAIgmBm3DEcrq6uUh4MBpKzrTQ2NjYoG+vr68i9ceMGhP379yNLzVwSMt26LIfTb25uQlhdfZZKo6qqW7duQaY9bgoeDh8+DPnWrduDwctNuRkQ4TAIgmBmjA6HS0tLFk40KZlbXLjwXGr+zZyLW2ZPDQQLigg/DmdmPP/8xZRPj6ON4+DBg6mtoAuHxtmzZyFYtIND2ODWEAJdy2dChMMgCIKZMTocjhMk8KbVvB2+vJRBlhW3oNVEnVGu+FqGIEcPp06dOnnyZGsYtqxLly4xuFpBs0zDr7PGpUuX7bqyspKa10HYQENMry2fCREOgyAIZsbocKgvZxZ7JGcb01sUaX07RGRCQBonHFaZjY3vMDoeOnRIX08VtA1urYhdb9/+firCIQx4tddTa6rZWDRNTY00mC0RDoMgCGbGiHDo4lBXwODf4fK15W9vlsU/4FkMw/ufQwuabOENtY/4sbQJh3VBC4Rmj7jrwiFe+NbWvkJja4/7g6iVRfu7Qu90iHAYBEEwM0aEQ8Y/CxL4HbIVe9+isJCxVzq7Uk+6fopEqdbINzrLq3Ib2AwImssk2oY3RWZ1VTQ1IhwGQRDMjBHhUBnztWmEWWsWla25O0Wd9OJwykQ4DIIgmBljhsNgCkQ4DIIgmBkRDueHCIdBEAQzI8Lh/BDhMAiCYGZEOJwfIhwGQRDMjAiH80OEwyAIgpkR4XB+iHAYBEEwM3YdDu/Gf8kw50Q4DIIgmBmjw+HKysqPfvQjr2145ZVXrl27ppqFhYVXX33VHQeamiNDAWz4798DEuEwCIJgZowIh2+99a8QLl26TJmYBi+IFMysCXL7YG+Rz4Tl5WUWN+HQoUMpn7jdderbO5YIh0EQBDPjjuEQoe6Xv/w3KJH86U9/yqNHTcDZZm+++c+0QYy0QKhJk3/+83+ETZJwG4AIh0EQBDNjRDh8/fV/gHDr1m0NYwhvKcczDWkWF/GZJ4uODJ+gNfL96Ed/41XvbCIcBkEQzIwR4TA1Aa8MZhbt9PdP6mnv/jRYeig1QYTDIAiCmTEiHLo4B8H9dmpcu3b9lVf+Sm2c3Jrs+rrFO5kIh0EQBDNjRDjUmOd+/HzzzX+29z+Exp/97H/gy8BvNX8gNF577Sf6ueARkTIgEQ6DIAhmxohwaHHLXvss7P3iF/+EGHbw4EHGPBNOnnzs1Vf/mpHSjN944w2zf+WVV8rXQQqDwcuDLVq+FfxOJsJhEATBzBgRDo3z5y9YwOMfAq9du67fBLb4hw/Qk6WlpVdffRXfmtd/p7+8fKYRjDP8Hw2CFOEwCIJghowOhw7+U4pgEkQ4DIIgmBk7Coc7+nkzTnHbKREOgyAIZsaOwmEwUSIcBkEQzIwIh/NDhMMgCIKZEeFwfohwGARBMDMiHM4PEQ6DIAhmRoTD+eHXf/3XvSoIgiCYGu9973vjvwKdB+IbkEEQBLPkAx/4QLwjzpzHHnvMq4IgCILp8/DDDz8WzIj4mTQIgiAIgiAIgjkg/nAYBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEEQBEE34/xLxCrjtfPEnDcvCIIgmF+mH0LKGktNj0zUeRL/k64oCIIgmAZvvfWWV9XKf/3Zz34GeWVlxa5LS48eO3bsl7/8Nyhff/11Gmf2WRH737/8yy/t+qMf/Y1d33zzn5nNWt544w0VLl26ZJb8wsP58+chpLqKf2AWnNv/3njjfy4vnzHBWmKyZR09etSSKMJa0ObXXvuJZV26dHnL4w7Z2NjQ5MGDBzUJBoPB6uoqZLsXS1KGYO0fDF5u/lfnDjILCwswUM6ePUsPLIUe2NzcZFYQBEHQAwwe6U5fGoKlu/7TP/1/r7zyVxarnHHK4QfCq6/+NQTWhfhk/Pzn/wglgpkFTrv++Mf/lfaIuHT1s5/9j5TfwLTZDDap8QBvbzUx2KpbWlpCANMQuyPMQ2pe/hCK3Isg49PJkyfX1tYgW9yy67Vr1/bv32/26GFrCcsiEDKImpPmgaOuDhoYWzzW2o319XUIQRAEwV5hrErDoVGxXdj2aAtdqYlMkBFv7DpOOLR9H7ENxohYdkWUQtLc/uIX/9Q4sDh3GfGsbFhXOES8QcCw6m7dup2a6NvVznFguAKMVYq+rtlrHITV1WfzdRW5i4uLafjNEuGQZa9cuQL5a1/7Gm2Avp6ajb07SmYQBEGwBzSQpOHQ6NDwY3s6XlOgtGDzk59sRT7FhUMmrZTt5vpS+Prrr0OggV3tpfPWrVs//OF/pibJC1lXOLQ3s9REF9icPPkYX0aNN998k/L4aKjjm5+jNRyurX0l5VdSC4H2gsi3Q1paODSlZUFeXl62iJgL+lrcr7VJagmCIAj2hAaVa9euSU4L3O5ZikLxt8Mai3+IXoyyiHn4653t+9TYSyGEV199NTVu8SoJD2Z88OAhZqmQhsMh9O5q4dAC0tGjR1NTxV5oDULWTvQPXhwtwuG17/bt7ddTk1vDYWr6lj18/PjxNPymmyQcUtPakiAIgmDH2JsTZQ0wrTCqMaJQoy9G5Nq16xD4X69k+32pCXJmYK+AyHrllVdSDgA//el/h4bFkWVO8IdDwKqtiMnWJJgZP/2//u/GZqudCFHLy2cs6Lb+Ryujab27VtbX1/n3V6v06tWrkBHe7BXwyJEjEJoSWzIMLly4ACUEewLQN0L9ddRkOg+CIAj6If5twI6I7gqCIHhbEdt6EARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEATBEA888MAjjzzy0Y9+9JEgCIKd8NHffeT//cij/7F0+t+XPv7vS6f+40T8L/7X6/+WTkPwcat33v3ud//qr/4q5Pg3iEEQ7BTbpz793vd7bRD0B2LTf5x84vIHPujzgiAI5oFpPLMHQcO/L9XzbSJvbvfcc49XBUEQjM1/LJ1OE9iagqCV/+f4icV7DnhtL0Q4DIJgL8TbYTBN/o/femjxnnu9thciHAZBsBciHAbTJMJhEARzSoTDYJpEOAyCYE6JcBhMkwiHQRDMKREOg2ky5+Gw/q59ELwzGec/+B7H5u7l7g2H8z8uo1s4OncqbG/+bMykWzWbcHjkyJH9+/c75WAwsOvBgwftevLkSbteunQZeuuFweDlrH+MluPTZY9alpaWkLx+/bpdT506ZW1bXX1Ws97JrK6upjwux44dc1nasbdv35acrazNzc1Uj+MlzeqR9fX1K1eueG0zslg8uF64cGFlZWVhYcHkjY2NYfMZYw27evWqU2Laa5+j2Vgght3L4cOHz507h6Q5gYCef3tM3fHDofUDe0DhFIXAWapTVzdZznP2vM0cuz700ENIsqBWhzViw0FNypa20R0/fhxFdBVwdNyY9k5rnyS5O7RtY+M7+Vo3BmsWK6Uvzp4961XSNqsXQ6B7yPXr36WMhrED0WZrIfpteXkZ0QF6jMXu1vgMwqFNrM2M7WWqt1uyeyjDISITbhX6rvBWsp7p6prG28tPP/10anoQA/PODIe2KaPHVMkoUmK9xL51g4Lk+CO1C6ydVzM+oxlZxRaJLbZm8bfPh5mADreG2WZaPvxqB9pENYODBw8hubn5ErPS0Obyneeff/7tMXXHDIcWCzG49izrstiB2Gqxb+bk92kD2PnYu60gH8fVjB7Q4XzYyllDljbN1tbW7HEN+umHQ+sWqzrPr6+7LIbD/Rlsd3gfQNu6lvyOsPuyGyy3FNces8HbkXYgInTKPYxess5MeSGfOvWkMzb54sWLkEfsV3dkBuHQpoVNKftf+TBlnQKlhkNsFrj5HYVDM0bQ7Xo7gTcbG3VoEyXPj/oRo9xV38acOHEibwGXbDP1eXlm65OmzVFbNtZLEg63tokyeePGDcnpjUsNPqNt4DCgWHVzFQ6vXHnRbqF8xz1woP7nwJyZvE1unXyKx+LXcGhz+B0VDq1zbCtvHVbOQ+tJ6zFJDk1XQr3tGzdv/oVqnIEuh/Pnz+esoX3JhgCVwrIjHNab/oTCIbrFHpvKFa2/OrDZ2oG7jiiKdYs5t7ntFqk+wlpFFoyb17vtrtbGQOYDDdYy5j+4detWGn4HLRfUOEw7HOJh6vjx40tLj7osjMrwte4dPFkMh8P2qVxilvyVw2EtMW+6S6K78Q4O/dtjTxkfi1unT592Skxl66InnnhC9V3bBOY61jmeN3HtFxs+jFErXeEQtO6bs8I1hu8omPA6AzEQfDu0EbFcu5bhMBWjc5cyZjgcgYbDJC+Frf1jnY+3JX3LRLfz2b01HOLtsIxqtkGbKwzQiHDYS+zpovVOR4RDzMC+mmQ90Pr7Tco/cqamdnTm6HDI98VUu32GMx+PHalZ4+hnvErulGmHw14of1MKguDtx97DYfA2YMSGPyJrF9x94XCn9z9p+wB09VuXfmqwATNvyU656xrcO++ccDjDsZ501ZP23yPzGA7vou57W7Kj/h/feHzLIADTD4dTnqVTrm4m3EX3OI/hMAiCIM0iHAbvZCIcBkEwp0Q4DKZJhMMgCOaUCIfBNIlwGATBnBLhMJgmEQ6DIJhTIhwG0yTCYRAEc0qEw2CaRDgMgmBOiXAYTJMIh0EQzCkRDoNpEuEwCII5JcJhME0iHAZBMKdEOAymSYTDIAjmlAiHwTSJcBgEwZwS4TCYJvMYDns/8rV3h+7DxeNTfqKv/Aa6fopsJlS999d8M5+3+8ADD3jVGOziXlqLLCwslPOw1XKijB8O2bauRnbpJ8FDDz2kX0McQdnJk2aa/XDXMZtw6D4bjSQ+4d3vF3fxRd/ya+xWIybi2bNn9+/f79rjsNyDBw/qxF1dfVbyx0Vr2dzcxLcr8XFjpWyMtXASX9AdExsRu3db3tYMtBafObXQbhp8dVo/2ozvneLurP8t3mNruHLlRSvY46d3l5eXMb47XeF1vM/4jFlgncbuUnY3x0Zw+/b3rRb3XXJlRId0fUN70owfDm2K6ufRSbmaUv5CLPWDDGTrn1YnrTz//PMcOJvVtkyOHz/ubC5evGh691lgVNF82327ebagzBIfxe0F6xNr3tLSoya4acbn8ubLuvXVcmHWONgrdjuYb/hafZLvHreOy8yZTThUrF8wM2zT3PVbVxeIYVaFLXV8zN3iX8oBZmHhAzTD2Ng8uHr1KmSblBcuXLh27RptUHBz8yULCeVLXhc29eHQSpnQfNDclsc+LiTLsvZYC83gxRdfhL1NICwbTKDz58/ToRUxY1t78NlUtVfM570fqb+0vvDCI6rXDVTan/TT1fr1cHyJHnurBL99k3gQts4pN3HrK+sZDj26yJK0NMEmGwd6bW2t7MabN2+ansHebgQ2pi+N9wK8oW3rDSl39eXLl21iwMaUmDDWpEHzMMe704cMTLnysePGjZvsATg8cuSI9QOnqOW2zijWAtm6Zfz5v0fGDIeYlrhlyFitdke2zNGHtrfY3WETSMPbMfYfgkG/I9oJ5o0bvQ6i9TCnPfcWgOKmcfpy4HYNq97Y+I4b1kET9uwh1ek1uUdso2g+c789fyBY/4x4MpsVMw6HGHvdWA8cOLCdvWfgmf7dEzfWScqDhGjELCuS/7etwQI7evSoXS9ceC6NfJoG9jwOP7BkMxBOMB2xbAb5BRS5ZobN11ap5dp8YrBBk9AqCNrCvfPgfzlT/1+VyhuzNtjqwniV4fDRRx9lb1g41J7hEyLk8k19L7T+lsDePniwju7Y5V0wRsxOuUlm6fxYEWtzjhMvy7hMZM+iWzedMFfRch1r29pgYI9rotxuT7bfHhrFppxZ5luuZ5fB3/Sef/4i93fMTG0PX1msW+wZsct/74wdDi/jvpC0AAPBlOi9tL1etlqut+BuZ8wpWj4TuLBK7D0Sj19oSZL+tC0iSdyyp20IvXAsw9t3WdBg/yHObI80G8XWjet7JzeTuWLG4RBgOurLUF8w2OCqLzGHDt2vWalpAMYMTYKM3RyusFQYVsufRxT3CyemPoFze2ZPzdLCo6tVrb9NIWajW9CSpoV9TtyavPvd/9LjTs2fj6yR6EDbiLO+XrraGMxvC42p2UxtI0Dusfp3m/p1vN9mj5gtGEF0qS1LPvoAhkO059y5c5qbpOWpGWXdNEfUu1Nch7CdDIepqQ6bJsOhJfGjQhqeGF3hUH/WxnZsbhkOrRQ2r9ZboxkeCvsdxBGMGQ7RM1yVdgto4fXr301N4/F7HRdsVzhsvf177623SHQ19xCsAqDzn3Ao8RcZ6q0N8iBeV42NovdeRbfsz6hzPC7gRqCXB+4+24AZZbWj8+mc4X/emE04dA/CfGqwMOC2rb2D+U23VpfVjq0EGo09I/QQrKw28pj8BNdKDgNbd6cPR8RcsSKTDx8+DLOD8tdKbYn+njyJ7nrXB1vezq0lrLerAdxHFhrQM9r41r1mL3TdflX/SrbV27RZXFykgRbsahXHzoyPHDmCxcwB6gt2F5JaKXKhZ/zW2vdnIOss6mphORYIFeVMswDAVmkLzTkD5xQYMxwmmZa893Ju6EBrF1Hu6jd1pf1MZcrOy61AVzH3Fu1Pu3Jaqr5fzOehQ4e0Us3VWTGhkUWNfBZhAyZxs3thNuEwFRFxJky/DburcXeldss+r3hbsJc+HGS89m6jtQf42rcjWl1NgvHDoWMXLSyLlJo90rvD8dGqu5rRpd81vTucNDMLh3cXMx/XmTdgF4yzAt/hTK1bplZRv+w6HO4CdFFfHdWXn2CaRDgMgmBOmWY4DIIIh0EQzCkRDoNpEuEwCII5JcJhME0iHAZBMKdEOAymSYTDIAjmlAiHwTSJcNjCDP+rMFY9wzYEwThMYYpOORxO4Y5GMMPaZ1j1XDEX4RD/+AlDsrt/CNXFgQMHcLyI4/z58/wXoCuZ4fz639i2Ftw1Vl1rRY7BYMBTYPSfu6GgHnthDpeXl+/osBfOnTuHf8KMfwzOf4Bs3ch/ZczuQqvQMLPEOSYp/zPk8lyrfrkbV/U4s6IXcPLI6Lo436rMcGYNWjvaSY+MHw5t1pX/ptvaeeZMPnewreWts7H8wkwXbovg0a+pOHWFq6Y8xErPdTODfo/xxJ6DSt3t6z1aP5il1V52US+43phnZhMOtccX6mPUtw5Jymd1tpwvtWtwbhPPUwc4hYHnEkFwa2Bp6dHU65FFPAZszMWmC2OlOW9aw+Hp06cpTxSeAGmBrTnCuz4LFCOF86s28qniyOX5KaZZW1vLlnXjEUR77NKBnJs8BcYcuJ2Cbhx/H9QOZJPGadvGxncwTD5DGOdQkjuO4KVLl72q4I5OwJjhUE/YUW7f/n5q+raskYe6Edu4OXtHY93IM7ihYe22TFxd7iFSh0AtncO9s7i4COGSfMED8Kg/6Bmxeqwd5N7oc0ufKLMJh4pNSvbXwXy48HD+nrBhtmgHn3blcUQ5Bm9VhG9EpGY66vGV0LM4rjab9ezTEeDFCOskR/qt7wzgKEXcNdyWK1n3R57BiOJ4ojQDE/SbG3tn4Q/r/rn3I0NP2QvyVSCGw2r4xHM9ttvu5ejRo3hU7zoZsi9awyE6E01dW/uKtdZitntEZWNwF+7oZLsXHE6L3IsXL1K2Tc1mafkismvQEgQq/fQPxhrNxh3pAbxVhk4QgY4cOUKDmzfrs3AV2wEZ7TgnV/J3u3imq4bDrsDJFxpUhH5Ga3FSGhrDGYIxsqtVob98QBjNmOEQNaIN+/MZdc3ievnY9hnWtdxMy1qDcKizJcnD3B0xV9xb0vAShtIMDmbMp+08XP54RtQjQ9Etjz76qL3Jjdkz48A5bzubvRIcy0Bz5coVnVSkx9rJJBb+hJhxONT9HXOi375rVsLWGOuPG/wRz9YtX1wG+QMUumbS8A8aMMBT5x2BQ3035Usn/IjsZyEfsfEWCANsmrrw+v0hYuuLFm1Yyy3IYbyat8PtNusm4jYUM9bQPubnAsYEW23rxj2Qj4S0ftECpbB1YlwUvEvlybD1ITC9X/RDLwzkQ3Q6GawB165dt7F2LW+de1U+hhdZ2UmNs4FnWFLDuYSlsaO3Q1sXaHDaeqjd0q+vf91ZZhkfYxl6Crkj44dD6ytMy1T/nvHtlPsEHYKwpzXitcmCRLl8xg+HzX615XZl5dPMwo7Bn1XMJ/oZzyt4LNBH7dyMfdwQGjd7BeEfjXFu+ZRgS0OXT4+1Ew76/DPjcAiGl02f42He7IELZ/nrVyNsNiBK2VTYqD8GVg+YPcEtLy83i6feKTCJrSCdDPLHGRhK2VorW74y2sOylcXXAywk5A1ra2pyOkJ2z2jZfiscpq2FXRe0d0H+FGNvsXTSIw/+r0+7zzvZra1msFfiu0IpP95at+AtxJY3G4PP2aDrBvkrIpCtn0+cONFjIEkdb4eA3csvulnLy5cAbbliEyA/+2/tUHwPsH4Y/4fNO8JXKHSLObdnjmaS1A3ATLNnCOtq/BnMasfJ6VbWNCv59S7Jh0fMlRmU/QwNHkfM2HoAQ6N3ZJPKNAfzwdMcxNTx+545sVZxWz/WHO1tD3D85CxLWSOtIr6zDsb7oXvMcJhy12GwmuVWLx+rZaX5QwNkTktrOTYE6xBrCRcvJwb+CgCsf/hTp0b048cfhpPU9naYmtkCn/k3nrqsLXb+3oOWUD7W62ePGOzRCfxPDVAdBms1PxOwwZMIXYP8ENb6zDpvzEU4vBvR0e2SS1pzW5XzyeimjsgdkXVXUOWPJnrt3Y9u4nPI+OFw74y5ZY9jk3ayJyjjWwaTIMJhENwZ/azV2wl7RZjnLXia4TAIIhwGQTCnRDgMpkmEwyAI5pQIh8E0iXAYBMGcEuEwmCYRDoMgmFMiHAbTJMJhEARzSoTDYJpEOAyCYE6JcBhMkwiHQRDMKREOg2kym3DI4xLS8MEc6+vrOPylLzY3Ny9duoSTaHbKwsLC5cuX8Y9zccwg2N2xETiTgqc/dDnBmRpWdT4hbPvwCAUHYditWXfxfJyJwtP6mzNL6yZZI69evQr9+fPnrTE4Q840OL4LBQ2egXf9+nWcU9UXPIrl7sW65caNG13zoaTrH87f8Z8PoorRFfFQ3yRHThMMbp7GL4+obpzjZrruwjF+OOQUVXJrt04KRRKC3RrlU6eepAx7yHcExrDf3HyJBW/evDnI57CkvEa412GBpHxiTi5Xn/9yO4NVr63qBavaVhxPVsLApbQvyUCbTV7F9cmUg/pEya2V2wu2UeB7GvSJwwiTHBI7V8wmHCp5368HDP/SucfBSE3cNZ8PPvggNDjz2gaDJwpqvLRFdeHCBcgIzxCuZVDcpv7Zs8/A5o5Y1c25xtvDDydwmGfh1i2jFgPNRtQ5ePCQabRVCIdunu2d6j2/guPZ7n/pcdVzN7FFy3DIhxiAJmGN8Zgrs0G0tsZzb+WN7B3z2brz6rbCNusTWMq9BxsYl35wchVWr3nAHEh5jPp9YkMz2IBBs5PyHK/UHLKVtnbSl69duw49mqQCaL2jfBjhdrdAPnXqlI0dh5jPXrYinE/CWGhdx+N86dBG3BaRlbVpb1frOtuRYWP9hklrejPu8q+MGQ5x7D6GGG4X8heL0CQcx3rvvffqjKXsJkaSb92MRk+ww/wf5HPgNHeQSc1J2Tg6jkecwyA1bWBH9QVvTYceMOlOZev3kDabTnhgleq2BHsEHLOfp8nsw6Ft9xyDQRM8+gKbGsYgv6i85HJ1IemMwQbBc7n4UJOa7X7E0zFRhxZ9NfLpM6NdX3jhBVqCQfPhQxxMrI/qFy48R3nMp+xxsDs6/F9+j7JmWWMQVPTtUO9ODz5Gh6Nhtilzq82nSg6tyb1TbvoEkwpNtYXndj0eNYkmHT16VHNTM+LIbe53e6fAtBlnDtyRQT4dFxXxQT41DdDxRU+29qE9iOimnHJB17wbN27qNE5N1ZCxN+FOR98XG6DtwRaP4nzy0x6DktWNue2OGQ6t9oX8+QgkNzIpH3fOqZiGK4V85MgRK3swn9HavPu2dG8rMEafa88neYK01c2ZlvX1Z5Uu5W/RuJO18XKWej3j/lg+ePZSPnAVreXnBGy4MSIT/aIFnps5vVPzEJ8m8CrcCzMOh4P8kKjTlDOpF/B2gn7HN1Y01zZTmxMLGZhRxhOuTlaWGv/M+3K8uSlT0O9JtcJz+lPTXQzq/b6mGO/74m++64P31ZLsh2yqPWXjlbr5kFA9atg60c/oJe0f/kzKDuT7RC+MDofvf/9WpdbyxcVFzdVGHmuOVlewcw3ksxg6S3s8vxSTBHuTzkA0YCUfqF3al9gQYO3YlU6U69e/e/PmX6Rm+FK+I4aK1XxyfVmqhA1YzZ+NZZFTp57cnw8WZzi0aAQhDd9aTvYZDvGAqPeFilALfxgsw6EM7navjrkF6QMHYh7uF798gkEGq4DLVn8oQr1oLeZk1/juAqxcTq3UrNbmJQHRd+hDYD3Wnpru3Wj+7qPPdugZJueEGYdDgIGx3jlx4kS/fTSov92zhMmKwVhePmNz4sKFC/yzk20TWADH8ufa19e/zuIj3g4BW2tLjoONTSE1DmFz/vx5K0h7xhhrhrXQbXmnMnw71Mer1Oxcg/zYy49998WD/8tnnSZ/l+NZPDckmdwnTz7GRtrezR/38hPxs7mR+0xz9uwz6JlB/kQDvy/RC6PDYb5u/+nIgiJ3Ig6i5ZqTMhxacX48ZJC/BoDNbrXXL1qkpp18ebLGNL8vWQOe4fOcdR2+QmUNMBljYdPYkvj2AuezPbLkcRn6ISQ18ZXfcTxVf5Dk4ZX8RQs+V62tra3mT5fkDz48i4VT/lQAAV3XfOmlXmiYxkv5AxF5z90OP7YozJ6tss4cMXZkzHCY8octUR3a3Hyi8mVbd2xwGQ4hWCej5XlbeAn3q7/HcPKn/DwHA7txznOb1RhBWyyY8AY6POU+tyqghLctv7kz2f/owx7/awBuMtiFdFWmZpuyx3Gu3CSD2wsHmxNx4ZYvvnxjdr/ZzJy5CIeTpvzxp9RMmrLGUtOlnCL1n9n7Qu9l1ve1J2y3snDoHll6ZBeds4sirfAZbjSuur5qvyPjh8Nds6N7GdO4NKOmzGplTLM9Mp1a7iLeEeEQjDn2Y5q1MqtdY9Ls+kZ2XXCatDayVTkF+qq3Lz+zZQrhUHl7dNodeYfc5i54B4XDIAjuLqYcDoN3OBEOgyCYUyIcBtMkwmEQBHNKhMNgmkQ4DIJgTolwGEyTCIdBEMwpEQ6DaRLhMNgBu/5v0nZdMHgnE+FwosSqdMxROJyfsZmflgTBO5lewuG8Lefpt6essco4ZTCbcHhq+PBWnFmwsbFx4cKFMU9IGhPzvLa21vpFi/L8hStXrlgDeGyHy1X0HMIROCd69ENXq8CIfxzNc/GXl5ettaPb2Rc4pD8Nn1m6sLBgjaGeXbe5ubmRoYwTPW7fvm32/Z5DwaNY7l4G+dycctqPOcfGxPa+69evX7169YEHHvB5bezfv19PYtIvukyT8cPhZtsXLZIsOkxFKvWYvd19ZWVBjiBOckCS9huxJbPRHOcE9CCk1pbvncXFRVbqphlbawK2EbZwI3+Xhk72CA6E69HhRJlNOFTyJ0X08KQ+ZwY2X/jEZygsEtvY3K6/QLRVqZum169/NxepTxSD3gKPyc1xWbU+n3V0Z3D+E+b9Sj5oDXFOW7WRT7rCErKok4/OOm5mV668yCP/eYpSc8XxY1uHkMGmF+55uG7GwguPqNJunwdWNSc118eo6qjpVywefbQ+SwzoecR6lmNfYFW7xWZdah2Ip41bt27hrCwXhtczMM7du30vAKeIYfsY5JO00NV8HOkLrRrneDVHeV22BnCq4Ngzu1O7HYtq0DMGaJPyfH65jKZakc1Jc2hdZHXpHXHOK7Zd2pMiOnmQv5XB48cmzZjhENMSz0Y4BBh3tFKflFZPBloyDACb2OfOfc4M8IB++fJlu7Ux9+6l+vTHln3AmmGdj7OqV5uvhWDJcAnkgdsajqXmjEDrW1tHPc4uznkbPjeslkTuRI/wBuXimltmHA5tflT1QfJb/dX7jmkO8XiSmucUZqFSe62xxfDMM3WkTPnIQe71VT7QL8t1GIM99vrWZVBSTkEIFiOtIiTRALYwr5/vcAFjU7PqMGsH+YtlqN2EF154od+XrQ/97dNe1YDbxxHe6CJ7jmGunuN6Kp+oyQhqy5tfKbG76GuIsWe53U0ZNEcnp9yNrqPYYNsp3G8VwMpaP9tdwwkeoZjb4+Hpg3zedPlKgS9h4X36zJkznIHcLm1yMnbqHprnefsGZMNnN253hIKY2MhazUAuG0Oz3C39f5mki/HDoQUYnqJnt0/ZIhzNbKA5FTlzyrP3eLOjgQd0hfb/oUPYQGq9rXTMPVsyVhFestHPt/MRuDDDtfe+tXrzs9FWFTrNrDHQa//ATJO90DUb55CZhUNsZ1iWOBWXoahHsNNhPDY3X8KstXmMvcC2Bv2ghE1HrhbGKsoA74jlo3crbh7Qj7aqPA/aGsmDuU3Aefw4vhnPv9qq1q1811T3vfvgV+unWoXNzmdz1zeuGwHGEU1CZ7qPRcASL+Vpql+02NpiUjZzP4jxFRZ7nxvQqv5YEp456t954ESnwZgTYBy6NiA0wPpcz5JOsvPq0LeGQ/eWgzvVbqEy5e9RjJhLNFMnU2DMcIiW2yjjlu2Bkt8O5NsPVq4+x9hiN/tyz+FHiEZQ5e8WpdwV1pl4XoFmYeEDWb/9go5wSBmW6EOVm22ht77F6uMapH41f4pEtxGGyd5DV37b6e2OJs3MwqGCxbzR4LP3wFLzMyM/8kL/EGy09HczNiD/vPAyXykGzYd+zOGtW7d46jy9HWy++6xs5G/GckFyibJVSR7TYL++/nW7nsofZeUfxsxgcXERsikPH34Qy36QIzr0fbDPnD7wn057ddMzkO0ueKeD5ntvuAt0l1maDeyXmu8zpOZYfch98fDDD3tVAxpgEdq6FBprCbd13gJaTj2xaJT/2lT/KggZ34oztz2+Glb1j59bIMk/cWGO8X0CXYfpyrKcukmmKN4JoFR0pq3kZ1C8JrqZhq6wGchB1BbCuNX/JBgzHKYcAhFO8CcGPtri279peCpar+oChJCau2OS6IMCHzXyKm4JHuxnRIJTmYP5L3M6zfRjv+hPi0/99i0fATmCcM4q+JzHhvX+CeIk1c0/cxEOp497cJ5z7q7W3l1UGa8d7nPbavkNoLcNuMHyOWCuGD8cttI6sn1B5xOtZY/Mc9vmkHdoOAyCMYkNZYbsMRwGwY6IcBgEdyAi4qyIcBhMkwiHQRDMKREOg2kS4TAIgjklwmEwTSIcBkEwp0Q4DKZJhMMgCOaUCIfBNIlwGATBnBLhMJgmEQ5reBYX6Tp2hCdfTIj8T3FfgqwVDQaD48eP85//z4SJ3vik6Wp8l36ajPMv2LqyuvQlsBxt3zXtZ0W/4fDChQubm5tV/hf0Pm/PnDr15JUrL3rtbhk9TL3jqpty7fPDbMKhO50EyZs3b/Z+fgEcjj4MBadhpcZMrwqmyI72i+XlZRwa4qYXzssYHduGD8LYaow7M2Iis7bybnnuzLFjx/SLFuhb/DtutBCBXA/K4alyVXOolR7qvReqfIALz2SZBBPp3gJ03Yhucc0oZ+aYbGx8x8LA6MMERueiJXdsQHnuoKMa++CuMcMhzsgtTwtytfCUFpwHS3i4DE+hGhP1T5+Y5+gE63Asc+1YlMLymURgJrgdq/qJJ55wXcExwqGJTI45LmNiVbsPBPHYh34r6ovZhENlkIG80+l4R/S8PhzXhPl3+vRphJa8xV8e3sHrPd1WCI9SswltZlhslmt69yo5DrZ3mxM9sRNheJDPNkM7lxqy/CgO6MKZTydOnEh5CfGEQ2vVQw89NOj14yn3fayO0+/74m+q0mrkkYYaDnVCaweqrDY7epIYk9bdZCOfcsc4jX3HTS18zAvG9tpdLk6MCxezPfvDxu7ixRd7ewlIzV6MzrE225jyMElrAI/Rsju1Tc1ybQrxrrkFa/utOCYGNWAjHw3PkAaHprl48SIfQzGyZmN94mIGYfDYyB8DOXr0aFYOcA6iJaHHvF3J35SAPY+aw8pqHTvHmOGw6bG6YRh3VHr79vdpY9XZrECluorNkjPTFt2Ys9S6yO6X+4B5s9VqnQbNoUOH0BhrAJZ8GQ6BbT5WI/uw64C93QG3qZ7tL7r5gLpSboDTa3KP2F2jw+HWOo2PfXbXd3xsmj4zDoc2Vxbqz4bt8unsjmAYOMac6/ZWwecUXQD8oVKXlp5MyBhGTStliLJZbgGM/tfWvgKBzWgFMVg3oCQvZBsZMd8rD/zwqS3JN79+AD9z5gyqa8LhVqvsZrvCIdBXH92h9s6ILXUgnzVYL76z6GI2hlXBVq5OdNB7PNoR3cjnNo4pGmDwWPnGfmtnUWXKH7eDK5x7WU6MQf05lLosu8I0nH54z7abLT13vZ7i5xxUhAgHS/wYAEuWxa2x33RNjWD8cKin6G3kk2ZTUQuf6ppVXOfeuHHTdoCTJx+j2ZgRMU+bVc5t9KSFQ/wigl5aX/86VvpwOPT3jlxrduvA7RpOKl6JtRxx2r1SO7M9wudmuOXbeVUfkb/KzXB+mHE4BHxn6j0c6qu6XW1nOXDgALL4pSHO/jwR90HWOYTpC9mG0MYS72patvUbPYo65HLNmtq5exK/99574a15thoKh+rK7ZV7ZzsiNuAhzta5vUzYAFnD0AzcBX7UxQiWP5Zi+zN7FE9yL70wOhymPEDWYFuW+xuQy0aiG8sdEJ+yQi5+70Ig35+/izt6rHeEzi5c0eGIT9hk0QB0e+sZ0ymX5e5jU7RcShgvuGocbn1KDF2U7vRjKUAjKahDvCCyM2mZ8kjZO5NGYmaNYMxwiJHFDeJedOUSjpqFwJSbRA3sF/KPrsfydyWbQjV6Oj/faXAvcJXkufbcuc+lPHz8ZrLJZTjU0cQrGvQ9/v7P3j42/G07PsGkptKLFy8iS832juteDgeXLdfjnDAX4TAI5p8Rf96bJuXb214Y/ePEjui3YWDMcNgv/d5Iv97uasZ52JotcxEO53nGjNm2Mc3Gp3eHd2RCNcLthJyDLufUdxl04ezxXyQyuVNvU2MXDesxHE6CMcPh+De+6ykxDn357MvP7pht7bNlLsLhdJjCMO+6iomu0qkx542fw+aVTSo106HKeG1PtHpuVTrGDIddjFPFNJloJwd75x0UDoMguLvYYzgMgh0R4TAIgjklwmEwTSIcBkEwp0Q4DKZJhMMgCOaUCIfBNIlwGATBnBLhMJgmswmHd9d/YTXbprL22TZjR5RNLTXBaOatx2bSnrsrHKKLxuyoMc32wu6q2F2ptwezCYeOa9euQRiMd5Lh+Jw+fbr1nAWrcWNjY2FhwQXma5mUD1u5du26/S+1ndRQHmKyUwb5CC6nRKucMg2f3XDz5k2e9bCRjzBl1uTY3NzEYU48RhX6QT6nKuUWDvI3N1LTh+jGo0eP8l/s8Vyovqjazl6569jY+A5nmrL3OeY4fPjwrVu3vLYN61hbODoVz507J/nTY/xwaNOsa+vgWflcyHpKi05Xu44/o3DUbXmuijlpPcOPCyTllYvuRdWslEdl9YK5Nec4q1lvM8l5MSk3zOo1jbPpizk8m7SL2YRDm0MMQidPntRzqnDOU1/gCDGdtYcOHUoSYHB8F2QK1jY92daap6c02STDmYfjoIeocbnazLO75oyEnrloMw4Dg4ZgCaFtC/ms19Jm77zrgwf0zFJuixcuXGiO8D5U1R8l2D4BCzaIzTz/zGzOnn0mW273f/lssWvW19e7dkAbL04wdFG5bXFMu5xwKmIs4IdCX2g3wjn8WzjUWcfjmK0xDzzwgLsp1yRLlje1vv71NBQSPpya4824HbeuPlsyep6ItmrSjBkOT516MjUTj12BzrHu1RNKccUSwzFD5WiOGRHRD+xPt4offfTR1MycKn99JTUn/ym3bt22XLTfWoWDAPuCp83Z8tR1hyUJGR0yieUJ8pPHWAfyzQOzCYfKSj4oOeWRsKnT73PosfxNIowxHoKgH2SGTPNUtlk7yEc+DvKJw03B7WiNfX/McKjff8ADI1+VuOTgHJa2GeHYTz1sEAJAGxiq+55n+z74vY9ZIPyVX9061pXgpPW0fUf1IwUag/WGxQ8sSnErt+7SO+VZr71QdXy4rjkQuR4pbHzHMmojZ7WjS/0DbHN4ep3bnO64PWHG3DHHIe/XNU6PCQM9GsADeNHnC/mATbtBS+qbXOsGBBtGMsYD/rpwLJ9GyywHFw5eNcq1MyHGDIe2IuwGuXXwe0Y4JpfhMK9o3zN2vxZH9VF4p3fHIrKK62VermKY2fzEPpM19ehv5NNWkYTQC4uLi6l5+LbqLlx4LndFfSyzLVK8NLsjUnd67+PQ701NlBmHw0H+zgj6C09G/Z5rp5Es1Yv5ouZ2fXGQD4x43tTmYUMZMxxaveuZ1PywWYbDleabO2QlfxMHBV0LB/kUcjkiued5dv9Ljzfi1lHmxPYLNCwNh0PQ+kUL3pee9tnvemsNh2DQHGltXL582QWw4XPGv6vhBFjx06c/kZ3UNwsNBBd+9khXh2COredvcWAycCI1BqtU6g9creEQ5I27/kYHHTIcrueHGMjlCxPNBvW3rk6N+aPr3hk7HF6yFnK4GV3sjqw3sOp1K9CfCvD2xmQqPvIwDvbswrEAuooRp1sHBT15+PCDSLba7BrMebcHpnz7+SWh1k/0ixag35uaKDMOhwB/UrKtzZ49+x0PPHzh2RZbJ57gbKaWXwbYn78gigbYbGZj7Hr16lXsCPZWYR4YDtlac84tg+yvT9nfqsgsL9VfuvfhcCN/bo0vNJv5a920Lx8ONuqvwPBZss++Ah/626edxtqg3WWV4tXK9HzzXltbW22+2GKW/AuE5VqX4hdjyGUv7YXR4RCP7VyNehcMh9YkG+hbt/wfNa0UJwNaDrl15uwFe8zSvx1aLeg6BCfssIP8N1p0nf5dKo9F3RiMBba2HA5bJoa1nP0Ph/Cpd8QB1b+dW3swpii40faONSHGDIdJfg/E44K+46InTbMqP1qYzJdsWto9suv46ZuUu4VmNNBBMYc2i2xS4VFJFwtWsV31z3JsLYZbfULoBW4yGFZdlal5JnC7LrZi93ywR/q9qYkyF+Fw3uBsGD0tRucq41u+7ZmfrhjdEs3FVsiXp7uFrhtUfb9PJ70zfjgEXbc8gl0U2RHwP+laWhlzH5scs6p310Q4DIJgTtlpOAyCvRDhMAiCOSXCYTBNIhwGwR24637zedsQ4TCYJhEOgyCYUyIcBtMkwmEQBHNKhMNgmkQ4DIJgTolwGEyTCIdBEMwpEQ6DaRLhMAiCOSXCYTBNZhMOeUTk2bNnl5aWcGxBI/d54MUgfyLDqnP/ceDGxsa1a9d40gT+MfLx4w+fOnUKjbl+/boVvN2cqIujLlI+LHj8Qxas1NLSo7S36uiH6Bki1gO8fVOura2x2a2HZB46dGj8xuwaa7a1BOdZ4LhUnJVz/Phxdle+03ocrcHr6+vPPvvshQsXUj7bxQScSrO5+ZL1c49n9u/Pn9Hw2ruNQX2YZE3K/wkrR5zHpoAueXxu375tteAYz3HQWvSQF+h314adMn445KljijuvTlbx1rxNzTk75cK8IzaT6USPZyN6xMFCPlRdK8WpDrayqNdW9YLdfj516DtYKZxmSQYUu67NDbOxXJhtu9gbtlHwFCRojhw5AmEXHT4FZhMOHTjQnUe1+ew90JzaVx9fieBXDoMtGD2YGEUwv2mshxzudMrio0gQ4NCEQT59FHptElavC36DHBopM6JYwZ4/mXTfu+16+JWnVMnmPfDAA3iwQE9qP2DS4470OFB0I24Hfdga13dH1XGEN/YXVGeNx7GQrl4capxymwd5Q9Tc1Jxrha7Ggcuwp9AX6g3OobHtklkbci6ademg+VSQNQwt1/aj5WUjb9y4mZp+4GFsK/kcXRoP2rpCvaHg1D5qMWY4xOpYXj6TmlPyOTG6zhLiHWkka+23EdD46tWrlPWgR2sMH6lTM0xcyzCmnHa+t4xGT4J0nm06YYFgVoi+zwbgdLokbilYk7qOjJ4hsw+HG5nUzON+x8MmhD0cwSe3gJS3ZsuyK1YLH2G4F+RN52UeSAglKB9CR7CRT0fMQn3Q6PXr3035NTTJw6P6h3Nr6v78aRi74ps7jOup+fgcSu2oMXfkQ3/7Ga/KcGvG5LZZbqFII7F+0QJ79Kn8pYXUPOWkJkrRrBdawyHQnrGF58Ihn45HN0lzVe7aZHcBZp2bY0mO8OajGBrA/Qu3wKgPZZW/Adk1K4o9cfujm2fPPnPmzBkMmR7XCdxZbqM7rUfGDIfWS9Yb/LHnxo0b3Go5Ul2rGN2I43ZVMw76jGJd546ql76tG8OtAKWwit1E6hq43bG4uMgDUd00s4WDieTea/sdWfyMZJsGnwn0hNh+H+V7YZbhEEs3DX/FotwX9gJ+GsIY648bYGXl09h0bCPIZttzETObR9EPMsgaMWXdL0i4O2zZVvx2TT0t3MN1GQ75e4WFGSxODYeNJehszI6p0nvPHb3nYX9oOFesrRyEw2P5O2qD5ktDqVnwaKSGRmzWg/w+4aJjL4wOhwwkGg7RDG1kGt4NYcAPPMEJ7pc2rT+O7Q51q1y48FzKFfH3JYAnqkq+Z5SGpxDCoZuKqXl35x0Bbtnnzn2ODtUA0KzZ0Nvb3DtjhkO0ikNst8/fhDl7sQDZcrdwdndHGg5zsr1vV/OHNSBks+2q3XHwfS7npkPKIbNVYw1G1RrC0277oQuGQ9yXxn5rwIsvvsjknDDLcJjyg9ilS5d1jpZLcS/YNmf7Gn6+QxDChj68MOrvFaT83SL+0GFbg1nilc6hU5ZOltq+aGFO1te/rjMeDu16KX+SplH6cJjyhw4o62Ndjs3agD7XT8IXLYY3UntXGGSQtK7jVxSsuxDemu6qG3nr1q3cyNp+oz7d/6Xmx9WX7Vl1/EfvcRgdDtNWY7YHmjJ/0UXLy24c5I9FQA8ZdzrIu6oz3gvoq7J7+XaYbepvquCXW4ZD6NFCjMXa2ldSEw7hTcEsar5ZVn9pYSWjtesPfRxEGFDWH1cnzZjhMOWG3bz5F1Xz7S1Os673eHRRfsqpP12CTyzh7mCgG9Ha2lr5RYssc4V+B3sIHpvKvt2fv6nEVcypZcOhv1q1Dtyu4fMBqmBjcL333nrftxsfbkCfI8v3HNwXbx+bcNrJi/h0mHE4TMUbVflUO/+wzaWwR6oMBJ83r9xFTR2TQd4l+31Q2ynjLJNW5WjwuwjYRfFJM344DHbHpAd90v77Zfbh8O6C8Wk0anNH+zsaTAv/yd+3K3PT4Z2whSOaOiJrp4zpakyzHtl1ONxLU3dddtcF097K3l3kHXRObzbCYRAEc8quw2EQ7IIIh0EQzCkRDoNpEuEwCII5JcJhME0iHAZBMKdEOAymSYTDIAjmlAiHwTSJcDgXjPNfEs4nd12DW5nVXYyud3TuLujd4aS5q8PhXdfbdzW99HaEw5qjR496VdAHvczRdybRdeluCId7eZDdRZFJM4dNmibTCIfo4ioDzaXmExOrq6sPP/zwIB/3tZSB3PjYKlV6UGWrGTBvx44dwyEIanD16tVL+VzQlE9G0ILw39qMlBtMPZStIHdjY8PuDkdIV/nka9MwF05u3Lhx8uRJlBrk8yx4/uHy8jJK5XNG6vbo+TXg/Pnzafj2ATUuS5OSOaTkFYI14OzZszh0AwNnGruePn06n3x4o8qtXVxcRCOff/55HMlR5Ts6d+4cjl3d3Ny0IjwJTKvQ2rtkNYZgzq1SHqJGA1zRV84JZfXGXFU6gxK11KsmCfQlVb4Ldhf1+/btw0zrcjVaQ73KVtGTTz65ks9C6rKh7DQ4PYRK1qhCU2gb5jKpei2ollrkP5ZOq3FpwOKr+VjdVgMWxxE/JtiqQZbNZOsQzGrjzJkza2tr1vmlExVwtRqtII7QsysWgoETfQ3zzAWiq5jtSfnUJKsUo697i9YOpRZUpZNVeSx/0QLH3mKaYUup8oBCsPWIHfi+++5bWfn0oDmoWV1pslRqq0pLHHnDXC0FZaueuc5MZRprriqdQYmzTJMOh65iXB2m/JM/+ZOUzxS15J/8yXbAoACHUqiyKetsHDBYzNvlX/5lffKQ1WKTEucGfe1rX0OllmvbN/Z3U1rS9Cb/5V/+peXiCs2f/dmf2dWm7/58/HdVdD0F1x5zAuH973+/3R3cWvLP//zPnaXlIgt6HMqFLOhti7eqTba7s1blW6tbCDNeS5irZkgq77vwW3Z976ceVKWtHFvVkK2LqiYcouoqu6KBk3nv1fDIasOA24O6WqulIHD3Ya71zOHDh1GdyehGu6KKKj942S18+ctf1gZUzYhgYqDluJrGann66adpyWY4D6pJOarRTC1ViaclaKyWQ4cO4Y7+/M837XrixInUTF0sEGuktd/mksn2mILWXrt2jQ7NzJqNMSKpmcyoCF83sx4wYxtfu9pcMj3mP2xwrfKuivhRNR1ibUAS0C3u1xV3SUJLyMOZWxoLh5CdMWR279e+Vj9Bom04mQwt5CCmfPucjSbYnfKTMgcOHIC+kglDjQI9rtgErA+rHF/p3DxYdORsse2FZWGD0IiCOihole0z0Djgga6odKgSLazysmXzAGYRslSPrZJJVxEEXjWrkiWsZsb3vrc9w9VAbYjmUtOqp7LUI6tLYBIaNZh4OGRS26EdZ/zxH/+xXb/1rW+Z8pvf/KZaasES5tIVZejNm80wjIcJf/RHdWBjwSeeeMKuv//7vw+l8Rc19QS1/7PkU089BSUdmrHJ3/ve9+hEaVqx3QDjT//0Ty1pV5P/+I/rrwb+0R/9kd0yqqjq6VJ7Y3FOXNQOAQ6toF0/+9nPpqYNaA+hn9YrcxkYhkjpQz/6LKRGsY0+K2CrtQbAlV1t16Yb7OCgyq1F+2GGUVbnmqQTKp3szFJzSjsN+Ls3uto2HfbzH/7hH6KdKfeeWdIJsBvEBKjy3HBm9MNSpazKVkoDuEUDqDQZI2tttgZgwqDDMQeqPPSmRNKuLG72uAX4gYBhsh3wS1/6koVbOuTUso7iQtBQioZ96lOfgpnZm3POf0J76FV2uQR65qoryvix1JmVxb/61a9Zk9DslIceNtZ7EKpmlemqQeCpmj3HugiLlNOVZSu5EQqIu9afuUj9eocIx9WBglCacy5n245sHVn/0wwO0Sq0gXXhykqByqqhPuWFaS20Sq26SmYvbLArVtJF0EOJZFmpq9fZUHal3GzUIky2FhwhqxN6UI2zUX1rEvL/+dsPTzYcsrJUtNWuL730Usp/uqOMR2O10YKlE6D7O22qvBdXjWe7Yu6y1IkT9a+Uv//7W79KwQzKl16qt55vf7uO09Bj38Hs+cIXvoBayl/qAJIoaMZVfvA3vv3tb0OT8p1yBaLsRz/6UTQDTrAHpeY04aoJh+Ykm9UL6Ytf/CLrhTG9IUmlapBUmLXw9YdVWTVPA8ZXv/pVLGncEe4ObxW4C+hxFwA7i1kiSrEUnFOgPZJ86m99u6KM0bRWqYfUdBf6Cs2D3izRt9/4xjey7leg5xW5uOLJCZsInKDltFc5e/ONdEpqqMfdaYdoEXSmbfSpWRS4YvSrHPZYyu4IZimvJswNAhs4xNMehsPuy+YYbCxSwiHfttEMyNzKYU//sIGZXl1SlZRVUypxxY+lOg2cAZKYch//+MehtOCESYuh5HTlFXMGej5eoKxd7a0RMmthRZUsee5adv3ud79bNc+pKP5STb2H2Ht8yrfAqQhjOOHiSjmypqbNyGUWkqpBUhHbrVyMMsKzurXbt/agtWikLk+alUDPKrQuJcmQVc1eqsaUVQOBcpmlNoral36c4GTnc+LhELJWCaC06+c//3kOhskf/vCHaU+b8upsSqC3tW0+UxNxU37OrfLK4UbwO7/zO7Q343vvvRcGJmMGo5EwNj+UjU9+8pMQrNRCc+Y9c6vskE4MrFjoYWnNMCfQmwd1bl1R5aUOG5Mff/xxS2qrdE/kldAVczWpZsy97xP10f5qVuVGWtUwttcmbQAaCRnCJzN8n7BNB2sjd93Wu6zzr7IzIKqHwMFlQeRaF308Yxp01wMPPAB72nzmM5/h7qllzSG62kqZvLlZ/2JpT9moCDfCGl1xKl2W6rUg5E81QGmbFBqGaWntTznOccJosy3XzOCK/W+zCLfAKijTBg5Ru42L9QbMPve5z2FG2RWDaPInPvEJttBqtBaytVqLSwLNwjNraab2BEqEQyRHF7RuwbTkksSgs99UPnp0Ebdvt6n9b7eGeV6J89R8Gwuwr6wIJj9sbG6LvLWKsUJTnofsT5T9VF4gdrVHDchYIPBA6JNXapyZ5gK+WqDqTzXbCJuBHrNGcmmgJShFz4Byl15lCjboHBEt2FVqX6asqyyoHpweM83pVaZblzXxH0sdzGWyNZeUuSOS7qo22sXUl2YuSTOuZAeLIJdXVabhZyXqNVkqWw0AN2UkWa8qqXewJc5yu3i+7msyt5Qd3qq22ikjWTX7ILO0FPRlbplFvaIFXdIJttfwP64pLZ2TlP/Dn8uXv/HJT269FWmpktFZWsVw5lBLWpNOcJZOXyadrFcItlVR6XK76PKmuUqZ5TROxhUTlf8pDW2aokNFmCyzIDhZgb0L1eqtNIa9JqvhUupNcxV1SP9U6lWFSpa/KqvhW3b6qq3BhKXUAMnWIprlDFRfZjmDMuwxq9W+8TSE6unElaKNGiu0n2w4TG23RANq2CYnQNZSTqmUDstJCVxxJp0SgptG5bIh8MOsVm8KlVqwkuBBG+fN6ZnrbNRANRC6OgfKVn013GaXJKpnLqpr7b1yoXY5wVVroU2pTMMPiaiFGhbskl1xhf55dXp1wlyiuajFuXIGQLOchvsjNGpJwRUpZVecaHE1pr0WVGWXXCqdRq/8T2nUstSU/hXXP+X6okyYbLVkkkqX1Cnd6o1Az9zSRnOpqXIVPS5h1sKCNGOuLmHq1YD6rinNK+21oCp5a6xOb1avLKtyaaA4AzWbRjh0QKlZLKLJ0kbl0clWeXxladBVXSl04UopVPKqglOySGngrk5QXFkmS0soS1e64Gnm5FZvRG26LKnXqjXL6TWpnstrVSzaJHEFqDFkJp1ehe3yjb2TRxTULE2qvhRafVLGtWs3cQ7VG2QmFVcWsivrhBFyaxIa/qc0zsbZQzPaQFFjCrrRl6CIq8IpIfCqxoT6VoNWD6WZU5ayK6KumDViCau9Jp1leS0pfbqsUknL0deqewnTjwqUqYdSmWw4rDpqhQEEJhVmOcHJzkaVpaCWlMsk98TSrEvfmqzaRkstnXGpLA1aZZfU9qtQGqtAS9WXcmnTZaxJp1cNBHgGpVmpB7hTbvTqgfZuzXfJCj3Qmyahod7ZtwpqWWo0iwXLrFahNHazV+2ppEZtSplJpwSueFPDNqUNzSC7JIuQKodDVTpL54HJ1iWsBqp3WZpbdc+f0pgaKPWqNmqsWYp7dildqR9VtvpUvZOdQNllaSnSalNaaq5TVsPdKw6G2tA1BE5W6IHeWpO0p2Ya4ZCU1asScmnvBL0SnUAul/Z3zHV6arr0jtK4TDqNczU6CY0KuOLeqdesVDwuuVwWLJ+qgJZySicwi/rWLIcqtQjlSgYXlPEP0Fg11DtZlV02XfYUFFWWxsxSDZSaq/LoPREaJonaa64m0/CPxqWxY0Suy4JMJbOc0OqtNYvhENfSoctVvQZFZ+8sndIVcclSHifpvGn/axIagmTrEqYx5RFL2Fk6vTOAhrisrcKCKrUIZdqUSiZVr7kQVLltITgbJrvsQWk5jXCoLQC0cWFMs1TPJIqovZqN1qhPNWCW4pTOgMk0vDtD6eY6BU2SVk2ZLL05nLK1SFdSlUR3E4VKZrEHdFWrQaumtXbn+Y4eupKQWzWt9ki2Cri6DYuy4hyqnteqeCKmWSvwSc+lrJaqLG0ga7JV3zV7HVCmtvmvDktlGm8JQ4lwyCTM9OqyHK1Kh7aH9mUnlElUOkKjSb124XJdkVYPo5Ncwl1mpfMxl7BeK9kByqxWD5pbJl0WlS7ZWrxVQPPGWcITDIfvfve7k9QKpQpO76Axr9Q7P251OW/OD2Euk11TgYKiTlR5R7lMVsXyc1WjLgBjN9EpEE2qpWapTddcKWXnqkt2Giop66jR3lk657ptqTe1gaDXUqmCJkufUGoptWkt5WygcYJTOoNyc1FajZl0uaWTUkNKZW7aUFkWb9UrOli8AtgTGLsZCPQ/peGVqDFkdVJOMIdz4oQRcivOQ5kk1KtGs7QgZTUoharYvojzg6t6KGUnaFItyx7m1em5X7UuYRVgo3pn1lqqzHW4KlSvycmGw9YqKdOyNGu1p1yWor4qdhMm1VLLapJX5qoB9RRo4K7UOyWTbvHrdlA6UVkNeB0zCUGz3ISmTIMResowUHuX1aWkfaseGk0qrW7LrBFJACWh0tlrltMrLFs6KR26pHPuzJwSMpKlZQktdXWoXmz9XVAuS6meWx5s3Awvr7R0ciVlEQ7VjMa8sqwqXREaqL7VoFWvSibdDabhfVxRJYtAw6tL0tgly6xeljAE1TOLV02q4HIpl2YOdajXMqlKTQIdCOidQGCvScmsmUY4BElaCZB86KGHoHxfBocxahFc3WKDnkmn1yv8q40qCbw9/PDDjdmv/MZv/Ab0zKWH3/u936MSGgf1rrjdHQePB2uhIrUH1hsUvv3tby8uLnbVyFp8RmZEbquy5P7770dj2CS2nB5wTnfK9wig/9CHPgSbe++9190pgNx1heCg0sarVAI9oMstGEB7LVhu4iqUcmnTqiTQcAtLubsw85kLD5xj7tolUCauVCVjAT0NyuIf//jHefyNtdaalzqeLLVg6cfZOIPS3un1vyyF3gnkgx/8IEvxCoEz4Tea6cqpmPK2c/DgQZwdU24LsKGgsvUGSkEDh1VeI7ZeXEuqfGQxZMAFQr16a0VztSUui8n9+/ezFmytrAJtQBbvGvOQa5zQuKzFZakBc623Vc9cp1Ely+oThpohyavmlgYqONQgTfQ/pXHhUFldXcV9vvhifULSJz7xCWZ9+tOfrorbYFKVTlZLKp955hmTX3zxRS2yuLiY8nbj3MIMJ3ihGaZRA4LcVuCzfHJM+ZCwP/iDP6ASB7bZDlXl9Uk9r7aMU54Q2gy2+fHHHz9w4IDegpalhknVd2mM5h/g1weYVdnGBguWJ06cWF19NjUrGd1l2xBaaFc0+Pjx4yyLnQhHiGFL5b10PdON0LAIBJw+zDMvAEql3NuQ92VSRm0oa1YJDeDEZ3dASwhahZsbXR1ic0yrQwMoq0NqKFOvSUxszDrN0qujVcnOdAVV0IKt/ksDCpql/ylNK8jCIuLW4ey/+tV6nqCfOWlZlwaMKj8HlG0rG4Za4C1JHOUDB5uE5YNaoEx5LXDcKaBqt1nBP2XquzQ61X/t134NNrZG3B5iqwMy9Dzq6OrVq3BCy60yTUvoXM0gqDFIeTvVql2REcCbu2pS0VYhKZlDmjJLmXg4TMPtKJOGBgl+schdwWi9ZgGbfzbzrl6tn3OtFj77JKnUdnlMDhS8cmVrOtJGr5guZ86cQVmdB672lAODPaB97GMfg8aqVidXrlyhJUohFyf5Wi4PUzV7zPL7M5aEgQnlmVLEaTTJGp38ns/8mskHHnuAypS/CsIIh1Oe0Ye4C2AGqQkYMEZx3CNk3J1Wx6QqNZcGTlPJctJnaghf+tKXTPkHf1BHYpOti6r89IDclFtozx88do7FcUdf//rXKeNqTuyW9aENsCyvmqTGJVWf8gZEWW0uX/5Gyod7pWYe4kasSxcXFzEE1iROThY0M/PpnvGTVFTlUyur/B0GM37wwQdtiuKBzKZrOUzmiqe+4TtfHHqY0VKTKpRZsFc90SL6n9KonknIWDLoMQt199xzDyYermjtuXPn6KeSB1CGwyo7RE8ymYZ/i2ONqZlF1KtgXQpL20zQBgwHh8kEDge61wSM75NPPkk/dKvOy2SpB0eOHEHSBppxDsY2AbBO9QMGqZkkTGqWXluzWgtWeRScpkw6DSktXZI4Pa+qdBoomZUm/XYIQetGklcIeGgyvvKVr6g9bYhmMdcpFXzh7IUX6jG2aWf+qYfgZoNx9uxZuv3Wt76Vi79g+wV2z2PHjtmU0k+CUVA/EKxe2nzhC18wJ+vr9Vb7vvyeZG6Ra8E1yZl2rNFaa1ck4RN6KqvhXV6vEJRWDS2xTha+8QhzaEPL06dPowOt/WbPVqVm10YSh22S1DQVUKY95PI6+vmRZZ977jktiC2gauaSXbnfWdVQptxgjA4KoqxtUva0gRbiVGiTubVhFqFIF6WBPq0TJBu3W9NADar8tTwra/MT4QpUskbMQJUoZVlmrx0OJa+W9d73vvexxx5Tn8bTTz+Nr+5Vzd6N5gFOM1sRlot1QRuUKjXUU+mymNuV5T7wVE4JlLLG4/d8mLGLTG/CxYt1gMc8ASho/WCCXaEBFk3pthV6eCGDHQYa63na2GLJNlexTPh0gglm3W5ZdjvW1GxjU/FXbFCqZkeiT6VVQ8qwbWvBlNjrdLVaY9B4S168eJGlYKbJVhhTUQuU1NCMsvl0A+eM6UeLu6xSzyuEVjOFRZylaiZ4hHf5Y2kq7hm/d62traEIv04JoHQavbpcp0z1R6PqRzPzj6uFHJuO9kz3vgwsH3nkETTgm9/8ZlV/7aWeEPiCGpqH5dTk1le+HZoBnJg3vkJVTTPMs+mxMGCGllgV1gZzlfKHk97X/MUULYRNlY/WRUGzxHyy9WbBxha2uKqdwB5oD4yAc7pq2rYvf9fpgZeH/lpj2Cp9MGOPAtZsixPfyh9psvuy1j777LNV0y3Q212/P/89DHoT0L2f/exnrTi6FFW0XlPzlgm2GpFRy6q599/+7d92BtYkG2VUajPKknjUsFvABLOWW6sYtulWhxj3AhkeTp/efjt0DXPgFiCUlm5rQBehu8zYehsyHrkwBzDWtnOlenOvryj7mc88bb1d5TGyvoWZbYLoGd4XKzIbFMco2NUK2rBiI4Yx+s3agEGvmn7DY4Hlvi+HQ3rWGyxlNqPUt+Y6Jd8OqXFFKNto4qYwH9AVCNsYRO1DTEUU5D4AjYYH6FOObThji95YEG6xCqrsxPrT+spy+d0bdJpBs6qZYPgyOean1WJ7iF1TW+Av0SXsgJ7h+dFHH9Vphm7BgyO7BZZoFT0Q3DuU5ZWzXTUswh5jrlJqFPXplKXQasZray4F3MJU3w5Rt9MQFmRSsygrXXpCg66pA6VWXZqlZnZ2OSGjc4HaaO3bFjJCpXGJa3ZrWWa1KjWLBcurK0K4dFvXMD2zVNkGp0QRFtRcKl2WU2oWeeqpOsCospR5xd//sZJRynlTutyqzzI5Dl310lWZCw33I1WW9rZRahLQxs0i7nplpQBZyHVmI4p4VUNqjvBG0t0RoYa5zqZ1HTkbKlXfOp+r4bKt3gg9OLPRTYKw6yVc6lUJXF2taJZzdceK0JjSA7NUowatpcqyaqC5rVfOHFUqzJ1sOERTWCWEUqMCZeKUzsA5gbEqnb2j9NxatgwSZKtwU0ST5WKgoEmieuIKUuAVAreqxpm3gaxJKnl1OKVWV2aVDWDStQFXFQjNiOrdKJQ4JyrbSwN+HNuqSfxoKQr2HM3v4Lgs1TilulVNV5Ia1wAXeMqKHGPmOj+peUVwWSO8lVOaSWrK4lCqMa+loMb4L0tpoMatGnrA1ZVVGwouSZB0MZhFHJpVmrGsQqUuHM1SpWo0qcqyoArl8nQ2ZZHWXNVoFpKlsUuWS7jLuHRF/ypDcFlahHKZdJo06XCYOm5Gla1JJ9Cn2qtGs0ozd63atpvyqk7KEE6cpZLG+9GDxemqFNSMsjNTg1Zow0XOIhDSvqHGNOVqOI9BWVfpTWnNKs1KpRZstVdcLSPWnhNoT6XWhaRqqHcaQof074xbfapSBWejW5ubYFqqHDLnipR6asraNek0rkbA9uBaNqnMon6c/7JUcyHz2lqwVGqpUk85jbGctVIVymhUomW7oA0ELQJBh4ACcRPSGThvZa4TnNwFXangjRrKWlCqVQ9Bk+Ms4VLP5GTDYdW2JXUtYCYl0ytVUFSpZtRr0inFjTdzWeWVNqppRXOdXGaVV1o6e+op86oaTbpcV1aVEEoDympZrkPN1YKlUtFcGjOrqzizylynoY1TMksNSjPN6pKVUt/lH3qXWyqdAZXltdUMSrcq9aobtzMmbnN3dTljp3SWRDU04z/D11JES+FamkHJrPKqSWo0l8mu3NFZqoGlGlDfKrdqnAf1WfrRXDXQIhRGLGHF2aigqAe1ZFKVrZYQ1MBpIGiuS4LyvojzOfH/lKZcS6gYqIFeoZcSQ5QOiWY5M9ZImTVScPZdyVKmkxLn33VIWQs1+qSjBk52HrhV7ctoVgnLjhBakw4dRAAZWWpZ+ldjrYV+VKNX9V8aK8wq/UPTZUC5Cy1Ib5qreu0KWroi4+DKovNZS3ktk1S6Ui4XQtcS5nVyS7g8s1RzmaSyNVc1miStxd1gaUVdU5pJalp7QO3VLRlnCZdtHiG0Jh2tg9hapL69tlwqtQGtNpS7kmUPM6uriAqlchzSRH8sfde73oU6WNk4o+uUrXoFBtu1thWhpjUXaNlWM9U4We15g6M9lEonOLetZYmzVGPIZa4rUi6GsiBsnBlynVwmRwCfRDU0UOOyCJXuqkVUHiqZcVmtxqpRAxWI+ilhb3fBSp0ZleV+oUkqVc+ykFVDPeBAQ8msNHIJt6KetQpNquAY8V+WUkNYCnLZRWUR4Bz2soQVasoiqqGy1bjMdUV0CRNnryNLZVkFfWpyNKVbyg5nQJilZiW0dLgsNValXiFgSkMzwbdDhMMS5Hpt2804WvVQlju1M6DsbFp9Vh163QtKt3TuoL7cRzgSWhAyHWopZ8YkbDSXyVJJPScB9cxVe01CU3YCfeJa+lE0S9uArPJ+eXUd2FqFU7rGUGC9mktcG0rLskgrLEiNG+7SAMlUPKDckVbjrrpKM6dEQWdGurLop9WgVQk9BXqApvzbYemk1WfVoceKg6wGXEFUtlbqZiA0bg5XRT+MmNKtBV2yVBKtWvVUQk+ZGiqdoMmyINEsd/uulLpNTVeUtY+gq2G6QEo/bqRKy7JINdG/HZbhkFlOqbmqcTKSpJzWriCSFNSGGvSpormtRahUjcttxdmXyS6NZjm9Kp1cXmngZBRJ8vCoWTQucblMtupbHbYWUSVLUQbYhpyNuwLKaqlKtWGuakplac+kUmYhWeqh1Nmoepbati7QXDerxaqGGpdVJlvLlnokNUttnECzNLyEmasa/fwv9LShxm2LKncVodJpRuA8oOxoh2qjWdTwqnoIpU2rpeYCFyCZRXuHyxpdhLml0ulV6WAulzA1uKrGMeypvRlMtmqoVIHyxMMhb5h1lxoIblo7g66s1uLMbbVUV2rjzJCUTJ9L5Qi5tQhAFvHZmS59F7SH4PxTKC0pl5bAjRqh/Wi9OiyNSVftQJWlQ2ggl3OsNUJQVg1LKc7AmbmkbknltCSqaZW7+hyg8QQaXmnj7JmkklenJCP2rJI0/FBFpcqtSRZU+/JvhyoT2jC3VUYSmrwV++fpVrn0T2gwjk1VDGjr+DqfKrTqu2QVkDUamrUON5SUR/h0tauyFMokgZ65qe1hfbRAXBFVUkZySj+WQgPZ7or/BuM973nPl7/8ZRy9YXz2s59dXFx0RUZMGhUUll1ZWfnSl75ktaiyyqdQslJrwO/+7u8idyUD4y1fDTCAjctqHSdgzq0uKmlz/vx5tIrnvUFP+eDBg7+aQZLT8fHHH9fbMf+QYUY9k1XH9C01gBXBgLXYXVS5tVUeNac/duyYCTgI2IQvZ2APocrntpvMoXcNQFLHWttAJbPM0qpD7WWuXT/3uc85jXOO674MZNZIG5dUweWqQWtFvLr5jL76yEc+0loXk4Sdr3otUgqQrUNSPpCdWSir02NpaQkyFimLA8vi4KKgy4WA+QkNvdEMmA2VLFji3g7VoStlDcMNqlL5xCc+gWYbdpucllUzVeic7W+FVeg8v3DhAgQ4sSRsvpwXyOLiYsr7Bg7pxqaEbcFaRQMr1TqfK2nbCA3BlLZc2z3QgKppCXrAkpYFD9yB77vvPrTKtQH2rWuEAnMhU28+ceid9jbgCcA0VqDUiui81cY1T6cWy9JYy1IDJvt2mJqWle1LuR3YBWwzteszzzxDG161iJPVpguchvrFL35xYWEBGqvR5JQrRRavboSWl5d5CjlPj7vnnnvKKavt6WqS6Z988knsZdYGWxi4d1sbOLS3ynMUZyVbs603zMCCYpVP9cXh9Kax2u0K+y9mtiooekOT2jCnF82WzX1PHFYDjotFYvQD7sKqpltrYWrOS0PHQn/y5El4sIUBDbxpG5DUVUS3XTKuqAgxmAbmx5phXYSPmViXWjLlPocBZoLdC4o7eICyDb0NDUqZE9ygNlJXJmBWa9LdIK9f/GK9U/CoOZ1pJsMGDTDht37rt6zbOQFUUJ9mbB3OJK7WIdiC1aHtViZbH+J2+KRlevOJNrs7xbjDjN1lvYqTC23qWnSxsubKrtbJCLEpDwHnP+8CrrpwH3iqxF4Fq6JqFjvd4l6sD1kpkrTk2uGMxbNmVzh0VaPPU+4fHOHG3mMX8XFW70KfgPEFDO1S3V60RqBJZ1MmUXvKC1A3iqoZxNRUjVPiUkftTKqmzOUMh2XKHYIpR7e8UxNw/rM6qcSthgzVjxA0iQZUw6HauXJRqZpCOHQVo27Kpj937hw+7fbcc8/Z5NBj/dQblYA3yVw1o2yr+gtf+AIO+bQrTrW3LBM+85nP0JvJpjQD225gjA8f4thfu1p1PAIYBml4m2CNkHG16WjxgLVX+esZsOFJwWjSU089VeU3Qlia3jTwj5B89OhR2PPEamjYGLilMBq20GkWvmlbxpAH6K0Wqw6tqppNEy3BGkBjwHMZdKDdLw+JtjtFcZAyEFRDJWU1drgT2CFg+0PcRVSocjdizzL5Y/kMdHUIGV9PRJdiXCDDoetqt5Jd81pbC1xBc2v+dZLgig7/zd/8zdS8ETK3dI6WY1uHmfW8u0e7Iz7eoVvMknu6zfyq6S6U0iuAzHG3zse1qru0fijBowZHGZb4PQB9jvN7kUWfgDL1VdupNK3guYGfbbK68I0LNADtsabaPcIbqXK3uKCF3mYSAmViO5X55/TW6UHZqka32zjagLI9Bs88On/+PPoN06CsaARlC5PsS3Zf5tPmBjwDWFrgtzagMfRWtY0L3BJNMtfFFShTnmYpb4Osl08enPMKCkKgH+rdtdWmtO9KVsVKTBP9d4fuH1porRSwmSI24BeGD3/4w8xVS1dQr64K+EQWPk8BzzY2lmQRfi+USpvfqfnnklaE51Pzpw/Ya1L1BErH008/rUnWbqvCGozqkAU9pim8WcvZLWYJg89//vO2FMvGlMC+lJFU4X1nj+67Z+ikWZHrE/effvpcajZTdBfMsNFo5EZZCLBE0j3uqFkpOFRPuexY5EKPJy1orGqO9YMPPsiuq5o5Y11qqxStxR2ZDUdK7RXkUua1KwmBWRjQhx56CNPAeg9jbbL1p+mxp7AIJ4DzaZZooe2/RzOsAtjd4dbQRdlV/dQCGwQqPOigN8oqABpQ5bBnTWVFNpMpoBQtUQqtUifIhaC1YJ9K+T+lKfXIYlm7njp16j3veR9fzuxOEYMZcmCPOJeaiWpJfNnDiuMQc+TyEUpBRQoe+KDHlUdmYyCYZbMO0wktZKt4O1gUsB8xzShoY1iLKsH9999vV3sfqKRJKd/ghYxpsCIIW0K30EOjSSdokpa4X2sA6tKd4dmMlgK6e1MJUhPptSVIVh2TVpOlQwW5k307dPWVs9kGxh6O8Nu9zdHV1VV+zZU2hEnNKgU1OHPmjPm8r6HKf55M+S8oqNQEawD+oFLlJzUzgBltrCCcwIafw4Uf1GVbjG0NZRvgPOUpaDLvjpvsysoKa7dKzQZxEZ9Ag96U+KBglWuHc2ZBAPDpZBXUGCB3i33V/VfqDxs5tIswRnBlMv4Ea/duMs6D1i594oknTMDus5rBG3DVNGZEkzQpmdtYM/B1TGeAijCOaC32hUoe/GHDNoBHHnnkfCblL0DxLmwa0FhhQSaH871G7XnFCGJ8MdPwRogWoksxMVDWOtBkfOURrcVZrPgiVdVMV/3TKUCHwI89K+COLIjylqtm7GxyUq8eYAOlyTbo55s3G6wXtNAmsOnRmSgCtFWwhwwblKUxZPe9Q2wgbuOrsrF5wx+2Uam1ymadxSdLog9tRz7fDCgGFwWTPBmfz8sfmzg/YVHlb00gvsIGlZorewdFEoMFg9T8gRaNgQwlNh9d2hhZG/HSCUrRkhoklS5jPvc888wzaAkawyZVzWzB3KhkcHl1qLKsV7OMAwcOIAm33P1YHab9CA+qcS9z1NADi6jAqwokDf/IN/FwmIabwitgOzTpctWMGmcMgVeyL8Oky1U/1LTqgdalBq3GVXEjqoRAjeZSdsoyq1WjxlqFq66sNA3/bazVeaselHWV9shSS2Y5aMbh49SHXDpRz5rklb+stpqp3gT8lq4b+giBydIzNCo7y1KgrFdlhKYs0ppFpX63GSC31UOZRFkqmaVKFYhzosU1y/2XpZrLpHNeOnGUHoayh4F/1uKKqEB5BKWN02ikL+tSWbOcpstDq6bUtw4ooXMmJXMIZ1nqSz+l89Zklx5yq4bK1pnJ5GR/LE1t3UFgdscklV0GIxaz01OpZtSXNqVcJlXZ6pMG4/gszVxWGg5aCpQsogXVjEpaOg31enUGTLI4NJxtLouU+sbltk/VqFlrkpZq0KUpc7Uip2cubWhJGK3VnrllsvXaqmRZZwmZ/TziaU9Rb87MeXaWzHWloHEGXUmnhKzJcgnDgH87dHomnd7Jqhxto57LXOpHOwHOUpMuq0TNmOxCvWnBVr0rQj2zaFAu4dJGk9DQnldqVNmadJqueFzKvLZ61lzaUChJUz6kTSumzKRTOo2zUQGyCxK0p4HTU6P6EYL6abz6NoyTqxq1VA2TZRGXpaVU1l1ScWYQeKVNacxcBQY0U2XV9uOGGrMIldS4XCcQ9bMv05rlzFxFyAJuU2YpRQ2YW94pKC2pH6F0blPxSNsKc1UolQoMkKUyk5SdhkpNOgPqnezcQoCsSxhKDYfsZNo4tCyuozWadLjcVkto1NJpkFR7p6GeAmRcx5lUKkCmjRq7XKXLAMmyDWqpRUonaga5LKj2d1zCpV6VYJwlDCX0Lney4TAVbUIWq2dSlWTLUQM0eqWeyko2Ec2lhskSFoEZjanUzZSCblXUOBtFNZThRAvSBklqSsHtlWWNULbqwYjqkFQ90L2pdRJrKea6pMq89y6amv22OKIuanDVgoS5aq+yM6OByy1RA2fT6rDUsKC7dhmoQKApJwlxlhT06gRXSpPELUPaQFC9y9Ky7j+laTVWtj0WjQddSxhZLOKmiroaIVcjpzH1pdA6OpBJq5K4rC5j6P//9s5v15Lbes7kmZHHkiXNSP6jQJajOZYtRzZsyXBkDWLAd7nLQ+XJgjxJHiGv4Cx1nf6mdi12zyjwEX4XXRCIxVq1Ftlskt17jw63EOtoqXEeuMs1XHsPhI+0zsO4AE0wjtB0PWSIw6j+P+6XpctWHUdM8EoY1SBj+clGjwu92zBLDfPGebm6uPPuPWGUMxYGriBP2lKeSNVL17uhwNCIf5skgaOQN4afBB7FhlhK17uAEu9RSDAisWE6GeiCYHoS319wye68u5x0iPf768ZJLLx7O+P8OUks/Fh9TedHeANnZIPQiJkHTykxPWHwoKcNRlguYQEyjBBD/n8v4dDAuBECrzpCtrR7FeaIXzIRol4JoexiyOBfp2ixbkvwiJ8Onzx5MqzVWNvuEsZqIw5mmaGnggz9ScjStQx3JWQwInG5ESTVAF4PgQmBjNhNMI5iId0V3qXLBf2WAQUexXrVM5xncwPbXSEOhNI1D1kOMqD3643dCsOjvArTNc5jBEIQsh7iAg90L/welLbrvXQZGKdL+Kh0wzHs0+F5u/O0q14uDarOeCpH93aNSLwh6OHg7ZdwkEcugKtr+i1zsaeloai6xgXB9FTd5XzPI94Nl8mOqiu7Jp5KP97jUIDRjXfSy4CndQab0g3BbzZRERK2M95QwLP1VJRc6d0GXEtDtmdwPgxshZwIAkTRt6MQzwnw4nJBLGkEbni1e8PwVOeQcnlRUZUSphtUl65OjtXHAtmeJEjZfcRC6aSwTEj1KNCbg+mpnO/enhayl13QE7qXquyTH3g6553pLnDkIlDl2yxhR/d6QhlLzVE2v2UOdy1jZ8t/1Mo0gVdluMaZZfXcCDuwTHiURAiXk85jexn8I35ZqsehEA1j9NssffAnGbC9Ia92PjROindv8KEJ3que50QgI+xgZITSXTLwRtWVUe0hzkf4Xfvu7uj2EQhz5BXpMhd3wzXLPF5FH3y3EUdID5/Hj5OlWOS43baWytn6FsmXtgO+C8QsyaURGryU4G3mACR2GFTD1X/RAluG4yGL9dP5I81SGRr3wnTl23u7i5AuDmUAjZfwkDJYwih1+/qURhZYusR011KJuAt6tecM4EUc+iVz9Hx53MdhNCZbVYwQdAb9EeOpHEu+Mw5CPLm7ljxe5911wsNEhj5xvQoDSVXMG98ZAyT06jlCs4yNtCeMDOe5hP4g6QboAnedD4u8ESLes0Wj2MEHuXQtmaPSjdi/wnaZbJ9OXUZVgAxB8EeCzsjuffbwnmHenll6fu8AqaJv4vF2gStVDeaIhyG5yhhzeLlgPMSTvOX1As/jRthCTPUfFLv3MXlcVPslIHBjl7+GvF0w7Nv4ZaDPMUF53mYJj8f+dEh7NCn885//VL+/++67kum0ghcvXvynDeh1DTKIJT/VzkPqoIpvv/12efuxvQpJSTfmdhziu+++q6prZEAC9+qM47mdp/Vy++GOsZ1KM/ZzpSU+uqOFv//99XdHOlUrfhAj9DDuxXYG9Gx1Rz766KPPP//86dOnOo5Zh0387ne/e+edd3Rmow6NVGe++OKLFxvmdirQ+++/ryPa//a3v/30pz/V2ZXLtrzD3dVlurk6kB0gY6wEkV7tIZTw59XgZbiNLKoeWEPHcOGd2yRZ6l3jtsq+WSCohupefP3115BoXLYE55sIUnZ98OOHLGFI5+N/pZERqWTUAHLoyVLAShnbWTwyxjZp2XZqfvqRMQH6IPur7ccAamnMbbJxyGIlkWCPe8A//vGPchVft0B3XP18myXspaMzTlYT1WJd2vPnz6uVKlksGoG57Y1j+2GNWsvlLRlT0UFPqLqBVwb23E6i0ebgZFQ9EIjH26uhhKSK7Rt4eIN83H87pCU1Nm7bxvjyyy/ndqIdRyaGhqoniYRApLw6EkzHYetHIXQMR91+fjrg1atXOiD05z//+Z///Gfx1Zmy9WsJtYmUXeFHLc72Jii75mI9P5Rcho7er1SffPL9r0aM/dc8pKmynhZaTtUrzn6sKavzdssoXhu9QoqJRsOmz5TORLef/uL759y7f/0VsXPrOQIdQa5V7Yf/anBk69IEuje2R763vkS4qNJhqjA6exqMrWPfbpjbKPlAlbc6XytfQ+pRc7vpNT00T0rAvVNC3ZfZHjnL6YorrkjwkJpvVGt4/7IBW2eDleavf/2rhr1miJ6gc7+6sU2MPff3P8xSAk0Sb50fTpnbo7HyV8K6ZOZ/oVphXQBakV2PAS1YwGj051Bc/tjhVRfAy+in0vStbe7nlVfnVRajY8+0ipkJNZ6aqLq5SlIC7RKk5VTuI0imEzhl05+x7S3MlhpMDV1Vmf9aRAqpy6n1IleJ9Rsg3ooMb4Wq7OXOI9R1qVr9idtavdIfwmm4hNFO9Hb01pcI79h/DohwleRZZlu6Onlue1u4BF/C7v2RHodjbxID1O3nHoz9CP9byQPEe6qudKbsesJVQj1XaiXQUM2/mivauOsZzHmPpdcs/+abb0qgZV9RZfNw4ld1hGgxulQJtb1OO7pXTaiqFSu79r5f/epXWr3Vq7Kr3U8//fT5hrn9mFHl//3vf6/w+oDIjJ9vGhnnwyu+8MH/uHfX2BdbfThQD7V4tNT9PZqn+9x++KYuirNJtfDk1Quy+OiJV6MP8/b54Zp6FupAVAQ6wLO8epWppulb9UqtV99qbJdtFa8r1TnaZbNX+nnQHkiXwEkVMWSl1UHYeOXS3Ku5UVekCaCNtT5kS1kT2ycG+Wtu/2M7Fx6GFjX+NWIffvjh821K/+f9AO5qTo+Quc1DkYDDlwsMUYBWVEYGwTUyusyZf/3l4Rcwlkr4GqVawrq5deHVvbrpY39A6nPbP7YTxlVqBWnQ+mHfsmnOm3ajGq1h0XG4w7YFdaOS6EFbQ11jqwHU5qZAjbzCaZ2x9UZVxZDtXviI0i3WpldG7bRqdGyfEzQUPJsV6NfuqWDcdU4Sq4b6W6OHd4HIXvUQmCW/9GK7ANejPw5lh0FVP/Omg5Vrjo7952CkCSzJuboqSG2F2rhrH6kXN2lQ3t/fz/3X5vR7h9pf9IYoDV/CiBn7h06SoBzbTeW+qt1nz57JpTzlrUkvb5VamdU3UpWtXo1ta5NYUK/+9Kc/je0ldO6H6NO6QAcEvKouXycV+PQX7/3kNx/gEjRoc2tXp/g/357B8HLNrTNje6LAa6DqSulnDKZK9DL83Q0BILy2krE/HhDrI9TchlFVvx26I9qwdF8IHHvfNLD39/cKKZkEXC99UH+it+7CPvKO/T66UtCcrIH1F4ix/1LSvP3tF36yamx3x3PSPZ91NKQkVa3r5QcZBGVTuGRly/D8iN2gGjjhCfQM+rdDX1NdM7bOj31azu3DkNaIPiLz9jb3m6ifwNT3xtqmeLcbtxOY5pxRZxh/8PHHH899BlZDWixyaSHUo3FuB4iTs9qt5vS7Ilo+vqyAGPi+wAHM3BvVTwv4fa+GqlH9FqluJbF9kgPno6Fu+KKgaSCly4SeLWwhombr27BVqbFixFyJGOZx/+1QhhpedqX2mlevXvHsKZsHg1+zbLJ5BozwqqxPD3WD6/WwGtJL4rfbd+WvNkhWhn5+pWZP2frxM3Xsj3/849jOEyhbk7W6SuC0L6Cebz9eLxtvLYxqXf8soYbEv3z5smw9+GuykqSMb7evQ+c2L2tJa4dSb8f2tluG1qGS6zPEduk3Q+G2qksBPMzP/vvNIhf/6tV/807y8xpl6xVbQ/dy+wdR9VYdroGVMbdPlmX7Q8i7RBkIjaM2Na1e14xthb/aJtXYxrx6pd9/mPtWtfHfX1Ek/+yzz+j5y+0eabP45ptvXtk3jei9KgbDeRitybG/r8ilVnjA0KjmpN4zNHTqvD7xKBzx3CaM9vG6WF0C7Uqsq9PTXdO4XkOLrIT6d+ixDZ3GzYdCxqttBOp2a3il762oqjKWcBe40b1j9XeHLiNqbpdfq7VaUd9qrOpK6wJf3U5LTb8//OEPurS5vWKWrW8Oy7i/v1da/9ah9JyxxbVv4/CwLnSDFPjrX/8aW41iVw/n9jjcbvj3n8P0YJ7bRwKJX9m0nLcX60bXOCPo6Tv2f2R5tc8W5kxdozY3TbOx/56z7CgBbS2Nro+cHf50f2NbR3yULhbE+HPaeYX8GJ8OaWy0Dy4u8KrDmfBGlFd7HvFhgM6IjCexSBccBaoMQb8ZR/AM03aTELhL6Mq3xZ5hxSXvkAuBKz3QZZGz26o67+jkMgpZGfVSUk+14EOjUihxfbbQr3q5ywO9GsDrZQjCoHoestQTBYOhKadZ4c8ngW/yezhkL90reOZoAqZnOK8O+19pcPXkYOlaRo0Nbvd9SZC3h/eR7FUxEe5VBPDde4SlNzIE6XxoIDsfUb6Dub7bqrrtcGbcbrMAWTC+xR1NPPTdDs2wu//oj0PvgQwEdMJ51wNcVN/oipwhgA89rh7lQB93EV6lC17nOu6/D0jP5m09BLcNDttJR2SQsSyP5j2abs/T/sj2AYEJfeQECsR70kORuKi61xG8CR9IjC6AcT6Yt3TN9t4zVsuEMoYOuH7pirnkJSHOhEEgCD687qLaZztV7H/95bueMwxK5z0JpJcn+vPYeTvs4iMDfJQyXBleZ3pCYZnBIQF5gkETeqpiur3M4KXLYPrsdTEMCBcCqu5dukIW5JFe5eM+DkfrhBAdckF3+Q7bEyKbq60EWdwVEFUxnjxadCNAoMNXTlxI7y1K70OsvUBv1GNPSsT+UJltqYtfhouHFLgo8cBlXnWvjN4B8R6LzbbelfBeEoKyT4yIcp4qSfrkjIR4HZE2jBPbh9cHatkKoLmQ9aaljKrspSBcUQK/TT2hV2NR6HEYsmB6Z6KtrkQQcB7DuxS3212RkyqygOc5iQ2Bl4h9Ss9/xxJ2ft6OALyXYWA7xBOFHXd8qYcJ+0RA1TWyVfVBw3jcfzvkUvvSdSWuk2XTmZB1I0gy05klE30AEiyjYpG4vgfCeEMoz/UhoBpRGLLvNoTAM8v2qotxdQE8muBd3F3dC0POLpBXpc/p8LoMl4PkoXeDak/iQzqtw1TDQOO8ypiQS43gcwClC0DcceAkdq8ysLS4jO1pY/nAC8GELNLO2z/Dd54pDeOa6MNSI8ZHPrwwMijd1RtCSWzoQ0A1ojDwxg11b4gRuO3lkXEUFThKFVBC0F0yjm5BJzs8D0wYVGFo0Yd0bprH/XTojTkkmG15U57AWlhEwbveXeN2tczVoMiF3knX4IrAI73b4Q0NoKtd44bzDpHLhXRSPUEPjAwdRyF+63sPXelVEEpkznTlEj1PhHcmEop3MjZrXBHoCHEvQ9Y1AHFoYLryiAxBr/qVinHZEoiXevfqDy0QwMdzRctkT/C6b+jh0YRsKe56N9zrGcT4nut617jhfLggnTkShLcjAmn3JASE8mgJg0iuajAuWwYC976W3jJheKyXblAdj/o4jB3BG16WGIysx8aDAbHbeF0TNtUQOL8knQ8yGEekxXA7ZPBHrhNE2jAioTNALicJ6d6T6pFxxJPBS+epYgci8IRftkWJ1/UnVZjOC57QlUxp5ztzkgEysIyVEYE9j9swQXZ9ZPZnAGLZwcgA7p23nw57uPMyzskjvjNedW+PWrrgT1zBgEgbRiR0BiBw0nl3LauhDEN25yG9DLHznekuRySkFbejdD1VMV6FedzHoQwa66X3BoQXsttowkVVTCiFIwF8J4+qTo726toNrwbZP1VE+DIKSO9RzmO7C6YHUo2Q4I+uN14YPXlPGzmP0DVLxrPJ6J0JZXgRwCxLECGqnuiB86H0JJ2XveTfMipcjuAjBCYQ+iXvAle6BvgfWoQLffC4ZATvdq+CoyntIVS9nLdv8yojPJIIrukykZGnA5krZfcQ5480fRxQ9pAlicttlI4jDXwf2CgdHh7KzsA/4r8d8oZI/yidCTIYpZqrsQjDEcxRT0I22ifa0Djv26v4UB7ZJ+Il6RAZ4fBu74084LXUBFRd4DxkrzqO1kzYALK3FfwRlvlle2xnRLqrC/AG47aqy7JnO4dnO4ldttVLrwo++ZeCozzjBy5htxG4qwvgPdxd/Q8t3O5R7vKqe3vIG+FR2J7HydhDEIQR6GJliDwh8Kp7QwDvVUdPuLQdPQTjKMTRA2VH7DKVjzBwwRHZvVH+qJ8OgVfvNrhrGTL3UfDnoitVDSZ4D3Tgkjdk7p378WkhiFKGjmA9Ucp49uwZB5c7fGR6hs4HKYPSvV51eCB2uAIow0tVxkmsV50n0AcBb+hleNUHv2sA2WZ7rgMx4e2yjhDT1klDTp7bXsoIBv6kGtD5UJE/DCGqzsjognn7Gd01lM6U2H/gSTyxzrsLrwucdHQXTNdHqqieQ2JCfAJAdr1rwutVhwIj3F3Yzoc3eK8GIsrFuIJ0ZVS77cxSrCqMTzCA4I1L+HEfh7P14G57Rn711VdidBKVyrGdLqijJeifQ2mX9mvR7cXrIEEOsBfpIRL7MaRyiZddvdK59WI+/fRTxAC9QgRdppiXL1+qFTF1mTolp/rz2WefeZTwm9/85sWLF6WRix4ydOX6/PPP+9E/064R3gXwsTdhU5WyuvHee+99/PHH1eLL7YAPHdihcdCJw+qezraQUj0vvsR62NcVVYs6lI4mgLe4FECiUaPaweVymSYVIbggj6roIcWcVD3K7dAsbZ1U4lPFNSLd5UpKF7jt+OKLL7gvLvAq803rVKTPE61QTQBBMi81JXof1JDAWsAVShl8OvRlu1zCNUX5lQa5qvzggw84Z0DzQSfmE6U1WBoZYz+/TSGClNiUv/zlLyvKz6ISfvvb31YPiyeQ8Lhq2Tr6yknxKuEjStXzJaylUev3/fffr6a5+3NfvGM/vlWDo5uLhjwqfUq4yzVOzm2j8P1h2u/P+JY7WwbBvV6FPKqipwQuoKpLGz/Cp8O9h9l7UEPG40q2wuX1nf0ow9wEzAxX1iJ5/vy58tcN4HznEmsBzG2b0JmB9Via+2/ZKET8f9kg8dxPAhTUFldKKeha+CipzGXovDdOZ4XX0tXZrRXL4tEliKyelF52gTMnBXolAxe2jycavO9sB5beffCw2UlTA8WveegkYu2Gvvtolqta3athRwPPg7w3LRIvAteLd2ZuPen7u8ZTh5x98sknOrLSf7ZGW5X3WfCbLlulBpxjrInqRsB7Gxr6rJMt9bscOnJPHdAOpWNxdPqaOiAvOXVDdTSzhkIJtc15o7VNcza3hqiiyqgMNUT6/8CPnnMyBI7i1OCoaR1OrXCOBVdX9SpZo11N8DLE5AGjLeGx/Z+lSkXp1bnvD2pRY1it1Dio6fv7e62XuXWmDPGaGzW2TB76o3PMh325JfTWVdVBqQqv26RdpVZlNVS25qeGvZQaOi1/TaqxNSTGJ56aEML2UXJepZN1gapW/kpbT0dNp8LLly81LP7uQh8Ef9YClOm4bV1GXbvmFZOWufF8/4GEHusQ7y7ZkEfeKB0eEsbj/tuhNz9aD3DpDUujE7Ohi8TfJ+YAABkESURBVAUnp925ECgnB3vqeVM3qVopsiaEPrioUW7P2M5srIXh4SwYHYCpJrwtnjSqTmtXVR05PfdNR+XYT7VnJ/IMNVlrNxnbb2CpnPtiFsPLqUfN27d7QG/DBfns6++XqAsIqelba0mbhTYRn83+iqCTErkjJdYhwsoTb9/w2Oc971U/4nxse5wMdbWa4zdSai/mS+nqPGfJkqp6XvpyVR+0zZXNnsL19lcK77P42EoQu0xlpX1nw9yaEOa2Lxfq/vpBcXN/wyAc/t1331WgMvjzRhrxYx+iuaXS3Jv7T3TxjhiglWmvOPR2bGfgqfW5nxktAbEuHreTRwKakECIn/8VSaAwtoN/7+/vNYYl4yOgeqKPaxoQPY81trX8/XFYJV8CefIlI/Ds5Hctnj17pkurhLVOtc/om56xX3U9Ib7cfj9kbDuSPtcOuy/C2yyEAL0V9FaqMeeuCeUSHweR9/siQ8DlcB6ZSk0n7ru/bNWzWaMX8Ay9xaO24CPkiO9LWNXHfRzKUEu0Sttjf4f1N3feH6VxY1ml7NWxPdXmtifebV/T6dGiJIjn/oHs/v5+7o8lvWmqMyr5XT1t99i05UMsKBA9W8/Y2uVx+PHHH0svQUWxmfKVi1LpjZJeje2kaQnITBUyXAg6in/3y/zxTy68PmnpWvQxRbzefOnMtIODx77YyltbgK5XSnVgrF518TofpaCby3fXROkBps7o94zEl1K32NehUmmuqm/c7rF/46qfO1asWlGUZwhDrhDM9sY9bhuVrQHUTxRpSugXpzXgKnuLtePoc7CS9M1UA6IloJ23Umnuzf1jKI9DYmmChOqqjLF9Izf3H3PQty/8eokEEkvAvYhpINKr8vrP/0bpvO447zrVJcZzWeolssZW11uX5q+kvWO+j7NZKZU0esnTRx+N5P39PY83dkLu9dgfvbLVf/ac3oG+t4gHYmhIVaV9soG7Vsz99gMgmglqjsc5/26lUgYMwDVWSxib4VUreijOvWOenGxRIsAORrHjdsKToQeKV+le2Y/7Zam35IAZ+1SA1PYqTFuEHhIGNlHuUn4OpFf+7XX8e0OdZBfwFzT/bSDtR7L98Dl9FaB2vWlV1QqaEAsklE2jRfLLPtMWqkjptU1TRUyV0gVh+wZ9V/RPHhYegrn9aqA6P28/xTIslYShe2c7Jp8O8/tW8/Y3lbwbCKJdbLzsC3IxAi57ukEd4C4Pezkd26zjdpBhbgl9qHkV4GeeQi8mSKrOH8nolRiGdOzzRy6GcdiScYEn9+nq2aY1pw9GehxqlOR9Z5uxNWKRXCCDqr54YzIoLeEEUvVOQtKKDH8chks2gSTH0K9saoZI76ubq0MPyVSnCa/SbYkJ98upm9VX8bBxlnjY6tMUjflMKePIjidBD6Sr6i19ltgblUuxvtaWaSFhQoBLF+7z1g0PieqeIC/ZqwFcrvfqEvI++uNwbM1gC94JJgSubrhgyYgcLZt4GLcJCaZ7Ow+8OUqHP2xm64PbEXvEAHhfDA6R8fwIGwYSeylzowsCXeAZ1LHl+Hh/nD9C1wNcz58/16dJd/USfX2A+O32j20udjt6Hlgmn23CBLo+vHGvwxa6NxJKpp7oQ5t7sSMc26ti3CY2jCAjxF0+Y/shbW4TEkzYPmjOqxqGI6aoNMtw2b0a+Z10rwMv5dssYSffxjjnQefp2PghSziqkBgngs4vEWKPOhpAeFw/xuNwHAzQuWAeDHRHDxQZdjBUezgMRh/QqLoefql3gSOijqrdJuHdBqonCAFNwI/2OQyvl+4693ZbVUqvOkJ2xDuc8Sh39dhx8C7lIeczFoEzANI1yzxHriMNdhefCOJikYHRrle2a84HBIEQ3iPbsfyyFFDt7XbXeQZs6SPKvWgIBEuxjAgJGy9LGC+aYJbwVsa/bwk7XKnqbG8MLoPB67x7j4AmQjwbjE9Idy0FbgiP/jikH5QyQPB7RMJdsjVvPAMl8ECMt7SDpPSE0USQjp5BJVFzXwyQ8CgjZImu9KqMELtLo9rvnRvYni3IrnHy3FY1knceEj5czrje7RjwJdPDj5jg3eUkLgzZyyntcMYzdD08pMvCDv2SERkhMD3VMgOQ16/XeZHj9szSpRKbqvNg2AfrEPdAkQHXRNVxtISjSun53UaD3flOqlQHvBvYPZbSqyA0kG7v2kUsgSGDh4F3ZZDuOrKPEJl7WlV/pMchrdJwMEeGsNyhepWyt9WrR7yTlB2RZyk+0gSPTVXXG94ls3Q5uWzLXctwF7h9kgQsBa5xbxgOkT1ccJej673qxhLhIkQlwLvUL5nuCkhA2Q3J+oYLIsoDCceg6kr3RtXhITBhBHqfl0rSCvwZfrhcDHrVAwNHeYLsOYMM+yT8iJHhse51vgtcE14XuO0lfGBP8CBwOwTYEeWkaxy4+twQXEnVDXhsVbs3AhFgqA+P+Dj0xmRT7d7gI7DbPXNkCyWCYZ+X7w7+P50gwZHXk2O7KxgvcTnfq4CQLpBLjD9Q4+Hqhrt6KSMYSNe44S73uo0Sl6qRoRsuDuPIjkBIMs/bBemBaFzclc4g7q6kDN5EGLIpXe+MSPe66xzkjww9jwu8GswyaukSjlz+OPTV2pcwOGqr8+GFxHZXMF52YynboxeB7oKPZeu2G33qRloSRip4h0c52fmeU1V4N0CIvdrJpQBEwuUzFU03QiD7Ef/QQg3QMNUuUKmZHSHC8lIdHjhsijy0dNCZYJZ82LH8sL0JMrg3BOI9m2v6IhdPeVTttpOdjyTBh700ll1dYtnhZa/Eq+yNzuP5sBRT7Q0Fr7R9GwJjv96eP0jZfXB62iMBCWWcTGmVbhzhjYLZOhDJKXF5uRwcoQ9FBwJy6n+lIWdkOGoreI8dbcZG5mV16RKOlnBXdt6rbzk+EeuGw5XT1ksXjzYgJ/AO9ypw3nvihi9hz9Cjgney88u0kR+4V8zjfjr0HtCwG9iUHttl2NxC11N1MmyVsbmEDJwznjZ4GMpuRAbCQY+CpwylCzDcBR9k1zjIE5k7GYIjrwtgHMM+AfQMbkQJwgVcIziPfVIuqx3OY3cSxp8lXS8XAoD+aLgQWNBrLLPJcBeplgIZlK5EEwiNy3CN7XEYj1gZR/rgQ9n5rj/RUF16l0As2/nOdIEbgdCLWdqqiunG0kZD2ZVLQfDMSXfhdQPb9SFwkBAlZBi9XJIqH/3TYYc/wB0IOuOkeC/H7Ts74oia+44TG4fK/gIV2fzWLjUk7DJwwig8EsJHFRKEzLHsOXCme08QCb3aO9ONoyqB/UUvklBK3L0wXg1ZN0J2ZCuhuzq6wMOd72S/IkefrmHPA40zfYQxvAqoPsYSdhl2/Pzv/PctYeBVEjpzZAB3RQbZEUsZSphwiYmye91ehncmxEEuvW6cV8dbL2EZTHgnPXlUxRwZQZ7wgrr6uJ8OvXTD8fz5cw4v0EkNswVCiomBe2hv1daTJ0/I6d4PP/yQP3j3M3Hm/te7YzupgVNs/A94gTfqhmzh2bNnOhtQ3jgFamzHYvn54Ppzb36NAR5U99Qr4AmxcXkSDFyxr3mIMx988MH7778/9o6xrdS9q2GUpnqlv18u8sMNysDw6krphkjZTkYfjlxjm8EMRejnfgYQ3tgKlwnDJlBJQBd7VYzbY/W0xtZY6XgjD4GhDCDek72O9aqXPtX94RFJ5v6zLbiY/10pEj6M0KPsS7gzc/UDT70h2TVF+fN550nLOE/batSfulLODfY/DPeS+aOqwBlvylx9GNuioKEacP48H0GNrQRja5qE0StBLq86ryjsacNSfO0V1Yr+yl4tqlfIVOo42dJLoE76jEWJHX2g6iXQntYFwz7GeIhsuRCEF0Oa7sLrDAgXgh/1cYjNOQg6LUmLTX8RXAwzj9JveWQmeRgqNec46iyi7raD5+d+orFIFhVHPMcc4uxdkQ5vQiWZBQ50l2Du5zJwgTr80x+HgVo/fWXGpMGmdAPZMV4Lhu2htU5k1zJj6AQdbqKB0gNSEOMHq+pezOM+93vdIV6d0ep1pTJw9F1PEqTskEGGt4t7ftBje3hMeIy6Lq+6AUgo27ewbrC+nARK5VGyvcTVNynxAIby6LZ2vRvxA0+I3bjbjiCf9tsmoF6JNIxjX4mCSB0p52fQ1ONNs9d3WFVl0Ojcph8bC6cZTEuo49H7MbAsqGG9GtsTHSbawhAPCYJRVU2PbQmrM3g5MFK7GUqmx3lDKo+WsKNuCksedGXkWfJBwjPtQxlkGC7GfvTH4WhzK+yaPcyA2mfrzi0XmwReYrCbAGT1sKlHr87OrtKP2qoqB55pcuijhj4GDXs9L2/1UJ8a9eQeq63HS+FuOwuRJHPfo/UOKNfYPxHObWrqwLZq5W4Dp6LQLh96NGg8s0VGHzBAMBHy9KNnZd49fc3P7Qax2vW01rWzosbt0XG1AN7ZT7riGsfWYe4UYkBa5QR4cVEd24RxsXh/u9JhbOP2wDC9bejVXoxKXRGzZe7vSXp7868ufEpjCEGGN1xja0inZ4VAs7G6ercfgKd3Cx/2ujTt6Rw9Orc5z7CLEZiKY9t559aEZpo+HOiWaXCIVR4+HapXTMJohfx4cXWBV5dLuEh9WRqBET73acla8BHQ+Mzt8jUtxzZda9Fp0HTVD61uLtICvF6d9g1EDQsT7CfbT1iQVtOGCTO33pKKbUFVbwXGqzC9M72kSzUINZM1zcS82H61be5D5/0hgzcdVSfRz/aAFHzGOt+VR3xngHjKMND0qi9hvI/7OFRjbqiM3URzVFW9Op2Ed5d7o6q1rRmpRULI3N+e9ABGps6MfcsY+4SuKVuumj0vNixH06sq2acUoh1Nq4WGxvZErCn7fMML+4KlSD+5VAkxaNdbhFzCveiFsp+8/2w+ufmkMu1A1+qMXhF0ACxfVI79NEL2GmIZWO0OsklOuCBmD73pnrvcGNt3U3vE9+ABKd6/5ftog8Lvtt+swCVDY6tSV1F6vjzn4yYhqhKOMW8f7c67XugDIltTtwb86XZgrB5XY/9FobE/KUX6B46aXb69ygC6Fwp8sp2oqa7+bINClJPwsT8Oad0/DA3bWVSNRqmSLRhHuHgchjegnmtazu0OMv580aJVLFK3XqUuFj3f7AkKkdHBEmAucUcEHyjAe/bce6Weaxh5S3M4021KXLL18NOHTi5ffFXVN94h5OKKPH+HCxwwLlPTEYWB7XBytLel17pdIDJcVE+8Uf6oj0PZLqgdtm6/FnOVdZ90e4iKDF4F6LvgxfYLutqstTC0zRWjJ9OH2z8iitQ7I89jPibWw0nfoiinN4e4eu5nVY99gSGohkrAaywNqYcE6sZXW9vX+A8/l1FV3igx3tt+vSVm89bBmxFY2i6ee6Min/7i5mBlLe8agRoNXRFfmVa3uaLqqjozt+X33oaxXX7F6o27lKXnO8B52zeqvZMYQWroeNDKJb4arS7dbc+8F/v3DbXplL7s6kZ1ic8NnjDui4ZXvPYp4IGRJ8hgHGNLruES8+H+jz1iNAlrQ6nWmbHKOfZ/shr79MPmEYty7rPuve3joK5Oc/K97TdBpalh0eVXEnr13rZYZGtsNSwKEcL2qhg3vDwXxB9ahNir1T31nHGTV/Nw7OOsTeDFttUolvmjajyNFFvZeEVQK2E/337+TE3/bPtZwSqfb/+yXuCNSlHqGxl8ylWvdJcd0Z8TmyZUqt277dsFppl6K37sPwLFhPGrI7PnVBWBK5fVsfqEIzvE4eoySFw9CqZXwxWG7B/1cSiDqhjey+ApwyAEHHkxtNGH0o1lQlK5N5SBnra3SLWLl9Ul3NuVnjyqJO8ZRGLj9epb8jDkdLgAW9UgsR2ewaNUBT6jxMhmi8RFGeTcv2jSSnZ4Qs8g/iRnd6F30Pnw9sAee8Tj8qpKfRh6rbv1LquO0HTbq7q0I6/s8Pr/SgNOOtZHL/Iv7SXYOmYTk/xoewmvC45sQpTc+WEfj2Ae4m8zIMAbgu4VswwRH7b3xMVHZFTdEKIKGS7Zgc4v51iHJ3fy0R+H3mTwIEhVu9J5vMun6cmgwEfp+k4uBV0DI68rqbrAjQjsQBNwASV6GRqQeE70xRy2M8E72UMEdWDpXd41DMqe310hdg1VvP4hwDWuhJHBSz2C2XqOK/a+0JA5BC7rXsij0o2Y89hOdhe7W9csq10JH9WlUkzwvee44stSQWJuxDIQV2SOEHj60LcO2b5YulcCd7mGqgTIwo4SgYxYwnL5rAOEBxO8kz1EUCsywvV4S9jF3etMD4zYwLIJRYl53L87jMac3Dtzc1VuhJiqY+miGts9aT0KMdUepWrYqrKbBN/TAidd7GXw2M5TnfuVut4FAA2uJTNXQ4dG1WVUyGBcf24DkbO9YuMKGVVKANmVnXfvtIGF77vwEmjc8CqlG1SPXDCUvist80c2r0JGNTTOjPYE9ceAG5S92sml6271v9IEcLkmZq8QS7XHunjJhx2yJQnTY4FXI0OQ7o2yJ/dBcIGTXg2jY6nxPLJVdU2fomhcTNVlkLgiENt5qm6HMkrhER+H47bHPijeCSeDIVbARemGoyfBluH8HvQABL4Rx6ZMCeKB5C4Q+Zcgg6ciqpN95SsWDTyaI9Kr3eixRwJkCFwcA+VRILyQ/WJlU5WtKqUL4F1PVUzwzmBrMvuTAGXYPnOc92yRofPuXdoe4jYaVwrxeAh73j74cYXmiHS9AxdlrzrJn+E7qcwR7sAbgw+ISsexC767BG9XpacKr9vcCNd4eLhC7KRX3fBqz+YuBOAh2MRvXMJOunccLGGvhl4leTq6y6OChxzt07bwiF+WjoNLWpZ4qe49vIFrbj03UT2DV8+V5zjSvzGheLlc0BlwQuJSTt+5nPcQ58GSdzJKFy9lQXY7mPPY3qgjBFQhqS557GUqd8l23r0yqPKMhAnxebYjUnZUnXeXjFC+DVy5TCj7vJRx1OgJH1FjfxxSPbIjED4Y4UgMuRTAy+WCznSy670K3AvjZOhdcMR7IHZUZUcU1XhmCEdi2UcdwOUGgtDgDbELQuakmEjltrxuP+6nw3HbqqreG6+C7oU5CfGok1gZCJaxR1XniXXbq05GYM9AGQau5XvukTgw9pcyT+LKsCMJrQTZlbiSur00qpHBXZDO9BDgLgSuXEbN2+bCeGM1DOwY51DKdq8bLgMiPcplEe6ac6CJ5FF1QRidp+p5qDrZp7RcXvJ/loZgtEHugmXV+R6LwOFk90JSdrHIPivQoAzbyfMl7CB5590G4VpWeclTtcMDnYF3V3gFXO49sgO4wqA8qobrf33x1SM+Dnu3oq9uUHVN2EdKF4RBFRml5paHuxfSGXi87nK9QBMwXSy7ly7oy4ASsUcBBN1AgA0j0tcALsqohpI3SvGgK8VgHNky4MVQuuEu13TlQ0bDkSDEPZwoF3i1a8AbYxFALvmjchkLiSsEVIN3w2NBF7uNrE/pbuv/LEVJfsqTJRxGwL3YMO5aPrZJ4lUxXiKYLY/rI9aNrgxvrzp5tISX1VCyhN0L010nvAuo4gpllCcktsNTuSDELntg5vjfX/zxcR+HtO2lVzH621PPgMvJLlvuxS5wO5KEeBkrcrlOwpAdPKW7XOCG7F4N4KIMuCyqoSfJkf4IBFKGK6pHCX0dertHUcH3kND0PDA90O0TMjKo9M3aXVF9yLgBPsCY+NymSojHindxhwf2JJHNy0gr42jHp+q8Z3Cl8//6+lsXu6CLPUPYXpUh+2QJH5Fhk7w34cr+aFHpGcIF42QoqYYe8gfp523rIV6m6i5Vz5dw4C2nNBq8ns29zoTdSZWaCf/6y3cP2R8Dy4YDIQ4l1YiN4XaXEE9EeK8ikN5J97KpiZ+325yLgwyQcBmFjOrRNYZNQsoOj4qqQ2TfI+ap3l1h0zouSndNG1IXY3j1yIV3yTjpriAF+G5QFdMzeMjJJPRSYBcIJYzfFzR4x21zKNH4LhMyeYNH7OiMSOd7cq8Cj1p6VX7/AXHk/hiBEX7kXbZyQo72vOzNyfal6jhawl5Vc0fjDzpPKscR73BN6ONCoqHu6s1B4nIlkzDWO0B8twFNV4oUgqTsvFcj/P/+6W//56tvnH9ERD/6BIq/DJvtZnTg3Rt5GIgehauT8+BZKLLfNm8I0l0IwsVUgLmVLBgQLq/SYmTuJd5Y5PDYXLWnfSMibTRqngfGky8b6hlOZC7ogaEMMhjIYI6q2KHpeKNAoEsO8X2uol/aaMBDulvNUimEvvPu6nOgBwri8XqqsOud/eG/P//9pjz6D/0yCtJtd7ngKC1MeHuUC45ILzu5bOWI7/91ZZRLY5mhl+ENV0/Y8xPVefeGrDcU1SNXBL42/uv//OTX42ZSX7hw4cJ/RLz+6HzhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoULFy5cuHDhwoUL/yHx/wCfBE6T6kxbrwAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,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>

[image13]: <data:image/png;base64,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>

[image14]: <data:image/png;base64,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>

[image15]: <data:image/png;base64,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>

[image16]: <data:image/png;base64,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>

[image17]: <data:image/png;base64,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>

[image18]: <data:image/png;base64,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>

[image19]: <data:image/png;base64,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>

[image20]: <data:image/png;base64,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>

[image21]: <data:image/png;base64,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>

[image22]: <data:image/png;base64,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>

[image23]: <data:image/png;base64,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>

[image24]: <data:image/png;base64,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>

[image25]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAloAAADQCAIAAABQjVgqAAArFElEQVR4Xu2dQWwcx7WuizKQCA+JKVlApAsHHDnAk4wYoJwAot/ikvRG3lwNfRfWSqSykd+GZO5CTBYknb1IZy9SfntRzvqScvaW7P0jZe9JJnsN7bzV+7v+6cMz3cPmaGZKHor/B2FQU111+nR19/m7esRTIQghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCiJPG0NBQsUoIIYQ40QxFirVCCCHESafRaBSrSjQaP9RqNZZ3d/fxleWlpSWUp6fvHDaNUDK3trYK9UIIIcSgcHDwo5/hHTvbe/r0G3yur38Roi6ycnv7OTrW63WUa7V3Qqud4eFh31gIIYQYODY2NqzciWJx8jc+Ph5K7fF1a+srX+PpxLgQQgjxEzA9Pe2/cs5XzdzcHD4nJiZCrnDj45OYHVqDnZ3vQrtZJqahhRohhBBiIPASBWksa1gZSiA7bm4+YSXkcHh4mBpZkFhDs0MhhBADCgWMVMgVZG9r6ysTP87/CCaUNjXMpon/93u+Ry3D7p0orhBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCFeOfoTQCGEEIPPK1KrCxcu/E8hhBBiIIFIFXWr77zxxhtvv/32K1JdIYQQoisuXboEwSrWCiGEEKJvYAZarBJCCCEGld/85jfFqr7w3nvvFauEEEKIQSWVbKWyK4QQQiQglWylsiuEEEIkIJVspbIrhBBCJCCVbKWyK4QQQiQglWx1YrfwJ4md/4Vi5y07p2tnThu1Wq1Y1QETExPb28+Lta1sbX1Vr9dZRuOlpaXW7VUsL/8lVJ41GFxZ+bxY66jV3il46K1VWPbYYS4tfebrcSxPn37DcrWp6qP2fStajoyMtN1LwStP2/ZH8VKNC2xlfMWytzM9fcfKpHovo6OjefGMr6+gZPCwIwZzY+NLt0mcRjqRrW6otsvrcnFx0WqWl5cL5dnZWX5te9szKE9PT4cYg1h58eLF4eHhubm5ULrzvZGpqakQfTh37hwKMzMzrEdfGmxLwQ2zz93RZxpkzcnl4OBHfL54ceArLZSMj4+HGIwARizEc1HWyLW1tZCbQt9CrKG1qBzNkESzhL0KNBo/hCiZ/IqYurb2sLC1gFU+e/YtC9Qq1rO7Heb+/j9Z4IXX9qorgxGww8dBmXveH9TPzf2RZTaA87aVfXHI6+tfhNjRhhoemnEanJ+ft47ogk3nz5/HJ0+EMT4+6b8a3isO8srKipV53dreoancO4yzkt155T99+jTk47mz851ttV34fVnZjypulsXFw7ueI7O5+STk54tDsbf3j9A6FITyiTbwAc1wU+/t7aFBQfN4lnn5YXd2mT169Di4ywnPYSWxFKeOatnqnk7snj17Fp8ffPBBaL1PIG+XL1+2m7McmNDx+vXr9tXk0LdE+d69e/Y15LsL2aX/MQtUrzt3Dh9Ly/syypty8WtGOldzpOcnAvrPEMbAxHkVahAKMdr2KIAIjkOGfthjxOzs/MFBJjAMQBZAMTfiEwNq0IYW0IvhGFEM4YnDhU/uKNo7Ew0eqiMjb+zyDvUDW9GYbRA6HzxYpzZsb2/zwoB7qEcb1NMfqkUsnzEPY5vD88VBQLhEPOVpRUvbe8g9uXnzJjzkpBbdUUnPeZj2ZIbRoHEerwm51wyTQ4y2HQ6eKtpqAIz7vmwDbzkHRdBHXzbAJuzOFCt2bFhHemI+Wxt4TmVCmacSqmMNrDt3x8+ZmT/4rSbJsJDXjMND7Ms2cdwwvKhnR+6UQ4GWuIlYj73DVVNlbLLZpJ/Tcxwg5BhDduSAU3fhJy0bbIOtMH7UM4Q4PXQiW93QiV1c3FAshgk/O5ycnMR94maHR77hoeAh6vE+YUsGL5qFBFKWYhBvBjuTQ8ZNzg7RbGFhgfVlopFDNwoGY01265YF8iRiAYhf7S0focagEoHGzlGI2oYgjr6+uwXHQhgiDF7UDP+uzHoxOBoI8fmJzkbe27RI3YjTBVqzqYCPmGjA4EjJsV34NkP5PA8TDgRK7A6m0B7/zE+vUiG7ls4HN+0zf/jVel27dg2fu7v7/OpnJOvr6yF2GYqYfX850Ss+fJjxkOtKyA36yO4fJtjFnLFJc8FbgpHJp1BbHDFrgMLExIdW47fm74qX6ENhlAoPiMMZ5/2J4OHzxN28mU34vFdWRhuqb2gnhyFeKpxWcisenkJ+wbCepmxw7JFanGY6ka1u6NDuwsKfeQX7+4SXpglkWQ7RxWueXcqs95vY95NPPsHnRx99xGYmhwzEdgvhHqu4K8wNNLt793/jc2xsDF9v3LgR8ohQkMOKV6+DjI8X+KxFQq6LNkSccFAR2QBx1uK4NxKcdK2urlr9/v4/a/mLvrZyGMPiGc5gCqoccv2wMBry35PooUXV0BoxQ/5e1He0Nnz5GdwEDueUp57zDGK9aMS9Cy3IYXMeZkdn0ztfSUwOg5uu4SjoWP7OMHsFbaHcJl7+usXTJA68Fifc1oUHZec0uHm21fj5K2rsBazdIHbUVuYnL/7CGW872SrIIc8+D5aPCOxuPzdAdHmB+d3xSrCbqyyHPHdsTK94y9u4hfw6tEGouPHF6aFD2XppUtntN/YGtReOMnJU/eBjETAFfGiowM+Zjm3cCyMjI8Wql8S72l9o+ajDP6r+pfDO+zP+UsZ9435dNm1HtQuvynb8GX8pg+I0kEq2UtltR/miT82r3+Mg0MtRW9+hSOvGfuKNs9zd7rrrlZoUXpVHrAvaDnXX1rrj2N1VXHtH1YtTRSrZ6txu9YV41Naj6hPR+e46b3kiqDicik3GsW0qIlQFXXTpmt731aOFHrsfy09u/9gGx9KhhQ6biVNL57L1cqSyK4QQQiQglWylsiuEEEIkIJVspbIrhBBCJCCVbKWyK4QQQiQglWylsiuEEEIkIJVsHWtX/8vrdaXtmW1b2SG99O0Q28Ur2FeHDI4nQpwSjpWtLqmwa/d5vV6fnp7mH8NOR1jfWr4T/2Vfr1y54hKt1e/evcuy6C+1Ws3nHzFmZ2ctzcrW1palidnZ2WHqkxATf9jfYu/u7oZ4umlwePj8UEyYZynKJiY+fPbsW14P0WCWFTrkCSpZxh7tYrCOuGbijt4JMSXm3t4e671XKyufb29vswyDGxsbLMMrM0ivwqHBzPN6/WM7fMsCGmKmGPMqLsvQTEADr27fvs2yecUyCxMTE408Mbf3CkNh4+Y9h0Emajl//rwfT39SGjG1Kct7e/9gWlG0hMM4Uu4L3jInHI7XdgTjPr2OEMKokK2eqLB79epV3qVMxcTULdQ55lFjEtF8YYHDDG1XrrzLlhYgTB2VYKKP+OzbHiaywtOJ5d9aX1/3ub6oFpbv2z4t/2dozRZGWcJl4LOZmCrE9F3Z+S2n6WLmrTxp3IdWTwoLOT1+/DcWKEsh5t0OeRcmbGOZGdd8HjXiF6CAV94+mzE5HIfCJ2vlp2Vcs7RnbFmLyy/gXvDZ2phCjC29V6w3r+zK90PHltRCnw6t4VbJ8MclhPBUyFZPVNhdioTW1Wrs7r148SLkkNOIWJ8tocDosLi4aIucoV4SmAhE58XF5ZgvO4uePlhjAgcJtPiOsM4wjQniRFzqjxMUbuWUC+WHD/8P5nAmnGiGXjZrfPLk70x2ysa5we9QCVPeIPuGqK/1et2yb0MXLco3YgpvZivFIdhMF2IMt+mV5bSEVzSIT/jPJJ9xj1veYCOfokWvpsv6xI5xrA632q5hGRMylM0rM76/vx/niIc5NvmJMQnxMM0r1MMrSzlt98vly5dZCFEOTfb8c6TtLh/kThcIFOJUUSFbPVFhdy7CglXa7Y3JIuTwbCTWF/N3+8fewhJOoi8welpmZHu5x/r19S9wUihR23HRH04WKYchn/Oh/vz5bLEChmB8Uic4sfNagigP5fOrKzDh8szMH9jF1mOCwNhCRTBYVhGYQj3aoMvz59kyeOgCIWSq6+Xl5UYmh2/5GWpTvRr/L7hpnH1Gr7JFoKIdJoPOZNguQm6iwNj4ZAazA2yuHmWfkMOm/y/+FfLpMt/B2owzN2jS1fSq89kh8bcJnWHZLAghClTIVk8cZdeWlUD0hBwidOazwKW7d+8iAob8ZSmXW0I92rAG4QzBKF9DLqvnS1fMHblmhegLnEhR8DCtQVy25VjtZycoHxu8+eabGxtfujCdzcBCFEWEeJ5caMDy8l9MydbiUq4sm+g2stlPcy1WFPi7Y4hvPqkEo6Oja5Hc4LIZXF1d5QpH5lXBIKaP/N1xdnbWDMIHeMtDiwqXLXkYonjAID33RhrZNLH50yl2RDGDwsEle8O5FJc8RPn+/fswaAsp2FDQIF9soGy/hsIgh6KWLU+4xjGEb/Qqviz5zK+o9VJy6CVQcijEURwlW73ShV17z9O2su1W8RMyFCnW9kB/rRU4ucaFEK+GLmSrI1LZFUIIIRKQSrZS2RVCCCESkEq2UtkVQgghEpBKtlLZFUIIIRKQSrZS2RVCCCESkEq2UtkVQgghEpBKtlLZFUIIIRKQSrZS2RVCCCESkEq2jrI7k3Pjxg1+zbPSfDY1NcUyK5mJZm5u7oMPPrh+/XqrmXDr1i2f4030kUajMTs7a6m0Xf0Pluvk+fPvLcPnysrnlutkdnaeqVtgYSlfsWF3d9+yg9IIs4E3YtZTdkQbJl1jTtGdnR1nMDNer9exI0sOB/uWfRsXDy8GWKNXIWaDcwtQfEWDi4uLTNUWoudzc3+0nKW2IxrkkXojqN/b2+Nf3EeDmefRqywfKQ3CK9Y/ePAABi0bOMocChrkMhrx8JuH+ezZtxxwGFld/SvT3NAr5sqB43aY8QTNWyrX9fV15qYxr0LMImtemcGtrS10ZBkGUWaaoXiCZi1vOMYZJwhH6g0y1Soq8xOU1aNlXOck2xHMmlfbcU2SkZERGoTnTFCMXv/931s06C+bJ0+e8LKhV6zHHu2yQUe0v3btd3nfZnakePhf1GIydNaEI/K1HovvJU4nR8lWrxxrN+adOswjhSDFAm9s28TkW1DKvOEhJodK0tZfEBdwdvb3s/xhplshX2Yhpgpr5l5nztIQzxpgwrP791etCz+ZxtPysVk9jW9sfMmznG/KwiJiriXpRoi0LvzkEhPeoOW2DjEl2+jo+yzDK2sG8WOzqFJnWKbYsA2llJn/fBhFGx47vJqcnPS50NgsZpZvZig11bdPG0MuvmH1jOC3b982xTUjFBKueGUpvEN+mLzyoc22RIb3dikSmvttGuSyUyyXc71SXbwRlLmwSYjrlnANEG/E8syF/IzPxAyLrDGppgWWTW++/vprjgkM1vJksP4weYGxPbfyWSH3GTQzy9tzALfyQJjZjiuZNGJqPZ4ULmnCwdmOeeQ5gMzY7sOROJ0cK1td0oldXn8MCjHBY92uSCswNrWlMDtUoqx+gUDTyLOJItLleTWzHNB4SI8rWixBAKanp/G1EXOQIjgi1uxkC1wcWApvE0vIYSNP/sk5B+sRDcfHJ/EVe+TUih1XV1dhEJUQHuz93/+9KSfbeWJPxi9TEcgwDcbFkjKvYBYWMJ+oxWUlYLkWM5QiAm7HZTdoEP+obXSVVx284nHFcuYVytCncxF6hXhtRkxuadDEhv9CjMKQrkbMdU6vWE/7cQ79EG243gU2xdCfjTYHil414kyaHeEDwj0PJBpsTk/hFfzECcLDpa39gkM2YeNhmm7t7u4exBzrS1mm2Uxj2Iz73cqWDfkYduIJmubxsiMOgXKI7jhBzLGONvCKs0accfMq5CcIhwlruM3jCRrn9cAThCcem0nvZeuQZLrLeTxPEBpDL82gd4aV/MyDSTZi1FTWsz01ldendbcaeyIXp5ZOZKsbOrHrH8dQbn3d0TI79FewoZeliWBA54vB27dnLAbxiR6nxhJJ+5WVavns0OKafTLwMa6ZilhLBGtOPogZxDyMa/aaToR8rsBPRnk0G8oXzWBH7I7qFbIZ7Xk3O5zzwZFlhkga5HTE+084O6RBDIKpS6EZy9hKf6yGZlG2Oat3gy+BcxvF/YbWqRsPkycI03fzyk+O4wk6XDrNb6IRrxP89JM5eoVe9rQBbStLiC9TDtEevlFf/WTOZts2O8TTjKk1DoEKal6hO7fSK3+CbNd0siyKhNHj5s3slZKvtyWgQ+sgMMhodig6ka1u6NDuwsICr0J/LeJKtZiLQImL9eLFf7Othn9Zyh8aRV+IU8Ds6T7koZyKwhBJ1WnkqzFg8PPVAbMJDcSAkQsahjK7wyA6fvNNM0SivQmSLemAMhf54+4sitlyGeiCcEblgO7aysPwCmUG0IJBxlMapFe4nB4/fkyFqGVrRzykhKNgBhtxHhPDZfZC1X5D9TEXBrkj7BdesR7Su7a29vz59yG+4H38+G9Nr178C/UmiuZVW4O1uL4j6+MCHg9pcDb79fEhAzfH02RyK1sVMptOmRFvHF6ZQXgVT1C2FgfUwryKBrOfNkM2ngd2gra3t80ghiL39kx+gs7AKxy+vXaGV3yuxaBtuYU7cDmVTxAej/zh0ys8i9h48lUEHYPleJhN/fNCyHrKav5Ys4SpLr1qZNdVc0fwCtb4e20jTkNZ38jeDG9IDkWHsvXSHGu383ebnbcUrwc640KIV8+xstUlqeyKU4NEsWuOHbpjG6Tg2J0e20CIpKSSrVR2hRBCiASkkq1UdoUQQogEpJKtVHaFEEKIBKSSrVR2hRBCiASkkq1UdoUQQogEpJKtVHaFEEKIBKSSrWq7Q5Fi7XF00UUIIYTohGrZ6p4Ku8xVQWxFi/Hx8bGxsXJiiHv37t26dcu+ssFUBPVM7e0TQIvewQna3Nws1gohxGtNhWz1RIVdk0OunMAyZO+whYOZ2KiCly5dGhv7X7bJ21H+0j7iM1gKIcQpoUK2eqLCrpcxq7TVDa2GeDlkeyaSDq2zTE0Q+8j09B2u/BBi3khm8hRCiNebCtnqiQq75869xYJPk19+TUooh/xkFmBr6eUQnD171n8V3YH5OrNaUwVrcf2dYiMhhHjtqJCtnqiwOzU1FRepuBjirM5me5ggjo2NtTSNjdkA7flm9cqVK9xE/bMuH330UbOP6I1GtlBttnhhyEXRr0AkhBCvJRWy1RN9tKv/UPrTYuOvEyGEeI3po2y1kMquEEIIkYBUspXKrhBCCJGAVLKVyq4QQgiRgFSylcquEEIIkYBUspXKrhBCCJGAVLL129/+tlglhBBCDCrvvvtusapfvPHGG8UqIYQQYvD42c9+VqzqI7/+9a+LVUIIIcTg8fbbbxer+s7vhBBCiEHl97//vd5lCiGEEEq5JYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQggxGBy7rJRvcGxjIYQQ4mQwPT3tv66tPfRfyzQaP0AF8YnyysrKuXPnUJiYmMDnzs6OfXqwFe3ZRQghhBhEDg5+tHJBGtuytLQU8pYFhdva2vJfC0gOhRBCDC6c2JFOFItCOD4+HvL2UMFHjx5zK2qePn3qmh/SiXEhhBDiVTM0NLS9/dzX1Go1/7Ut6+vr+JydnQ1uZgk7o6Pvs0ylLP+sKDkUQggxoOzsfGflgjR6JnJQ3tvbg2pS286dO7ex8SW+rqx8zh8UR0ZGjpK9o+qFEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCDAq/+tWvRkdH/00IIYQYSN57770LFy4U1au/YB/FKiGEEGIw8LmvMXNzW/rKL3/5y2KVEEIIMaj84he/KFb1BU0NhRBCnCBSyVYqu0IIIUQCUslWKrtCCCFEAlLJViq7QgghRAJSyVbvdsvr3YsBZBBOUwofUtg0ejE+FCnWtqPDZr3wCnYhxCujd9lqTyq7HWM3arnQtl43ttF2KNpWDg4p3Eths8yr2UsKjrqzXgEVe6zYJEQ1qWSrwu7s7Dz+oTA3N2eVKM9GUP7kk0/wOT09zcZzc39kvQdbl5aWQrz62Zf1f/rTn8bHx0PWsaWLfeXe6cDw8DA+6/V6iA5wj2yMr+fOnWt2zivbfp2YmIAnZ8+eRZldzM4JBUfUaPxQq9UK9f64dna+295+vrKygvFH462tr0I4g3rUXLt2jW2ikXesC0Ev/su/brduz7Bd8xQTtOROuSOCvW9tbe3t/cNq1tfXrYxNVg7OrFE4p+xL97CvkFn4CkdhDVZX/8ou2CPaYO+XL19Gg3r945Cd/bd8YyuXx5OOoTsOysI3h6LRaFizAq5X5uHw8PkQveWwFGQAdqr/jgq94lkrAjs4uqWlz0K8ntueoN3dffblru3CwGGyIw4WZbqUn/GmnadPnzatHMHGxkaxKrv27sQj3QmHJ+XwMgCbm5tosLb2EOWbN6fsDBJ6uLi46K+91dVVa4ArTToqKmSrJzqxSx0iPvCxbGLJG8xTCJcIN/z66aef2lb0okQRBqxCmeo1MzNjm7wbBeiG3TO3bt1iId9d1pEGod/cdEJ1kTHFR3YeI0KSHdHKyucs7O3tFZoRdjehso52ssjm5hMOKYbOuh8c/Ej7GHM+3ATnD9vT4Ojo+/y6vv5FiEZMAlGGHZa5U9q3sw/jFjFzUc/6Fq43Ki4K8IQW4LNtZWzlJwWAfvpPjFvIhwJeQUFpkHun/7BMs+iC5wk+qMW+zXGzIB5y2aZxP+boyK/cZF1w+PZs56XLPn19LQdluMrKkF/bIdOzb6zSHyC64FmBHaFYhaEg2Mqri2U2vnnzJms4FPv7/7TDt3vTxtyuBwKveHLtYDEIhfvOrls/hrBjlwcCkXdSnFo6ka1uqLBbj1gQpIYhBrE+xLsXt0FBDgvPbqi0QGARtlVTP7O4xpZjY2P8epQcQj7pgHni8R6yI/eLerOMee3U1JTJodfjEwTCByZ5FuJtCnX//v2QHzVCCTa9+eY5xpFnz75FPQIlIjXjvg89bIMuUVq+QkDkrBFt8jB3xs5myOYHX7ILTygnIuiOjnDMDHJHmAP5ffkZIZtRKRFhsQtGwMXFZTawjrwG2BdHsba2hgDKSw5GCsJTCJ1w0u+UPnOnHpO9kO8IezdTmPdwKOghBWY7zvlMVDAOvHRRjzLfcGAu9eDBuulHyN95sEvIhYSVPF6Omx8clp88+XtwNxpGG886phk4ZXSejTlRQxn27amCbofWhx60wZByWNDL5DCUtI1gL95DOoAynLGYYOeCFxIGgWPCLtQ/SiBreMbpiT2icVO5LE4tFbLVE9V27ZaDlty5k91CXslwL0FITFTKMzZ7C0TBs3tvYWHB2iwv/yXk9yfKuJHMztTUf7JQkMPql0uF+as3GLJd/znkQce/BD6JMGAxaiCmWEDkYK6u/tVaUhRZRoRitGV3ih8neTaVDO5kYU7QiEqDf7dvz9glgT1u52+08vP7YWgNWFBfFmzKYsLmXwCyi4U/k0PDevFA2N7PDukVLVgI9u9mWWniZ5cQLdMZtoGQ37w5xa1PnhzOL2vxveKLFwfwgWXbxHL5k7NDjrN/jCBetHyB5aH4rtXqOSB2goYiLJtu+d8RQt6FeOPBySEN+sPkMXKQ6QbrvZCH+LIB4soR9peNPyh7mvFe2anE4JgbIe9i89fgzm95qMUpp1q2uqfCLn+ZY9lP7OwnwHzW1RSbshyy8u7du1euXGHZ2iwuLrK8vJzdM5ir4ca7evVqcIHDZn40wjK5d+9eiB6Cixcv+k3eDUY9Tv5Qj9uSdvKXpUe+5j0R8BE+f12ZHTVjDUTIXpQ14oM2hhThDAULkZjYca6AIeJEMMSfi/D8jmgY4s9OpnbBvQSDQWxigTXojgHEp80PrCNmb7YjbDVrsdeWle13OFhuxF/v4BW8tV2wo4Vmqhca5z9SHnoVWoUHDVjPseIbY3pIrxCycciMws+ff4829go6/vCWOUlhMJv2snQ7nzVykKkNeHpAL/rAMaS3HBP+MocCGl+7dg1nyjxhPQ3CTxiM9We4d16xqMR4Fn5JDa0eomBnGRbMQzMenD7BINzju1Zsxfmy28dU1ncM+VmwF8gIAnHc1vjow/GEh7jeePicHHOIzmW/cWbjQINeDsfHJ+EJx5CXjZsdHv5M6z0Rp5YK2eqJVHbF64vJ0iuk5b9jHMWxjh3b4FiihbIz5Zr2VDtgW12zFsvV3QeB7jxkr+76ilNIKtlKZVcIIYRIQCrZSmVXCCGESEAq2UplVwghhEhAKtlKZVcIIYRIQCrZSmVXCCGESEAq2UplVwghhEhAKtlKZVcIIYRIQCrZ6ovd6j8YavfXVOJVUD3yFVvLNUdVHkt3vTqhbLlck5pO9shkPSEmf7DsPD5XgE+Bdu3a76zsM6gJIYy+yFYbOrE7NzeHO5PpY5aWlm7cuMG8GPPz86hnghjUT0VYHhsbY86XhYWFer1+5cqVTgKH6JyhmCSTCwgUNqHe0ow9e/Yt04uMjIwsLi5bApSZmT8w2QcqYYSZU9jRElHOzs4zMVDMV9LMUQILlnXMG4SRPNXItHmFrfX6x2YQ9fPz/xViWhkziK2WZmV9/Qvm2FxcXIweZgYhJ2YQn/Awz7TSQJnJUekVE4nBoHkFg5ubmyEmMDIP4bkd5rNnz7AjJho8OPgR9Za2GxewpRwzg9jKTG84LowPDXqvmOONXoXWPNqXL19mwXLFhWjHbg2fcoVnR3eNEGU6ka1uqLB769YtJnPyuT2Zw4lpz5hElEtG+NRofKpFKLl06RJrGFYQrbgmlOgLS0ufURRDntCOSci4otDKyueWfA7xmom7ahFoJDpaNjL7ZI2FfjM+OTkZYl43W9PAusAadk019Wm7+cl6M2j1BF6Nj2eWQ7RDwcP8CdcbvbWEziFPQEpT1BguUOUN2hoL0H5chH5FCxq8fTu7YtmFpry3lnPVvDLj8ApqahJum+Klfob+MEuZN9iI+dIaMe1cI+ZRs53i30RccYzl0JqO1ZeFEAUqZKsnynbtgdRSjJblMMSIg/kiHroxWWS9PU0jJOEr3wuNjo4ySbfoOwjQ0L/tuJzC/furPnpyEgM5RMxFcGeWSEZt1PArM0Yi8jJTKIxwmQuqCE4fBNWLKLQNXXBC2RFdHj16RDfQBS350o9Bn9oGN/DVJkP8Sh9gB81QqNXe4XpD2ARBxX4pEvDKJmfm1U5MwkmZj7r+jAZhrR5X/0ElLzxOeSGoZsSSmjai0tjTAP8N5ek3G1EO6RWN8yUnvEIXzAjNoC0NyOPirYGCeRXc/cJexOu0z5drvQplIYSnLFv9ocLup59+yvlfQQ4ROBhxuLWQyNvgK1aW+aJV9BfI1VBcAzbE1ZItcTOnTYiz1C3w9deHARpxmbpouZVDPnnC/C/kUzqeYm6lnTg7bL6DDXG6xicnTKooLZxUWSLvkM/AaLY8mcOOTCQwo6WCwiaEjUZGR9/PuzRnYDxYXmymvk1zcXYYMs/fCvGy5H5JWWns/XDIfTY9s/UuuJVDAa+YLZ1H7Q3mCzscTo7tXBwrh/5hseykEKJMhWz1xFF2LSKMRUzYJiK+DZehYD03vfnmm7YYE4KgLcALCqtPiF7ALNwH1pAHX8xsHj16zBpMcewVHyptKQOIgf23js3NTRZiuWkQYmNGEMptER9YWFtbYxkNqKkhdrSI772yMraawZUMM3jHDMLVxcVFluGVXYQFg/Qch2n15hW0CgbNK+zFGXxi/2nlKA9ZphHzCr3MiPe81eCmjacdZsg1Gwb9Akl2FqwB8c+UeoIU4iiOkq1eKdut+PW+YlMB37LQq3MjYhBIer6SGg892O+6YzW6F4TonbJs9Yde7OpmHigG8HRUPBX1TrXB6q1tedku5faF4y03EEL0Ti+yVUUqu0IIIUQCUslWKrtCCCFEAlLJViq7QgghRAJSyVYqu0IIIUQCUslWKrtCCCFEAlLJViq74oTwUv/589gGFbxU35dqLE4K5dNarhHiWFLJVid2dcm+fpysczrI3vboW6F7j9aMftnphaGYvsqyEwjRLzqRrW7oxG69/nGIOVBCnmIRZWbxtjwarC+nartz547P8Sb6iE9C7WEaGpwjpisLMWEeM5YxcQyTrjHtGbuXP5k5henHmHSUKYdggaF2fX095FcFU6tYWtHQmqotfp7hFeK95YVRq73Dr3GPZ4YjbHb//mqImb5Dq8H9/Sz7KL1iDWIuvOIu6vU6D7M1pVyW3JwNHj/+m3XkJw/TDwgP8+HDbCThGL2KZs/QIFPFWqK4oTxbXmuOup2hPA06XWJmOAKfWclM5dzkM8+VR5JlZoOzE2R5bXiC4CczrT94kJ0gy7Aa8hP0/Pn3VkPPuWvmwYFBdhmK2fJombvgZeMP0+d85xIcNGurrDAzH/sOZUlxD5fyCK3hwl8Y1fgsr+J00olsdcNRdv3Tpb/+rJyrY/OCvn79urUp4OWQGd1EX0CIgeDlCpGl67TsX4hoMYV3dnYQs5izO8QoNhFTeIdWPeAnFc4CE1paKIdUxBTemX2fnHN3d58pvNsa9HlBQ8zqx/gbYiazuKJFFmeZF9siKa6xsinbauWRkRFIqWUHhVeNmMI7tHpVXrnCf7I7P3G8kKhGlsI78woqZZ7DILxi9OcKUNz04sUBPp88+bs3aMeC4aJBemULQoV4IPEEHT4ieH+otVZvBi2rKo3wBPEw4wnasuzqZoqJyxtx2AtehXjGfbbb0dH3G3lyc1jjCWJH86HsLY+CZZzxqan/5FZ04ZCGmLf2XLYqSMb4+CSfPJhWt6n3L/6FBnxq8cafPfsW9f5CkhyKo2SrV9raLbxpWYoLCVl5amqKt3f82pRDewwsMz/fTCAp+gsjBcI9z46to8RYw2jLCMKFINgAEQoFBEFqG4KOrVyB8FfL83ZyuQbW0yBXtKDBEGMTDcIOuszOzjKFdyNb6SKTuhBnEpBAhtfyZJTRlvGa0TbP0J25DXmzmY15xckQr7qyQbbc3d2NXmVyyCkLN1kOUjazFS1s5QoYzOVwsuBniF6hC2tCHBmb6mEWOJGt1nSoCt4gRgm746GxnkEfUoQuJkXYxHlbbPCPKByH2pYbfOqfG1gfDzOriXI4bR423DKN2AvOOE8QveL59RNQ1jSiHEKcuAuMNheuyk/QHi+bRnaCPucJQkc7QVyu0nwoBIqluFYJa6zST4g5+V53k0gMciOukxUOc9MfzinF6aStbPWBTuzyBiCFa9G+2iLAfivh2qqi7zAcW/yNeauzaILp+FBcrsiCEaSF4kH4do6vTxmG+MkpZqO52tGHITfOBNa3b9/2eah9Fmyu38so5gyeoUEGbmZ199GQs0yzaamxGXmHYh7t0Pp2jt1xLEP5q1FvMH9LnC33GHKvCJuZHoTcrD98E0jrxRG2t8Q+3Ta7800vu5Tn3JxHwvOhPIW36VNornKVLdnBw2R3ewII7U4Qd+q9amQLdTVvT9jhXmjWv5j1B+hnWjRoz0mst+Ue7b0OveIJ8m8CvOfeT9N4drRT3MhWv8rElfAM+mH3Z5w7Yt/c/+yBpm2QEaeKTmSrGzq0e+PGDV7ZvGfIRA6/YtZomwwEgrGxMfuqFS36i61WQRgpbOoTYnyh+IUYziygo4H9HwdvxMreyMjIiD3TIPhSxkK+8jvLRxtszsmO8uo//qO5cFKIHtpiFN6gny60etg07r0az5jkjBnWLKajoz0ftD1kRF4rxxXtD+XZvMKOTGXjeDaVA57YG5S2xuGTGVyKi4OyjKGwX09xCHwKCVXj2eYEea9mZv5gtyQMeg/bGlxd/SsL3iCM4ATxiFZXV2kEX+0QQjwp+Y/TZ6zjUL6sNDEh9OMZD+0tPrFhWOgVxiR6e3h9cu94isKh8cLGdeivYXFq6VC2XppUdoUQQogEpJKtVHaFEEKIBKSSrVR2hRBCiASkkq1UdoUQQogEpJKtVHaFEEKIBKSSrVR2hRBCiASkkq1UdoUQQogEpJKtVHaFEEKIBKSSrQq7P//5z61cq9Xsb3hHR0et3kADJvW2r/w0DpuK/lFIpyeEEK89FbLVExV2qX9DeWJ7Jphg2nufaIYwMdjMzAwD9MLCgm0yHV1Y+HNZFxXQu2Z3d399/QufBEQIIV57KmSrJyrsmoz5FPLMPBlKMsakU8ylND//X36r2YGIFvINSgt7wad4ZipIJfsXQrz2VMhWT1TYbSuHRy1eOD8/P5RlVV6Kn5+hwKTeocVOxmEf0RsrK59DEZlA2dYIFEKI15sK2eqJCrtXr17lL4LDw+dHR0c5F8HsEPJmeYENyOSVK1eofGfP/o8QX41yEyvtNenkZLGv6A6/ggRE0S8xIYQQrysVstUTqeyK9Fy+fBlamD9tZKsicKYohBCvMalkK5Vd8VOg32KFEK89qWQrlV0hhBAiAalkK5VdIYQQIgGpZCuVXSGEECIBSWRraGgoiV0hhBAiDalkK5VdIYQQIgGpZOvChQvFKiGEEGJQeeutt4pV/eLdd98N+j/6QgghBp5UU0Mj+Q6EEEKI3mi7nlKf4dTwl5FfCCGEEANGUbcSoTelQgghBhMplBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQfeP/Ay8aAJG6vT7dAAAAAElFTkSuQmCC>