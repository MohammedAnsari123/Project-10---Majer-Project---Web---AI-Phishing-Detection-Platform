const whois = require('whois-json');
const dns = require('dns');

console.log('Testing DNS...');

dns.lookup('whois.verisign-grs.com', (err, address) => {
  console.log('WHOIS DNS:', err || address);
});

dns.lookup('www.virustotal.com', (err, address) => {
  console.log('VT DNS:', err || address);
});

whois('openai.com')
  .then(data => {
    console.log('WHOIS RESULT:');
    console.dir(data, { depth: null });
  })
  .catch(err => {
    console.error('WHOIS ERROR:', err);
  });