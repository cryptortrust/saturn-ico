## Saturn ICO contract

A thoroughly tested smart contract used to conduct ERC223 token sale a with referral program.

The referral program has the following terms:

* Base referral rate is 1%
* After attracting a cumulative of 5 ETH, your referral rate for new referrals becomes 2%
* After attracting a cumulative of 10 ETH, your referral rate for new referrals becomes 5%
* After attracting a cumulative of 100 ETH, your referral rate for new referrals becomes 10%

> Please note that the updated referral rate applies to all subsequent referrals, but not to the referral
that initiated the change. I.e., if you directly invite somebody to send 100 ETH in one transaction, you
will only receive 1% bonus from this amount, and 10% bonus from all new referrals that you make.

### Events
```js
// called when presale is activated
event Activated(uint256 time);
// called when presale is stopped
event Finished(uint256 time);
// called when somebody makes a purchase
event Purchase(address indexed purchaser, uint256 amount);
// called when somebody gets a referral bonus
event Referral(address indexed referrer, uint256 amount);
```
