import puppeteer from "puppeteer-extra";
import plugin from "puppeteer-extra-plugin-stealth";
// Or import puppeteer from 'puppeteer-core';

const StealthPlugin = plugin();
const fanSale =
  "https://www.fansale.at/tickets/all/taylor-swift/502069/17275983";

puppeteer.use(StealthPlugin);

const browser = await puppeteer.launch({
  channel: "chrome",
  headless: false,
});
const page = (await browser.pages())[0];
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await page.goto(fanSale);


const scrollElementToView = async (element) => {
    await page.evaluate((element) => element.scrollIntoView(), element);
};

const selectTicket = async () => {
    const ticket = await page.$(".EventEntry");
    const numberOfTickets = await page.$(".NumberOfTicketsInOffer");

    if (!ticket) {
        console.log("No tickets can be selected");
        return setTimeout(reload, 5000);
    }
    
    const numberOfTicketsValue = await page.evaluate((ticket) => ticket.textContent, ticket)
    console.log("Number of tickets available: ", numberOfTicketsValue);
    await ticket.click();
    await page.waitForNavigation();
    await page.click("ZUR KASSE");
};

let element = null;

const reload = async () => {
  try {
    await page.reload();
    const ticketDiv = await page.$(".AvailabilityInfo-TextOfferList");
    element = ticketDiv; // place where the tickets are shown

    if (!element) return setTimeout(reload, 5000);

    const valueOfDiv = await page.evaluate(
      (element) => element.textContent,
      element
    );

    await scrollElementToView(element);

    if(valueOfDiv.includes("keine")) {
        console.log("No tickets available");
        return setTimeout(reload, 5000);
    }
    
    await selectTicket();

  } catch (error) {
    console.log("Error: ", error);
    setTimeout(reload, 5000);
  }
};
reload();
