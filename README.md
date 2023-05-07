This tool will do automated massive listings and buyings for you.
Not suitable for sniping.

To use:

You need to have Node.js installed. (https://nodejs.org/en). Version 18 should work.

Clone the repository. 

To set up your wallet, you need to insert your private key and Alchemy api key at the /dist/libs/walletConnection.js (Lines 11 and 12). Register to Alchemy for the api key (https://alchemy.com).

Then set the trading parameters at /dist/src/app.js. All the settings are found in lines 43-130. Read carefully! Save the changes.

Finally run the script by calling "node dist/src/app.js" in command line from the main folder. (open cmd and call "cd home/user/..../GU_trading_bot")

In case you want to create the node project 'from scratch', run in command line:  
mkdir gu_lister  
cd gu_lister  
npm init  
npm i @imtbl/core-sdk@1.0.1  

Then copy from this repository, 'package.json' to the main folder, and 'dist' folder as whole. Afterwards proceed with the steps described above.

I have done some testing with this, but it might contains bugs that can lead to unwanted trades. I suggest to use a throwaway wallet, to test and use.

If you still need help with setting this up, feel free to ask in GU discord.
