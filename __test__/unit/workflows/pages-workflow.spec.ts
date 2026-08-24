import path from 'node:path'

import fs from 'fs-extra'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

interface WorkflowStep {
  name?: string
  uses?: string
  with?: Record<string, unknown>
}

interface WorkflowJob {
  env?: Record<string, unknown>
  if?: string
  needs?: string | string[]
  permissions?: Record<string, string>
  steps?: WorkflowStep[]
  strategy?: {
    matrix?: Record<string, unknown>
  }
}

interface Workflow {
  jobs: Record<string, WorkflowJob>
  on?: Record<string, unknown>
}

const workflowDir = path.resolve(process.cwd(), '..', '.github', 'workflows')
const matrixShardExpression = '$' + '{{ matrix.shard }}'
const workflowHeadShaExpression = '$' + '{{ github.event.workflow_run.head_sha }}'
const workflowRunIdExpression = '$' + '{{ github.event.workflow_run.id }}'

describe('template gallery workflows', () => {
  it('publish 的 12 个矩阵分片分别上传展厅制品', async () => {
    const workflow = await readWorkflow('publish.yml')
    const matrixJob = workflow.jobs['full-matrix']
    const shards = matrixJob?.strategy?.matrix?.shard
    const uploadStep = matrixJob?.steps?.find(step => step.name === 'Upload template gallery shard')

    expect(shards).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(matrixJob?.env?.MATRIX_EXPORT_DIR).toContain(`shard-${matrixShardExpression}`)
    expect(uploadStep?.uses).toBe('actions/upload-artifact@v6')
    expect(uploadStep?.with?.name).toBe(`template-gallery-shard-${matrixShardExpression}`)
    expect(uploadStep?.with?.['if-no-files-found']).toBe('error')
    expect(uploadStep?.with?.['retention-days']).toBe(14)
  })

  it('pages 从成功的 main publish 下载同一提交制品并使用最小部署权限', async () => {
    const workflow = await readWorkflow('pages.yml')
    const buildJob = workflow.jobs.build
    const deployJob = workflow.jobs.deploy
    const checkoutStep = buildJob?.steps?.find(step => step.uses === 'actions/checkout@v6')
    const configureStep = buildJob?.steps?.find(step => step.uses === 'actions/configure-pages@v5')
    const downloadStep = buildJob?.steps?.find(step => step.uses === 'actions/download-artifact@v6')
    const uploadStep = buildJob?.steps?.find(step => step.uses === 'actions/upload-pages-artifact@v4')

    expect(workflow.on).toHaveProperty('workflow_run')
    expect(buildJob?.if).toContain('conclusion != \'cancelled\'')
    expect(buildJob?.if).toContain('head_branch == \'main\'')
    expect(buildJob?.if).toContain('head_repository.full_name == github.repository')
    expect(buildJob?.permissions).toEqual({ actions: 'read', contents: 'read', pages: 'write' })
    expect(checkoutStep?.with?.ref).toBe(workflowHeadShaExpression)
    expect(configureStep?.with?.enablement).toBe(true)
    expect(downloadStep?.with?.['github-token']).toBe('$' + '{{ github.token }}')
    expect(downloadStep?.with?.repository).toBe('$' + '{{ github.repository }}')
    expect(downloadStep?.with?.['run-id']).toBe(workflowRunIdExpression)
    expect(downloadStep?.with?.pattern).toBe('template-gallery-shard-*')
    expect(downloadStep?.with?.path).toBe('$' + '{{ env.MATRIX_ARTIFACTS_DIR }}')
    expect(uploadStep).toBeDefined()
    expect(deployJob?.needs).toBe('build')
    expect(deployJob?.permissions).toEqual({ 'id-token': 'write', 'pages': 'write' })
    expect(deployJob?.steps?.some(step => step.uses === 'actions/deploy-pages@v5')).toBe(true)
  })
})

async function readWorkflow(fileName: string): Promise<Workflow> {
  return parse(await fs.readFile(path.join(workflowDir, fileName), 'utf-8')) as Workflow
}
