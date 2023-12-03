const hre = require("hardhat");

const main = async () => {
  //これにより、”MyEpicGame”コントラクトがコンパイルされます。
  //コントラクトがコンパイルされたら、コントラクトを扱うために必要なファイルがartifactsディレクトリの直下に生成されます。
  const gameContractFactory = await hre.ethers.getContractFactory("MyEpicGame");
  //hardhatがローカルのEthereumネットワークをコントラクトのためだけに作成します。
  const gameContract = await gameContractFactory.deploy(
    ["CHIIKAWA1", "CHIIKAWA2", "CHIIKAWA3"],//キャラクターの名前
    [
      "QmUZyD7xS6TALJ5Zds6LpZtrguV7zzKaEbB23saLWbccyB", // キャラクターの画像
      "QmPKEB1KpNasCFGxYiUf1oFTvMd3DUnvArRPqwA5Y5mNK4",
      "QmWWLEMX1gsaSJkYwWp769UwhFuR6VeWwvvhTkL4g9QxRf",
    ],
    [100,200,300],//キャラクターのHP
    [100,50,25],//キャラクターの攻撃力
    "CROCODILE", //Bossの名前
    "https://i.imgur.com/BehawOh.png", // Bossの画像
    10000, //Bossのhp
    50 //Bossの攻撃力
  );
  //ここでは、”nftGame”コントラクトが、ローカルのブロックチェーンにデプロイされるまで待つ処理を行っています。
  const nftGame = await gameContract.deployed();

  console.log("Contract deployed to:", nftGame.address);
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