const hre = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MyEpicGame", () => {
  async function deployTextFixture() {
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
      100, //Bossのhp
      50 //Bossの攻撃力
      );
      await gameContract.deployed();

      return {
        gameContract,
      };
    }

    it("attack was successful", async () => {
      const { gameContract } = await loadFixture(deployTextFixture);

      //3体のNFTキャラクターの中から、３番目のキャラクターをMintしています。
      let txn = await gameContract.mintCharacterNFT(2);

      //Mintingが仮想ナイナーにより、承認されるのを待ちます。
      await txn.wait();

      //mintしたNFTにおける、攻撃前と後のhpを取得する。
      let hpBefore = 0;
      let hpAfter =0;
      //NFTの情報を得る
      //かつきちんとMintされているかを確認
      let NFTInfo = await gameContract.checkIfUserHasNFT();
      hpBefore = NFTInfo.hp.toNumber();

      //1回目の攻撃：attackBoss関数を追加
      txn = await gameContract.attackBoss();
      await txn.wait();

      NFTInfo = await gameContract.checkIfUserHasNFT();
      hpAfter = NFTInfo.hp.toNumber();

      expect(hpBefore - hpAfter).to.equal(50);
    });

    //ボスのHPがなくなったら時に、ボスへの攻撃ができないことを確認
    it("check boss attack does not happen if boss hp is smaller than 0", async () => {
      const { gameContract } = await loadFixture(deployTextFixture);

      //３体のNFTキャラクターの中から、１番目のキャラクターをMintしています。
      let txn = await gameContract.mintCharacterNFT(0);

      //Mintingが仮想マイナーにより、承認されるのを待ちます。
      await txn.wait();

      //1回目の攻撃：attackBoss関数を追加
      txn = await gameContract.attackBoss();
      await txn.wait();

      //２回目の攻撃：attackBoss関数を追加
      //ボスのhpがなくなったときに、エラーが発生することを確認
      txn = expect(gameContract.attackBoss()).to.be.revertedWith(
        "Error: boss must have HP to attack characters.",
      );
    });

    //キャラクターのHPがなくなったときに、ボスへの攻撃ができないことを確認
    it("check boss attack does not happen if character hp is smaller than 0", async () => {
      const { gameContract } = await loadFixture(deployTextFixture);

      //３体のNFTキャラクターの中から、２番目のキャラクターをMintしています。
      let txn = await gameContract.mintCharacterNFT(1);

      //Mintingが仮想マイナーにより、承認されるのを待ちます。
      await txn.wait();

      //１回目の攻撃：attackBoss関数を追加
      txn = await gameContract.attackBoss();
      await txn.wait();

      //２回目の攻撃：attackBoss関数を追加
      txn = expect(gameContract.attackBoss()).to.be.revertedWith(
        "Error character must have HP to attack boss.",
      );
    });
});
