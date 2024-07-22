import puppeteer from "puppeteer-extra";
import plugin from "puppeteer-extra-plugin-stealth";
import sound from "sound-play";

import path from "path";

// Or import puppeteer from 'puppeteer-core';

const StealthPlugin = plugin();
puppeteer.use(StealthPlugin);

const fanSale =
  "https://www.fansale.at/tickets/all/taylor-swift/502069/17335909";
const REFRESH_INTERVAL = 5000;
const pathToHorn = path.join(import.meta.dirname, "horn.mp3");
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
  sound.play(pathToHorn); // play horn when ticket was found
  const ticket = await page.$(".EventEntry");
  const ticketIcon = await page.$(".TicketcheckIcon");
  console.log("Ticket: ", ticket);
  console.log("TicketIcon: ", ticketIcon);
  const numberOfTickets = await page.$(".NumberOfTicketsInOffer");

  if (!ticket && !ticketIcon) {
    console.log("No tickets can be selected");
    return setTimeout(reload, 5000);
  }
  const numberOfTicketsValue = await page.evaluate(
    (ticket) => ticket.textContent,
    numberOfTickets
  );
  console.log("Number of tickets available: ", numberOfTicketsValue);
  try {
    await ticket.click();
    await page.waitForNavigation();
    await page.click("ZUR KASSE");
  } catch (error) {
    await ticketIcon.click();
    await page.waitForNavigation();
    await page.click("ZUR KASSE");
  }
};

let element = null;

const reload = async () => {
  console.log("Looking for tickets")
  try {
    await page.reload();
    const ticketDiv = await page.$(".EventEntryList");
    element = ticketDiv; // place where the tickets are shown
    
    if (!element) return setTimeout(reload, REFRESH_INTERVAL); // no Tickets

    await scrollElementToView(element);
    await page.screenshot({ path: `screenshot${Math.random()}.png` });
    await selectTicket();
  } catch (error) {
    console.log("Error: ", error);
  }
};
reload();
