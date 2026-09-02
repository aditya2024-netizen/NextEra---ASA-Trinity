import serverMod from '../dist/server.cjs';

const app =
  serverMod?.default?.default ||
  serverMod?.default?.app ||
  serverMod?.default ||
  serverMod;

export default function handler(req, res) {
  return app(req, res);
}
