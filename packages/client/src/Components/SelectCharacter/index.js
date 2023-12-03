import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import "./SelectCharacter.css";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import LoadingIndicator from "../../Components/LoadingIndicator";
import myEpicGame from "../../utils/MyEpicGame.json";

//SelectCharacterコンポーネントを定義しています。
const SelectCharacter = ({ setCharacterNFT }) => {
    const [characters, setCharacters] = useState([]);
    const [gameContract, setGameContract] = useState(null);
    const [mintingCharacter, setMintingCharacter] = useState(false);

    const mintCharacterNFTAction = (characterId) => async () => {
        try {
            if (gameContract) {
                //Mintが開始されたら、ローディングマークを表示する。
                setMintingCharacter(true);

                console.log("Minting character in progress...");
                const mintTxn = await gameContract.mintCharacterNFT(characterId);
                await mintTxn.wait();
                console.log("mintTxn:", mintTxn);
                //Mintが終了したら、ローディングマークを消す。
                setMintingCharacter(false);
            }
        } catch (error) {
            console.warn("MintCharacterAction:", error);
            //エラーが発生した場合も、ローディングマークを消す。
            setMintingCharacter(false);
        }
    };

    //ページがロードされた瞬間に下記を実行します。
    useEffect(() => {
        const { ethereum } = window;
        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const gameContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                myEpicGame.abi,
                signer
            );

            //gameCotractの状態を更新します。
            setGameContract(gameContract);
        } else {
            console.log("Ethereum object not found");
        }
    },[]);

    useEffect(() => {
        //NFTキャラクターのスマートコントラクトから取得します。
        const getCharacters = async () => {
            try {
                console.log("Getting contract characters to mint");

                //ミント可能な全NFTキャラクターをコントラクトから呼び出します。
                const charactersTxn = await gameContract.getAllDefaultCharacters();

                console.log("charactersTxn:", charactersTxn);

                //全てのNFTキャラクターのデータを変換します。
                const characters = charactersTxn.map((characterData) =>
                 transformCharacterData(characterData)
                );

                //ミント可能なすべてのNFTキャラクターの状態を設定します。
                setCharacters(characters);
            } catch (error) {
                console.error("Something went wrong fetching characters:", error);
            }
        };
        
        // イベントを受信したときに起動するコールバックメソッド onCharacterMint を追加します。
        const onCharacterMint = async (sender, tokenId, characterIndex) => {
          console.log(
               `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
             );
    
             // NFT キャラクターが Mint されたら、コントラクトからメタデータを受け取り、アリーナ（ボスとのバトルフィールド）に移動するための状態に設定します。
             if (gameContract) {
                  const characterNFT = await gameContract.checkIfUserHasNFT();
                  console.log("CharacterNFT: ", characterNFT);
                  setCharacterNFT(transformCharacterData(characterNFT));
                  alert(
                    `NFT キャラクターが Mint されました -- リンクはこちらです: https://gemcase.vercel.app/view/evm/sepolia/${
                      gameContract.address
                    }/${tokenId.toNumber()}`
                  );
              }
        };

        if (gameContract) {
            getCharacters();
            //リスナーの設定：NFTキャラクターがMintされた通知を受け取ります。
            gameContract.on("CharacterNFTMinted", onCharacterMint);
        }

        return () => {
            //コンポーネントがマウントされたら、リスナーを停止する。

            if (gameContract) {
                gameContract.off("CharacterNFTMinted",onCharacterMint);
            }
        };
    }, [gameContract]);

    const renderCharacters = () =>
     characters.map((character, index) => (
        <div className="character-item" key={character.name}>
            <div className="name-container">
                <p>{character.name}</p>
            </div>
            <img src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`} />
            <button
             type="button"
             className="character-mint-button"
             onClick={mintCharacterNFTAction(index)}
             >{`Mint ${character.name}`}</button>
            </div>
            ));

    return (
        <div className="select-character-container">
            <h2>⏬ 一緒に戦う NFT キャラクターを選択 ⏬</h2>
            {/*キャラクターNFTがフロントエンド上で読み込めている際に、下記を表示します */}
            {characters.length > 0 && (
                <div className="character-grid">{renderCharacters()}</div>
            )}
            {/*mintingCharacter = trueの場合のみ、ローディングマークを表示します。 */}
            {mintingCharacter && (
                <div className="loading">
                    <div className="indicator">
                        <LoadingIndicator />
                        <p>Minting In Progress...</p>
                    </div>
                    </div>
            )}
        </div>
    );
};

export default SelectCharacter;