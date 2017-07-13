const fetch = require('isomorphic-fetch');

const VENUE_CATEGORY_FILLING_STATION = 1;
const VENUE_CATEGORY_REPAIR_SHOP = 2;


function callVenuesBackend(category, location, keyword) {
    let url = `https://api.carspending.com/venues/browse?categories[]=${category}&expand=statistics`;
    if (keyword) {
        url += `&keyword=${keyword}`;
    }
    if (typeof location === "string") {
        url += `&address=${location}`;
    } else {
        url += `&latitude=${location[0]}&longitude=${location[1]}`
    }

    const options = {
      method: 'GET',
      headers: {
        Accept: "application/json",
      }
    };
    console.log(url);
    return fetch(url, options);
};

module.exports = { callVenuesBackend, VENUE_CATEGORY_FILLING_STATION, VENUE_CATEGORY_REPAIR_SHOP };