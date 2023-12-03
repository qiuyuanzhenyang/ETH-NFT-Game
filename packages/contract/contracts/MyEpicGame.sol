// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// NFT発行のコントラクト ERC721.sol をインポートします。
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

//OpenZeppelinが提供するヘルパー機能をインポートします。
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./libraries/Base64.sol";

import "hardhat/console.sol";

//MyEpicGameコントラクトは、NFTの標準規格であるERC721を継承します。
contract MyEpicGame is ERC721 {
    //キャラクターのデータを格納するCharacterAttributes型の構造体を作成。
    struct CharacterAttributes {
        uint characterIndex;
        string name;
        string imageURI;
        uint hp;
        uint maxHp;
        uint attackDamage;
    }

    struct BigBoss {
        string name;
        string imageURI;
        uint hp;
        uint maxHp;
        uint attackDamage;
    }
    BigBoss public bigBoss;

    //OpenZeppelinが提供するtokenIdsを簡単に追跡するライブラリを呼び出しています。
    using Counters for Counters.Counter;
    //tokenIdsはNFTの一意な識別子で、０，１，２，３のように付与されます。
    Counters.Counter private _tokenIds;

    //キャラクターのデフォルトデータを保持するための配列defaultCharactersを作成します。それぞれの配列はCharacterAttributes型です。
    CharacterAttributes[] public defaultCharacters;

    //NFTのtokenIdsとCharacterAttribuesを紐づけるmappingを作成します。
    mapping(uint256 => CharacterAttributes) public nftHolderAttributes;

    //ユーザーのアドレスとNFTのtokenIdsを紐づけるmappingを作成しています。
    mapping(address => uint256) public nftHolders;

    //ユーザーがNFTをMintしたことを示すイベント
    event CharacterNFTMinted(address sender, uint256 tokenId, uint256 characterIndex);

    //ボスへの攻撃が完了したことを示すイベント
    event AttackComplete(uint newBossHp, uint newPlayerHp);

    constructor(
        //プレイヤーが新しくNFTキャラクターをMintする際に、キャラクターを初期化するために渡されるデータを設定しています。これらの値はフロントエンド（jsファイル）から渡されます。
        string[] memory characterNames,
        string[] memory characterImageURIs,
        uint[] memory characterHp,
        uint[] memory characterAttackDmg,
        //これらの新しい変数は、run.jsやdeploy.jsを介して渡されます。
        string memory bossName,
        string memory bossImageURI,
        uint bossHp,
        uint bossAttackDamage
    )
    //作成するNFTの名前とそのシンボルをERC721規格に渡しています。
    ERC721("OnePiece", "ONEPIECE")
    {
        //ゲームで扱うすべてのキャラクターをループ処理で呼び出し、それぞれのキャラクターに付与されるデフォルト値をコントラクトに保存します。
        //後でNFTを作成する際に使用します。
        for(uint i = 0; i < characterNames.length; i += 1) {
            defaultCharacters.push(CharacterAttributes({
                characterIndex: i,
                name: characterNames[i],
                imageURI: characterImageURIs[i],
                hp: characterHp[i],
                maxHp: characterHp[i],
                attackDamage: characterAttackDmg[i]
            }));

            CharacterAttributes memory character = defaultCharacters[i];

            //hardhatのconsole.log()では、任意の順番で最大4つのパラメータを指定できます。
            //使用できるパラメータの種類： uint, stirng, bool, address
            console.log(
                "Done initializing %s w/ HP %s, img %s",
                character.name,
                character.hp,
                character.imageURI
                );
        }

        //次のNFTがMintされるときのカウンターをインクリメントします。
        _tokenIds.increment();

        //ボスを初期化します。ボスの情報をグローバル状態変数”bigBoss”に保存します。
        bigBoss = BigBoss({
            name: bossName,
            imageURI: bossImageURI,
            hp: bossHp,
            maxHp: bossHp,
            attackDamage: bossAttackDamage
        });

        console.log(
            "Done initializing boss %s w/ HP %s, img %s",
            bigBoss.name,
            bigBoss.hp,
            bigBoss.imageURI
            );
    }

    //ユーザーはmintCharacterNFT関数を呼び出して、NFTをMintすることができます。
    //_characterIndexはフロントエンドから送信されます。
    function mintCharacterNFT(uint _characterIndex) external {
        //現在のtokenIdsを取得します（constructor内でインクリメントしているため、１から始まります）
        uint256 newItemId = _tokenIds.current();

        //msg.senderでフロントエンドからユーザーのアドレスを取得して、NFTをユーザーにMintします。
        _safeMint(msg.sender, newItemId);

        //mappingで定義したtokenIdsをCharacterAttributesに紐づけます。
        nftHolderAttributes[newItemId] = CharacterAttributes({
            characterIndex: _characterIndex,
            name: defaultCharacters[_characterIndex].name,
            imageURI: defaultCharacters[_characterIndex].imageURI,
            hp: defaultCharacters[_characterIndex].hp,
            maxHp: defaultCharacters[_characterIndex].maxHp,
            attackDamage: defaultCharacters[_characterIndex].attackDamage
        });

        console.log("Minted NFT w/ tokenId %s and characterIndex %s", newItemId, _characterIndex);

        //NFTの所有者を簡単に確認できるようにします。
        nftHolders[msg.sender] = newItemId;

        //次に使用する人のためにtokenIdをインクリメントします。
        _tokenIds.increment();

        //ユーザーがNFTをMintしたことをフロントエンドに伝えます。
        emit CharacterNFTMinted(msg.sender, newItemId, _characterIndex);
    }

    function attackBoss() public {
        //1.プレイヤーのNFTの状態を取得します。
        uint256 nftTokenIdOfPlayer = nftHolders[msg.sender];
        CharacterAttributes storage player = nftHolderAttributes[nftTokenIdOfPlayer];
        console.log("\nPlayer w/ character %s about to attack. Has %s HP and %s AD", player.name, player.hp, player.attackDamage);
        console.log("Boss %s has %s HP and %s AD", bigBoss.name, bigBoss.hp, bigBoss.attackDamage);

        //2.プレイヤーのHPが０以上であることを確認する。
        require (
            player.hp > 0,
            "Error: character must have HP to attack boss."
        );
        //3.ボスのHPが０以上であることを確認する。
        require (
            bigBoss.hp > 0,
            "Error: boss must have HP to Attack characters."
        );

        //4.プレイヤーがボスを攻撃できるようにする。
        if (bigBoss.hp < player.attackDamage) {
            bigBoss.hp = 0;
        } else {
            bigBoss.hp = bigBoss.hp - player.attackDamage;
        }
        //5.ボスがプレイヤーを攻撃できるようにする。
        if (player.hp < bigBoss.attackDamage) {
            player.hp = 0;
        } else {
            player.hp = player.hp - bigBoss.attackDamage;
        }

        //プレイヤーの攻撃をターミナルに出力する。
        console.log("Player attacked boss. New boss hp: %s", bigBoss.hp);
        //ボスの攻撃をターミナルに出力する。
        console.log("Boss attacked player. New player hp: %s\n", player.hp);

        //ボスへの攻撃が完了したことをフロントエンドに伝えます。
        emit AttackComplete(bigBoss.hp, player.hp);
    }

    function checkIfUserHasNFT () public view returns (CharacterAttributes memory) {
        //ユーザーのtokenIdを確認します。
        uint256 userNftTokenId = nftHolders[msg.sender];

        //ユーザーがすでにtokenIdを持っている場合、そのキャラクターの属性情報を返します。
        if (userNftTokenId > 0 ) {
            return nftHolderAttributes[userNftTokenId];
        }
        //それ以外は、空文字を返します。
        else {
            CharacterAttributes memory emptyStruct;
            return emptyStruct;
        }
    }

    function getAllDefaultCharacters() public view returns (CharacterAttributes [] memory) {
        return defaultCharacters;
    }

    function getBigBoss() public view returns (BigBoss memory) {
        return bigBoss;
    }

    //nftHolderAttributesを更新して、tokenURIを添付する関数を作成
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        CharacterAttributes memory charAttributes = nftHolderAttributes[_tokenId];
        //charAttributesのデータを編集して、JSONの構造に合わせた変数に格納しています。
        string memory strHp = Strings.toString(charAttributes.hp);
        string memory strMaxHp = Strings.toString(charAttributes.maxHp);
        string memory strAttackDamage = Strings.toString(charAttributes.attackDamage);

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        charAttributes.name,
                        ' -- NFT #: ',
                        Strings.toString(_tokenId),
                        '", "description": "An epic NFT", "image": "ipfs://',
                        charAttributes.imageURI,
                        '", "attributes": [ { "trait_type": "Health Points", "value": ',strHp,', "max_value":',strMaxHp,'}, { "trait_type": "Attack Damage", "value": ',
                        strAttackDamage,'} ]}'
                        )
                        )
                        )
                        );

            //文字列data:application/json;base64, とjsonの中身を結合して、tokenURIを作成しています。
            string memory output = string(
                abi.encodePacked("data:application/json;base64,", json)
            );
            return output;
    }   
}