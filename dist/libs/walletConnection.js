import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { createStarkSigner, generateLegacyStarkPrivateKey } from '@imtbl/core-sdk';


/**
 * Generate a ethSigner/starkSigner object from a private key.
 */
export const generateWalletConnection = async (ethNetwork) => {
    
    const userPrivateKey = ('');
    const alchemyKey = ('');

    const wallet = new Wallet(userPrivateKey);
    const userStarkKey  = await generateLegacyStarkPrivateKey(wallet);

    // connect provider
    const provider = new AlchemyProvider(ethNetwork, alchemyKey);
    // L1 credentials
    const ethSigner = new Wallet(userPrivateKey).connect(provider);
    // L2 credentials
    const starkSigner = createStarkSigner(userStarkKey);
    return {
        ethSigner,
        starkSigner,
    };
};

