const fs = require('fs');

const docsPath = 'frontend/src/pages/Docs.tsx';
let docsContent = fs.readFileSync(docsPath, 'utf8');
docsContent = docsContent.replace(
  /    return cache;\n  \}, \[articles\]\);/,
  '    return cache;\n  }, []);'
);
fs.writeFileSync(docsPath, docsContent);

const blogPath = 'frontend/src/pages/Blog.tsx';
let blogContent = fs.readFileSync(blogPath, 'utf8');
blogContent = blogContent.replace(
  /    return cache;\n  \}, \[fieldNotes\]\);/,
  '    return cache;\n  }, []);'
);
fs.writeFileSync(blogPath, blogContent);
