/**
 * rotary_user_agents.js
 * Comprehensive Rotary Fake User-Agent & Header Cycling Engine.
 * 100% Free, 0 API Keys, Limitless Quota Bypass.
 * Provides realistic browser headers (Chrome, Firefox, Safari, Edge across Windows, macOS, Linux).
 * Developed by J.D | Duino Inc. All rights are preserved.
 */

const USER_AGENTS = [
  // Windows - Chrome
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: '"Windows"',
    brands: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    platform: '"Windows"',
    brands: '"Google Chrome";v="130", "Chromium";v="130", "Not?A_Brand";v="99"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    platform: '"Windows"',
    brands: '"Google Chrome";v="129", "Chromium";v="129", "Not=A?Brand";v="8"',
    mobile: '?0'
  },
  // Windows - Edge
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    platform: '"Windows"',
    brands: '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    platform: '"Windows"',
    brands: '"Microsoft Edge";v="130", "Chromium";v="130", "Not?A_Brand";v="99"',
    mobile: '?0'
  },
  // Windows - Firefox
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    platform: '"Windows"',
    brands: null,
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
    platform: '"Windows"',
    brands: null,
    mobile: '?0'
  },
  // macOS - Safari
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    platform: '"macOS"',
    brands: null,
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
    platform: '"macOS"',
    brands: null,
    mobile: '?0'
  },
  // macOS - Chrome
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: '"macOS"',
    brands: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    platform: '"macOS"',
    brands: '"Google Chrome";v="130", "Chromium";v="130", "Not?A_Brand";v="99"',
    mobile: '?0'
  },
  // macOS - Firefox
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:132.0) Gecko/20100101 Firefox/132.0',
    platform: '"macOS"',
    brands: null,
    mobile: '?0'
  },
  // Linux - Chrome
  {
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: '"Linux"',
    brands: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    mobile: '?0'
  },
  {
    ua: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
    platform: '"Linux"',
    brands: null,
    mobile: '?0'
  }
];

const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'en-US,en;q=0.9,en-GB;q=0.8',
  'en-GB,en-US;q=0.9,en;q=0.8',
  'en-CA,en-US;q=0.9,en;q=0.8',
  'en-AU,en-US;q=0.9,en;q=0.8'
];

/**
 * Generates an obfuscated realistic residential IP for client forward headers
 */
function generateRandomIP() {
  const prefixes = [
    [24, Math.floor(Math.random() * 255)],
    [67, Math.floor(Math.random() * 255)],
    [71, Math.floor(Math.random() * 255)],
    [73, Math.floor(Math.random() * 255)],
    [76, Math.floor(Math.random() * 255)],
    [98, Math.floor(Math.random() * 255)],
    [104, Math.floor(Math.random() * 255)],
    [172, Math.floor(Math.random() * 255)]
  ];
  const pick = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${pick[0]}.${pick[1]}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

let currentIndex = 0;

/**
 * Returns a fresh rotary profile with synchronized HTTP headers for undetectable requests
 */
function getRotaryProfile(service = 'general') {
  currentIndex = (currentIndex + 1) % USER_AGENTS.length;
  const item = USER_AGENTS[currentIndex];
  const lang = ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)];
  const randomIP = generateRandomIP();

  const headers = {
    'User-Agent': item.ua,
    'Accept-Language': lang,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  if (service !== 'superhumanizer') {
    headers['X-Forwarded-For'] = randomIP;
    headers['X-Real-IP'] = randomIP;
  }

  if (item.brands) {
    headers['sec-ch-ua'] = item.brands;
    headers['sec-ch-ua-mobile'] = item.mobile;
    headers['sec-ch-ua-platform'] = item.platform;
  }

  if (service === 'zerogpt') {
    headers['Accept'] = 'application/json, text/plain, */*';
    headers['Content-Type'] = 'application/json';
    headers['Origin'] = 'https://www.zerogpt.com';
    headers['Referer'] = 'https://www.zerogpt.com/';
    headers['Sec-Fetch-Dest'] = 'empty';
    headers['Sec-Fetch-Mode'] = 'cors';
    headers['Sec-Fetch-Site'] = 'same-site';
  } else if (service === 'superhumanizer') {
    headers['Accept'] = 'application/json, text/plain, */*';
    headers['Content-Type'] = 'application/json';
    headers['Origin'] = 'https://superhumanizer.ai';
    headers['Referer'] = 'https://superhumanizer.ai/';
    headers['Sec-Fetch-Dest'] = 'empty';
    headers['Sec-Fetch-Mode'] = 'cors';
    headers['Sec-Fetch-Site'] = 'same-origin';
  }

  return {
    userAgent: item.ua,
    platform: item.platform,
    headers: headers,
    clientIP: randomIP
  };
}

module.exports = {
  USER_AGENTS,
  getRotaryProfile,
  generateRandomIP
};
