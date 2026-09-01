const fs = require('fs');
const path = require('path');

const notesDirectory = path.join(__dirname, 'notes');
const notesIndexPath = path.join(__dirname, 'notes.json');

function extractFrontMatter(markdown, fileName) {
    const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);

    if (!match) {
        throw new Error(`${fileName} is missing YAML front matter`);
    }

    const frontMatter = {};
    match[1].split(/\r?\n/).forEach(line => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) return;

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
        frontMatter[key] = value;
    });

    if (!frontMatter.date || !frontMatter.title) {
        throw new Error(`${fileName} must define date and title in its front matter`);
    }

    return {
        date: frontMatter.date,
        title: frontMatter.title,
        file: `notes/${fileName}`
    };
}

function generateNotesIndex() {
    const files = fs.readdirSync(notesDirectory)
        .filter(fileName => fileName.toLowerCase().endsWith('.md'));

    const notes = files
        .map(fileName => {
            const filePath = path.join(notesDirectory, fileName);
            const markdown = fs.readFileSync(filePath, 'utf8');
            return extractFrontMatter(markdown, fileName);
        })
        .sort((firstNote, secondNote) => secondNote.date.localeCompare(firstNote.date));

    fs.writeFileSync(notesIndexPath, `${JSON.stringify(notes, null, 2)}\n`, 'utf8');
    console.log(`Generated notes.json with ${notes.length} note${notes.length === 1 ? '' : 's'}.`);
}

try {
    generateNotesIndex();
} catch (error) {
    console.error(`Unable to generate notes.json: ${error.message}`);
    process.exitCode = 1;
}