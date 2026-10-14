# surajitdb.github.io

Personal academic and portfolio website of Dr Surajit Deb Barma, served by GitHub Pages at https://surajitdb.github.io/.

The site is plain HTML, CSS and a little JavaScript, with no build step. Edit or upload a file on GitHub, commit, and the site updates within a minute or two.

## Add or replace your CV (no coding needed)

1. Save your CV as a PDF and rename it to exactly **`cv.pdf`** (all lower case).
2. Open https://github.com/surajitdb/surajitdb.github.io.
3. Click **Add file**, then **Upload files**, and drag `cv.pdf` into the page.
4. Click **Commit changes**.

A **Download CV (PDF)** button then appears on the home page and the CV page. To update it later, upload a new file with the same name; GitHub replaces the old one. To remove it, open `cv.pdf` on GitHub, click the three-dot menu and choose **Delete file**. The button disappears again.

## Add your photo

Upload a square photo named exactly **`photo.jpg`** in the same way. It replaces the "SDB" monogram on the home page. About 600 × 600 pixels is plenty.

## Files

| File | Page |
|---|---|
| `index.html` | About: bio, research themes, the uncertainty figure, selected publications, current projects, contact |
| `publications.html` | Full publication list with type filters |
| `projects.html` | Projects with problem, approach and status |
| `teaching.html` | Courses, supervision and teaching approach |
| `cv.html` | Career timeline, awards, skills |
| `assets/style.css` | All styling, including light and dark colour themes |
| `assets/site.js` | Contour background, CV and photo detection, copy button, publication filters |

## Common edits

- **Add a publication:** copy an existing `<li class="pub" …>` block in `publications.html`, paste it under the right year and edit the title, authors, venue and DOI. Set `data-type` to `journal`, `conference`, `chapter` or `preprint`, and update the counts on the filter buttons, in the intro, and on `index.html` and `cv.html`. Wrap your own name in `<span class="me">…</span>`.
- **Change a project's status:** edit the text inside `<span class="status">…</span>` in `projects.html`, and on `index.html` if the project is featured there.
- **Link code:** add `<dt>Code</dt><dd><a href="https://github.com/surajitdb/REPO">github.com/surajitdb/REPO</a></dd>` inside a project's `<dl class="pab">`.
- **Update the date:** change "Last updated" in each page footer.
