const fs = require('fs-extra')
const generateRoutes = require('./generateRoutes')

module.exports = async (service, filename = null) => {
  const files = {
    'routes.js': () => generateRoutes(service.routerData),
    'plugins.js': () => 'export default []',
    'config.js': () => generateConfig(service),
    'icons.js': () => generateIcons(service),
    'now.js': () => `export default ${Date.now()}`
  }

  const outputFile = async filename => {
    const content = await files[filename](service)
    await fs.outputFile(`${service.config.tmpDir}/${filename}`, content)
  }

  if (filename) {
    await outputFile(filename)
  } else {
    await fs.remove(service.config.tmpDir)

    for (const filename in files) {
      await outputFile(filename)
    }
  }
}

function generateConfig ({ config }) {
  const { version } = require('../../package.json')
  const { siteUrl, siteName, titleTemplate } = config

  return `export default ${JSON.stringify({
    siteUrl,
    siteName,
    titleTemplate,
    version
  }, null, 2)}`
}

async function generateIcons ({ config, resolve, queue }) {
  const { touchicon, favicon } = config.icon

  const touchicons = await queue.add(resolve(touchicon.src), {
    sizes: touchicon.sizes,
    srcset: false
  })

  const favicons = await queue.add(resolve(favicon.src), {
    sizes: favicon.sizes,
    srcset: false
  })

  return `export default ${JSON.stringify({
    precomposed: touchicon.precomposed,
    touchicons: touchicons.sets,
    favicons: favicons.sets
  })}`
}
