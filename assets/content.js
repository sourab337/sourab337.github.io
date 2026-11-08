// Builds the Volunteer and Blog pages from files in the repository, so new
// photos and posts only need to be uploaded to GitHub.
(function () {
    const TREE_URL = 'https://api.github.com/repos/sourab337/sourab337.github.io/git/trees/main?recursive=1';
    const CACHE_KEY = 'portfolio-content-tree';
    const CACHE_MS = 5 * 60 * 1000;
    const IMAGE = /\.(jpe?g|png|webp|gif)$/i;
    const POST = /^(\d{4})-(\d{2})-(\d{2})[ _-]+(.+)\.txt$/i;
    const CAMERA_NAME = /^(img|dsc|pxl|photo|image|screenshot|whatsapp|\d)/i;

    const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function readCache() {
        try {
            return JSON.parse(sessionStorage.getItem(CACHE_KEY));
        } catch (error) {
            return null;
        }
    }

    function writeCache(paths) {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), paths }));
        } catch (error) {
            // The page still works without the cache.
        }
    }

    async function loadPaths() {
        const cached = readCache();
        if (cached && Date.now() - cached.time < CACHE_MS) return cached.paths;

        try {
            const response = await fetch(TREE_URL);
            if (!response.ok) throw new Error('GitHub responded ' + response.status);
            const data = await response.json();
            const paths = data.tree.filter((item) => item.type === 'blob').map((item) => item.path);
            writeCache(paths);
            return paths;
        } catch (error) {
            if (cached) return cached.paths;
            throw error;
        }
    }

    async function fetchText(path) {
        const response = await fetch(encodePath(path));
        if (!response.ok) throw new Error('Could not load ' + path);
        return response.text();
    }

    async function renderVolunteer(container, paths) {
        const groups = new Map();
        paths.forEach((path) => {
            const parts = path.split('/');
            if (parts.length !== 3 || parts[0] !== 'volunteer' || !IMAGE.test(parts[2])) return;
            if (!groups.has(parts[1])) groups.set(parts[1], []);
            groups.get(parts[1]).push(path);
        });

        container.replaceChildren();
        if (!groups.size) {
            container.append(element('p', 'content-status', 'Photos will appear here soon.'));
            return;
        }

        const names = [...groups.keys()].sort((a, b) => a.localeCompare(b));
        for (const name of names) {
            const section = element('div', 'volunteer-group');
            section.append(element('h3', '', name));

            const aboutPath = 'volunteer/' + name + '/about.txt';
            if (paths.includes(aboutPath)) {
                try {
                    section.append(element('p', 'post-body', (await fetchText(aboutPath)).trim()));
                } catch (error) {
                    // The photos are still useful without the description.
                }
            }

            const grid = element('div', 'photo-grid');
            groups.get(name).sort((a, b) => a.localeCompare(b)).forEach((path) => {
                const fileName = path.split('/').pop().replace(IMAGE, '');
                const caption = CAMERA_NAME.test(fileName) ? '' : fileName.replace(/_/g, ' ');

                const figure = element('figure', 'photo');
                const link = element('a');
                link.href = encodePath(path);
                link.target = '_blank';
                link.rel = 'noopener';

                const image = element('img');
                image.src = encodePath(path);
                image.alt = caption || name;
                image.loading = 'lazy';
                link.append(image);
                figure.append(link);
                if (caption) figure.append(element('figcaption', '', caption));
                grid.append(figure);
            });
            section.append(grid);
            container.append(section);
        }
    }

    async function renderBlog(container, paths) {
        const posts = paths
            .filter((path) => path.startsWith('blog/') && path.split('/').length === 2 && POST.test(path.slice(5)))
            .sort()
            .reverse();

        container.replaceChildren();
        if (!posts.length) {
            container.append(element('p', 'content-status', 'New writing will appear here.'));
            return;
        }

        const articles = await Promise.all(posts.map(async (path) => {
            const match = path.slice(5).match(POST);
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            const article = element('article', 'blog-post');
            article.append(element('h3', 'card-title', match[4].replace(/_/g, ' ')));
            article.append(element('div', 'card-subtitle', date.toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            })));
            try {
                (await fetchText(path)).trim().split(/\r?\n\s*\r?\n/).forEach((paragraph) => {
                    article.append(element('p', 'post-body', paragraph));
                });
            } catch (error) {
                article.append(element('p', 'content-status', 'This post is still being published. Please check back in a minute.'));
            }
            return article;
        }));
        container.append(...articles);
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const volunteer = document.getElementById('volunteer-content');
        const blog = document.getElementById('blog-content');
        const container = volunteer || blog;
        if (!container) return;

        try {
            const paths = await loadPaths();
            await (volunteer ? renderVolunteer(volunteer, paths) : renderBlog(blog, paths));
        } catch (error) {
            container.replaceChildren(element('p', 'content-status', 'This content could not be loaded right now. Please try again in a little while.'));
        }
    });
})();
