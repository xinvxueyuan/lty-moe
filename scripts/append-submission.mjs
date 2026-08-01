import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { parseIssueBody } from './parse-submission.mjs'

const resultFile = process.env.RESULT_FILE || `${process.env.RUNNER_TEMP || '.'}/submission-result.json`
const dataFile = 'src/data/submissions.json'
const result = parseIssueBody(process.env.ISSUE_BODY || '', {
  issueNumber: process.env.ISSUE_NUMBER || '0',
  issueUrl: process.env.ISSUE_URL || '',
  submittedBy: process.env.SUBMITTED_BY || '',
})

if (result.ok) {
  const submissions = JSON.parse(await readFile(dataFile, 'utf8'))
  const existing = submissions.find((submission) => submission.sourceIssue === result.submission.sourceIssue)
  if (existing) {
    const duplicate = { ok: true, changed: false, duplicate: true, submission: existing }
    await writeFile(resultFile, JSON.stringify(duplicate, null, 2))
    await writeOutputs(duplicate)
    console.log(JSON.stringify(duplicate))
    process.exit(0)
  }

  submissions.push(result.submission)
  await writeFile(dataFile, `${JSON.stringify(submissions, null, 2)}\n`)
  const changed = { ok: true, changed: true, duplicate: false, submission: result.submission }
  await writeFile(resultFile, JSON.stringify(changed, null, 2))
  await writeOutputs(changed)
  console.log(JSON.stringify(changed))
} else {
  await writeFile(resultFile, JSON.stringify(result, null, 2))
  await writeOutputs(result)
  console.error(JSON.stringify(result))
  process.exitCode = 1
}

async function writeOutputs(value) {
  if (!process.env.GITHUB_OUTPUT) return
  await appendFile(process.env.GITHUB_OUTPUT, `changed=${value.changed === true}\n`)
  if (value.submission) {
    await appendFile(process.env.GITHUB_OUTPUT, `work_title<<EOF\n${value.submission.title}\nEOF\n`)
  }
}
