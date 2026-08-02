const Redis = require('ioredis');

const url = 'rediss://default:pass@host.upstash.io:30000';
const redis = new Redis(url, { lazyConnect: true });

console.log('Redis options TLS:', redis.options.tls);
console.log('Redis port:', redis.options.port);
console.log('Redis host:', redis.options.host);
process.exit(0);
