const xlsx = require('node-xlsx');
const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');

const run = async () => {
  try {
    const workSheetsFromFile = xlsx.parse(
      `${__dirname}/assets/LocalRestaurants.xlsx`
    );

    let finalXmlBuild = [];

    // loop over all sheets .workSheetsFromFile.length
    for (let i = 0; i < 1; i++) {
      const currentSheet = workSheetsFromFile[i];
      let obj = {
        name: currentSheet.name
      };
      const currentSheetData = currentSheet.data;
      const indexForUrlField = currentSheet.data[0].indexOf('URL');
      const allColumns = currentSheetData[0];
      allColumns.push('siteUrl');
      let modifiedData = [];
      console.log(allColumns);

      modifiedData.push(allColumns);
      let cnt = modifiedData.length;

      console.log('Writing for ', currentSheet.name);

      // loop over sheet data . currentSheetData.length
      for (let inner = 1; inner < 100; inner++) {
        const url = currentSheetData[inner][indexForUrlField];
        modifiedData.push(currentSheetData[inner]);
        console.log(modifiedData, 'modified data');

        const siteurl = await fetchHtmlContent(url);

        modifiedData[cnt].push(siteurl);
        cnt++;
      }

      obj['data'] = modifiedData;
      finalXmlBuild.push(obj);
    }
    // crete xlsx file
    writeToExcel(finalXmlBuild);
  } catch (error) {
    console.log('error: ', error.message);
  }
};

const fetchHtmlContent = async (url) => {
  try {
    // return 'testurl';
    console.log('fetching url');
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
      console.log(siteurl, 'siteurl');
    }

    return siteurl;
  } catch (error) {
    console.log(error.message, 'Error occured in fetch');
  }
};

const writeToExcel = async (modifiedData) => {
  try {
    console.log('Wait .. file is getting ready');
    var buffer = xlsx.build(modifiedData); // Returns a buffer
    fs.writeFile('updateddata.xlsx', buffer, (err) => {
      if (err) throw err;
      console.log('done');
    });
  } catch (error) {
    console.log('Error in file writing', error.message);
  }
};

run();
