const xlsx = require('node-xlsx');
const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');

let filename;

const initPrint = () => {
  console.log(
    chalk.magenta(
      figlet.textSync('Welcome', {
        font: 'Big',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );
};

const askQuestion = () => {
  initPrint();
  const questions = [
    {
      type: 'list',
      name: 'filename',
      message: 'Which file you want to process ?',
      choices: getFilenames(),
      filter: function (val) {
        return val.split(':')[1].trim();
      }
    }
  ];

  return inquirer.prompt(questions);
};

const getFilenames = () => {
  let filelist = fs.readdirSync('./assets/');
  filelist = filelist.map((el, index) => {
    return `${index + 1}: ${el}`;
  });
  return filelist;
};

const run = async () => {
  // filename = 'Arizona.xlsx';
  const ansResult = await askQuestion();
  filename = ansResult['filename'];
  let errorCnt = 0;
  const workSheetsFromFile = xlsx.parse(`${__dirname}/assets/${filename}`);
  let successCount = 0;

  try {
    // loop over all sheets .workSheetsFromFile.length
    for (let sheets = 0; sheets < workSheetsFromFile.length; sheets++) {
      const currentSheet = workSheetsFromFile[sheets];

      const currentSheetData = currentSheet.data;

      // find the index of column URL
      const indexForUrlField = currentSheetData[0].indexOf(currentSheetData[0].find((el) => el.toLowerCase() === 'url'));

      // if column siteURL not present then add
      if (!currentSheetData[0].find((col) => col === 'siteURL')) currentSheetData[0].push('siteURL');

      // Get index for column siteURL
      const siteURLindex = currentSheetData[0].length - 1;

      console.log('Processing sheet:', currentSheet.name, '\nfetching ....................................');
      let pageSize = 5;
      let modificationsDone = 0;
      // currentSheetData.length
      for (let row = 1; row < currentSheetData.length; row++) {
        const currentRow = row + 1;
        const url = currentSheetData[row][indexForUrlField];
        if (!!url) {
          // if url present
          // if existing records has url then dont check
          if (!currentSheetData[row][siteURLindex]) {
            let siteurl;
            try {
              siteurl = await fetchHtmlContent(new URL(url));
              if (!!siteurl) {
                currentSheetData[row][siteURLindex] = siteurl;
                console.log(`Row : ${currentRow} Hotel : ${currentSheetData[row][0]} website: ${siteurl}`);
                successCount++;
                modificationsDone++;
                console.log('modifications done: ', modificationsDone);
              }
            } catch (error) {
              console.log(error.message);
              // if got error more than 5 times while fetching url .. then exit the application
              if (errorCnt++ > 5) {
                process.exit(1);
              }
            }
          }
        }
        if (modificationsDone === pageSize || modificationsDone === currentSheetData.length || currentRow === currentSheetData.length) {
          console.log(`Time to update ${filename} Sheet: ${currentSheet.name}`);
          await updateXlsx(workSheetsFromFile);
          pageSize += 5;
        }
      }
    }
    console.log('success count : ', successCount);

    // update xlsx file
    // if (successCount > 0) updateXlsx(workSheetsFromFile);
  } catch (error) {
    if (!!workSheetsFromFile && successCount > 0) {
      // await updateXlsx(workSheetsFromFile);
    }
  }
};

// fetch url and get siteURL
const fetchHtmlContent = async (url) => {
  try {
    // return 'ererer';
    const fetchresult = await fetch(url);
    const html = await fetchresult.text();

    const completeHtml = cheerio.load(html);
    const pTagHtml = completeHtml(
      `.lemon--div__373c0__1mboc:nth-child(1) > .lemon--div__373c0__1mboc:nth-child(1) > .lemon--div__373c0__1mboc > .lemon--div__373c0__1mboc:nth-child(2) > .lemon--p__373c0__3Qnnj:nth-child(2)`
    ).html();

    let accessDenied = completeHtml(`body > .y-container > .y-container_content > .u-space-b6 > h2`).text();

    if (!!accessDenied) {
      throw new Error(`Error message: ${accessDenied}`);
    }
    let siteurl = 'Website Not Available';
    if (!!pTagHtml) {
      let loadInnerHtml = cheerio.load(pTagHtml);
      // // get href content
      const isAnchorTagPresent = loadInnerHtml('a').attr('href');
      // let hostname = new URL(url).origin;
      if (!!isAnchorTagPresent) {
        let urlcontent = !!url.href ? new URL(`${url.origin}/${isAnchorTagPresent}`).searchParams.get('url') : undefined;
        let actualUrl = !!urlcontent ? urlcontent : undefined;

        if (!!actualUrl) {
          siteurl = actualUrl;
        }
      }
      // siteurl = !!actualUrl ? actualUrl : 'Website Not Available';
    }

    return siteurl;
  } catch (error) {
    throw error;
  }
};

// update xlsx file
const updateXlsx = (modifiedData) => {
  try {
    return new Promise((res, rej) => {
      console.log(`Writing ${filename} ...........`);
      const buffer = xlsx.build(modifiedData); // Returns a buffer
      fs.writeFile(`./assets/${filename}`, buffer, (err) => {
        if (err) throw err;
        res();
        console.log('done!!');
      });
    });
  } catch (error) {
    console.log('Error in file writing', error.message);
  }
};

run();
