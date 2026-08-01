import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { parseUpdateIssueBody } from './parse-submission.mjs'

const resultFile =
  process.env.RESULT_FILE || `${process.env.RUNNER_TEMP || '.'}/submission-result.json`
const dataFile = 'src/data/submissions.json'
const result = parseUpdateIssueBody(process.env.ISSUE_BODY || '', {
  issueNumber: process.env.ISSUE_NUMBER || '0',
  issueUrl: process.env.ISSUE_URL || '',
  submittedBy: process.env.SUBMITTED_BY || '',
})

if (!result.ok) {
  await writeFile(resultFile, JSON.stringify(result, null, 2))
  await writeOutputs(result)
  console.error(JSON.stringify(result))
  process.exitCode = 1
} else {
  const submissions = JSON.parse(await readFile(dataFile, 'utf8'))
  const index = submissions.findIndex((submission) => submission.id === result.update.id)
  if (index < 0) {
    const missing = {
      ok: false,
      errors: [`找不到作品 ID「${result.update.id}」。只有已发布的投稿条目可以通过此模板更新。`],
    }
    await writeFile(resultFile, JSON.stringify(missing, null, 2))
    await writeOutputs(missing)
    console.error(JSON.stringify(missing))
    process.exitCode = 1
  } else {
    const existing = submissions[index]
    const updated = { ...existing, ...result.update.changes }
    submissions[index] = updated
    const changed = {
      ok: true,
      changed: JSON.stringify(existing) !== JSON.stringify(updated),
      duplicate: false,
      update: result.update,
      submission: updated,
    }
    await writeFile(dataFile, `${JSON.stringify(submissions, null, 2)}\n`)
    await writeFile(resultFile, JSON.stringify(changed, null, 2))
    await writeOutputs(changed)
    console.log(JSON.stringify(changed))
  }
}

async function writeOutputs(value) {
  if (!process.env.GITHUB_OUTPUT) return
  await appendFile(process.env.GITHUB_OUTPUT, `changed=${value.changed === true}\n`)
  const title = value.submission?.title || value.update?.id || ''
  if (title) await appendFile(process.env.GITHUB_OUTPUT, `work_title<<EOF\n${title}\nEOF\n`)
}
