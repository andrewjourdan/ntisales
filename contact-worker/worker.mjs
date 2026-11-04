import { EmailMessage } from 'cloudflare:email';
import { handle } from './handler.mjs';
export default { fetch(request, env) { return handle(request, env, (from,to,raw)=>new EmailMessage(from,to,raw)); } };
