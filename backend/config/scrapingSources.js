/**
 * Scraping Sources Configuration
 * 
 * Defines all government scheme websites that can be scraped
 * to expand the knowledge base when no eligible schemes are found.
 */

const scrapingSources = {
  // Primary source - Official government portal
  myscheme: {
    name: 'MyScheme.gov.in',
    url: 'https://www.myscheme.gov.in/search',
    enabled: true,
    priority: 1,
    description: 'Official Government of India scheme portal',
    scraper: 'myschemeScraper'
  },

  // State-specific portals - All Indian States and Union Territories
  andamanNicobar: {
    name: 'Andaman and Nicobar Islands',
    url: 'https://www.myscheme.gov.in/search/state/Andaman%20and%20Nicobar%20Islands',
    enabled: true,
    priority: 2,
    description: 'Andaman and Nicobar Islands schemes',
    scraper: 'genericScraper'
  },

  andhrapradesh: {
    name: 'Andhra Pradesh',
    url: 'https://www.myscheme.gov.in/search/state/Andhra%20Pradesh',
    enabled: true,
    priority: 2,
    description: 'Andhra Pradesh state schemes',
    scraper: 'genericScraper'
  },

  arunachalpradesh: {
    name: 'Arunachal Pradesh',
    url: 'https://www.myscheme.gov.in/search/state/Arunachal%20Pradesh',
    enabled: true,
    priority: 2,
    description: 'Arunachal Pradesh state schemes',
    scraper: 'genericScraper'
  },

  assam: {
    name: 'Assam',
    url: 'https://www.myscheme.gov.in/search/state/Assam',
    enabled: true,
    priority: 2,
    description: 'Assam state schemes',
    scraper: 'genericScraper'
  },

  bihar: {
    name: 'Bihar',
    url: 'https://www.myscheme.gov.in/search/state/Bihar',
    enabled: true,
    priority: 2,
    description: 'Bihar state schemes',
    scraper: 'genericScraper'
  },

  chandigarh: {
    name: 'Chandigarh',
    url: 'https://www.myscheme.gov.in/search/state/Chandigarh',
    enabled: true,
    priority: 2,
    description: 'Chandigarh schemes',
    scraper: 'genericScraper'
  },

  chhattisgarh: {
    name: 'Chhattisgarh',
    url: 'https://www.myscheme.gov.in/search/state/Chhattisgarh',
    enabled: true,
    priority: 2,
    description: 'Chhattisgarh state schemes',
    scraper: 'genericScraper'
  },

  dadraHaveliDamanDiu: {
    name: 'Dadra & Nagar Haveli and Daman & Diu',
    url: 'https://www.myscheme.gov.in/search/state/Dadra%20&%20Nagar%20Haveli%20and%20Daman%20&%20Diu',
    enabled: true,
    priority: 2,
    description: 'Dadra & Nagar Haveli and Daman & Diu schemes',
    scraper: 'genericScraper'
  },

  delhi: {
    name: 'Delhi',
    url: 'https://www.myscheme.gov.in/search/state/Delhi',
    enabled: true,
    priority: 2,
    description: 'Delhi schemes',
    scraper: 'genericScraper'
  },

  goa: {
    name: 'Goa',
    url: 'https://www.myscheme.gov.in/search/state/Goa',
    enabled: true,
    priority: 2,
    description: 'Goa state schemes',
    scraper: 'genericScraper'
  },

  gujarat: {
    name: 'Gujarat',
    url: 'https://www.myscheme.gov.in/search/state/Gujarat',
    enabled: true,
    priority: 2,
    description: 'Gujarat state schemes',
    scraper: 'genericScraper'
  },

  haryana: {
    name: 'Haryana',
    url: 'https://www.myscheme.gov.in/search/state/Haryana',
    enabled: true,
    priority: 2,
    description: 'Haryana state schemes',
    scraper: 'genericScraper'
  },

  himachalpradesh: {
    name: 'Himachal Pradesh',
    url: 'https://www.myscheme.gov.in/search/state/Himachal%20Pradesh',
    enabled: true,
    priority: 2,
    description: 'Himachal Pradesh state schemes',
    scraper: 'genericScraper'
  },

  jammuKashmir: {
    name: 'Jammu and Kashmir',
    url: 'https://www.myscheme.gov.in/search/state/Jammu%20and%20Kashmir',
    enabled: true,
    priority: 2,
    description: 'Jammu and Kashmir schemes',
    scraper: 'genericScraper'
  },

  jharkhand: {
    name: 'Jharkhand',
    url: 'https://www.myscheme.gov.in/search/state/Jharkhand',
    enabled: true,
    priority: 2,
    description: 'Jharkhand state schemes',
    scraper: 'genericScraper'
  },

  karnataka: {
    name: 'Karnataka',
    url: 'https://www.myscheme.gov.in/search/state/Karnataka',
    enabled: true,
    priority: 2,
    description: 'Karnataka state schemes',
    scraper: 'genericScraper'
  },

  kerala: {
    name: 'Kerala',
    url: 'https://www.myscheme.gov.in/search/state/Kerala',
    enabled: true,
    priority: 2,
    description: 'Kerala state schemes',
    scraper: 'genericScraper'
  },

  ladakh: {
    name: 'Ladakh',
    url: 'https://www.myscheme.gov.in/search/state/Ladakh',
    enabled: true,
    priority: 2,
    description: 'Ladakh schemes',
    scraper: 'genericScraper'
  },

  lakshadweep: {
    name: 'Lakshadweep',
    url: 'https://www.myscheme.gov.in/search/state/Lakshadweep',
    enabled: true,
    priority: 2,
    description: 'Lakshadweep schemes',
    scraper: 'genericScraper'
  },

  madhyapradesh: {
    name: 'Madhya Pradesh',
    url: 'https://www.myscheme.gov.in/search/state/Madhya%20Pradesh',
    enabled: true,
    priority: 2,
    description: 'Madhya Pradesh state schemes',
    scraper: 'genericScraper'
  },

  maharashtra: {
    name: 'Maharashtra',
    url: 'https://www.myscheme.gov.in/search/state/Maharashtra',
    enabled: true,
    priority: 2,
    description: 'Maharashtra state schemes',
    scraper: 'genericScraper'
  },

  manipur: {
    name: 'Manipur',
    url: 'https://www.myscheme.gov.in/search/state/Manipur',
    enabled: true,
    priority: 2,
    description: 'Manipur state schemes',
    scraper: 'genericScraper'
  },

  meghalaya: {
    name: 'Meghalaya',
    url: 'https://www.myscheme.gov.in/search/state/Meghalaya',
    enabled: true,
    priority: 2,
    description: 'Meghalaya state schemes',
    scraper: 'genericScraper'
  },

  mizoram: {
    name: 'Mizoram',
    url: 'https://www.myscheme.gov.in/search/state/Mizoram',
    enabled: true,
    priority: 2,
    description: 'Mizoram state schemes',
    scraper: 'genericScraper'
  },

  nagaland: {
    name: 'Nagaland',
    url: 'https://www.myscheme.gov.in/search/state/Nagaland',
    enabled: true,
    priority: 2,
    description: 'Nagaland state schemes',
    scraper: 'genericScraper'
  },

  odisha: {
    name: 'Odisha',
    url: 'https://www.myscheme.gov.in/search/state/Odisha',
    enabled: true,
    priority: 2,
    description: 'Odisha state schemes',
    scraper: 'genericScraper'
  },

  puducherry: {
    name: 'Puducherry',
    url: 'https://www.myscheme.gov.in/search/state/Puducherry',
    enabled: true,
    priority: 2,
    description: 'Puducherry schemes',
    scraper: 'genericScraper'
  },

  punjab: {
    name: 'Punjab',
    url: 'https://www.myscheme.gov.in/search/state/Punjab',
    enabled: true,
    priority: 2,
    description: 'Punjab state schemes',
    scraper: 'genericScraper'
  },

  rajasthan: {
    name: 'Rajasthan',
    url: 'https://www.myscheme.gov.in/search/state/Rajasthan',
    enabled: true,
    priority: 2,
    description: 'Rajasthan state schemes',
    scraper: 'genericScraper'
  },

  sikkim: {
    name: 'Sikkim',
    url: 'https://www.myscheme.gov.in/search/state/Sikkim',
    enabled: true,
    priority: 2,
    description: 'Sikkim state schemes',
    scraper: 'genericScraper'
  },

  tamilnadu: {
    name: 'Tamil Nadu',
    url: 'https://www.myscheme.gov.in/search/state/Tamil%20Nadu',
    enabled: true,
    priority: 2,
    description: 'Tamil Nadu state schemes',
    scraper: 'genericScraper'
  },

  telangana: {
    name: 'Telangana',
    url: 'https://www.myscheme.gov.in/search/state/Telangana',
    enabled: true,
    priority: 2,
    description: 'Telangana state schemes',
    scraper: 'genericScraper'
  },

  tripura: {
    name: 'Tripura',
    url: 'https://www.myscheme.gov.in/search/state/Tripura',
    enabled: true,
    priority: 2,
    description: 'Tripura state schemes',
    scraper: 'genericScraper'
  },

  uttarpradesh: {
    name: 'Uttar Pradesh',
    url: 'https://www.myscheme.gov.in/search/state/Uttar%20Pradesh',
    enabled: true,
    priority: 2,
    description: 'Uttar Pradesh state schemes',
    scraper: 'genericScraper'
  },

  uttarakhand: {
    name: 'Uttarakhand',
    url: 'https://www.myscheme.gov.in/search/state/Uttarakhand',
    enabled: true,
    priority: 2,
    description: 'Uttarakhand state schemes',
    scraper: 'genericScraper'
  },

  westbengal: {
    name: 'West Bengal',
    url: 'https://www.myscheme.gov.in/search/state/West%20Bengal',
    enabled: true,
    priority: 2,
    description: 'West Bengal state schemes',
    scraper: 'genericScraper'
  },

  // Category-based scraping from MyScheme.gov.in
  agriculture: {
    name: 'Agriculture, Rural & Environment',
    url: 'https://www.myscheme.gov.in/search/category/Agriculture,Rural%20&%20Environment',
    enabled: true,
    priority: 3,
    description: 'Agricultural and rural development schemes',
    scraper: 'genericScraper'
  },

  banking: {
    name: 'Banking, Financial Services and Insurance',
    url: 'https://www.myscheme.gov.in/search/category/Banking,Financial%20Services%20and%20Insurance',
    enabled: true,
    priority: 3,
    description: 'Banking and financial schemes',
    scraper: 'genericScraper'
  },

  business: {
    name: 'Business & Entrepreneurship',
    url: 'https://www.myscheme.gov.in/search/category/Business%20&%20Entrepreneurship',
    enabled: true,
    priority: 3,
    description: 'Business and entrepreneurship schemes',
    scraper: 'genericScraper'
  },

  education: {
    name: 'Education & Learning',
    url: 'https://www.myscheme.gov.in/search/category/Education%20&%20Learning',
    enabled: true,
    priority: 3,
    description: 'Education and learning schemes',
    scraper: 'genericScraper'
  },

  health: {
    name: 'Health & Wellness',
    url: 'https://www.myscheme.gov.in/search/category/Health%20&%20Wellness',
    enabled: true,
    priority: 3,
    description: 'Health and wellness schemes',
    scraper: 'genericScraper'
  },

  housing: {
    name: 'Housing & Shelter',
    url: 'https://www.myscheme.gov.in/search/category/Housing%20&%20Shelter',
    enabled: true,
    priority: 3,
    description: 'Housing and shelter schemes',
    scraper: 'genericScraper'
  },

  publicSafety: {
    name: 'Public Safety, Law & Justice',
    url: 'https://www.myscheme.gov.in/search/category/Public%20Safety,Law%20&%20Justice',
    enabled: true,
    priority: 3,
    description: 'Public safety and justice schemes',
    scraper: 'genericScraper'
  },

  science: {
    name: 'Science, IT & Communications',
    url: 'https://www.myscheme.gov.in/search/category/Science,%20IT%20&%20Communications',
    enabled: true,
    priority: 3,
    description: 'Science and technology schemes',
    scraper: 'genericScraper'
  },

  skills: {
    name: 'Skills & Employment',
    url: 'https://www.myscheme.gov.in/search/category/Skills%20&%20Employment',
    enabled: true,
    priority: 3,
    description: 'Skills development and employment schemes',
    scraper: 'genericScraper'
  },

  socialWelfare: {
    name: 'Social Welfare & Empowerment',
    url: 'https://www.myscheme.gov.in/search/category/Social%20welfare%20&%20Empowerment',
    enabled: true,
    priority: 3,
    description: 'Social welfare schemes',
    scraper: 'genericScraper'
  },

  sports: {
    name: 'Sports & Culture',
    url: 'https://www.myscheme.gov.in/search/category/Sports%20&%20Culture',
    enabled: true,
    priority: 3,
    description: 'Sports and culture schemes',
    scraper: 'genericScraper'
  },

  transport: {
    name: 'Transport & Infrastructure',
    url: 'https://www.myscheme.gov.in/search/category/Transport%20&%20Infrastructure',
    enabled: true,
    priority: 3,
    description: 'Transport and infrastructure schemes',
    scraper: 'genericScraper'
  },

  travel: {
    name: 'Travel & Tourism',
    url: 'https://www.myscheme.gov.in/search/category/Travel%20&%20Tourism',
    enabled: true,
    priority: 3,
    description: 'Travel and tourism schemes',
    scraper: 'genericScraper'
  },

  utility: {
    name: 'Utility & Sanitation',
    url: 'https://www.myscheme.gov.in/search/category/Utility%20&%20Sanitation',
    enabled: true,
    priority: 3,
    description: 'Utility and sanitation schemes',
    scraper: 'genericScraper'
  },

  women: {
    name: 'Women and Child',
    url: 'https://www.myscheme.gov.in/search/category/Women%20and%20Child',
    enabled: true,
    priority: 3,
    description: 'Women and child welfare schemes',
    scraper: 'genericScraper'
  }
};

/**
 * Get enabled scraping sources sorted by priority
 */
function getEnabledSources() {
  return Object.entries(scrapingSources)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([key, config]) => ({ key, ...config }));
}

/**
 * Get source by key
 */
function getSource(key) {
  return scrapingSources[key];
}

/**
 * Get sources by priority level
 */
function getSourcesByPriority(priority) {
  return Object.entries(scrapingSources)
    .filter(([_, config]) => config.enabled && config.priority === priority)
    .map(([key, config]) => ({ key, ...config }));
}

/**
 * Get state-specific sources
 */
function getStateSource(state) {
  const stateKey = state.toLowerCase().replace(/\s+/g, '');
  return scrapingSources[stateKey];
}

module.exports = {
  scrapingSources,
  getEnabledSources,
  getSource,
  getSourcesByPriority,
  getStateSource
};

//                                                                      
