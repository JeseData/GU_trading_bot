This tool will do automated massive listings and buyings for you.

To use:

You need to at least have Node.js installed. (https://nodejs.org/en). Version 18 works for me.

Clone the repository. 

To set up your wallet, you need to insert your private key and Alchemy api key at the /dist/libs/walletConnection.js (Lines 11 and 12). Register to Alchemy for the api key (https://alchemy.com/?r=4d6f9b685106cdf4).

Then set the trading parameters at /dist/src/app.js. All the settings are found in lines 30-75. Read carefully!

In case you want to create the node project 'from scratch', run in command line:  
mkdir gu_lister  
cd gu_lister  
npm init  
npm i @imtbl/core-sdk@1.0.1  

Then copy from this repository, 'package.json' to the main folder, and 'dist' folder as whole. Afterwards proceed with the steps described above.
