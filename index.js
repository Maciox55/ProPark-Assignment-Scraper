/*
Maciej Bregisz
Backend Software Assignment Attempt
Scraping tested and verified
*/

var cron = require('node-cron');
var puppeteer = require('puppeteer');
const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery({keyFilename:'key.json',projectId: 'propark-assignment'});
let terminals;

//Run CRON service every 30 minutes and call the puppet function to scrape the site for info
cron.schedule('*/1 * * * *', () => {
    console.log('Cron executing...');
    puppet();
  });

async function puppet(){
      console.log("Calling Puppet")
      const browser = await puppeteer.launch({args: ['--no-sandbox']}); //Create a headless instance of the browser
      const page = await browser.newPage(); //Create a new tab
      await page.goto("https://www.laguardiaairport.com/to-from-airport/parking",{waitUntil:'networkidle2',timeout:0});  //Navigate to url
      await page.waitForXPath('//*[@id="parkingContent"]/div[1]/div[1]/div[1]/div/div[3]/div/div/span');
  
      let [terminalA] = await page.$x('//*[@id="parkingContent"]/div[1]/div[1]/div[1]/div/div[3]/div/div/span'); //find the DOM elements using xPath
      let [terminalB] = await page.$x('//*[@id="parkingContent"]/div[1]/div[2]/div[1]/div/div[3]/div/div/span');
      let [terminalCD] = await page.$x('//*[@id="parkingContent"]/div[1]/div[3]/div[1]/div/div[3]/div/div/span');
  
      let valueA = await terminalA.evaluate(test => test.innerText.match(/([0-9])\w+/g)); //Get the inner text of the element
      let valueB = await terminalB.evaluate(test => test.innerText.match(/([0-9])\w+/g));
      let valueCD = await terminalCD.evaluate(test => test.innerText.match(/([0-9])\w+/g));
  
      console.log("Terminal A: "+valueA + "% full, Terminal B: " +  valueB + "% full, Terminal C/D: " + valueCD + "% full");
      

      //Terminal data is now stored in separate tables within the Parking dataset
      //For simplicity the fields are String in this case.
      terminals = [
        {name: 'terminalA',
          data: {value: valueA.toString(), dateCollected: Date.now()}
        },
        {name: 'terminalB',
          data: {value: valueB.toString(), dateCollected: Date.now()}
        },
        {name: 'terminalCD',
          data: {value: valueCD.toString(), dateCollected: Date.now()}
        }
      ];
      //insert each of the terminals individually
      terminals.forEach(terminal => insertData(terminal));

      await browser.close(); //Close browser session.
      //insertData(); //Call the function to insert data into BigQuery Table, untested

  }
  
  //Inserting data into BigQuery - each termianl is updated 
  async function insertData(values){
    await bigquery
        .dataset("Parking")
        .table(values.name)
        .insert(values.data).catch((error) =>{
            console.log(error.errors[0]);

        });
      console.log("Inserted " + values.data.value + " into: " + values.name);
  }
