import * as core from '@actions/core'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'

import { Octokit } from '@octokit/rest'
import { Endpoints } from '@octokit/types'

import cp from 'child_process'
import os from 'os'
import path from 'path'
import { v4 as uuidV4 } from 'uuid'

type Release = Endpoints['GET /repos/{owner}/{repo}/releases/latest']['response']

const [owner, repo] = ['at-wat', 'gh-pr-comment']

let osPlat: string = os.platform()
if (osPlat === 'win32') {
  osPlat = 'windows'
}
let osArch: string = os.arch()
if (osArch === 'x64') {
  osArch = 'amd64'
}

const regexPlatArch = new RegExp(
  `^gh-pr-comment_[0-9]+\\.[0-9]+\\.[0-9]+_${osPlat}_${osArch}\\.(tar\\.gz|zip)$`,
)

const version: string = core.getInput('version')
const token: string = core.getInput('token')

const octokit = new Octokit({ auth: token })

const install = async (release: Release) => {
  let asset: typeof release.data.assets[0] | undefined
  let checksum: typeof release.data.assets[0] | undefined
  let signature: typeof release.data.assets[0] | undefined

  release.data.assets.forEach(a => {
    if (a.name.match(regexPlatArch)) {
      asset = a
      return
    }
    switch (a.name) {
      case 'checksums.txt':
        checksum = a
        break
      case 'checksums.txt.sig':
        signature = a
        break
    }
  })
  if (!asset) {
    core.setFailed(`gh-pr-comment not found for ${osPlat} ${osArch}`)
    return
  }
  if (!checksum || !signature) {
    core.setFailed('checksum not found')
    return
  }

  const archivePath = await tc.downloadTool(asset.browser_download_url)
  const checksumPath = await tc.downloadTool(checksum.browser_download_url)
  const signaturePath = await tc.downloadTool(signature.browser_download_url)

  const tempDirectory = path.join(process.env['RUNNER_TEMP'] || '', uuidV4())
  await io.mkdirP(tempDirectory)
  await io.cp(archivePath, path.join(tempDirectory, asset.name))

  try {
    const tempGpgDirectory = path.join(tempDirectory, '.gnupg')
    await io.mkdirP(tempGpgDirectory)

    const pubKeyPath = path.join(__dirname, '..', 'at-wat.gpg')
    cp.execSync(
      `gpg --homedir "${tempGpgDirectory}" --fingerprint --import ${pubKeyPath}`,
    )
    cp.execSync(
      `gpg --homedir "${tempGpgDirectory}" --verify "${signaturePath}" "${checksumPath}"`,
    )
    cp.execSync(`sha256sum --check "${checksumPath}" --ignore-missing`, {
      cwd: tempDirectory,
    })
  } catch (error) {
    core.setFailed(error.toString())
    return
  } finally {
    await io.rmRF(tempDirectory)
  }

  let extPath: string
  switch (osPlat) {
    case 'win32':
      extPath = await tc.extractZip(archivePath)
      break
    default:
      extPath = await tc.extractTar(archivePath)
      break
  }
  core.addPath(extPath)
}

if (version === 'latest') {
  octokit.rest.repos
    .getLatestRelease({
      owner,
      repo,
    })
    .then(install)
} else {
  octokit.rest.repos
    .getReleaseByTag({
      owner,
      repo,
      tag: version,
    })
    .then(install)
}
