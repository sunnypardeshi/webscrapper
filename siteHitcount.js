const fetch = require('node-fetch');
const cheerio = require('cheerio');

const run = async () => {
  let cnt;

  for (let i = 1; ; i++) {
    const fetchresult = await fetch(
      `https://www.yelp.com/biz/cheese-board-pizza-berkeley?adjust_creative=muf0b9IHSDXkMDaETfAOhw&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=muf0b9IHSDXkMDaETfAOhw`
    );
    const html = await fetchresult.text();

    const completeHtml = cheerio.load(html);
    const pTagHtml = completeHtml(
      `.lemon--div__373c0__1mboc:nth-child(1) > .lemon--div__373c0__1mboc:nth-child(1) > .lemon--div__373c0__1mboc > .lemon--div__373c0__1mboc:nth-child(2) > .lemon--p__373c0__3Qnnj:nth-child(2)`
    ).html();

    let siteurl = '';
    if (!!pTagHtml) {
      cnt = i;

      console.log('Hit successFull', cnt);

      let loadInnerHtml = cheerio.load(pTagHtml);
      const actualUrl = loadInnerHtml('a').text();

      if (!!actualUrl) {
        cnt = i;
      } else {
        console.log('access denied: IN actual URL');
        break;
      }

      siteurl = !!actualUrl ? actualUrl : '';
    } else {
      console.log('access denied: IN pTag Else');
      break;
    }
    // console.log(siteurl, 'siteurl');
  }

  console.log('Total hits', cnt);
};
run();
