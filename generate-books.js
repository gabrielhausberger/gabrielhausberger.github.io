const fs = require('fs');
const path = require('path');

const booksDirectory = path.join(__dirname, 'books');
const booksIndexPath = path.join(__dirname, 'books.json');

function extractBook(markdown, fileName) {
    const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);

    if (!match) {
        throw new Error(`${fileName} is missing YAML front matter`);
    }

    const frontMatter = {};
    match[1].split(/\r?\n/).forEach(line => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) return;

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^("|')(.*)\1$/, '$2');
        frontMatter[key] = value;
    });

    if (!frontMatter.title) {
        throw new Error(`${fileName} must define a title in its front matter`);
    }

    return {
        title: frontMatter.title,
        file: `books/${fileName}`
    };
}

function generateBooksIndex() {
    const files = fs.readdirSync(booksDirectory)
        .filter(fileName => fileName.toLowerCase().endsWith('.md'));

    const books = files
        .map(fileName => {
            const filePath = path.join(booksDirectory, fileName);
            const markdown = fs.readFileSync(filePath, 'utf8');
            return extractBook(markdown, fileName);
        })
        .sort((firstBook, secondBook) => firstBook.title.localeCompare(secondBook.title));

    fs.writeFileSync(booksIndexPath, `${JSON.stringify(books, null, 2)}\n`, 'utf8');
    console.log(`Generated books.json with ${books.length} book${books.length === 1 ? '' : 's'}.`);
}

try {
    generateBooksIndex();
} catch (error) {
    console.error(`Unable to generate books.json: ${error.message}`);
    process.exitCode = 1;
}