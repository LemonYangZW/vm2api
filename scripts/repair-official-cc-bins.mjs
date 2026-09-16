/**
 * Rewrite host-dangling Claude CLI links written by install.sh
 * (`/home/kincli/.local/share/claude/versions/...`) to relative
 * `../share/claude/versions/<ver>`. File-only. No docker rm / worker roll.
 */
import { repairProjectOfficialClaudeBins } from '../src/lib/oauth/official-cc-bootstrap.mjs'

const root = process.argv[2] || '/opt/kin-gateway'
const items = repairProjectOfficialClaudeBins(root)
const repaired = items.filter((item) => item.repaired)
const ok = items.filter((item) => item.ok)
const missing = items.filter((item) => !item.ok)
console.log(
  JSON.stringify(
    {
      project: root,
      scanned: items.length,
      ok: ok.length,
      repaired: repaired.length,
      missing: missing.map((item) => item.vm_id),
      repaired_ids: repaired.map((item) => item.vm_id),
    },
    null,
    2,
  ),
)
