'use strict'

const fs = require('fs')

const raw = fs.readFileSync('./package.json', { encoding: 'utf8' })

const packageContent = JSON.parse(raw)

packageContent.version =
  process.env.NEW_PACKAGE_VERSION || packageContent.version

console.log(`New ${packageContent.name} version: ${packageContent.version}`)

fs.writeFileSync('./package.json', JSON.stringify(packageContent, undefined, 2))
