import { ImmutableX, Config} from '@imtbl/core-sdk';
import { generateWalletConnection } from '../libs/walletConnection.js';
import https from "https";
import readline from "readline";

//Helpers to change between WEIs and full ETHs
let singleFullTokenInMinimals = 1000000000000000000n;
let minimumMultiplier = 100000000n;
//Gods unchained cards
let collectionAddress = "0xacb3c6a43d15b907e8433077b6d38ae40936fe2c";
let tokenAddresses = {
  //For multiple currency buys and sells
  ETH : "ETH",
  IMX : "0xf57e7e7c23978c3caec3c3548e3d615c346e79ff",
  GU : "0xccc8cb5229b0ac8069c51fd58367fd1e622afd97"
};
let priceGods = 0;
let priceEth = 0;
let itemsToList = {};
//IMX setup for wallet, see walletConnection.js for seed.
const walletConnection = await generateWalletConnection('mainnet');
const imxClient = new ImmutableX(Config.PRODUCTION);
//Constructs a command line "ask" to confirm the listings before making sell orders
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});



//RUN THIS IF YOU HAVE NOT REGISTERED THE WALLET IN IMX BEFORE
// await imxClient.registerOffchain(walletConnection);

// SET UP YOUR TRADE PARAMETERS
const avgPriceFromXListed = 3;
//Discount needs to be at least 7% for lowest listing, to account for protocol fees(2%) and royalties(5%)
const discountPercentFromAvg = 5;
const maxListsPerCard = 1;

//Sets maker/taker fee to every trade. 
const feePercentageToCreator = 0.1;

//Max price in ETHs. Use full names of items for precise buys. 
//Max maxAmount is 100 for now, do multiple calls for more buys
const buySettings = {
  ["Academy Apprentice"] : {maxPrice : 0.000013, maxAmount : 2},  
  ["on her command"] : {maxPrice : 0.00001, maxAmount : 1} 
};

//QUALITY ONLY FOR METEORITE DO NOT MODIFY
let quality = ["Meteorite"];

//Choose which filters to use
let userFilters = {set : false, rarity:false, name: false}

//core, etherbots, genesis, promo, trial, mythic, order, mortal,
//verdict, wander, welcome, wolf
let cardSet = ['wolf', "genesis"];
let rarity = ['rare', 'common', 'epic', 'legendary'];
let tokenNames = ["hortuk"];

//YOUR WALLET ADDRESS
const userAddress = await walletConnection.ethSigner.getAddress();

//Uncomment the ones you want to use (Remove the "//")

//actionBuy()
//actionList()

//Operates buy every 300 seconds
//setInterval(300000, actionBuy);

//Tip amount in ETH
//tipJese(0.002)





async function actionBuy(){
  await makeBuys()
}
async function actionList(){
  //Main function, gathers data, prints the trades, and asks user to accept, proceeds to list all the cards if accepted
  await getPrices();
  await getAssets();

  printSellSet();

  rl.question('Accept prices? (yes / no)', (stringAccept) => {
    if(stringAccept == "yes"){
      console.log("Listing items")
      listAllInList();
    };
    rl.close();
  });
}

async function makeBuys(){
  //Gets listings for the amount you want to buy, starts buying from the cheapest one, until price is higher than limit
  for(const key in buySettings){
    let buyThese = await getListings(key, buySettings[key].maxAmount);
    for(const count in buyThese){
      let currentOrder = buyThese[count];
      if(BigInt(currentOrder.taker_fees.quantity_with_fees) > (BigInt((buySettings[key].maxPrice)*parseFloat(singleFullTokenInMinimals)))){
        console.log("No more to buy " + key);
        break;
      } else {
        try{
          let responsed = await imxClient.createTrade(walletConnection, {
          order_id: currentOrder.order_id,
          user: userAddress,
          fees: [
        {
          address: '0x691ea670f75dac6d42047873e6e486c6a8def546',
          fee_percentage: feePercentageToCreator,
        },
      ],
        })
        console.log(responsed)
        console.log("Bought " + (count) + " of " + key);
      } catch(error){
        console.log(error);
      }
    }
  }
}}


async function listAllInList(){
  //Goes through the list of items and creates listing for each token id
  for(const key in itemsToList){
    let priceToList = itemsToList[key].price;
    for(const count in itemsToList[key].ids){
      console.log(priceToList)
      await createListing(priceToList, itemsToList[key].ids[count])
      console.log("listed " + key + " - " + (count));
    }
  }
}

async function createListing(sellPrice, id){

  const listingParams = {
    user:userAddress,
    buy: {
      type: 'ETH',
      amount: sellPrice.toString()
    },
    sell: {
      type: 'ERC721',
      tokenAddress: collectionAddress,
      tokenId: id.toString(),
    },
      fees: [
        {
          address: '0x691ea670f75dac6d42047873e6e486c6a8def546',
          fee_percentage: feePercentageToCreator,
        },
      ],
    
  };
  try {
    const orderResponse = await imxClient.createOrder(
      walletConnection,
      listingParams,
    );
    console.log('orderResponse', orderResponse);
  } catch (error) {
    console.error(error);
  };
};

async function getAssets(){
//Gets all the items user wants to sell. 

  let assetCursor = "";
  let assets = [];
  let filters = { user: userAddress, cursor: assetCursor, status: 'imx',
  collection: collectionAddress, includeFees : true, pageSize : 100 };
  let metadatas = {};
  if(userFilters.quality){
    metadatas['quality'] = quality;
  }
  if(userFilters.set){
    metadatas['set'] = cardSet;
  }
  if(userFilters.rarity){
    metadatas['rarity'] = rarity;
  }
  if(userFilters.name){
    let namesArray = []
    for(const count in tokenNames){
      console.log(tokenNames[count])
      namesArray.push(encodeURIComponent(tokenNames[count]));
    }
    filters['name'] = namesArray;
  }

  filters['metadata'] = encodeURI(JSON.stringify(metadatas));

  try {
    await getResult(filters);
  } catch (error) {
    console.log("Try with tighter filters");
    console.error(error);
  }

}

async function resultToObj(result){
  //Makes the result in to a  Obj format with name : {ids : [], price: bigint}, easier to work with

  for(let i = 0; i < result.length; i++){
    if(itemsToList[result[i].metadata.name] == undefined){
      itemsToList[result[i].metadata.name] = {ids: [], price : 0n};
      (itemsToList[result[i].metadata.name].ids).push(result[i].token_id);

      itemsToList[result[i].metadata.name].price = ((await getListingAvgPrice(result[i].metadata.name, avgPriceFromXListed)) * (100n-BigInt(discountPercentFromAvg)) / 100n)/minimumMultiplier*minimumMultiplier
    } else if ((itemsToList[result[i].metadata.name].ids).length < maxListsPerCard){

      itemsToList[result[i].metadata.name].ids.push(result[i].token_id);
    }
  }
}

function printSellSet(){
  for(const key in itemsToList){
    let itemPrice = parseFloat(itemsToList[key].price) / parseFloat(singleFullTokenInMinimals);
    console.log(key + " x " +  itemsToList[key].ids.length + " for eth/usd " + itemPrice.toFixed(7) + " / " + (itemPrice*priceEth).toFixed(3) + "$");
  }
}
async function getResult(filters){
//helper function for getting users items for sale, uses cursor and recursion
  try {
    const assetResponse = await imxClient.listAssets(filters);

    filters['cursor'] = assetResponse.cursor
    
    await resultToObj(assetResponse.result);
    if(assetResponse.remaining != 0){
      await getResult(filters)
    }
  } catch (error) {
    console.error(error);

  }
}


async function getListingAvgPrice(cardName = "", x = 3){
  //Looks for the cheapest X listings, returns the average price
    return new Promise((resolve, reject) => {
      const optionsApi = {
        hostname: 'api.x.immutable.com',
        path: ('/v3/orders?status=active&sell_token_address=0xacb3c6a43d15b907e8433077b6d38ae40936fe2c&order_by=buy_quantity_with_fees&direction=asc&buy_token_type=ETH&' 
        + "sell_token_name=" + encodeURIComponent(cardName) + "&page_size="+x+1),
        method: 'GET'
      };
  
      const req = https.request(optionsApi, res => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk.toString();
        });
  
        res.on('end', () => {
          let priceSum = 0n;
          const response = JSON.parse(body);
          for(let i = 0; i < x; i++){
            priceSum = priceSum + BigInt(response.result[i].taker_fees.quantity_with_fees);
          };
          resolve(priceSum / BigInt(x));
        });
  
        // Handle errors
        req.on('error', error => {
          console.error(error);
          reject();
        });
      });
  
      // Send the request
      req.end();
    });
}
async function getListings(cardName = "", x = 10){
  //Gets listings to buy.
    return new Promise((resolve, reject) => {
      const optionsApi = {
        hostname: 'api.x.immutable.com',
        path: ('/v3/orders?status=active&sell_token_address=0xacb3c6a43d15b907e8433077b6d38ae40936fe2c&order_by=buy_quantity_with_fees&direction=asc&buy_token_type=ETH&' 
        + "sell_token_name=" + encodeURIComponent(cardName) + "&page_size="+x),
        method: 'GET'
      };
  
      const req = https.request(optionsApi, res => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk.toString();
        });
  
        res.on('end', () => {
          const response = JSON.parse(body).result;
         
          resolve(response);
        });
  
        // Handle errors
        req.on('error', error => {
          console.error(error);
          reject();
        });
      });
  
      // Send the request
      req.end();
    });
}

async function getPrices(){
  //Calls coingecko api for current price of tokens
  return new Promise((resolve, reject) => {
    const optionsApi = {
      hostname: 'api.coingecko.com',
      path: '/api/v3/simple/price?ids=ethereum,gods-unchained,immutable-x&vs_currencies=usd',
      method: 'GET'
    };

    const req = https.request(optionsApi, res => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk.toString();
      });

      res.on('end', () => {
        const data = JSON.parse(body);
        
          priceGods = data['gods-unchained'].usd;
          priceEth = data.ethereum.usd;
        resolve();
      });

      // Handle errors
      req.on('error', error => {
        console.error(error);
      });
    });

    // Send the request
    req.end();
  });
}

async function tipJese(amount){
  try {
    const transferResponse = await imxClient.transfer(walletConnection, {
      receiver: '0x691ea670f75dac6d42047873e6e486c6a8def546',
      type: 'ETH',
      amount: (BigInt(amount*parseFloat(singleFullTokenInMinimals))/minimumMultiplier*minimumMultiplier).toString(),
    });

    console.log('Thanks for the tip!')
  } catch (error) {
    console.error(error);
  }
}
