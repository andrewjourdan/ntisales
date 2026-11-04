import { EmailMessage } from 'cloudflare:email';
import { handle, deliver } from './handler.mjs';
export default {
  fetch: handle,
  queue(batch, env) { return deliver(batch, env, (from, to, raw) => new EmailMessage(from, to, raw)); },
};
