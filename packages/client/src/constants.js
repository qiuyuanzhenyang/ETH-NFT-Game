//CONTRACT_ADDRESSにコントラクトアドレスを保存します。
const CONTRACT_ADDRESS = "0x4d0b7081a913e9c0d39c7C13eA001b6F472a57F8";

//NFTキャラクターの属性をフォーマットしてオブジェクトとして返します。
const transformCharacterData = (characterData) => {
    return {
        name: characterData.name,
        imageURI: characterData.imageURI,
        hp: characterData.hp.toNumber(),
        maxHp: characterData.maxHp.toNumber(),
        attackDamage: characterData.attackDamage.toNumber(),
    };
};

//変数をconstants.js以外の場所でも使えるようにします。
export { CONTRACT_ADDRESS, transformCharacterData };