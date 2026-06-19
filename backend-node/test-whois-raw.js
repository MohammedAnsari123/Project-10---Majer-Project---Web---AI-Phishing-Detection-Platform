const whois = require('whois');

whois.lookup('openai.com', (err, data) => {
  if (err) {
    console.error('ERROR:', err);
    return;
  }

  console.log('WHOIS DATA:');
  console.log(data);
});