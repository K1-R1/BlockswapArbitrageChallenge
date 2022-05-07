const axios = require('axios');
require('dotenv').config();
const { ethers } = require("ethers");
const { getFinalisedEpochReport, reportBalanceIncrease, authenticateReport } = require("@blockswaplab/stakehouse-sdk");

const BEACON_NODE = process.env.BEACON_NODE; //Infura end point
//For use in 'reportBalance' function
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const INFURA_PROJECT_SECRET = process.env.INFURA_PROJECT_SECRET;
const PRIV_KEY = process.env.PRIV_KEY;

const main = async () => {
  //1.Get data from subgraph
  const subgraphData = await getSubgraphData();

  //2.Iterate through each KNOT in subgraphData, get the beacon chain info for the validator at same address
  const arbitrageOpportunities = []; //Array of objects, each object holds info about an arbitrage for a specific KNOT
  for (let i = 0; i < subgraphData.length; i++) {
    const validatorData = await getBeaconChainData(subgraphData[i].id);

    //3.Check validator has a balance of at least 32 ETH and has accrued some ETH rewards
    const validatorBalance = validatorData.data.balance; //in gwei
    if (validatorBalance > 32 * (10 ** 9)) {

      //4.Check for discrepency between validator rewards and totalDETHRewardsReceived
      const knotDETHRewards = subgraphData[i].totalDETHRewardsReceived; //in wei
      const validatorETHRewards = (validatorBalance - (32 * (10 ** 9))) * (10 ** 9) //validatorBalance - 32ETH stake, in wei
      if (validatorETHRewards > knotDETHRewards) {

        //5.Arbitrage opportunity identified
        console.log('\n----------------Arbitrage opportunity identified----------------\n');
        console.log(' - KNOT Address:', subgraphData[i].id);
        console.log(' - Validator balance (gwei):', validatorBalance);
        console.log(' - Validator ETH rewards (wei):', validatorETHRewards);
        console.log(' - KNOT dETH rewards (wei):', knotDETHRewards);
        console.log(' - Value discrepency (wei):', validatorETHRewards - knotDETHRewards);

        arbitrageOpportunities.push(
          {
            knotAddress: subgraphData[i].id,
            validatorBalance: validatorBalance,
            validatorETHRewards: validatorETHRewards,
            knotDETHRewards: knotDETHRewards,
            valueDiscrepency: validatorETHRewards - knotDETHRewards
          }
        );

        //6. Execute arbitrage
        //executeArbitrage()
        //Description of this function is below
      }
    }
  }
  return arbitrageOpportunities;
}

//Querys protocol subgraph, returns array of objects; each with data about a specific KNOT
const getSubgraphData = async () => {
  try {
    const result = await axios.post(
      'https://api.thegraph.com/subgraphs/name/bswap-eng/stakehouse-protocol',
      {
        query: `
                {
                    knots(where: {
                      isPartOfIndex: false
                    }) {
                      id
                      totalDETHRewardsReceived
                    }
                  }
                `
      }
    );
    return result.data.data.knots;
  } catch (error) {
    console.error(error);
  }
}

//Queries beacon chain about a particular validator, returns object with data about selected validator
const getBeaconChainData = async (blsPubKey) => {
  try {
    const result = await axios.get(
      `${BEACON_NODE}/eth/v1/beacon/states/finalized/validators/${blsPubKey}`
    );
    return result.data;
  } catch (error) {
    console.error(error);
  }
}

const executeArbitrage = async () => {
  //Unfortunately I haven't got time to implement and test the execution of the arbitrage;
  //so I will describe the approach I would have taken below:

  //My understanding of the execution of the arbitrage opportunity is that; for a given stakehouse, 
  //an increase in the total dETH will lead to an increase in the valuation of SLOT against ETH(dETH).

  //As such the 'trade' is:
  //ETH(or dETH) to SLOT -> report dETH increase -> SLOT value increases (in ETH) -> SLOT to ETH

  //In order to perform the trade; the stakehouse that the KNOT, that has an abritrage opportunity, is in,
  //must be known. I beleive that this can be acquired from the protocol's subgraph by adding in 'stakeHouse' 
  //alongside 'id' and 'totalDETHRewardsReceived' in the query in 'getSubgraphData'

  //The execution of this trade would look something like:
  //1. Acquire SLOT in the same stakehouse as the KNOT that has an abritrage opportunity, using ETH
  //  - I'm unsure if SLOT can simply be acquired, or whether you must stake a validator in the same stakehouse

  //2. Report updated balance of KNOT
  // - The functionality for this is implemented in the 'reportBalance' function below

  //3. Sell SLOT back to ETH

  //Of course, care must be taken to check that the gain in ETH is greater than gas cost of the transactions; 
  //as such addional checks before the trade could be made using the calculation:
  //total dETH/ total SLOT = sETH
}

const reportBalance = async (blsPublicKey, stakehouseAddr) => {

  const STAKEHOUSE_ADDRESS = stakehouseAddr;
  const BLS_PUBLIC_KEY = blsPublicKey;

  const provider = new ethers.providers.InfuraProvider("goerli", {
    projectId: INFURA_PROJECT_ID,
    projectSecret: INFURA_PROJECT_SECRET
  });

  const signer = new ethers.Wallet(PRIV_KEY, provider);

  const finalReport = await getFinalisedEpochReport(BEACON_NODE, BLS_PUBLIC_KEY);

  const authReport = await authenticateReport(finalReport);

  const tx = await reportBalanceIncrease(signer, BLS_PUBLIC_KEY, STAKEHOUSE_ADDRESS, authReport);
}

main(); 