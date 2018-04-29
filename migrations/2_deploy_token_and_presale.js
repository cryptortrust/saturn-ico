var Saturn  = artifacts.require("./Saturn.sol");
var Stn     = artifacts.require("./STN.sol");
var Ico     = artifacts.require("./TokenSale.sol");

module.exports = (deployer, network, accounts) => {
  deployer.deploy(Saturn).then(() => {
    return deployer.deploy(Stn).then(() => {
      return deployer.deploy(Ico,
        Saturn.address,
        Stn.address,
        accounts[2],
        5000000000000
      );
    });
  });
};
