import bcrypt from 'bcryptjs';
const p=process.argv[2];
if(!p||p.length<12){console.error('Usage: npm run hash-password -- "password-at-least-12-chars"');process.exit(1)}
console.log(bcrypt.hashSync(p,12));
