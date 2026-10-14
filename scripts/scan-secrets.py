#!/usr/bin/env python3
"""Scan Git upload candidates without printing credential values. No network access."""
from pathlib import Path
import re, subprocess, sys, zipfile, xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parent.parent
files = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=ROOT).decode().split('\0')
patterns = [
 ('private-key', re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')),
 ('github-token', re.compile(r'gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}')),
 ('api-key', re.compile(r'sk-(?:proj-)?[A-Za-z0-9_-]{32,}|AKIA[0-9A-Z]{16}')),
 ('legacy-example-password', re.compile(r'(?i)remai@[0-9]{4}')),
 ('credential-url', re.compile(r'https?://[^\s/:<>]+:[^\s/@<>]+@')),
]
assignment = re.compile(r'''(?i)["']?(?:appsecret|clientsecret|tokenSecret|passwordSecret|api[_-]?key|private[_-]?key|admin[_-]?password|admin[_-]?token[_-]?secret)["']?\s*[:=]\s*["']([^"'\n]{8,})["']''')
placeholder = re.compile(r'(?i)placeholder|example|your[\s_-]|test[\s_-]|填写|示例|^<|^\[REDACTED\]|^\$|process\.env|import\.meta|key is required|secret must|secret.*missing')
findings = []
checked = 0
for rel in sorted(set(files)):
 if not rel: continue
 p=ROOT/rel
 if not p.is_file(): continue
 data=p.read_bytes();texts=[]
 if p.suffix.lower() in {'.docx','.pptx','.xlsx'}:
  try:
   with zipfile.ZipFile(p) as z:
    for name in z.namelist():
     if name.endswith(('.xml','.rels')):
      raw=z.read(name).decode('utf-8',errors='replace');texts.append(raw)
      try:texts.append(' '.join(ET.fromstring(raw).itertext()))
      except ET.ParseError:pass
  except zipfile.BadZipFile:findings.append((rel,'invalid-office-archive'))
 elif b'\0' not in data[:8192]:
  try:texts=[data.decode('utf-8')]
  except UnicodeDecodeError:pass
 checked+=1
 for text in texts:
  for label,pattern in patterns:
   if pattern.search(text):findings.append((rel,label))
  for match in assignment.finditer(text):
   if not placeholder.search(match.group(1)):
    # Tests contain generated keys and explicitly non-production fixtures.
    if rel.endswith(('.test.cjs','.test.js','.test.mjs')) and re.search(r'(?i)test|fixture|customer|wrong|malformed',match.group(1)):continue
    findings.append((rel,'literal-credential-assignment'))
for rel,label in sorted(set(findings)):print(f'FAIL {label}: {rel}')
print(f'Scanned {checked} Git candidate files; {len(set(findings))} findings. Binary image contents require separate visual review.')
sys.exit(bool(findings))
