var AnotherToken = artifacts.require("./AnotherToken.sol")
var Saturn       = artifacts.require("./Saturn.sol")
var Stn          = artifacts.require("./STN.sol");
var Ico          = artifacts.require("./TokenSale.sol");


const initialTreasuryBalance = web3.eth.getBalance(web3.eth.accounts[2])

// helper functions
function assertJump(error) {
  let revertOrInvalid = error.message.search('invalid opcode|revert')
  assert.isAbove(revertOrInvalid, -1, 'Invalid opcode error must be returned')
}

contract('TokenSale', function(accounts) {
  it("Knows what token it is selling", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()

    let tkn = await ico.tokenAddress()
    assert.equal(tkn, saturn.address)
  })

  it("Rejects transfer of wrong amount of SATURN tokens", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()

    try {
      await saturn.transfer(ico.address, 1)
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  it("Rejects transfer of STN tokens before ICO is activated", async () => {
    const ico = await Ico.deployed()
    const stn = await Stn.deployed()

    try {
      await stn.transfer(ico.address, 1)
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  it("Doesn't allow to end ico before it started", async () => {
    const ico = await Ico.deployed()

    let active = await ico.active()
    assert.equal(active, false)

    try {
      await ico.endSale()
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  it("Rejects purchases in an inactive crowdsale", async () => {
    const ico = await Ico.deployed()

    try {
      await web3.eth.sendTransaction({from: accounts[0], to: ico.address, value: web3.toWei(1, "ether")})
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  // ico activated

  it("Activates ico if the right amount of SATURN tokens is received", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()

    let hardCap = await ico.hardCap()

    let activeBefore = await ico.active()
    assert.equal(activeBefore, false)

    await saturn.transfer(ico.address, hardCap)

    let activeAfter = await ico.active()
    assert.equal(activeAfter, true)
  })

  it("Doesn't allow strangers to end ico", async () => {
    const ico = await Ico.deployed()

    try {
      await ico.endSale({from: accounts[1]})
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  it("Rejects token transfers to an active ico", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()

    let hardCap = await ico.hardCap()

    try {
      await saturn.transfer(ico.address, hardCap)
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  it("Can exchange STN for SATURN tokens", async () => {
    const ico = await Ico.deployed()
    const stn = await Stn.deployed()
    const saturn = await Saturn.deployed()

    let balanceBefore = await saturn.balanceOf(accounts[0])

    await stn.transfer(ico.address, 10000) // send 1 STN (with 4 decimals)

    let balanceAfter = await saturn.balanceOf(accounts[0])

    assert.equal(balanceAfter.minus(balanceBefore).toString(), 500000000) // received 50,000 SATURN
  })

  it("Rejects transfers of other ERC223 tokens", async () => {
    const ico = await Ico.deployed()
    const ant = await AnotherToken.deployed()

    try {
      await ant.transfer(ico.address, 50000)
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  it("Can participate by simply sending ether", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()

    let balanceBefore = await saturn.balanceOf(accounts[0])
    await web3.eth.sendTransaction({from: accounts[0], to: ico.address, value: web3.toWei(1, "ether")})
    let balanceAfter = await saturn.balanceOf(accounts[0])

    assert.equal(balanceAfter.minus(balanceBefore).toString(), 500000000) // received 50,000 SATURN
  })

  it("Rejects transaction if ETH amount sent is too small", async () => {
    const ico = await Ico.deployed()

    try {
      await web3.eth.sendTransaction({from: accounts[0], to: ico.address, value: 100000});
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  // referrals
  it("First referral bonus is 1%", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()
    const referrer = accounts[3]

    let balanceBefore = await saturn.balanceOf(referrer)
    let refAmountBefore = await ico.refAmount(referrer)
    let refPercentageBefore = await ico.refPercentage(referrer)
    assert.equal(refAmountBefore.toString(), 0)
    assert.equal(refPercentageBefore.toString(), 1)

    await ico.processPurchase(referrer, {value: web3.toWei(0.1, 'ether')})

    let balanceAfter = await saturn.balanceOf(referrer)
    let refAmountAfter = await ico.refAmount(referrer)
    let refPercentageAfter = await ico.refPercentage(referrer)

    assert.equal(refPercentageBefore.toString(), 1)
    assert.equal(balanceAfter.minus(balanceBefore).toString(), 500000)
    assert.equal(refAmountAfter.minus(refAmountBefore).toString(), 500000)
  })

  it("After inviting more than 5 ETH referral bonus is 2%", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()
    const referrer = accounts[3]

    let balanceBefore = await saturn.balanceOf(referrer)
    let refAmountBefore = await ico.refAmount(referrer)
    let refPercentageBefore = await ico.refPercentage(referrer)
    assert.equal(refPercentageBefore.toString(), 1)

    await ico.processPurchase(referrer, { value: web3.toWei(5, 'ether') })

    let balanceAfter = await saturn.balanceOf(referrer)
    let refAmountAfter = await ico.refAmount(referrer)
    let refPercentageAfter = await ico.refPercentage(referrer)

    assert.equal(refPercentageAfter.toString(), 2)
    assert.equal(balanceAfter.minus(balanceBefore).toString(), 25000000)
    assert.equal(refAmountAfter.minus(refAmountBefore).toString(), 25000000)
  })

  it("After inviting more than 10 ETH referral bonus is 5%", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()
    const referrer = accounts[3]

    let balanceBefore = await saturn.balanceOf(referrer)
    let refAmountBefore = await ico.refAmount(referrer)
    let refPercentageBefore = await ico.refPercentage(referrer)
    assert.equal(refPercentageBefore.toString(), 2)

    await ico.processPurchase(referrer, { value: web3.toWei(5, 'ether') })

    let balanceAfter = await saturn.balanceOf(referrer)
    let refAmountAfter = await ico.refAmount(referrer)
    let refPercentageAfter = await ico.refPercentage(referrer)

    assert.equal(refPercentageAfter.toString(), 5)
    assert.equal(balanceAfter.minus(balanceBefore).toString(), 50000000)
    assert.equal(refAmountAfter.minus(refAmountBefore).toString(), 50000000)
  })

  it("After inviting more than 100 ETH referral bonus is 10%", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()
    const referrer = accounts[3]

    let balanceBefore = await saturn.balanceOf(referrer)
    let refAmountBefore = await ico.refAmount(referrer)
    let refPercentageBefore = await ico.refPercentage(referrer)
    assert.equal(refPercentageBefore.toString(), 5)

    await ico.processPurchase(referrer, { value: web3.toWei(40, 'ether') })
    await ico.processPurchase(referrer, { from: accounts[2], value: web3.toWei(50, 'ether') })

    let balanceAfter = await saturn.balanceOf(referrer)
    let refAmountAfter = await ico.refAmount(referrer)
    let refPercentageAfter = await ico.refPercentage(referrer)

    assert.equal(refPercentageAfter.toString(), 10)
    assert.equal(balanceAfter.minus(balanceBefore).toString(), 2250000000)
    assert.equal(refAmountAfter.minus(refAmountBefore).toString(), 2250000000)
  })

  it("Doesn't allow random people to end ico", async () => {
    const ico = await Ico.deployed()

    let active = await ico.active()
    assert.equal(active, true)

    try {
      await ico.endSale({from: accounts[1]})
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }
  })

  it("Allows the owner to end ico", async () => {
    const ico = await Ico.deployed()
    const saturn = await Saturn.deployed()

    let activeBefore = await ico.active()
    assert.equal(activeBefore, true)

    await ico.endSale()

    let activeAfter = await ico.active()
    assert.equal(activeAfter, false)

    let icoBalance = await saturn.balanceOf(ico.address)
    assert.equal(icoBalance.toString(), 0)
  })

})
