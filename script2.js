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



const fanSale= 'https://www.oeticket.com/artist/taylor-swift/?affiliate=O66&referer_info=_34434&uid=d493b1b67b00c06947f0b6e94327933a0fd5432c75af4b903d05936d6c306900&utm_campaign=..426785806504.20230710&utm_term=teaser13' 
const REFRESH_INTERVAL = 10000;
const pathToHorn = path.join(import.meta.dirname, "notify.mp3");
const browser = await puppeteer.launch({
  channel: "chrome",
  headless: false,
  browserWSEndpoint: "wss://brd-customer-hl_67d82a75-zone-scraping_browser1:gvplfcdeqea7@brd.superproxy.io:9222",
});

const page = (await browser.pages())[0];
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await page.goto(fanSale);


async function acceptCookies() {
    const accessAllowed = await page.$(".artwork-content-text");
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


await acceptCookies();



const inputPromotionCode = async () => {
    sound.play(pathToHorn);
    const promotionCode = 'AW7MARAKJK'
    const inputField = await page.evaluateHandle('document.querySelector("#promoComponent > form.card-content.no-padding-bottom.no-padding-top.js-promo-form.js-cc-promo-submit-form > div > div.enter-promo-code-wrapper > div.u-flex-v-top.enter-promo-code > div.promotion-code-input.js-promo-input > div > div > input")')
    const confirmButton = await page.evaluateHandle('document.querySelector("#promoComponent > form.card-content.no-padding-bottom.no-padding-top.js-promo-form.js-cc-promo-submit-form > div > div.enter-promo-code-wrapper > div.show-promo-code > div")')
   
    try {
        await inputField.type(promotionCode)
        await confirmButton.click()

    }
    catch (error) {
        console.log("Error in input promotion code: ", error);
    }
}

const reloadPage = async () => {
    try {
        await page.reload()

        const availableTextElement = await page.evaluateHandle('document.querySelector("#componentLoader-id1 > div:nth-child(4) > div > article > div > div.col-xs-9.col-sm-9.col-md-10.event-listing-info-wrapper > div > div.col-sm-4.col-md-3.event-listing-buy.margin-right-xs.hidden-xs.js-event-listing-buy > span > span.theme-text-marginal-color")')
        const availableText = await page.evaluate((element) => element.innerText, availableTextElement)
        const isAvailable = !availableText.includes("nicht verfügbar")

        if(!isAvailable) {
            console.log("Not available yet")
            return setTimeout(reloadPage, REFRESH_INTERVAL)
        }

        const clickableTicket = await page.evaluateHandle('document.querySelector("#componentLoader-id1 > div:nth-child(5) > div > article > div > div.col-xs-9.col-sm-9.col-md-10.event-listing-info-wrapper > div > div.js-cal-listing-info-inner.col-xs-9.col-sm-8.col-md-7.event-listing-info-inner")')
        await clickableTicket.click()
        await inputPromotionCode()
    }
    catch (error) {
        console.log("Error in reload page: ", error);
    }
}

reloadPage();