#!/usr/bin/env node

const fs = require('fs')
const http = require('http')
const spawn = require('child_process').spawn

const clients = []

function build_and_reload() {
    // Build standard version
    require("esbuild").build({
        logLevel: "info",
        entryPoints: ["./src/index.js"],
        outfile: "./dist/last.js",
        bundle: true,
    }).then(() => {
        console.log("copy dist to docs")
        fs.copyFile("./dist/last.js", "./docs/last.js", () => {})
    }).then(() => {
        reload_server()
    }).catch(() => {
        process.exit(1)
    })

    // Build minified version
    require("esbuild").build({
        logLevel: "info",
        entryPoints: ["./src/index.js"],
        outfile: "./dist/last.min.js",
        bundle: true,
        minify: true,
    }).catch(() => {
        process.exit(1)
    })
}

function reload_server() {
    console.log("reload_server")
    clients.forEach((res) => res.write("data: update\n\n"))
    clients.length = 0
}

require('esbuild').serve({ servedir: "./docs", port: 8000, host: "127.0.0.1" }, {}).then(() => {
    http.createServer((req, res) => {
        const { url, method, headers } = req
        if (url === "/esbuild") return clients.push(res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
            "Connection": "keep-alive",
        }))

        const path = ~url.split("/").pop().indexOf(".") ? url : `/index.html`
        req.pipe(
            http.request(
                { hostname: "127.0.0.1", port: 8000, path, method, headers },
                (prxRes) => {
                    if (url === "/last.min.js") {
                        const jsReloadCode = ' (() => new EventSource("/esbuild").onmessage = () => location.reload())();'
                        const newHeaders = {
                            ...prxRes.headers,
                            "content-length": parseInt(prxRes.headers["content-length"], 10) + jsReloadCode.length,
                        }
                        res.writeHead(prxRes.statusCode, newHeaders)
                        res.write(jsReloadCode)
                    } else {
                        res.writeHead(prxRes.statusCode, prxRes.headers)
                    }
                    prxRes.pipe(res, { end: true })
                }
            ),
            { end: true }
        )
    }).listen(8080)

    //open the default browser only if it is not opened yet
    setTimeout(() => {
        const open_command = {
            darwin: ["open"],
            linux: ["xdg-open"],
            win32: ["cmd", "/c", "start"],
        };
        const ptf = process.platform
        if (clients.length === 0)
            spawn(open_command[ptf][0], [...[open_command[ptf].slice(1)], `http://localhost:8080`])
    }, 1000)
})


fs.watch("./src", (_, filename) => {
    console.log("CHANGE detected in " + filename)
    build_and_reload()
})

fs.watch("./docs/index.html", (filename) => {
    console.log("CHANGE detected in " + filename)
    build_and_reload()
})

build_and_reload()
