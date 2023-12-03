const main = async () => {
  const gameContractFactory = await hre.ethers.getContractFactory("MyEpicGame");
  const gameContract = await gameContractFactory.deploy(
    ["ZORO", "NAMI", "USOPP"],//キャラクターの名前
    [
      "https://i.imgur.com/TZEhCTX.png", // キャラクターの画像
      "https://i.imgur.com/WVAaMPA.png",
      "https://i.imgur.com/pCMZeiM.png",
    ],
    [100,200,300],//キャラクターのHP
    [100,50,25],//キャラクターの攻撃力
    "CROCODILE", //Bossの名前
    "https://i.imgur.com/BehawOh.png", // Bossの画像
    10000, //Bossのhp
    50 //Bossの攻撃力
  );
  await gameContract.deployed();
  console.log("Contract deployed to:", gameContract.address);

  //再代入可能な変数txnを宣言
  let txn;
  //3体のNFTキャラクターの中から、３番目のキャラクターをMintをしています。
  txn = await gameContract.mintCharacterNFT(2);

  //Miningが仮想ナイナーにより、承認されるのを待ちます。
  await txn.wait();

  //1回目の攻撃：　attackBoss関数を追加
  txn = await gameContract.attackBoss();
  await txn.wait();

  //２回目の攻撃：　attackBoss関数を追加
  txn = await gameContract.attackBoss();
  await txn.wait();

  //NFTのURIの値を取得します。tokenURIはERC721から継承した関数です。
  let returnedTokenUri = await gameContract.tokenURI(1);
  console.log("Token URI:", returnedTokenUri);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
runMain();