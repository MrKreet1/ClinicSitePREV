#!/usr/bin/env node
/* Rebuilds the static Russian copy of the privacy policy in privacy.html from privacy-content.js,
   so the page is readable without JavaScript. Run: node scripts/build-privacy.cjs */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const siteDir = path.resolve(__dirname, '..');
const htmlPath = path.join(siteDir, 'privacy.html');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(siteDir, 'privacy-content.js'), 'utf8'), sandbox);
const sections = sandbox.window.CLINIC_PRIVACY.ru;

const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = '        ';

const body = sections.map((section, i) => {
  const lines = [`${pad}<section class="policy-section" aria-labelledby="pp-${i}">`];
  lines.push(`${pad}  <h2 id="pp-${i}" data-i18n="pp-${i}-h">${escape(section.h)}</h2>`);
  (section.p || []).forEach((text, j) => lines.push(`${pad}  <p data-i18n="pp-${i}-p${j}">${escape(text)}</p>`));
  if (section.ul) {
    lines.push(`${pad}  <ul class="guide-list">`);
    section.ul.forEach((text, j) => lines.push(`${pad}    <li data-i18n="pp-${i}-li${j}">${escape(text)}</li>`));
    lines.push(`${pad}  </ul>`);
  }
  (section.p2 || []).forEach((text, j) => lines.push(`${pad}  <p data-i18n="pp-${i}-q${j}">${escape(text)}</p>`));
  lines.push(`${pad}</section>`);
  return lines.join('\n');
}).join('\n');

const start = '<!-- privacy:start -->';
const end = '<!-- privacy:end -->';
const html = fs.readFileSync(htmlPath, 'utf8');
const a = html.indexOf(start);
const b = html.indexOf(end);
if (a < 0 || b < a) throw new Error('privacy.html: markers not found');
const eol = html.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync(htmlPath, `${html.slice(0, a + start.length)}${eol}${body.replace(/\n/g, eol)}${eol}${pad}${html.slice(b)}`);
console.log(`privacy.html: ${sections.length} sections written`);
