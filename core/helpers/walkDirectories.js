const path = require("path");
async function* walk(dir, extensions) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {
      yield* walk(entry);
    } else if (d.isFile() && extensions.includes(path.extname(d.name).slice(1))) {
      yield entry;
    }
  }
}

module.exports = walk;
