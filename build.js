#!/usr/bin/env node

const fs = require('fs')

require("esbuild").build({
    logLevel: "info",
    entryPoints: ["./src/index.js"],
    outfile: "./dist/last.min.js",
    bundle: true,
    watch: {
        onRebuild: () => {
            console.log("Rebuilt")
            fs.copyFile("./dist/last.min.js", "./docs/last.min.js", (err) => {
                if (err) throw err
            })
        }

    },


}).catch(() => {
    process.exit(1)
})
