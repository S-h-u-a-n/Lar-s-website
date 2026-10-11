#!/usr/bin/env python3
"""Read the original project; write the result only inside this Edition."""
from pathlib import Path
import hashlib, json, os, subprocess
from datetime import datetime, timezone
edition = Path(__file__).resolve().parents[1]
baseline = json.loads((edition / 'docs/original-baseline.json').read_text())
original = Path(baseline['root']).resolve()
if edition == original or edition.is_relative_to(original):
    raise SystemExit('Refusing to write a verification result inside the original project.')
changed, missing = [], []
for name, expected in baseline['files'].items():
    file = original / name
    if not file.is_file():
        missing.append(name)
        continue
    stat = file.stat()
    actual = {'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'size': stat.st_size, 'mtime_ns': stat.st_mtime_ns}
    if actual != expected:
        changed.append(name)
ignored = {'.git','node_modules','dist','.vscode','.codex','.agents','.aws'}
actual_names = set()
for parent, directories, files in os.walk(original):
    directories[:] = [directory for directory in directories if directory not in ignored]
    for name in files:
        if name != '.DS_Store':
            actual_names.add(str((Path(parent) / name).relative_to(original)))
added = sorted(actual_names - set(baseline['files']))
status = subprocess.run(['git','-C',str(original),'status','--porcelain=v1','-uall'], capture_output=True, text=True, check=True, env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}).stdout
result = {'verified_at_utc':datetime.now(timezone.utc).isoformat(), 'original':str(original),'edition':str(edition),'files_checked':len(baseline['files']),'changed_files':changed,'missing_files':missing,'added_files':added,'git_status_matches_baseline':status==baseline['git_status'],'passed':not changed and not missing and not added and status==baseline['git_status']}
(edition / 'docs/original-isolation-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(0 if result['passed'] else 1)
