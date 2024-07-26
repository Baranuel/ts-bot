import puppeteer from "puppeteer-extra";
import plugin from "puppeteer-extra-plugin-stealth";
import sound from "sound-play";
import UserAgent from "user-agents";

import path from "path";

// Or import puppeteer from 'puppeteer-core';

const StealthPlugin = plugin({
  enabledEvasions: [
    "chrome.runtime",
    "navigator.webdriver",
    "navigator.languages",
    "navigator.permissions",
    "navigator.plugins",
  ],
});
puppeteer.use(StealthPlugin);

const fanSale =
  "https://www.fansale.at/tickets/all/taylor-swift/502069/17275983";
const REFRESH_INTERVAL = 10000;
const pathToHorn = path.join(import.meta.dirname, "notify.mp3");
const browser = await puppeteer.launch({
  channel: "chrome",
  headless: false,
  browserWSEndpoint:
    "wss://brd-customer-hl_67d82a75-zone-scraping_browser1:gvplfcdeqea7@brd.superproxy.io:9222",
});
const page = (await browser.pages())[0];
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await page.goto(fanSale);

const scrollElementToView = async (element) => {
  await page.evaluate((element) => element.scrollIntoView(), element);
};

const reloadPageAfterSelection = async () => {
  await page.reload();
};

async function acceptCookies() {
  const accessAllowed = await page.$(".DefaultPage");
  if (!accessAllowed) return;

  const cookiesButton = (
    await page.evaluateHandle(
      'document.querySelector("#cmpwrapper").shadowRoot.querySelector("#cmpwelcomebtnyes > a")'
    )
  ).asElement();
  if (!cookiesButton) return;
  try {
    await cookiesButton.click();
  } catch (error) {
    console.log("Error in cookies: ", error);
  }
}

const clickVisibleTicket = async () => {
  try {
    const ticket = await page.$(".EventEntry");
    if (!ticket) throw new Error("No tickets available");

    const isVisible = await ticket.isVisible();
    const isIntersecting = await ticket.isIntersectingViewport();
    console.log("clicking the ticket", ticket);
    isVisible && isIntersecting && (await ticket.click());
    return true 
  } catch (error) {
    console.log("Error in clickVisibleTicket: ", error);
    return false
  }
};

const selectTicket = async () => {
  sound.play(pathToHorn);
  const ticket = await page.$(".EventEntry");
  const ticketIcon = await page.$(".TicketcheckIcon");
  const numberOfTickets = await page.$(".NumberOfTicketsInOffer");

  if (!ticket && !ticketIcon) {
    console.log("No tickets can be selected");
    return setTimeout(reload, REFRESH_INTERVAL);
  }
  const numberOfTicketsValue = await page.evaluate(
    (ticket) => ticket.textContent,
    numberOfTickets
  );
  console.log("Number of tickets available: ", numberOfTicketsValue);

  try {
    const ticketWasClicked = await clickVisibleTicket();
    console.log("Ticket was clicked: ", ticketWasClicked);
    if (!ticketWasClicked) {
      await reloadPageAfterSelection();
      await clickVisibleTicket();
    }

    await page.waitForNavigation();
    await page.click("ZUR KASSE");
  } catch (error) {
    console.log("Error in ticket selector: ", error);
  }
};

let element = null;

const reload = async () => {
  const randomUserAgent = new UserAgent({ deviceCategory: "mobile" })
    .random()
    .toString();
  await page.setUserAgent(randomUserAgent);
  console.log("Looking for tickets as ", randomUserAgent);
  try {
    await page.reload();
    await acceptCookies();
    const ticketDiv = await page.$(".EventEntryList");
    element = ticketDiv; // place where the tickets are shown

    if (!element) return setTimeout(reload, REFRESH_INTERVAL); // no Tickets

    await page.screenshot({ path: `screenshot${Math.random()}.png` });
    await selectTicket();
  } catch (error) {
    console.log("Error in reload: ", error);
  }
};
reload();
sound.play(pathToHorn);
