const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeSchemes() {

  const response = await axios.get(
    "https://www.myscheme.gov.in"
  );

  const $ = cheerio.load(response.data);

  const schemes = [];

  $(".scheme-card").each((i, el) => {

    schemes.push({
      schemeName: $(el).find("h2").text(),
      description: $(el)
        .find("p")
        .text(),
    });
  });

  return schemes;
}

module.exports = {
  scrapeSchemes,
};
