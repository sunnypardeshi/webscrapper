const xlsx = require('node-xlsx');
const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');

const run = async () => {
  const workSheetsFromFile = xlsx.parse(
    `${__dirname}/assets/LocalRestaurants.xlsx`
  );
  let recordsModified = 0;

  try {
    // loop over all sheets .workSheetsFromFile.length
    for (let sheets = 0; sheets < workSheetsFromFile.length; sheets++) {
      const currentSheet = workSheetsFromFile[sheets];

      const currentSheetData = currentSheet.data;

      // find the index of column URL
      const indexForUrlField = currentSheetData[0].indexOf(
        currentSheetData[0].find((el) => el.toLowerCase() === 'url')
      );

      // if column siteURL not present then add
      if (!currentSheetData[0].find((col) => col === 'siteURL'))
        currentSheetData[0].push('siteURL');

      // Get index for column siteURL
      const siteURLindex = currentSheetData[0].length - 1;

      console.log(
        'Processing sheet:',
        currentSheet.name,
        '\nfetching ....................................'
      );
      for (let row = 1; row < currentSheetData.length; row++) {
        // if existing records has url then dont check
        if (!currentSheetData[row][siteURLindex]) {
          const url = currentSheetData[row][indexForUrlField];
          const siteurl = await fetchHtmlContent(url);
          if (!!siteurl) {
            currentSheetData[row][siteURLindex] = siteurl;
            recordsModified++;
          }
        }
      }
    }
    console.log('Total records modified : ', recordsModified);
    // update xlsx file
    if (recordsModified > 0) updateXlsx(workSheetsFromFile);
  } catch (error) {
    console.log('in catch');
    if (!!workSheetsFromFile && recordsModified > 0) {
      updateXlsx(workSheetsFromFile);
    }
    console.log('error: ', error.message);
  }
};

// fetch url and get siteURL
const fetchHtmlContent = async (url) => {
  try {
    const fetchresult = await fetch(url);
    const html = await fetchresult.text();

    const completeHtml = cheerio.load(html);
    const pTagHtml = completeHtml(
      `.lemon--div__373c0__1mboc:nth-child(1) > .lemon--div__373c0__1mboc:nth-child(1) > .lemon--div__373c0__1mboc > .lemon--div__373c0__1mboc:nth-child(2) > .lemon--p__373c0__3Qnnj:nth-child(2)`
    ).html();

    let siteurl = '';
    if (!!pTagHtml) {
      let loadInnerHtml = cheerio.load(pTagHtml);
      const actualUrl = loadInnerHtml('a').text();

      siteurl = !!actualUrl ? actualUrl : '';
    } else {
      throw new Error('Sorry, you’re not allowed to access this page.');
    }

    return siteurl;
  } catch (error) {
    console.log('Error while Fetching url.', error.message);
  }
};

// update xlsx file
const updateXlsx = async (modifiedData) => {
  try {
    console.log('writing to file ...........');
    const buffer = xlsx.build(modifiedData); // Returns a buffer
    fs.writeFile('./assets/LocalRestaurants.xlsx', buffer, (err) => {
      if (err) throw err;
      console.log('done!!');
    });
  } catch (error) {
    console.log('Error in file writing', error.message);
  }
};

run();