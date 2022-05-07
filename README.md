# BlockswapChallenge 

[Challenge on HackMD](https://hackmd.io/@vdengltd/HJ7j70kLq)

## Working Notes
My understanding of the challenge is that it is primarily a problem of data acquisition and data analysis. As the challenge stated; the objective is to create a script in order to automate the process of identifying arbitrage opportunities by comparing information from the beacon chain and data from the protocol’s subgraph. Specifically; ETH rewards that validators have gained on the beacon chain that haven't been reported on the stakehouse protocol.

### Aproach to solve
My planned approach to solving this challenge is as follows:
- Get a general overview of the stakehouse protocol by researching the docs
- Create functionality to acquire data from the subgraph and beacon chain
- Create functionality to prepare and compare data from each source

The implementation of my approach was as follows:
1. Acquire data about KNOTs. As the query for KNOTs from the subgraph that was provided in the challenge provided a filtered list, I decided to start with this data.
2. Iterate through each KNOTs data, using the KNOTs public key to query the beacon chain via infura, in order to get data about the validator.
3. Filter out validators that did not meet the challenge requirment of having a balance of at least 32 ETH, I additionally filtered out those that had not accrued any additional ETH rewards
4. Prepare the data for comparison, ensuring that the units are in wei
5. Check for a discrepency between ETH rewards earned on the beacon chain and the reported balance on the protocol
6. Display informatation about arbitrage opportunity, and store said information in an array for later use

### Ideas for further improvement
Unfortunately I haven't got time to fully implement the functionality for executing the arbitrage opportunities identified by the scripts; I have decsribed the approach I would have taken in the `executeArbitrage` function in the `solution.js` file.
Other improvements might include:
- Having script run on a timer, to regularly check for opportunities. Or looking into use of a websocket, to trigger script when beacon chain validator data changes

### Running the script
1. Install dependencies
2. add `.env` with the following: 
- `INFURA_PROJECT_ID`
- `INFURA_PROJECT_SECRET`
- `PRIV_KEY` : Private Key being used here is the key of the ETH account paying for the GAS to do the balance report
- `BEACON_NODE`: Infura endpoint
3. run with command: `node solution.js`
