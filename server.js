const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 5600;

app.use((req, res, next) => {
    if (req.url.endsWith(".js")) {
        res.header("Content-Type", "text/javascript");
    }
    next();
});

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/getJsonFile", (req, res) => {
    const folder = req.query.folder;
    const file = req.query.file;
    const filePath = path.join(__dirname, folder, file);

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Error reading JSON file." });
            return;
        }

        try {
            const parsedData = JSON.parse(data);
            res.json(parsedData);
        } catch (parseError) {
            console.error(parseError);
            res.status(500).json({ error: "Error parsing JSON data." });
        }
    });
});

app.get("/api/getJsonFiles", (req, res) => {
    const folder = req.query.folder;
    const folderPath = path.join(__dirname, folder);

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Error reading folder." });
            return;
        }

        const jsonFiles = files.filter(file => file.endsWith(".json"));
        res.json(jsonFiles);
    });
});

app.get("/api/searchFileInDestination", (req, res) => {
    const folder = req.query.folder;
    const file = req.query.file;
    const filePath = path.join(__dirname, folder, file);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(err);
            res.json({ found: false, alert: "File not found in Destination folder." });
        } else {
            fs.readFile(filePath, "utf8", (readErr, data) => {
                if (readErr) {
                    console.error(readErr);
                    res.status(500).json({ error: "Error reading file." });
                } else {
                    res.json({ found: true, filePath, fileContents: data });
                }
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
