import bcrypt from 'bcryptjs';
const p=process.argv[2];
if(!p||p.length<8){console.error('Usage: npm run hash-password -- "password-at-least-8-chars"');process.exit(1)}
console.log(bcrypt.hashSync(p,12));
