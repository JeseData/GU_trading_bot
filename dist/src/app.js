import { ImmutableX, Config} from '@imtbl/core-sdk';
import { generateWalletConnection } from '../libs/walletConnection.js';
import https from "https";
import readline from "readline";

//Helpers to change between WEIs and full ETHs
let singleFullTokenInMinimals = 1000000000000000000n;
let minimumMultiplier = 100000000n;
let currencyString = "";
let currencyChosen = "";
let collections = {
  ["Gods Unchained Cards"]: "0xacb3c6a43d15b907e8433077b6d38ae40936fe2c",
  ["Guild of Guardians Heroes"]:"0xee972ad3b8ac062de2e4d5e6ea4a37e36c849a11",
  ["Guild of Guardians Other"]:"0x56a900b85d309e0a981d59377ea76f12dcd4b8de",
  ["Guild of Guardians Pets"]:"0xf797fa8b22218f4a82286e28a2727cd1680f4237",
  ['Cross The Ages']: "0xa04bcac09a3ca810796c9e3deee8fdc8c9807166",
  ["Illuvium Land"] :  "0x9e0d99b864e1ac12565125c5a82b59adea5a09cd",
  ["Hro"]:"0x8cb332602d2f614b570c7631202e5bf4bb93f3f6",
  ["Illuvitars"]:"0x8cceea8cfb0f8670f4de3a6cd2152925605d19a8",
  ["Book Games"]:"0xac98d8d1bb27a94e79fbf49198210240688bb1ed",
  ["Gods Unchained Cosmetics"]: "0x7c3214ddc55dfd2cac63c02d0b423c29845c03ba"
  }

let tokenAddresses = {
  //For multiple currency buys and sells
  ETH : "ETH",
  IMX : "0xf57e7e7c23978c3caec3c3548e3d615c346e79ff",
  GODS : "0xccc8cb5229b0ac8069c51fd58367fd1e622afd97"
};
let priceImx = 0;
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

//___________________________________________________________________________________________________________________________________________________

//RUN THIS IF YOU HAVE NOT REGISTERED THE WALLET IN IMX BEFORE
// await imxClient.registerOffchain(walletConnection);


//Choose collection, you can add your own, just find the collection address from immutascan.
//If you use collection other than 'Gods Unchained Cards', metadata filters dont work, only the "name". Unless you set the metadata filters by yourself to fit the collection
let collectionChosen = collections['Gods Unchained Cards'];

//ETH, IMX, GODS
//IMX and Gods have lower volume and unstable prices, Only change this if you know what you are doing
setCurrency("ETH")

// SET UP YOUR TRADE PARAMETERS
let avgPriceFromXListed = 3;
let discountPercentFromAvg = 5;
let maxListsPerCard = 1;

//Sets maker/taker fee to every trade, feel free to modify. 
let feePercentageToCreator = 0.1;

//Max price in Currency chosen. Use full names of items for precise buys. 
//Max maxAmount is 100 for now, do multiple calls for more buys
let buySettings = {
  ["Academy Apprentice"] : {maxPrice : 0.0001, maxAmount : 2},  
  ["on her command"] : {maxPrice : 0.00001, maxAmount : 1} 
};

//QUALITY ONLY FOR METEORITE DO NOT MODIFY
let quality = ["Meteorite"];

//Choose which filters to use (DO NOT CHANGE QUALITY UNLESS YOU KNOW WHAT YOU ARE DOING)
let userFilters = {set : false, rarity:false, name: false, quality:true}

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
//setInterval(actionBuy, 300000);

//Tip amount in ETH
//tipJese(0.002)


// TRIPLE CHECK THE WALLET ADDRESS BEFORE USING THIS COMMAND, IT WILL SEND ALL NFTS OF THE CHOSEN COLLECTION
//transferAllAssets("0x....");


//Example for saved settings
//You can store multiple of these in the code. Only run one at a time.

//savedSettingsBuyExample2();

function savedSettingsListExample1(){
  collectionChosen = collections['Gods Unchained Cards'];
  setCurrency("GODS");
  avgPriceFromXListed = 3;
  discountPercentFromAvg = 5;   
  maxListsPerCard = 1;
  feePercentageToCreator = 0.1;
  userFilters = {set : false, rarity:false, name: false, quality:true}
  cardSet = ['wolf', "genesis"];
  rarity = ['rare', 'common', 'epic', 'legendary'];
  tokenNames = ["hortuk"];
  actionList();
}
function savedSettingsBuyExample2(){
  collectionChosen = collections['Guild of Guardians Heroes'];
  setCurrency("ETH");
  feePercentageToCreator = 0.1;
  buySettings = {
  ["arkus"] : {maxPrice : 0.023, maxAmount : 1}
  };
  actionBuy();
}
//_____________________________________________________________________________________________________________________________

function setCurrency(currency){
  currencyChosen = tokenAddresses[currency]
  if(currencyChosen == "ETH"){
    currencyString = "buy_token_type=ETH";
  } else {
    currencyString = "buy_token_address=" + currencyChosen;
  }
}

async function transferAllAssets(toAddress){
  maxListsPerCard = 1000;
  let assetCursor = "";
  let assets = [];
  let filters = { user: userAddress, cursor: assetCursor, status: 'imx', collection: collectionChosen, pageSize : 100 };

  try {
    await getResult(filters);
  } catch (error) {
    console.log("Try with tighter filters");
    console.error(error);
  }

  let arrayOfSend = [];
  for(const key in itemsToList){
    for(const count in itemsToList[key].ids){
      arrayOfSend.push({receiver: toAddress, tokenId: (itemsToList[key].ids[count]).toString(), tokenAddress: collectionChosen})
    
    }
  }

  rl.question('Do you really want to send all of the chosen collection to ' + toAddress + ' (yes / no)', (stringAccept) => {
      if(stringAccept == "yes"){
        imxClient.batchNftTransfer(walletConnection, arrayOfSend);
      };
      rl.close();
    });
};



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
      await createListing(priceToList, itemsToList[key].ids[count])
      console.log("listed " + key + " - " + (count));
    }
  }
}

async function createListing(sellPrice, id){

  let listingParams = {
    user:userAddress,
    buy: {amount: sellPrice.toString()},
    sell: {
      type: 'ERC721',
      tokenAddress: collectionChosen,
      tokenId: id.toString(),
    },
      fees: [
        {
          address: '0x691ea670f75dac6d42047873e6e486c6a8def546',
          fee_percentage: feePercentageToCreator,
        },
      ],
  };
  if(currencyChosen == "ETH"){
    listingParams.buy['type'] = 'ETH';
  
  } else {
    listingParams.buy['type'] = "ERC20";
    listingParams.buy['tokenAddress'] = currencyChosen;
  }

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
  collection: collectionChosen, includeFees : true, pageSize : 100 };
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
  if(collectionChosen == collections['Gods Unchained Cards']){
    //Metadata filters only apply to GU cards.
    filters['metadata'] = encodeURI(JSON.stringify(metadatas));
  }
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
  let priceString = "";
  let priceTokenChosen = 0;
  switch(currencyChosen){
    case tokenAddresses.ETH:
      priceString = "$eth";
      priceTokenChosen=priceEth;
    break;
    case tokenAddresses.IMX: 
    priceString = "$imx";  
    priceTokenChosen=priceImx;
    break;
    case tokenAddresses.GODS: 
      priceString = "$gods";
      priceTokenChosen=priceGods;
    break;
    default: 
      priceTokenChosen = 0;
  }
  for(const key in itemsToList){
    let itemPrice = parseFloat(itemsToList[key].price) / parseFloat(singleFullTokenInMinimals);
    console.log(key + " x " +  itemsToList[key].ids.length + " for " + priceString + "/usd " + itemPrice.toFixed(7) + " / " + (itemPrice*priceTokenChosen).toFixed(3) + "$");
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
        path: ('/v3/orders?status=active&sell_token_address=' + collectionChosen + '&order_by=buy_quantity_with_fees&direction=asc&' + currencyString +'&' 
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
        path: ('/v3/orders?status=active&sell_token_address=' + collectionChosen + '&order_by=buy_quantity_with_fees&direction=asc&' + currencyString + '&' 
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
          priceImx = data['immutable-x'].usd;
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
