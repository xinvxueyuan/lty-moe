import { readFile, writeFile } from 'node:fs/promises'

export const DISCUSSION_MARKER = 'lty-moe:work:v1'
export const DISCUSSION_CATEGORY = '作品档案'

const graphqlEndpoint = 'https://api.github.com/graphql'
const submissionsFile = 'src/data/submissions.json'
const authorsFile = 'src/data/authors.json'

export function normalizeAuthorId(handle, creator) {
  return (handle || creator || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function normalizeUrl(value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$)/i.test(key)) url.searchParams.delete(key)
    }
    return url.toString().replace(/\/$/, '').toLowerCase()
  } catch {
    return value.trim().toLowerCase().replace(/\/$/, '')
  }
}

export function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function parseDiscussionBody(body) {
  const match = String(body || '').match(
    new RegExp(`<!--\\s*${DISCUSSION_MARKER}\\s*\\n([\\s\\S]*?)\\n\\s*-->`),
  )
  if (!match) return { ok: false, error: '缺少 lty-moe 作品数据区块。' }
  try {
    const payload = JSON.parse(match[1])
    if (payload.schemaVersion !== 1 || !payload.id || !payload.title) {
      return { ok: false, error: '作品数据区块版本或必要字段无效。' }
    }
    return { ok: true, payload }
  } catch {
    return { ok: false, error: '作品数据区块不是有效 JSON。' }
  }
}

export function buildDiscussionBody(work) {
  const payload = {
    schemaVersion: 1,
    id: work.id,
    sourceIssue: work.sourceIssue,
    sourceIssueUrl: work.sourceIssueUrl || '',
    sourceUrl: work.sourceUrl || null,
    title: work.title,
    creator: work.creator,
    handle: work.handle,
    canonicalAuthorId: work.canonicalAuthorId || normalizeAuthorId(work.handle, work.creator),
    category: work.category,
    image: work.image,
    description: work.description,
    date: work.date,
    license: work.license || '未声明',
    maintainers: work.maintainers || [],
    coAuthors: work.coAuthors || [],
    aiDisclosure: work.aiDisclosure || '未披露',
    origin: work.origin || '未声明',
    submittedBy: work.submittedBy || '',
    updatedAt: new Date().toISOString(),
  }
  return `<!-- ${DISCUSSION_MARKER}\n${JSON.stringify(payload)}\n-->\n\n# ${work.title}\n\n${work.description}`
}

export function discussionToSubmission(discussion, payload) {
  return {
    id: payload.id,
    sourceIssue: Number(payload.sourceIssue || 0),
    sourceIssueUrl: payload.sourceIssueUrl || '',
    sourceUrl: payload.sourceUrl || null,
    submittedBy: payload.submittedBy || '',
    title: payload.title,
    creator: payload.creator,
    handle: payload.handle || normalizeAuthorId('', payload.creator),
    canonicalAuthorId:
      payload.canonicalAuthorId || normalizeAuthorId(payload.handle, payload.creator),
    category: payload.category,
    image: payload.image,
    description: payload.description || '',
    date: payload.date || discussion.createdAt.slice(0, 10).replaceAll('-', '.'),
    likes: '0',
    comments: discussion.comments?.totalCount || 0,
    palette: ['#73d9e0', '#ff70aa', '#182124'],
    license: payload.license || '未声明',
    maintainers: payload.maintainers || [],
    coAuthors: payload.coAuthors || [],
    aiDisclosure: payload.aiDisclosure || '未披露',
    origin: payload.origin || '未声明',
    discussionNumber: discussion.number,
    discussionId: discussion.id,
    discussionUrl: discussion.url,
  }
}

export function duplicateKey(payload) {
  if (payload.sourceIssue) return `issue:${payload.sourceIssue}`
  const sourceUrl = normalizeUrl(payload.sourceUrl)
  if (sourceUrl) return `url:${sourceUrl}`
  const authorId = payload.canonicalAuthorId || normalizeAuthorId(payload.handle, payload.creator)
  return authorId && payload.title
    ? `author-title:${authorId}:${normalizeTitle(payload.title)}`
    : ''
}

export function mergeDuplicatePayloads(items) {
  const sorted = [...items].sort((a, b) =>
    a.discussion.createdAt.localeCompare(b.discussion.createdAt),
  )
  const [canonical, ...duplicates] = sorted
  const merged = { ...canonical.payload }
  for (const item of duplicates) {
    for (const key of [
      'title',
      'creator',
      'handle',
      'category',
      'image',
      'description',
      'date',
      'license',
      'aiDisclosure',
      'origin',
      'sourceUrl',
    ]) {
      if (item.payload[key]) merged[key] = item.payload[key]
    }
    for (const key of ['maintainers', 'coAuthors']) {
      merged[key] = [...new Set([...(merged[key] || []), ...(item.payload[key] || [])])]
    }
  }
  merged.id = canonical.payload.id
  merged.canonicalAuthorId = normalizeAuthorId(merged.handle, merged.creator)
  return { canonical, duplicates, payload: merged }
}

export function normalizeAuthors(submissions) {
  const authors = new Map()
  for (const work of submissions) {
    const id = work.canonicalAuthorId || normalizeAuthorId(work.handle, work.creator)
    if (!id) continue
    const author = authors.get(id) || {
      id,
      displayName: work.creator,
      handles: [],
      aliases: [],
      workIds: [],
    }
    if (
      work.creator &&
      work.creator !== author.displayName &&
      !author.aliases.includes(work.creator)
    ) {
      author.aliases.push(work.creator)
    }
    if (work.handle && !author.handles.includes(work.handle)) author.handles.push(work.handle)
    if (!author.workIds.includes(work.id)) author.workIds.push(work.id)
    authors.set(id, author)
  }
  return [...authors.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function createGraphqlClient(token, fetchImpl = globalThis.fetch) {
  return async function graphql(query, variables = {}) {
    const response = await fetchImpl(graphqlEndpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'lty-moe-discussions-sync',
      },
      body: JSON.stringify({ query, variables }),
    })
    if (!response.ok) throw new Error(`GitHub GraphQL HTTP ${response.status}`)
    const result = await response.json()
    if (result.errors?.length)
      throw new Error(result.errors.map((error) => error.message).join('; '))
    return result.data
  }
}

async function findCategory(graphql, owner, name) {
  const data = await graphql(
    `
      query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
          discussionCategories(first: 25) {
            nodes {
              id
              name
            }
          }
        }
      }
    `,
    { owner, name },
  )
  const category = data.repository.discussionCategories.nodes.find(
    (item) => item.name === DISCUSSION_CATEGORY,
  )
  if (!category)
    throw new Error(`找不到 Discussions 分类「${DISCUSSION_CATEGORY}」，请先在仓库设置中创建。`)
  return { repositoryId: data.repository.id, categoryId: category.id }
}

async function listDiscussions(graphql, owner, name) {
  const result = []
  let cursor = null
  do {
    const data = await graphql(
      `
        query ($owner: String!, $name: String!, $cursor: String) {
          repository(owner: $owner, name: $name) {
            discussions(first: 100, after: $cursor) {
              nodes {
                id
                number
                title
                body
                url
                createdAt
                closed
                category {
                  name
                }
                comments {
                  totalCount
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
      { owner, name, cursor },
    )
    result.push(
      ...data.repository.discussions.nodes.filter(
        (item) => item.category?.name === DISCUSSION_CATEGORY && !item.closed,
      ),
    )
    cursor = data.repository.discussions.pageInfo.hasNextPage
      ? data.repository.discussions.pageInfo.endCursor
      : null
  } while (cursor)
  return result
}

async function createDiscussion(graphql, repositoryId, categoryId, work) {
  return graphql(
    `
      mutation ($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
        createDiscussion(
          input: {
            repositoryId: $repositoryId
            categoryId: $categoryId
            title: $title
            body: $body
          }
        ) {
          discussion {
            id
            number
            url
          }
        }
      }
    `,
    { repositoryId, categoryId, title: `[作品] ${work.title}`, body: buildDiscussionBody(work) },
  )
}

async function updateDiscussion(graphql, discussionId, title, body) {
  return graphql(
    `
      mutation ($discussionId: ID!, $title: String!, $body: String!) {
        updateDiscussion(input: { discussionId: $discussionId, title: $title, body: $body }) {
          discussion {
            id
            number
            url
          }
        }
      }
    `,
    { discussionId, title, body },
  )
}

async function closeDiscussion(graphql, discussionId) {
  return graphql(
    `
      mutation ($discussionId: ID!) {
        closeDiscussion(input: { discussionId: $discussionId }) {
          discussion {
            id
          }
        }
      }
    `,
    { discussionId },
  )
}

async function loadSubmissions() {
  return JSON.parse(await readFile(submissionsFile, 'utf8'))
}

async function publishMissing(graphql, category, discussions, submissions) {
  const byId = new Map()
  for (const discussion of discussions) {
    const parsed = parseDiscussionBody(discussion.body)
    if (parsed.ok) byId.set(parsed.payload.id, discussion)
  }
  for (const submission of submissions) {
    const existing = byId.get(submission.id)
    if (existing) {
      await updateDiscussion(
        graphql,
        existing.id,
        `[作品] ${submission.title}`,
        buildDiscussionBody(submission),
      )
    } else {
      await createDiscussion(graphql, category.repositoryId, category.categoryId, submission)
    }
  }
}

async function normalizeDiscussions(graphql, discussions) {
  const parsed = discussions
    .map((discussion) => ({ discussion, parsed: parseDiscussionBody(discussion.body) }))
    .filter((item) => item.parsed.ok)
    .map(({ discussion, parsed }) => ({ discussion, payload: parsed.payload }))
  const groups = new Map()
  for (const item of parsed) {
    const key = duplicateKey(item.payload)
    if (key) groups.set(key, [...(groups.get(key) || []), item])
  }
  for (const items of groups.values()) {
    if (items.length < 2) continue
    const merged = mergeDuplicatePayloads(items)
    await updateDiscussion(
      graphql,
      merged.canonical.discussion.id,
      `[作品] ${merged.payload.title}`,
      buildDiscussionBody(merged.payload),
    )
    for (const duplicate of merged.duplicates)
      await closeDiscussion(graphql, duplicate.discussion.id)
  }
}

export async function syncDiscussions({ token, owner, name, fetchImpl = globalThis.fetch } = {}) {
  if (!token || !owner || !name) throw new Error('需要 token、owner 和 name。')
  const graphql = createGraphqlClient(token, fetchImpl)
  const category = await findCategory(graphql, owner, name)
  const submissions = await loadSubmissions()
  let discussions = await listDiscussions(graphql, owner, name)
  await publishMissing(graphql, category, discussions, submissions)
  discussions = await listDiscussions(graphql, owner, name)
  await normalizeDiscussions(graphql, discussions)
  discussions = await listDiscussions(graphql, owner, name)
  const normalized = discussions
    .map((discussion) => {
      const parsed = parseDiscussionBody(discussion.body)
      return parsed.ok ? discussionToSubmission(discussion, parsed.payload) : null
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id))
  await writeFile(submissionsFile, `${JSON.stringify(normalized, null, 2)}\n`)
  await writeFile(authorsFile, `${JSON.stringify(normalizeAuthors(normalized), null, 2)}\n`)
  return { submissions: normalized.length, discussions: discussions.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [owner, name] = (process.env.GITHUB_REPOSITORY || '').split('/')
  try {
    const result = await syncDiscussions({
      token: process.env.GITHUB_TOKEN || process.env.DISCUSSIONS_TOKEN,
      owner,
      name,
    })
    console.log(JSON.stringify(result))
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
